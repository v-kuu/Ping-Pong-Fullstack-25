// server/websocket.ts

// Open websocket with "bun run server/websocket.ts"

import type { ServerWebSocket } from "bun";
import { NullEngine } from "@babylonjs/core";

interface PlayerData {
    playerId: string;
    pos: number;
}

const clients = new Set<ServerWebSocket<unknown>>();

var engine = new NullEngine();

Bun.serve({
    port: 3001,
    fetch(req, server) {
        const url = new URL(req.url)

        if (url.pathname === "/ws") {
            const playerId = crypto.randomUUID();
            server.upgrade(req, {
                data: {
                    playerId,
                    pos: 0
                }
                })
            return;
        }
        return new Response("WebSocket server");
    },
    websocket: {
        message(ws, msg) {
            const data = JSON.parse(msg);
            if (data.type === "move")
                if (data.direction === "up")
                    ws.data.pos += 5
                if (data.direction === "down")
                    ws.data.pos -= 5
                console.log(`Player ${ws.data.playerId} moved ${data.direction} -> pos=${ws.data.pos}`);
        },
        open(ws) {
            clients.add(ws)
            console.log("Client connected. Total:", clients.size)
            // console.log(ws.data.playerId)
        },
        close(ws) {
            clients.delete(ws)
            console.log("Client disconnected. Total:", clients.size)
        },
    },
});

const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastTick = Date.now();

function gameTick() {
    const now = Date.now()
    const delta = (now - lastTick) / 1000
    lastTick = now

    const positions: Record<string, number> = {}
    // pos = (pos + delta) % 100

    for (const ws of clients) {
        positions[ws.data.playerId] = ws.data.pos
    }

    for (const ws of clients) {
        try {
            const countMsg = JSON.stringify({ type: "count", clients: clients.size });
            const posMsg = JSON.stringify({ type: "positions", positions: positions });
            ws.send(countMsg);
            ws.send(posMsg);
        } catch (e) {
            console.error("Failed to send message:", e)
        }
    }

    setTimeout(gameTick, TICK_INTERVAL)
}

gameTick();

console.log("WebSocket server running on http://localhost:3001/ws");
