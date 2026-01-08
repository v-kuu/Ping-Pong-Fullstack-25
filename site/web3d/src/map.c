#include "web3d.h"

// The range of sizes used when generating rooms.
#define MIN_ROOM_SIZE 5
#define MAX_ROOM_SIZE 9

// The number of rooms to generate.
#define ROOM_COUNT 8

// Pathfinding parameters, for tuning the tunnel generation algorithm.
#define CORNER_COST 100 // Cost of passing through the corner of a room.
#define TUNNEL_COST   5 // Cost of digging a new tunnel.
#define DOOR_COST    10 // Cost of making a new room entrance.

// Tile map data.
static char map[MAP_W * MAP_H];

// Node type used by the pathfinding algorithm.
typedef struct {
    uint64_t x: 8;  // Map x-coordinate.
    uint64_t y: 8;  // Map y-coordinate.
    uint64_t g: 24; // g(n) score for pathfinding.
    uint64_t f: 24; // f(n) score for pathfinding.
} Node;

// Tile map.
static char map[MAP_W * MAP_H];

bool map_inside(int x, int y)
{
    return 0 <= x && x < MAP_W
        && 0 <= y && y < MAP_H;
}

int map_get(int x, int y)
{
    return map_inside(x, y) ? map[x + y * MAP_W] : -1;
}

void map_set(int x, int y, char value)
{
    if (map_inside(x, y))
        map[x + y * MAP_W] = value;
}

// Push a pathfinding node to the priority queue.
static void push_node(Node* nodes, size_t count, Node node)
{
    size_t i = count;
    for (size_t j; i && nodes[j = (i - 1) / 2].f > node.f; i = j)
        nodes[i] = nodes[j];
    nodes[i] = node;
}

// Pop a pathfinding node from the priority queue. The queue must not be empty.
static Node pop_node(Node* nodes, size_t count)
{
    Node popped = nodes[0];
    Node moved = nodes[count - 1];
    for (size_t i = 0, j; i != (j = count); i = j) {
        Node m = moved;
        size_t a = i * 2 + 1, b = a + 1;
        if (a < count && nodes[a].f < m.f) m = nodes[j = a];
        if (b < count && nodes[b].f < m.f) m = nodes[j = b];
        nodes[i] = m;
    }
    return popped;
}

// Measure the Manhattan distance between points (x0, y0) and (x1, y1). This is
// used as the distance metric for the pathfinding algorithm.
static int distance(int x0, int y0, int x1, int y1)
{
    int dx = x0 < x1 ? x1 - x0 : x0 - x1;
    int dy = y0 < y1 ? y1 - y0 : y0 - y1;
    return dx + dy;
}

// Map a direction index in [0, 3] to a step along an axis in [0, 1].
static int direction(int index, int axis)
{
    return (index / 2 == axis) * (index % 2 * 2 - 1);
}

// After finding a path between points (x0, y0) and (x1, y1), use the `prev`
// array to follow the breadcrumbs from the target (x1, y1) back to the start
// point (x0, y0), plotting the path along the way.
static void backtrack(uint8_t* prev, int x0, int y0, int x1, int y1)
{
    while (x0 != x1 || y0 != y1) {
        map_set(x0, y0, 0);
        int i = prev[x0 + y0 * MAP_W] - 1;
        x0 -= direction(i, 0);
        y0 -= direction(i, 1);
    }
    map_set(x1, y1, 0);
}

// Find the shortest path from (x0, y0) to (x1, y1), and plot it to the map.
static void make_path(int x0, int y0, int x1, int y1)
{
    Node nodes[MAP_SIZE];
    size_t node_count = 0;
    uint8_t prev[MAP_SIZE] = {0};
    Node node = {x0, y0, 0, distance(x0, y0, x1, y1)};
    push_node(nodes, node_count++, node);
    while (node.x != x1 || node.y != y1) {
        node = pop_node(nodes, node_count--);
        for (int i = 0; i < 4; i++) {
            int x = node.x + direction(i, 0);
            int y = node.y + direction(i, 1);
            int tile = map_get(x, y);
            if (tile >= 0 && !prev[x + y * MAP_W]) {
                prev[x + y * MAP_W] = i + 1;
                int g = node.g + tile + 1;
                g += prev[node.x + node.y * MAP_W] != i + 1;
                Node next = {x, y, g, g + distance(x, y, x1, y1)};
                push_node(nodes, node_count++, next);
            }
        }
    }
    backtrack(prev, x1, y1, x0, y0);
}

#define MAP_DIVISOR 2

// Get the x-coordinate of the center of a room.
static int get_room_x(size_t room_index)
{
    const int map_x = MAX_ROOM_SIZE / 2 - 1;
    const int map_w = MAP_W / MAP_DIVISOR - MAX_ROOM_SIZE / 2 - 1;
    const int g1 = map_w * 0.7548776662466927;
    return room_index * g1 % map_w + map_x;
}

// Get the y-coordinate of the center of a room.
static int get_room_y(size_t room_index)
{
    const int map_y = MAX_ROOM_SIZE / 2 - 1;
    const int map_h = MAP_H / MAP_DIVISOR - MAX_ROOM_SIZE / 2 - 1;
    const int g2 = map_h * 0.5698402909980532;
    return room_index * g2 % map_h + map_y;
}

// Fill the rectangle bounded by (x0, y0) at one corner and (x1, y1) at the
// other corner with a specific tile value.
static void fill_rect(int x0, int y0, int x1, int y1, char value)
{
    for (int y = y0; y <= y1; y++)
    for (int x = x0; x <= x1; x++)
        map_set(x, y, value);
}

static void make_room(size_t index)
{
    // Get the range of coordinates bounding the room.
    int w = random_int(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    int h = random_int(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
    int x0 = get_room_x(index) - w / 2, x1 = x0 + w - 1;
    int y0 = get_room_y(index) - h / 2, y1 = y0 + h - 1;

    // Fill the walls with relatively expensive tiles, to encourage the
    // pathfinder to make few entrances.
    fill_rect(x0, y0, x1, y1, DOOR_COST);

    // Fill the center of the room with cheaper tiles.
    fill_rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 0);

    // Fill the corners with more expensive tiles, to discourage the pathfinder
    // from making entrances there.
    map_set(x0, y0, CORNER_COST);
    map_set(x1, y0, CORNER_COST);
    map_set(x0, y1, CORNER_COST);
    map_set(x1, y1, CORNER_COST);
}

// For a room index, find the index of the closest room in the sequence.
static int get_closest_room(int i, size_t seed)
{
    int closest_index = i;
    int closest_dist = 0x7fffffff;
    int ix = get_room_x(i + seed);
    int iy = get_room_y(i + seed);
    for (int j = 0; j < ROOM_COUNT; j++) {
        int jx = get_room_x(j + seed), dx = jx - ix;
        int jy = get_room_y(j + seed), dy = jy - iy;
        int dist = dx * dx + dy * dy;
        if (i != j && dist < closest_dist) {
            closest_dist = dist;
            closest_index = j;
        }
    }
    return closest_index;
}

void map_generate(size_t seed)
{
    // Clear the map.
    memset(map, TUNNEL_COST, sizeof(map));

    // Generate random rooms.
    for (int i = 0; i < ROOM_COUNT; i++)
        make_room(i + seed);

    // Connect each room to its closest neighbor.
    for (int i = 0; i < ROOM_COUNT; i++) {
        int next = get_closest_room(i, seed);
        int this_x = get_room_x(i + seed);
        int this_y = get_room_y(i + seed);
        int next_x = get_room_x(next + seed);
        int next_y = get_room_y(next + seed);
        make_path(this_x, this_y, next_x, next_y);
    }

    // Make sure all rooms are connected, by making a paths between successive
    // rooms in the sequence.
    for (int i = 1, j = 0; i < ROOM_COUNT; j = i++) {
        int this_x = get_room_x(i + seed), this_y = get_room_y(i + seed);
        int next_x = get_room_x(j + seed), next_y = get_room_y(j + seed);
        make_path(this_x, this_y, next_x, next_y);
    }

    // Rescale the map to its full size.
    #define MINI_W (MAP_W / MAP_DIVISOR)
    #define MINI_H (MAP_H / MAP_DIVISOR)
    for (int y = MINI_H - 1; y >= 0; y--)
    for (int x = MINI_W - 1; x >= 0; x--)
        fill_rect(x * MAP_DIVISOR, y + MAP_DIVISOR, (x + 1) * MAP_DIVISOR - 1, (y + 1) * MAP_DIVISOR - 1, map_get(x, y));
}
