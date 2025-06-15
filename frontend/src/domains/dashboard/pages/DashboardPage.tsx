import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api-client';
import { useEffect } from 'react';

interface DashboardData {
  comandasAbertas: number;
  vendasHoje: number;
  statusMesas: Array<{
    mesa: string;
    status: string;
    total: number;
  }>;
  pedidosRecentes: Array<{
    id: number;
    mesa: string;
    cliente: string;
    total: number;
    status: string;
    dataAbertura: string;
  }>;
}

const fetchDashboard = async (): Promise<DashboardData> => {
  const { data } = await apiClient.get('/dashboard');
  return data.data;
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { 
    data: dashboardData, 
    isLoading, 
    isError, 
    error 
  } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h3>
        <p className="text-gray-600 mb-4">Não foi possível carregar os dados. Tente novamente.</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600">
          Bem-vindo, {user?.nome || 'Usuário'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Comandas Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData?.comandasAbertas || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Vendas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData?.vendasHoje || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Status das Mesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.statusMesas && dashboardData.statusMesas.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.statusMesas.map((mesa: { mesa: string; status: string; total: number }, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{mesa.mesa}</span>
                      <Badge className={getStatusColor(mesa.status)}>
                        {mesa.status}
                      </Badge>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(mesa.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhuma mesa ativa no momento</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pedidos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.pedidosRecentes && dashboardData.pedidosRecentes.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.pedidosRecentes.map((pedido: { id: number; mesa: string; cliente: string; total: number; status: string; dataAbertura: string }) => (
                  <div key={pedido.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-medium">{pedido.mesa} - {pedido.cliente}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(pedido.dataAbertura).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(pedido.total)}</div>
                      <Badge className={getStatusColor(pedido.status)}>
                        {pedido.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum pedido recente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}