// server/websocket.ts

// Open websocket with "bun run server/websocket.ts"

import type { ServerWebSocket } from "bun";
import { recordMatch } from "../utils/recordMatch.ts";
import { NullEngine, Scene } from "@babylonjs/core";
import { createSession } from "../utils/server/babylon_createsession.ts";
import { setState } from "@/utils/server/babylon_serverstates.ts"
import { GameState, Globals, ServerVars } from "../utils/shared/babylon_globals.ts";
import { AI_moves, AI_moves_one } from "../utils/server/AI_opponent.ts";
import { unauthorized } from "@/utils/site/apiHelpers.ts";

interface PlayerData {
    playerId: string;
    index?: number;
    room?: string;
}

const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;
let lastTick = Date.now();
let newMatch, ai = true;
const clients = new Set<ServerWebSocket<unknown>>();
let playerQueue = [];
var engine = new NullEngine();
var scene = createSession(engine);
let playerOne, playerTwo, disconnectedPlayer = 0;

engine.runRenderLoop(function () {
      scene.render();
});

setInterval(gameTick, TICK_INTERVAL);

Bun.serve({
    port: 3001,
    // process.env.PRODUCTION === "true" ?
    //   tls: {
    //     key: Bun.file(process.env.PONG_KEY_PATH),
    //     cert: Bun.file(process.env.PONG_CERT_PATH),
    //   },
    // :
    fetch(req, server) {
        const url = new URL(req.url)
        const playerId = +url.searchParams.get("id");
        if (url.pathname === "/ws" && playerId) {
            server.upgrade(req, {
                data: {
                    playerId,
                }
            })
            return;
        }
        return unauthorized();
    },
    websocket: {
        message(ws, msg) {
            const data = JSON.parse(msg);
            const playerIdx = ws.data.playerId;

            if (data.type === "move") {
                if (playerIdx === playerOne) {
                    Globals.player1KeyUp = data.keys.includes("w");
                    Globals.player1KeyDown = data.keys.includes("s");
                }
                else if (playerIdx === playerTwo) {
                    Globals.player2KeyUp = data.keys.includes("w");
                    Globals.player2KeyDown = data.keys.includes("s");
                }
            }
        },
        open(ws) {
            ws.data.index = clients.size;
            clients.add(ws)
            if (ws.data.playerId === disconnectedPlayer) {
              disconnectedPlayer = 0;
              playerOne ? playerTwo = ws.data.playerId : playerOne = ws.data.playerId;
              console.log(`Client ${ws.data.playerId} reconnected. Total:`, clients.size);
            } else {
              playerQueue.push(ws.data.playerId);
              console.log(`Client ${ws.data.playerId} connected. Total:`, clients.size);
            }
        },
        close(ws) {
            if (playerOne === ws.data.playerId) {
              playerOne = 0;
              disconnectedPlayer = ws.data.playerId;
            } else if (playerTwo === ws.data.playerId) {
              playerTwo = 0;
              disconnectedPlayer = ws.data.playerId;
            } else {
              playerQueue = playerQueue.filter(id => id !== ws.data.playerId);
            }
            clients.delete(ws)
            console.log(`Client ${ws.data.playerId} disconnected. Total:`, clients.size);
        },
    },
});

console.log("WebSocket server running on http://localhost:3001/ws");

function gameTick() {
  const now = Date.now();
  lastTick = now;

  if (!handleState()) return;

  const ballMesh = scene.getMeshByName("ball");
  const p1Mesh = scene.getMeshByName("player1");
  const p2Mesh = scene.getMeshByName("player2");

	ServerVars.ballPos.copyFrom(ballMesh.position);
	ServerVars.p1Pos.copyFrom(p1Mesh.position);
	ServerVars.p2Pos.copyFrom(p2Mesh.position);

  const posSyncData = JSON.stringify({
      type: "physics_sync",
      ServerState: ServerVars,
  });

  for (const ws of clients) {
      try {
          ws.send(posSyncData);
      } catch (e) {
          console.error("Failed to send message:", e)
      }
  }
}

function freshMatch() {
  ServerVars.p1Pos.setAll(0)
  ServerVars.p2Pos.setAll(0)
  ServerVars.score1 = 0
  ServerVars.score2 = 0
  ServerVars.currentState = GameState.WaitingPlayers
}

async function winnerTakesItAll() {
  await recordMatch({
      game: "pong",
      playerIds: [playerOne, playerTwo],
      scores: [ServerVars.score1, ServerVars.score2],
  });

  if (playerDisconnected()) {
    playerOne
    ? playerTwo = playerQueue.shift()
    : playerOne = playerQueue.shift();
  } else if (ServerVars.score1 > ServerVars.score2) {
    playerQueue.push(playerTwo);
    playerTwo = playerQueue.shift();
  } else {
    playerQueue.push(playerOne);
    playerOne = playerQueue.shift();
  }

}

function playerDisconnected() {
  return !(playerOne && playerTwo);
}

function handleState() : boolean {
  if (ServerVars.currentState === GameState.GameOver && newMatch) {
    winnerTakesItAll();
    newMatch = false;
  } else if (clients.size === 0) {
   	ServerVars.GameState = GameState.WaitingPlayers;
    newMatch = true;
    return false;
  } else if (clients.size === 1 || playerDisconnected()) {
    playerOne ? AI_moves(scene) : AI_moves_one(scene);
    ai = true;
    if (newMatch) playerOne ? playerTwo = playerQueue.shift() : playerOne = playerQueue.shift();
    newMatch = false;
  } else if (clients.size >= 2 && !newMatch) {
    newMatch = true;
    if (ai) playerTwo ? playerOne = playerQueue.shift() : playerTwo = playerQueue.shift();
    ai = false;
    freshMatch();
  }
  return true;
}