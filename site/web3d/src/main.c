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
static const uint8_t image_strawberry[] = {
    #embed "../assets/strawberry.gif"
};

typedef struct {
    uint32_t w, h; // Width and height.
    uint8_t* glyph_width; // Only used for text rendering.
    uint32_t pixels[]; // RGBA pixel data.
} Texture;

static Texture* texture_ground;
static Texture* texture_wall;
static Texture* texture_strawberry;
static Texture* font_tiny;
static Texture* font_big;

static char map[MAP_W * MAP_H];

// Check if a map tile is a wall. Coordinates outside of the map are treated as
// walls.
static bool is_wall(int x, int y)
{
    return x < 0 || x >= MAP_W
        || y < 0 || y >= MAP_H
        || map[x + y * MAP_W] == '#';
}

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
        case 'W': return KEY_FORWARD;
        case 'S': return KEY_BACK;
        case 'A': return KEY_LEFT;
        case 'D': return KEY_RIGHT;
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
    int x = tex->w * u - 0.5f;
    int y = tex->h * v - 0.5f;
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
    int w = gif_get_width(gif_data);
    int h = gif_get_height(gif_data);
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
    texture_strawberry = texture_load(image_strawberry, false);
    font_tiny = texture_load(image_font_tiny, true);
    font_big = texture_load(image_font_big, true);

    // Generate a random map.
    for (int y = 0; y < MAP_H; y++)
    for (int x = 0; x < MAP_W; x++) {
        map[x + y * MAP_W] = rng % 100 < 5 ? '#' : ' ';
        rng = rng * 1103515245u + 12345u;
    }
}

// Apply fog to a color.
static uint32_t apply_fog(uint32_t color, float amount, int x, int y)
{
    amount = 1.0f - max(0.0f, min(1.0f, 3.0f / (amount + 3.0f)));
    amount += dither(x, y) * 4.0f / 255.0f;
    uint32_t r = min(255.0f, lerp((color >>  0) & 0xff, 255, amount));
    uint32_t g = min(255.0f, lerp((color >>  8) & 0xff, 255, amount));
    uint32_t b = min(255.0f, lerp((color >> 16) & 0xff, 255, amount));
    return (r << 0) | (g << 8) | (b << 16) | (0xff << 24);
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
    float vx = cosf(player_angle_smooth);
    float vy = sinf(player_angle_smooth);
    for (int x = 0; x < FRAME_W; x++) {

        // Determine the direction vector for the ray.
        float t = (float) x / (FRAME_W - 1) * 2.0f - 1.0f;
        float dx = vx - vy * FOV * t;
        float dy = vy + vx * FOV * t;

        // Raycast against walls.
        const float depth = raycast(player_x_smooth, player_y_smooth, dx, dy);
        const float horizon = FRAME_H * 0.5f;
        int y0 = horizon - WALL_HEIGHT / depth;
        int y1 = horizon + WALL_HEIGHT / depth;
        for (int y = 0; y < FRAME_H; y++) {
            float shade = depth;
            float u, v;

            // Walls.
            const Texture* texture = texture_wall;
            if (y0 <= y && y <= y1) {
                float hit_x = player_x_smooth + depth * dx;
                float hit_y = player_y_smooth + depth * dy;
                float edge_distance_x = abs(fract(hit_x) - 0.5f);
                float edge_distance_y = abs(fract(hit_y) - 0.5f);
                u = fract(edge_distance_x < edge_distance_y ? hit_x : hit_y);
                v = fract(4.0f * (y - y0) / (y1 - y0));

            // Sky.
            } else if (y < horizon) {
                shade = -300 / (y - horizon);
                u = fract(player_x_smooth * 0.1f + shade * dx);
                v = fract(player_y_smooth * 0.1f + shade * dy);
                shade *= 10.0f;

            // Ground.
            } else {
                shade = WALL_HEIGHT / (y - horizon);
                u = fract(player_x_smooth + shade * dx);
                v = fract(player_y_smooth + shade * dy);
                texture = texture_ground;
            }
            uint32_t texel = texture_sample(texture, u, v);
            float fog = shade + max(0.0f, 4.0f * min(1.0f, (y - y1) / (float) (y1 - y0)));

            // Strawberry sprite.
            {
                // Find the intersection with the sprite billboard.
                const float sprite_x = MAP_W / 2 + 0.5f;
                const float sprite_y = MAP_H / 2 + 0.5f;
                const float px = sprite_x - player_x_smooth;
                const float py = sprite_y - player_y_smooth;
                const float scale = -1.0f / (dx * vx + dy * vy);
                const float t = scale * (-px * vx - py * vy);
                const float s = scale * (+px * dy - py * dx);
                const float y0 = horizon - 100 / t;
                const float y1 = horizon + 100 / t;
                if (0.0f < t && t < depth) {

                    // Draw the shadow.
                    float ht = (float) WALL_HEIGHT / (y - horizon);
                    float hx = ht * dx - px;
                    float hy = ht * dy - py;
                    if (hx * hx + hy * hy < 0.2f)
                        fog = t;

                    // Draw the sprite itself.
                    float u = 0.5f - s;
                    float v = (y - y0) / (y1 - y0);
                    uint32_t texel2 = texture_sample(texture_strawberry, u, v);
                    if (texel2) {
                        texel = texel2;
                        fog = t;
                    }
                }
            }

            // Apply fog to the final pixel.
            frame[x + y * FRAME_W] = apply_fog(texel, fog, x, y);
        }
    }

    // Draw some test text.
    const char* text = "42";
    int x = 23;
    int y = 181;
    texture_print(font_big, x + 1, y + 1, 0xff000000, text);
    texture_print(font_big, x + 0, y + 0, 0xffffffff, text);
    texture_draw(texture_strawberry, 5, 180);

    // Reset keyboard state.
    memset(key_down, 0, sizeof(key_down));
    memset(key_up, 0, sizeof(key_up));

    // Return the finished frame so that it can be presented to the canvas.
    return frame;
}
