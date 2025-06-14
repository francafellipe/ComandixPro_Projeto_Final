import { Request, Response, NextFunction } from 'express';
import SyncService from '../services/syncService';

class SyncController {
  /**
   * Obtém o status da sincronização.
   */
  public static async getSyncStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await SyncService.getSyncStatus(req.user?.empresaId);
      res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Força o início de um processo de sincronização.
   */
  public static async forceSync(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SyncService.forceSync(req.user?.empresaId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export default SyncController;
