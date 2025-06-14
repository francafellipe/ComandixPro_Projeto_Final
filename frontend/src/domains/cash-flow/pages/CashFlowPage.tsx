
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Trash2,
  Edit3,
  Loader2
} from "lucide-react";

// Tipos
interface MovimentacaoFluxo {
  id: number;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  criadoEm: string;
}

interface ResumoFluxo {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  movimentacoes: MovimentacaoFluxo[];
}

// Funções de API
const fetchCashFlow = async (date: string): Promise<ResumoFluxo> => {
  const { data } = await apiClient.get('/fluxo-caixa/resumo', { params: { date } });
  return data;
};

const criarMovimentacao = async (movimentacao: Omit<MovimentacaoFluxo, 'id' | 'criadoEm'>) => {
  const { data } = await apiClient.post('/fluxo-caixa/movimentacoes', movimentacao);
  return data;
};

const atualizarMovimentacao = async ({ id, ...movimentacao }: Partial<MovimentacaoFluxo> & { id: number }) => {
  const { data } = await apiClient.put(`/fluxo-caixa/movimentacoes/${id}`, movimentacao);
  return data;
};

const excluirMovimentacao = async (id: number) => {
  await apiClient.delete(`/fluxo-caixa/movimentacoes/${id}`);
};

export default function CashFlowPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isMovimentacaoModalOpen, setIsMovimentacaoModalOpen] = useState(false);
  const [movimentacaoEditando, setMovimentacaoEditando] = useState<MovimentacaoFluxo | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'entrada' | 'saida'>('todas');

  // Form state
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    categoria: '',
    descricao: '',
    valor: '',
    data: selectedDate
  });

  // Query para buscar dados do fluxo de caixa
  const { data: fluxoData, isLoading, isError } = useQuery({
    queryKey: ["cashFlow", selectedDate],
    queryFn: () => fetchCashFlow(selectedDate),
  });

  // Mutações
  const criarMutation = useMutation({
    mutationFn: criarMovimentacao,
    onSuccess: () => {
      toast({ title: "✅ Sucesso", description: "Movimentação criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["cashFlow", selectedDate] });
      resetForm();
      setIsMovimentacaoModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao criar movimentação", 
        variant: "destructive" 
      });
    }
  });

  const atualizarMutation = useMutation({
    mutationFn: atualizarMovimentacao,
    onSuccess: () => {
      toast({ title: "✅ Sucesso", description: "Movimentação atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["cashFlow", selectedDate] });
      resetForm();
      setIsMovimentacaoModalOpen(false);
      setMovimentacaoEditando(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao atualizar movimentação", 
        variant: "destructive" 
      });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: excluirMovimentacao,
    onSuccess: () => {
      toast({ title: "✅ Sucesso", description: "Movimentação excluída com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["cashFlow", selectedDate] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao excluir movimentação", 
        variant: "destructive" 
      });
    }
  });

  // Handlers
  const resetForm = () => {
    setFormData({
      tipo: 'entrada',
      categoria: '',
      descricao: '',
      valor: '',
      data: selectedDate
    });
  };

  const abrirModal = (movimentacao?: MovimentacaoFluxo) => {
    if (movimentacao) {
      setMovimentacaoEditando(movimentacao);
      setFormData({
        tipo: movimentacao.tipo,
        categoria: movimentacao.categoria,
        descricao: movimentacao.descricao,
        valor: movimentacao.valor.toString(),
        data: movimentacao.data
      });
    } else {
      setMovimentacaoEditando(null);
      resetForm();
    }
    setIsMovimentacaoModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoria || !formData.descricao || !formData.valor) {
      toast({ 
        title: "⚠️ Campos obrigatórios", 
        description: "Preencha todos os campos obrigatórios", 
        variant: "destructive" 
      });
      return;
    }

    const movimentacaoData = {
      tipo: formData.tipo,
      categoria: formData.categoria,
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      data: formData.data
    };

    if (movimentacaoEditando) {
      atualizarMutation.mutate({ id: movimentacaoEditando.id, ...movimentacaoData });
    } else {
      criarMutation.mutate(movimentacaoData);
    }
  };

  // Filtrar movimentações
  const movimentacoesFiltradas = fluxoData?.movimentacoes?.filter(mov => {
    if (filtroTipo === 'todas') return true;
    return mov.tipo === filtroTipo;
  }) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <Card className="text-center p-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
          <p className="text-gray-600">Não foi possível carregar o fluxo de caixa.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 md:h-8 md:w-8" />
          Fluxo de Caixa
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-picker" className="text-sm font-medium">Data:</Label>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button onClick={() => abrirModal()} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-xl md:text-2xl font-bold text-green-600">
                  {formatCurrency(fluxoData?.totalEntradas || 0)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saídas</p>
                <p className="text-xl md:text-2xl font-bold text-red-600">
                  {formatCurrency(fluxoData?.totalSaidas || 0)}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Líquido</p>
                <p className={`text-xl md:text-2xl font-bold ${
                  (fluxoData?.saldoLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(fluxoData?.saldoLiquido || 0)}
                </p>
              </div>
              <DollarSign className={`h-6 w-6 ${
                (fluxoData?.saldoLiquido || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Lista */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Movimentações</span>
            <Tabs value={filtroTipo} onValueChange={(value: any) => setFiltroTipo(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="todas">Todas</TabsTrigger>
                <TabsTrigger value="entrada">Entradas</TabsTrigger>
                <TabsTrigger value="saida">Saídas</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma movimentação encontrada para esta data.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movimentacoesFiltradas.map((movimentacao) => (
                <div
                  key={movimentacao.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <Badge 
                        className={movimentacao.tipo === 'entrada' ? 
                          'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }
                      >
                        {movimentacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </Badge>
                      <span className="text-sm text-gray-600">{movimentacao.categoria}</span>
                    </div>
                    <p className="font-medium">{movimentacao.descricao}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${
                      movimentacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movimentacao.tipo === 'entrada' ? '+' : '-'}{formatCurrency(movimentacao.valor)}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirModal(movimentacao)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => excluirMutation.mutate(movimentacao.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Movimentação */}
      <Dialog open={isMovimentacaoModalOpen} onOpenChange={setIsMovimentacaoModalOpen}>
        <DialogContent className="w-[95vw] max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {movimentacaoEditando ? 'Editar Movimentação' : 'Nova Movimentação'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <select
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'entrada' | 'saida' })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Venda, Compra, Aluguel..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descreva a movimentação..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsMovimentacaoModalOpen(false);
                  setMovimentacaoEditando(null);
                  resetForm();
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={criarMutation.isPending || atualizarMutation.isPending}
                className="w-full sm:w-auto"
              >
                {(criarMutation.isPending || atualizarMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {movimentacaoEditando ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
