import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Bell, Package, User, Settings, Eye, Trash2, Pause, Play, Edit } from "lucide-react";
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
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    whatsapp: user?.whatsapp || "",
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
        userAuth.getNotifications(),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeAds = ads.filter(ad => ad.active);
  const inactiveAds = ads.filter(ad => !ad.active);
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Meu Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Olá, {user?.firstName || user?.username}!
              </span>
              <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
                Voltar ao site
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anúncios Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeAds.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ads.reduce((sum, ad) => sum + parseInt(ad.views || "0"), 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anúncios Pausados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveAds.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificações</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {unreadNotifications.length}
                <span className="text-sm text-gray-500 ml-1">não lidas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="ads" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ads">Meus Anúncios</TabsTrigger>
            <TabsTrigger value="notifications">
              Notificações 
              {unreadNotifications.length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadNotifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ads" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Meus Anúncios</span>
                  <Button onClick={() => setLocation("/create")}>
                    Criar Novo Anúncio
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ads.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum anúncio</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Comece criando seu primeiro anúncio
                    </p>
                    <Button className="mt-4" onClick={() => setLocation("/create")}>
                      Criar Anúncio
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Visualizações</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expira em</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ads.map((ad) => (
                          <TableRow key={ad.id}>
                            <TableCell className="font-medium max-w-xs">
                              <div className="truncate">{ad.title}</div>
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
                            <TableCell>
                              <Badge variant="outline">
                                R$ {parseFloat(ad.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-4 w-4 text-gray-400" />
                                <span>{ad.views || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={ad.active ? "default" : "secondary"}>
                                {ad.active ? "Ativo" : "Pausado"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {ad.expiresAt ? (
                                <span className="text-sm">
                                  {new Date(ad.expiresAt).toLocaleDateString('pt-BR')}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Pausar anúncio</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja pausar o anúncio "{ad.title}"? 
                                        Você pode reativá-lo depois.
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma notificação</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Você será notificado sobre atividades em seus anúncios
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 rounded-lg border ${
                          !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(notification.createdAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          {!notification.read && (
                            <Badge variant="destructive" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Meu Perfil</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={profileData.whatsapp}
                    onChange={(e) => setProfileData({ ...profileData, whatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                  <p className="text-sm text-gray-600">
                    Número para contato nos seus anúncios
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Informações da Conta</Label>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Username:</span>
                      <span className="text-sm font-medium">{user?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium">{user?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Membro desde:</span>
                      <span className="text-sm font-medium">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleProfileUpdate} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}