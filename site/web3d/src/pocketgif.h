#ifndef POCKETGIF_H_INCLUDED
#define POCKETGIF_H_INCLUDED

enum {
    POCKETGIF_OK,           /* No error                       */
    POCKETGIF_END,          /* Reached the end of the stream  */
    POCKETGIF_CORRUPT,      /* Not a valid GIF file           */
    POCKETGIF_TOO_SMALL,    /* Output buffer is too small     */
    POCKETGIF_BAD_PARAM     /* One or more invalid parameters */
};

typedef struct pgif_context pgif_context;

int pgif_init(pgif_context *ctx, const void *data, int size);
int pgif_get_size(pgif_context *ctx, int *width, int *height, int *frames);
int pgif_next_frame(pgif_context *ctx, void *output, int size, int *delay);

struct pgif_context
{
    unsigned char *input;
    unsigned char *input_end;
    unsigned char (*output)[4];
    int frames_decoded;
    int frames_total;
    unsigned short image_size_x, image_size_y;
    unsigned short frame_size_x, frame_size_y;
    unsigned short frame_offset_x, frame_offset_y;
    unsigned short frame_delay;
    int out_pos_x, out_pos_y;
    int out_min_x, out_min_y;
    int out_max_x, out_max_y;
    int out_stride;
    int out_shift;
    int clear_to_background;
    short transparent_color;
    short background_color;
    unsigned char (*global_palette)[3];
    unsigned char (*local_palette)[3];
    unsigned char (*active_palette)[3];
};

#ifdef POCKETGIF_IMPLEMENTATION

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    unsigned int value:   8;
    unsigned int length: 12;
    unsigned int next:   12;
} _pgif_code;

static unsigned char *_pgif_advance(pgif_context *ctx, int count)
{
    unsigned char *data = 0;
    if (count <= ctx->input_end - ctx->input) {
        data = ctx->input;
        ctx->input += count;
    }
    return data;
}

static int _pgif_output(pgif_context *ctx, _pgif_code *codes, int code)
{
    /* Recurse to output multi-pixel codes the right way around */
    int root = code;
    if (codes[code].length != 0) {
        root = _pgif_output(ctx, codes, codes[code].next);
    }

    /* Write a pixel to the image */
    if (codes[code].value != ctx->transparent_color) {
        unsigned char *pixel = ctx->output[ctx->out_pos_x + ctx->out_pos_y];
        unsigned char *color = ctx->active_palette[codes[code].value];
        pixel[0] = color[0];
        pixel[1] = color[1];
        pixel[2] = color[2];
        pixel[3] = 0xff;
    }

    /* Move on to the next pixel, respecting the interlacing pattern */
    if (++ctx->out_pos_x >= ctx->out_max_x) {
        ctx->out_pos_x = ctx->out_min_x;
        ctx->out_pos_y += ctx->out_stride;
        while (ctx->out_pos_y >= ctx->out_max_y && ctx->out_shift > 0) {
            ctx->out_stride = (1 << ctx->out_shift) * ctx->image_size_x;
            ctx->out_pos_y = ctx->out_min_y + (ctx->out_stride >> 1);
            ctx->out_shift--;
        }
    }
    return root;
}

static int _pgif_decode_frame(pgif_context *ctx)
{
    _pgif_code codes[4096];
    int root_length, code_length, curr, prev, bit_counter, size, i;
    int code_mask, num_codes;
    unsigned char *block;

    /* Initialize decoder state */
    if (!(block = _pgif_advance(ctx, 2)) || block[0] < 2 || block[0] > 8) {
        return POCKETGIF_CORRUPT;
    }
    root_length = block[0];
    prev = curr = 0;
    code_length = root_length + 1;
    bit_counter = -code_length;
    num_codes = 1 << root_length;
    code_mask = (1 << code_length) - 1;

    /* Initialize the code table */
    for (i = 0; i < num_codes; i++) {
        codes[i].value = i;
        codes[i].length = 0;
    }

    /* Read the code stream */
    for (size = block[1]; size != 0; size = block[size]) {

        /* Read the next block */
        if (!(block = _pgif_advance(ctx, size + 1))) {
            return POCKETGIF_CORRUPT;
        }

        /* Extract codes from the chain of blocks */
        for (i = 0; i < size; i++) {
            int load = block[i++];
            load |= i == size ? 0 : (block[i] << 8);
            curr |= (load << (code_length + bit_counter)) & code_mask;
            load >>= -bit_counter;
            bit_counter += i == size ? 8 : 16;
            while (bit_counter >= 0) {
                if (curr == 1 << root_length) { /* Clear code */
                    num_codes = 1 << root_length;
                    code_mask = (1 << (code_length = root_length + 1)) - 1;
                } else if (curr == (1 << root_length) + 1) { /* End code */
                    if (block[size] != 0) {
                        return POCKETGIF_CORRUPT;
                    }
                    return 0;
                } else {
                    int iter, root;

                    /* Add a new code (unless the code table is full) */
                    if (num_codes < 0xfff) {
                        num_codes++;
                        codes[num_codes].length = codes[prev].length + 1;
                        codes[num_codes].next = prev;
                    }

                    /* Output one or more pixels */
                    iter = curr >= num_codes ? prev : curr;
                    root = _pgif_output(ctx, codes, iter);
                    codes[num_codes].value = codes[root].value;
                    if (curr >= num_codes) {
                        _pgif_output(ctx, codes, root);
                    }
                }

                /* Increase the code length if necessary */
                if (num_codes == code_mask && num_codes < 0xfff) {
                    code_mask = (1 << ++code_length) - 1;
                }

                /* Move on to the next code */
                prev = curr;
                curr = load & code_mask;
                load >>= code_length;
                bit_counter -= code_length;
            }
        }
    }

    /* We got a block terminator without an end code */
    return POCKETGIF_CORRUPT;
}

int pgif_init(pgif_context *ctx, const void *data, int size)
{
    unsigned char *block;

    /* Check parameters */
    if (!ctx || !data || size < 0) {
        return POCKETGIF_BAD_PARAM;
    }

    /* Initialize context structure */
    ctx->input = (unsigned char*) data;
    ctx->input_end = (unsigned char*) data + size;
    ctx->global_palette = 0;
    ctx->local_palette = 0;
    ctx->frames_decoded = 0;
    ctx->frames_total = 0;
    ctx->active_palette = 0;
    ctx->transparent_color = -1;
    ctx->clear_to_background = 1;
    ctx->frame_offset_x = 0;
    ctx->frame_offset_y = 0;

    /* Check file signature */
    if (!(block = _pgif_advance(ctx, 13))) {
        return POCKETGIF_CORRUPT;
    } else if (block[0] != 'G' || block[1] != 'I' || block[2] != 'F' ||
               block[3] != '8' || (block[4] != '7' && block[4] != '9') ||
               block[5] != 'a') {
        return POCKETGIF_CORRUPT;
    }

    /* Read image size */
    ctx->frame_size_x = ctx->image_size_x = block[6] | (block[7] << 8);
    ctx->frame_size_y = ctx->image_size_y = block[8] | (block[9] << 8);

    /* Read global palette (if present) */
    if (block[10] & 0x80) {
        int palette_bytes = 3 * (1 << ((block[10] & 0x07) + 1));
        ctx->background_color = block[11];
        if (!(block = _pgif_advance(ctx, palette_bytes))) {
            return POCKETGIF_CORRUPT;
        }
        ctx->global_palette = (unsigned char(*)[3]) block;
        ctx->active_palette = ctx->global_palette;
    }
    return 0;
}

static int _pgif_read_extension_block(pgif_context *ctx, int skip)
{
    int size;
    unsigned char *block = _pgif_advance(ctx, 2);
    if (!block) {
        return POCKETGIF_CORRUPT;
    } else if (!skip && block[0] == 0xf9) { /* Graphic control extension */
        block = _pgif_advance(ctx, 5);
        ctx->clear_to_background = (block[0] & 0x1c) > 1;
        ctx->frame_delay = block[1] | (block[2] << 8);
        ctx->transparent_color = (block[0] & 0x01) ? block[3] : -1;
    } else { /* Other extension (ignored) */
        for (size = block[1]; size != 0; size = block[size]) {
            block = _pgif_advance(ctx, size + 1);
        }
    }
    return 0;
}

static int _pgif_read_frame_header(pgif_context *ctx, int skip)
{
    unsigned char *block = _pgif_advance(ctx, 9);
    if (!block) {
        return POCKETGIF_CORRUPT;
    } else if (!skip) {
        /* Read frame size and offset */
        ctx->frame_offset_x = block[0] | (block[1] << 8);
        ctx->frame_offset_y = block[2] | (block[3] << 8);
        ctx->frame_size_x = block[4] | (block[5] << 8);
        ctx->frame_size_y = block[6] | (block[7] << 8);

        /* Prepare output parameters */
        ctx->out_min_x = ctx->frame_offset_x;
        ctx->out_min_y = ctx->frame_offset_y * ctx->image_size_x;
        ctx->out_max_x = ctx->out_min_x + ctx->frame_size_x;
        ctx->out_max_y = ctx->out_min_y + ctx->frame_size_y * ctx->image_size_x;
        ctx->out_pos_x = ctx->out_min_x;
        ctx->out_pos_y = ctx->out_min_y;
        if (block[8] & 0x40) { /* Interlaced image */
            ctx->out_stride = 8 * ctx->image_size_x;
            ctx->out_shift = 3;
        } else { /* Non-interlaced image */
            ctx->out_stride = ctx->image_size_x;
            ctx->out_shift = 0;
        }
    }

    /* Load the frame palette (if present) */
    if (block[8] & 0x80) {
        int palette_bytes = 3 * (1 << (1 + (block[8] & 0x07)));
        if (!(block = _pgif_advance(ctx, palette_bytes))) {
            return POCKETGIF_CORRUPT;
        } else if (!skip) {
            ctx->local_palette = (unsigned char(*)[3]) block;
            ctx->active_palette = ctx->local_palette;
        }
    }
    return 0;
}

static int _pgif_find_next_frame(pgif_context *ctx, int skip)
{
    unsigned char *block;
    for (;;) {
        if (!(block = _pgif_advance(ctx, 1))) {
            return POCKETGIF_CORRUPT;
        } else if (block[0] == 0x3b) {
            return POCKETGIF_END;
        } else if (block[0] == 0x21) {
            int err = _pgif_read_extension_block(ctx, skip);
            if (err) {
                return err;
            }
        } else if (block[0] == 0x2c) {
            return _pgif_read_frame_header(ctx, skip);
        } else {
            return POCKETGIF_CORRUPT;
        }
    }
}

int pgif_get_size(pgif_context *ctx, int *width, int *height, int *frames)
{
    /* Output image size */
    if (width) { *width = ctx->image_size_x; }
    if (height) { *height = ctx->image_size_y; }

    /* Output the number of frames */
    if (frames) {

        /* Check if we've already got the frame count */
        if (ctx->frames_total == 0) {
            int err, size;
            unsigned char *block;
            unsigned char *input = ctx->input;
            while ((err = _pgif_find_next_frame(ctx, 1)) != POCKETGIF_END) {
                if (err) {
                    return err;
                } else if (!(block = _pgif_advance(ctx, 2))) {
                    return POCKETGIF_CORRUPT;
                }

                /* Skip over the frame data */
                for (size = block[1]; size != 0; size = block[size]) {
                    if (!(block = _pgif_advance(ctx, size + 1))) {
                        return POCKETGIF_CORRUPT;
                    }
                }
                ctx->frames_total++;
            }
            ctx->input = input;
        }
        *frames = ctx->frames_total;
    }
    return 0;
}

int pgif_next_frame(pgif_context *ctx, void *output, int size, int *delay)
{
    int err;

    /* Abort if the output buffer is too small */
    ctx->output = (unsigned char(*)[4]) output;
    if (size < (int) ctx->image_size_x * ctx->image_size_y * 4) {
        return POCKETGIF_TOO_SMALL;
    }

    /* Clear the frame if necessary */
    if (ctx->clear_to_background) {

        /* Find the fill color */
        unsigned short x, y;
        unsigned char color[4] = {0};
        if (ctx->frames_decoded++ != 0 &&
            ctx->active_palette &&
            ctx->background_color != -1 &&
            ctx->background_color != ctx->transparent_color) {
            color[0] = ctx->active_palette[ctx->background_color][0];
            color[1] = ctx->active_palette[ctx->background_color][1];
            color[2] = ctx->active_palette[ctx->background_color][2];
            color[3] = 0xff;
        }

        /* Fill the area covered by the previous frame */
        for (y = 0; y < ctx->frame_size_y; y++) {
            for (x = 0; x < ctx->frame_size_x; x++) {
                unsigned short px = ctx->frame_offset_x + x;
                unsigned short py = ctx->frame_offset_y + y;
                unsigned char *pixel = ctx->output[px + py * ctx->image_size_x];
                pixel[0] = color[0];
                pixel[1] = color[1];
                pixel[2] = color[2];
                pixel[3] = color[3];
            }
        }
    }

    /* Reset any state scoped to the previous frame */
    ctx->clear_to_background = 0;
    ctx->transparent_color = -1;
    ctx->frame_delay = 0;

    /* Find the next frame */
    if ((err = _pgif_find_next_frame(ctx, 0))) {
        return err;
    } else if (delay) {
        *delay = ctx->frame_delay * 10;
    }
    return _pgif_decode_frame(ctx);
}

#ifdef __cplusplus
}
#endif

#endif /* #ifdef POCKETGIF_IMPLEMENTATION */
#endif /* #ifndef POCKETGIF_H_INCLUDED */
