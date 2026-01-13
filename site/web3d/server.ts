import type { ServerWebSocket } from "bun";

// Server configuration.
const PORT = 3002; // Port used for the server.
const MAX_PLAYERS = 8; // Maximum number of connected players.

// Per-client data tracked by the server.
interface PlayerData {
    id: number;
}

// server state.
let clientIdCounter = 0; // Counter used for assigning client IDs.
let gameSeed = Date.now(); // Seed used for the current game.
let gemMask = 0n; // Bit mask of gems that have been collected.
const clients = new Array<ServerWebSocket<PlayerData>>(MAX_PLAYERS);

// Broadcast a message to all clients.
const broadcastMessage = message => {
    for (const client of clients) {
        if (client !== undefined) {
            try {
                client.send(message);
            } catch (exception) {
                console.error("Failed to send message:", exception)
            }
        }
    }
};

// Handle a player movement message from a client.
function handleMoveMessage(message: Buffer) {
    broadcastMessage(message);
}

// Handle a gem collect message from a client.
function handleCollectMessage(message: Buffer) {
    const gemIndex = message.readUint32BE(8);
    const gemBit = 1n << BigInt(gemIndex);
    if (!(gemMask & gemBit)) {
        gemMask |= gemBit; // Mark the gem as collected.
        broadcastMessage(message);
    }
}

// Handle a message from a client to the server.
function handleMessage(message: Buffer, playerId: number) {
    const type = message.readUint32BE(0);
    message.writeUint32BE(playerId, 4);
    switch (type) {
        case 2: return handleMoveMessage(message);
        case 3: return handleCollectMessage(message);
        default: return console.log(`Unrecognized message type: ${type}`);
    }
}

// Start the WebSocket server.
const server = Bun.serve({
    port: PORT,

    fetch(request, server) {
        if (new URL(request.url).pathname === "/web3d") {
            server.upgrade(request, {data: {id: ++clientIdCounter}});
            return;
        }
        return new Response("WebSocket server");
    },

    websocket: {

        // Handle client → server messages.
        message(socket, message) {
            if (clients.includes(socket))
                handleMessage(message, socket.data.id);
        },

        // Handle client connection.
        open(socket) {
            for (const index of clients.keys()) {
                if (clients[index] === undefined) {
                    clients[index] = socket;
                    console.log(`Client #${socket.data.id} connected from ${socket.remoteAddress}`)

                    // Send the first "join" message.
                    const buffer = Buffer.allocUnsafe(16);
                    buffer.writeUint32BE(0, 0);
                    buffer.writeUint32BE(socket.data.id, 4);
                    buffer.writeBigUint64BE(gemMask, 8);
                    socket.send(buffer);

                    // Send "join" messages for other clients.
                    for (const other of clients) {
                        if (other !== socket && other !== undefined) {
                            const buffer = Buffer.allocUnsafe(16);
                            buffer.writeUint32BE(0, 0);
                            buffer.writeUint32BE(other.data.id, 4);
                            socket.send(buffer);

                            buffer.writeUint32BE(socket.data.id, 4);
                            other.send(buffer);
                        }
                    }
                    break;
                }
            }
            // TODO: Handle too many clients.
        },

        // Handle client disconnection.
        close(socket) {

            // Remove the client from the array.
            const index = clients.indexOf(socket);
            if (index !== -1) {
                clients[index] = undefined;
                console.log(`Client #${socket.data.id} disconnected`)
            }

            // Broadcast a "leave" message to other clients.
            const buffer = Buffer.allocUnsafe(8);
            buffer.writeUint32BE(1, 0);
            buffer.writeUint32BE(socket.data.id, 4);
            broadcastMessage(buffer);
        },
    },
});

console.log(`Web3D server running at ${server.url}`);
