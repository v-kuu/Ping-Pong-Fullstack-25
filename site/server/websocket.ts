// server/websocket.ts

// Open websocket with "bun run server/websocket.ts"

import type { ServerWebSocket } from "bun";
import { NullEngine, Scene } from "@babylonjs/core";
import { createSession } from "../utils/server/babylon_createsession.ts"
import { Globals } from "../utils/shared/babylon_globals.ts"

interface PlayerData {
    playerId: string;
    index?: number;
	room?: string;
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
			const playerIdx = ws.data.index;

            if (data.type === "move")
                if (playerIdx === 0) {
					if (data.direction === "up")
					Globals.player1KeyUp = true;
					else if (data.direction === "down")
					Globals.player1KeyDown = true;
				}
                else if (playerIdx === 1) {
					if (data.direction === "up")
					Globals.player2KeyUp = true;
					else if (data.direction === "down")
					Globals.player2KeyDown = true;
				}
                // console.log(`Player ${ws.data.playerId} moved ${data.direction} -> pos=${ws.data.pos}`);
        },
        open(ws) {
            clients.add(ws)
			if (clients.size === 1)
				ws.data.index = 0;
			else if (clients.size === 2)
				ws.data.index = 1;
			else
				ws.data.index = 99;

			console.log(`Player connected at Index: ${ws.data.index}`);
            console.log("Client connected. Total:", clients.size)
        },
        close(ws) {
            clients.delete(ws)
			console.log(`Player disconnected at Index: ${ws.data.index}`);
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

	const ballMesh = scene.getMeshByName("ball");
	const p1Mesh = scene.getMeshByName("player1");
	const p2Mesh = scene.getMeshByName("player2");
	const score1 = Globals.score1;
	const score2 = Globals.score2;

	const posSyncData = JSON.stringify({
		type: "physics_sync",
		ballVel: ballMesh?.position,
		vel1: p1Mesh?.position,
		vel2: p2Mesh?.position,
		score1: score1,
		score2: score2,
	});

    for (const ws of clients) {
        try {
            ws.send(posSyncData);
        } catch (e) {
            console.error("Failed to send message:", e)
        }
    }

    setTimeout(gameTick, TICK_INTERVAL)
	// console.log("Ball pos x:", Globals.ballVel._x, ", y: ", Globals.ballVel._y, ", z: ", Globals.ballVel._z)
	// console.log("P1 paddle pos z:", p1Mesh?.position._z)
	// console.log("P2 paddle pos z:", p2Mesh?.position._z)
}

gameTick();

console.log("WebSocket server running on http://localhost:3001/ws");
