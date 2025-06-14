// src/validators/adminEmpresa.validators.ts
import { z } from 'zod';

// Schema para os dados do usuário administrador inicial ao criar uma empresa
const adminUserSchema = z.object({
    nome: z.string({ required_error: "Nome do usuário administrador é obrigatório." })
        .min(3, { message: "Nome do usuário administrador deve ter pelo menos 3 caracteres." })
        .max(100),
    email: z.string({ required_error: "Email do usuário administrador é obrigatório." })
        .email({ message: "Formato de email inválido para o usuário administrador." }),
    senhaPlain: z.string({ required_error: "Senha do usuário administrador é obrigatória." })
        .min(6, { message: "Senha do usuário administrador deve ter pelo menos 6 caracteres." })
        .max(50),
});

// Schema para os dados da empresa ao criar uma empresa
const empresaDataSchema = z.object({
    nome: z.string({ required_error: "Nome da empresa é obrigatório." })
        .min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres." })
        .max(100),
    emailContato: z.string({ required_error: "Email de contato da empresa é obrigatório." })
        .email({ message: "Formato de email de contato da empresa inválido." }),
    licencaValidaAte: z.string({ required_error: "Data de validade da licença é obrigatória." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido para licença. Use YYYY-MM-DD." })
        .transform((dateStr, ctx) => { // Tenta converter para Date e valida
            const date = new Date(dateStr + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso ao criar a Date
            if (isNaN(date.getTime())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Data de validade da licença inválida.",
                });
                return z.NEVER;
            }
            // Opcional: verificar se a data não está no passado (pode ser regra de negócio no service também)
            // if (date < new Date(new Date().setHours(0,0,0,0))) {
            //   ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de validade da licença não pode ser no passado." });
            //   return z.NEVER;
            // }
            return date; // Retorna o objeto Date transformado
        }),
    cnpj: z.string({ invalid_type_error: "CNPJ deve ser uma string." })
        .length(14, { message: "CNPJ deve ter 14 dígitos (apenas números)." }) // Validação simples de tamanho
        .regex(/^\d{14}$/, { message: "CNPJ deve conter apenas números." }) // Validação simples de formato
        .optional()
        .nullable(),
    ativa: z.boolean({ invalid_type_error: "O campo 'ativa' deve ser um booleano." })
        .optional(), // 'ativa' é opcional, o service define default se não vier
});

// Schema principal para criar uma empresa com seu admin (valida o req.body)
export const createEmpresaComAdminSchema = z.object({
    body: z.object({
        empresaData: empresaDataSchema,
        adminUserData: adminUserSchema,
    }),
});

// Schemas para validar parâmetros de ID para outras rotas de admin (listar, editar, etc.)
export const empresaIdParamsSchema = z.object({
    params: z.object({
        id: z.string()
            .refine((val) => /^\d+$/.test(val), { message: "ID da empresa deve ser um número inteiro positivo." })
            .transform((val) => parseInt(val, 10)),
    }),
});

export const updateEmpresaBodySchema = z.object({
    body: z.object({
        nome: z.string({ invalid_type_error: "Nome da empresa deve ser uma string." })
            .min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres." })
            .max(100)
            .optional(),
        emailContato: z.string({ invalid_type_error: "Email de contato da empresa deve ser uma string." })
            .email({ message: "Formato de email de contato da empresa inválido." })
            .optional(),
        licencaValidaAte: z.string({ invalid_type_error: "Data de validade da licença deve ser uma string." })
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido para licença. Use YYYY-MM-DD." })
            .transform((dateStr, ctx) => {
                const date = new Date(dateStr + "T00:00:00");
                if (isNaN(date.getTime())) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de validade da licença inválida." });
                    return z.NEVER;
                }
                return date;
            })
            .optional(),
        cnpj: z.string({ invalid_type_error: "CNPJ deve ser uma string." })
            .length(14, { message: "CNPJ deve ter 14 dígitos (apenas números)." })
            .regex(/^\d{14}$/, { message: "CNPJ deve conter apenas números." })
            .nullable() // Permite que seja null para "limpar" o CNPJ
            .optional(),
        ativa: z.boolean({ invalid_type_error: "O campo 'ativa' deve ser um booleano." })
            .optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "Pelo menos um campo deve ser fornecido para atualização.",
        path: []
    }),
});

export const updateEmpresaAdminSchema = empresaIdParamsSchema.merge(updateEmpresaBodySchema);

export const setEmpresaStatusBodySchema = z.object({
    body: z.object({
        ativa: z.boolean({
            required_error: "O campo 'ativa' é obrigatório.",
            invalid_type_error: "O campo 'ativa' deve ser um booleano (true/false)."
        }),
    }),
});
export const setEmpresaStatusAdminSchema = empresaIdParamsSchema.merge(setEmpresaStatusBodySchema);