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

// Yeah, I need to define this myself.
#define NULL ((void*) 0)

// Two times pi.
#define TAU 6.28318530718f

// Functions that map directly to builtins.
#define abs(...) __builtin_fabsf(__VA_ARGS__)
#define floor(...) __builtin_floorf(__VA_ARGS__)
#define memset(...) __builtin_memset(__VA_ARGS__)

// Dimensions of the tile map.
#define MAP_W 49
#define MAP_H 49
#define MAP_SIZE (MAP_W * MAP_H)

// gif.c
int gif_get_image_w(const uint8_t* gif);
int gif_get_image_h(const uint8_t* gif);
void* gif_get_pixels(const uint8_t* gif, void* pixels);

// map.c
bool map_inside(int x, int y);
int map_get(int x, int y);
void map_set(int x, int y, char value);
void map_generate(size_t seed);

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
void random_seed(unsigned int seed);
int random_int(int min, int max);
float random_float(float min, float max);
