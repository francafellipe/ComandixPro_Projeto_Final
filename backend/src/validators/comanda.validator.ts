// src/validators/comanda.validators.ts
import { z } from 'zod';
import { ComandaStatus, FormaPagamento } from '../models/comanda.schema'; // Enums do modelo

// Schema para validar o parâmetro :comandaId da rota
export const comandaIdParamsSchema = z.object({
  params: z.object({
    comandaId: z.string()
      .refine((val) => /^\d+$/.test(val), { message: "ID da comanda deve ser um número inteiro positivo." })
      .transform((val) => parseInt(val, 10)),
  }),
});

// Schema para validar o parâmetro :itemComandaId da rota
export const itemComandaIdParamsSchema = z.object({
  params: z.object({
    itemComandaId: z.string()
      .refine((val) => /^\d+$/.test(val), { message: "ID do item da comanda deve ser um número inteiro positivo." })
      .transform((val) => parseInt(val, 10)),
  }),
});

export const criarComandaSchema = z.object({
  body: z.object({
    mesa: z.string({ invalid_type_error: "Mesa deve ser uma string." })
      .max(50, { message: "Nome/número da mesa não pode exceder 50 caracteres." })
      .optional().nullable(),
    nomeCliente: z.string({ invalid_type_error: "Nome do cliente deve ser uma string." })
      .max(100, { message: "Nome do cliente não pode exceder 100 caracteres." })
      .optional().nullable(),
    observacoes: z.string({ invalid_type_error: "Observações devem ser uma string." })
      .max(500, { message: "Observações não podem exceder 500 caracteres." })
      .optional().nullable(),
  }),
});

// Schema para o corpo da requisição de adicionar item à comanda (POST /api/comandas/:comandaId/itens)
export const adicionarItemComandaBodySchema = z.object({
  body: z.object({
    produtoId: z.number({
      required_error: "ID do produto é obrigatório.",
      invalid_type_error: "ID do produto deve ser um número."
    }).int().positive({ message: "ID do produto deve ser um inteiro positivo." }),
    quantidade: z.number({
      required_error: "Quantidade é obrigatória.",
      invalid_type_error: "Quantidade deve ser um número."
    }).int().positive({ message: "Quantidade deve ser um inteiro positivo." }),
    observacaoItem: z.string({ invalid_type_error: "Observação do item deve ser uma string." })
      .max(255, { message: "Observação do item não pode exceder 255 caracteres." })
      .optional().nullable(),
  }),
});

// Schema combinado para adicionar item (params e body)
export const adicionarItemComandaSchema = comandaIdParamsSchema.merge(adicionarItemComandaBodySchema);

// Schema para o corpo da requisição de processar pagamento (PUT /api/comandas/:comandaId/pagar)
export const processarPagamentoComandaBodySchema = z.object({
  body: z.object({
    formaPagamento: z.enum(Object.values(FormaPagamento) as [FormaPagamento, ...FormaPagamento[]], { // Garante que é um valor do enum
      required_error: "Forma de pagamento é obrigatória.",
      invalid_type_error: `Forma de pagamento inválida. Valores permitidos: ${Object.values(FormaPagamento).join(', ')}.`
    }),
  }),
});

// Schema combinado para processar pagamento (params e body)
export const processarPagamentoComandaSchema = comandaIdParamsSchema.merge(processarPagamentoComandaBodySchema);


// Schema para query params da listagem de comandas (GET /api/comandas)
export const listarComandasQuerySchema = z.object({
  query: z.object({
    status: z.enum([ComandaStatus.ABERTA, ComandaStatus.FECHADA, ComandaStatus.PAGA, ComandaStatus.CANCELADA, "aberta", "fechada", "paga", "cancelada", "aguardando_pagamento"],{
      invalid_type_error: `Status inválido. Valores permitidos: ${Object.values(ComandaStatus).join(', ')}.`
    }).optional(),
    mesa: z.string().max(50).optional(),
    dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de dataInicio inválido. Use YYYY-MM-DD."}).optional(),
    dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de dataFim inválido. Use YYYY-MM-DD."}).optional(),
  }).refine(data => { // Validação customizada para datas
    if (data.dataInicio && data.dataFim) {
      return new Date(data.dataFim) >= new Date(data.dataInicio);
    }
    return true;
  }, { message: "dataFim deve ser igual ou posterior a dataInicio.", path: ['dataFim'] })
});


export const removerItemComandaParamsSchema = comandaIdParamsSchema.merge(itemComandaIdParamsSchema);
