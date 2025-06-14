// src/domains/comandas/pages/comanda-page.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from 'wouter';
import apiClient from '@/lib/api-client';
import { useToast } from "@/hooks/use-toast";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Skeleton, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui';
import { ArrowLeft, Plus, Trash2, DollarSign, Clock, Users, Loader2 } from 'lucide-react';

// Funções de API
const fetchOrderById = async (id: string) => {
  const { data } = await apiClient.get(`/orders/${id}`);
  return data;
};
const fetchProducts = async () => {
  const { data } = await apiClient.get('/produtos');
  return data;
};
const addItemToOrder = async ({ orderId, itemData }: { orderId: string, itemData: any }) => {
  const { data } = await apiClient.post(`/orders/${orderId}/items`, itemData);
  return data;
};
const removeItemFromOrder = async ({ orderId, itemId }: { orderId: string, itemId: number }) => {
  await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
};

export default function ComandaPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, params] = useRoute('/comanda/:id');
  const comandaId = params?.id || '';

  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // 1. useQuery para buscar os detalhes da comanda
  const { data: comanda, isLoading, isError } = useQuery({
    queryKey: ['order', comandaId],
    queryFn: () => fetchOrderById(comandaId),
    enabled: !!comandaId,
  });

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });

  // 2. useMutation para adicionar itens
  const addItemMutation = useMutation({
    mutationFn: addItemToOrder,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Item adicionado à comanda." });
      queryClient.invalidateQueries({ queryKey: ['order', comandaId] });
      setIsAddItemDialogOpen(false);
      setSelectedProductId('');
      setQuantity(1);
    },
    onError: (error: any) => { /* ... tratamento de erro ... */ }
  });

  // 3. useMutation para remover itens
  const removeItemMutation = useMutation({
    mutationFn: removeItemFromOrder,
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Item removido da comanda." });
      queryClient.invalidateQueries({ queryKey: ['order', comandaId] });
    },
    onError: (error: any) => { /* ... tratamento de erro ... */ }
  });

  if (isLoading) return <p>Carregando...</p>;
  if (isError || !comanda) return <p>Erro ao carregar a comanda.</p>;

  return (
    <div className="p-4 pb-24">
      {/* ... JSX da página de detalhes ... */}
      {/* O JSX usará os dados de `comanda` e chamará as mutações `addItemMutation.mutate(...)` e `removeItemMutation.mutate(...)` */}
    </div>
  );
}