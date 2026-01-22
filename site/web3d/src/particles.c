#include "web3d.h"

#define MAX_PARTICLES 100

static Particle particle_array[MAX_PARTICLES];
static size_t particle_count;

void spawn_particles(float x, float y, float z, uint32_t color)
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

void update_particles(float dt)
{
    // Update each particle's state.
    for (size_t i = 0; i < particle_count; i++) {
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

void draw_particles(Column* col)
{
    for (size_t i = 0; i < particle_count; i++) {

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

        const float y0 = FRAME_H * 0.5f + 0.5f + (150 - (particle->z + w) * 160) / t;
        const float y1 = FRAME_H * 0.5f + 0.5f + (150 - (particle->z + 0) * 160) / t;
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
