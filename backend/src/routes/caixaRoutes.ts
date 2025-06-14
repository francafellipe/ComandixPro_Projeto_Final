import { Router } from 'express';
import CaixaController from '../controllers/caixaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';
import { UserRole } from '../models/usuario.schema';
import { validate } from '../middlewares/validationMiddleware';
import {
    abrirCaixaSchema,
    registrarMovimentacaoSchema,
    fecharCaixaSchema,
    getCaixaRelatorioSchema
} from '../validators/caixa.validators';
import { asyncHandler } from '../types/helper';
import { AuthenticatedRequest } from '../types';

const router = Router();
// POST /api/caixa/abrir - Abrir um novo caixa
router.post(
    '/abrir',
    authMiddleware,         // 1. Autentica o usuário
    empresaCheckMiddleware, // 2. Verifica o status da empresa (licença, ativa)
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA]), // 3. Verifica o papel do usuário
    validate(abrirCaixaSchema), // 4. VALIDA o corpo da requisição ANTES de chegar no controller
    asyncHandler<AuthenticatedRequest>(CaixaController.abrirCaixa) // 5. Executa a lógica do controller
);

// GET /api/caixa/status - Obter o status do caixa atual
router.get(
    '/status',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA]),
    CaixaController.getStatusCaixaAtual
);

// POST /api/caixa/movimentacoes - Registrar uma nova movimentação
// Precisaremos de um schema Zod para esta rota também (ex: registrarMovimentacaoSchema)
router.post(
    '/movimentacoes',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA]),
    validate(registrarMovimentacaoSchema), // Adicionar quando o schema for criado
    asyncHandler<AuthenticatedRequest>(CaixaController.registrarMovimentacao)
);

// POST /api/caixa/fechar - Fechar o caixa atual
// Precisaremos de um schema Zod para esta rota também (ex: fecharCaixaSchema)
router.post(
    '/fechar',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA]),
    validate(fecharCaixaSchema),
    asyncHandler<AuthenticatedRequest>(CaixaController.fecharCaixa)
);

// Detalhes para fechamento de caixa
router.get(
    '/detalhes-fechamento',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA, UserRole.ADMIN_GLOBAL]),
    CaixaController.getDetalhesFechamento
);

// Relatório específico de um caixa
router.get(
    '/relatorio/:caixaId',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA, UserRole.ADMIN_GLOBAL]),
    validate(getCaixaRelatorioSchema),
    CaixaController.getRelatorioCaixa
);

export default router;