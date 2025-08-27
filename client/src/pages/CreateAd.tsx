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
  const [images, setImages] = useState<{ file: File; preview: string; isPrimary: boolean; uploaded?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
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
      setImages([]);
      
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

  const onSubmit = async (data: InsertAd) => {
    // Prevent double submission
    if (createAdMutation.isPending || uploading) {
      return;
    }

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

    try {
      // Upload images first if any
      let primaryImageUrl = undefined;
      let uploadedUrls: string[] = [];
      
      if (images.length > 0) {
        uploadedUrls = await uploadImages();
        const primaryImage = images.find(img => img.isPrimary);
        const primaryIndex = images.indexOf(primaryImage!);
        primaryImageUrl = uploadedUrls[primaryIndex];
      }
      
      const payload = {
        ...data,
        userId: user.id,
        imageUrl: primaryImageUrl, // Keep for backwards compatibility
        images: uploadedUrls, // Send all images to backend
      };
      
      createAdMutation.mutate(payload);
    } catch (error) {
      // Error already shown in uploadImages
      return;
    }
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

  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check total number of images (max 6)
    if (images.length + files.length > 6) {
      toast({
        title: "Muitas imagens",
        description: "Você pode adicionar no máximo 6 imagens por anúncio.",
        variant: "destructive",
      });
      return;
    }

    const newImages: { file: File; preview: string; isPrimary: boolean; uploaded?: string }[] = [];

    for (const file of files) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Imagem muito grande",
          description: `A imagem ${file.name} deve ter no máximo 10MB.`,
          variant: "destructive",
        });
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      newImages.push({
        file,
        preview,
        isPrimary: images.length === 0 && newImages.length === 0, // First image is primary
        uploaded: undefined
      });
    }

    setImages(prev => [...prev, ...newImages]);
  };

  const uploadImages = async () => {
    setUploading(true);
    const uploadedImages: string[] = [];

    try {
      for (const image of images) {
        if (image.uploaded) {
          uploadedImages.push(image.uploaded);
          continue;
        }

        // Compress image
        const compressedDataUrl = await compressImage(image.file);
        const base64 = compressedDataUrl.split(',')[1];
        
        const response = await userAuth.apiCall('/api/upload/image', {
          method: 'POST',
          body: JSON.stringify({
            imageData: base64,
            fileName: image.file.name
          })
        });

        if (response.imageUrl) {
          uploadedImages.push(response.imageUrl);
          // Update the image state with uploaded URL
          setImages(prev => prev.map(img => 
            img === image ? { ...img, uploaded: response.imageUrl } : img
          ));
        }
      }

      return uploadedImages;
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast({
        title: "❌ Erro no upload",
        description: "Não foi possível fazer upload de algumas imagens.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      // If we removed the primary image, make the first image primary
      if (prev[index].isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
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
              <Label className="text-sm font-medium">
                Fotos do produto (opcional) - Máximo 6 fotos
              </Label>
              
              {/* Upload Area */}
              <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-emerald-600 transition-colors cursor-pointer">
                <input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesUpload}
                  className="hidden"
                  data-testid="input-images"
                />
                <label htmlFor="images" className="cursor-pointer">
                  <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-1">
                    Clique para adicionar fotos
                  </p>
                  <p className="text-sm text-gray-400">
                    PNG, JPG até 10MB cada ({images.length}/6)
                  </p>
                </label>
              </div>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                        image.isPrimary ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-600'
                      }`}>
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-2 py-1 rounded-md font-medium">
                            Principal
                          </div>
                        )}
                        {image.uploaded && (
                          <div className="absolute top-1 right-8 bg-green-500 text-white text-xs px-2 py-1 rounded-md">
                            ✓
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      {!image.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="mt-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Definir como principal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                disabled={createAdMutation.isPending || uploading}
                className={`flex-1 transition-all duration-200 ${
                  createAdMutation.isPending || uploading
                    ? "bg-emerald-400 cursor-not-allowed" 
                    : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                } text-white shadow-md hover:shadow-lg active:shadow-sm`}
                data-testid="button-create-ad"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando fotos...
                  </>
                ) : createAdMutation.isPending ? (
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
