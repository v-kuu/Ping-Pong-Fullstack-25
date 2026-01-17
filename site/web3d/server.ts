import type { ServerWebSocket } from "bun";

enum MessageType {
    Join = 0,
    Quit,
    Status,
    Move,
    Collect,
    Catch,
}

// Server configuration.
const PORT = 3002; // Port used for the server.
const ROUND_DELAY = 10; // Delay between rounds, in seconds.
const MAX_GEMS = 50n; // Gems to collect per round.
const ALL_GEMS = (1n << MAX_GEMS) - 1n; // Bit mask for all gems.

// server state.
const clients = new Set<ServerWebSocket>;
let clientIdCounter = 0; // Counter used for assigning client IDs.
let startTime = Date.now(); // Time of the start of the game (and also the RNG seed).
let gemMask = ALL_GEMS; // Bit mask of gems that have been collected.
let ghostId = 0; // Client ID of the current ghost.

// Send a message to a client.
function sendMessage(client: ServerWebSocket, ...args: number[]) {
    client.sendBinary(new Float64Array([...args]));
}

// Repeat a message for all connected clients.
function repeatMessage(message: Float64Array) {
    for (const client of clients)
        client.sendBinary(message);
}

// Broadcast a message to all connected clients.
function broadcastMessage(...args: number[]) {
    repeatMessage(new Float64Array([...args]));
}

// Handle a player movement message from a client.
function handleMoveMessage(message: Float64Array) {
    repeatMessage(message);
}

// Notify all connected clients that a new round is starting.
function startNewRound() {
    startTime = Date.now() + ROUND_DELAY * 1000;
    gemMask = 0n;
    console.log("Starting a new round");
    for (const client of clients)
        sendMessage(client, MessageType.Status, client.id, ghostId, startTime, 0);
}

// Handle a gem collect message from a client.
function handleCollectMessage(message: Float64Array) {
    const gemIndex = message[2];
    const gemBit = 1n << BigInt(gemIndex)
    if (!(gemMask & gemBit)) { // Check that the gem hasn't been collected yet.
        gemMask |= gemBit; // Mark the gem as collected.
        repeatMessage(message); // Let clients know the gem was collected.
    }

    // Start a new round when all gems have been collected.
    if (gemMask === ALL_GEMS && clients.size > 1)
        startNewRound();
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
        message(client: ServerWebSocket, data: Buffer) {
            const message = new Float64Array(data.buffer);
            const type = message[0];
            message[1] = client.id; // Set the playerId.
            switch (type) {
                case MessageType.Move: return handleMoveMessage(message);
                case MessageType.Collect: return handleCollectMessage(message);
                default: return console.log(`Unrecognized message type: ${type}`);
            }
        },

        // Handle client connection.
        open(client: ServerWebSocket) {
            const secondPlayerJoined = clients.size === 1;
            client.id = ++clientIdCounter;
            console.log("Client", client.id, "connected from", client.remoteAddress);
            clients.add(client);
            for (const other of clients)
                sendMessage(client, MessageType.Join, other.id);
            sendMessage(client, MessageType.Status, client.id, ghostId, startTime, Number(gemMask));
            broadcastMessage(MessageType.Join, client.id);
            if (secondPlayerJoined && gemMask == ALL_GEMS)
                startNewRound();
        },

        // Handle client disconnection.
        close(client: ServerWebSocket) {
            console.log("Client", client.id, "disconnected");
            clients.delete(client);
            broadcastMessage(MessageType.Quit, client.id);
        },
    },
});

console.log(`Web3D server running at ${server.url}`);
