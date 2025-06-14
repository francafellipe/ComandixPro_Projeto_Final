// src/validators/user.validators.ts
import { z } from 'zod';
import { UserRole } from '../models/usuario.schema'; // Importa o enum UserRole

// Roles que um admin_empresa pode atribuir ou modificar
const assignableUserRoles = [
  UserRole.ADMIN_EMPRESA,
  UserRole.CAIXA,
  UserRole.GARCOM,
] as const; // 'as const' para z.enum esperar exatamente esses valores

// Schema para o parâmetro 'id' (userId) da rota
export const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string({
        required_error: "ID do usuário é obrigatório na rota.",
        invalid_type_error: "ID do usuário deve ser uma string na rota."
      })
      .refine((val) => /^\d+$/.test(val), {
        message: "ID do usuário deve ser um número inteiro positivo.",
      })
      .transform((val) => parseInt(val, 10)),
  }),
});

// Schema para criação de usuário (valida o corpo da requisição POST /api/usuarios)
export const createUserSchema = z.object({
  body: z.object({
    nome: z.string({ required_error: "Nome é obrigatório." })
      .min(3, { message: "Nome deve ter pelo menos 3 caracteres." })
      .max(100, { message: "Nome não pode exceder 100 caracteres." }),
    email: z.string({ required_error: "Email é obrigatório." })
      .email({ message: "Formato de email inválido." }),
    senhaPlain: z.string({ required_error: "Senha é obrigatória." })
      .min(6, { message: "Senha deve ter pelo menos 6 caracteres." })
      .max(50, { message: "Senha não pode exceder 50 caracteres." }),
    role: z.enum(assignableUserRoles, { // Garante que o role é um dos permitidos
      required_error: "Papel (role) é obrigatório.",
      invalid_type_error: `Papel inválido. Valores permitidos: ${assignableUserRoles.join(', ')}.`,
    }),
  }),
});

// Schema para o corpo da requisição de atualização de usuário (PUT /api/usuarios/:id)
export const updateUserBodySchema = z.object({
  body: z.object({
    nome: z.string()
      .min(3, { message: "Nome deve ter pelo menos 3 caracteres." })
      .max(100, { message: "Nome não pode exceder 100 caracteres." })
      .optional(),
    role: z.enum(assignableUserRoles, {
      invalid_type_error: `Papel inválido. Valores permitidos: ${assignableUserRoles.join(', ')}.`,
    }).optional(),
    ativo: z.boolean({
      invalid_type_error: "O campo 'ativo' deve ser um booleano."
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido para atualização.",
    path: [] 
  }),
});

// Schema combinado para atualização de usuário (params e body)
export const updateUserSchema = userIdParamsSchema.merge(updateUserBodySchema);

// Schema para o corpo da requisição de definir status do usuário (PATCH /api/usuarios/:id/status)
export const setUserStatusBodySchema = z.object({
  body: z.object({
    ativo: z.boolean({
      required_error: "O campo 'ativo' é obrigatório.",
      invalid_type_error: "O campo 'ativo' deve ser um booleano."
    }),
  }),
});

// Schema combinado para definir status do usuário (params e body)
export const setUserStatusSchema = userIdParamsSchema.merge(setUserStatusBodySchema);