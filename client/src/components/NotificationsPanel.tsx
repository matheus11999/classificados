import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Trash2, Check, Bell, Clock, Eye } from "lucide-react";
import { userAuth } from "@/lib/user-auth";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const userNotifications = await userAuth.getNotifications();
      setNotifications(userNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notificações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
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

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    try {
      await Promise.all(
        unreadNotifications.map(n => userAuth.markNotificationAsRead(n.id))
      );
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Erro",
        description: "Erro ao marcar notificações como lidas",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'boost':
        return <Bell className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Agora há pouco";
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return "Ontem";
      } else if (diffInDays < 7) {
        return `${diffInDays} dias atrás`;
      } else {
        return date.toLocaleDateString('pt-BR');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-lg sm:rounded-lg w-full sm:max-w-md h-[90vh] sm:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificações
            </h2>
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {notifications.filter(n => !n.read).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <Check className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Nenhuma notificação
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Você será notificado sobre atividades em seus anúncios
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`group cursor-pointer transition-colors ${
                    !notification.read 
                      ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(notification.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 ml-2 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-opacity"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}