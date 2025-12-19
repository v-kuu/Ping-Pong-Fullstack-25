import type { ComponentChildren } from "preact";
import Header from "../components/Header.tsx";
import Footer from "../islands/Footer.tsx";
import "../assets/styles.css";

export default function Layout({ children }: { children: ComponentChildren }) {
  return (
    <>
      <Header active="" title="ft_transcendence" />
      {children}
      <Footer active="" />
    </>
  );
}
