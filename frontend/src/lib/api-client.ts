// src/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  // Garanta que seu arquivo 'frontend/.env' tenha esta variável:
  // VITE_API_BASE_URL=http://localhost:3001/api
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Interceptor de Requisição: Adiciona o token JWT em cada chamada
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Resposta: Trata erros globais, como token expirado (401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("API Client: Erro 401 - Não Autorizado. Redirecionando para login.");
      localStorage.removeItem('authToken');
      localStorage.removeItem('auth_user');
      
      if (window.location.pathname !== '/login') {
         window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;