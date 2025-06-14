
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX,
  Shield,
  Coffee,
  CreditCard,
  Utensils,
  Search,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Tipos
interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: 'admin_empresa' | 'caixa' | 'garcom';
  ativo: boolean;
  criadoEm: string;
  ultimoLogin?: string;
}

// Schema de validação
const userFormSchema = z.object({
  nome: z.string().min(3, "O nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.enum(['admin_empresa', 'caixa', 'garcom']),
  senhaPlain: z.string().optional(),
  ativo: z.boolean().default(true)
}).refine(data => {
  // Para novos usuários, senha é obrigatória
  return data.senhaPlain && data.senhaPlain.length >= 6;
}, {
  message: "Senha é obrigatória e deve ter no mínimo 6 caracteres",
  path: ["senhaPlain"]
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Funções de API
const fetchUsuarios = async (empresaId?: string): Promise<Usuario[]> => {
  let url = '/usuarios';
  if (empresaId) {
    url += `?empresaId=${empresaId}`;
  }
  const { data } = await apiClient.get(url);
  return data;
};

const criarUsuario = async (usuario: UserFormValues) => {
  const { data } = await apiClient.post('/usuarios', usuario);
  return data;
};

const atualizarUsuario = async ({ id, ...usuario }: Partial<Usuario> & { id: number }) => {
  const { data } = await apiClient.put(`/usuarios/${id}`, usuario);
  return data;
};

const excluirUsuario = async (id: number) => {
  await apiClient.delete(`/usuarios/${id}`);
};

const alterarStatusUsuario = async ({ id, ativo }: { id: number; ativo: boolean }) => {
  const { data } = await apiClient.patch(`/usuarios/${id}/status`, { ativo });
  return data;
};

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Verificar se estamos na rota do admin global
  const [matchAdminRoute, adminParams] = useRoute('/admin/empresa/:empresaId/usuarios');
  const [matchUserRoute] = useRoute('/usuarios');
  
  const empresaId = adminParams?.empresaId;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<'todos' | 'admin_empresa' | 'caixa' | 'garcom'>('todos');

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      nome: '',
      email: '',
      role: 'garcom',
      senhaPlain: '',
      ativo: true
    }
  });

  // Query para buscar usuários
  const { data: usuarios = [], isLoading, isError } = useQuery({
    queryKey: ['usuarios', empresaId],
    queryFn: () => fetchUsuarios(empresaId),
  });

  // Mutações
  const criarMutation = useMutation({
    mutationFn: criarUsuario,
    onSuccess: () => {
      toast({ title: "✅ Sucesso", description: "Usuário criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['usuarios', empresaId] });
      form.reset();
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao criar usuário", 
        variant: "destructive" 
      });
    }
  });

  const atualizarMutation = useMutation({
    mutationFn: atualizarUsuario,
    onSuccess: () => {
      toast({ title: "✅ Sucesso", description: "Usuário atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['usuarios', empresaId] });
      form.reset();
      setIsModalOpen(false);
      setUsuarioEditando(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao atualizar usuário", 
        variant: "destructive" 
      });
    }
  });

  const excluirMutation = useMutation({
    mutationFn: excluirUsuario,
    onSuccess: () => {
      toast({ title: "✅ Sucesso", description: "Usuário excluído com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ['usuarios', empresaId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao excluir usuário", 
        variant: "destructive" 
      });
    }
  });

  const alterarStatusMutation = useMutation({
    mutationFn: alterarStatusUsuario,
    onSuccess: (_, variables) => {
      toast({ 
        title: "✅ Sucesso", 
        description: `Usuário ${variables.ativo ? 'ativado' : 'desativado'} com sucesso!` 
      });
      queryClient.invalidateQueries({ queryKey: ['usuarios', empresaId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "❌ Erro", 
        description: error.response?.data?.message || "Erro ao alterar status do usuário", 
        variant: "destructive" 
      });
    }
  });

  // Handlers
  const abrirModal = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      form.reset({
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo,
        senhaPlain: '' // Senha vazia para edição
      });
    } else {
      setUsuarioEditando(null);
      form.reset({
        nome: '',
        email: '',
        role: 'garcom',
        ativo: true,
        senhaPlain: ''
      });
    }
    setIsModalOpen(true);
  };

  const onSubmit = (values: UserFormValues) => {
    if (usuarioEditando) {
      const updateData: any = {
        id: usuarioEditando.id,
        nome: values.nome,
        email: values.email,
        role: values.role,
        ativo: values.ativo
      };

      if (values.senhaPlain?.trim()) {
        updateData.senhaPlain = values.senhaPlain;
      }

      atualizarMutation.mutate(updateData);
    } else {
      criarMutation.mutate(values);
    }
  };

  // Filtros
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchBusca = usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      usuario.email.toLowerCase().includes(busca.toLowerCase());
    const matchRole = filtroRole === 'todos' || usuario.role === filtroRole;
    return matchBusca && matchRole;
  });

  // Helpers
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin_empresa': return Shield;
      case 'caixa': return CreditCard;
      case 'garcom': return Utensils;
      default: return Users;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'admin_empresa': 'Administrador',
      'caixa': 'Caixa',
      'garcom': 'Garçom'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'admin_empresa': 'bg-purple-100 text-purple-800',
      'caixa': 'bg-green-100 text-green-800',
      'garcom': 'bg-blue-100 text-blue-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
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
          <p className="text-gray-600">Não foi possível carregar a lista de usuários.</p>
        </Card>
      </div>
    );
  }

  const usuariosAtivos = usuarios.filter(u => u.ativo).length;
  const usuariosInativos = usuarios.filter(u => !u.ativo).length;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 md:h-8 md:w-8" />
          Usuários
        </h1>
        <Button onClick={() => abrirModal()} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold">{usuarios.length}</p>
              </div>
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{usuariosAtivos}</p>
              </div>
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Usuários Inativos</p>
                <p className="text-2xl font-bold text-red-600">{usuariosInativos}</p>
              </div>
              <UserX className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filtroRole === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroRole('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filtroRole === 'admin_empresa' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroRole('admin_empresa')}
            >
              <Shield className="mr-1 h-3 w-3" />
              Administradores
            </Button>
            <Button
              variant={filtroRole === 'caixa' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroRole('caixa')}
            >
              <CreditCard className="mr-1 h-3 w-3" />
              Caixa
            </Button>
            <Button
              variant={filtroRole === 'garcom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroRole('garcom')}
            >
              <Utensils className="mr-1 h-3 w-3" />
              Garçons
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="space-y-3">
        {usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          usuariosFiltrados.map((usuario) => {
            const RoleIcon = getRoleIcon(usuario.role);
            return (
              <Card key={usuario.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <RoleIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {usuario.nome}
                          {!usuario.ativo && (
                            <Badge variant="secondary" className="bg-red-100 text-red-800">
                              Inativo
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{usuario.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getRoleColor(usuario.role)}>
                            {getRoleLabel(usuario.role)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Criado em {formatDate(usuario.criadoEm)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 self-end sm:self-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirModal(usuario)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => alterarStatusMutation.mutate({ 
                          id: usuario.id, 
                          ativo: !usuario.ativo 
                        })}
                        className={`h-8 w-8 p-0 ${
                          usuario.ativo ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'
                        }`}
                        disabled={usuario.id === currentUser?.id}
                      >
                        {usuario.ativo ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            disabled={usuario.id === currentUser?.id}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário "{usuario.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => excluirMutation.mutate(usuario.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Usuário */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-[95vw] max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="garcom">Garçom</SelectItem>
                        <SelectItem value="caixa">Caixa</SelectItem>
                        <SelectItem value="admin_empresa">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senhaPlain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Senha {usuarioEditando ? '(deixe em branco para manter a atual)' : '*'}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Digite a senha" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Usuário ativo</FormLabel>
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setUsuarioEditando(null);
                    form.reset();
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
                  {usuarioEditando ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
