typedef __UINT8_TYPE__ uint8_t;
typedef __UINT16_TYPE__ uint16_t; typedef __UINT32_TYPE__ uint32_t;
typedef __SIZE_TYPE__ size_t;

#define FRAME_W 360
#define FRAME_H 200

#define MAP_W 15
#define MAP_H 15

#define FOV 1.6f // Horizontal FOV in radians.
#define WALL_HEIGHT 300

#define TAU 6.28318530718

// Functions that map directly to builtins.
#define abs(...) __builtin_fabsf(__VA_ARGS__)
#define floor(...) __builtin_floorf(__VA_ARGS__)
#define memset(...) __builtin_memset(__VA_ARGS__)

static float min(float x, float y)
{
    return x < y ? x : y;
}

static float max(float x, float y)
{
    return x > y ? x : y;
}

enum {
    KEY_UNKNOWN,
    KEY_FORWARD,
    KEY_BACK,
    KEY_LEFT,
    KEY_RIGHT,
    KEY_STRAFE_LEFT,
    KEY_STRAFE_RIGHT,
    KEY_MAX
};

typedef struct {
    uint8_t r, g, b, a;
} Color;

// Frame buffer.
static Color frame[FRAME_W * FRAME_H];

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

static const uint8_t texture_wall[] = {
    #embed "wall.bmp"
};

static const char map[MAP_W * MAP_H] = {
    "###############"
    "#  #          #"
    "#  #    #######"
    "#  #          #"
    "#  #          #"
    "#             #"
    "#             #"
    "#####       ###"
    "#  #          #"
    "#  #    #######"
    "#  #          #"
    "#  #          #"
    "#       #     #"
    "#       #     #"
    "###############"
};

// Check if a map tile is solid.
static bool is_solid(int x, int y)
{
    return x < 0 || x >= MAP_W
        || y < 0 || y >= MAP_H
        || map[x + y * MAP_W] == '#';
}

static float fract(float x)
{
    return x - floor(x);
}

static float sin(float t)
{
    float x = fract(t / TAU - 0.5f);
    float y = x + x - 1.0f;
    return 4.0f * (y - y * abs(y));
}

static float cos(float t)
{
    float x = fract(t / TAU - 0.25f);
    float y = x + x - 1.0f;
    return 4.0f * (y - y * abs(y));
}

/*
static float atan(float x)
{
    const float a0 = +0.998418889819911f;
    const float a1 = -2.9993501171084700e-01f;
    const float a2 = +0.0869142852883849f;
    return ((a2 * (x * x) + a1) * (x * x) + a0) * (x * x);
}

static float tan(float x)
{
    const float a = 2.4674011002723397f;
    const float b = 2.471688400562703f;
    const float c = 0.189759681063053f;
    return x * (b - c * x * x) / (a - x * x);
}

static float radians(float degrees)
{
    return degrees * (TAU / 360.0f);
}

static float sqrt(float number)
{
    union {float f; uint32_t i;} u = {number};
    u.i = 0x1fbb4000 + (u.i >> 1);
    u.f = 0.5f * (u.f + number / u.f);
    u.f = 0.5f * (u.f + number / u.f);
    return u.f;
}
*/

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
        if (is_solid(ix, iy))
            return min(tx, ty);
        tx += dx * axis;
        ty += dy * !axis;
    }
}

// Map a KeyboardEvent keyCode number to an input key.
static int key_index(int keycode)
{
    switch (keycode) {
        case 87: return KEY_FORWARD;
        case 83: return KEY_BACK;
        case 65: return KEY_LEFT;
        case 68: return KEY_RIGHT;
        case 81: return KEY_STRAFE_LEFT;
        case 69: return KEY_STRAFE_RIGHT;
        default: return KEY_UNKNOWN;
    }
}

// Handle a `keyup` event from the browser side.
__attribute__((export_name("keyup")))
void keyup(int keycode)
{
    int index = key_index(keycode);
    key_up[index] = true;
    key_held[index] = false;
}

// Handle a `keydown` event from the browser side.
__attribute__((export_name("keydown")))
void keydown(int keycode)
{
    int index = key_index(keycode);
    key_down[index] = true;
    key_held[index] = true;
}

static float exp2(float x)
{
    float a = fract(x);
    float b = x + 121.2740575f + 27.7280233f / (4.84252568f - a);
    union { unsigned int i; float f; } u = {0x1p23f * (b - 1.49012907f * a)};
    return u.f;
}

static float smooth(float source, float target, float dt)
{
    return (target + (source - target) * exp2(-10.0f * dt));
}

static int clamp(int value, int min, int max)
{
    return value < min ? min : (value > max ? max : value);
}

// Dithering function (pattern used: Interleaved Gradient Noise).
static float dither(int x, int y)
{
    return fract(52.9829189f * fract(0.06711056f * x + 0.00583715f * y));
}

// Read a 16-bit little-endian integer from an array of bytes.
static uint16_t read_uint16(const uint8_t* b)
{
    return (b[0] << 0) | (b[1] << 8);
}

// Read a 32-bit little-endian integer from an array of bytes.
static uint32_t read_uint32(const uint8_t* b)
{
    return (b[0] << 0) | (b[1] << 8) | (b[2] << 16) | (b[3] << 24);
}

// Sample a BMP image using normalized texture coordinates (u, v).
static Color sample(const uint8_t* bmp, float u, float v)
{
    int bpp = read_uint16(bmp + 28);
    int offset = read_uint32(bmp + 10);
    int w = read_uint32(bmp + 18), x = fract(u) * w;
    int h = read_uint32(bmp + 22), y = fract(v) * h;
    int row_size = (bpp * w + 31) / 32 * 4;
    int shift = x * bpp & 7, mask = (1 << bpp) - 1;
    int pixel = (bmp[offset + y * row_size + x * bpp / 8] >> shift) & mask;
    const uint8_t* color = bmp + 54 + 4 * pixel;
    return (Color) {color[2], color[1], color[0], 0xff};
}

// Render the next frame of the game.
__attribute__((export_name("draw")))
Color* draw(double timestamp)
{
    // Measure time delta since the previous frame.
    static double prev_timestamp;
    float dt = (timestamp - prev_timestamp) / 1000.0;
    prev_timestamp = timestamp;

    // Handle player movement.
    const float rotate_speed = 3.0f * dt;
    const float run_speed = dt * 10.0f;
    float run_f = key_held[KEY_FORWARD] - key_held[KEY_BACK];
    float run_s = key_held[KEY_STRAFE_RIGHT] - key_held[KEY_STRAFE_LEFT];
    player_angle += rotate_speed * (key_held[KEY_RIGHT] - key_held[KEY_LEFT]);
    player_x += run_speed * (run_f * cos(player_angle) - run_s * sin(player_angle));
    player_y += run_speed * (run_f * sin(player_angle) + run_s * cos(player_angle));

    // Do collision detection.
    if (is_solid(player_x - 1, player_y)) player_x = max(player_x, floor(player_x) + 0.5f);
    if (is_solid(player_x + 1, player_y)) player_x = min(player_x, floor(player_x) + 0.5f);
    if (is_solid(player_x, player_y - 1)) player_y = max(player_y, floor(player_y) + 0.5f);
    if (is_solid(player_x, player_y + 1)) player_y = min(player_y, floor(player_y) + 0.5f);

    // Smooth out player movement.
    player_angle_smooth = smooth(player_angle_smooth, player_angle, dt);
    player_x_smooth = smooth(player_x_smooth, player_x, dt);
    player_y_smooth = smooth(player_y_smooth, player_y, dt);

    // Render the frame.
    for (int x = 0; x < FRAME_W; x++) {
        float angle = player_angle_smooth + ((float) x / (FRAME_W - 1) * 2.0f - 1.0f) * FOV * 0.5f;
        float dx = cos(angle);
        float dy = sin(angle);
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
                float height = y < FRAME_H / 2 ? -800 : WALL_HEIGHT;
                shade = height / ((float) (y - FRAME_H / 2));
                u = fract(player_x_smooth + shade * dx);
                v = fract(player_y_smooth + shade * dy);
            }
            shade = max(0.0f, min(1.0f, 1.0f / (shade + 1.5f)));
            float noise = dither(x, y);
            Color color = sample(texture_wall, u, v);
            color.r = clamp(color.r * shade + (1.0f - shade) * 200 + noise, 0, 255);
            color.g = clamp(color.g * shade + (1.0f - shade) * 190 + noise, 0, 255);
            color.b = clamp(color.b * shade + (1.0f - shade) * 220 + noise, 0, 255);
            frame[x + y * FRAME_W] = color;
        }
    }

    // Reset keyboard state.
    memset(key_down, 0, sizeof(key_down));
    memset(key_up, 0, sizeof(key_up));

    // Return the finished frame so that it can be presented to the canvas.
    return frame;
}
