import { useState, useEffect, useRef, useCallback } from "react";
import { useSocketStore } from "@/stores/socketStore.js";

interface ChatMessage {
  userId: string;
  displayName: string;
  message: string;
  timestamp: string;
}

export function ChatBox() {
  const socket = useSocketStore((s) => s.socket);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), data]);
    };

    socket.on("chat:new_message", handler);
    return () => {
      socket.off("chat:new_message", handler);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(() => {
    if (!socket || !input.trim()) return;
    socket.emit("chat:message", { message: input.trim() });
    setInput("");
  }, [socket, input]);

  return (
    <div className="flex h-80 flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium text-card-foreground">Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-primary">{msg.displayName}: </span>
            <span className="text-card-foreground">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-border p-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Enviar mensagem..."
            maxLength={500}
            className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={sendMessage}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
