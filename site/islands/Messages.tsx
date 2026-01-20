import { useEffect, useState, useRef } from "preact/hooks";
import { UserAvatar } from "../components/Avatar";

interface Conversation {
  odId: number;
  username: string;
  lastMessage: string;
  lastActivity: string;
  unreadCount: number;
  isFromMe: boolean;
}

interface Message {
  id: number;
  fromId: number;
  toId: number;
  content: string;
  createdAt: string;
  read: boolean;
  isFromMe: boolean;
}

interface MessagesProps {
  initialUserId?: number;
}

export function Messages({ initialUserId }: MessagesProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUsername, setSelectedUsername] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("messageUserId");
    if (storedUserId) {
      setSelectedUserId(parseInt(storedUserId, 10));
      sessionStorage.removeItem("messageUserId");
    } else if (initialUserId) {
      setSelectedUserId(initialUserId);
    }

    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      const interval = setInterval(() => fetchMessages(selectedUserId), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        if (initialUserId && data.length === 0) {
          setSelectedUserId(initialUserId);
        }
      }
    } catch (e) {
      console.error("Failed to fetch conversations:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: number) => {
    try {
      const res = await fetch(`/api/messages/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setSelectedUsername(data.odUsername || "User");
      } else if (res.status === 404) {
        setSelectedUsername("User not found");
        setMessages([]);
      } else {
        console.error("Failed to fetch messages:", res.status);
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e);
    }
  };

  const handleSend = async (e: Event) => {
    e.preventDefault();
    if (!selectedUserId || !newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toId: selectedUserId,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, { ...msg, isFromMe: true }]);
        setNewMessage("");
        fetchConversations();
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (loading) {
    return (
      <div class="w-full max-w-4xl">
        <div class="card bg-base-200 p-6">
          <p class="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="w-full max-w-4xl">
      <div class="card bg-base-200 overflow-hidden">
        <div class="flex" style="height: min(500px, 60vh);">
          <div class="w-2/5 min-w-[140px] max-w-[200px] border-r border-base-300 flex flex-col overflow-hidden">
            <div class="p-2 border-b border-base-300 bg-base-300 shrink-0">
              <h3 class="font-bold text-sm">Conversations</h3>
            </div>
            <div class="flex-1 overflow-y-auto overflow-x-hidden">
              {conversations.length === 0 ? (
                <p class="text-center p-4 text-sm opacity-70">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.odId}
                    onClick={() => {
                      setSelectedUserId(conv.odId);
                      setSelectedUsername(conv.username);
                    }}
                    class={`w-full p-2 flex items-center gap-2 hover:bg-base-300 transition-colors text-left ${
                      selectedUserId === conv.odId ? "bg-base-300" : ""
                    }`}
                  >
                    <div class="relative shrink-0">
                      <UserAvatar username={conv.username} class="w-8 h-8" />
                      {conv.unreadCount > 0 && (
                        <span class="absolute -top-1 -right-1 bg-primary text-primary-content text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div class="flex-1 min-w-0 overflow-hidden">
                      <div class="flex items-center gap-1">
                        <span class="font-medium text-xs truncate flex-1">
                          {conv.username}
                        </span>
                        <span class="text-[10px] opacity-50 shrink-0">
                          {formatTime(conv.lastActivity)}
                        </span>
                      </div>
                      <p class="text-[10px] opacity-70 truncate">
                        {conv.isFromMe && "You: "}
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            {selectedUserId ? (
              <>
                <div class="p-2 border-b border-base-300 bg-base-300 flex items-center gap-2 shrink-0">
                  <UserAvatar username={selectedUsername} class="w-7 h-7" />
                  <a
                    href={`/profile/${selectedUsername}`}
                    class="font-bold text-sm link link-hover truncate"
                  >
                    {selectedUsername}
                  </a>
                </div>

                <div
                  ref={messagesContainerRef}
                  class="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2"
                >
                  {messages.length === 0 ? (
                    <p class="text-center text-sm opacity-70">
                      No messages yet. Say hi!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        class={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          class={`max-w-[75%] px-3 py-2 rounded-lg ${
                            msg.isFromMe
                              ? "bg-primary text-primary-content"
                              : "bg-base-300"
                          }`}
                        >
                          <p class="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                            {msg.content}
                          </p>
                          <p class="text-[10px] mt-1 opacity-70">
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form
                  onSubmit={handleSend}
                  class="p-2 border-t border-base-300 shrink-0"
                >
                  <div class="flex gap-2">
                    <div class="flex-1 relative">
                      <textarea
                        value={newMessage}
                        onInput={(e) => setNewMessage(e.currentTarget.value)}
                        placeholder="Type a message..."
                        class="textarea textarea-bordered textarea-sm w-full resize-none pr-14"
                        maxLength={500}
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                          }
                        }}
                      />
                      <span class="absolute bottom-1 right-2 text-[10px] opacity-50">
                        {newMessage.length}/500
                      </span>
                    </div>
                    <button
                      type="submit"
                      class="btn btn-primary btn-sm self-end"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <span class="loading loading-spinner loading-xs" />
                      ) : (
                        "Send"
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div class="flex-1 flex items-center justify-center">
                <p class="text-sm opacity-70">
                  Select a conversation to start chatting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
