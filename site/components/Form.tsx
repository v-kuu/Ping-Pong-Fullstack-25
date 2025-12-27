import { Button } from "./Button.tsx";
import { EyeOpen, EyeClosed, Check, XMark } from "./Icons.tsx";
import { PASSWORD_RULES, USERNAME_RULES } from "../utils/validation";

const INPUT_CLASS =
  "w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-black outline-none disabled:bg-gray-100 disabled:text-gray-400";

export interface TextInputProps {
  label: string;
  name: string;
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
  hint?: string;
}

export function TextInput({
  label,
  name,
  value,
  onInput,
  placeholder,
  disabled,
  pattern,
  minLength,
  maxLength,
  autoComplete,
  hint,
}: TextInputProps) {
  return (
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="text"
        name={name}
        autoComplete={autoComplete}
        class={INPUT_CLASS}
        value={value}
        onInput={(e) => onInput(e.currentTarget.value)}
        disabled={disabled}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        placeholder={placeholder}
        required
      />
      {hint && <p class="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export interface EmailInputProps {
  label: string;
  name: string;
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}

export function EmailInput({
  label,
  name,
  value,
  onInput,
  placeholder,
  disabled,
  autoComplete,
}: EmailInputProps) {
  return (
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="email"
        name={name}
        autoComplete={autoComplete}
        class={INPUT_CLASS}
        value={value}
        onInput={(e) => onInput(e.currentTarget.value)}
        disabled={disabled}
        placeholder={placeholder}
        required
      />
    </div>
  );
}

export interface PasswordInputProps {
  label: string;
  name: string;
  value: string;
  onInput: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  showPassword?: boolean;
  onToggleShow?: () => void;
}

export function PasswordInput({
  label,
  name,
  value,
  onInput,
  placeholder,
  disabled,
  autoComplete,
  showPassword = false,
  onToggleShow,
}: PasswordInputProps) {
  return (
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700">{label}</label>
      <div class="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          class={`${INPUT_CLASS} pr-12`}
          value={value}
          onInput={(e) => onInput(e.currentTarget.value)}
          disabled={disabled}
          placeholder={placeholder}
          required
        />
        {value.length > 0 && onToggleShow && (
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={onToggleShow}
            disabled={disabled}
          >
            {showPassword ? <EyeClosed /> : <EyeOpen />}
          </button>
        )}
      </div>
    </div>
  );
}

export interface PasswordRulesProps {
  password: string;
}

export function PasswordRules({ password }: PasswordRulesProps) {
  return (
    <div class="text-xs space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const isValid = rule.test(password);
        return (
          <div
            key={rule.label}
            class={`flex items-center gap-1 ${isValid ? "text-green-600" : "text-gray-500"}`}
          >
            {isValid ? <Check /> : <XMark />} {rule.label}
          </div>
        );
      })}
    </div>
  );
}

export interface UsernameRulesProps {
  username: string;
}

export function UsernameRules({ username }: UsernameRulesProps) {
  return (
    <div class="text-xs space-y-1">
      {USERNAME_RULES.map((rule) => {
        const isValid = rule.test(username);
        return (
          <div
            key={rule.label}
            class={`flex items-center gap-1 ${isValid ? "text-green-600" : "text-gray-500"}`}
          >
            {isValid ? <Check /> : <XMark />} {rule.label}
          </div>
        );
      })}
    </div>
  );
}

export interface PasswordMatchProps {
  password: string;
  confirmPassword: string;
}

export function PasswordMatch({
  password,
  confirmPassword,
}: PasswordMatchProps) {
  const isMatch = password === confirmPassword && confirmPassword.length > 0;

  return (
    <div class="text-xs">
      <div
        class={`flex items-center gap-1 ${isMatch ? "text-green-600" : "text-gray-500"}`}
      >
        {isMatch ? <Check /> : <XMark />} Passwords match
      </div>
    </div>
  );
}

export interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div class="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
      <XMark /> <span>{message}</span>
    </div>
  );
}

export interface SuccessMessageProps {
  onRedirect?: () => void;
}

export function SuccessMessage({ onRedirect }: SuccessMessageProps) {
  return (
    <div class="card text-center py-10 space-y-4">
      <div class="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
        <Check />
      </div>
      <h2 class="text-2xl font-bold text-gray-900">Account Created!</h2>
      <p class="text-gray-600">
        Your account has been successfully registered.
      </p>
      <button class="btn w-full py-3 mt-4" onClick={onRedirect}>
        Go to Login
      </button>
    </div>
  );
}

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
      <p class="validator-hint">
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
        class="input validator"
        minLength={8}
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
        placeholder="Your pass shall be validated"
        id="password"
        name="password"
        required
      />
      <p class="validator-hint">
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
