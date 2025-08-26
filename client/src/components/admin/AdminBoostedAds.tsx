import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, Clock, DollarSign, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoostedAd {
  id: string;
  adId: string;
  promotionId: string;
  paymentId: string;
  paymentStatus: string;
  paymentMethod: string;
  amount: string;
  payerName: string;
  payerLastName: string;
  payerCpf: string;
  payerEmail?: string;
  payerPhone?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  promotion: {
    id: string;
    name: string;
    price: string;
    durationDays: string;
  };
  ad: {
    id: string;
    title: string;
    price: string;
    location: string;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
    };
  };
}

export default function AdminBoostedAds() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boostedAds = [], isLoading } = useQuery<BoostedAd[]>({
    queryKey: ['/api/admin/boost/ads'],
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => 
      apiRequest('PATCH', `/api/admin/boost/ads/${id}/toggle`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/boost/ads'] });
      toast({ title: 'Status atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleToggleStatus = (id: string, currentActive: boolean) => {
    toggleMutation.mutate({ id, active: !currentActive });
  };

  const getStatusBadge = (paymentStatus: string, active: boolean) => {
    if (paymentStatus === 'approved' && active) {
      return <Badge className="bg-green-500">Ativo</Badge>;
    } else if (paymentStatus === 'approved' && !active) {
      return <Badge variant="secondary">Pausado</Badge>;
    } else if (paymentStatus === 'pending') {
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      return <Badge variant="destructive">Rejeitado</Badge>;
    } else {
      return <Badge variant="secondary">{paymentStatus}</Badge>;
    }
  };

  const getStatusIcon = (paymentStatus: string, active: boolean) => {
    if (paymentStatus === 'approved' && active) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (paymentStatus === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else if (paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredBoostedAds = boostedAds.filter((boostedAd) => {
    const matchesSearch = !searchQuery || 
      boostedAd.ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boostedAd.payerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      boostedAd.payerLastName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && boostedAd.paymentStatus === 'approved' && boostedAd.active) ||
      (statusFilter === 'pending' && boostedAd.paymentStatus === 'pending') ||
      (statusFilter === 'rejected' && (boostedAd.paymentStatus === 'rejected' || boostedAd.paymentStatus === 'cancelled')) ||
      (statusFilter === 'paused' && boostedAd.paymentStatus === 'approved' && !boostedAd.active);
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: boostedAds.length,
    active: boostedAds.filter(b => b.paymentStatus === 'approved' && b.active).length,
    pending: boostedAds.filter(b => b.paymentStatus === 'pending').length,
    totalRevenue: boostedAds
      .filter(b => b.paymentStatus === 'approved')
      .reduce((sum, b) => sum + parseFloat(b.amount), 0)
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Anúncios Impulsionados
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gerencie todos os anúncios que foram impulsionados pelos usuários
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Impulsos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impulsos Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título, nome do pagador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="paused">Pausados</SelectItem>
            <SelectItem value="rejected">Rejeitados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Boosted Ads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Anúncios Impulsionados</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os impulsionamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anúncio</TableHead>
                <TableHead>Pagador</TableHead>
                <TableHead>Promoção</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBoostedAds.map((boostedAd) => (
                <TableRow key={boostedAd.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{boostedAd.ad.title}</div>
                      <div className="text-sm text-gray-500">
                        R$ {parseFloat(boostedAd.ad.price).toFixed(2)} - {boostedAd.ad.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {boostedAd.payerName} {boostedAd.payerLastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {boostedAd.payerCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                      </div>
                      {boostedAd.payerEmail && (
                        <div className="text-sm text-gray-500">
                          {boostedAd.payerEmail}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{boostedAd.promotion.name}</div>
                      <div className="text-sm text-gray-500">
                        {boostedAd.promotion.durationDays} dias
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-green-600">
                      R$ {parseFloat(boostedAd.amount).toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(boostedAd.paymentStatus, boostedAd.active)}
                      {getStatusBadge(boostedAd.paymentStatus, boostedAd.active)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {boostedAd.startDate && boostedAd.endDate ? (
                        <>
                          <div>Início: {new Date(boostedAd.startDate).toLocaleDateString('pt-BR')}</div>
                          <div>Fim: {new Date(boostedAd.endDate).toLocaleDateString('pt-BR')}</div>
                        </>
                      ) : (
                        <div className="text-gray-500">
                          Criado {formatDistanceToNow(new Date(boostedAd.createdAt), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {boostedAd.paymentStatus === 'approved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(boostedAd.id, boostedAd.active)}
                        disabled={toggleMutation.isPending}
                      >
                        {boostedAd.active ? 'Pausar' : 'Ativar'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredBoostedAds.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum anúncio impulsionado encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}