import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdCard from "@/components/AdCard";
import SearchSection from "@/components/SearchSection";
import CreateAdModal from "@/components/CreateAdModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AdWithDetails, Category } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{ category?: string; location?: string }>({});
  const [createAdOpen, setCreateAdOpen] = useState(false);

  const { data: ads = [], isLoading: adsLoading } = useQuery<AdWithDetails[]>({
    queryKey: ["/api/ads", { search: searchQuery, ...filters }],
  });

  const { data: boostedAds = [] } = useQuery<AdWithDetails[]>({
    queryKey: ["/api/ads/featured"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const recentAds = ads.slice(0, 8);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: { category?: string; location?: string }) => {
    setFilters(newFilters);
  };

  if (adsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      <SearchSection onSearch={handleSearch} onFilterChange={handleFilterChange} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Boosted Ads Section */}
        {boostedAds.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-yellow-500">⭐</span>
                Anúncios Impulsionados
              </h2>
              <Button
                variant="ghost"
                className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
                data-testid="button-view-all-featured"
              >
                Ver todos
              </Button>
            </div>
            
            {/* Highlight banner for boosted ads */}
            <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-4 rounded-xl mb-6 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <span className="text-2xl">🚀</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Anúncios em Destaque</h3>
                  <p className="text-sm opacity-90">
                    Estes anúncios foram impulsionados pelos vendedores para ter maior visibilidade!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boostedAds.slice(0, 6).map((ad) => (
                <AdCard key={ad.id} ad={ad} variant="featured" />
              ))}
            </div>
          </section>
        )}

        {/* Recent Ads Section */}
        <section className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Anúncios Recentes
            </h2>
            <Button
              variant="ghost"
              className="text-emerald-600 hover:text-emerald-800 font-medium text-sm"
              data-testid="button-view-all-recent"
            >
              Ver todos
            </Button>
          </div>
          
          {recentAds.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {recentAds.map((ad) => (
                <AdCard key={ad.id} ad={ad} variant="compact" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum anúncio encontrado. Seja o primeiro a publicar!
              </p>
            </div>
          )}
        </section>

        {/* Categories Section */}
        {categories.length > 0 && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Categorias Populares
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category) => (
                <div
                  key={category.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  data-testid={`category-${category.id}`}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className={`${category.icon} text-white text-2xl`}></i>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ver anúncios
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button */}
      <Button
        onClick={() => setCreateAdOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-30"
        data-testid="button-fab-create"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <CreateAdModal open={createAdOpen} onOpenChange={setCreateAdOpen} />
    </div>
  );
}
