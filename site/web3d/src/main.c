#include "web3d.h"

#define FRAME_W 360
#define FRAME_H 200

#define MAP_W 29
#define MAP_H 29

#define FOV 1.1f
#define WALL_HEIGHT 300
#define HITBOX_SIZE 0.9f

#define FONT_GLYPH_MIN ' '
#define FONT_GLYPH_MAX '~'
#define FONT_GLYPH_COUNT (FONT_GLYPH_MAX - FONT_GLYPH_MIN + 1)
#define FONT_GLYPHS_PER_ROW 16
#define FONT_GLYPHS_PER_COL 6

enum {
    KEY_FORWARD,
    KEY_BACK,
    KEY_LEFT,
    KEY_RIGHT,
    KEY_LSTRAFE,
    KEY_RSTRAFE,
    KEY_MAX
};

// Frame buffer.
static uint32_t frame[FRAME_W * FRAME_H];

// Keyboard state.
static bool key_up[KEY_MAX];
static bool key_down[KEY_MAX];
static bool key_held[KEY_MAX];

// Player state.
static float player_x = 0.5f;
static float player_y = 0.5f;
static float player_angle;

// Smoothed player state.
static float player_angle_smooth;
static float player_x_smooth = 0.5f;
static float player_y_smooth = 0.5f;

// Embedded asset image files.
static const uint8_t image_ground[] = {
    #embed "../assets/ground.gif"
};
static const uint8_t image_wall[] = {
    #embed "../assets/wall.gif"
};
static const uint8_t image_font_tiny[] = {
    #embed "../assets/font_tiny.gif"
};
static const uint8_t image_font_big[] = {
    #embed "../assets/font_big.gif"
};
static const uint8_t image_apple[] = {
    #embed "../assets/apple.gif"
};

typedef struct {
    uint32_t w, h; // Width and height.
    uint8_t* glyph_width; // Only used for text rendering.
    uint32_t pixels[]; // RGBA pixel data.
} Texture;

static Texture* texture_ground;
static Texture* texture_wall;
static Texture* texture_apple;
static Texture* font_tiny;
static Texture* font_big;

static char map[MAP_W * MAP_H];

static bool is_out_of_bounds(int x, int y)
{
    return x < 0 || x >= MAP_W || y < 0 || y >= MAP_H;
}

// Check if a map tile is a wall. Coordinates outside of the map are treated as
// walls.
static bool is_wall(int x, int y)
{
    return is_out_of_bounds(x, y) || map[x + y * MAP_W] == '#';
}

#define RNG(state) ((state) = (state) * 1103515245u + 12345u)

static float raycast(float ax, float ay, float bx, float by)
{
    int ix = ax, sx = (bx > 0.0f) - (bx < 0.0f);
    int iy = ay, sy = (by > 0.0f) - (by < 0.0f);
    float dx = abs(1 / bx), tx = dx * ((sx > 0) - sx * fract(ax));
    float dy = abs(1 / by), ty = dy * ((sy > 0) - sy * fract(ay));
    for (;;) {
        int axis = !sy || tx < ty;
        ix += sx * axis;
        iy += sy * !axis;
        if (is_wall(ix, iy))
            return min(tx, ty);
        tx += dx * axis;
        ty += dy * !axis;
    }
}

// Map a KeyboardEvent keyCode number to an input key.
static unsigned int key_index(int keycode)
{
    switch (keycode) {
        case 'W': case 38: return KEY_FORWARD;
        case 'S': case 40: return KEY_BACK;
        case 'A': case 37: return KEY_LEFT;
        case 'D': case 39: return KEY_RIGHT;
        case 'Q': return KEY_LSTRAFE;
        case 'E': return KEY_RSTRAFE;
        default: return KEY_MAX;
    }
}

// Handle a `keyup` event from the browser side.
__attribute__((export_name("keyup")))
void keyup(int keycode)
{
    unsigned int index = key_index(keycode);
    if (index < KEY_MAX) {
        key_up[index] = true;
        key_held[index] = false;
    }
}

// Handle a `keydown` event from the browser side.
__attribute__((export_name("keydown")))
void keydown(int keycode)
{
    int index = key_index(keycode);
    if (index < KEY_MAX) {
        key_down[index] = true;
        key_held[index] = true;
    }
}

// Very stupid and simple arena allocator.
static void* malloc(size_t size)
{
    const size_t alignment = 16;
    static char buffer[1 << 16];
    static size_t position;
    void* result = buffer + position;
    position = (position + size + alignment - 1) & -alignment;
    return result;
}

// Sample a texture using unnormalized texture coordinates (x, y).
static uint32_t texture_fetch(const Texture* tex, size_t x, size_t y)
{
    return x < tex->w && y < tex->h ? tex->pixels[x + y * tex->w] : 0;
}

// Sample a texture using normalized texture coordinates (u, v).
static uint32_t texture_sample(const Texture* tex, float u, float v)
{
    int x = floor(tex->w * u);
    int y = floor(tex->h * v);
    return texture_fetch(tex, x, y);
}

// Initialize the `glyph_width` array for a font texture. Any opaque pixel
// within a glyph's rectangle counts toward the glyph's visible width.
static void init_glyph_widths(Texture* tex)
{
    const int glyph_w = tex->w / FONT_GLYPHS_PER_ROW;
    const int glyph_h = tex->h / FONT_GLYPHS_PER_COL;
    for (int i = 0; i < FONT_GLYPH_COUNT; i++) {
        int glyph_x = i % FONT_GLYPHS_PER_ROW * glyph_w;
        int glyph_y = i / FONT_GLYPHS_PER_ROW * glyph_h;
        for (int y = glyph_y; y < glyph_y + glyph_h; y++)
        for (int x = glyph_x; x < glyph_x + glyph_w; x++)
            if (tex->pixels[x + y * tex->w])
                tex->glyph_width[i] = max(tex->glyph_width[i], x - glyph_x + 1);
    }
}

// Load a texture (or font) from a GIF file.
Texture* texture_load(const void* gif_data, bool font)
{
    int w = gif_get_image_w(gif_data);
    int h = gif_get_image_h(gif_data);
    size_t size = w * h * sizeof(uint32_t) + FONT_GLYPH_COUNT * font;
    Texture* tex = malloc(sizeof(Texture) + size);
    tex->glyph_width = (uint8_t*) (tex->pixels + w * h);
    tex->w = w;
    tex->h = h;
    gif_get_pixels(gif_data, (uint8_t*) tex->pixels);
    if (font)
        init_glyph_widths(tex);
    return tex;
}

// Draw a subregion of a texture with destination coordinates (x, y), source
// coordinates (sx, sy) and size (w, h).
void texture_draw_sub(Texture* tex, int x, int y, int sx, int sy, int w, int h, uint32_t color)
{
    const int dx = min(max(x, 0), FRAME_W);
    const int dy = min(max(y, 0), FRAME_H);
    sx += dx - x;
    sy += dy - y;
    w -= dx - x;
    h -= dy - y;
    w = min(w, FRAME_W - (sx + w));
    h = min(h, FRAME_H - (sy + h));
    for (int y = 0; y < h; y++)
    for (int x = 0; x < w; x++) {
        uint32_t* dst = &frame[(x + dx) + (y + dy) * FRAME_W];
        uint32_t src = tex->pixels[(x + sx) + (y + sy) * tex->w];
        if (src >> 24)
            *dst = src & color;
    }
}

// Draw an entire texture at coordinates (x, y).
void texture_draw(Texture* tex, int x, int y)
{
    texture_draw_sub(tex, x, y, 0, 0, tex->w, tex->h, ~0u);
}

// Print a string using a font texture at coordinates (x, y).
void texture_print(Texture* tex, int x, int y, uint32_t color, const char* string)
{
    const int rect_w = tex->w / FONT_GLYPHS_PER_ROW;
    const int rect_h = tex->h / FONT_GLYPHS_PER_COL;
    while (*string != '\0') {
        int glyph = *string++ - FONT_GLYPH_MIN;
        if (glyph < 0 || glyph >= FONT_GLYPH_COUNT)
            glyph = '?' - FONT_GLYPH_MIN;
        int glyph_x = glyph % FONT_GLYPHS_PER_ROW * rect_w;
        int glyph_y = glyph / FONT_GLYPHS_PER_ROW * rect_h;
        int glyph_w = tex->glyph_width[glyph];
        int glyph_h = rect_h;
        if (glyph)
            texture_draw_sub(tex, x, y, glyph_x, glyph_y, glyph_w, glyph_h, color);
        x += glyph_w + 1;
    }
}

// Measure the width of a string of text.
int measure_text(Texture* tex, const char* string)
{
    int width = 0;
    while (*string != '\0') {
        int glyph = *string++ - FONT_GLYPH_MIN;
        if (glyph < 0 || glyph >= FONT_GLYPH_COUNT)
            glyph = '?' - FONT_GLYPH_MIN;
        width += tex->glyph_width[glyph] + 1;
    }
    return max(width - 1, 0);
}

// Initialize the game.
__attribute__((export_name("init")))
void init(unsigned int rng)
{
    // Load assets.
    texture_ground = texture_load(image_ground, false);
    texture_wall = texture_load(image_wall, false);
    texture_apple = texture_load(image_apple, false);
    font_tiny = texture_load(image_font_tiny, true);
    font_big = texture_load(image_font_big, true);

    // Generate a random map.
    for (int y = 0; y < MAP_H; y++)
    for (int x = 0; x < MAP_W; x++) {
        map[x + y * MAP_W] = rng % 100 < 3 ? '#' : ' ';
        rng = rng * 1103515245u + 12345u;
    }
}

// Apply fog to a color.
static uint32_t apply_fog(uint32_t color, float amount, int x, int y)
{
    amount = 1.0f - max(0.0f, min(1.0f, 9.0f / (amount + 9.0f)));
    amount += dither(x, y) * 4.0f / 255.0f;
    uint32_t r = min(255.0f, lerp((color >>  0) & 0xff, 255, amount));
    uint32_t g = min(255.0f, lerp((color >>  8) & 0xff, 205, amount));
    uint32_t b = min(255.0f, lerp((color >> 16) & 0xff, 185, amount));
    return (r << 0) | (g << 8) | (b << 16) | (0xff << 24);
}

typedef struct {
    float vx, vy; // View direction.
    float px, py; // Ray origin.
    float dx, dy; // Ray direction.
    uint32_t color[FRAME_H]; // Color of each pixel in the column.
    float light[FRAME_H]; // Light received by each pixel in the column.
    float depth[FRAME_H]; // Depth buffer.
} Column;

static void draw_sky(Column* col)
{
    for (int y = 0; y < FRAME_H / 2; y++) {
        float t = -500 / (y - FRAME_H * 0.5);
        float u = fract(0.1f * col->px + t * col->dx);
        float v = fract(0.1f * col->py + t * col->dy);
        col->color[y] = texture_sample(texture_wall, u, v);
        col->light[y] = t * 10.0f;
        col->depth[y] = t * 10.0f;
    }
}

static void draw_floor(Column* col)
{
    for (int y = FRAME_H / 2; y < FRAME_H; y++) {
        float t = WALL_HEIGHT / (y - FRAME_H * 0.5f);
        float u = fract(col->px + col->dx * t);
        float v = fract(col->py + col->dy * t);
        col->color[y] = texture_sample(texture_ground, u, v);
        col->light[y] = t;
        col->depth[y] = t;
    }
}

static uint32_t blend(uint32_t x, uint32_t y, float t)
{
    uint32_t r = lerp((x >>  0) & 0xff, (y >>  0) & 0xff, t);
    uint32_t g = lerp((x >>  8) & 0xff, (y >>  8) & 0xff, t);
    uint32_t b = lerp((x >> 16) & 0xff, (y >> 16) & 0xff, t);
    return (r << 0) | (g << 8) | (b << 16) | (0xff << 24);
}

static void draw_walls(Column* col)
{
    // Raycast against the map.
    const float depth = raycast(col->px, col->py, col->dx, col->dy);
    const float y0 = FRAME_H * 0.5f + 0.5f - WALL_HEIGHT / depth;
    const float y1 = FRAME_H * 0.5f + 0.5f + WALL_HEIGHT / depth;
    const int y0_clamped = max(0, min(y0, FRAME_H));
    const int y1_clamped = max(0, min(y1, FRAME_H));

    // Draw walls.
    for (int y = y0_clamped; y < y1_clamped; y++) {
        float hit_x = col->px + col->dx * depth;
        float hit_y = col->py + col->dy * depth;
        float edge_x = abs(fract(hit_x) - 0.5f);
        float edge_y = abs(fract(hit_y) - 0.5f);
        float u = fract(edge_x < edge_y ? hit_x : hit_y);
        float v = fract(4.0f * (y - y0) / (y1 - y0));
        col->color[y] = texture_sample(texture_wall, u, v);
        col->light[y] = depth;
        col->depth[y] = depth;
    }

    // Draw shadows.
    for (int y = y1_clamped; y < FRAME_H; y++)
        col->light[y] += max(0.0f, 4.0f * min(1.0f, (y - y1) / (y1 - y0)));
}

static void draw_sprite(Column* col, float sx, float sy, float w, float h)
{
    const float shadow_scale = 0.8f;

    // Find the intersection with the sprite billboard.
    const float px = sx - col->px;
    const float py = sy - col->py;
    const float scale = -1.0f / (col->dx * col->vx + col->dy * col->vy);
    const float t = scale * (-px * col->vx - py * col->vy);
    const float s = scale * (+px * col->dy - py * col->dx) / w;
    if (t < 0.0f)
        return;

    const float y0 = FRAME_H * 0.5f + 0.5f + (WALL_HEIGHT - (h + w) * 150) / t;
    const float y1 = FRAME_H * 0.5f + 0.5f + (WALL_HEIGHT - (h + 0) * 150) / t;
    const int y0_clamped = max(0, min(y0, FRAME_H));
    const int y1_clamped = max(0, min(y1, FRAME_H));

    // Draw the shadow.
    const float radius = w * shadow_scale * 0.5f;
    if (-0.707f * shadow_scale < s && s < 0.707f * shadow_scale) {
        for (int y = 0; y < FRAME_H; y++) {
            float hit_t = WALL_HEIGHT / (y - FRAME_H * 0.5f);
            if (hit_t > col->depth[y])
                continue;
            float hit_x = hit_t * col->dx - px;
            float hit_y = hit_t * col->dy - py;
            if (hit_x * hit_x + hit_y * hit_y < radius * radius)
                col->light[y] = t;
        }
    }

    // Draw the sprite itself.
    if (-0.5f < s && s < 0.5f) {
        for (int y = y0_clamped; y < y1_clamped; y++) {
            if (t > col->depth[y])
                continue;
            float u = 0.5f - s;
            float v = (y - y0 + 1.0f) / (y1 - y0);
            uint32_t color = texture_sample(texture_apple, u, v);
            if (color) {
                col->color[y] = color;
                col->depth[y] = t;
                col->light[y] = t;
            }
        }
    }
}

// Render the next frame of the game.
__attribute__((export_name("draw")))
void* draw(double timestamp)
{
    // Measure time delta since the previous frame.
    static double prev_timestamp;
    float dt = (timestamp - prev_timestamp) / 1000.0;
    prev_timestamp = timestamp;

    // Handle player movement.
    const float rotate_speed = 3.0f * dt;
    const float run_speed = dt * 10.0f;
    float run_f = key_held[KEY_FORWARD] - key_held[KEY_BACK];
    float run_s = key_held[KEY_RSTRAFE] - key_held[KEY_LSTRAFE];
    if (run_f != 0.0f && run_s != 0.0f) {
        run_f *= __builtin_sqrtf(0.5f);
        run_s *= __builtin_sqrtf(0.5f);
    }
    player_angle += rotate_speed * (key_held[KEY_RIGHT] - key_held[KEY_LEFT]);
    player_x += run_speed * (run_f * cosf(player_angle) - run_s * sinf(player_angle));
    player_y += run_speed * (run_f * sinf(player_angle) + run_s * cosf(player_angle));

    // Do collision detection.
    const float half = HITBOX_SIZE * 0.5f;
    const int ix = floor(player_x);
    const int iy = floor(player_y);
    for (int ty = iy - 1; ty <= iy + 1; ty++)
    for (int tx = ix - 1; tx <= ix + 1; tx++) {
        float dx = tx + 0.5f - player_x;
        float dy = ty + 0.5f - player_y;
        if (abs(dx) < 0.5f + half && abs(dy) < 0.5f + half && is_wall(tx, ty)) {
            if (!is_wall(tx - sign(dx), ty) && abs(dx) > abs(dy))
                player_x = tx + (dx < 0.0f) - half * sign(dx);
            if (!is_wall(tx, ty - sign(dy)) && abs(dx) < abs(dy))
                player_y = ty + (dy < 0.0f) - half * sign(dy);
        }
    }

    // Smooth out player movement.
    player_angle_smooth = smooth(player_angle_smooth, player_angle, 10.0f * dt);
    player_x_smooth = smooth(player_x_smooth, player_x, 10.0f * dt);
    player_y_smooth = smooth(player_y_smooth, player_y, 10.0f * dt);

    // Render the frame.
    Column col;
    col.vx = cosf(player_angle_smooth);
    col.vy = sinf(player_angle_smooth);
    for (int x = 0; x < FRAME_W; x++) {

        // Determine the direction vector for the ray.
        float t = (float) x / (FRAME_W - 1) * 2.0f - 1.0f;
        col.px = player_x_smooth;
        col.py = player_y_smooth;
        col.dx = col.vx - col.vy * FOV * t;
        col.dy = col.vy + col.vx * FOV * t;

        draw_sky(&col);
        draw_floor(&col);
        draw_walls(&col);

#define RAND_FLOAT(state, min, max) (RNG(state) * 0x1p-32f * ((max) - (min)) + (min));

        unsigned int rng = 0;
        for (int i = 0; i < 50; i++) {
            float x = RAND_FLOAT(rng, 0.5f, MAP_W - 0.5f);
            float y = RAND_FLOAT(rng, 0.5f, MAP_W - 0.5f);
            float w = RAND_FLOAT(rng, 0.3f, 1.2f);
            float h = RAND_FLOAT(rng, 0.0f, 3.0f);
            float phase = timestamp * 0.002f + RAND_FLOAT(rng, 0.0f, TAU);
            h += sinf(phase) * 0.5f;
            draw_sprite(&col, x, y, w, h);
        }

        // Write out the pixels for this column.
        for (int y = 0; y < FRAME_H; y++)
            frame[x + y * FRAME_W] = apply_fog(col.color[y], col.light[y], x, y);
    }

    // Draw some test text.
    const char* text = "42";
    int x = 23;
    int y = 181;
    texture_print(font_big, x + 1, y + 1, 0xff000000, text);
    texture_print(font_big, x + 0, y + 0, 0xffffffff, text);
    texture_draw(texture_apple, 5, 180);

    // Reset keyboard state.
    memset(key_down, 0, sizeof(key_down));
    memset(key_up, 0, sizeof(key_up));

    // Return the finished frame so that it can be presented to the canvas.
    return frame;
}
