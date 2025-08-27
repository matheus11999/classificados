import { AdWithDetails } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { BoostButton } from "./BoostButton";

interface AdCardProps {
  ad: AdWithDetails;
  variant?: "featured" | "compact";
  onAdClick?: (ad: AdWithDetails) => void;
}

export default function AdCard({ ad, variant = "featured", onAdClick }: AdCardProps) {
  const [isFavorited, setIsFavorited] = useState(ad.isFavorited || false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const favoriteMutation = useMutation({
    mutationFn: async (adId: string) => {
      if (isFavorited) {
        await apiRequest("DELETE", `/api/favorites/${adId}`);
      } else {
        await apiRequest("POST", "/api/favorites", { adId });
      }
    },
    onSuccess: () => {
      setIsFavorited(!isFavorited);
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast({
        title: isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos",
        variant: "default",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do favorito",
        variant: "destructive",
      });
    },
  });

  const handleWhatsAppClick = () => {
    const phoneNumber = ad.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Vi seu anúncio "${ad.title}" e tenho interesse no produto.`
    );
    window.open(`https://wa.me/55${phoneNumber}?text=${message}`, "_blank");
  };

  const handleFavoriteClick = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para favoritar anúncios",
        variant: "destructive",
      });
      return;
    }
    favoriteMutation.mutate(ad.id);
  };

  const timeAgo = formatDistanceToNow(ad.createdAt ? new Date(ad.createdAt) : new Date(), {
    addSuffix: true,
    locale: ptBR,
  });

  if (variant === "compact") {
    return (
      <Card 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md active:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer transform hover:-translate-y-1 active:scale-98" 
        onClick={() => onAdClick?.(ad)}
        data-testid={`card-ad-${ad.id}`}
      >
        <div className="aspect-square">
          {ad.imageUrl ? (
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-cover"
              data-testid={`img-ad-${ad.id}`}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Sem foto</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-3">
          <div className="flex items-center gap-1 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1 flex-1" data-testid={`text-title-${ad.id}`}>
              {ad.title}
            </h3>
            {ad.isPromoted && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-1 py-0">
                <Star className="h-2 w-2" />
              </Badge>
            )}
          </div>
          <p className="text-emerald-600 font-bold text-lg mb-1" data-testid={`text-price-${ad.id}`}>
            R$ {parseFloat(ad.price).toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
          
          {/* User Info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-medium">
                {ad.user?.firstName ? ad.user.firstName.charAt(0) : ad.username?.charAt(0) || '?'}
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400 text-xs truncate">
              {ad.user?.firstName && ad.user?.lastName 
                ? `${ad.user.firstName} ${ad.user.lastName}`
                : ad.username || 'Anônimo'
              }
            </span>
          </div>
          
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-3" data-testid={`text-location-${ad.id}`}>
            {ad.location}
          </p>
          
          <div className="space-y-1">
            <div className="flex gap-2">
              <Button
                onClick={handleWhatsAppClick}
                className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-1 text-sm"
                data-testid={`button-whatsapp-${ad.id}`}
              >
                <i className="fab fa-whatsapp"></i>
                <span>Chat</span>
              </Button>
              
              <BoostButton 
                ad={{ 
                  id: ad.id, 
                  title: ad.title, 
                  price: ad.price,
                  userId: ad.userId || undefined
                }}
                variant="outline"
                size="sm"
                className="px-3"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg active:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer transform hover:-translate-y-1 active:scale-98" 
      onClick={() => onAdClick?.(ad)}
      data-testid={`card-ad-${ad.id}`}
    >
      <div className="h-48">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
            data-testid={`img-ad-${ad.id}`}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-gray-400">Sem foto</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg" data-testid={`text-title-${ad.id}`}>
                {ad.title}
              </h3>
              {ad.isPromoted && (
                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  Destaque
                </Badge>
              )}
            </div>
            <p className="text-2xl font-bold text-emerald-600 mb-2" data-testid={`text-price-${ad.id}`}>
              R$ {parseFloat(ad.price).toLocaleString("pt-BR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
            
            {/* User Info */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {ad.user?.firstName ? ad.user.firstName.charAt(0) : ad.username?.charAt(0) || '?'}
                </span>
              </div>
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                {ad.user?.firstName && ad.user?.lastName 
                  ? `${ad.user.firstName} ${ad.user.lastName}`
                  : ad.username || 'Anônimo'
                }
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavoriteClick}
            disabled={favoriteMutation.isPending}
            className={`p-2 transition-colors ${
              isFavorited ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
            data-testid={`button-favorite-${ad.id}`}
          >
            <Heart
              className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`}
            />
          </Button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2" data-testid={`text-description-${ad.id}`}>
          {ad.description}
        </p>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <MapPin className="h-4 w-4 mr-2" />
          <span data-testid={`text-location-${ad.id}`}>{ad.location}</span>
          <span className="mx-2">•</span>
          <span data-testid={`text-time-${ad.id}`}>{timeAgo}</span>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={handleWhatsAppClick}
            className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:shadow-lg"
            data-testid={`button-whatsapp-${ad.id}`}
          >
            <i className="fab fa-whatsapp text-lg"></i>
            <span>Chat</span>
          </Button>
          
          <BoostButton 
            ad={{ 
              id: ad.id, 
              title: ad.title, 
              price: ad.price,
              userId: ad.userId || undefined
            }}
            variant="outline"
            size="default"
            className="px-4 py-3 flex-shrink-0"
          />
        </div>
      </CardContent>
    </Card>
  );
}
