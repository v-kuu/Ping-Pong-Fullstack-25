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

// Tile map.
static char map[MAP_W * MAP_H];

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

// Shake effect when collecting a gem.
static float score_shake;

// Textures.
typedef struct {
    uint16_t w, h;  // Size of the texture.
    uint16_t pitch; // Texels per row.
    void* data;     // GIF file data (before load) or texel data (after load).
} Texture;

// Gems.
#define GEM_TYPES 14
#define MAX_GEMS 100
typedef struct {
    Texture* tex;   // Texture to use for drawing.
    uint32_t color; // Gem color (used for particle effect).
    float x, y;     // Map position.
    float phase;    // Random animation phase.
} Gem;
static Gem gem_array[MAX_GEMS];
static int gem_count = MAX_GEMS;

// Particles.
#define MAX_PARTICLES 100
typedef struct {
    float x, y, z;      // Position (z = height).
    float vx, vy, vz;   // Velocity.
    float lifespan;     // How long the particle should live.
    float counter;      // How long the particle has existed.
    float size;         // Size of the particle.
    uint32_t color;     // Drawing color.
} Particle;
static Particle particle_array[MAX_PARTICLES];
static int particle_count;

static Texture texture_floor = { .data = (uint8_t[]) {
    #embed "../assets/floor.gif"
}};
static Texture texture_wall = { .data = (uint8_t[]) {
    #embed "../assets/wall.gif"
}};
static Texture texture_apple = { .data = (uint8_t[]) {
    #embed "../assets/apple.gif"
}};
static Texture texture_gems = { .data = (uint8_t[]) {
    #embed "../assets/gems.gif"
}};
static Texture texture_gem[GEM_TYPES];

// Fonts.
typedef struct {
    uint16_t w, h;                      // Size of the font texture.
    uint16_t width[FONT_GLYPH_COUNT];   // Per-glyph width.
    void* data;                         // GIF or texel data (same as Texture).
} Font;

static Font font_tiny = { .data = (uint8_t[]) {
    #embed "../assets/font_tiny.gif"
}};
static Font font_big = { .data = (uint8_t[]) {
    #embed "../assets/font_big.gif"
}};

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
    uint32_t* pixels = (uint32_t*) tex->data;
    return x < tex->w && y < tex->h ? pixels[x + y * tex->pitch] : 0;
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
void font_load(Font* font)
{
    // Load the GIF image.
    font->w = gif_get_image_w(font->data);
    font->h = gif_get_image_h(font->data);
    uint32_t* pixels = malloc(font->w * font->h * sizeof(*pixels));
    font->data = gif_get_pixels(font->data, pixels);

    const int glyph_w = font->w / FONT_GLYPHS_PER_ROW;
    const int glyph_h = font->h / FONT_GLYPHS_PER_COL;
    for (int i = 0; i < FONT_GLYPH_COUNT; i++) {
        int glyph_x = i % FONT_GLYPHS_PER_ROW * glyph_w;
        int glyph_y = i / FONT_GLYPHS_PER_ROW * glyph_h;
        for (int y = glyph_y; y < glyph_y + glyph_h; y++)
        for (int x = glyph_x; x < glyph_x + glyph_w; x++)
            if (pixels[x + y * font->w])
                font->width[i] = max(font->width[i], x - glyph_x + 1);
    }
}

// Load a texture from a GIF file.
void texture_load(Texture* tex)
{
    tex->w = gif_get_image_w(tex->data);
    tex->h = gif_get_image_h(tex->data);
    tex->data = gif_get_pixels(tex->data, malloc(tex->w * tex->h * 4));
    tex->pitch = tex->w;
}

// Create a texture from a sub-region of an existing texture.
void texture_sub(Texture* tex, Texture* src, int x, int y, int w, int h)
{
    tex->w = w;
    tex->h = h;
    tex->data = (uint32_t*) src->data + x + y * src->pitch;
    tex->pitch = src->pitch;
}

void texture_draw(Texture* tex, int x, int y)
{
    uint32_t* pixels = tex->data;
    const int x0 = max(0, min(x, FRAME_W));
    const int y0 = max(0, min(y, FRAME_H));
    const int x1 = min(x0 + tex->w, FRAME_W);
    const int y1 = min(y0 + tex->h, FRAME_H);
    for (int y = y0; y < y1; y++)
    for (int x = x0; x < x1; x++) {
        uint32_t texel = pixels[(x - x0) + (y - y0) * tex->pitch];
        if (texel)
            frame[x + y * FRAME_W] = texel;
    }
}

void font_draw_glyph(Font* font, int dx, int dy, int x, int y, int w, int h, uint32_t color)
{
    uint32_t* pixels = (uint32_t*) font->data + x + y * font->w;
    const int x0 = max(0, min(dx, FRAME_W));
    const int y0 = max(0, min(dy, FRAME_H));
    const int x1 = min(x0 + w, FRAME_W);
    const int y1 = min(y0 + h, FRAME_H);
    for (int y = y0; y < y1; y++)
    for (int x = x0; x < x1; x++) {
        uint32_t texel = pixels[(x - x0) + (y - y0) * font->w];
        if (texel)
            frame[x + y * FRAME_W] = texel & color;
    }
}

void font_draw(Font* font, int x, int y, uint32_t color, const char* string)
{
    const int rect_w = font->w / FONT_GLYPHS_PER_ROW;
    const int rect_h = font->h / FONT_GLYPHS_PER_COL;
    while (*string != '\0') {
        int glyph = *string++ - FONT_GLYPH_MIN;
        if (glyph < 0 || glyph >= FONT_GLYPH_COUNT)
            glyph = '?' - FONT_GLYPH_MIN;
        int glyph_x = glyph % FONT_GLYPHS_PER_ROW * rect_w;
        int glyph_y = glyph / FONT_GLYPHS_PER_ROW * rect_h;
        int glyph_w = font->width[glyph];
        int glyph_h = rect_h;
        if (glyph)
            font_draw_glyph(font, x, y, glyph_x, glyph_y, glyph_w, glyph_h, color);
        x += glyph_w + 1;
    }
}

#define RAND_FLOAT(state, min, max) (RNG(state) * 0x1p-32f * ((max) - (min)) + (min));

static uint32_t average_color(Texture* tex)
{
    uint32_t r = 0;
    uint32_t g = 0;
    uint32_t b = 0;
    uint8_t (*pixels)[4] = tex->data;
    for (int y = 0; y < tex->h; y++)
    for (int x = 0; x < tex->w; x++) {
        uint8_t* pixel = pixels[x + y * tex->pitch];
        if (pixel[0] + pixel[1] + pixel[2]) {
            r += pixel[0];
            g += pixel[1];
            b += pixel[2];
        }
    }
    r /= tex->w * tex->h;
    g /= tex->w * tex->h;
    b /= tex->w * tex->h;
    return r | (g << 8) | (b << 16) | (0xff << 24);
}

// Initialize the game.
__attribute__((export_name("init")))
void init(unsigned int rng)
{
    // Load assets.
    texture_load(&texture_floor);
    texture_load(&texture_wall);
    texture_load(&texture_apple);
    texture_load(&texture_gems);
    font_load(&font_tiny);
    font_load(&font_big);
    for (int i = 0; i < GEM_TYPES; i++)
        texture_sub(&texture_gem[i], &texture_gems, i * 16, 0, 16, 16);

    // Generate a random map.
    for (int y = 0; y < MAP_H; y++)
    for (int x = 0; x < MAP_W; x++) {
        map[x + y * MAP_W] = rng % 100 < 3 ? '#' : ' ';
        rng = rng * 1103515245u + 12345u;
    }

    // Place gems on the map.
    for (int i = 0; i < gem_count; i++) {
        Gem* gem = &gem_array[i];
        gem->x = RAND_FLOAT(rng, 0.5f, MAP_W - 0.5f);
        gem->y = RAND_FLOAT(rng, 0.5f, MAP_W - 0.5f);
        gem->tex = &texture_gem[RNG(rng) % GEM_TYPES];
        gem->phase = RAND_FLOAT(rng, 0.0f, TAU);
        gem->color = average_color(gem->tex);
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
    int x;          // Frame x position.
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
        col->color[y] = texture_sample(&texture_wall, u, v);
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
        col->color[y] = texture_sample(&texture_floor, u, v);
        col->light[y] = t;
        col->depth[y] = t;
    }
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
        col->color[y] = texture_sample(&texture_wall, u, v);
        col->light[y] = depth;
        col->depth[y] = depth;
    }

    // Draw shadows.
    for (int y = y1_clamped; y < FRAME_H; y++)
        col->light[y] += max(0.0f, 4.0f * min(1.0f, (y - y1) / (y1 - y0)));
}

static void draw_sprite(Column* col, float sx, float sy, float w, float h, Texture* tex)
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

    const float y0 = FRAME_H * 0.5f + 0.5f + (WALL_HEIGHT - (h + w) * 160) / t;
    const float y1 = FRAME_H * 0.5f + 0.5f + (WALL_HEIGHT - (h + 0) * 160) / t;
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
            uint32_t color = texture_sample(tex, u, v);
            if (color) {
                col->color[y] = color;
                col->depth[y] = t;
                col->light[y] = t;
            }
        }
    }
}

static char* number_to_string(char* buffer, unsigned int value)
{
    if (value >= 10)
        buffer = number_to_string(buffer, value / 10);
    buffer[0] = '0' + value % 10;
    buffer[1] = '\0';
    return buffer + 1;
}

// TODO: Dither per frame.
static void spawn_particles(float x, float y, uint32_t color)
{
    for (int i = 0; i < 30; i++) {
        if (particle_count < MAX_PARTICLES) {
            Particle* particle = &particle_array[particle_count++];
            particle->x = x + random_float(-0.3f, +0.3f);
            particle->y = y + random_float(-0.3f, +0.3f);
            particle->z = 1.5f + random_float(-0.3f, +0.3f);
            particle->vx = random_float(-1.0f, +1.0f);
            particle->vy = random_float(-1.0f, +1.0f);
            particle->vz = random_float(+2.0f, +3.0f);
            particle->lifespan = random_float(0.1f, 0.3f);
            particle->counter = 0.0f;
            particle->size = random_float(0.1f, 0.4f);
            int brighten = random_int(0, 200);
            uint32_t r = min(255, ((color >>  0) & 0xff) + brighten + random_int(-25, 25));
            uint32_t g = min(255, ((color >>  8) & 0xff) + brighten + random_int(-25, 25));
            uint32_t b = min(255, ((color >> 16) & 0xff) + brighten + random_int(-25, 25));
            particle->color = r | (g << 8) | (b << 16) | (0xff << 24);
        }
    }
}

static void update_particles(float dt)
{
    // Update each particle's state.
    for (int i = 0; i < particle_count; i++) {
        Particle* particle = &particle_array[i];
        particle->x += particle->vx * dt;
        particle->y += particle->vy * dt;
        particle->z += particle->vz * dt;
        particle->vz -= 15.0f * dt;

        // Destroy the particle when its lifetime runs out.
        if (particle->z < 0.0f || (particle->counter += dt) > particle->lifespan)
            particle_array[i--] = particle_array[--particle_count];
    }
}

static void draw_particles(Column* col)
{
    for (int i = 0; i < particle_count; i++) {

        // Find the intersection with the particle billboard.
        Particle* particle = &particle_array[i];
        const float w = particle->size * (1.0f - particle->counter / particle->lifespan * 0.8f);
        const float px = particle->x - col->px;
        const float py = particle->y - col->py;
        const float scale = -1.0f / (col->dx * col->vx + col->dy * col->vy);
        const float t = scale * (-px * col->vx - py * col->vy);
        const float s = scale * (+px * col->dy - py * col->dx) / w;
        if (t < 0.0f)
            continue; // No intersection.

        const float y0 = FRAME_H * 0.5f + 0.5f + (WALL_HEIGHT - (particle->z + w) * 160) / t;
        const float y1 = FRAME_H * 0.5f + 0.5f + (WALL_HEIGHT - (particle->z + 0) * 160) / t;
        const int y0_clamped = max(0, min(y0, FRAME_H));
        const int y1_clamped = max(0, min(y1, FRAME_H));

        // Draw the sprite itself.
        if (-0.5f < s && s < 0.5f) {
            for (int y = y0_clamped; y < y1_clamped; y++) {
                if (t > col->depth[y])
                    continue;
                float v = (y - y0 + 1.0f) / (y1 - y0) - 0.5f;
                if (s * s + v * v < 0.25f && dither(col->x, y) > particle->counter / particle->lifespan * 2.0f - 1.0f) {
                    col->color[y] = particle->color;
                    col->depth[y] = t;
                    col->light[y] = t;
                }
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
    const float rotate_speed = 2.5f * dt;
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

    // Collect gems when touching them.
#define PLAYER_REACH 1.0f
    for (int i = 0; i < gem_count; i++) {
        Gem* gem = &gem_array[i];
        float dx = player_x - gem->x;
        float dy = player_y - gem->y;
        if (dx * dx + dy * dy < PLAYER_REACH * PLAYER_REACH) {
            spawn_particles(gem->x, gem->y, gem->color);
            score_shake = 0.2f;
            gem_array[i--] = gem_array[--gem_count];
        }
    }

    // Smooth out player movement.
    player_angle_smooth = smooth(player_angle_smooth, player_angle, 20.0f * dt);
    player_x_smooth = smooth(player_x_smooth, player_x, 10.0f * dt);
    player_y_smooth = smooth(player_y_smooth, player_y, 10.0f * dt);

    // Update particle effects.
    update_particles(dt);

    // Render the frame.
    Column col;
    col.vx = cosf(player_angle_smooth);
    col.vy = sinf(player_angle_smooth);
    for (int x = 0; x < FRAME_W; x++) {

        // Determine the direction vector for the ray.
        float t = (float) x / (FRAME_W - 1) * 2.0f - 1.0f;
        col.x = x;
        col.px = player_x_smooth;
        col.py = player_y_smooth;
        col.dx = col.vx - col.vy * FOV * t;
        col.dy = col.vy + col.vx * FOV * t;

        draw_sky(&col);
        draw_floor(&col);
        draw_walls(&col);

        // Draw gems.
        for (int i = 0; i < gem_count; i++) {
            Gem* gem = &gem_array[i];
            float h = 1.0f + sinf(timestamp * 0.002f + gem->phase) * 0.1f;
            draw_sprite(&col, gem->x, gem->y, 1, h, gem->tex);
        }

        // Draw particles.
        draw_particles(&col);

        // Write out the pixels for this column.
        for (int y = 0; y < FRAME_H; y++)
            frame[x + y * FRAME_W] = apply_fog(col.color[y], col.light[y], x, y);
    }

    // Draw the gem count.
    char text[100] = {0};
    char* next = number_to_string(text, MAX_GEMS - gem_count);
    int x = 23;
    int y = 182 + 10.0f * score_shake * sinf(timestamp * 0.08f);
    score_shake = max(0.0f, score_shake - dt);
    font_draw(&font_big, x + 1, y + 1, 0xff000000, text);
    font_draw(&font_big, x + 0, y + 0, 0xffffffff, text);
    texture_draw(&texture_gem[1], 5, 180);

    // Draw a timer.
    static double elapsed;
    elapsed += dt;
    int cents = floor(elapsed * 100.0);
    text[0] = '0' + cents / 1000 % 10;
    text[1] = '0' + cents /  100 % 10;
    text[2] = ':';
    text[3] = '0' + cents /   10 % 10;
    text[4] = '0' + cents /    1 % 10;
    text[5] = '\0';
    x = FRAME_W - 40;
    y = 182;
    font_draw(&font_big, x + 1, y + 1, 0xff000000, text);
    font_draw(&font_big, x + 0, y + 0, 0xffffffff, text);

    // Reset keyboard state.
    memset(key_down, 0, sizeof(key_down));
    memset(key_up, 0, sizeof(key_up));

    // Return the finished frame so that it can be presented to the canvas.
    return frame;
}
