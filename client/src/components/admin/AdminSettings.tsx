import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Globe, Mail, Phone, Image } from "lucide-react";
import { adminAuth } from "@/lib/admin-auth";
import { useToast } from "@/hooks/use-toast";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: string;
}

interface SettingsState {
  site_name: string;
  site_description: string;
  site_keywords: string;
  site_logo: string;
  contact_email: string;
  contact_phone: string;
  allow_registrations: boolean;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SettingsState>({
    site_name: "",
    site_description: "",
    site_keywords: "",
    site_logo: "",
    contact_email: "",
    contact_phone: "",
    allow_registrations: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data: SiteSetting[] = await adminAuth.apiCall('/api/admin/settings');
      
      const settingsObj: Partial<SettingsState> = {};
      data.forEach(setting => {
        if (setting.type === 'boolean') {
          (settingsObj as any)[setting.key] = setting.value === 'true';
        } else {
          (settingsObj as any)[setting.key] = setting.value;
        }
      });
      
      setSettings(prev => ({ ...prev, ...settingsObj }));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = {
        ...settings,
        allow_registrations: settings.allow_registrations ? 'true' : 'false',
      };

      await adminAuth.apiCall('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settingsToSave),
      });
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (key: keyof SettingsState, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="contact">Contato</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações Gerais</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Nome do Site</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => handleInputChange('site_name', e.target.value)}
                    placeholder="PWA Marketplace"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="site_logo">URL do Logo</Label>
                  <Input
                    id="site_logo"
                    value={settings.site_logo}
                    onChange={(e) => handleInputChange('site_logo', e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site_description">Descrição do Site</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                  placeholder="Marketplace de produtos e serviços"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Novos Cadastros</Label>
                  <div className="text-sm text-gray-600">
                    Permite que usuários criem novas contas
                  </div>
                </div>
                <Switch
                  checked={settings.allow_registrations}
                  onCheckedChange={(checked) => handleInputChange('allow_registrations', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Configurações de SEO</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_keywords">Palavras-chave</Label>
                <Input
                  id="site_keywords"
                  value={settings.site_keywords}
                  onChange={(e) => handleInputChange('site_keywords', e.target.value)}
                  placeholder="marketplace, produtos, serviços, compra, venda"
                />
                <p className="text-sm text-gray-600">
                  Separe as palavras-chave por vírgulas
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seo_description">Meta Description</Label>
                <Textarea
                  id="seo_description"
                  value={settings.site_description}
                  onChange={(e) => handleInputChange('site_description', e.target.value)}
                  placeholder="Encontre os melhores produtos e serviços em nosso marketplace"
                  rows={3}
                />
                <p className="text-sm text-gray-600">
                  Máximo de 160 caracteres para melhor SEO
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Informações de Contato</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email de Contato</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_email"
                      type="email"
                      className="pl-10"
                      value={settings.contact_email}
                      onChange={(e) => handleInputChange('contact_email', e.target.value)}
                      placeholder="contato@marketplace.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone de Contato</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="contact_phone"
                      type="tel"
                      className="pl-10"
                      value={settings.contact_phone}
                      onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                      placeholder="(11) 9999-9999"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}