// src/domains/produtos/pages/ProdutosPage.tsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { ProductForm, productSchema } from './ProductForm'; // 1. Importando o novo formulário reutilizável
import AddCategoryModal from '@/components/modals/add-category-modal';
import { z } from 'zod';

// Componentes de UI
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit3, Trash2, Package, Tag, Loader2 } from "lucide-react";

// Tipos
export type Categoria = { id: number; nome: string };
export type Produto = { id: number; nome: string; preco: number; categoriaId: number; Categoria: { nome: string }; descricao?: string | null };
export type ProductFormValues = z.infer<typeof productSchema>;

// Funções de API unificadas
const fetchProdutos = async (): Promise<Produto[]> => {
  try {
    const { data } = await apiClient.get('/produtos');
    console.log('Produtos recebidos:', data);
    
    // Ensure we have a valid array
    if (!Array.isArray(data)) {
      console.error('API retornou dados inválidos para produtos:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    throw error;
  }
};

const fetchCategorias = async (): Promise<Categoria[]> => {
  try {
    const { data } = await apiClient.get('/categorias');
    console.log('Categorias recebidas:', data);
    
    // Ensure we have a valid array
    if (!Array.isArray(data)) {
      console.error('API retornou dados inválidos para categorias:', data);
      return [];
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    throw error;
  }
};

const upsertProduto = async (dados: { id?: number; produtoData: ProductFormValues }) => {
  const { id, produtoData } = dados;
  if (id) {
    const { data } = await apiClient.put(`/produtos/${id}`, produtoData);
    return data;
  } else {
    const { data } = await apiClient.post('/produtos', produtoData);
    return data;
  }
};

const removerProduto = async (id: number): Promise<void> => {
  await apiClient.delete(`/produtos/${id}`);
};

export default function ProdutosPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('all');

  // Queries
  const { data: produtos = [], isLoading: isLoadingProdutos, error: produtosError } = useQuery<Produto[]>({
    queryKey: ['produtos'],
    queryFn: fetchProdutos,
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  const { data: categorias = [], error: categoriasError } = useQuery<Categoria[]>({
    queryKey: ['categorias'],
    queryFn: fetchCategorias,
    retry: 3,
    staleTime: 30000, // 30 seconds
  });

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: upsertProduto,
    onSuccess: (_, variables) => {
      toast({ title: "Sucesso!", description: `Produto ${variables.id ? 'atualizado' : 'criado'}.` });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      setIsFormOpen(false);
      setProdutoEditando(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.response?.data?.message || "Falha na operação.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: removerProduto,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Produto removido." });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.response?.data?.message || "Falha ao remover produto.", variant: "destructive" });
    }
  });

  // Lógica de UI
  const produtosFiltrados = useMemo(() => {
    if (!produtos || !Array.isArray(produtos)) return [];
    
    return produtos.filter(p => {
      // More flexible validation - check if product exists and has required fields
      if (!p || !p.nome) return false;
      
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      
      // Handle categoria filtering more flexibly
      if (categoriaFiltro === 'all') {
        return matchBusca;
      }
      
      // Check if product has category data
      const produtoCategoria = p.Categoria?.nome || 'Sem categoria';
      const matchCategoria = produtoCategoria === categoriaFiltro;
      
      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

  const abrirFormulario = (produto?: Produto) => {
    setProdutoEditando(produto || null);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = (values: ProductFormValues) => {
    upsertMutation.mutate({ id: produtoEditando?.id, produtoData: values });
  };

  return (
    <div className="px-4 py-4 pb-24">
      {/* Header e Stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Catálogo de Produtos</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-xs font-medium">PRODUTOS</p><p className="text-2xl font-bold">{produtos.length}</p></div><Package className="h-6 w-6 text-muted-foreground" /></CardContent></Card>
        <Card><CardContent className="p-4 flex justify-between items-center"><div><p className="text-xs font-medium">CATEGORIAS</p><p className="text-2xl font-bold">{categorias.length}</p></div><Tag className="h-6 w-6 text-muted-foreground" /></CardContent></Card>
      </div>

      {/* Filtros e Ação Principal */}
      <div className="space-y-3 mb-6">
        <Input placeholder="Buscar produtos..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button variant={categoriaFiltro === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setCategoriaFiltro('all')}>Todas</Button>
            {categorias.map(cat => (<Button key={cat.id} variant={categoriaFiltro === cat.nome ? 'default' : 'outline'} size="sm" onClick={() => setCategoriaFiltro(cat.nome)}>{cat.nome}</Button>))}
            <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)} className="text-blue-600 border-blue-600 hover:bg-blue-50">
              + Nova Categoria
            </Button>
        </div>
      </div>
      
      {/* 3. O Dialog agora abre o formulário centralizado */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button onClick={() => abrirFormulario()} className="w-full"><Plus className="h-4 w-4 mr-2" />Adicionar Produto</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{produtoEditando ? 'Editar Produto' : 'Novo Produto'}</DialogTitle></DialogHeader>
          <ProductForm 
            onSubmit={handleFormSubmit} 
            isSubmitting={upsertMutation.isPending} 
            defaultValues={produtoEditando} 
            categorias={categorias}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Categoria */}
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Lista de Produtos */}
      <div className="mt-6 space-y-3">
        {isLoadingProdutos && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando produtos...</span>
          </div>
        )}
        
        {(produtosError || categoriasError) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm">{produtosError?.message || categoriasError?.message}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['produtos'] });
                queryClient.invalidateQueries({ queryKey: ['categorias'] });
              }}
            >
              Tentar Novamente
            </Button>
          </div>
        )}
        
        {!isLoadingProdutos && !produtosError && produtosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto encontrado</p>
          </div>
        )}
        
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{produto.nome || 'Nome não disponível'}</h3>
                  <Badge variant="outline" className="mt-1">
                    {produto.Categoria?.nome || 'Sem categoria'}
                  </Badge>
                  {produto.descricao && (
                    <p className="text-sm text-gray-600 mt-2">{produto.descricao}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-xl text-green-600">
                    R$ {Number(produto.preco || 0).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <Button variant="ghost" size="sm" onClick={() => abrirFormulario(produto)}>
                  <Edit3 className="h-4 w-4 mr-1" />Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" disabled={deleteMutation.isPending}>
                      <Trash2 className="h-4 w-4 mr-1" />Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja excluir o produto "{produto.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteMutation.mutate(produto.id)}>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}