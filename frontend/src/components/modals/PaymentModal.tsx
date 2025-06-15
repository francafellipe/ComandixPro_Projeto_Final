import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: number;
    total: number;
  };
  onPaymentConfirm?: (formaPagamento: string) => void;
}

export default function PaymentModal({ isOpen, onClose, order, onPaymentConfirm }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "cartao" | "pix" | "">("");
  const [receivedAmount, setReceivedAmount] = useState("");

  const orderTotal = order?.total || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentMethod) {
      toast({
        title: "Forma de pagamento obrigatória",
        description: "Selecione uma forma de pagamento",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethod === "dinheiro" && receivedAmount && parseFloat(receivedAmount) < orderTotal) {
      toast({
        title: "Valor insuficiente",
        description: "O valor recebido deve ser maior ou igual ao total",
        variant: "destructive"
      });
      return;
    }

    // Se onPaymentConfirm foi passado, usa ela (para comandas)
    if (onPaymentConfirm) {
      onPaymentConfirm(paymentMethod);
    }
  };

  const handleClose = () => {
    setPaymentMethod("");
    setReceivedAmount("");
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateChange = () => {
    if (paymentMethod === "dinheiro" && receivedAmount) {
      const received = parseFloat(receivedAmount);
      const change = received - orderTotal;
      return change > 0 ? change : 0;
    }
    return 0;
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "dinheiro": return <Banknote className="h-4 w-4" />;
      case "cartao": return <CreditCard className="h-4 w-4" />;
      case "pix": return <Smartphone className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Finalizar Pagamento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resumo do Pedido */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(orderTotal)}
                </p>
                <Badge variant="outline" className="mt-2">
                  Comanda #{order.id}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <div className="space-y-3">
            <Label>Forma de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Dinheiro
                  </div>
                </SelectItem>
                <SelectItem value="cartao">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão
                  </div>
                </SelectItem>
                <SelectItem value="pix">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    PIX
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor Recebido (só para dinheiro) */}
          {paymentMethod === "dinheiro" && (
            <div className="space-y-3">
              <Label htmlFor="receivedAmount">Valor Recebido (R$)</Label>
              <Input
                id="receivedAmount"
                type="number"
                step="0.01"
                min={orderTotal}
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder={`Mínimo: ${formatCurrency(orderTotal)}`}
              />
              {receivedAmount && parseFloat(receivedAmount) > orderTotal && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Troco: {formatCurrency(calculateChange())}</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Resumo da Forma de Pagamento */}
          {paymentMethod && (
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(paymentMethod)}
                    <span className="capitalize font-medium">{paymentMethod}</span>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(orderTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!paymentMethod}
            >
              <div className="flex items-center gap-2">
                {getPaymentIcon(paymentMethod)}
                Confirmar Pagamento
              </div>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}