// server/websocket.ts
import type { ServerWebSocket } from "bun";


const clients = new Set<ServerWebSocket<unknown>>();

Bun.serve({
    port: 3001,
    fetch(req, server) {
        const url = new URL(req.url)

        if (url.pathname === "/ws" && server.upgrade(req)) {
            return;
        }
        return new Response("WebSocket server");
    },
    websocket: {
        message(ws) {},
        open(ws) {
            clients.add(ws)
            console.log("Client connected. Total:", clients.size)
        },
        close(ws) {
            clients.delete(ws)
            console.log("Client disconnected. Total:", clients.size)
        },
    },
});

console.log("WebSocket server running on http://localhost:3001/ws");
