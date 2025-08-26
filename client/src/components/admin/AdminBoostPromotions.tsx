import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, Edit, Trash2, DollarSign, Calendar, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BoostPromotion {
  id: string;
  name: string;
  price: string;
  durationDays: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBoostPromotions() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<BoostPromotion | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationDays: '5',
    description: '',
    active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: promotions = [], isLoading } = useQuery<BoostPromotion[]>({
    queryKey: ['/api/admin/boost/promotions'],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/boost/promotions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/boost/promotions'] });
      toast({ title: 'Promoção criada com sucesso!' });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      setError(error.message || 'Erro ao criar promoção');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PUT', `/api/admin/boost/promotions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/boost/promotions'] });
      toast({ title: 'Promoção atualizada com sucesso!' });
      setEditModalOpen(false);
      setEditingPromotion(null);
      resetForm();
    },
    onError: (error: any) => {
      setError(error.message || 'Erro ao atualizar promoção');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/boost/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/boost/promotions'] });
      toast({ title: 'Promoção deletada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao deletar promoção', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      durationDays: '5',
      description: '',
      active: true
    });
    setError(null);
  };

  const handleCreate = () => {
    setCreateModalOpen(true);
    resetForm();
  };

  const handleEdit = (promotion: BoostPromotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      price: promotion.price,
      durationDays: promotion.durationDays,
      description: promotion.description || '',
      active: promotion.active
    });
    setEditModalOpen(true);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Nome da promoção é obrigatório');
      return;
    }

    if (!formData.price.trim() || isNaN(parseFloat(formData.price))) {
      setError('Preço deve ser um número válido');
      return;
    }

    if (!formData.durationDays.trim() || isNaN(parseInt(formData.durationDays))) {
      setError('Duração deve ser um número válido');
      return;
    }

    if (editingPromotion) {
      updateMutation.mutate({ id: editingPromotion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar esta promoção?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Promoções de Impulsionamento
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os pacotes de impulsionamento disponíveis para os usuários
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Promoção
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Promoções</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promoções Ativas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {promotions.filter(p => p.active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {promotions.length > 0 ? 
                (promotions.reduce((sum, p) => sum + parseFloat(p.price), 0) / promotions.length).toFixed(2) 
                : '0.00'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Promoções</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as promoções de impulsionamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.map((promotion) => (
                <TableRow key={promotion.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{promotion.name}</div>
                      {promotion.description && (
                        <div className="text-sm text-gray-500 mt-1">
                          {promotion.description.substring(0, 80)}
                          {promotion.description.length > 80 && '...'}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600">
                      R$ {parseFloat(promotion.price).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {promotion.durationDays} dias
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promotion.active ? "default" : "secondary"}>
                      {promotion.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(promotion.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(promotion.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={createModalOpen || editModalOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateModalOpen(false);
          setEditModalOpen(false);
          setEditingPromotion(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? 'Editar Promoção' : 'Nova Promoção'}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion ? 'Edite os dados da promoção' : 'Crie uma nova promoção de impulsionamento'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Promoção</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Impulso Básico"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="9.99"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationDays">Duração (dias)</Label>
                <Input
                  id="durationDays"
                  type="number"
                  min="1"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  placeholder="5"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da promoção que será mostrada aos usuários"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Promoção ativa</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setCreateModalOpen(false);
                  setEditModalOpen(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingPromotion ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}