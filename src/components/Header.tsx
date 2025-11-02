import { Button } from "@/components/ui/button";
import { Bell, Moon, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">P</span>
          </div>
        </Button>
        <div className="relative">
          <Input
            placeholder="Search..."
            className="w-64 h-8 bg-muted border-0 pl-8 text-sm"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-9 h-9 relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Moon className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Settings className="w-4 h-4" />
        </Button>
        <Avatar className="w-8 h-8 cursor-pointer">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            TB
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
