// src/controllers/relatorioController.ts
import { Request, Response, NextFunction } from 'express';
import RelatorioService from '../services/relatorioService';
import AppError from '../utils/appError';

interface GetRelatorioVendasQuery {
  dataInicio: string;
  dataFim: string;
}

class RelatorioController {
  public static async getRelatorioVendas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.empresaId) {
        throw new AppError('Informações da empresa do usuário não encontradas.', 403);
      }

      const { dataInicio, dataFim } = req.query as unknown as GetRelatorioVendasQuery;
      const relatorio = await RelatorioService.getRelatorioVendas(req.user.empresaId, dataInicio, dataFim);

      res.status(200).json(relatorio);
    } catch (error) {
      next(error);
    }
  }
}

export default RelatorioController;
