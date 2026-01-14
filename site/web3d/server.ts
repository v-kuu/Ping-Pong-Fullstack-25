import type { ServerWebSocket } from "bun";

enum MessageType {
    Join = 0,
    Quit,
    Move,
    Collect,
    Catch,
}

// Server configuration.
const PORT = 3002; // Port used for the server.

// server state.
const clients = new Set<ServerWebSocket>;
let clientIdCounter = 0; // Counter used for assigning client IDs.
let gameSeed = Date.now(); // Seed used for the current game.
let gemMask = 0n; // Bit mask of gems that have been collected.

// Send a message to a client.
function sendMessage(socket: ServerWebSocket, ...args: number[]) {
    socket.sendBinary(new Float64Array([...args]));
}

// Broadcast a message to all connected clients.
function broadcastMessage(...args: number[]) {
    const message = new Float64Array([...args]);
    for (const client of clients)
        client.sendBinary(message);
}

// Repeat a message for all connected clients.
function repeatMessage(message: Float64Array) {
    for (const client of clients)
        client.sendBinary(message);
}

// Handle a player movement message from a client.
function handleMoveMessage(message: Float64Array) {
    repeatMessage(message);
}

// Handle a gem collect message from a client.
function handleCollectMessage(message: Float64Array) {
    const gemIndex = message[2];
    const gemBit = 1n << BigInt(gemIndex)
    if (!(gemMask & gemBit)) {
        gemMask |= gemBit; // Mark the gem as collected.
        repeatMessage(message);
    }
}

// Start the WebSocket server.
const server = Bun.serve({
    port: PORT,

    // Handle connections to the WebSocket endpoint.
    fetch(request: Request, server) {
        if (new URL(request.url).pathname === "/web3d") {
            server.upgrade(request);
            return;
        }
        return new Response("WebSocket server");
    },

    websocket: {

        // Handle client → server messages.
        message(socket: ServerWebSocket, data: Buffer) {
            const message = new Float64Array(data.buffer);
            const type = message[0];
            message[1] = socket.id; // Set the playerId.
            switch (type) {
                case 2: return handleMoveMessage(message);
                case 3: return handleCollectMessage(message);
                default: return console.log(`Unrecognized message type: ${type}`);
            }
        },

        // Handle client connection.
        open(socket: ServerWebSocket) {
            socket.id = ++clientIdCounter;
            console.log("Client", socket.id, "connected from", socket.remoteAddress);
            clients.add(socket);
            sendMessage(socket, MessageType.Join, socket.id, Number(gemMask));
            for (const other of clients) {
                if (other !== socket) {
                    sendMessage(socket, MessageType.Join, other.id, 0);
                    sendMessage(other, MessageType.Join, socket.id, 0);
                }
            }
        },

        // Handle client disconnection.
        close(socket: ServerWebSocket) {
            console.log("Client", socket.id, "disconnected");
            clients.delete(socket);
            broadcastMessage(MessageType.Quit, socket.id);
        },
    },
});

console.log(`Web3D server running at ${server.url}`);
