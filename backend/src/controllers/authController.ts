// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express'; 
import AuthService from '../services/authService'; 


export const login = async (req: Request, res: Response, next: NextFunction) => { 
  
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios!' });
  }

  try {
    const result = await AuthService.login(email, senha);
    res.status(200).json(result);
  } catch (error) {
    next(error); 
  }
};