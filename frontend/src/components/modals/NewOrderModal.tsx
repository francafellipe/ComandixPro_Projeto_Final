
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, X, Users } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const novaComandaSchema = z.object({
  mesa: z.string().optional(),
  nomeCliente: z.string().optional(),
  observacoes: z.string().optional(),
});

type NovaComandaFormValues = z.infer<typeof novaComandaSchema>;

const criarComanda = async (dados: NovaComandaFormValues) => {
  const { data } = await apiClient.post('/comandas', dados);
  return data;
};

export default function NewOrderModal({ isOpen, onClose }: NewOrderModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<NovaComandaFormValues>({
    resolver: zodResolver(novaComandaSchema),
    defaultValues: { 
      mesa: '',
      nomeCliente: '',
      observacoes: ''
    },
  });

  const criarComandaMutation = useMutation({
    mutationFn: criarComanda,
    onSuccess: (data) => {
      toast({ 
        title: "✅ Sucesso", 
        description: "Comanda criada com sucesso!",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Não foi possível criar a comanda.", 
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const onSubmit: SubmitHandler<NovaComandaFormValues> = (values) => {
    criarComandaMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 md:p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-semibold text-gray-900">
                  Nova Comanda
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Preencha os dados para criar uma nova comanda
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Conteúdo */}
        <div className="p-4 md:p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mesa" className="text-sm font-medium text-gray-700">
                Mesa (Opcional)
              </Label>
              <Input 
                id="mesa"
                placeholder="Ex: Mesa 1, Balcão, etc."
                {...form.register('mesa')}
                className="transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nomeCliente" className="text-sm font-medium text-gray-700">
                Nome do Cliente (Opcional)
              </Label>
              <Input 
                id="nomeCliente"
                placeholder="Nome do cliente"
                {...form.register('nomeCliente')}
                className="transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
                Observações (Opcional)
              </Label>
              <Textarea 
                id="observacoes"
                placeholder="Observações adicionais..."
                {...form.register('observacoes')}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={criarComandaMutation.isPending}
                className="w-full sm:w-auto min-w-[100px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={criarComandaMutation.isPending}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {criarComandaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {criarComandaMutation.isPending ? "Criando..." : "Criar Comanda"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
