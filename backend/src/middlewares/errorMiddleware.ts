// src/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  console.error("ERRO CAPTURADO:", err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Para erros não esperados
  return res.status(500).json({
    status: 'error',
    message: 'Algo deu muito errado no servidor!',
  });
};