// src/components/modals/paymentModal.tsx
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

// 1. Função de serviço que usa o apiClient
const processPayment = async ({ orderId, paymentData }: { orderId: number; paymentData: any }) => {
  const { data } = await apiClient.put(`/orders/${orderId}/payment`, paymentData);
  return data;
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function PaymentModal({ isOpen, onClose, order }: PaymentModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [paymentMethod, setPaymentMethod] = useState<"dinheiro" | "cartao" | "pix" | "">("");
  const [receivedAmount, setReceivedAmount] = useState("");

  const orderTotal = parseFloat(order?.total || "0");

  // 2. useMutation com a nova função de serviço
  const processPaymentMutation = useMutation({
    mutationFn: processPayment,
    onSuccess: () => {
      // 3. Invalida todas as queries relevantes para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
      queryClient.invalidateQueries({ queryKey: ['cash-flow'] });
      queryClient.invalidateQueries({ queryKey: ['availableTables'] });

      toast({ title: "Pagamento processado", description: "Comanda finalizada com sucesso." });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao processar pagamento", description: error.response?.data?.message, variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethod) { /* ... */ return; }

    const paymentData = {
      formaPagamento: paymentMethod,
      valorRecebido: receivedAmount ? parseFloat(receivedAmount) : undefined
    };

    processPaymentMutation.mutate({ orderId: order.id, paymentData });
  };
  
  const handleClose = () => {
    //... (lógica de reset mantida)
    onClose();
  };
  
  // ... (outras lógicas de manipulação de troco e UI são mantidas)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
        {/* ... O JSX do Modal é mantido, pois a lógica de UI não muda ... */}
    </Dialog>
  );
}