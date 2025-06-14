// src/routes/userRoutes.ts
import { Router } from 'express';
import UserController from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleCheckMiddleware } from '../middlewares/roleCheckMiddleware';
import { UserRole } from '../models/usuario.schema';
import { validate } from '../middlewares/validationMiddleware';
import { 
    createUserSchema,
    updateUserSchema,
    userIdParamsSchema,
    setUserStatusSchema
} from '../validators/user.validator'
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../types/helper';

const router = Router();
const ROLES_PERMITIDOS = [UserRole.ADMIN_EMPRESA, UserRole.ADMIN_GLOBAL]

router.post(
    '/',
    authMiddleware,
    roleCheckMiddleware(ROLES_PERMITIDOS),
    validate(createUserSchema),
    UserController.createUserInEmpresa
);

router.get(
    '/',
    authMiddleware,
    roleCheckMiddleware(ROLES_PERMITIDOS),
    UserController.listUsersInEmpresa
);

router.get(
    '/:id',
    authMiddleware,
    roleCheckMiddleware(ROLES_PERMITIDOS),
    validate(userIdParamsSchema),
    UserController.getUserDetailsInEmpresa
);

router.put(
    '/:id',
    authMiddleware,
    roleCheckMiddleware(ROLES_PERMITIDOS),
    validate(updateUserSchema), // Corrigido para usar o schema de update
    UserController.updateUserInEmpresa
);

router.patch(
    '/:id/status',
    authMiddleware,
    roleCheckMiddleware(ROLES_PERMITIDOS),
    validate(setUserStatusSchema), // Corrigido para usar o schema de status
    asyncHandler<AuthenticatedRequest>(UserController.setUserStatusInEmpresa)
);

router.delete(
    '/:id',
    authMiddleware,
    roleCheckMiddleware(ROLES_PERMITIDOS),
    validate(userIdParamsSchema), // Corrigido para usar o schema de params
    asyncHandler<AuthenticatedRequest>(UserController.softDeleteUserInEmpresa)
);

export default router;