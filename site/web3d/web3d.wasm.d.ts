export function receive(data: Uint8Array): void;
export function draw(socket: WebSocket?, time: number, date: number, logged: boolean): number;
export function keyup(key: number): void;
export function keydown(key: number): void;
export function init(): void;
export const memory: WebAssembly.Memory;
