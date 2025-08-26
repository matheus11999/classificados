import { useLocation } from "wouter";
import { Home, Plus, User, Info } from "lucide-react";
import { userAuth } from "@/lib/user-auth";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const isAuthenticated = userAuth.isAuthenticated();

  const navItems = [
    {
      path: "/",
      icon: Home,
      label: "Início",
      testId: "nav-home",
    },
    {
      path: "/create",
      icon: Plus,
      label: "Criar",
      testId: "nav-create",
    },
    {
      path: "/profile",
      icon: isAuthenticated ? User : Info,
      label: isAuthenticated ? "Meu Perfil" : "Info",
      testId: "nav-profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 transition-colors duration-300">
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ path, icon: Icon, label, testId }) => {
          const isActive = location === path;
          
          return (
            <button
              key={path}
              onClick={() => setLocation(path)}
              className={`flex flex-col items-center justify-center px-3 py-2 transition-colors ${
                isActive
                  ? "text-emerald-600"
                  : "text-gray-500 dark:text-gray-400 hover:text-emerald-600"
              }`}
              data-testid={testId}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
