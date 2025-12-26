import { forwardRef } from "preact/compat";

export const Canvas = forwardRef<HTMLCanvasElement>((props, ref) => { // RABBIT: Props parameter is untyped - can't ensure valid HTML canvas attributes. Use type: props: CanvasHTMLAttributes<HTMLCanvasElement>
    return (
      <canvas 
        id="renderCanvas" 
        ref={ref}
        class="w-full h-screen border-0" 
      />
     );
});