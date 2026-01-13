import { Canvas } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";

// @ts-ignore
import {
  draw,
  init,
  recvJoin,
  recvLeave,
  recvMove,
  recvCollect,
  keydown,
  keyup,
  memory,
} from "../web3d/web3d.wasm";

// Send a player movement message from the client to the server.
export function sendMove(socket, x, y, dx, dy) {
  if (socket.readyState === 1) {
    const view = new DataView(new ArrayBuffer(24));
    view.setUint32(0, 2);
    view.setFloat32(8, x);
    view.setFloat32(12, y);
    view.setFloat32(16, dx);
    view.setFloat32(20, dy);
    socket.send(view);
  }
}

// Send a gem collect message from the client to the server.
export function sendCollect(socket, gemIndex) {
  if (socket.readyState === 1) {
    const view = new DataView(new ArrayBuffer(12));
    view.setUint32(0, 3);
    view.setUint32(8, gemIndex);
    socket.send(view);
  }
}

// Relay a player join message from the server to the client.
function handleJoinMessage(message: DataView, playerId: number) {
  const gems = message.getBigUint64(8);
  recvJoin(playerId, gems);
}

// Relay a player leave message from the server to the client.
function handleLeaveMessage(message: DataView, playerId: number) {
  recvLeave(playerId);
}

// Relay a player movement message from the server to the client.
function handleMoveMessage(message: DataView, playerId: number) {
  const x = message.getFloat32(8);
  const y = message.getFloat32(12);
  const dx = message.getFloat32(16);
  const dy = message.getFloat32(20);
  recvMove(playerId, x, y, dx, dy);
}

// Relay a gem collect message from the server to the client.
function handleCollectMessage(message: DataView, playerId: number) {
  const gemIndex = message.getUint32(8);
  recvCollect(playerId, gemIndex);
}

// Relay a message from the server to the client.
function handleMessage(message: DataView) {
  const type = message.getUint32(0);
  const playerId = message.getUint32(4);
  switch (type) {
    case 0: return handleJoinMessage(message, playerId);
    case 1: return handleLeaveMessage(message, playerId);
    case 2: return handleMoveMessage(message, playerId);
    case 3: return handleCollectMessage(message, playerId);
    default: return console.log(`Unrecognized message type ${type}`);
  }
}

export function Web3D() {
  useEffect(() => {

    // Set up the canvas for low-resolution rendering.
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    canvas.style.imageRendering = "pixelated";
    canvas.width = 360;
    canvas.height = 200;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const bytes = new Uint8Array(memory.buffer);
    const imageData = context.createImageData(canvas.width, canvas.height);
    const frameSize = canvas.width * canvas.height * 4;

    // Connect to the game server.
    const socket = new WebSocket("ws://" + location.hostname + ":3002/web3d");
    socket.binaryType = "arraybuffer";
    socket.onmessage = event => handleMessage(new DataView(event.data));

    // Make a callback function for updating the frame
    const render = (timestamp: DOMHighResTimeStamp) => {
      const frameAddr = draw(socket, timestamp);
      imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
      context.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    };

    // Set up event handlers and render the first frame
    onkeydown = (event) => keydown(event.keyCode);
    onkeyup = (event) => keyup(event.keyCode);
    canvas.oncontextmenu = (event) => event.preventDefault();
    // init(Date.now()); // FIXME
    init(42069);

    render(performance.now());
  });
  return <Canvas />;
}
