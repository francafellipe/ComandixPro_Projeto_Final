import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, BarChart3, TrendingUp, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api-client';

interface RelatorioData {
  periodo: string;
  totalVendas: number;
  totalComandas: number;
  ticketMedio: number;
  vendasPorCategoria: Array<{
    categoria: string;
    total: number;
  }>;
  top10Produtos: Array<{
    produto: string;
    quantidade: number;
    receita: number;
  }>;
}

const fetchRelatorio = async (periodo: string): Promise<RelatorioData> => {
  const { data } = await apiClient.get(`/relatorios?periodo=${periodo}`);
  return data.data;
};

export default function RelatoriosPage() {
  const [periodoAtivo, setPeriodoAtivo] = useState('hoje');
  const { toast } = useToast();

  const { 
    data: relatorio, 
    isLoading, 
    isError,
    error,
    refetch 
  } = useQuery({
    queryKey: ['relatorio', periodoAtivo],
    queryFn: () => fetchRelatorio(periodoAtivo),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-6 w-6 mr-2" />
          Relatórios
        </h1>
      </div>

      <div className="flex space-x-2">
        {[
          { key: 'hoje', label: 'Hoje' },
          { key: 'semana', label: 'Semana' },
          { key: 'mes', label: 'Mês' },
          { key: 'todos', label: 'Todos' }
        ].map(periodo => (
          <Button
            key={periodo.key}
            variant={periodoAtivo === periodo.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriodoAtivo(periodo.key)}
          >
            {periodo.label}
          </Button>
        ))}
      </div>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Carregando relatório...</span>
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Erro ao carregar resumo financeiro
            </h3>
            <p className="text-gray-600 mb-4">Tente novamente.</p>
            <Button onClick={() => refetch()}>Tentar Novamente</Button>
          </CardContent>
        </Card>
      )}

      {relatorio && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(relatorio.totalVendas)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Comandas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {relatorio.totalComandas}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(relatorio.ticketMedio)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Vendas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorio.vendasPorCategoria && relatorio.vendasPorCategoria.length > 0 ? (
                  <div className="space-y-3">
                    {relatorio.vendasPorCategoria.map((categoria, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{categoria.categoria}</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(categoria.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Nenhuma venda no período
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Top 10 Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {relatorio.top10Produtos && relatorio.top10Produtos.length > 0 ? (
                  <div className="space-y-3">
                    {relatorio.top10Produtos.map((produto, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{produto.produto}</p>
                          <p className="text-sm text-gray-600">
                            {produto.quantidade} vendidos
                          </p>
                        </div>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(produto.receita)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum produto vendido no período
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}