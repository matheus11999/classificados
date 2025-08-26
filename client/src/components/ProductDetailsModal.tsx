import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Eye, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdWithDetails } from "@shared/schema";

interface ProductDetailsModalProps {
  ad: AdWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailsModal({ ad, open, onOpenChange }: ProductDetailsModalProps) {
  if (!ad) return null;

  const handleWhatsAppClick = () => {
    const phoneNumber = ad.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Vi seu anúncio "${ad.title}" e tenho interesse no produto.`
    );
    window.open(`https://wa.me/55${phoneNumber}?text=${message}`, "_blank");
  };

  const timeAgo = formatDistanceToNow(ad.createdAt ? new Date(ad.createdAt) : new Date(), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {ad.isPromoted && (
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            <span className="flex-1">{ad.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {ad.imageUrl && (
            <div className="aspect-video w-full rounded-xl overflow-hidden">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Price and Basic Info */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-emerald-600">
                R$ {parseFloat(ad.price).toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{ad.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{timeAgo}</span>
                </div>
                {ad.views && (
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{ad.views} visualizações</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category */}
          {ad.category && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Categoria:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <i className={`${ad.category.icon} text-sm`}></i>
                {ad.category.name}
              </Badge>
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Descrição</h3>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {ad.description}
            </p>
          </div>

          {/* Seller Info */}
          {(ad as any).sellerName && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-semibold text-lg mb-2">Vendedor</h3>
              <p className="text-gray-700 dark:text-gray-300">{(ad as any).sellerName}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleWhatsAppClick}
              className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <i className="fab fa-whatsapp text-lg"></i>
              <span>Contato via WhatsApp</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}