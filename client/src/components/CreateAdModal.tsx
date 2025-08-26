import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAdSchema, type InsertAd, type Category } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, Plus } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CreateAdModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateAdModal({ open, onOpenChange }: CreateAdModalProps) {
  const [imagePreview, setImagePreview] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      return await apiRequest("POST", "/api/ads", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/ads"] });
      toast({
        title: "Anúncio criado com sucesso!",
        description: "Seu anúncio foi publicado e já está visível para outros usuários.",
      });
      form.reset();
      setImagePreview("");
      onOpenChange(false);
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
      // In a real app, you'd upload to a service like Cloudinary
      setImagePreview("https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Criar Anúncio</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Título do anúncio
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
              Preço
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
              Categoria
            </Label>
            <Select
              value={form.watch("categoryId")}
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
              Localização
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
              WhatsApp (com DDD)
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
              Descrição
            </Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Descreva seu produto..."
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
              Foto do produto
            </Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-emerald-600 transition-colors cursor-pointer">
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
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mx-auto h-32 w-32 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <>
                    <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Clique para adicionar uma foto
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
          
          <Button
            type="submit"
            disabled={createAdMutation.isPending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            data-testid="button-create-ad"
          >
            {createAdMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <span>Publicando...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Publicar Anúncio</span>
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
