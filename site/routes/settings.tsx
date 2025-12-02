import { Userinfo } from "../islands/Info.tsx";
import { define } from "@/utils.ts";

export default define.page(() => {
  return (
    <main>
      <h1>Settings</h1>
      <Userinfo />
    </main>
  );
});
