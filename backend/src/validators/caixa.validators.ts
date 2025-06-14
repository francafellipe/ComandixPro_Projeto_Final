import z from "zod";
import { TipoMovimentacaoCaixa } from "../models/movimentacaoCaixa.schema";


export const abrirCaixaSchema = z.object({
  body: z.object({
    saldoInicial: z.number({
      required_error: "Saldo inicial é obrigatório.",
      invalid_type_error: "Saldo inicial deve ser um número."
    }).nonnegative({ message: "Saldo inicial não pode ser negativo." }),
    observacoesAbertura: z.string({
      invalid_type_error: "Observações de abertura devem ser uma string."
    }).max(500, { message: "Observações de abertura não podem exceder 500 caracteres." })
      .optional()
      .nullable(), // Permite que seja null ou não fornecido
  }),

});

export const registrarMovimentacaoSchema = z.object({
  body: z.object({
    tipo: z.enum([TipoMovimentacaoCaixa.SUPRIMENTO, TipoMovimentacaoCaixa.SANGRIA], {
      required_error: "O tipo da movimentação é obrigatório.",
      invalid_type_error: `Tipo de movimentação inválido. Use '${TipoMovimentacaoCaixa.SUPRIMENTO}' ou '${TipoMovimentacaoCaixa.SANGRIA}'.`
    }),
    valor: z.number({
      required_error: "O valor da movimentação é obrigatório.",
      invalid_type_error: "O valor da movimentação deve ser um número."
    }).positive({ message: "O valor da movimentação deve ser um número positivo." }),
    observacao: z.string({
      invalid_type_error: "Observação deve ser uma string."
    }).max(500, { message: "Observação não pode exceder 500 caracteres." })
      .optional()
      .nullable(),
  })
});

export const fecharCaixaSchema = z.object({
  body: z.object({
    saldoFinalInformado: z.number({
      required_error: "Saldo final informado é obrigatório.",
      invalid_type_error: "Saldo final informado deve ser um número."
    }).nonnegative({ message: "Saldo final informado não pode ser negativo." }),
    observacoesFechamento: z.string({
      invalid_type_error: "Observações de fechamento devem ser uma string."
    }).max(500, { message: "Observações de fechamento não podem exceder 500 caracteres." })
      .optional()
      .nullable(),
  })
});

export const getCaixaRelatorioSchema = z.object({
  params: z.object({
    caixaId: z.string({ // Parâmetros da rota são inicialmente strings
        required_error: "ID do caixa é obrigatório na rota.",
        invalid_type_error: "ID do caixa deve ser uma string na rota."
      })
      .refine((val) => /^\d+$/.test(val), { // Garante que a string contém apenas dígitos
        message: "ID do caixa deve ser um número inteiro positivo.",
      })
      .transform((val) => parseInt(val, 10)), // Transforma para número após validação
  })
});