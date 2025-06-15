// src/routes/comandaRoutes.ts (VERSÃO CORRIGIDA)

import { Router, Request, Response, NextFunction } from 'express';
import ComandaController from '../controllers/comandaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';
import { UserRole } from '../models/usuario.schema';
import { validate } from '../middlewares/validationMiddleware';
import {
    criarComandaSchema,
    adicionarItemComandaSchema,
    listarComandasQuerySchema,
    comandaIdParamsSchema,
    removerItemComandaParamsSchema,
    processarPagamentoComandaSchema,
} from '../validators/comanda.validator';
import { AuthenticatedRequest } from '../types';

// Wrapper específico para rotas que usam AuthenticatedRequest
const asyncAuthHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await fn(req as AuthenticatedRequest, res, next);
        } catch (error) {
            next(error);
        }
    };
};
const router = Router();

const allowedRolesComanda = [UserRole.GARCOM, UserRole.CAIXA, UserRole.ADMIN_EMPRESA];

// Aplicar authMiddleware e empresaCheckMiddleware globalmente para este router de comandas
router.use(authMiddleware, empresaCheckMiddleware);

// POST /api/comandas - Criar uma nova comanda (Este já estava correto)
router.post(
    '/',
    roleCheckMiddleware(allowedRolesComanda),
    validate(criarComandaSchema),
    asyncAuthHandler(ComandaController.criarComanda)
);

// POST /api/comandas/:comandaId/itens - Adicionar um item
router.post(
    '/:comandaId/itens',
    roleCheckMiddleware(allowedRolesComanda),
    validate(adicionarItemComandaSchema),
    asyncAuthHandler(ComandaController.adicionarItemComanda) // <-- CORRIGIDO
);

// GET /api/comandas - Listar comandas
router.get(
    '/',
    roleCheckMiddleware(allowedRolesComanda),
    validate(listarComandasQuerySchema),
    asyncAuthHandler(ComandaController.listarComandas) // <-- CORRIGIDO
);

// GET /api/comandas/:comandaId - Visualizar uma comanda específica
router.get(
    '/:comandaId',
    roleCheckMiddleware(allowedRolesComanda),
    validate(comandaIdParamsSchema),
    asyncAuthHandler(ComandaController.visualizarComanda) // <-- CORRIGIDO
);

// DELETE /api/comandas/:comandaId/itens/:itemComandaId - Remover um item de uma comanda
router.delete(
    '/:comandaId/itens/:itemComandaId',
    roleCheckMiddleware(allowedRolesComanda),
    validate(removerItemComandaParamsSchema),
    asyncAuthHandler(ComandaController.removerItemComanda)
);
// Adicione esta rota (pode ser antes ou depois da rota DELETE)
router.put(
    '/:comandaId/itens/:itemComandaId',
    // ... middlewares de auth e role
    // Adicionar validação com Zod/Joi aqui seria o ideal
    asyncAuthHandler(ComandaController.atualizarItemComanda)
);

// PUT /api/comandas/:comandaId/cancelar - Cancelar uma comanda
router.put(
    '/:comandaId/cancelar',
    roleCheckMiddleware(allowedRolesComanda),
    validate(comandaIdParamsSchema),
    asyncAuthHandler(ComandaController.cancelarComanda) // <-- CORRIGIDO
);

// PUT /api/comandas/:comandaId/pagar - Processar o pagamento de uma comanda (Este já estava correto)
router.put(
    '/:comandaId/pagar',
    roleCheckMiddleware([UserRole.CAIXA, UserRole.ADMIN_EMPRESA]),
    validate(processarPagamentoComandaSchema),
    asyncAuthHandler(ComandaController.processarPagamentoComanda)
);

export default router;