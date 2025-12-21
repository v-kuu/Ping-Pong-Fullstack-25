import { render } from "preact";
import App from "./App.tsx";
import "@/assets/styles.css";

const root = document.getElementById("app");

if (root) {
  render(<App />, root);
}
