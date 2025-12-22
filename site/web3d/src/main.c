#include "web3d.h"

#define FRAME_W 360
#define FRAME_H 200

#define MAP_W 30
#define MAP_H 30

#define FOV 1.1f
#define WALL_HEIGHT 300
#define HITBOX_SIZE 0.9f

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
static uint8_t frame[FRAME_W * FRAME_H][4];

// Keyboard state.
static bool key_up[KEY_MAX];
static bool key_down[KEY_MAX];
static bool key_held[KEY_MAX];

// Player state.
static float player_x = MAP_W * 0.5f;
static float player_y = MAP_H * 0.5f;
static float player_angle;

// Smoothed player state.
static float player_angle_smooth;
static float player_x_smooth = MAP_W * 0.5f;
static float player_y_smooth = MAP_H * 0.5f;

static const uint8_t image_wall[] = {
    #embed "../assets/wall.gif"
};

typedef struct {
    int w, h;
    uint8_t pixels[][4];
} Texture;

static Texture* texture_wall;

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
    float dx = abs(1 / bx), tx = sx ? dx * ((sx > 0) - sx * fract(ax)) : 1e6f;
    float dy = abs(1 / by), ty = sy ? dy * ((sy > 0) - sy * fract(ay)) : 1e6f;
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

// Sample a texture using normalized texture coordinates (u, v).
static const uint8_t* sample(const Texture* texture, float u, float v)
{
    int x = texture->w * fract(u);
    int y = texture->h * fract(v);
    return texture->pixels[x + y * texture->w];
}

static void* malloc(size_t size)
{
    const size_t alignment = 16;
    static char buffer[1 << 14];
    static size_t position;
    void* result = buffer + position;
    position = (position + size + alignment - 1) & -alignment;
    return result;
}

Texture* load_texture(const void* gif_data)
{
    int w = gif_get_width(gif_data);
    int h = gif_get_height(gif_data);
    Texture* tex = malloc(sizeof(Texture) + w * h * sizeof(*tex->pixels));
    tex->w = w;
    tex->h = h;
    gif_get_pixels(gif_data, (uint8_t*) tex->pixels);
    return tex;
}

// Initialize the game.
__attribute__((export_name("init")))
void init(unsigned int rng)
{
    // Load textures.
    texture_wall = load_texture(image_wall);

    // Generate a random map.
    for (int y = 0; y < MAP_H; y++)
    for (int x = 0; x < MAP_W; x++) {
        map[x + y * MAP_W] = rng % 100 < 10 ? '#' : ' ';
        rng = rng * 1103515245u + 12345u;
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
    float vx = cosf(player_angle_smooth);
    float vy = sinf(player_angle_smooth);
    float x0 = player_x_smooth + vx + vy * FOV;
    float y0 = player_y_smooth + vy - vx * FOV;
    float x1 = player_x_smooth + vx - vy * FOV;
    float y1 = player_y_smooth + vy + vx * FOV;
    for (int x = 0; x < FRAME_W; x++) {
        float t = (float) x / (FRAME_W - 1);
        float dx = lerp(x0, x1, t) - player_x_smooth;
        float dy = lerp(y0, y1, t) - player_y_smooth;
        float depth = raycast(player_x_smooth, player_y_smooth, dx, dy);
        float hit_x = player_x_smooth + depth * dx;
        float hit_y = player_y_smooth + depth * dy;
        int y0 = FRAME_H / 2 - WALL_HEIGHT / depth;
        int y1 = FRAME_H / 2 + WALL_HEIGHT / depth;
        for (int y = 0; y < FRAME_H; y++) {
            float shade = depth;
            float u, v;
            if (y0 <= y && y <= y1) {
                float xedge = abs(fract(hit_x) - 0.5f);
                float yedge = abs(fract(hit_y) - 0.5f);
                u = fract(xedge < yedge ? hit_x : hit_y);
                v = fract(4.0f * (y - y0) / (y1 - y0));
            } else {
                if (y < FRAME_H / 2) {
                    shade = -300 / ((float) (y - FRAME_H / 2));
                    u = fract(player_x_smooth * 0.1f + shade * dx);
                    v = fract(player_y_smooth * 0.1f + shade * dy);
                    shade *= 10.0f;
                } else {
                    shade = WALL_HEIGHT / ((float) (y - FRAME_H / 2));
                    u = fract(player_x_smooth + shade * dx);
                    v = fract(player_y_smooth + shade * dy);
                }
            }
            shade = max(0.0f, min(1.0f, 2.0f / (shade + 1.0f) + 0.1f));
            float noise = dither(x, y);
            const uint8_t* texel = sample(texture_wall, u, v);
            uint8_t* color = frame[x + y * FRAME_W];
            color[0] = lerp(190, texel[0], shade) + noise;
            color[1] = lerp(220, texel[1], shade) + noise;
            color[2] = lerp(240, texel[2], shade) + noise;
            color[3] = 255;
        }
    }

    // Reset keyboard state.
    memset(key_down, 0, sizeof(key_down));
    memset(key_up, 0, sizeof(key_up));

    // Return the finished frame so that it can be presented to the canvas.
    return frame;
}
