// src/controllers/userController.ts
import {Request, Response, NextFunction } from 'express';
import UserService, { CreateUserInEmpresaDTO, UpdateUserInEmpresaDTO } from '../services/userService';
;
import AppError from '../utils/appError';
import { UserRole } from '../models/usuario.schema';
import { AuthenticatedRequest } from '../types';

interface SetUserStatusBody {
    ativo: boolean;
}

class UserController {

    private static getTargetEmpresaId(req: Request): number {
        const { role, empresaId } = req.user!;

        if (role === UserRole.ADMIN_GLOBAL) {
            const empresaIdFromQuery = req.query.empresaId || req.body.empresaId;
            if (!empresaIdFromQuery) {
                throw new AppError('Admin Global deve especificar um empresaId para esta operação.', 400);
            }
            return Number(empresaIdFromQuery);
        }
        
        if (empresaId === null || empresaId === undefined) {
            throw new AppError('Usuário de empresa não possui um empresaId associado.', 403);
        }
        return empresaId;
    }

    public static async createUserInEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empresaId = UserController.getTargetEmpresaId(req);
            const userData: CreateUserInEmpresaDTO = req.body;

            const novoUsuario = await UserService.createUserInEmpresa(empresaId, userData);

            res.status(201).json({
                message: 'Usuário criado com sucesso!',
                usuario: novoUsuario,
            });
        } catch (error) {
            next(error);
        }
    }

    public static async listUsersInEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empresaId = UserController.getTargetEmpresaId(req);
            const usuarios = await UserService.listUsersByEmpresa(empresaId);
            res.status(200).json(usuarios);
        } catch (error) {
            next(error);
        }
    }

    public static async getUserDetailsInEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empresaId = UserController.getTargetEmpresaId(req);
            const userIdToGet = parseInt(req.params.id, 10);
            const usuario = await UserService.getUserInEmpresaById(userIdToGet, empresaId);

            if (!usuario) {
                throw new AppError('Usuário não encontrado nesta empresa ou ID inválido.', 404);
            }
            res.status(200).json(usuario);
        } catch (error) {
            next(error);
        }
    }

    public static async updateUserInEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const empresaId = UserController.getTargetEmpresaId(req);
            const userIdToUpdate = parseInt(req.params.id, 10);
            const updateData: UpdateUserInEmpresaDTO = req.body;

            const usuarioAtualizado = await UserService.updateUserInEmpresa(userIdToUpdate, empresaId, updateData);
            res.status(200).json(usuarioAtualizado);
        } catch (error) {
            next(error);
        }
    }

    public static async setUserStatusInEmpresa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const empresaId = UserController.getTargetEmpresaId(req);
            const userIdToSetStatus = parseInt(req.params.id, 10);
            const { ativo } = req.body as { ativo: boolean };

            if (req.user!.userId === userIdToSetStatus) {
                throw new AppError('Um administrador não pode alterar o próprio status de ativação.', 403);
            }

            const usuarioAtualizado = await UserService.setUserStatusInEmpresa(userIdToSetStatus, empresaId, ativo);
            res.status(200).json({
                message: `Status do usuário ${usuarioAtualizado.nome} atualizado para ${usuarioAtualizado.ativo ? 'ativo' : 'inativo'}.`,
                usuario: usuarioAtualizado,
            });
        } catch (error) {
            next(error);
        }
    }

    public static async softDeleteUserInEmpresa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const empresaId = UserController.getTargetEmpresaId(req);
            const performingAdminUserId = req.user!.userId;
            const userIdToDelete = parseInt(req.params.id, 10);

            if (performingAdminUserId === undefined) {
                throw new AppError('Usuário autenticado sem userId válido.', 403);
              }

            await UserService.softDeleteUserInEmpresa(userIdToDelete, empresaId, performingAdminUserId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default UserController;