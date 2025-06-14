// src/domains/auth/pages/LoginPage.tsx
import { useState } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { AppRole } from "@/types";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { loginMutation, isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  console.log("isAuthLoading:", isAuthLoading);
  console.log("isAuthenticated:", isAuthenticated);


  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      if(user?.role === 'admin_global') {
        setLocation("/admin/dashboard");
      } else {
        setLocation("/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive",
      });
      return;
    }

    try {
      const data = await loginMutation.mutateAsync({ email, senha: password });

      toast({ title: "Sucesso!", description: "Login realizado com sucesso." });

      const userRole = data.usuario.role as AppRole;
      setLocation(userRole === 'admin_global' ? '/admin/dashboard' : '/dashboard');

    } catch (error: any) {
      
      const errorMessage = error.response?.data?.message || "Email ou senha incorretos.";
      toast({
        title: "Falha no Login",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl rounded-2xl bg-white/80 backdrop-blur-sm border-0">
        <CardHeader className="text-center">
          <UtensilsCrossed className="mx-auto h-10 w-10 text-blue-600" />
          <CardTitle className="text-3xl font-extrabold text-gray-800 tracking-tight mt-4">
            Comandix Pro
          </CardTitle>
          <p className="text-sm text-muted-foreground">Acesse sua conta para continuar</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loginMutation.isPending}
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-2"
              // 6. O estado de carregamento vem diretamente da mutação
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}