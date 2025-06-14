// src/routes/comandaRoutes.ts
import { Router } from 'express';
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
import { asyncHandler } from '../types/helper';
import { AuthenticatedRequest } from '../types';
const router = Router();

const allowedRolesComanda = [UserRole.GARCOM, UserRole.CAIXA, UserRole.ADMIN_EMPRESA];

// Aplicar authMiddleware e empresaCheckMiddleware globalmente para este router de comandas
router.use(authMiddleware, empresaCheckMiddleware);

// POST /api/comandas - Criar uma nova comanda
router.post(
    '/',
    roleCheckMiddleware(allowedRolesComanda),
    validate(criarComandaSchema), // Valida o corpo
    asyncHandler<AuthenticatedRequest>(ComandaController.criarComanda)
);

// POST /api/comandas/:comandaId/itens - Adicionar um item
router.post(
    '/:comandaId/itens', // comandaId será validado por adicionarItemComandaSchema
    roleCheckMiddleware(allowedRolesComanda),
    validate(adicionarItemComandaSchema), // Valida params.comandaId e o corpo
    ComandaController.adicionarItemComanda
);

// GET /api/comandas - Listar comandas
router.get(
    '/',
    roleCheckMiddleware(allowedRolesComanda),
    validate(listarComandasQuerySchema), // Valida req.query
    ComandaController.listarComandas
);

// GET /api/comandas/:comandaId - Visualizar uma comanda específica
router.get(
    '/:comandaId',
    roleCheckMiddleware(allowedRolesComanda),
    validate(comandaIdParamsSchema), // Valida req.params.comandaId
    ComandaController.visualizarComanda
);

// DELETE /api/comandas/:comandaId/itens/:itemComandaId - Remover um item de uma comanda
router.delete(
    '/:comandaId/itens/:itemComandaId', // comandaId e itemComandaId validados por removerItemComandaParamsSchema
    roleCheckMiddleware(allowedRolesComanda),
    validate(removerItemComandaParamsSchema), // Valida req.params.comandaId e req.params.itemComandaId
    ComandaController.removerItemComanda
);

// PUT /api/comandas/:comandaId/cancelar - Cancelar uma comanda
router.put(
    '/:comandaId/cancelar',
    roleCheckMiddleware(allowedRolesComanda),
    validate(comandaIdParamsSchema), // Valida req.params.comandaId (não há corpo para esta rota)
    ComandaController.cancelarComanda
);

// PUT /api/comandas/:comandaId/pagar - Processar o pagamento de uma comanda
router.put(
    '/:comandaId/pagar', // comandaId será validado por processarPagamentoComandaSchema
    roleCheckMiddleware([UserRole.CAIXA, UserRole.ADMIN_EMPRESA]), // Apenas Caixa ou Admin podem processar pagamentos
    validate(processarPagamentoComandaSchema), // Valida req.params.comandaId e o corpo
    asyncHandler<AuthenticatedRequest>(ComandaController.processarPagamentoComanda)
);



export default router;