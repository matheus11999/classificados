import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdSchema, type InsertAd, type Category } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CloudUpload, ArrowLeft, AlertTriangle } from "lucide-react";
import { userAuth } from "@/lib/user-auth";

export default function CreateAd() {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string>("");
  const [maxAds, setMaxAds] = useState(10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  

  useEffect(() => {
    // Check if user is authenticated
    if (!userAuth.isAuthenticated()) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para criar anúncios.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    // Load site settings to get max ads limit
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        if (settings.max_ads_per_user) {
          setMaxAds(parseInt(settings.max_ads_per_user));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };

    loadSettings();
  }, [setLocation]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<InsertAd>({
    resolver: zodResolver(insertAdSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      imageUrl: "",
      categoryId: "",
      location: "",
      whatsapp: "",
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: InsertAd) => {
      return await userAuth.apiCall("/api/ads", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/ads"] });
      toast({
        title: "🎉 Anúncio criado com sucesso!",
        description: "Seu anúncio foi publicado e já está visível para outros usuários.",
        duration: 3000,
      });
      
      // Reset form after successful creation
      form.reset();
      setImagePreview("");
      
      // Navigate after a short delay for better UX
      setTimeout(() => {
        setLocation("/profile");
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar anúncio",
        description: error.message || "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  // Check if user can create more ads
  const user = userAuth.getUser();
  const canCreateAd = user ? userAuth.canCreateAd(maxAds) : false;
  const activeAdsCount = user ? parseInt(user.activeAdsCount) : 0;

  // Show limit warning if user is authenticated but not loaded yet
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!canCreateAd) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <span>Limite de Anúncios Atingido</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você já possui {activeAdsCount} anúncios ativos. 
                O limite máximo é de {maxAds} anúncios por usuário.
                Para criar um novo anúncio, pause ou exclua um dos seus anúncios ativos.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 flex space-x-4">
              <Button onClick={() => setLocation("/profile")} variant="default">
                Gerenciar Meus Anúncios
              </Button>
              <Button onClick={() => setLocation("/")} variant="outline">
                Voltar para Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: InsertAd) => {
    const user = userAuth.getUser();
    
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para criar um anúncio.",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    
    const payload = {
      ...data,
      userId: user.id,
      imageUrl: imagePreview || undefined,
    };
    
    createAdMutation.mutate(payload);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width/height)
        const maxSize = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressed);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB for original)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Imagem muito grande",
          description: "A imagem deve ter no máximo 10MB. Tente usar uma imagem menor.",
          variant: "destructive",
        });
        return;
      }

      try {
        // Compress image
        const compressedDataUrl = await compressImage(file);
        const base64 = compressedDataUrl.split(',')[1];
        
        const response = await userAuth.apiCall('/api/upload/image', {
          method: 'POST',
          body: JSON.stringify({
            imageData: base64,
            fileName: file.name
          })
        });

        setImagePreview(response.imageUrl);
        toast({
          title: "📸 Imagem carregada!",
          description: "Sua imagem foi otimizada e está pronta.",
          duration: 2000,
        });
      } catch (error: any) {
        console.error("Error uploading image:", error);
        
        if (error.message && error.message.includes('request entity too large')) {
          toast({
            title: "🖼️ Imagem muito grande",
            description: "Por favor, use uma imagem menor (máx. 10MB).",
            variant: "destructive",
            duration: 4000,
          });
        } else {
          toast({
            title: "❌ Erro no upload",
            description: "Não foi possível carregar a imagem. Tente novamente.",
            variant: "destructive",
            duration: 3000,
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Criar Novo Anúncio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-sm font-medium">
                Título do anúncio *
              </Label>
              <Input
                id="title"
                placeholder="Ex: iPhone 13 Pro Max"
                {...form.register("title")}
                className="mt-2"
                data-testid="input-title"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Preço (R$) *
              </Label>
              <Input
                id="price"
                placeholder="1500"
                {...form.register("price")}
                className="mt-2"
                data-testid="input-price"
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="category" className="text-sm font-medium">
                Categoria *
              </Label>
              <Select
                value={form.watch("categoryId") || ""}
                onValueChange={(value) => form.setValue("categoryId", value)}
              >
                <SelectTrigger className="mt-2" data-testid="select-category">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="location" className="text-sm font-medium">
                Localização *
              </Label>
              <Input
                id="location"
                placeholder="Ex: Centro, São Paulo - SP"
                {...form.register("location")}
                className="mt-2"
                data-testid="input-location"
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.location.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="whatsapp" className="text-sm font-medium">
                WhatsApp (com DDD) *
              </Label>
              <Input
                id="whatsapp"
                placeholder="11999999999"
                {...form.register("whatsapp")}
                className="mt-2"
                data-testid="input-whatsapp"
              />
              {form.formState.errors.whatsapp && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.whatsapp.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição *
              </Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Descreva detalhadamente seu produto ou serviço..."
                {...form.register("description")}
                className="mt-2 resize-none"
                data-testid="textarea-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="image" className="text-sm font-medium">
                Foto do produto (opcional)
              </Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-emerald-600 transition-colors cursor-pointer">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-image"
                />
                <label htmlFor="image" className="cursor-pointer">
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mx-auto h-40 w-40 object-cover rounded-lg"
                      />
                      <p className="text-emerald-600 text-sm">Clique para alterar a foto</p>
                    </div>
                  ) : (
                    <>
                      <CloudUpload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">
                        Clique para adicionar uma foto
                      </p>
                      <p className="text-sm text-gray-400">
                        PNG, JPG até 10MB (otimização automática)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAdMutation.isPending}
                className={`flex-1 transition-all duration-200 ${
                  createAdMutation.isPending 
                    ? "bg-emerald-400 cursor-not-allowed" 
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                } text-white shadow-md hover:shadow-lg active:shadow-sm`}
                data-testid="button-create-ad"
              >
                {createAdMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">📢</span>
                    Publicar Anúncio
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
