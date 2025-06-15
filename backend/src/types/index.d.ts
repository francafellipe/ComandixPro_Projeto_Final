// src/types/express/index.d.ts
import { Request } from 'express';
import { UserRole } from '../../models/usuario.schema';

export interface AuthenticatedUser {
    id: number; // ID do usuário
    role: UserRole;
    empresaId?: number; // Pode ser undefined se for ADMIN_GLOBAL
    userId: number;    // userId sempre igual ao id
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: number;
            empresaId?: number;
            role: UserRole;
            userId: number;
        }
    }
}