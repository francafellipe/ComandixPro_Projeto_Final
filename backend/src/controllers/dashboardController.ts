
import { Request, Response } from 'express';
import DashboardService from '../services/dashboardService';
import { asyncHandler } from '../utils/asyncHandler';

class DashboardController {
    public static getDashboard = asyncHandler(async (req: Request, res: Response) => {
        const empresaId = req.user?.empresaId;
        
        if (!empresaId) {
            return res.status(400).json({
                status: 'error',
                message: 'Empresa ID não encontrado'
            });
        }

        const dashboardData = await DashboardService.getDashboard(empresaId);

        res.status(200).json({
            status: 'success',
            data: dashboardData
        });
    });
}

export default DashboardController;
