import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MessageSquare, Library, History, Sparkles } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  timestamp: string;
}

const mockConversations: { [key: string]: Conversation[] } = {
  Today: [
    { id: "1", title: "USB-C cables procurement", timestamp: "2 hours ago" },
    { id: "2", title: "Office supplies registration", timestamp: "4 hours ago" },
    { id: "3", title: "IT equipment search", timestamp: "5 hours ago" },
  ],
  Yesterday: [
    { id: "4", title: "Conference room setup", timestamp: "Yesterday" },
  ],
  "7 Days Ago": [
    { id: "5", title: "Furniture catalog inquiry", timestamp: "5 days ago" },
    { id: "6", title: "Software licenses", timestamp: "6 days ago" },
  ],
};

export function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Search */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            className="pl-9 bg-sidebar-accent border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {Object.entries(mockConversations).map(([period, conversations]) => (
          <div key={period} className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-3">{period}</h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant="sidebar"
                  size="sm"
                  className="text-left px-3 py-2"
                >
                  <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate text-sm">{conv.title}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Button variant="sidebar" size="sm" className="px-3">
          <Sparkles className="w-4 h-4 mr-2" />
          Explore
        </Button>
        <Button variant="sidebar" size="sm" className="px-3">
          <Library className="w-4 h-4 mr-2" />
          Library
        </Button>
        <Button variant="sidebar" size="sm" className="px-3">
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
        <Button variant="default" size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
    </aside>
  );
}
