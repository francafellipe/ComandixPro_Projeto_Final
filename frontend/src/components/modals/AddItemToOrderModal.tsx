// ARQUIVO: src/components/modals/AddItemToOrderModal.tsx

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2, ShoppingCart, Search } from 'lucide-react';

// Interface para o objeto de produto que esperamos da API
interface Product {
  id: number;
  nome: string;
  preco: number;
}

// Interface para as props do nosso modal
interface AddItemToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
  onAddItem: (produtoId: number, quantidade: number) => void;
  isAddingItem: boolean;
}

/**
 * Função de busca para o React Query.
 * Busca a lista de produtos da API.
 */
const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await apiClient.get('/produtos');
  // Esta linha é robusta: funciona se a API retornar { produtos: [...] } ou só o array [...]
  return data.produtos || data || [];
};

export default function AddItemToOrderModal({ isOpen, onClose, onAddItem, isAddingItem }: AddItemToOrderModalProps) {
  // Estados internos do modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Busca os dados dos produtos usando React Query
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-list'], // Chave diferente de 'produtos' para não conflitar com a página principal
    queryFn: fetchProducts,
    enabled: isOpen, // Só busca os produtos quando o modal está aberto
  });

  // Filtra os produtos com base na busca, de forma otimizada
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    return products.filter(p => p.nome.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  // Função chamada ao confirmar a adição
  const handleConfirm = () => {
    if (selectedProduct && quantity > 0) {
      onAddItem(selectedProduct.id, quantity);
    }
  };
  
  // Reseta o estado interno e fecha o modal
  const resetAndClose = () => {
    if (isAddingItem) return; // Não deixa fechar enquanto adiciona
    setSelectedProduct(null);
    setQuantity(1);
    setSearchQuery('');
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Item à Comanda</DialogTitle>
          <DialogDescription>
            Busque, selecione o produto e informe a quantidade.
          </DialogDescription>
        </DialogHeader>
        
        {/* ETAPA 1: SELEÇÃO DE PRODUTO */}
        {!selectedProduct ? (
          <Command className='mt-2'>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <CommandInput 
                placeholder="Digite para buscar um produto..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="pl-8"
              />
            </div>
            <CommandList>
              {isLoadingProducts && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Carregando produtos...
                </div>
              )}
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => {
                      setSelectedProduct(product);
                      setSearchQuery('');
                    }}
                    className="flex justify-between"
                  >
                    <span>{product.nome}</span>
                    <span className="text-sm text-gray-500">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          /* ETAPA 2: DEFINIR QUANTIDADE */
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <p className="font-semibold">{selectedProduct.nome}</p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedProduct.preco)}
              </p>
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-1">
                Quantidade
              </label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="text-center text-lg h-12"
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          {selectedProduct && (
             <Button variant="ghost" onClick={() => setSelectedProduct(null)} disabled={isAddingItem}>
               Escolher outro produto
             </Button>
          )}
          <Button onClick={handleConfirm} disabled={!selectedProduct || isAddingItem}>
            {isAddingItem && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}