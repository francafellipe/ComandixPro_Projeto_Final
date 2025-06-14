// src/validators/product.validators.ts
import { z } from 'zod';

// Schema para criação de produto (valida o corpo da requisição POST /api/produtos)
export const createProductSchema = z.object({
  body: z.object({
    nome: z.string({
      required_error: "Nome do produto é obrigatório.",
      invalid_type_error: "Nome do produto deve ser uma string."
    }).min(2, { message: "Nome do produto deve ter pelo menos 2 caracteres." })
      .max(100, { message: "Nome do produto não pode exceder 100 caracteres." }),
    
    preco: z.number({
      required_error: "Preço do produto é obrigatório.",
      invalid_type_error: "Preço do produto deve ser um número."
    }).positive({ message: "Preço do produto deve ser um valor positivo." }),
    
    categoria: z.string({
      invalid_type_error: "Categoria deve ser uma string."
    }).max(50, { message: "Categoria não pode exceder 50 caracteres." })
      .optional()
      .nullable(), // Categoria pode ser opcional ou nula
      
    disponivel: z.boolean({
      invalid_type_error: "O campo 'disponivel' deve ser um booleano (true/false)."
    }).optional(), // Disponível é opcional na criação, default será true no modelo
  }),
});

// Schema para atualização de produto (valida o corpo da requisição PUT /api/produtos/:id)
// Todos os campos são opcionais na atualização.
export const updateProductBodySchema = z.object({
  body: z.object({
    nome: z.string({
      invalid_type_error: "Nome do produto deve ser uma string."
    }).min(2, { message: "Nome do produto deve ter pelo menos 2 caracteres." })
      .max(100, { message: "Nome do produto não pode exceder 100 caracteres." })
      .optional(),
      
    preco: z.number({
      invalid_type_error: "Preço do produto deve ser um número."
    }).positive({ message: "Preço do produto deve ser um valor positivo." })
      .optional(),
      
    categoria: z.string({
      invalid_type_error: "Categoria deve ser uma string."
    }).max(50, { message: "Categoria não pode exceder 50 caracteres." })
      .nullable() // Permite explicitamente que seja null para "limpar" a categoria
      .optional(),
      
    disponivel: z.boolean({
      invalid_type_error: "O campo 'disponivel' deve ser um booleano (true/false)."
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, { // Garante que pelo menos um campo seja enviado para atualização
    message: "Pelo menos um campo deve ser fornecido para atualização.",
    path: [] // Path para o erro geral do objeto body
  }),
});


// Schema para validar o parâmetro 'id' da rota (para GET por ID, PUT, DELETE)
export const productIdParamsSchema = z.object({
  params: z.object({
    id: z.string({ // Parâmetros de rota são inicialmente strings
        required_error: "ID do produto é obrigatório na rota.",
        invalid_type_error: "ID do produto deve ser uma string na rota."
      })
      .refine((val) => /^\d+$/.test(val), {
        message: "ID do produto deve ser um número inteiro positivo.",
      })
      .transform((val) => parseInt(val, 10)), // Transforma para número após validação
  }),
});

// Schema combinado para atualização de produto (params e body)
export const updateProductSchema = productIdParamsSchema.merge(updateProductBodySchema);