
// src/routes/categoriaRoutes.ts
import { Router } from 'express';
import CategoriaController from '../controllers/categoriaController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';
import { UserRole } from '../models/usuario.schema';

const router = Router();

// POST /api/categorias - Criar uma nova categoria
router.post(
    '/',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]),
    CategoriaController.create
);

// GET /api/categorias - Listar todas as categorias da empresa do usuário logado
router.get(
    '/',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA, UserRole.GARCOM]),
    CategoriaController.listByEmpresa
);

// GET /api/categorias/:id - Obter uma categoria específica pelo ID
router.get(
    '/:id',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA, UserRole.GARCOM]),
    CategoriaController.getById
);

// PUT /api/categorias/:id - Atualizar uma categoria existente
router.put(
    '/:id',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]),
    CategoriaController.update
);

// DELETE /api/categorias/:id - Deletar uma categoria
router.delete(
    '/:id',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]),
    CategoriaController.delete
);

export default router;
