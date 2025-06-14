// src/components/modals/MovimentacaoCaixaModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

const movimentacaoSchema = z.object({
  tipo: z.enum(['suprimento', 'sangria']),
  valor: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
  observacao: z.string().optional(),
});

type MovimentacaoFormValues = z.infer<typeof movimentacaoSchema>;

const registrarMovimentacao = async (dados: MovimentacaoFormValues) => {
  const { data } = await apiClient.post('/caixa/movimentacoes', dados);
  return data;
};

interface MovimentacaoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo?: 'suprimento' | 'sangria';
  onSuccess?: () => void;
}

export function MovimentacaoCaixaModal({ isOpen, onClose, tipo = 'sangria', onSuccess }: MovimentacaoCaixaModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<MovimentacaoFormValues>({
    resolver: zodResolver(movimentacaoSchema),
    defaultValues: { tipo, valor: 0, observacao: '' },
  });

  const mutation = useMutation({
    mutationFn: registrarMovimentacao,
    onSuccess: () => {
      toast({ title: "Movimentação registrada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['caixaStatus'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
      form.reset();
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.response?.data?.message, variant: 'destructive' });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Movimentação de Caixa</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            {/* ... Formulário completo aqui ... */}
             <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}