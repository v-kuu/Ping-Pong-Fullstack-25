#include "web3d.h"

// Frame buffer.
static uint32_t frame[FRAME_W * FRAME_H];

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
uint32_t texture_sample(const Texture* tex, float u, float v)
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
uint32_t average_color(Texture* tex)
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

static void font_draw_glyph(Font* font, int dx, int dy, int x, int y, int w, int h, uint32_t color)
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

void set_pixel(int x, int y, uint32_t color)
{
    if (0 <= x && x < FRAME_W
     && 0 <= y && y < FRAME_H)
        frame[x + y * FRAME_W] = color;
}

uint32_t* get_frame_data(void)
{
    return frame;
}
