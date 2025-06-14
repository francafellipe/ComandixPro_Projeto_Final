
import { Router } from 'express';
import DashboardController from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { empresaCheckMiddleware } from '../middlewares/empresaCheckMiddleware';

const router = Router();

router.get(
    '/',
    authMiddleware,
    empresaCheckMiddleware,
    DashboardController.getDashboard
);

export default router;
