import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatInterface } from "@/components/ChatInterface";
import { Header } from "@/components/Header";
import type { UIMessage } from "ai";

const API_BASE = (import.meta?.env?.VITE_API_BASE as string) ?? "http://localhost:4000";

const ChatIdPage = () => {
  const { id } = useParams();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!id) return;
      try {
        const res = await fetch(`${API_BASE}/api/chat/${id}`);
        const data = await res.json();
        if (active) setInitial(Array.isArray(data.messages) ? data.messages : []);
      } catch {
        if (active) setInitial([]);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  if (!id || initial === null) return null;

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Header />
      <div className="flex-1 min-h-0">
        <ChatInterface id={id} initialMessages={initial} />
      </div>
    </div>
  );
};

export default ChatIdPage;

/**
 * Usage:
 * import ChatIdPage from "./ChatId.tsx";
 * <ChatIdPage />
 */
