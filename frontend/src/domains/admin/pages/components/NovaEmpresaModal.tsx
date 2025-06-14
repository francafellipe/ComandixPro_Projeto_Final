
// src/domains/admin/components/NovaEmpresaModal.tsx
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { createEmpresaComAdminSchema } from '@/validators/adminEmpresa.validator';

// Componentes de UI
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Mail, User, Calendar, Shield, AlertCircle, X } from "lucide-react";

// O tipo para os valores do nosso formulário é inferido diretamente do schema Zod
type CreateEmpresaFormValues = z.infer<typeof createEmpresaComAdminSchema>['body'];

// A função que chama a API
const createEmpresaApi = async (values: CreateEmpresaFormValues) => {
  const { data } = await apiClient.post('/admin/empresas', values);
  return data;
};

// As props que o modal recebe da página pai
interface NovaEmpresaModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NovaEmpresaModal({ isOpen, onOpenChange }: NovaEmpresaModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateEmpresaFormValues>({
    resolver: zodResolver(createEmpresaComAdminSchema.shape.body),
    defaultValues: {
      empresaData: { nome: '', emailContato: '', cnpj: '', licencaValidaAte: '' },
      adminUserData: { nome: '', email: '', senhaPlain: '' }
    }
  });

  const mutation = useMutation({
    mutationFn: createEmpresaApi,
    onSuccess: (data) => {
      toast({ 
        title: "✅ Sucesso!", 
        description: `Empresa "${data.empresa.nome}" criada com sucesso!`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['admin_empresas'] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Não foi possível criar a empresa.", 
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const onSubmit: SubmitHandler<CreateEmpresaFormValues> = (values) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* Header do Modal */}
        <DialogHeader className="p-4 md:p-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-semibold text-gray-900">
                  Nova Empresa
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Crie uma nova empresa e configure seu administrador
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
            {/* Seção Dados da Empresa */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Dados da Empresa</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="empresaData.nome" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    Nome da Empresa *
                  </Label>
                  <Input 
                    id="empresaData.nome" 
                    {...form.register('empresaData.nome')} 
                    placeholder="Digite o nome da empresa"
                    className={`transition-colors ${form.formState.errors.empresaData?.nome ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.empresaData?.nome && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.empresaData.nome.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresaData.emailContato" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email de Contato *
                  </Label>
                  <Input 
                    id="empresaData.emailContato" 
                    type="email" 
                    {...form.register('empresaData.emailContato')} 
                    placeholder="contato@empresa.com"
                    className={`transition-colors ${form.formState.errors.empresaData?.emailContato ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.empresaData?.emailContato && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.empresaData.emailContato.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="empresaData.cnpj" className="text-sm font-medium text-gray-700">
                    CNPJ (apenas números) *
                  </Label>
                  <Input 
                    id="empresaData.cnpj" 
                    {...form.register('empresaData.cnpj')} 
                    placeholder="00000000000100"
                    className={`transition-colors ${form.formState.errors.empresaData?.cnpj ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.empresaData?.cnpj && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.empresaData.cnpj.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="empresaData.licencaValidaAte" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Licença Válida Até *
                  </Label>
                  <Input 
                    id="empresaData.licencaValidaAte" 
                    type="date" 
                    {...form.register('empresaData.licencaValidaAte')} 
                    className={`transition-colors ${form.formState.errors.empresaData?.licencaValidaAte ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.empresaData?.licencaValidaAte && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.empresaData.licencaValidaAte.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Seção Administrador Inicial */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b">
                <Shield className="h-4 w-4 text-green-600" />
                <h3 className="text-base md:text-lg font-semibold text-gray-900">Administrador Inicial</h3>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="adminUserData.nome" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3" />
                    Nome do Administrador *
                  </Label>
                  <Input 
                    id="adminUserData.nome" 
                    {...form.register('adminUserData.nome')} 
                    placeholder="Nome completo do administrador"
                    className={`transition-colors ${form.formState.errors.adminUserData?.nome ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.adminUserData?.nome && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.adminUserData.nome.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminUserData.email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    Email (Login) *
                  </Label>
                  <Input 
                    id="adminUserData.email" 
                    type="email" 
                    {...form.register('adminUserData.email')} 
                    placeholder="admin@empresa.com"
                    className={`transition-colors ${form.formState.errors.adminUserData?.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.adminUserData?.email && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.adminUserData.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminUserData.senhaPlain" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Shield className="h-3 w-3" />
                    Senha Provisória *
                  </Label>
                  <Input 
                    id="adminUserData.senhaPlain" 
                    type="password" 
                    {...form.register('adminUserData.senhaPlain')} 
                    placeholder="Senha inicial (min. 6 caracteres)"
                    className={`transition-colors ${form.formState.errors.adminUserData?.senhaPlain ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'}`}
                  />
                  {form.formState.errors.adminUserData?.senhaPlain && (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {form.formState.errors.adminUserData.senhaPlain.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé com Botões */}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
                className="w-full sm:w-auto min-w-[120px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="w-full sm:w-auto min-w-[160px] bg-blue-600 hover:bg-blue-700"
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mutation.isPending ? "Criando..." : "Criar Empresa"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
