import { Canvas } from "../components/Canvas.tsx";
import { useEffect } from "preact/hooks"

// This is a placeholder for the other game module
export function Web3D() {
    useEffect(async () => {

        // Set up the canvas for low resolution rendering.
        const canvas = document.querySelector('canvas')
        canvas.style.imageRendering = 'pixelated'
        canvas.width = 360
        canvas.height = 200

        // Create a 2D rendering context.
        const context = canvas.getContext('2d')
        context.fillStyle = '#f0f'
        context.fillRect(0, 0, canvas.width, canvas.height)

        // Instantiate the WebAssembly module containing the game code.
        const wasm = await WebAssembly.instantiateStreaming(fetch('assets/web3d.wasm'))
        const exports = wasm.instance.exports
        const bytes = new Uint8Array(exports.memory.buffer)

        // Make an ImageData object for updating the canvas.
        const imageData = context.createImageData(canvas.width, canvas.height)
        const frameSize = canvas.width * canvas.height * 4

        // Make a callback function for updating the frame.
        const draw = timestamp => {
            const frameAddr = exports.draw(timestamp)
            imageData.data.set(bytes.subarray(frameAddr, frameAddr + frameSize))
            context.putImageData(imageData, 0, 0)
            requestAnimationFrame(draw)
        }

        // Set up event handlers and render the first frame.
        window.onkeydown = event => exports.keydown(event.keyCode)
        window.onkeyup = event => exports.keyup(event.keyCode)
        canvas.oncontextmenu = event => event.preventDefault()
        draw(performance.now())
    })
    return <Canvas />
}
