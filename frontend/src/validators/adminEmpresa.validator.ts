// src/validators/adminEmpresa.validator.ts
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

// Schema para os dados da empresa ao criar ou editar
const empresaDataSchema = z.object({
    nome: z.string({ required_error: "Nome da empresa é obrigatório." })
        .min(2, { message: "Nome da empresa deve ter pelo menos 2 caracteres." })
        .max(100),
    emailContato: z.string({ required_error: "Email de contato da empresa é obrigatório." })
        .email({ message: "Formato de email de contato da empresa inválido." }),
    licencaValidaAte: z.string({ required_error: "Data de validade da licença é obrigatória." })
        .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido para licença. Use YYYY-MM-DD." }),
    cnpj: z.string({ invalid_type_error: "CNPJ deve ser uma string." })
        .length(14, { message: "CNPJ deve ter 14 dígitos (apenas números)." })
        .regex(/^\d{14}$/, { message: "CNPJ deve conter apenas números." })
        .optional()
        .nullable(),
    ativa: z.boolean({ invalid_type_error: "O campo 'ativa' deve ser um booleano." })
        .optional(),
});

// Schema principal para o formulário do frontend, usado para criar e editar
export const createEmpresaComAdminSchema = z.object({
    body: z.object({
        empresaData: empresaDataSchema,
        adminUserData: adminUserSchema.optional(), // Admin é opcional para permitir edição
    }),
});

// Schema para validar parâmetros de ID nas rotas
export const empresaIdParamsSchema = z.object({
    params: z.object({
        id: z.string()
            .refine((val) => /^\d+$/.test(val), { message: "ID da empresa deve ser um número inteiro positivo." })
            .transform((val) => parseInt(val, 10)),
    }),
});

// Schema para validar o corpo da requisição de atualização (PUT)
export const updateEmpresaBodySchema = z.object({
    body: z.object({
        nome: z.string().min(2).max(100).optional(),
        emailContato: z.string().email().optional(),
        licencaValidaAte: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de data inválido. Use YYYY-MM-DD." })
            .transform((dateStr, ctx) => {
                const date = new Date(dateStr + "T00:00:00");
                if (isNaN(date.getTime())) {
                    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de validade da licença inválida." });
                    return z.NEVER;
                }
                return date;
            })
            .optional(),
        cnpj: z.string().length(14).regex(/^\d{14}$/).nullable().optional(),
        ativa: z.boolean().optional(),
    }).refine(data => Object.keys(data).length > 0, {
        message: "Pelo menos um campo deve ser fornecido para atualização.",
    }),
});

// Schema combinado para a rota de atualização
export const updateEmpresaAdminSchema = empresaIdParamsSchema.merge(updateEmpresaBodySchema);

// Schema para validar o corpo da requisição de mudança de status (PATCH)
export const setEmpresaStatusBodySchema = z.object({
    body: z.object({
        ativa: z.boolean({
            required_error: "O campo 'ativa' é obrigatório.",
            invalid_type_error: "O campo 'ativa' deve ser um booleano (true/false)."
        }),
    }),
});

// Schema combinado para a rota de mudança de status
export const setEmpresaStatusAdminSchema = empresaIdParamsSchema.merge(setEmpresaStatusBodySchema);