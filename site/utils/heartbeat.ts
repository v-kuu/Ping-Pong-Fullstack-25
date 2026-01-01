import { useEffect } from "preact/hooks";

const HEARTBEAT_INTERVAL = 30000;

export function useHeartbeat() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const sendHeartbeat = async () => {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          credentials: "same-origin",
        });
      } catch (e) {
        console.error("Heartbeat failed:", e);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
