#pragma once

// Sized integer types.
typedef __INT8_TYPE__ int8_t;
typedef __INT16_TYPE__ int16_t;
typedef __INT32_TYPE__ int32_t;
typedef __INT64_TYPE__ int64_t;
typedef __UINT8_TYPE__ uint8_t;
typedef __UINT16_TYPE__ uint16_t;
typedef __UINT32_TYPE__ uint32_t;
typedef __UINT64_TYPE__ uint64_t;
typedef __SIZE_TYPE__ size_t;

// Yeah, I need to define these myself.
#define NULL ((void*) 0)
#define INT_MAX 0x7fffffff

// Two times pi.
#define TAU 6.28318530718f

// Square root of 0.5.
#define ROOT_HALF 0.707106781f

// Functions that map directly to builtins.
#define abs(...) __builtin_fabsf(__VA_ARGS__)
#define floor(...) __builtin_floorf(__VA_ARGS__)
#define memset(...) __builtin_memset(__VA_ARGS__)
#define memcpy(...) __builtin_memcpy(__VA_ARGS__)

// Dimensions of the tile map.
#define MAP_W 25
#define MAP_H 25
#define MAP_SIZE (MAP_W * MAP_H)
#define MAP_ROOMS 20

// Dimensions of the frame buffer.
#define FRAME_W 360
#define FRAME_H 200

// Layout of font images.
#define FONT_GLYPH_MIN ' '
#define FONT_GLYPH_MAX '~'
#define FONT_GLYPH_COUNT (FONT_GLYPH_MAX - FONT_GLYPH_MIN + 1)
#define FONT_GLYPHS_PER_ROW 16
#define FONT_GLYPHS_PER_COL 6

// Type used for loading and drawing image textures.
typedef struct {
    uint16_t w, h;  // Size of the texture.
    uint16_t pitch; // Texels per row.
    uint32_t color; // Average color (used for particle effects).
    void* data;     // GIF file data (before load) or texel data (after load).
} Texture;

// Type used for loading and drawing fonts.
typedef struct {
    uint16_t w, h;                      // Size of the font texture.
    uint16_t width[FONT_GLYPH_COUNT];   // Per-glyph width.
    void* data;                         // GIF or texel data (same as Texture).
} Font;

// gif.c
int gif_get_image_w(const uint8_t* gif);
int gif_get_image_h(const uint8_t* gif);
void* gif_get_pixels(const uint8_t* gif, void* pixels);

// graphics.c
uint32_t texture_sample(const Texture* tex, float u, float v);
void font_load(Font* font);
void texture_load(Texture* tex);
void texture_sub(Texture* tex, Texture* src, int x, int y, int w, int h);
void texture_draw(Texture* tex, int x, int y);
void font_draw(Font* font, int x, int y, uint32_t color, const char* string);
int font_width(Font* font, const char* string);
uint32_t average_color(Texture* tex);
void set_pixel(int x, int y, uint32_t color);
uint32_t* get_frame_data(void);

// map.c
bool map_inside(int x, int y);
int map_get(int x, int y);
void map_set(int x, int y, char value);
int map_room_x(size_t room_index);
int map_room_y(size_t room_index);
void map_generate(void);

// math.c
float min(float x, float y);
float max(float x, float y);
float fract(float x);
float sinf(float t);
float cosf(float t);
float exp2f(float x);
float smooth(float source, float target, float rate);
float dither(int x, int y);
float lerp(float x0, float x1, float t);
float sign(float x);

// random.c
void random_seed(size_t seed);
int random_int(int min, int max);
float random_float(float min, float max);
int random_hash(size_t index, size_t range);
int random_hash_x(size_t index, size_t range);
int random_hash_y(size_t index, size_t range);

// string.c
void string_join(char* buffer, size_t buffer_size, char* string);
char* string_from_int(char* buffer, unsigned int value);
void string_from_timestamp(char buffer[9], double time);
