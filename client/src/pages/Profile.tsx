import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { AdWithDetails } from "@shared/schema";
import { LogOut, User, Heart, Settings } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: favorites = [] } = useQuery<AdWithDetails[]>({
    queryKey: ["/api/favorites"],
    enabled: isAuthenticated,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Perfil</h1>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                      data-testid="img-profile-avatar"
                    />
                  ) : (
                    <User className="h-10 w-10 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user?.firstName && user?.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : "Usuário"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    value={user?.firstName || ""}
                    readOnly
                    className="mt-1"
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    value={user?.lastName || ""}
                    readOnly
                    className="mt-1"
                    data-testid="input-last-name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    readOnly
                    className="mt-1"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={user?.whatsapp || "Não informado"}
                    readOnly
                    className="mt-1"
                    data-testid="input-whatsapp"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2" />
                Favoritos ({favorites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.slice(0, 4).map((ad) => (
                    <div
                      key={ad.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all"
                      data-testid={`favorite-${ad.id}`}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {ad.title}
                      </h4>
                      <p className="text-emerald-600 font-bold mb-1">
                        R$ {parseFloat(ad.price).toLocaleString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ad.location}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Você ainda não tem anúncios favoritos
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-emerald-600">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anúncios Publicados</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{favorites.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Favoritos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">0</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visualizações</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  📱 Use fotos de qualidade
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Anúncios com fotos vendem 3x mais rápido
                </p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  📍 Seja específico na localização
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Ajuda compradores próximos a encontrar você
                </p>
              </div>
              <div className="text-sm">
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  💬 Responda rápido no WhatsApp
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Primeiras impressões são fundamentais
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
