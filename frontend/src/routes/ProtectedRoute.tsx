// src/routes/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'wouter';
import { Loader2, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  const isAuthorized = 
    user.role === 'admin_global' ||
    !allowedRoles ||
    allowedRoles.length === 0 ||
    allowedRoles.includes(user.role);

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
          <ShieldX className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar este recurso.</p>
          <Button onClick={() => window.location.href = '/dashboard'}>Voltar</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}