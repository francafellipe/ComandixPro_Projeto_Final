// src/routes/syncRoutes.ts
import { Router } from 'express';
import SyncController from '../controllers/syncController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';
import { UserRole } from '../models/usuario.schema';

const router = Router();

// Middlewares que podem ser aplicados a todas as rotas de sync
// A sincronização pode ser uma operação sensível, então protegê-la bem é importante.
// Vamos assumir que apenas ADMIN_EMPRESA ou ADMIN_GLOBAL podem ver status e forçar.
const allowedSyncRoles = [UserRole.ADMIN_EMPRESA, UserRole.ADMIN_GLOBAL];

router.use(authMiddleware); // Todas as rotas de sync requerem autenticação

// GET /api/sync/status - Obter status da sincronização
router.get(
    '/status',
    // empresaCheckMiddleware, // Aplicar se o status da sync depender da empresa estar ativa/licenciada
    roleCheckMiddleware(allowedSyncRoles),
    SyncController.getSyncStatus
);

// POST /api/sync/force - Forçar uma nova sincronização
router.post(
    '/force',
    // empresaCheckMiddleware, // Aplicar se a sync depender da empresa estar ativa/licenciada
    roleCheckMiddleware(allowedSyncRoles),
    SyncController.forceSync
);

export default router;