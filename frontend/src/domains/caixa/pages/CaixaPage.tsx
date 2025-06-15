import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';
import { AbrirCaixaModal } from '@/components/modals/AbrirCaixaModal';
import { MovimentacaoCaixaModal } from '@/components/modals/MovimentacaoCaixaModal';

interface CaixaStatus {
  status: 'aberto' | 'fechado';
  caixa?: {
    id: number;
    dataAbertura: string;
    saldoInicial: number;
    totalVendasDinheiro: number;
    totalVendasCartao: number;
    totalVendasPix: number;
    totalSuprimentos: number;
    totalSangrias: number;
    status: string;
    observacoesAbertura?: string;
  };
  movimentacoes?: Array<{
    id: number;
    tipo: string;
    valor: number;
    observacao?: string;
    createdAt: string;
  }>;
}

const fetchCaixaStatus = async (): Promise<CaixaStatus> => {
  const { data } = await apiClient.get('/caixa/status');
  return data;
};

const fecharCaixa = async (dados: { saldoFinalInformado: number; observacoesFechamento?: string }) => {
  const { data } = await apiClient.post('/caixa/fechar', dados);
  return data;
};

export default function CaixaPage() {
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showMovimentacaoModal, setShowMovimentacaoModal] = useState(false);
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'suprimento' | 'sangria'>('suprimento');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: caixaStatus, 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['caixa-status'],
    queryFn: fetchCaixaStatus,
    refetchInterval: 30000,
  });

  const fecharCaixaMutation = useMutation({
    mutationFn: fecharCaixa,
    onSuccess: () => {
      toast({
        title: "✅ Sucesso",
        description: "Caixa fechado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['caixa-status'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Erro",
        description: error.response?.data?.message || "Erro ao fechar caixa",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularSaldoAtual = () => {
    if (!caixaStatus?.caixa) return 0;

    const { caixa } = caixaStatus;
    return Number(caixa.saldoInicial) +
           Number(caixa.totalVendasDinheiro) +
           Number(caixa.totalSuprimentos) -
           Number(caixa.totalSangrias);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando dados do caixa...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Erro ao carregar dados do caixa
        </h3>
        <p className="text-gray-600 mb-4">Tente novamente.</p>
        <Button onClick={() => refetch()}>Tentar Novamente</Button>
      </div>
    );
  }

  if (caixaStatus?.status !== 'aberto') {
    return (
      <div className="space-y-6 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Caixa Fechado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Nenhum caixa está aberto no momento. Abra um caixa para começar as operações.
            </p>
            <Button onClick={() => setShowAbrirModal(true)}>
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>

        {showAbrirModal && (
          <AbrirCaixaModal
            isOpen={showAbrirModal}
            onClose={() => setShowAbrirModal(false)}
            onSuccess={() => {
              setShowAbrirModal(false);
              refetch();
            }}
          />
        )}
      </div>
    );
  }

  const { caixa } = caixaStatus;
  const saldoAtual = calcularSaldoAtual();

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calculator className="h-6 w-6 mr-2" />
          Caixa
        </h1>
        <Badge variant="outline" className="bg-green-100 text-green-800">
          <Clock className="h-3 w-3 mr-1" />
          Aberto
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Caixa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Saldo Inicial</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(caixa!.saldoInicial)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Vendas Dinheiro</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(caixa!.totalVendasDinheiro)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Vendas Cartão</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(caixa!.totalVendasCartao)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Vendas PIX</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(caixa!.totalVendasPix)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Suprimentos</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(caixa!.totalSuprimentos)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Sangrias</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(caixa!.totalSangrias)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Saldo Atual</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(saldoAtual)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={() => {
            setTipoMovimentacao('suprimento');
            setShowMovimentacaoModal(true);
          }}
          className="flex items-center justify-center"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Suprimento
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setTipoMovimentacao('sangria');
            setShowMovimentacaoModal(true);
          }}
          className="flex items-center justify-center"
        >
          <TrendingDown className="h-4 w-4 mr-2" />
          Sangria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {caixaStatus.movimentacoes && caixaStatus.movimentacoes.length > 0 ? (
            <div className="space-y-3">
              {caixaStatus.movimentacoes.map((movimentacao) => (
                <div key={movimentacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium capitalize">{movimentacao.tipo}</p>
                    {movimentacao.observacao && (
                      <p className="text-sm text-gray-600">{movimentacao.observacao}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(movimentacao.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span className={`font-semibold ${
                    movimentacao.tipo === 'suprimento' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movimentacao.tipo === 'suprimento' ? '+' : '-'}
                    {formatCurrency(movimentacao.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Nenhuma movimentação registrada
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            const saldoInformado = prompt('Informe o saldo físico contado:');
            if (saldoInformado) {
              fecharCaixaMutation.mutate({
                saldoFinalInformado: parseFloat(saldoInformado),
                observacoesFechamento: 'Fechamento via sistema'
              });
            }
          }}
          variant="outline"
          disabled={fecharCaixaMutation.isPending}
        >
          {fecharCaixaMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Fechar Caixa
        </Button>
      </div>

      {showMovimentacaoModal && (
        <MovimentacaoCaixaModal
          isOpen={showMovimentacaoModal}
          onClose={() => setShowMovimentacaoModal(false)}
          tipo={tipoMovimentacao}
          onSuccess={() => {
            setShowMovimentacaoModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}