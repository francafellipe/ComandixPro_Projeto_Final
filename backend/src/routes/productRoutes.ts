// src/routes/productRoutes.ts
import { Router } from 'express';
import ProductController from '../controllers/productController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';
import { UserRole } from '../models/usuario.schema'; // Para especificar os papéis permitidos
import { validate } from '../middlewares/validationMiddleware';
import { 
    createProductSchema,
    updateProductSchema,
    productIdParamsSchema

} from '../validators/product.validator'; // Importa o schema de validação

const router = Router();
// POST /api/produtos - Criar um novo produto
router.post(
    '/',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]),
    validate(createProductSchema), // 👈 VALIDAÇÃO APLICADA
    ProductController.create
);

// GET /api/produtos - Listar todos os produtos da empresa do usuário logado
// Não há validação Zod específica para o corpo/parâmetros aqui por enquanto,
// a menos que adicionemos query params para filtros/paginação.
router.get(
    '/',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA, UserRole.GARCOM]),
    ProductController.listByEmpresa
);

// GET /api/produtos/:id - Obter um produto específico pelo ID
router.get(
    '/:id',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA, UserRole.CAIXA, UserRole.GARCOM]),
    validate(productIdParamsSchema), // 👈 VALIDAÇÃO APLICADA para o parâmetro :id
    ProductController.getById
);

// PUT /api/produtos/:id - Atualizar um produto existente
router.put(
    '/:id',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]),
    validate(updateProductSchema), // 👈 VALIDAÇÃO APLICADA para :id e corpo
    ProductController.update
);

// DELETE /api/produtos/:id - Deletar um produto
router.delete(
    '/:id',
    authMiddleware,
    empresaCheckMiddleware,
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]),
    validate(productIdParamsSchema), // 👈 VALIDAÇÃO APLICADA para o parâmetro :id
    ProductController.delete
);

export default router;