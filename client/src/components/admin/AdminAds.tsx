import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Toggle } from "@/components/ui/toggle";
import { Trash2, Eye, EyeOff, Package } from "lucide-react";
import { adminAuth } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";

interface Ad {
  id: string;
  title: string;
  description: string;
  price: string;
  location: string;
  whatsapp: string;
  active: boolean;
  featured: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  category: {
    id: string;
    name: string;
    icon: string;
  } | null;
}

export default function AdminAds() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const data = await adminAuth.apiCall('/api/admin/ads');
      setAds(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar anúncios",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (adId: string, active: boolean) => {
    try {
      await adminAuth.apiCall(`/api/admin/ads/${adId}/toggle`, {
        method: 'PATCH',
        body: JSON.stringify({ active }),
      });
      
      setAds(ads.map(ad => 
        ad.id === adId ? { ...ad, active } : ad
      ));
      
      toast({
        title: "Sucesso",
        description: active ? "Anúncio ativado" : "Anúncio desativado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do anúncio",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await adminAuth.apiCall(`/api/admin/ads/${adId}`, {
        method: 'DELETE',
      });
      
      setAds(ads.filter(ad => ad.id !== adId));
      
      toast({
        title: "Sucesso",
        description: "Anúncio deletado permanentemente",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar anúncio",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciar Anúncios</span>
          <div className="flex space-x-2">
            <Badge variant="secondary">{ads.filter(ad => ad.active).length} ativos</Badge>
            <Badge variant="destructive">{ads.filter(ad => !ad.active).length} inativos</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ads.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum anúncio</h3>
            <p className="mt-1 text-sm text-gray-500">
              Nenhum anúncio cadastrado no sistema ainda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Anunciante</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{ad.title}</div>
                      {ad.featured && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Destaque
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        R$ {parseFloat(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ad.category ? (
                        <div className="flex items-center space-x-2">
                          <i className={`${ad.category.icon} text-sm`}></i>
                          <span>{ad.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{ad.location}</TableCell>
                    <TableCell>
                      {ad.user ? (
                        <div>
                          <div className="font-medium">
                            {ad.user.firstName} {ad.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{ad.user.email}</div>
                        </div>
                      ) : (
                        <Badge variant="outline">Anônimo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.active ? "default" : "secondary"}>
                        {ad.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(ad.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(ad.id, !ad.active)}
                        >
                          {ad.active ? (
                            <EyeOff className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja deletar permanentemente o anúncio "{ad.title}"? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAd(ad.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}