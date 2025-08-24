import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdCard from "@/components/AdCard";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { AdWithDetails } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function MyAds() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const { data: myAds = [], isLoading: adsLoading, error } = useQuery<AdWithDetails[]>({
    queryKey: ["/api/user/ads"],
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

  if (isLoading || adsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Anúncios</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Gerencie seus anúncios publicados
          </p>
        </div>
        <Button
          onClick={() => setLocation("/create")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          data-testid="button-create-new-ad"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Anúncio
        </Button>
      </div>

      {myAds.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {myAds.map((ad) => (
              <AdCard key={ad.id} ad={ad} variant="featured" />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{myAds.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Anúncios</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {myAds.filter(ad => ad.active).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Anúncios Ativos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {myAds.filter(ad => ad.featured).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Em Destaque</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Visualizações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box text-gray-400 text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum anúncio ainda
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Comece criando seu primeiro anúncio e alcance milhares de pessoas na sua região.
            </p>
            <Button
              onClick={() => setLocation("/create")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              data-testid="button-create-first-ad"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Anúncio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
