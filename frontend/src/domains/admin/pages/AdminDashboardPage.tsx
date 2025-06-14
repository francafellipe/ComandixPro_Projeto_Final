// src/domains/admin/pages/AdminDashboardPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { createEmpresaComAdminSchema } from '@/validators/adminEmpresa.validator';
import { z } from 'zod';

// Componentes e Ícones
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Building2, Plus, Edit, Loader2, Eye, EyeOff, Calendar, Mail, User, Shield, Users } from "lucide-react";
import { NovaEmpresaModal } from './components/NovaEmpresaModal';
import { Link } from "wouter";

// Tipos
type Empresa = { 
  id: number; 
  nome: string; 
  emailContato: string; 
  licencaValidaAte: string; 
  ativa: boolean;
  createdAt?: string;
  adminCount?: number;
};
type CreateEmpresaFormValues = z.infer<typeof createEmpresaComAdminSchema>['body'];
type UpdateEmpresaDTO = Partial<CreateEmpresaFormValues['empresaData']>;

// Funções de API
const fetchEmpresas = async (): Promise<Empresa[]> => {
  const { data } = await apiClient.get('/admin/empresas');
  return data;
};

const createEmpresa = async (values: CreateEmpresaFormValues) => {
  const { data } = await apiClient.post('/admin/empresas', values);
  return data;
};

const updateEmpresa = async ({ id, data }: { id: number, data: UpdateEmpresaDTO }) => {
  const { data: updatedData } = await apiClient.put(`/admin/empresas/${id}`, data);
  return updatedData;
};

const setEmpresaStatus = async ({ id, ativa }: { id: number, ativa: boolean }) => {
  const { data } = await apiClient.patch(`/admin/empresas/${id}/status`, { ativa });
  return data;
};

export default function AdminDashboardPage() {
  const [isNovaEmpresaModalOpen, setIsNovaEmpresaModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: empresas = [], isLoading: isLoadingEmpresas, error } = useQuery<Empresa[]>({
    queryKey: ['admin_empresas'],
    queryFn: fetchEmpresas,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  const form = useForm<CreateEmpresaFormValues>({
    resolver: zodResolver(createEmpresaComAdminSchema.shape.body),
    defaultValues: {
      empresaData: {
        nome: '',
        emailContato: '',
        cnpj: '',
        licencaValidaAte: '',
      },
      adminUserData: {
        nome: '',
        email: '',
        senhaPlain: '',
      }
    }
  });

  // Formulário separado para edição
  const editForm = useForm<Partial<Empresa>>({
    defaultValues: {
      nome: '',
      emailContato: '',
      licencaValidaAte: '',
    }
  });

  // Mutações
  const createMutation = useMutation({
    mutationFn: createEmpresa,
    onSuccess: () => {
      toast({ 
        title: "✅ Sucesso!", 
        description: "Empresa criada com sucesso. O administrador receberá um email de boas-vindas.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ['admin_empresas'] });
      setIsNovaEmpresaModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error?.response?.data?.message || "Erro ao criar empresa. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateEmpresa,
    onSuccess: () => {
      toast({ 
        title: "✅ Sucesso!", 
        description: "Empresa atualizada com sucesso.",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['admin_empresas'] });
      setIsEditModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error?.response?.data?.message || "Erro ao atualizar empresa.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const statusMutation = useMutation({
    mutationFn: setEmpresaStatus,
    onSuccess: (data) => {
      toast({ 
        title: "🔄 Status alterado!", 
        description: `A empresa "${data.empresa.nome}" agora está ${data.empresa.ativa ? 'ativa' : 'inativa'}.`,
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['admin_empresas'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error?.response?.data?.message || "Erro ao alterar status.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const handleOpenNovaEmpresaModal = () => {
    setIsNovaEmpresaModalOpen(true);
  };

  const handleOpenEditModal = (empresa: Empresa) => {
    setEmpresaEditando(empresa);
    // Resetar o formulário de edição com os dados da empresa selecionada
    editForm.reset({
      nome: empresa.nome,
      emailContato: empresa.emailContato,
      licencaValidaAte: new Date(empresa.licencaValidaAte).toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = (values: Partial<Empresa>) => {
    if (empresaEditando) {
      updateMutation.mutate({ id: empresaEditando.id, data: values });
    }
  };

  // Filtrar empresas por termo de busca
  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.emailContato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Verificar se a licença está próxima do vencimento (30 dias)
  const isLicenseExpiring = (date: string) => {
    const licenseDate = new Date(date);
    const today = new Date();
    const diffTime = licenseDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isLicenseExpired = (date: string) => {
    const licenseDate = new Date(date);
    const today = new Date();
    return licenseDate < today;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Administração Global</h2>
          <p className="text-muted-foreground">
            Gerencie empresas e seus administradores
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            {empresas.length} empresa{empresas.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empresas.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <Badge variant="default" className="h-4 w-4 p-0"></Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empresas.filter(e => e.ativa).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenças Vencendo</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empresas.filter(e => isLicenseExpiring(e.licencaValidaAte)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenças Vencidas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empresas.filter(e => isLicenseExpired(e.licencaValidaAte)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Empresas Cadastradas</CardTitle>
            <Button size="sm" onClick={handleOpenNovaEmpresaModal}>
              <Plus className="w-4 h-4 mr-2" /> Nova Empresa
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar empresas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>Erro ao carregar empresas. Tente recarregar a página.</span>
            </div>
          )}

          {isLoadingEmpresas ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Licença</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        {searchTerm ? 'Nenhuma empresa encontrada com esse termo.' : 'Nenhuma empresa cadastrada ainda.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmpresas.map((empresa) => (
                      <TableRow key={empresa.id}>
                        <TableCell className="font-medium">{empresa.nome}</TableCell>
                        <TableCell>{empresa.emailContato}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {new Date(empresa.licencaValidaAte).toLocaleDateString('pt-BR')}
                            {isLicenseExpired(empresa.licencaValidaAte) && (
                              <Badge variant="destructive" className="text-xs">Vencida</Badge>
                            )}
                            {isLicenseExpiring(empresa.licencaValidaAte) && !isLicenseExpired(empresa.licencaValidaAte) && (
                              <Badge variant="secondary" className="text-xs">Vencendo</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={empresa.ativa}
                              onCheckedChange={(novoStatus) => 
                                statusMutation.mutate({ id: empresa.id, ativa: novoStatus })
                              }
                              disabled={statusMutation.isPending}
                            />
                            <span className="text-sm text-muted-foreground">
                              {empresa.ativa ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(empresa)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Link href={`/admin/empresa/${empresa.id}/usuarios`}>
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" asChild>
                                <a title="Gerenciar Usuários">
                                  <Users className="h-4 w-4" />
                                </a>
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para Nova Empresa */}
      <NovaEmpresaModal 
        isOpen={isNovaEmpresaModalOpen} 
        onOpenChange={setIsNovaEmpresaModalOpen} 
      />

      {/* Modal para Editar Empresa */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Empresa
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Dados da Empresa</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  Nome da Empresa *
                </Label>
                <Input
                  id="nome"
                  {...editForm.register('nome')}
                  placeholder="Digite o nome da empresa"
                  className={editForm.formState.errors.nome ? 'border-red-500' : ''}
                />
                {editForm.formState.errors.nome && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {editForm.formState.errors.nome.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailContato" className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email de Contato *
                </Label>
                <Input
                  id="emailContato"
                  type="email"
                  {...editForm.register('emailContato')}
                  placeholder="contato@empresa.com"
                  className={editForm.formState.errors.emailContato ? 'border-red-500' : ''}
                />
                {editForm.formState.errors.emailContato && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {editForm.formState.errors.emailContato.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licencaValidaAte" className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Licença Válida Até *
                </Label>
                <Input
                  id="licencaValidaAte"
                  type="date"
                  {...editForm.register('licencaValidaAte')}
                  className={editForm.formState.errors.licencaValidaAte ? 'border-red-500' : ''}
                />
                {editForm.formState.errors.licencaValidaAte && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {editForm.formState.errors.licencaValidaAte.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="min-w-[140px]"
              >
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}