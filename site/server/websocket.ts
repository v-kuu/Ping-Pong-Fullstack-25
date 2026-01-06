// server/websocket.ts
import type { ServerWebSocket } from "bun";

const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

const clients = new Set<ServerWebSocket<unknown>>();

Bun.serve({
    port: 3001,
    fetch(req, server) {
        const url = new URL(req.url)

        if (url.pathname === "/ws" && server.upgrade(req, {
            data: {
                playerId: "abc123"
            }
        })) {
            return;
        }
        return new Response("WebSocket server");
    },
    websocket: {
        message(ws) {},
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

let lastTick = Date.now();
let pos = 0;

function gameTick() {
    const now = Date.now()
    const delta = (now - lastTick) / 1000
    lastTick = now

    pos = (pos + delta) % 100

    for (const ws of clients) {
        try {
            const countMsg = JSON.stringify({ type: "count", clients: clients.size });
            const posMsg = JSON.stringify({ type: "position", position: pos });
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
