import { Button } from "../components/Button.tsx";

export function Form() {
  return (
    <form class="card" method="POST" action="/login">
      <label class="input" for="username">
        Username:
      </label>
      <br />
      <input
        type="text"
        class="input validator"
        pattern="[A-Za-z][A-Za-z0-9\-]*"
        title="Only letters, numbers or dash, must start with a letter"
        minLength={3}
        maxLength={30}
        placeholder="Nick"
        id="username"
        name="username"
        required
      />
      <p className="validator-hint">
        Must be 3 to 30 characters
        <br />
        containing only letters, numbers or dash
      </p>
      <br />
      <label class="input" for="password">
        Password:
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
      <Button id="formButton" onClick={undefined}>
        Login
      </Button>
      <br />
    </form>
  );
}
