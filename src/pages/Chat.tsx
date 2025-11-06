import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    async function startChat() {
      const res = await fetch("/api/chat?create=1", { method: "POST" });
      const data = await res.json();
      if (data.id) navigate(`/chat/${data.id}`);
    }
    startChat();
  }, [navigate]);
  return null;
};

export default ChatPage;

/**
 * Usage:
 * import ChatPage from "./Chat.tsx";
 * <ChatPage />
 */
