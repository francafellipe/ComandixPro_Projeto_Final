// src/types/index.ts

/**
 * Define os papéis de usuário, espelhando os papéis definidos no backend.
 * Usar este tipo garante consistência em toda a aplicação.
 */
export type AppRole = 'admin_global' | 'admin_empresa' | 'caixa' | 'garcom';

/**
 * Define a estrutura do objeto de usuário que será usado em todo o frontend
 * após o login, geralmente armazenado no AuthContext.
 */
export interface User {
  id: number;
  email: string;
  nome: string;
  role: AppRole; // Usa nosso tipo AppRole para segurança de tipos
  empresaId: number | null; // Pode ser nulo para o admin_global
}

// Futuramente, podemos adicionar outros tipos compartilhados aqui,
// como os tipos para os modelos do backend (Produto, Caixa, etc.)
// para não precisarmos redefini-los em cada página.
// Ex: export type Produto = { id: number; nome: string; ... }