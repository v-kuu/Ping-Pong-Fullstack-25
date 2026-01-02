#include "web3d.h"

static unsigned int state;

static unsigned int random_step(void)
{
    return state = state * 1103515245u + 12345u;
}

void random_seed(unsigned int seed)
{
    state = seed;
}

int random_int(int min, int max)
{
    return min + random_step() % (max - min + 1);
}

float random_float(float min, float max)
{
    return min + random_step() / 0x1p32 * (max - min);
}
