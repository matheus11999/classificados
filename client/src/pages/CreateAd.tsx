import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdSchema, type InsertAd } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CloudUpload, ArrowLeft } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CreateAd() {
  const [, setLocation] = useLocation();
  const [imagePreview, setImagePreview] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery({
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
      return await apiRequest("POST", "/api/ads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/ads"] });
      toast({
        title: "Anúncio criado com sucesso!",
        description: "Seu anúncio foi publicado e já está visível para outros usuários.",
      });
      setLocation("/my-ads");
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
        title: "Erro ao criar anúncio",
        description: "Não foi possível criar seu anúncio. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAd) => {
    createAdMutation.mutate({
      ...data,
      imageUrl: imagePreview || undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For demo purposes, we'll use a placeholder image
      setImagePreview("https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop");
    }
  };

  return (
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
                value={form.watch("categoryId")}
                onValueChange={(value) => form.setValue("categoryId", value)}
              >
                <SelectTrigger className="mt-2" data-testid="select-category">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
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
                        PNG, JPG até 10MB
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
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-create-ad"
              >
                {createAdMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Publicando...
                  </>
                ) : (
                  "Publicar Anúncio"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
