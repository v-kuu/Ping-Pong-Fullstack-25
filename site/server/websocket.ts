// server/websocket.ts

// Open websocket with "bun run server/websocket.ts"

import type { ServerWebSocket } from "bun";
// import { recordMatch } from "../utils/recordMatch.ts";
import { NullEngine, Scene } from "@babylonjs/core";
import { createSession } from "../utils/server/babylon_createsession.ts";
import { Globals } from "../utils/shared/babylon_globals.ts";
import { AI_moves } from "../utils/server/AI_opponent.ts";

interface PlayerData {
    playerId: string;
    index?: number;
    room?: string;
}

const clients = new Set<ServerWebSocket<unknown>>();

var engine = new NullEngine();
var scene = createSession(engine);
engine.runRenderLoop(function () {
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

            if (data.type === "move") {
                if (playerIdx === 0) {
                    Globals.player1KeyUp = data.keys.includes("w");
                    Globals.player1KeyDown = data.keys.includes("s");
                }
                else if (playerIdx === 1) {
                    Globals.player2KeyUp = data.keys.includes("w");
                    Globals.player2KeyDown = data.keys.includes("s");
                }
            }
        },
        open(ws) {
            clients.add(ws)
            if (clients.size === 1)
                ws.data.index = 0;
            else if (clients.size === 2)
                ws.data.index = 1;
            else
                ws.data.index = 99;

            console.log("Client connected. Total:", clients.size);
        },
        close(ws) {
            clients.delete(ws)
            console.log("Client disconnected. Total:", clients.size);
        },
    },
});

const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastTick = Date.now();

function gameTick() {
    const now = Date.now();
    lastTick = now;

    const ballMesh = scene.getMeshByName("ball");
    const p1Mesh = scene.getMeshByName("player1");
    const p2Mesh = scene.getMeshByName("player2");

    if (clients.size < 2)
        AI_moves(scene);

    const posSyncData = JSON.stringify({
        type: "physics_sync",
        ballVel: ballMesh?.position,
        ballDelta: Globals.ballDelta,
        vel1: p1Mesh?.position,
        vel2: p2Mesh?.position,
        score1: Globals.score1,
        score2: Globals.score2,
        currentState: Globals.currentState,
    });

    for (const ws of clients) {
        try {
            ws.send(posSyncData);
        } catch (e) {
            console.error("Failed to send message:", e)
        }
    }

    // if (Globals.score1 >= 11 || Globals.score2 >= 11) {
    //     // const p1Token = Array.from(clients).find(c => c.data.index === 0)?.data.playerId;
    //     // const p2Token = Array.from(clients).find(c => c.data.index === 1)?.data.playerId;
    //     
    //     // // TODO: Map session tokens to User IDs through DB/Session lookups
    //     // // await recordMatch({
    //     // //    game: "pong",
    //     // //    playerIds: [p1Token, p2Token], 
    //     // //    scores: [Globals.score1, Globals.score2],
    //     // //    winnerId: Globals.score1 > Globals.score2 ? p1Token : p2Token
    //     // // });
    //     
    //     // Globals.score1 = 0; 
    //     // Globals.score2 = 0;
    //     // Globals.ballDelta.setAll(0);
    // }

    setTimeout(gameTick, TICK_INTERVAL)
}

gameTick();

console.log("WebSocket server running on http://localhost:3001/ws");
