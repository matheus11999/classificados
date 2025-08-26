import { useState } from "react";
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
  const [activeFilter, setActiveFilter] = useState<string>("");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
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
    <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
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
              className="pl-10 pr-4 py-3 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
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
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === category.id
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
