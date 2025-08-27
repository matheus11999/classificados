import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import BottomNavigation from "./BottomNavigation";
import NotificationsPanel from "./NotificationsPanel";
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
  const [showNotifications, setShowNotifications] = useState(false);

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
    const interval = setInterval(() => {
      checkAuth();
      loadNotifications();
    }, 5000);
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
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-slate-100 transition-all duration-300 min-h-screen pb-20">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/90 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-slate-700/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setLocation("/")}>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                <i className="fas fa-store text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  MarketPlace
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Classificados Regionais</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-gray-100/80 dark:bg-slate-700/80 hover:bg-gray-200 dark:hover:bg-slate-600 transition-all duration-200"
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
                    onClick={() => setShowNotifications(true)}
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
                        Meu Perfil
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

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
}
