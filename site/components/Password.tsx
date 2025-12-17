import { Button } from "./Button.tsx";
import { validateInput } from "./Register.tsx";

export function UpdatePassword() {
  return (
      <div>
    <h2>Change your password</h2>
    <form method="POST" action="/update">
      <label class="input" for="password">
        Current Password:
      </label>
      <br/>
      <input
        type="password"
        class="input validator"
        minLength={8}
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        placeholder="Your pass shall be validated"
        id="password"
        name="password"
        required
      />
      <div class="validator-hint">
        Must be more than 8 characters, including
        at least one number,<br/>
        at least one lowercase letter,
        at least one uppercase letter
      </div>
      <br />
      <label class="input" for="password">
        New Password:
      </label>
      <br/>
      <input
        type="password"
        class="input validator"
        minLength={8}
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        placeholder="What should your password be?"
        id="password"
        name="password"
        required
      />
      <div class="validator-hint">
          Must be more than 8 characters, including
        at least one number,<br/>
        at least one lowercase letter,
        at least one uppercase letter
     </div>
      <br />
      <label class="input" for="confirmPassword">
        Confirm Password:
      </label>
      <br/>
      <input
        onSubmit={validateInput()}
        type="password"
        class="input validator"
        placeholder="Re-enter your password"
        required
        id="confirmPassword"
        name="confirmPassword"
      />
      <div class="validator-hint">Passwords should match</div>
      <br />
      <Button id="formButton" onClick={validateInput()}>
        Change Password
      </Button>
    </form>
</div>
  );
}
