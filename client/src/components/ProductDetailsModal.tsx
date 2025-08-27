import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Eye, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdWithDetails } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface ProductDetailsModalProps {
  ad: AdWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailsModal({ ad, open, onOpenChange }: ProductDetailsModalProps) {
  if (!ad) return null;

  // Fetch detailed ad data when modal opens to count views
  const { data: detailedAd, isLoading } = useQuery<AdWithDetails>({
    queryKey: [`/api/ads/${ad.id}`],
    enabled: open, // Only fetch when modal is open
  });

  // Use detailed ad data if available, otherwise fall back to the passed ad
  const currentAd = detailedAd || ad;

  const handleWhatsAppClick = () => {
    const phoneNumber = currentAd.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Vi seu anúncio "${currentAd.title}" e tenho interesse no produto.`
    );
    window.open(`https://wa.me/55${phoneNumber}?text=${message}`, "_blank");
  };

  const timeAgo = formatDistanceToNow(currentAd.createdAt ? new Date(currentAd.createdAt) : new Date(), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentAd.isPromoted && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            <span className="flex-1">{currentAd.title}</span>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos do produto à venda
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image */}
            {currentAd.imageUrl && (
              <div className="aspect-video w-full rounded-xl overflow-hidden">
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Price and Basic Info */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-emerald-600">
                  R$ {parseFloat(currentAd.price).toLocaleString("pt-BR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{currentAd.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{currentAd.views || 0} visualizações</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {currentAd.user?.firstName ? currentAd.user.firstName.charAt(0) : currentAd.user?.username?.charAt(0) || '?'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {currentAd.user?.firstName && currentAd.user?.lastName 
                    ? `${currentAd.user.firstName} ${currentAd.user.lastName}`
                    : currentAd.user?.username || 'Anônimo'
                  }
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">Vendedor</p>
              </div>
            </div>

            {/* Category */}
            {currentAd.category && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Categoria:</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <i className={`${currentAd.category.icon} text-sm`}></i>
                  {currentAd.category.name}
                </Badge>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Descrição</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {currentAd.description}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
          <Button
            onClick={handleWhatsAppClick}
            disabled={isLoading}
            className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <i className="fab fa-whatsapp text-lg"></i>
            <span>Contato via WhatsApp</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}