// src/components/modals/AbrirCaixaModal.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

// Schema de validação para o formulário
const abrirCaixaSchema = z.object({
  saldoInicial: z.coerce.number().min(0, "O saldo inicial não pode ser negativo."),
  observacoesAbertura: z.string().optional(),
});

type AbrirCaixaFormValues = z.infer<typeof abrirCaixaSchema>;

// Função de API
const abrirCaixa = async (dados: AbrirCaixaFormValues) => {
  const { data } = await apiClient.post('/caixa/abrir', dados);
  return data;
};

interface AbrirCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AbrirCaixaModal({ isOpen, onClose, onSuccess }: AbrirCaixaModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const form = useForm<AbrirCaixaFormValues>({
    resolver: zodResolver(abrirCaixaSchema),
    defaultValues: { saldoInicial: 0, observacoesAbertura: '' },
  });

  const mutation = useMutation({
    mutationFn: abrirCaixa,
    onSuccess: (data) => {
      toast({ title: "Caixa aberto com sucesso!", description: `Saldo inicial: R$ ${data.saldoInicial.toFixed(2)}` });
      queryClient.invalidateQueries({ queryKey: ['caixaStatus'] });
      form.reset();
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast({ title: 'Erro ao abrir caixa', description: err.response?.data?.message, variant: 'destructive' });
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Novo Caixa</DialogTitle>
          <DialogDescription>Insira o saldo inicial (valor de troco) para começar as operações do dia.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="saldoInicial"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoesAbertura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Alguma observação sobre a abertura..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Abertura
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}