
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewOrderModal from "@/components/modals/NewOrderModal";
import PaymentModal from "@/components/modals/PaymentModal";
import { Plus, Edit, CreditCard, Users, MapPin, Clock } from "lucide-react";

const fetchOrders = async (status: string) => {
  const params = status === 'all' ? {} : { status };
  const { data } = await apiClient.get('/comandas', { params });
  return data;
};

export default function ComandasPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState("aberta");
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', selectedStatus],
    queryFn: () => fetchOrders(selectedStatus),
  });

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta': return 'default';
      case 'aguardando_pagamento': return 'secondary';
      case 'paga': return 'outline';
      case 'cancelada': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta': return 'Aberta';
      case 'aguardando_pagamento': return 'Aguardando';
      case 'paga': return 'Paga';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile-First */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5" /> 
              Comandas
            </h1>
            <Button 
              onClick={() => setIsNewOrderModalOpen(true)}
              className="h-12 px-4 text-sm font-medium"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova
            </Button>
          </div>

          {/* Tabs Mobile-Optimized */}
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList className="grid w-full grid-cols-4 h-11">
              <TabsTrigger value="aberta" className="text-xs">Abertas</TabsTrigger>
              <TabsTrigger value="aguardando_pagamento" className="text-xs">Aguard.</TabsTrigger>
              <TabsTrigger value="paga" className="text-xs">Pagas</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
          <TabsContent value={selectedStatus} className="mt-0">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => (
                  <Card key={order.id} className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
                    <CardContent className="p-4">
                      {/* Header da Comanda */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <h3 className="font-semibold text-lg">
                              Mesa {order.mesa || 'S/N'}
                            </h3>
                            <Badge 
                              variant={getStatusVariant(order.status)}
                              className="text-xs px-2 py-1"
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          
                          {order.nomeCliente && (
                            <p className="text-sm text-gray-600 mb-1">
                              👤 {order.nomeCliente}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.dataAbertura)}
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-1">
                            Por: {order.usuarioAbertura?.nome || 'N/A'}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(order.totalComanda)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Comanda #{order.id}
                          </div>
                        </div>
                      </div>

                      {/* Botões Touch-Friendly */}
                      <div className="flex gap-3">
                        <Link href={`/comandas/${order.id}`} className="flex-1">
                          <Button 
                            variant="outline" 
                            className="w-full h-12 text-sm font-medium"
                          >
                            <Edit className="mr-2 h-4 w-4" /> 
                            Adicionar Produto
                          </Button>
                        </Link>
                        
                        {(order.status === 'aberta' || order.status === 'ABERTA') && user?.role !== 'garcom' && (
                          <Button 
                            className="h-12 px-6 text-sm font-medium bg-green-600 hover:bg-green-700"
                            onClick={() => setSelectedOrderForPayment(order)}
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> 
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">Nenhuma comanda encontrada</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Que tal criar uma nova comanda?
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      <NewOrderModal 
        isOpen={isNewOrderModalOpen} 
        onClose={() => setIsNewOrderModalOpen(false)} 
      />
      
      {selectedOrderForPayment && (
        <PaymentModal 
          isOpen={!!selectedOrderForPayment} 
          onClose={() => setSelectedOrderForPayment(null)} 
          order={selectedOrderForPayment} 
        />
      )}
    </div>
  );
}
