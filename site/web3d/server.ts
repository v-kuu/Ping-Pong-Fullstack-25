import type { ServerWebSocket } from "bun";
// import { recordMatch } from "../utils/recordMatch.ts";

enum MessageType {
    Join = 0,
    Quit,
    Begin,
    Count,
    End,
    Move,
    Collect,
    Catch,
}

// Server configuration.
const PORT = 3002; // Port used for the server.
const MATCH_COUNTDOWN = 5; // Length of countdown for a match, in seconds.
const MAX_GEMS = 50n; // Gems to collect per match.
const ALL_GEMS = (1n << MAX_GEMS) - 1n; // Bit mask for all gems.
const MAX_PLAYER_NAME = 32; // Maximum player name length.

// server state.
const clients = new Set<ServerWebSocket>; // Currently connected clients.
let players = new Set<ServerWebSocket>; // Players in the current match.
let clientIdCounter = 0; // Counter used for assigning client IDs.
let startTime = Date.now(); // Time of the start of the game (and also the RNG seed).
let nextMatchTimer = 0; // Timer ID for the start of the next match.
let nextMatch = startTime; // Timestamp for the start of the next match.
let gemMask = 0n; // Bit mask of gems that have not been collected.
let ghostId = 0; // Client ID of the current ghost.

// Count the number of ones in the binary representation of a BigInt.
function countBitsSet(value: BigInt): number {
    let count = 0;
    while (value !== 0n) {
        count += Number(value & 1n);
        value >>= 1n;
    }
    return count;
}

// Send a join message.
function sendJoinMessage(recipient: ServerWebSocket, joined: ServerWebSocket) {
    const name = joined.name.slice(0, MAX_PLAYER_NAME - 1);
    const data = Buffer.allocUnsafe(56);
    data.writeDoubleLE(MessageType.Join, 0);
    data.writeDoubleLE(joined.id, 8);
    data.writeDoubleLE(joined.score, 16);
    data.write(name, 24);
    data.writeUInt8(0, 24 + name.length);
    recipient.sendBinary(data);
}

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

// Start a new match.
function startMatch() {
    nextMatchTimer = 0;
    startTime = Date.now();
    gemMask = ALL_GEMS;
    for (const client of clients) {
        client.score = 0;
        sendMessage(client, MessageType.Begin, client.id, ghostId, startTime, Number(gemMask));
    }
    console.log("A new match started!");
}

// End a match.
function endMatch() {
    // TODO: Update scores using the `players` set here.
    players = new Set(clients);
    broadcastMessage(MessageType.End);
    gemMask = 0n;
    console.log("The match ended!");
}

// Begin the countdown for the next match.
function beginCountdown() {
    if (nextMatchTimer === 0) {
        nextMatch = Date.now() + MATCH_COUNTDOWN * 1000;
        broadcastMessage(MessageType.Count, nextMatch);
        nextMatchTimer = setTimeout(startMatch, MATCH_COUNTDOWN * 1000);
        console.log("Starting a new match in", MATCH_COUNTDOWN, "seconds");
    }
}

// Handle a gem collect message from a client.
function handleCollectMessage(client: ServerWebSocket, message: Float64Array) {
    const gemIndex = message[2];
    const gemBit = 1n << BigInt(gemIndex);
    if ((gemMask & gemBit) && Date.now() >= startTime + 1000) {
        client.score++;
        gemMask &= ~gemBit; // Mark the gem as collected.
        broadcastMessage(MessageType.Collect, client.id, gemIndex, client.score);
    }

    // Start a new match when all gems have been collected.
    if (gemMask === 0n && clients.size > 1) {
        console.log("All gems were collected!");
        endMatch();
        beginCountdown();
    }

    /*
    // Start a new round when all gems have been collected.
    if (gemMask === ALL_GEMS && clients.size > 1) {
        const playerIds = Array.from(clients).map(c => c.id); // Assuming c.id maps to User ID
        const scores = Array.from(clients).map(c => c.score);
        // Find winner (highest score)
        const winnerId = Array.from(clients).sort((a, b) => b.score - a.score)[0].id;

        await recordMatch({
            game: "web3d",
            playerIds,
            scores,
            winnerId
        });

        startNewRound();
    }
    */
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
                case MessageType.Collect: return handleCollectMessage(client, message);
                default: return console.log(`Unrecognized message type: ${type}`);
            }
        },

        // Handle client connection.
        open(client: ServerWebSocket) {
            const secondPlayerJoined = clients.size === 1;
            client.id = ++clientIdCounter;
            client.score = 0;
            client.name = "player" + client.id; // TODO: Query from DB.
            console.log(client.name, "connected from", client.remoteAddress);
            clients.add(client);
            players.add(client);
            for (const other of players)
                sendJoinMessage(client, other);
            sendMessage(client, MessageType.Begin, client.id, ghostId, startTime, Number(gemMask));
            for (const other of clients)
                if (other !== client)
                    sendJoinMessage(other, client);
            if (secondPlayerJoined && gemMask === 0n)
                beginCountdown();
        },

        // Handle client disconnection.
        close(client: ServerWebSocket) {
            console.log(client.name, "disconnected");
            clients.delete(client);
            if (nextMatchTimer !== 0)
                players.delete(client);
            broadcastMessage(MessageType.Quit, client.id);

            // When there's only one player left...
            if (clients.size === 1) {

                // If a game was about to start, cancel it.
                if (nextMatchTimer !== 0) {
                    console.log("Only one player left, match cancelled!");
                    clearTimeout(nextMatchTimer);
                    nextMatchTimer = 0;

                // Otherwise, the remaining player receives all remaining gems.
                } else {
                    console.log("All but one player left, match ends!");
                    const lastPlayer = clients.values().next().value;
                    lastPlayer.score += countBitsSet(gemMask);
                    broadcastMessage(MessageType.Collect, lastPlayer.id, -1, lastPlayer.score);
                    endMatch();
                }
            }

            // When all players leave, reset the game completely.
            if (clients.size === 0) {
                if (nextMatchTimer !== 0) {
                    console.log("All players disconnected!");
                    clearTimeout(nextMatchTimer);
                    nextMatchTimer = 0;
                }
                players.clear();
                gemMask = 0n;
            }
        },
    },
});

console.log(`Web3D server running at ${server.url}`);
