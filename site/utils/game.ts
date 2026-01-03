import { Signal, signal } from "@preact/signals";

var exportedSignal: Signal<number | undefined>;

exportedSignal = signal<number | undefined>(undefined);

export default exportedSignal;
