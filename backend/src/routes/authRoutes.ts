// src/routes/authRoutes.ts
import { Router } from 'express';
import { login as loginController } from "../controllers/authController"; 
import { validate } from '../middlewares/validationMiddleware';
import { loginSchema } from '../validators/auth.validator'; 

const router = Router();

// POST /api/auth/login
router.post(
    '/login',
    validate(loginSchema), 
    loginController
);
export default router;