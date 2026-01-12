// server/websocket.ts

// Open websocket with "bun run server/websocket.ts"

import type { ServerWebSocket } from "bun";
import { NullEngine, Scene } from "@babylonjs/core";
import { createSession } from "../utils/server/babylon_createsession.ts"
import { Globals } from "../utils/shared/babylon_globals.ts"

interface PlayerData {
    playerId: string;
    pos: number;
}

const clients = new Set<ServerWebSocket<unknown>>();

var engine = new NullEngine();
var scene = createSession(engine);
engine.runRenderLoop(function (){
	scene.render();
});

Bun.serve({
    port: 3001,
    fetch(req, server) {
        const url = new URL(req.url)

        if (url.pathname === "/ws") {
            const playerId = crypto.randomUUID();
            server.upgrade(req, {
                data: {
                    playerId,
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
                if (data.direction === "up") {
					Globals.playerKeyUp = true;
				}
                if (data.direction === "down") {
					Globals.playerKeyDown = true;
				}
                // console.log(`Player ${ws.data.playerId} moved ${data.direction} -> pos=${ws.data.pos}`);
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

const TICK_RATE = 1;
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

	console.log("Game state now:", Globals.playerKeyDown)
}

gameTick();

console.log("WebSocket server running on http://localhost:3001/ws");
