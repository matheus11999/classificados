import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Zap, Star, CreditCard, CheckCircle, XCircle } from 'lucide-react';

interface BoostPromotion {
  id: string;
  name: string;
  price: string;
  durationDays: string;
  description: string;
  active: boolean;
}

interface Ad {
  id: string;
  title: string;
  price: string;
}

interface BoostAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  ad: Ad | null;
}

export function BoostAdModal({ isOpen, onClose, ad }: BoostAdModalProps) {
  const [step, setStep] = useState<'select-plan' | 'fill-data' | 'payment' | 'success' | 'error'>('select-plan');
  const [promotions, setPromotions] = useState<BoostPromotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<BoostPromotion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [payerName, setPayerName] = useState('');
  const [payerLastName, setPayerLastName] = useState('');
  const [payerCpf, setPayerCpf] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  
  // Payment data
  const [paymentData, setPaymentData] = useState<any>(null);
  const [boostedAdId, setBoostedAdId] = useState<string | null>(null);

  // Fetch promotions on mount
  useEffect(() => {
    if (isOpen) {
      fetchPromotions();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('select-plan');
      setSelectedPromotion(null);
      setPayerName('');
      setPayerLastName('');
      setPayerCpf('');
      setPayerEmail('');
      setPayerPhone('');
      setPaymentData(null);
      setBoostedAdId(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/boost/promotions');
      if (!response.ok) throw new Error('Erro ao carregar promoções');
      const data = await response.json();
      setPromotions(data);
    } catch (err) {
      setError('Erro ao carregar promoções de impulsionamento');
      console.error(err);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    return numbers.length === 11;
  };

  const validateForm = (): boolean => {
    if (!payerName.trim() || payerName.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return false;
    }
    
    if (!payerLastName.trim() || payerLastName.length < 2) {
      setError('Sobrenome deve ter pelo menos 2 caracteres');
      return false;
    }
    
    if (!validateCPF(payerCpf)) {
      setError('CPF deve ter 11 dígitos');
      return false;
    }
    
    if (payerEmail && !/\S+@\S+\.\S+/.test(payerEmail)) {
      setError('Email inválido');
      return false;
    }
    
    return true;
  };

  const handleCreateBoost = async () => {
    if (!ad || !selectedPromotion) return;
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/boost/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adId: ad.id,
          promotionId: selectedPromotion.id,
          payerName: payerName.trim(),
          payerLastName: payerLastName.trim(),
          payerCpf: payerCpf.replace(/\D/g, ''),
          payerEmail: payerEmail.trim() || undefined,
          payerPhone: payerPhone.replace(/\D/g, '') || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar impulsionamento');
      }

      const data = await response.json();
      setPaymentData(data.payment);
      setBoostedAdId(data.boostedAd.id);
      setStep('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!boostedAdId) return;
    
    try {
      const response = await fetch(`/api/boost/status/${boostedAdId}`);
      if (!response.ok) throw new Error('Erro ao verificar pagamento');
      
      const data = await response.json();
      
      if (data.paymentStatus === 'approved') {
        setStep('success');
      } else if (data.paymentStatus === 'rejected' || data.paymentStatus === 'cancelled') {
        setStep('error');
        setError('Pagamento foi rejeitado ou cancelado');
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  };

  // Check payment status every 5 seconds when in payment step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'payment' && boostedAdId) {
      interval = setInterval(checkPaymentStatus, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, boostedAdId]);

  const handleClose = () => {
    onClose();
    // Reset form after a short delay to avoid visual glitch
    setTimeout(() => {
      setStep('select-plan');
      setSelectedPromotion(null);
      setPayerName('');
      setPayerLastName('');
      setPayerCpf('');
      setPayerEmail('');
      setPayerPhone('');
      setPaymentData(null);
      setBoostedAdId(null);
      setError(null);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Impulsionar Anúncio
          </DialogTitle>
          <DialogDescription>
            {ad && `Impulsione "${ad.title}" para ter mais visibilidade`}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'select-plan' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Escolha seu plano de impulsionamento:</h3>
            
            <div className="grid gap-4">
              {promotions.map((promotion) => (
                <Card
                  key={promotion.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPromotion?.id === promotion.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPromotion(promotion)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {promotion.name === 'Impulso Premium' ? (
                          <Star className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <Zap className="h-5 w-5 text-blue-500" />
                        )}
                        {promotion.name}
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          R$ {parseFloat(promotion.price).toFixed(2)}
                        </div>
                        <Badge variant="secondary">
                          {promotion.durationDays} dias
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{promotion.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => setStep('fill-data')}
                disabled={!selectedPromotion}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 'fill-data' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados para pagamento:</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payerName">Nome *</Label>
                <Input
                  id="payerName"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Seu nome"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="payerLastName">Sobrenome *</Label>
                <Input
                  id="payerLastName"
                  value={payerLastName}
                  onChange={(e) => setPayerLastName(e.target.value)}
                  placeholder="Seu sobrenome"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerCpf">CPF *</Label>
              <Input
                id="payerCpf"
                value={payerCpf}
                onChange={(e) => setPayerCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerEmail">Email (opcional)</Label>
              <Input
                id="payerEmail"
                type="email"
                value={payerEmail}
                onChange={(e) => setPayerEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payerPhone">Telefone (opcional)</Label>
              <Input
                id="payerPhone"
                value={payerPhone}
                onChange={(e) => setPayerPhone(formatPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('select-plan')}>
                Voltar
              </Button>
              <Button onClick={handleCreateBoost} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar PIX
              </Button>
            </div>
          </div>
        )}

        {step === 'payment' && paymentData && (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <CreditCard className="h-12 w-12 text-blue-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold mb-2">Pagamento via PIX</h3>
              <p className="text-sm text-gray-600 mb-4">
                Escaneie o QR Code abaixo ou copie o código PIX para fazer o pagamento
              </p>
              
              {paymentData.qr_code_base64 && (
                <div className="mb-4">
                  <img 
                    src={`data:image/png;base64,${paymentData.qr_code_base64}`} 
                    alt="QR Code PIX" 
                    className="mx-auto max-w-[200px]"
                  />
                </div>
              )}
              
              {paymentData.qr_code && (
                <div className="mb-4">
                  <textarea
                    value={paymentData.qr_code}
                    readOnly
                    className="w-full h-16 p-2 text-xs font-mono bg-gray-100 rounded border resize-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentData.qr_code);
                    }}
                  >
                    Copiar Código PIX
                  </Button>
                </div>
              )}
              
              <p className="text-2xl font-bold text-primary mb-2">
                R$ {selectedPromotion && parseFloat(selectedPromotion.price).toFixed(2)}
              </p>
              
              <Alert>
                <AlertDescription>
                  Aguardando confirmação do pagamento... Não feche esta janela.
                </AlertDescription>
              </Alert>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="p-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Pagamento Confirmado!
              </h3>
              <p className="text-gray-600 mb-4">
                Seu anúncio foi impulsionado com sucesso e já está aparecendo em destaque!
              </p>
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription>
                  Seu anúncio ficará em destaque por {selectedPromotion?.durationDays} dias.
                </AlertDescription>
              </Alert>
            </div>
            
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4 text-center">
            <div className="p-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Erro no Pagamento
              </h3>
              <p className="text-gray-600 mb-4">
                {error || 'Ocorreu um erro ao processar o pagamento.'}
              </p>
              <p className="text-sm text-gray-500">
                Tente novamente ou entre em contato conosco se o problema persistir.
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('select-plan')} className="flex-1">
                Tentar Novamente
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}