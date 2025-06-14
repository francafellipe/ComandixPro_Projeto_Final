// src/middlewares/roleCheckMiddleware.ts
import { Request ,Response, NextFunction } from 'express';// Importa a interface com req.user
import { UserRole } from '../models/usuario.schema'; // Importa o enum UserRole
import AppError from '../utils/appError'; // Assumindo que AppError está em src/utils/appError.ts

export const roleCheckMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Autenticação falhou ou papel do usuário não definido.', 401));
    }

    const userRole = req.user.role;
    console.log('user role:', req.user.role);


    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return next(new AppError('Acesso negado. Você não tem permissão para este recurso.', 403));
    }
  };
};