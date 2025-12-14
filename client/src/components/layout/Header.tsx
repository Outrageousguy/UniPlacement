import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, X, User, Settings, LogOut, GraduationCap, Moon, Sun } from "lucide-react";

interface HeaderProps {
  userName: string;
  userRole: "coordinator" | "student";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function Header({
  userName,
  userRole,
  activeTab,
  onTabChange,
  onLogout,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const coordinatorTabs = ["Dashboard", "Drives", "Students"];
  const studentTabs = ["Dashboard", "Drives", "My Applications", "Resumes", "Community"];
  const tabs = userRole === "coordinator" ? coordinatorTabs : studentTabs;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between gap-4 h-14">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2"
              onClick={() => {
                onTabChange("Dashboard");
                setMobileMenuOpen(false);
              }}
              data-testid="button-logo-home"
            >
              <GraduationCap className="w-6 h-6 text-foreground" />
              <span className="font-semibold text-base hidden sm:block">
                UniPlacement
              </span>
            </Button>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab}
                variant="ghost"
                className={`relative px-4 py-2 ${
                  activeTab === tab
                    ? "text-foreground after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-muted-foreground"
                }`}
                onClick={() => onTabChange(tab)}
                data-testid={`nav-tab-${tab.toLowerCase().replace(/\s/g, "-")}`}
              >
                {tab}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2"
                  data-testid="button-user-menu"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {userName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem data-testid="menu-item-profile">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-item-settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive"
                  data-testid="menu-item-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              variant="ghost"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  variant="ghost"
                  className={`justify-start ${
                    activeTab === tab
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => {
                    onTabChange(tab);
                    setMobileMenuOpen(false);
                  }}
                  data-testid={`mobile-nav-tab-${tab.toLowerCase().replace(/\s/g, "-")}`}
                >
                  {tab}
                </Button>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
