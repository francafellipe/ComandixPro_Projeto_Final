// src/routes/adminEmpresaRoutes.ts
import { Router } from 'express';
import AdminEmpresaController from '../controllers/adminEmpresaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { UserRole } from '../models/usuario.schema'; // Para especificar o papel ADMIN_GLOBAL
import { validate } from '../middlewares/validationMiddleware';
import {
    createEmpresaComAdminSchema,
    empresaIdParamsSchema,
    updateEmpresaAdminSchema,
    setEmpresaStatusAdminSchema
} from '../validators/adminEmpresa.validator';

const router = Router();

// POST /api/admin/empresas - Criar uma nova empresa e seu administrador inicial
router.post(
    '/empresas',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_GLOBAL]),
    validate(createEmpresaComAdminSchema),
    AdminEmpresaController.createEmpresaComAdmin
);

router.get(
    '/empresas',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_GLOBAL]),
    AdminEmpresaController.listEmpresas // Método a ser criado no controller
);

// GET /api/admin/empresas/:id - Obter detalhes de uma empresa específica
router.get(
    '/empresas/:id',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_GLOBAL]),
    validate(empresaIdParamsSchema),
    AdminEmpresaController.getEmpresaDetails // Método a ser criado no controller
);

// PUT /api/admin/empresas/:id - Atualizar dados de uma empresa
router.put(
    '/empresas/:id',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_GLOBAL]),
    validate(updateEmpresaAdminSchema),
    AdminEmpresaController.updateEmpresa // Método a ser criado no controller
);

// PATCH /api/admin/empresas/:id/toggle-status - Ativar/Desativar uma empresa
router.patch(
    '/empresas/:id/status',
    authMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_GLOBAL]),
    validate(setEmpresaStatusAdminSchema),
    AdminEmpresaController.setEmpresaStatus // Método a ser criado no controller
);

export default router;