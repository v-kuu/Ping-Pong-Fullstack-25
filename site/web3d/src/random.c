#include "web3d.h"

// Random number generator state.
static size_t rng_state;
static size_t rng_seed;

// Generate the next random number in the sequence.
static size_t random_step(void)
{
    return rng_state = rng_state * 1103515245u + 12345u;
}

// Initialize the random number generator.
void random_seed(size_t seed)
{
    rng_seed = rng_state = seed;
}

// Get a random integer in the range [min, max].
int random_int(int min, int max)
{
    return min + random_step() % (max - min + 1);
}

// Get a random float in the range [min, max].
float random_float(float min, float max)
{
    return min + random_step() / 0x1p32 * (max - min);
}

// Get an evenly distributed pseudorandom value.
int random_hash(size_t index, size_t range)
{
    const int hash = range * 0.6180339887498948;
    return (index + rng_seed) * hash % range;
}

// Get the x-coordinate of an evenly distributed pseudorandom 2D point.
int random_hash_x(size_t index, size_t range)
{
    const int hash = range * 0.7548776662466927;
    return (index + rng_seed) * hash % range;
}

// Get the y-coordinate of an evenly distributed pseudorandom 2D point.
int random_hash_y(size_t index, size_t range)
{
    const int hash = range * 0.5698402909980532;
    return (index + rng_seed) * hash % range;
}
