import { CanvasWeb3D } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";
import * as web3d from "../web3d/web3d.wasm";

// Mapping of KeyboardEvent.code strings to integer indices.
const inputKeys = ["KeyW", "KeyS", "KeyA", "KeyD", "KeyQ", "KeyE"];
const keyBindings = Object.fromEntries(inputKeys.map((v, i) => [v, i]));
function keyIndex(event: KeyboardEvent, ignoreInput: boolean): number {
    const index = keyBindings[event.code];
    return ignoreInput || index === undefined ? -1 : index;
}

// Send a message to the server.
export function sendMessage(socket: WebSocket, addr: number, size: number) {
    if (socket && socket.readyState === WebSocket.OPEN)
        socket.send(new DataView(web3d.memory.buffer, addr, size));
}

// Copy the contents of a Uint8Array into WebAssembly memory.
export function getArray(source: Uint8Array, addr: number, size: number) {
    const target = new Uint8Array(web3d.memory.buffer, addr, size);
    target.set(source.subarray(0, Math.min(size, source.byteLength)));
}

export function Web3D({user}: {user: { id: number; username: string } | null}) {
  const username = user && user.username;
  const playerId = user && user.id;
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
    let socket: WebSocket | null = null;
    if (username && playerId) {
      const url = new URL("ws://" + location.hostname + ":3002/web3d");
      url.searchParams.set("username", username);
      url.searchParams.set("id", playerId.toString());
      socket = new WebSocket(url);
      socket.binaryType = "arraybuffer";
      socket.onmessage = event => web3d.receive(new Uint8Array(event.data));
    }

    // Make a callback function for updating the frame
    const render = (timestamp: DOMHighResTimeStamp) => {
      const frameAddr = web3d.draw(socket, timestamp, Date.now(), username != null);
      imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize));
      context.putImageData(imageData, 0, 0);
      requestAnimationFrame(render);
    };

    // Set up event handlers and render the first frame
    let ignoreInput = false;
    const handlePause = (e: CustomEvent<boolean>) => {
      ignoreInput = e.detail;
    };
    document.addEventListener('gamepause', handlePause as EventListener);

    onkeydown = event => web3d.keydown(keyIndex(event, ignoreInput));
    onkeyup = event => web3d.keyup(keyIndex(event, ignoreInput));
    canvas.oncontextmenu = (event) => event.preventDefault();
    web3d.init();
    render(performance.now());
  });
  return <CanvasWeb3D />;
}
