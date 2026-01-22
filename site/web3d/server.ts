import type { ServerWebSocket } from "bun";
import { recordMatch } from "../utils/recordMatch.ts";

enum MessageType {
    Join = 0,
    Quit,
    Begin,
    Count,
    End,
    Move,
    Collect,
}

// Server configuration.
const PORT = 3002; // Port used for the server.
const MATCH_COUNTDOWN = 5; // Length of countdown for a match, in seconds.
const MAX_GEMS = 50n; // Gems to collect per match.
const ALL_GEMS = (1n << MAX_GEMS) - 1n; // Bit mask for all gems.
const MAX_PLAYER_NAME = 32; // Maximum player name length.

// server state.
type Player = ServerWebSocket;
const clients = new Set<Player>; // Currently connected clients.
let players = new Set<Player>; // Players in the current match.
let clientIdCounter = 0; // Counter used for assigning client IDs.
let startTime = Date.now(); // Time of the start of the game (and also the RNG seed).
let nextMatchTimer = 0; // Timer ID for the start of the next match.
let nextMatch = startTime; // Timestamp for the start of the next match.
let gemMask = 0n; // Bit mask of gems that have not been collected.

// Count the number of ones in the binary representation of a BigInt.
function countBitsSet(value: BigInt): number {
    let count = 0;
    while (value !== 0n) {
        count += Number(value & 1n);
        value >>= 1n;
    }
    return count;
}

function sendJoinMessage(target: Player, source: Player) {
    const message = Buffer.allocUnsafe(8 + MAX_PLAYER_NAME);
    message.writeUInt32LE(MessageType.Join, 0);
    message.writeUInt32LE(source.id, 4);
    message.writeUInt32LE(source.score, 8);
    message.write(source.name.slice(0, MAX_PLAYER_NAME - 1) + "\0", 12);
    target.sendBinary(message);
}

function sendQuitMessage(target: Player, source: Player) {
    const message = Buffer.allocUnsafe(8);
    message.writeUInt32LE(MessageType.Quit, 0);
    message.writeUInt32LE(source.id, 4);
    target.sendBinary(message);
}

function sendBeginMessage(target: Player) {
    const message = Buffer.allocUnsafe(24);
    message.writeUInt32LE(MessageType.Begin, 0);
    message.writeUInt32LE(target.id, 4);
    message.writeDoubleLE(startTime, 8);
    message.writeBigUInt64LE(gemMask, 16);
    target.sendBinary(message);
}

function sendCountMessage(target: Player) {
    const message = Buffer.allocUnsafe(16);
    message.writeUInt32LE(MessageType.Count, 0);
    message.writeUInt32LE(target.id, 4);
    message.writeDoubleLE(nextMatch, 8);
    target.sendBinary(message);
}

function sendEndMessage(target: Player) {
    const message = Buffer.allocUnsafe(8);
    message.writeUInt32LE(MessageType.End, 0);
    message.writeUInt32LE(target.id, 4);
    target.sendBinary(message);
}

function sendMoveMessage(target: Player, source: Player, coords: Float32Array) {
    const [x, y, dx, dy] = coords;
    const message = Buffer.allocUnsafe(24);
    message.writeUInt32LE(MessageType.Move, 0);
    message.writeUInt32LE(source.id, 4);
    message.writeFloatLE(x, 8);
    message.writeFloatLE(y, 12);
    message.writeFloatLE(dx, 16);
    message.writeFloatLE(dy, 20);
    target.sendBinary(message);
}

function sendCollectMessage(target: Player, source: Player, gemIndex: number) {
    const message = Buffer.allocUnsafe(16);
    message.writeUInt32LE(MessageType.Collect, 0);
    message.writeUInt32LE(source.id, 4);
    message.writeUInt32LE(source.score, 8);
    message.writeInt32LE(gemIndex, 12);
    target.sendBinary(message);
}

// Start a new match.
function startMatch() {
    nextMatchTimer = 0;
    startTime = Date.now();
    gemMask = ALL_GEMS;
    for (const client of clients) {
        client.score = 0;
        sendBeginMessage(client);
    }
    console.log("A new match started!");
}

// End a match.
function endMatch() {

    // Record the results in the database.
    const playerArray = Array.from(players);
    const playerIds = playerArray.map(p => p.id);
    const scores = playerArray.map(p => p.score);
    recordMatch({game: "web3d", playerIds, scores})
        .catch(error => console.error(error));

    // Notify the clients that the game ended.
    players = new Set(clients);
    for (const player of players)
        sendEndMessage(player);
    gemMask = 0n;
    console.log("The match ended!");
}

// Begin the countdown for the next match.
function beginCountdown() {
    if (nextMatchTimer === 0) {
        nextMatch = Date.now() + MATCH_COUNTDOWN * 1000;
        for (const player of players)
            sendCountMessage(player);
        nextMatchTimer = setTimeout(startMatch, MATCH_COUNTDOWN * 1000);
        console.log("Starting a new match in", MATCH_COUNTDOWN, "seconds");
    }
}

// Start the WebSocket server.
const server = Bun.serve({
    port: PORT,

    // Handle connections to the WebSocket endpoint.
    fetch(request: Request, server) {
        const url = new URL(request.url);
        if (url.pathname === "/web3d") {
            const username = url.searchParams.get("username");
            const id = url.searchParams.get("id");
            server.upgrade(request, {data: {username, id}});
            return;
        }
        return new Response("WebSocket server");
    },

    websocket: {

        // Handle client → server messages.
        message(client: Player, data: Buffer) {
            const type = data.readUInt32LE(0);
            data.writeUInt32LE(client.id, 4);

            // Handle a player movement message.
            if (type === MessageType.Move) {
                const coords = new Float32Array(data.buffer, 8, 4);
                for (const player of players)
                    sendMoveMessage(player, client, coords);

            // Handle a gem collect message.
            } else if (type == MessageType.Collect) {
                const gemIndex = data.readUInt32LE(12);
                const gemBit = 1n << BigInt(gemIndex);
                if ((gemMask & gemBit) && Date.now() >= startTime + 100) {
                    client.score++;
                    gemMask &= ~gemBit;
                    for (const player of players)
                        sendCollectMessage(player, client, gemIndex);
                }

                // Start a new match if all gems were collected.
                if (gemMask === 0n && clients.size > 1) {
                    endMatch();
                    beginCountdown();
                }
            }
        },

        // Handle client connection.
        open(client: Player) {

            // Check that the user is not already connected.
            for (const other of clients) {
                if (other.id === client.data.id) {
                    console.log(`Duplicate login for ${client.data.username}`);
                    return client.close();
                }
            }

            // Add a new client.
            const secondPlayerJoined = clients.size === 1;
            clients.add(client);
            players.add(client);
            client.name = client.data.username;
            client.id = client.data.id;
            client.score = 0;
            console.log(`New login ${client.name} (UID ${client.id})`);

            // Send join and begin messages to the new client.
            for (const other of players)
                sendJoinMessage(client, other);
            sendBeginMessage(client);

            // Send join messages to all other clients.
            for (const other of clients)
                if (other !== client)
                    sendJoinMessage(other, client);

            // If a second player joined, start a new game.
            if (secondPlayerJoined)
                beginCountdown();
            console.log("New connection from", client.remoteAddress);
        },

        // Handle client disconnection.
        close(client: Player) {
            if (!clients.has(client))
                return;
            console.log(client.name, "disconnected");
            clients.delete(client);
            if (nextMatchTimer !== 0)
                players.delete(client);
            for (const player of players)
                sendQuitMessage(player, client);

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
                    sendCollectMessage(lastPlayer, lastPlayer, -1);
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
