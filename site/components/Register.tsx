import { Button } from "../components/Button.tsx";

function validateInput() {
  return () => {
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
    const confirmPassword = (
      document.getElementById("confirmPassword") as HTMLInputElement
    ).value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return false;
    }
    return true;
  };
}

export function Register() {
  return (
    <form class="card" method="POST" action="/register">
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
        placeholder="Nick Offerman"
        id="username"
        name="username"
        required
      />
      <p className="validator-hint">
        Must be 3 to 30 characters containing only letters, numbers or dash
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
