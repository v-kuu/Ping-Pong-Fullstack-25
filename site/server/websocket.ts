// server/websocket.ts

Bun.serve({
    port: 3001,
    fetch(req, server) {
        // upgrade the request to a WebSocket
        if (server.upgrade(req)) {
            return;
        }
        return new Response("WebSocket server");
    },
    websocket: {
        message(ws, message) {
            console.log("Received", message)
            ws.send("Hello clinet");
        },
        open(ws) {
            console.log("Client connected")
        },
        close(ws, code, message) {
            console.log("Client disconnected")
        },
    },
});

console.log("WebSocket server running on ws://localhost:3001");
