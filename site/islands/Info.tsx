import { Show } from "@preact-signals/utils/components";
import { user } from "../utils/user.ts";

export function UserInfo() {
  return (
    <div>
      <h2>User Information</h2>
      <Show
        when={() => user.value.length > 0}
        fallback={
          <p>
            This is a user information island.
            <br />
            You should <a href="/login">login</a> first.
          </p>
        }
      >
        <p>Welcome, ${user.value}.</p>
      </Show>
    </div>
  );
}
