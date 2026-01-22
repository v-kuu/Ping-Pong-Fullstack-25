#include "web3d.h"

// Join two null-terminated strings.
void string_join(char* buffer, size_t buffer_size, char* string)
{
    for (; *buffer; buffer_size--)
        buffer++;
    while (*string && --buffer_size)
        *buffer++ = *string++;
    *buffer = '\0';
}

// Convert an unsigned integer to a string.
char* string_from_int(char* buffer, unsigned int value)
{
    if (value >= 10)
        buffer = string_from_int(buffer, value / 10);
    buffer[0] = '0' + value % 10;
    buffer[1] = '\0';
    return buffer + 1;
}

// Convert a timestamp (in seconds) to a nine-character string (including the
// null-terminator).
void string_from_timestamp(char buffer[9], double time)
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
