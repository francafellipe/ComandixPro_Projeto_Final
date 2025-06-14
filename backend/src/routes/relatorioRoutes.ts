// src/routes/relatorioRoutes.ts
import { Router } from 'express';
import RelatorioController from '../controllers/relatorioController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';
import { UserRole } from '../models/usuario.schema';
import { validate } from '../middlewares/validationMiddleware';
import { getRelatorioVendasQuerySchema } from '../validators/relatorio.validator'; // Schema para query params

const router = Router();

// Aplicar middlewares comuns a todas as rotas de relatório aqui
router.use(authMiddleware, empresaCheckMiddleware);

// GET /api/relatorios/vendas?dataInicio=YYYY-MM-DD&dataFim=YYYY-MM-DD
// Apenas ADMIN_EMPRESA pode acessar relatórios da sua empresa
router.get(
    '/vendas',
    roleCheckMiddleware([UserRole.ADMIN_EMPRESA]), // Adicionar UserRole.CAIXA se necessário
    validate(getRelatorioVendasQuerySchema), // Valida req.query para dataInicio e dataFim
    RelatorioController.getRelatorioVendas
);

// --- Placeholders para futuras rotas de relatórios ---
// GET /api/relatorios/produtos (ex: produtos mais vendidos)
// GET /api/relatorios/usuarios (ex: desempenho de garçons)

export default router;