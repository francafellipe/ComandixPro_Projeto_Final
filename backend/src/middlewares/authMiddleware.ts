// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError';
import { UserRole } from '../models/usuario.schema';
import jwtConfig from '../config/jwt.config';



interface JwtPayload {
  userId: number;
  empresaId: number | null;
  role: UserRole;
  iat: number;
  exp: number;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Usuário autenticado:", req.user);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new AppError('Token de autenticação não fornecido.', 401));
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(new AppError('Token mal formatado. Formato esperado: "Bearer <token>".', 401));
    }

    const token = parts[1];

    if (!jwtConfig.secret) {
      console.error('ERRO CRÍTICO NO AUTH MIDDLEWARE: JWT_SECRET não carregado.');
      return next(new AppError('Erro interno na configuração de autenticação.', 500));
    }

    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

    console.log("Payload decodificado:", decoded);

    if (!decoded || typeof decoded.userId !== 'number' || typeof decoded.role !== 'string') {
        return next(new AppError('Payload do token inválido.', 401));
    }

    req.user = {
      id: decoded.userId,
      empresaId: decoded.empresaId ?? undefined,
      role: decoded.role as UserRole, // Garantindo que o role seja do tipo UserRole
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError(`Token inválido: ${error.message}`, 401));
    }
    console.error("Erro no authMiddleware:", error);
    return next(new AppError('Falha na autenticação. Por favor, tente novamente.', 401));
  }
};