// src/controllers/comandaController.ts
import { Request, Response, NextFunction } from 'express';
import ComandaService, {
    CriarComandaDTO,
    AdicionarItemComandaDTO,
    AtualizarItemComandaDTO,
    ListarComandasFiltrosDTO,
    ProcessarPagamentoDTO
} from '../services/comandaService';
import AppError from '../utils/appError';
import { ComandaStatus, FormaPagamento } from '../models/comanda.schema'; // Importar FormaPagamento
import { AuthenticatedRequest } from '../types';

class ComandaController {
    /**
     * Cria uma nova comanda.
     */
    public static async criarComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null || !req.user.userId) {
                throw new AppError('Informações da empresa ou do usuário não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;
            const usuarioAberturaId = req.user.userId;
            const dadosComanda: CriarComandaDTO = req.body;

            // Validação básica (Zod/express-validator depois)
            // Ex: if (dadosComanda.mesa && typeof dadosComanda.mesa !== 'string') { ... }

            const novaComanda = await ComandaService.criarComanda(empresaId, usuarioAberturaId, dadosComanda);
            res.status(201).json(novaComanda);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Adiciona um item a uma comanda existente.
     */
    public static async adicionarItemComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
                throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;
            const comandaId = parseInt(req.params.comandaId, 10);
            const dadosItem: AdicionarItemComandaDTO = req.body;

            if (isNaN(comandaId)) {
                throw new AppError('ID da comanda inválido.', 400);
            }
            // Validação básica (Zod/express-validator depois)
            if (!dadosItem.produtoId || typeof dadosItem.produtoId !== 'number' || dadosItem.quantidade === undefined || typeof dadosItem.quantidade !== 'number' || dadosItem.quantidade <= 0) {
                throw new AppError('Dados do item inválidos. produtoId (número) e quantidade (número > 0) são obrigatórios.', 400);
            }

            const novoItem = await ComandaService.adicionarItemComanda(empresaId, comandaId, dadosItem);
            res.status(201).json(novoItem);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Visualiza uma comanda específica.
     */
    public static async visualizarComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
                throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;
            const comandaId = parseInt(req.params.comandaId, 10);

            if (isNaN(comandaId)) {
                throw new AppError('ID da comanda inválido.', 400);
            }

            const comanda = await ComandaService.visualizarComanda(empresaId, comandaId);
            if (!comanda) {
                throw new AppError('Comanda não encontrada ou não pertence a esta empresa.', 404);
            }
            res.status(200).json(comanda);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Lista as comandas da empresa, com filtros opcionais via query params.
     * Ex: /api/comandas?status=Aberta&mesa=10
     */
    public static async listarComandas(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
                throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;

            // Extrair e validar filtros da query string
            const filtros: ListarComandasFiltrosDTO = {};
            if (req.query.status && typeof req.query.status === 'string' && Object.values(ComandaStatus).includes(req.query.status as ComandaStatus)) {
                filtros.status = req.query.status as ComandaStatus;
            }
            if (req.query.mesa && typeof req.query.mesa === 'string') {
                filtros.mesa = req.query.mesa;
            }
            // Adicionar filtros de data aqui se necessário, validando o formato YYYY-MM-DD
            if (req.query.dataInicio && typeof req.query.dataInicio === 'string') {
                filtros.dataInicio = req.query.dataInicio;
            }
            if (req.query.dataFim && typeof req.query.dataFim === 'string') {
                filtros.dataFim = req.query.dataFim;
            }

            const { status, mesa, dataInicio, dataFim } = req.query as {
                status?: string;
                mesa?: string;
                dataInicio?: string;
                dataFim?: string;
            };


            const comandas = await ComandaService.listarComandas(empresaId, filtros);
            res.status(200).json(comandas);
        } catch (error) {
            next(error);
        }
    }
    /**
     * Atualiza a quantidade de um item em uma comanda.
     */
    public static async atualizarItemComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined) {
                throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
            }

            const empresaId = req.user.empresaId;
            const comandaId = parseInt(req.params.comandaId, 10);
            const itemComandaId = parseInt(req.params.itemComandaId, 10);
            const { quantidade } = req.body as AtualizarItemComandaDTO;

            if (isNaN(comandaId) || isNaN(itemComandaId)) {
                throw new AppError('ID da comanda ou do item inválido.', 400);
            }

            const comandaAtualizada = await ComandaService.atualizarItemComanda(
                empresaId,
                comandaId,
                itemComandaId,
                { quantidade }
            );

            res.status(200).json({ message: 'Item atualizado com sucesso.', comanda: comandaAtualizada });

        } catch (error) {
            next(error);
        }
    }
    /**
     * Remove um item de uma comanda.
     */
    public static async removerItemComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
                throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;
            const comandaId = parseInt(req.params.comandaId, 10);
            const itemComandaId = parseInt(req.params.itemComandaId, 10);

            if (isNaN(comandaId) || isNaN(itemComandaId)) {
                throw new AppError('ID da comanda ou do item da comanda inválido.', 400);
            }

            const comandaAtualizada = await ComandaService.removerItemComanda(empresaId, comandaId, itemComandaId);
            res.status(200).json({ message: 'Item removido com sucesso.', comanda: comandaAtualizada });
        } catch (error) {
            next(error);
        }
    }
    /**
   * Cancela uma comanda específica.
   */
    public static async cancelarComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
                throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;
            // Opcional: pegar o ID do usuário que está cancelando, se for relevante para o log ou regras de negócio
            // const usuarioId = req.user.userId; 
            const comandaId = parseInt(req.params.comandaId, 10);

            if (isNaN(comandaId)) {
                throw new AppError('ID da comanda inválido.', 400);
            }

            // Não há corpo (body) na requisição para esta operação de cancelamento simples.
            // Se houvesse um campo para "motivo do cancelamento", ele viria do req.body.

            const comandaCancelada = await ComandaService.cancelarComanda(empresaId, comandaId);

            res.status(200).json({
                message: 'Comanda cancelada com sucesso.',
                comanda: comandaCancelada,
            });

        } catch (error) {
            next(error);
        }
    }
    /**
   * Processa o pagamento de uma comanda.
   */
    public static async processarPagamentoComanda(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null || !req.user.userId) {
                throw new AppError('Informações da empresa ou do usuário não encontradas na autenticação.', 403);
            }
            const empresaId = req.user.empresaId;
            const usuarioId = req.user.userId; // Usuário processando o pagamento
            const comandaId = parseInt(req.params.comandaId, 10);

            if (isNaN(comandaId)) {
                throw new AppError('ID da comanda inválido.', 400);
            }

            const { formaPagamento } = req.body as ProcessarPagamentoDTO;

            // Validação básica
            if (!formaPagamento || !Object.values(FormaPagamento).includes(formaPagamento as FormaPagamento)) {
                throw new AppError(`Forma de pagamento inválida ou não fornecida. Valores permitidos: ${Object.values(FormaPagamento).join(', ')}.`, 400);
            }

            const dadosPagamento: ProcessarPagamentoDTO = { formaPagamento };
            const comandaPaga = await ComandaService.processarPagamentoComanda(empresaId, comandaId, usuarioId, dadosPagamento);

            res.status(200).json({
                message: 'Pagamento da comanda processado com sucesso!',
                comanda: comandaPaga,
            });

        } catch (error) {
            next(error);
        }
    }
}

export default ComandaController;