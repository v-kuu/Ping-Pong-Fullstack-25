import { Button } from "./Button.tsx";
import { validateInput } from "./Register.tsx";

export function UpdatePassword() {
  return (
    <form method="POST" action="/update">
      <label class="input" for="password">
        Current Password:
      </label>
      <input
        type="password"
        class="input validor"
        minLength={8}
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        placeholder="Your pass shall be validated"
        id="password"
        name="password"
        required
      />
      <p className="validator-hint">
        Must be more than 8 characters, including
        <br />
        At least one number
        <br />
        At least one lowercase letter
        <br />
        At least one uppercase letter
      </p>
      <br />
      <label class="input" for="password">
        New Password:
      </label>
      <input
        type="password"
        class="input validor"
        minLength={8}
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        placeholder="What should your password be?"
        id="password"
        name="password"
        required
      />
      <p className="validator-hint">
        Password must have
        <li>more than 8 characters</li>
        <li>At least one number</li>
        <li>At least one lowercase letter</li>
        <li>At least one uppercase letter</li>
      </p>
      <br />
      <label class="input" for="confirmPassword">
        Confirm Password:
      </label>
      <input
        onSubmit={validateInput()}
        type="password"
        class="input validor"
        placeholder="Re-enter your password"
        required
        id="confirmPassword"
        name="confirmPassword"
      />
      <p class="validator-hint">Passwords should match</p>
      <br />
      <Button id="formButton" onClick={validateInput()}>
        Register
      </Button>
    </form>
  );
}
