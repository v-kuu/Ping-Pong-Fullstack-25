import { forwardRef } from "preact/compat";

export const Canvas = forwardRef<HTMLCanvasElement>((props, ref) => {
    return (
      <canvas
        id="renderCanvas"
        ref={ref}
        class="w-full h-screen border-0"
        {...props}
      />
     );
});
