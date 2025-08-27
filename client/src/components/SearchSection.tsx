import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";
import { Category } from "@shared/schema";

interface SearchSectionProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: { category?: string; location?: string }) => void;
}

export default function SearchSection({ onSearch, onFilterChange }: SearchSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Call onSearch when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterClick = (categoryId: string) => {
    const newFilter = activeFilter === categoryId ? "" : categoryId;
    setActiveFilter(newFilter);
    
    if (newFilter) {
      onFilterChange({ category: newFilter });
    } else {
      onFilterChange({});
    }
  };

  return (
    <section className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/50 transition-all duration-300 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar produtos, serviços..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-4 border-gray-200 dark:border-slate-600 rounded-2xl bg-white/80 dark:bg-slate-700/80 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-md backdrop-blur-sm transition-all duration-200"
              data-testid="input-search"
            />
          </div>
          
          {/* Filter Chips */}
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeFilter === category.id ? "default" : "secondary"}
                onClick={() => handleFilterClick(category.id)}
                className={`flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-200 shadow-md ${
                  activeFilter === category.id
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25"
                    : "bg-white/80 dark:bg-slate-700/80 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-600 backdrop-blur-sm"
                }`}
                data-testid={`filter-${category.id}`}
              >
                <i className={`${category.icon} w-4 h-4 mr-2`}></i>
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
