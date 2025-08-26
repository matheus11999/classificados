import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronRight, Package, User, Settings, Eye, Trash2, Plus, LogOut, Edit, MapPin, Calendar, Bell, ArrowLeft } from "lucide-react";
import { userAuth } from "@/lib/user-auth";
import { useToast } from "@/hooks/use-toast";

interface UserAd {
  id: string;
  title: string;
  description: string;
  price: string;
  location: string;
  active: boolean;
  views: string;
  expiresAt: string;
  createdAt: string;
  category: {
    name: string;
    icon: string;
  } | null;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function UserDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState(userAuth.getUser());
  const [ads, setAds] = useState<UserAd[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'profile' | 'ads' | 'settings'>('profile');
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    whatsapp: user?.whatsapp || "",
    cpf: user?.cpf || "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userAuth.isAuthenticated()) {
      setLocation("/login");
      return;
    }
    
    loadData();
  }, [setLocation]);

  const loadData = async () => {
    try {
      const [userAds, userNotifications] = await Promise.all([
        userAuth.getUserAds(),
        userAuth.getNotifications()
      ]);
      setAds(userAds);
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    try {
      const updatedUser = await userAuth.updateProfile(profileData);
      setUser(updatedUser);
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await userAuth.apiCall(`/api/ads/${adId}`, {
        method: 'DELETE',
      });
      
      setAds(ads.filter(ad => ad.id !== adId));
      
      toast({
        title: "Anúncio pausado",
        description: "Seu anúncio foi pausado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao pausar anúncio",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    userAuth.logout();
    setLocation("/");
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await userAuth.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await userAuth.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast({
        title: "Notificação removida",
        description: "A notificação foi excluída com sucesso",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir notificação",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeAds = ads.filter(ad => ad.active);
  const inactiveAds = ads.filter(ad => !ad.active);
  const unreadNotifications = notifications.filter(n => !n.read);
  const totalViews = ads.reduce((sum, ad) => sum + parseInt(ad.views || "0"), 0);

  // Profile Menu View
  if (currentView === 'profile') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-white" />
              )}
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.firstName || user?.username}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              @{user?.username}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {activeAds.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Anúncios
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {totalViews}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Visualizações
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {unreadNotifications.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Notificações
              </div>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="space-y-3">
          {/* My Ads */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setCurrentView('ads')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Meus Anúncios</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeAds.length} anúncios ativos
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Create New Ad */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation('/create')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Criar Anúncio</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Publique um novo produto
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setCurrentView('settings')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                    <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Configurações</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Editar perfil e preferências
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer border-red-200 dark:border-red-800"
            onClick={handleLogout}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                    <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-red-600 dark:text-red-400">Sair</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Fazer logout da conta
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    );
  }

  // Ads View
  if (currentView === 'ads') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('profile')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Meus Anúncios</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {activeAds.length} anúncios ativos
            </p>
          </div>
        </div>

        {/* Ads List */}
        <div className="space-y-3">
          {ads.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum anúncio</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Comece criando seu primeiro anúncio
                </p>
                <Button onClick={() => setLocation("/create")} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Anúncio
                </Button>
              </CardContent>
            </Card>
          ) : (
            ads.map((ad) => (
              <Card key={ad.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {ad.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          R$ {parseFloat(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Badge variant={ad.active ? "default" : "secondary"}>
                          {ad.active ? "Ativo" : "Pausado"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1 text-gray-500">
                          <Eye className="h-4 w-4" />
                          <span>{ad.views || 0} visualizações</span>
                        </div>
                        {ad.location && (
                          <div className="flex items-center space-x-1 text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate max-w-20">{ad.location}</span>
                          </div>
                        )}
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Pausar anúncio</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja pausar "{ad.title}"? Você pode reativá-lo depois.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteAd(ad.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Pausar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        </div>
      </div>
    );
  }

  // Settings View
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('profile')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Configurações</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Edite suas informações pessoais
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Meu Perfil</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  placeholder="Seu sobrenome"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={profileData.whatsapp}
                  onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Número para contato nos seus anúncios
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={profileData.cpf}
                  onChange={(e) => {
                    // Remove non-digits and limit to 11 characters
                    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setProfileData({ ...profileData, cpf: value });
                  }}
                  placeholder="00000000000"
                  maxLength={11}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Necessário para impulsionar anúncios (apenas números)
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Informações da Conta</Label>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Username:</span>
                  <span className="text-sm font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Membro desde:</span>
                  <span className="text-sm font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            <Button onClick={handleProfileUpdate} disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Fallback - should never reach here
  return null;
}