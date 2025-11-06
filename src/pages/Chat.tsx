import { ChatInterface } from "@/components/ChatInterface";
import { Header } from "@/components/Header";

const ChatPage = () => {
  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <Header />
      <div className="flex-1 min-h-0">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatPage;

/**
 * Usage:
 * import ChatPage from "./Chat.tsx";
 * <ChatPage />
 */
