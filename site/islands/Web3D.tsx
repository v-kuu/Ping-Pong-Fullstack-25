import { CanvasWeb3D } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";

// @ts-ignore
import { draw, init, recvJoin, recvQuit, recvMove, recvCollect, keydown, keyup, memory } from "../web3d/web3d.wasm";

enum MessageType {
  Join = 0,
  Quit,
  Move,
  Collect,
  Catch,
}

// Send a message to the server.
function sendMessage(socket: WebSocket, ...args: number[]) {
  if (socket.readyState === 1)
    socket.send(new Float64Array([...args]));
}

// Send a player movement message to the server.
export function sendMove(socket: WebSocket, x: number, y: number, dx: number, dy: number) {
  sendMessage(socket, MessageType.Move, 0, x, y, dx, dy);
}

// Send a gem collect message to the server.
export function sendCollect(socket: WebSocket, gemIndex: number) {
  sendMessage(socket, MessageType.Collect, 0, gemIndex);
}

// Handle a player join message from the server.
function handleJoinMessage(message: Float64Array) {
  const [_type, playerId, gems] = message;
  recvJoin(playerId, gems);
}

// Handle a player quit message from the server.
function handleQuitMessage(message: Float64Array) {
  const [_type, playerId] = message;
  recvQuit(playerId);
}

// Handle a player movement message from the server.
function handleMoveMessage(message: Float64Array) {
  const [_type, playerId, x, y, dx, dy] = message;
  recvMove(playerId, x, y, dx, dy);
}

// Handle a gem collect message from the server.
function handleCollectMessage(message: Float64Array) {
  const [_type, playerId, gemIndex] = message;
  recvCollect(playerId, gemIndex);
}

// Handle a message from the server.
function handleMessage(data: ArrayBuffer) {
  const message = new Float64Array(data);
  const type = message[0];
  switch (type) {
    case MessageType.Join: return handleJoinMessage(message);
    case MessageType.Quit: return handleQuitMessage(message);
    case MessageType.Move: return handleMoveMessage(message);
    case MessageType.Collect: return handleCollectMessage(message);
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
    socket.onmessage = event => handleMessage(event.data);

    // Make a callback function for updating the frame
    const render = (timestamp: DOMHighResTimeStamp) => {
      const frameAddr = draw(socket, timestamp);
      imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
      context.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    };

    // Set up event handlers and render the first frame
    onkeydown = event => keydown(event.keyCode);
    onkeyup = event => keyup(event.keyCode);
    canvas.oncontextmenu = (event) => event.preventDefault();
    // init(Date.now()); // FIXME
    init(42069);

    render(performance.now());
  });
  return <CanvasWeb3D />;
}
