// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // 1. Importando o provider do React Query
import { AuthProvider } from './contexts/AuthProvider'; // 2. Importando nosso provedor de autenticação
import App from './App';
import './index.css';

// 3. Criando a instância do cliente de query
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 4. Envelopando o App com os provedores. A ordem é importante. */}
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);