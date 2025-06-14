// src/domains/comandas/pages/ComandasPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import NewOrderModal from "@/components/modals/NewOrderModal";
import PaymentModal from "@/components/modals/PaymentModal";
import { Plus, Edit, CreditCard, CheckCircle, Users } from "lucide-react";

// 1. Funções de API centralizadas que usam o apiClient padrão
const fetchOrders = async (status: string) => {
  const params = status === 'all' ? {} : { status };
  const { data } = await apiClient.get('/comandas', { params });
  return data;
};

export default function ComandasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState("aberta");
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);

  // 2. useQuery para buscar e gerenciar os dados, loading e erros
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', selectedStatus], // A chave da query inclui o filtro
    queryFn: () => fetchOrders(selectedStatus),
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'aberta': return 'default';
      case 'aguardando_pagamento': return 'secondary';
      case 'paga': return 'outline'; // Changed from 'success' to 'outline'
      case 'cancelada': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta': return 'Aberta';
      case 'aguardando_pagamento': return 'Aguardando';
      case 'paga': return 'Paga';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users /> Comandas</h1>
        <Button onClick={() => setIsNewOrderModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Comanda
        </Button>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aberta">Abertas</TabsTrigger>
          <TabsTrigger value="aguardando_pagamento">Aguardando</TabsTrigger>
          <TabsTrigger value="paga">Pagas</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedStatus} className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Mesa {order.mesa || 'N/A'}</h3>
                        <p className="text-sm text-gray-500">
                          {order.nomeCliente ? `Cliente: ${order.nomeCliente}` : 'Cliente não informado'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Abertura: {order.usuarioAbertura?.nome || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-xl">R$ {parseFloat(order.totalComanda || 0).toFixed(2)}</span>
                        <Badge className="mt-1" variant={getStatusVariant(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/comanda/${order.id}`}>
                        <Button variant="outline" size="sm" className="flex-1"><Edit className="mr-1 h-3 w-3" /> Detalhes</Button>
                      </Link>
                      {order.status === 'aberta' && user?.role !== 'garcom' && (
                        <Button size="sm" className="flex-1" onClick={() => setSelectedOrderForPayment(order)}><CreditCard className="mr-1 h-3 w-3" /> Finalizar</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {orders.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma comanda encontrada.</p>}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 3. Modais continuam sendo chamados aqui, mas sua lógica interna foi refatorada */}
      <NewOrderModal isOpen={isNewOrderModalOpen} onClose={() => setIsNewOrderModalOpen(false)} />
      {selectedOrderForPayment && <PaymentModal isOpen={!!selectedOrderForPayment} onClose={() => setSelectedOrderForPayment(null)} order={selectedOrderForPayment} />}
    </div>
  );
}