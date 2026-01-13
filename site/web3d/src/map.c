#include "web3d.h"

// The range of sizes used when generating rooms.
#define MIN_ROOM_SIZE 3
#define MAX_ROOM_SIZE 7

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

// Check if map coordinates (x, y) lie inside of the map.
bool map_inside(int x, int y)
{
    return 0 <= x && x < MAP_W
        && 0 <= y && y < MAP_H;
}

// Get the tile value at map coordinates (x, y). Returns -1 for coordinates that
// lie outside of the map.
int map_get(int x, int y)
{
    return map_inside(x, y) ? map[x + y * MAP_W] : -1;
}

// Set the tile value at map coordinates (x, y). Coordinates outside the map are
// silently ignored.
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

// Get the x-coordinate of the top/left corner of a room.
static int get_room_x0(size_t room_index)
{
    return random_hash_x(room_index, MAP_W - MAX_ROOM_SIZE / 2);
}

// Get the y-coordinate of the top/left corner of a room.
static int get_room_y0(size_t room)
{
    return random_hash_y(room, MAP_H - MAX_ROOM_SIZE / 2);
}

// Get the x-coordinate of the bottom/right corner of a room.
static int get_room_x1(size_t room)
{
    int w = MIN_ROOM_SIZE + random_hash_x(room, MAX_ROOM_SIZE - MIN_ROOM_SIZE);
    return get_room_x0(room) + w;
}

// Get the x-coordinate of the bottom/right corner of a room.
static int get_room_y1(size_t room)
{
    int h = MIN_ROOM_SIZE + random_hash_y(room, MAX_ROOM_SIZE - MIN_ROOM_SIZE);
    return get_room_y0(room) + h;
}

// Fill the rectangle bounded by (x0, y0) at one corner and (x1, y1) at the
// other corner with a specific tile value.
static void fill_rect(int x0, int y0, int x1, int y1, char value)
{
    for (int y = y0; y <= y1; y++)
    for (int x = x0; x <= x1; x++)
        map_set(x, y, value);
}

// Generate empty tiles for the floor of a room.
static void make_room_floor(size_t index)
{
    int x0 = get_room_x0(index), x1 = get_room_x1(index);
    int y0 = get_room_y0(index), y1 = get_room_y1(index);
    fill_rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 0);
}

// Generate slightly higher cost tiles for the walls of a room.
static void make_room_walls(size_t index)
{
    int x0 = get_room_x0(index), x1 = get_room_x1(index);
    int y0 = get_room_y0(index), y1 = get_room_y1(index);
    fill_rect(x0, y0, x1, y1, DOOR_COST);
}

// Generate very high cost tiles for the corners of a room.
static void make_room_corners(size_t index)
{
    int x0 = get_room_x0(index), x1 = get_room_x1(index);
    int y0 = get_room_y0(index), y1 = get_room_y1(index);
    map_set(x0, y0, CORNER_COST);
    map_set(x1, y0, CORNER_COST);
    map_set(x0, y1, CORNER_COST);
    map_set(x1, y1, CORNER_COST);
}

// For a room index, find the index of the closest room in the sequence.
static int get_closest_room(int i)
{
    int closest_index = i;
    int closest_dist = INT_MAX;
    int ix = map_room_x(i);
    int iy = map_room_y(i);
    for (int j = 0; j < MAP_ROOMS; j++) {
        int jx = map_room_x(j), dx = jx - ix;
        int jy = map_room_y(j), dy = jy - iy;
        int dist = dx * dx + dy * dy;
        if (i != j && dist < closest_dist) {
            closest_dist = dist;
            closest_index = j;
        }
    }
    return closest_index;
}

// Get the x-coordinate of the center of a room.
int map_room_x(size_t room_index)
{
    return (get_room_x0(room_index) + get_room_x1(room_index)) / 2;
}

// Get the y-coordinate of the center of a room.
int map_room_y(size_t room_index)
{
    return (get_room_y0(room_index) + get_room_y1(room_index)) / 2;
}

// Generate a random map.
void map_generate(void)
{
    // Fill the map with solid tiles.
    memset(map, TUNNEL_COST, sizeof(map));

    // Generate random rooms. It's important to create all room walls before the
    // floors are generated; otherwise disconnected "islands" can be created
    // where rooms overlap.
    for (size_t i = 0; i < MAP_ROOMS; i++)
        make_room_walls(i);
    for (size_t i = 0; i < MAP_ROOMS; i++)
        make_room_corners(i);
    for (size_t i = 0; i < MAP_ROOMS; i++)
        make_room_floor(i);

    // Connect each room to its closest neighbor. This creates tunnels taking
    // the shortest and most natural path between rooms.
    for (size_t i = 0; i < MAP_ROOMS; i++) {
        int next = get_closest_room(i);
        int this_x = map_room_x(i);
        int this_y = map_room_y(i);
        int next_x = map_room_x(next);
        int next_y = map_room_y(next);
        make_path(this_x, this_y, next_x, next_y);
    }

    // Make paths connecting all rooms in sequence. This ensures that the entire
    // map is always connected.
    for (size_t i = 1, j = 0; i < MAP_ROOMS; j = i++) {
        int this_x = map_room_x(i);
        int this_y = map_room_y(i);
        int next_x = map_room_x(j);
        int next_y = map_room_y(j);
        make_path(this_x, this_y, next_x, next_y);
    }
}
