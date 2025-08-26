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

  const buildAdsUrl = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filters.category) params.append('categoryId', filters.category);
    if (filters.location) params.append('location', filters.location);
    return `/api/ads?${params.toString()}`;
  };

  const { data: ads = [], isLoading: adsLoading } = useQuery<AdWithDetails[]>({
    queryKey: [buildAdsUrl()],
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
        {/* Boosted Ads Section - Enhanced with bigger highlight */}
        {boostedAds.length > 0 && (
          <section className="animate-fade-in">
            {/* Hero Banner for Featured Ads */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 mb-8 overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              
              <div className="relative z-10 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <span className="text-3xl">🚀</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Anúncios em Destaque</h2>
                    <p className="text-lg opacity-90">
                      Produtos selecionados com maior visibilidade
                    </p>
                  </div>
                </div>

                {/* Featured Product Highlight - Show the top boosted ad */}
                {boostedAds[0] && (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{boostedAds[0].title}</h3>
                        <p className="text-2xl font-bold text-yellow-300 mb-2">
                          R$ {parseFloat(boostedAds[0].price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm opacity-90 line-clamp-2">{boostedAds[0].description}</p>
                      </div>
                      <Button 
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                        size="sm"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Featured Ads Grid */}
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-yellow-500">⭐</span>
                Mais Anúncios Impulsionados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {boostedAds.slice(1, 9).map((ad) => (
                  <AdCard key={ad.id} ad={ad} variant="featured" />
                ))}
              </div>
            </div>

            {/* View All Button */}
            {boostedAds.length > 8 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  data-testid="button-view-all-featured"
                >
                  Ver Todos os {boostedAds.length} Anúncios Impulsionados
                </Button>
              </div>
            )}
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
