#include "web3d.h"

int gif_get_image_w(const uint8_t* gif)
{
    return gif[6] | (gif[7] << 8);
}

int gif_get_image_h(const uint8_t* gif)
{
    return gif[8] | (gif[9] << 8);
}

void gif_get_pixels(const uint8_t* gif, uint8_t* pixels)
{
    // Read the global header and palette (if present).
    const uint8_t (*palette)[3] = (const uint8_t(*)[3]) (gif + 13);
    gif += 13 + (gif[10] >> 7) * 3 * (2 << (gif[10] & 7));

    // Read extension blocks.
    int transparent = -1; // Transparent color index (or -1 if none).
    while (*gif++ == 0x21) { // Extension introducer.
        if (*gif++ == 0xf9) { // Graphic control extension.
            transparent = gif[1] & 1 ? gif[4] : -1; // Transparent index.
            gif += 6;
        } else { // Skip over any other extensions.
            for (int size; (size = *gif++); gif += size);
        }
    }

    // Read the local palette (if present).
    if (gif[8] & 0x80) {
        palette = (const uint8_t(*)[3]) (gif + 9);
        gif += 3 * (2 << (gif[8] & 7));
    }
    gif += 9;

    // Initialize the code table root.
    const int root = *gif++;
    int count = 1 << root;
    int16_t code_next[0x1000];
    uint8_t code_value[0x1000];
    for (int i = 0; i < count; i++) {
        code_value[i] = i;
        code_next[i] = -1;
    }

    // Extract variable-length LZW codes from length-prefixed sub-blocks.
    int length = root + 1, bits = 0, part = 0, prev = 0, code = 0, block = 0;
    for (;;) {
        block = (block ? block : *gif++) - 1;
        part |= *gif++ << bits;
        for (bits += 8; bits >= length; prev = code) {
            code = part & ((1 << length) - 1);
            part >>= length;
            bits -= length;

            // Handle the clear code.
            if (code == (1 << root)) {
                count = code;
                length = root + 1;
                continue;
            }

            // Handle the end code.
            if (code == (1 << root) + 1)
                return;

            // Traverse a chain of codes, pushing each one on a stack.
            uint8_t stack[0x1000];
            int top = code > count;
            for (int i = code > count ? prev : code; i >= 0; i = code_next[i])
                stack[top++] = code_value[i];
            if (code > count)
                stack[0] = stack[top - 1];

            // Add a new code if there's room in the code table.
            if (count < 0xfff) {
                int new_code = ++count;
                code_next[new_code] = prev;
                code_value[new_code] = stack[top - 1];
                length += !(count & (count + 1));
            }

            // Pop pixels off the stack and write them to the image.
            while (top--) {
                const uint8_t* color = palette[stack[top]];
                *pixels++ = color[0];
                *pixels++ = color[1];
                *pixels++ = color[2];
                *pixels++ = 255 * (stack[top] != transparent);
            }
        }
    }
}
