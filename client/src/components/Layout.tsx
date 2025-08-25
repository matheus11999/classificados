import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import BottomNavigation from "./BottomNavigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Moon, Sun, Bell, User, LogIn, LogOut, Settings } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { userAuth } from "@/lib/user-auth";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [user, setUser] = useState(userAuth.getUser());
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Update user state when authentication changes
    const checkAuth = () => {
      setUser(userAuth.getUser());
    };
    
    // Load notifications if user is authenticated
    const loadNotifications = async () => {
      if (userAuth.isAuthenticated()) {
        try {
          const userNotifications = await userAuth.getNotifications();
          setNotifications(userNotifications);
        } catch (error) {
          console.error("Error loading notifications:", error);
        }
      }
    };

    checkAuth();
    loadNotifications();

    // Re-check periodically
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    userAuth.logout();
    setUser(null);
    setNotifications([]);
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso",
    });
    setLocation("/");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center">
                <i className="fas fa-tag text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Classificados</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Regionais</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                data-testid="button-theme-toggle"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5 text-gray-600" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-400" />
                )}
              </Button>
              
              {user ? (
                <>
                  {/* Notification Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative"
                    onClick={() => setLocation("/profile")}
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                  
                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" data-testid="img-user-avatar">
                          {user?.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt="Avatar"
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-sm">
                        <div className="font-medium">{user.firstName || user.username}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setLocation("/profile")}>
                        <User className="mr-2 h-4 w-4" />
                        Meu Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLocation("/create")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Criar Anúncio
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/login")}
                  className="flex items-center space-x-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Entrar</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
