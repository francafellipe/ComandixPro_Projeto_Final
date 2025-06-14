// src/middlewares/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError }from 'zod';
import AppError from '../utils/appError'; // Nosso erro customizado

/**
 * Middleware genérico para validar partes da requisição (body, params, query)
 * usando um schema Zod fornecido.
 * @param schema - Um schema Zod que pode conter chaves 'body', 'params', ou 'query'.
 */
export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Prepara o objeto a ser validado, pegando as partes relevantes da requisição
      // que estão definidas no schema.
      const toValidate: { body?: any, params?: any, query?: any } = {};
      if (schema.shape.body) {
        toValidate.body = req.body;
      }
      if (schema.shape.params) {
        toValidate.params = req.params;
      }
      if (schema.shape.query) {
        toValidate.query = req.query;
      }
      
      // Realiza a validação (parseAsync para suportar validações assíncronas no Zod, se houver)
      const parsed = await schema.parseAsync(toValidate);

      // Se a validação for bem-sucedida, substitui as partes da requisição
      // com os dados parseados e tipados pelo Zod.
      if (parsed.body) {
        req.body = parsed.body;
      }
      if (parsed.params) {
        req.params = parsed.params;
      }
      if (parsed.query) {
        req.query = parsed.query;
      }

      return next(); // Prossegue para o próximo middleware ou controller
    } catch (error : any) {
      if (error instanceof ZodError) {
        // Formata os erros do Zod para uma resposta mais amigável
        const errorMessages = error.errors.map(err => ({
          campo: err.path.join('.').replace(/^body\.|^params\.|^query\./, ''), // Remove prefixo como 'body.'
          mensagem: err.message,
        }));
        // Para o AppError, vamos enviar uma mensagem principal e talvez os detalhes no log.
        // Nosso AppError atual só aceita (message, statusCode).
        // Poderíamos modificar AppError para aceitar 'details' ou serializar errorMessages na mensagem.
        // Por ora, uma mensagem mais genérica ou a primeira mensagem de erro.
        const primeiraMensagemErro = errorMessages[0] 
          ? `${errorMessages[0].campo || 'Campo'}: ${errorMessages[0].mensagem}` 
          : 'Dados inválidos.';
        
        // Logar todos os erros de validação para o desenvolvedor
        console.error("Erros de Validação Zod:", JSON.stringify(errorMessages, null, 2));

        return next(new AppError(`Erro de validação: ${primeiraMensagemErro}`, 400));
      }
      // Outros erros inesperados durante a validação
      console.error("Erro inesperado no validationMiddleware:", error);
      return next(new AppError('Erro interno ao processar a validação da requisição.', 500));
    }
  };