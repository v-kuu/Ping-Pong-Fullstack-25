import { CanvasWeb3D } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks";

// @ts-ignore
import * as web3d from "../web3d/web3d.wasm";

enum MessageType {
    Join = 0,
    Quit,
    Begin,
    Count,
    End,
    Move,
    Collect,
    Catch,
}

// Send a message to the server.
export function sendMessage(socket: WebSocket, ...args: number[]) {
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(new Float64Array(args));
}

// Convert a string to UTF-8 and write the bytes to a buffer in WebAssembly
// memory. The string is truncated if it's too long to fit the buffer, but is
// always null-terminated. Returns the length of the string (sans null
// terminator).
export function getString(str: string, addr: number, length: number) {
    const textEncoder = new TextEncoder();
    const source = textEncoder.encode(str);
    length = Math.min(source.length, length - 1);
    const target = new Uint8Array(web3d.memory.buffer, addr, length + 1);
    target.set(source.subarray(0, length));
    target[length] = 0;
    return length;
}

// Handle a message from the server.
function handleMessage(data: ArrayBuffer) {
  const [type, ...args] = new Float64Array(data);
  switch (type) {
    case MessageType.Join: {
      const [playerId, score] = args;
      const name = new TextDecoder().decode(new DataView(data, 24));
      web3d.recvJoin(playerId, score, name);
    } break;
    case MessageType.Quit: return web3d.recvQuit(...args);
    case MessageType.Begin: return web3d.recvBegin(...args);
    case MessageType.Count: return web3d.recvCount(...args);
    case MessageType.End: return web3d.recvEnd(...args);
    case MessageType.Move: return web3d.recvMove(...args);
    case MessageType.Collect: return web3d.recvCollect(...args);
    default: return console.log("Invalid message type", type);
  }
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
      url.searchParams.set("id", playerId);
      socket = new WebSocket(url);
      socket.binaryType = "arraybuffer";
      socket.onmessage = event => handleMessage(event.data);
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

    onkeydown = event => {
      if (ignoreInput) return;
      web3d.keydown(event.keyCode);
    };
    onkeyup = event => {
      if (ignoreInput) return;
      web3d.keyup(event.keyCode);
    };
    canvas.oncontextmenu = (event) => event.preventDefault();
    web3d.init();
    render(performance.now());

    return () => {
      document.removeEventListener('gamepause', handlePause as EventListener);
    };
  });
  return <CanvasWeb3D />;
}
