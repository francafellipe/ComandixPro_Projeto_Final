// src/validators/auth.validators.ts
import { z } from 'zod';

// Schema Zod para validação dos dados de login
export const loginSchema = z.object({
  body: z.object({
    email: z.string({
        required_error: "O campo email é obrigatório.",
        invalid_type_error: "Email deve ser uma string."
      }).email({ message: "Formato de email inválido." }),
    senha: z.string({
        required_error: "O campo senha é obrigatório.",
        invalid_type_error: "Senha deve ser uma string."
      }).min(1, { message: "Senha não pode estar vazia." }) // Mínimo de 1 para não ser vazia, pode ajustar para min real de senha
       .max(100, {message: "Senha muito longa."}), // Limite máximo opcional
  }),
});