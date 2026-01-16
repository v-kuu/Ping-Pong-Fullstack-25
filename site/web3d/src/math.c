#include "web3d.h"

// Get the smaller of two numbers.
float min(float x, float y)
{
    return x < y ? x : y;
}

// Get the larger of two numbers.
float max(float x, float y)
{
    return x > y ? x : y;
}

// Get the fractional part of a floating point number.
float fract(float x)
{
    return x - floor(x);
}

// Fast approximation of the sine function.
float sinf(float x)
{
    return cosf(x - TAU * 0.25f);
}

// Fast approximation of the cosine function.
float cosf(float x)
{
    x *= 1.0f / TAU;
    x -= 0.25f + floor(x + 0.25f);
    x *= 16.0f * (abs(x) - 0.5f);
    return x + (0.225f * x * (abs(x) - 1.0f));
}

// Fast approximation of the function 2^x.
float exp2f(float x)
{
    float a = fract(x);
    float b = x + 121.2740575f + 27.7280233f / (4.84252568f - a);
    union { unsigned int i; float f; } u = {0x1p23f * (b - 1.49012907f * a)};
    return u.f;
}

// Exponential smoothing function. For frame-independent behavior, the rate
// should be multiplied by delta time.
float smooth(float source, float target, float rate)
{
    return (target + (source - target) * exp2f(-rate));
}

// Dithering function (pattern used: Interleaved Gradient Noise).
float dither(int x, int y)
{
    return fract(52.9829189f * fract(0.06711056f * x + 0.00583715f * y));
}

// Linear interpolation between two values x0 and x1.
float lerp(float x0, float x1, float t)
{
    return (1.0f - t) * x0 + t * x1;
}

// Return -1 if a number is negative, 1 if it's positive, and 0 if it's zero.
float sign(float x)
{
    return (x > 0.0f) - (x < 0.0f);
}
