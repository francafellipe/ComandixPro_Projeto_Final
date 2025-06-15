import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Plus, DollarSign, MapPin, User, Clock, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import PaymentModal from '@/components/modals/PaymentModal';
import AddItemToOrderModal from '@/components/modals/AddItemToOrderModal';
import { Trash2, Edit, MinusCircle, PlusCircle } from 'lucide-react'; // Adicione os ícones
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"; // Importe o AlertDialog


interface ComandaDetalhes {
  id: number;
  mesa: string;
  nomeCliente: string;
  status: string;
  totalComanda: number;
  dataAbertura: string;
  itensComanda: Array<{
    id: number;
    quantidade: number;
    precoUnitarioCobrado: number;
    subtotal: number;
    produto: {
      id: number;
      nome: string;
    };
  }>;
  usuarioAbertura: {
    nome: string;
  };
}

const removerItem = async ({ comandaId, itemComandaId }: { comandaId: string; itemComandaId: number }) => {
  await apiClient.delete(`/comandas/${comandaId}/itens/${itemComandaId}`);
};

const atualizarQuantidade = async ({ comandaId, itemComandaId, quantidade }: { comandaId: string; itemComandaId: number; quantidade: number }) => {
  const { data } = await apiClient.put(`/comandas/${comandaId}/itens/${itemComandaId}`, { quantidade });
  return data;
};

const fetchComandaDetalhes = async (comandaId: string): Promise<ComandaDetalhes> => {
  const { data } = await apiClient.get(`/comandas/${comandaId}`);
  return data;
};

const adicionarItem = async (dados: { comandaId: string; produtoId: number; quantidade: number }) => {
  const { comandaId, produtoId, quantidade } = dados;
  const { data } = await apiClient.post(`/comandas/${comandaId}/itens`, { produtoId, quantidade });
  return data;
};

const processarPagamento = async ({ comandaId, formaPagamento }: {
  comandaId: number;
  formaPagamento: string;
}) => {
  const { data } = await apiClient.put(`/comandas/${comandaId}/pagar`, {
    formaPagamento
  });
  return data;
};

export default function ComandaDetailsPage() {
  const { comandaId } = useParams();
  const [, setLocation] = useLocation();
  const navigate = (path: string) => setLocation(path);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  const { data: comanda, isLoading, isError } = useQuery({
    queryKey: ['comanda', comandaId],
    queryFn: () => fetchComandaDetalhes(comandaId!),
    enabled: !!comandaId,
  });

  const processarPagamentoMutation = useMutation({
    mutationFn: processarPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: "✅ Pagamento Processado",
        description: "Comanda foi finalizada com sucesso!",
      });
      setShowPaymentModal(false);
      navigate('/comandas');
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro no Pagamento",
        description: error.response?.data?.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    }
  });

  const adicionarItemMutation = useMutation({
    mutationFn: adicionarItem,
    onSuccess: () => {
      toast({
        title: "✅ Item Adicionado",
        description: "O produto foi adicionado à comanda com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
      setIsAddProductModalOpen(false); // Fecha o modal
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro ao Adicionar Item",
        description: error.response?.data?.message || "Não foi possível adicionar o produto.",
        variant: "destructive",
      });
    },
  });

  const removerItemMutation = useMutation({
    mutationFn: removerItem,
    onSuccess: () => {
      toast({ title: "✅ Item Removido" });
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
    },
    onError: (error: any) => toast({ title: "❌ Erro", description: error.response?.data?.message, variant: "destructive" }),
  });

  const atualizarQuantidadeMutation = useMutation({
    mutationFn: atualizarQuantidade,
    onSuccess: () => {
      // Opcional: pode-se remover o toast para uma experiência mais fluida
      // toast({ title: "✅ Quantidade Atualizada" });
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
    },
    onError: (error: any) => toast({ title: "❌ Erro", description: error.response?.data?.message, variant: "destructive" }),
  });


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <span className="text-gray-600">Carregando detalhes...</span>
        </div>
      </div>
    );
  }

  if (isError || !comanda) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-500 mb-4">Erro ao carregar detalhes da comanda</p>
            <Button onClick={() => navigate('/comandas')} className="w-full h-12">
              Voltar para Comandas
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aberta': return 'bg-green-100 text-green-800';
      case 'fechada': return 'bg-yellow-100 text-yellow-800';
      case 'paga': return 'bg-blue-100 text-blue-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isComandaAberta = comanda.status.toLowerCase() === 'aberta';

  const handleFinalizarComanda = (formaPagamento: string) => {
    processarPagamentoMutation.mutate({
      comandaId: comanda.id,
      formaPagamento
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cabeçalho */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/comandas')} className="h-10 px-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-semibold text-lg">Comanda #{comanda.id}</h1>
            <Badge className={`${getStatusColor(comanda.status)} text-xs`}>{comanda.status}</Badge>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-4">
        {/* Informações da Comanda */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="text-3xl font-bold text-green-600 text-center mb-1">{formatCurrency(comanda.totalComanda)}</div>
            <p className="text-gray-500 text-sm text-center mb-4">Total da Comanda</p>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Mesa</p>
                  <p className="font-semibold">{comanda.mesa || 'Não informada'}</p>
                </div>
              </div>
              {comanda.nomeCliente && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-semibold">{comanda.nomeCliente}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Aberta em</p>
                  <p className="font-semibold">{new Date(comanda.dataAbertura).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-gray-500">por {comanda.usuarioAbertura.nome}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens da Comanda */}
        <Card className="border-0 shadow-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Itens ({comanda.itensComanda?.length || 0})
              </span>
              {isComandaAberta && (
                <Button size="sm" className="h-9 px-3 text-xs" onClick={() => setIsAddProductModalOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {comanda.itensComanda.length > 0 ? (
              comanda.itensComanda.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-sm">{item.produto.nome}</p>
                    <p className="text-xs text-gray-600">{formatCurrency(item.precoUnitarioCobrado)} cada</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => atualizarQuantidadeMutation.mutate({ comandaId: comandaId!, itemComandaId: item.id, quantidade: item.quantidade - 1 })} disabled={atualizarQuantidadeMutation.isPending || item.quantidade <= 1}>
                      <MinusCircle className="h-5 w-5" />
                    </Button>
                    <span className="font-bold text-lg w-8 text-center">{item.quantidade}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => atualizarQuantidadeMutation.mutate({ comandaId: comandaId!, itemComandaId: item.id, quantidade: item.quantidade + 1 })} disabled={atualizarQuantidadeMutation.isPending}>
                      <PlusCircle className="h-5 w-5" />
                    </Button>
                  </div>
                  <span className="font-semibold text-sm w-20 text-right">{formatCurrency(item.subtotal)}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" disabled={removerItemMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover {item.quantidade}x "{item.produto.nome}" da comanda?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removerItemMutation.mutate({ comandaId: comandaId!, itemComandaId: item.id })} className="bg-red-600 hover:bg-red-700">
                          Confirmar Exclusão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum item na comanda</p>
                {isComandaAberta && <p className="text-gray-400 text-sm mt-1">Adicione produtos para começar</p>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Botão de Finalizar */}
      {isComandaAberta && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button onClick={() => setShowPaymentModal(true)} className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700" disabled={!comanda.itensComanda || comanda.itensComanda.length === 0}>
            <DollarSign className="h-5 w-5 mr-2" /> Finalizar Comanda
          </Button>
        </div>
      )}

      {/* Modais */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={{ id: comanda.id, total: comanda.totalComanda }}
          onPaymentConfirm={handleFinalizarComanda}
        />
      )}

      {isAddProductModalOpen && comandaId && (
        <AddItemToOrderModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          comandaId={comandaId}
          onAddItem={(produtoId, quantidade) => adicionarItemMutation.mutate({ comandaId, produtoId, quantidade })}
          isAddingItem={adicionarItemMutation.isPending}
        />
      )}
    </div>
  );
}