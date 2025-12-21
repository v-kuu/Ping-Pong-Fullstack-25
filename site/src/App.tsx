import { Router, Route } from "preact-router";
import Header from "@/components/Header.tsx";
import Footer from "@/islands/Footer.tsx";
import { Game } from "@/islands/Game.tsx";
import { Web3D } from "@/islands/Web3D.tsx";
import { Login } from "@/islands/Login.tsx";
import { Signup } from "@/islands/Signup.tsx";
import { Setting } from "@/islands/Settings.tsx";
import PrivacyPolicy from "@/components/PrivacyPolicy.tsx";
import ToS from "@/components/ToS.tsx";

function HomePage() {
  return (
    <div class="px-4 py-8 mx-auto fresh-gradient2 min-h-screen">
      <Game />
    </div>
  );
}

function GamePage() {
  return (
    <div class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <Web3D />
    </div>
  );
}

function LoginPage() {
  return (
    <main class="vt323-regular flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-center">
          Hit Me With Your Best Shot!
        </h2>
        <Login />
      </div>
    </main>
  );
}

function SignupPage() {
  return (
    <main class="vt323-regular flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div class="w-full max-w-md p-8 bg-white rounded shadow-md">
        <h2 class="text-2xl font-bold mb-6 text-center">Gi'mme the Deeds</h2>
        <Signup />
      </div>
    </main>
  );
}

function SettingsPage() {
  return (
    <main>
      <Setting />
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header active="" title="ft_transcendence" />
      <Router>
        <Route path="/" component={HomePage} />
        <Route path="/game" component={GamePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={ToS} />
      </Router>
      <Footer active="" />
    </>
  );
}
