// src/contexts/AuthProvider.tsx
import { createContext, useState, useEffect, ReactNode } from 'react';
import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import apiClient from '../lib/api-client';
import { User } from '../types';

// credenciais de login
interface LoginCredentials {
  email: string;
  senha: string;
}

// Define tudo que o contexto de autenticação irá fornecer para a aplicação
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Para saber se ainda estamos carregando o usuário do localStorage
  logout: () => void;
  // Expõe o objeto da mutação completo do React Query
  loginMutation: UseMutationResult<any, Error, LoginCredentials, unknown>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Controla o carregamento inicial
  const queryClient = useQueryClient();

  // Roda uma vez quando a aplicação carrega para verificar a sessão salva
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch (error) {
        console.error("AuthProvider: Erro ao carregar dados salvos.", error);
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  // Lógica de Login usando useMutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data; 
    },
    onSuccess: (data) => {
      const { usuario: loggedInUser, token: authToken } = data;
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setToken(authToken);
      queryClient.invalidateQueries(); 
    },
    onError: (error) => {
      console.error("AuthProvider: Falha na mutação de login.", error);
    }
  });

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('auth_user');
    queryClient.invalidateQueries();
    window.location.replace('/login'); // Redireciona de forma "hard" para limpar tudo
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    logout,
    loginMutation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}