import { Canvas } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";
import * as web3d from "../web3d/web3d.wasm";

// Send a message to the server.
export function sendMessage(socket: WebSocket, ...args: number[]) {
  if (socket.readyState === WebSocket.OPEN)
    socket.send(new Float64Array([...args]));
}

// Handle a message from the server.
function handleMessage(data: ArrayBuffer) {
  const handlers = [
    web3d.recvJoin,
    web3d.recvQuit,
    web3d.recvStatus,
    web3d.recvMove,
    web3d.recvCollect,
  ];
  const [type, ...args] = new Float64Array(data);
  handlers[type](...args);
}

export function Web3D() {
  useEffect(() => {

    // Set up the canvas for low-resolution rendering.
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    canvas.style.imageRendering = "pixelated";
    canvas.width = 360;
    canvas.height = 200;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    const bytes = new Uint8Array(web3d.memory.buffer);
    const imageData = context.createImageData(canvas.width, canvas.height);
    const frameSize = canvas.width * canvas.height * 4;

    // Connect to the game server.
    const socket = new WebSocket("ws://" + location.hostname + ":3002/web3d");
    socket.binaryType = "arraybuffer";
    socket.onmessage = event => handleMessage(event.data);

    // Make a callback function for updating the frame
    const render = (timestamp: DOMHighResTimeStamp) => {
      const frameAddr = web3d.draw(socket, timestamp, Date.now());
      imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
      context.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    };

    // Set up event handlers and render the first frame
    onkeydown = event => web3d.keydown(event.keyCode);
    onkeyup = event => web3d.keyup(event.keyCode);
    canvas.oncontextmenu = (event) => event.preventDefault();
    web3d.init();
    render(performance.now());
  });
  return <Canvas />;
}
