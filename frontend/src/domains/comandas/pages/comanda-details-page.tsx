
import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft, Plus, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import PaymentModal from '@/components/modals/PaymentModal';

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

const fetchComandaDetalhes = async (comandaId: string): Promise<ComandaDetalhes> => {
  const { data } = await apiClient.get(`/comandas/${comandaId}`);
  return data.data;
};

const adicionarProduto = async ({ comandaId, produtoId, quantidade }: {
  comandaId: number;
  produtoId: number;
  quantidade: number;
}) => {
  const { data } = await apiClient.post(`/comandas/${comandaId}/itens`, {
    produtoId,
    quantidade
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

  const { data: comanda, isLoading, isError } = useQuery({
    queryKey: ['comanda', comandaId],
    queryFn: () => fetchComandaDetalhes(comandaId!),
    enabled: !!comandaId,
  });

  const adicionarProdutoMutation = useMutation({
    mutationFn: adicionarProduto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comanda', comandaId] });
      toast({
        title: "✅ Sucesso",
        description: "Produto adicionado à comanda!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro",
        description: error.response?.data?.message || "Erro ao adicionar produto",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando detalhes da comanda...</span>
      </div>
    );
  }

  if (isError || !comanda) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Erro ao carregar detalhes da comanda</p>
        <Button onClick={() => navigate('/comandas')} className="mt-4">
          Voltar
        </Button>
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

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/comandas')}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Badge className={getStatusColor(comanda.status)}>
          {comanda.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Comanda #{comanda.id}</span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(comanda.totalComanda)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Mesa</p>
              <p className="font-semibold">{comanda.mesa || 'Não informada'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cliente</p>
              <p className="font-semibold">{comanda.nomeCliente || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Aberta por</p>
              <p className="font-semibold">{comanda.usuarioAbertura.nome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Data de Abertura</p>
              <p className="font-semibold">
                {new Date(comanda.dataAbertura).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Itens da Comanda</span>
            {comanda.status === 'Aberta' && (
              <Button size="sm" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comanda.itensComanda && comanda.itensComanda.length > 0 ? (
            <div className="space-y-3">
              {comanda.itensComanda.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      {item.quantidade}x
                    </span>
                    <div>
                      <p className="font-medium">{item.produto.nome}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.precoUnitarioCobrado)} cada
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(comanda.totalComanda)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhum item adicionado à comanda
            </p>
          )}
        </CardContent>
      </Card>

      {comanda.status === 'Aberta' && (
        <div className="flex justify-end">
          <Button 
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Fechar Comanda
          </Button>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={{
            id: comanda.id,
            total: comanda.totalComanda
          }}
        />
      )}
    </div>
  );
}
