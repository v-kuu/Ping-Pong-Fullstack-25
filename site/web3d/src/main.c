#include "web3d.h"

// Dimensions of the frame buffer.
#define FRAME_W 360
#define FRAME_H 200

#define FOV 1.0f
#define WALL_HEIGHT 150

// Layout of font images.
#define FONT_GLYPH_MIN ' '
#define FONT_GLYPH_MAX '~'
#define FONT_GLYPH_COUNT (FONT_GLYPH_MAX - FONT_GLYPH_MIN + 1)
#define FONT_GLYPHS_PER_ROW 16
#define FONT_GLYPHS_PER_COL 6

// How close the player must get to a gem to collect it.
#define PLAYER_REACH 1.0f

// The physical size of the player when testing for wall collisions.
#define PLAYER_HITBOX_SIZE 0.5f

// How fast the player character moves.
#define PLAYER_RUN_SPEED 5.0
#define PLAYER_TURN_SPEED 2.5

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
static float player_x;
static float player_y;
static float player_angle;

// Smoothed player state.
static float player_angle_smooth;
static float player_x_smooth;
static float player_y_smooth;

// Player state.
#define MAX_PLAYERS 64
#define MAX_PLAYER_NAME 32
typedef struct {
    uint64_t gems;  // Bit mask of collected gems.
    uint32_t id;    // Unique ID.
    float x, y;     // Map position.
    float vx, vy;   // Visual position.
    float dx, dy;   // Direction vector.
    bool moving;    // True if player is in motion.
    bool active;    // False if player just spawned.
    uint64_t score; // Current score.
    char name[MAX_PLAYER_NAME]; // Display name.
} Player;
static Player players[MAX_PLAYERS];
static size_t player_count;   // Total number of players.
static uint32_t player_self;  // Player ID of the local player.
static uint32_t player_ghost; // Player ID of the current ghost.

// Shake effect when collecting a gem.
static float score_shake;

// Timer.
static double time_start;   // Timestamp of the first frame.
static double time_elapsed; // Total time since the start (in seconds).
static double time_round;   // Timestamp for the current/next round.
static double time_curr;
static double time_now;     // Timestamp for the current frame.
static float time_delta;    // Time delta since the last frame (in seconds).

// Textures.
typedef struct {
    uint16_t w, h;  // Size of the texture.
    uint16_t pitch; // Texels per row.
    uint32_t color; // Average color (used for particle effects).
    void* data;     // GIF file data (before load) or texel data (after load).
} Texture;

// Gems.
#define GEM_TYPES 14
#define MAX_GEMS 50
#define ALL_GEMS_COLLECTED ((1ull << MAX_GEMS) - 1)
typedef struct {
    Texture* tex;   // Texture to use for drawing.
    float x, y;     // Map position.
    float phase;    // Random animation phase.
} Gem;
static Gem gem_array[MAX_GEMS];
static uint64_t gem_mask;
static uint64_t next_gem_mask;

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
static Texture texture_gems = { .data = (uint8_t[]) {
    #embed "../assets/gems.gif"
}};
static Texture texture_barrier = { .data = (uint8_t[]) {
    #embed "../assets/barrier.gif"
}};
static Texture texture_ghost = { .data = (uint8_t[]) {
    #embed "../assets/ghost.gif"
}};
static Texture texture_guy_back = { .data = (uint8_t[]) {
    #embed "../assets/guy_back.gif"
}};
static Texture texture_guy_front = { .data = (uint8_t[]) {
    #embed "../assets/guy_front.gif"
}};
static Texture texture_guy_left = { .data = (uint8_t[]) {
    #embed "../assets/guy_left.gif"
}};
static Texture texture_guy_right = { .data = (uint8_t[]) {
    #embed "../assets/guy_right.gif"
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

// Check if a map tile is a wall. Coordinates outside of the map are treated as
// walls.
static bool is_wall(int x, int y)
{
    return map_get(x, y) > 0;
}

static float raycast(float ax, float ay, float bx, float by, float t)
{
    int ix = floor(ax), sx = (bx > 0.0f) - (bx < 0.0f);
    int iy = floor(ay), sy = (by > 0.0f) - (by < 0.0f);
    float dx = abs(1 / bx), tx = dx * ((sx > 0) - sx * fract(ax));
    float dy = abs(1 / by), ty = dy * ((sy > 0) - sy * fract(ay));
    for (int l = 0; l < 100; l++) {
        int axis = !sy || tx < ty;
        int px = ix, py = iy;
        ix += sx * axis;
        iy += sy * !axis;
        if (min(tx, ty) > t && (!map_inside(ix, iy) || (is_wall(ix, iy) != is_wall(px, py))))
            return min(tx, ty);
        tx += dx * axis;
        ty += dy * !axis;
    }
    return 1e9f;
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
    static char buffer[1 << 18];
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

// Get the average color of a texture, not counting transparent pixels.
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

int font_width(Font* font, const char* string)
{
    int width = 0;
    while (*string != '\0') {
        int glyph = *string++ - FONT_GLYPH_MIN;
        if (glyph < 0 || glyph >= FONT_GLYPH_COUNT)
            glyph = '?' - FONT_GLYPH_MIN;
        width += font->width[glyph] + 1;
    }
    return width - !width;
}

void respawn(void)
{
    // Place the player in a random room.
    int player_room = (random_int(0, MAP_ROOMS - 1) + player_self) % MAP_ROOMS;
    player_x = player_x_smooth = map_room_x(player_room) + 0.5f;
    player_y = player_y_smooth = map_room_y(player_room) + 0.5f;
}

#define MAX_MESSAGE_LENGTH 64 // How much text fits in a message.
#define MAX_MESSAGES 22 // How many messages fit on screen.
#define MESSAGE_DELAY 5 // How long before a message disappears.
typedef struct {
    double timestamp;
    char text[MAX_MESSAGE_LENGTH];
} Message;
static Message messages[MAX_MESSAGES];
static size_t message_index;

static void draw_messages(void)
{
    for (size_t i = 0; i < MAX_MESSAGES; i++) {
        size_t index = (message_index + MAX_MESSAGES - 1 - i) % MAX_MESSAGES;
        Message* message = &messages[index];
        if (time_now < message->timestamp + MESSAGE_DELAY * 1000.0) {
            int x = 5;
            int y = FRAME_H - 30 - 8 * i;
            font_draw(&font_tiny, x + 1, y + 1, 0xff000000, message->text);
            font_draw(&font_tiny, x + 0, y + 0, 0xffffffff, message->text);
        }
    }
}

static void push_message(char* text)
{
    Message* message = &messages[message_index++ % MAX_MESSAGES];
    message->timestamp = time_now;
    size_t length = 0;
    while (length < MAX_MESSAGE_LENGTH - 1 && *text)
        message->text[length++] = *text++;
    message->text[length] = '\0';
}

static void new_game(double timestamp)
{
    // Seed the random number generator and generate a random map.
    gem_mask = next_gem_mask;
    time_curr = timestamp;
    random_seed((uint64_t) timestamp);
    map_generate();

    // Mark the spawn points on the map, so that no gems are placed there.
    for (int i = 0; i < MAP_ROOMS; i++) {
        int x = map_room_x(i);
        int y = map_room_x(i);
        map_set(x, y, 'g');
    }

    // Place gems on unoccupied map tiles.
    for (int i = 0; i < MAX_GEMS;) {
        int x = random_int(0, MAP_W - 1);
        int y = random_int(0, MAP_H - 1);
        if (!is_wall(x, y)) {
            map_set(x, y, 'g'); // Mark this grid cell as occupied.
            Gem* gem = &gem_array[i++];
            gem->x = x + 0.5f;
            gem->y = y + 0.5f;
            gem->tex = &texture_gem[random_int(0, GEM_TYPES - 1)];
            gem->phase = random_float(0.0f, TAU);
        }
    }

    // Clear map tiles where gems were placed.
    for (int y = 0; y < MAP_H; y++)
    for (int x = 0; x < MAP_W; x++)
        if (map_get(x, y) == 'g')
            map_set(x, y, 0);

    // Respawn in a random room.
    respawn();
}

// Initialize the game.
__attribute__((export_name("init")))
void init(void)
{
    // Load assets.
    texture_load(&texture_floor);
    texture_load(&texture_wall);
    texture_load(&texture_gems);
    texture_load(&texture_barrier);
    texture_load(&texture_ghost);
    texture_load(&texture_guy_front);
    texture_load(&texture_guy_left);
    texture_load(&texture_guy_right);
    texture_load(&texture_guy_back);
    font_load(&font_tiny);
    font_load(&font_big);
    for (int i = 0; i < GEM_TYPES; i++) {
        texture_sub(&texture_gem[i], &texture_gems, i * 16, 0, 16, 16);
        texture_gem[i].color = average_color(&texture_gem[i]);
    }
}

// Apply fog to a color.
static uint32_t apply_fog(uint32_t color, float amount, int x, int y)
{
    amount = 1.0f - max(0.0f, min(1.0f, 9.0f / (amount + 9.0f)));
    amount += dither(x, y) * 4.0f / 255.0f;
    uint32_t r = min(255.0f, lerp((color >>  0) & 0xff, 255, amount));
    uint32_t g = min(255.0f, lerp((color >>  8) & 0xff, 215, amount));
    uint32_t b = min(255.0f, lerp((color >> 16) & 0xff, 185, amount));
    return (r << 0) | (g << 8) | (b << 16) | (0xff << 24);
}

typedef struct {
    int x;                   // Frame x position.
    float vx, vy;            // View direction.
    float px, py;            // Ray origin.
    float dx, dy;            // Ray direction.
    uint32_t color[FRAME_H]; // Color of each pixel in the column.
    float light[FRAME_H];    // Light received by each pixel in the column.
    float depth[FRAME_H];    // Depth of each pixel in the column.
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
        float hit_x = col->px + col->dx * t;
        float hit_y = col->py + col->dy * t;
        float u = fract(hit_x * 2.0f);
        float v = fract(hit_y * 2.0f);
        int tile_x = floor(hit_x);
        int tile_y = floor(hit_y);
        if (is_wall(tile_x, tile_y)) {
            col->color[y] = texture_sample(&texture_wall, u, v);
            col->light[y] = t;
        } else {
            col->color[y] = texture_sample(&texture_floor, u, v);
            col->light[y] = t * 4.0f;
        }
        col->depth[y] = t;
    }
}

static void draw_walls(Column* col)
{
    // Raycast against the map.
    float depth = 0.0f;
    int limit = player_self == player_ghost ? 10 : 1;
    for (int i = 0; i < limit && (depth - 2.0f) * 0.3f < 1.0f; i++) {
        depth = raycast(col->px, col->py, col->dx, col->dy, depth);
        const float y0 = FRAME_H * 0.5f + 0.5f - WALL_HEIGHT / depth;
        const float y1 = FRAME_H * 0.5f + 0.5f + WALL_HEIGHT / depth;
        const int y0_clamped = max(0, min(y0, FRAME_H));
        const int y1_clamped = max(0, min(y1, FRAME_H));
        const float hit_x = col->px + col->dx * depth;
        const float hit_y = col->py + col->dy * depth;
        const float eps = 1e-4f;
        const bool bounds = hit_x > eps && hit_y > eps && hit_x < MAP_W - eps && hit_y < MAP_H - eps;

        // Draw walls.
        for (int y = y0_clamped; y < y1_clamped; y++) {
            if (col->depth[y] < depth || (player_self == player_ghost && dither(col->x, y) > (depth - 1.0f) * 1.5f && bounds))
                continue;
            float edge_x = abs(fract(hit_x) - 0.5f);
            float edge_y = abs(fract(hit_y) - 0.5f);
            float u = fract((edge_x < edge_y ? hit_x : hit_y) * 2.0f);
            float v = fract(4.0f * (y - y0) / (y1 - y0));
            Texture* tex = bounds ? &texture_wall : &texture_barrier;
            col->color[y] = texture_sample(tex, u, v);
            col->light[y] = depth;
            col->depth[y] = depth;
        }

        // Draw shadows.
        for (int y = y1_clamped; y < FRAME_H; y++) {
            if (player_self == player_ghost && (dither(col->x, y) > (depth - 1.0f) * 1.5f && bounds))
                continue;
            col->light[y] = min(col->light[y], depth + 4.0f * min(1.0f, (y - y1) / (y1 - y0)));
        }
    }
}

static void draw_sprite(Column* col, Texture* tex, float sx, float sy, float w, float h)
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
    const float radius = w * shadow_scale * 0.3f;
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

// Join two null-terminated strings.
static void string_join(char* buffer, size_t buffer_size, char* string)
{
    for (; *buffer; buffer_size--)
        buffer++;
    while (*string && --buffer_size)
        *buffer++ = *string++;
    *buffer = '\0';
}

// Convert an unsigned integer to a string.
static char* string_from_int(char* buffer, unsigned int value)
{
    if (value >= 10)
        buffer = string_from_int(buffer, value / 10);
    buffer[0] = '0' + value % 10;
    buffer[1] = '\0';
    return buffer + 1;
}

// Convert a timestamp (in seconds) to a nine-character string (including the
// null-terminator).
static void string_from_timestamp(char buffer[9], double time)
{
    int cents = floor(time * 100.0);
    buffer[0] = '0' + cents / 60000 % 10; // Tens of minutes.
    buffer[1] = '0' + cents /  6000 % 10; // Minutes.
    buffer[2] = ':';
    buffer[3] = '0' + cents / 1000 % 6 % 10; // Tens of seconds.
    buffer[4] = '0' + cents /  100 % 10; // Seconds.
    buffer[5] = ':';
    buffer[6] = '0' + cents / 10 % 10; // Tenths of a second.
    buffer[7] = '0' + cents /  1 % 10; // Hundredths of a second.
    buffer[8] = '\0';
}

// Get a string from the JavaScript side.
__attribute__((import_module("islands/Web3D"), import_name("getString")))
size_t string_from_externref(__externref_t, char* buffer, size_t buffer_size);

static void spawn_particles(float x, float y, float z, uint32_t color)
{
    for (int i = 0; i < 30; i++) {
        if (particle_count < MAX_PARTICLES) {
            Particle* particle = &particle_array[particle_count++];
            particle->x = x + random_float(-0.2f, +0.2f);
            particle->y = y + random_float(-0.2f, +0.2f);
            particle->z = z + random_float(-0.2f, +0.2f);
            particle->vx = random_float(-1.0f, +1.0f);
            particle->vy = random_float(-1.0f, +1.0f);
            particle->vz = random_float(+2.0f, +3.0f);
            particle->lifespan = random_float(0.1f, 0.3f);
            particle->counter = 0.0f;
            particle->size = random_float(0.1f, 0.4f) * 0.8f;
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

static void update_players(float dt)
{
    for (size_t i = 0; i < player_count; i++) {
        Player* player = &players[i];
        player->vx = smooth(player->vx, player->x, 10.0f * dt);
        player->vy = smooth(player->vy, player->y, 10.0f * dt);
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

static void draw_animation(Column* col, Texture* tex, float x, float y, float w, float h, float rate)
{
    Texture frame;
    int frame_count = tex->w / tex->h;
    int frame_index = (int) (time_elapsed * rate) % frame_count;
    int frame_x = frame_index * tex->h;
    texture_sub(&frame, tex, frame_x, 0, tex->h, tex->h);
    draw_sprite(col, &frame, x, y, w, h);
}

static void draw_guy(Column* col, float x, float y, float dx, float dy, bool animate)
{
    Texture* tex = &texture_guy_left;
    float dp = dx * col->vx + dy * col->vy; // Dot product.
    float cp = dx * col->vy - dy * col->vx; // Cross product.
    if (dp > ROOT_HALF)
        tex = &texture_guy_back;
    else if (dp < -ROOT_HALF)
        tex = &texture_guy_front;
    else if (cp < 0.0f)
        tex = &texture_guy_right;
    float rate = animate * 10.0f;
    draw_animation(col, tex, x, y, 0.9f, 0.0f, rate);
}

static void draw_ghost(Column* col, float x, float y)
{
    draw_animation(col, &texture_ghost, x, y, 1.5, 0.0f, 10.0f);
}

static void draw_countdown(double seconds)
{
    // Draw a timer.
    char text[16];
    string_from_timestamp(text, seconds);
    int x = FRAME_W - 52;
    int y = FRAME_H - 16;
    int color = ((int) (seconds * 128.0f) % 128 + 127) * 0x010101 | 0xff000000;
    font_draw(&font_big, x + 1, y + 1, 0xff000000, text);
    font_draw(&font_big, x + 0, y + 0, color, text);

    char* small = "NEXT ROUND IN";
    x = FRAME_W - 64;
    y = FRAME_H - 26;
    font_draw(&font_tiny, x + 1, y + 1, 0xff000000, small);
    font_draw(&font_tiny, x + 0, y + 0, color, small);
}

static void draw_scores(void)
{
    // Sort players by score.
    for (size_t i = 1, j; i < player_count; i++) {
        Player temp = players[i];
        for (j = i; j > 0 && players[j - 1].score < temp.score; j--)
            players[j] = players[j - 1];
        players[j] = temp;
    }

    // Draw the table heading.
    char* text = "Scores";
    int x = (FRAME_W - 20) / 2;
    int y = 30;
    font_draw(&font_big, x + 1, y + 1, 0xff000000, text);
    font_draw(&font_big, x + 0, y + 0, 0xffffffff, text);

    // Draw each player's name and score.
    for (size_t i = 0; i < player_count; i++) {
        Player* player = &players[i];

        // Draw the player name.
        x = (FRAME_W - 120) / 2;
        y = 51 + i * 14;
        font_draw(&font_tiny, x + 1, y + 1, 0xff000000, player->name);
        font_draw(&font_tiny, x + 0, y + 0, 0xffffffff, player->name);

        // Draw the player's current score.
        char score[16];
        string_from_int(score, player->score);
        int width = font_width(&font_big, score);
        x = (FRAME_W + 120) / 2 - width;
        y = 50 + i * 14;
        font_draw(&font_big, x + 1, y + 1, 0xff000000, score);
        font_draw(&font_big, x + 0, y + 0, 0xffffffff, score);
    }
}

static Player* get_player_by_id(uint32_t id)
{
    for (size_t i = 0; i < player_count; i++)
        if (players[i].id == id)
            return &players[i];
    return NULL;
}

static void draw_user_interface(void)
{
    // Draw the gem count (if the player is connected).
    Player* player = get_player_by_id(player_self);
    if (player) {
        char text[16];
        string_from_int(text, player->score);
        int x = 23;
        int y = 182 + 10.0f * score_shake * sinf(time_elapsed * 80.0f);
        score_shake = max(0.0f, score_shake - time_delta);
        font_draw(&font_big, x + 1, y + 1, 0xff000000, text);
        font_draw(&font_big, x + 0, y + 0, 0xffffffff, text);
        texture_draw(&texture_gem[1], 5, 180);
    }

    // Show some text while waiting for other players to join.
    if (player_count == 1 && gem_mask == ALL_GEMS_COLLECTED) {
        char* text = "Waiting for players";
        int x = (FRAME_W - 80) / 2;
        int y = (FRAME_H - 30) / 2;
        font_draw(&font_big, x + 1, y + 1, 0xff000000, text);
        font_draw(&font_big, x + 0, y + 0, 0xffffffff, text);
    }

    // Draw a countdown while waiting for the next round.
    if (time_now < time_round) {
        draw_countdown((time_round - time_now) / 1000.0);
        draw_scores();
    }

    // Draw the message log.
    draw_messages();
}

static void draw_players(Column* col)
{
    for (size_t i = 0; i < player_count; i++) {
        Player* player = &players[i];
        if (player->id == player_self)
            continue;
        if (player->id == player_ghost)
            draw_ghost(col, player->vx, player->vy);
        else
            draw_guy(col, player->vx, player->vy, player->dx, player->dy, player->moving);
    }
}

static void draw_gems(Column* col)
{
    for (int i = 0; i < MAX_GEMS; i++) {
        if (!(gem_mask & (1ull << i))) {
            Gem* gem = &gem_array[i];
            float height = 0.3f + 0.05f * sinf(time_elapsed * 2.0f + gem->phase);
            draw_sprite(col, gem->tex, gem->x, gem->y, 0.4f, height);
        }
    }
}

__attribute__((export_name("recvJoin")))
void recv_join(uint32_t id, int score)
{
    // Add another player to the array.
    if (!get_player_by_id(id)) {
        Player* player = &players[player_count++];
        memset(player, 0, sizeof(Player));
        player->id = id;
        player->score = score;

        // Set the player's name (TODO: Use their actual name).
        char buffer[64];
        string_from_int(buffer, id);
        string_join(player->name, MAX_PLAYER_NAME, "player");
        string_join(player->name, MAX_PLAYER_NAME, buffer);

        // Show a join message (unless the player is still connecting).
        if (player_self) {
            buffer[0] = '\0';
            string_join(buffer, sizeof(buffer), player->name);
            string_join(buffer, sizeof(buffer), " joined");
            push_message(buffer);
        }
    }
}

__attribute__((export_name("recvQuit")))
void recv_quit(uint32_t id)
{
    // Find a player with a matching ID.
    for (size_t i = 0; i < player_count; i++) {
        Player* player = &players[i];
        if (player->id == id) {

            // Print a quit message.
            char buffer[64] = {0};
            string_join(buffer, sizeof(buffer), player->name);
            string_join(buffer, sizeof(buffer), " quit");
            push_message(buffer);

            // Remove the player from the array.
            players[i] = players[--player_count];
            break;
        }
    }
}

__attribute__((export_name("recvStatus")))
void recv_status(uint32_t self, uint32_t ghost, double timestamp, double gems)
{
    next_gem_mask = gems;
    player_ghost = ghost;
    time_round = timestamp;
    if (!player_self) {
        player_self = self;
        new_game(timestamp);
    }
}

__attribute__((export_name("recvMove")))
void recv_move(uint32_t id, float x, float y, float dx, float dy)
{
    Player* player = get_player_by_id(id);
    if (player) {
        player->moving = x != player->x || y != player->y;
        player->x = x;
        player->y = y;
        player->dx = dx;
        player->dy = dy;
        if (!player->active) {
            player->vx = player->x;
            player->vy = player->y;
        }
        player->active = true;
    }
}

__attribute__((export_name("recvCollect")))
void recv_collect(uint32_t id, int gem_index)
{
    Gem* gem = &gem_array[gem_index];
    spawn_particles(gem->x, gem->y, 0.3f, gem->tex->color);
    gem_mask |= 1ull << gem_index;
    if (id == player_self)
        score_shake = 0.2f;
    Player* player = get_player_by_id(id);
    if (player)
        player->score++;
}

// Message types (these should match MessageType in server.ts).
enum {
    MESSAGE_MOVE = 3,
    MESSAGE_COLLECT,
};

void send_move(__externref_t socket, float x, float y, float dx, float dy)
{
    __attribute__((import_module("islands/Web3D"), import_name("sendMessage")))
    void send_move_message(__externref_t, int, int, float, float, float, float);
    send_move_message(socket, MESSAGE_MOVE, player_self, x, y, dx, dy);
}

void send_collect(__externref_t socket, int gem_index)
{
    __attribute__((import_module("islands/Web3D"), import_name("sendMessage")))
    void send_collect_message(__externref_t, int, int, int);
    send_collect_message(socket, MESSAGE_COLLECT, player_self, gem_index);
}

// Render the next frame of the game.
__attribute__((export_name("draw")))
void* draw(__externref_t socket, double timestamp, double date_now)
{
    // Measure time delta since the previous frame.
    static double prev_timestamp;
    time_delta = min(0.1, (timestamp - prev_timestamp) / 1000.0);
    prev_timestamp = timestamp;

    // Measure elapsed time.
    if (time_start == 0.0)
        time_start = timestamp;
    time_elapsed = (timestamp - time_start) / 1000.0;

    // Record the current timestamp.
    time_now = date_now;

    // Start a new game when the counter runs out.
    if (time_now >= time_round && time_curr < time_round) {
        push_message("A new round started");
        new_game(time_round);
    }

    // Handle player movement.
    const float rotate_speed = time_delta * PLAYER_TURN_SPEED;
    const float run_speed = time_delta * PLAYER_RUN_SPEED;
    float run_f = key_held[KEY_FORWARD] - key_held[KEY_BACK];
    float run_s = key_held[KEY_RSTRAFE] - key_held[KEY_LSTRAFE];
    if (run_f != 0.0f && run_s != 0.0f) {
        run_f *= ROOT_HALF;
        run_s *= ROOT_HALF;
    }
    player_angle += rotate_speed * (key_held[KEY_RIGHT] - key_held[KEY_LEFT]);
    player_x += run_speed * (run_f * cosf(player_angle) - run_s * sinf(player_angle));
    player_y += run_speed * (run_f * sinf(player_angle) + run_s * cosf(player_angle));

    // Do collision detection against walls.
    if (player_self != player_ghost) {
        const float half = PLAYER_HITBOX_SIZE * 0.5f;
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
    }

    // Do collision detection against the bounds of the map.
    player_x = max(0.5f, min(player_x, MAP_W - 0.5f));
    player_y = max(0.5f, min(player_y, MAP_H - 0.5f));

    // Send the player position.
    float player_dx = cosf(player_angle);
    float player_dy = sinf(player_angle);
    send_move(socket, player_x, player_y, player_dx, player_dy);

    // Collect gems when touching them.
    if (player_self != player_ghost && time_now >= time_round) {
        for (int i = 0; i < MAX_GEMS; i++) {
            if (!(gem_mask & (1ull << i))) {
                Gem* gem = &gem_array[i];
                float dx = player_x - gem->x;
                float dy = player_y - gem->y;
                if (dx * dx + dy * dy < PLAYER_REACH * PLAYER_REACH
                 && time_now >= time_round + 100.0f)
                    send_collect(socket, i);
            }
        }
    }

    // Smooth out player movement.
    player_angle_smooth = smooth(player_angle_smooth, player_angle, 20.0f * time_delta);
    player_x_smooth = smooth(player_x_smooth, player_x, 10.0f * time_delta);
    player_y_smooth = smooth(player_y_smooth, player_y, 10.0f * time_delta);

    // Update particle effects.
    update_particles(time_delta);
    update_players(time_delta);

    // Interpolate player positions.
    for (int i = 0; i < MAX_PLAYERS; i++) {
        Player* player = &players[i];
        if (!player->id || player->id == player_self)
            continue;
        player->vx = smooth(player->vx, player->x, 10.0f * time_delta);
        player->vy = smooth(player->vy, player->y, 10.0f * time_delta);
    }

    // Set up state for raycasting.
    Column col = {
        .px = player_x_smooth,
        .py = player_y_smooth,
        .vx = cosf(player_angle_smooth),
        .vy = sinf(player_angle_smooth),
    };

    // Render the frame one vertical slice at a time.
    for (int x = 0; x < FRAME_W; x++) {

        // Determine the direction vector for the ray.
        float t = (float) x / (FRAME_W - 1) * 2.0f - 1.0f;
        col.x = x;
        col.dx = col.vx - col.vy * FOV * t;
        col.dy = col.vy + col.vx * FOV * t;

        // Draw all objects.
        draw_sky(&col);
        draw_floor(&col);
        draw_walls(&col);
        draw_gems(&col);
        draw_particles(&col);
        draw_players(&col);

        // Write out the pixels for this column.
        for (int y = 0; y < FRAME_H; y++)
            frame[x + y * FRAME_W] = apply_fog(col.color[y], col.light[y], x, y);
    }

    draw_user_interface();

    // Reset keyboard state.
    memset(key_down, 0, sizeof(key_down));
    memset(key_up, 0, sizeof(key_up));

    // Return the finished frame so that it can be presented to the canvas.
    return frame;
}
