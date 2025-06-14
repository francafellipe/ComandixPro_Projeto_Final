// src/services/authService.ts
import Usuario, { UserRole } from '../models/usuario.schema'; // 1. IMPORTADO O UserRole AQUI
import Empresa from '../models/empresa.schema';
import jwt, { Secret } from 'jsonwebtoken';
import { comparePassword } from '../utils/hash.utils';
import AppError from '../utils/appError';
import jwtConfig from '../config/jwt.config';

class AuthService {
  public static async login(email: string, senhaInput: string) {
    const usuario = await Usuario.findOne({
      where: { email: email },
      include: [{ model: Empresa, as: 'empresa' }]
    });

    if (!usuario) {
      throw new AppError('Credenciais inválidas.', 401);
    }
    if (!usuario.ativo) {
      throw new AppError('Este usuário está inativo.', 403);
    }

    // 2. CORREÇÃO APLICADA AQUI na comparação
    if (usuario.role !== UserRole.ADMIN_GLOBAL) {
      if (usuario.empresaId && usuario.empresa) {
        if (!usuario.empresa.ativa) {
          throw new AppError('A empresa associada a este usuário está inativa.', 403);
        }
        const hoje = new Date();
        const licencaValidaAte = new Date(usuario.empresa.licencaValidaAte);
        licencaValidaAte.setHours(23, 59, 59, 999);
        if (licencaValidaAte < hoje) {
          throw new AppError('A licença da empresa associada a este usuário expirou.', 403);
        }
      } else if (usuario.empresaId && !usuario.empresa) {
        throw new AppError('Erro de consistência de dados: empresa não encontrada.', 500);
      } else {
        throw new AppError('Usuário não está associado a nenhuma empresa.', 403);
      }
    }

    const senhaCorreta = await comparePassword(senhaInput, usuario.senha);
    if (!senhaCorreta) {
      throw new AppError('Credenciais inválidas.', 401);
    }

    // Geração do Payload e do Token
    const payload = {
      userId: usuario.id,
      email: usuario.email,
      role: usuario.role,
      empresaId: usuario.empresaId || null,
    };
    const secretKey: Secret = jwtConfig.secret;
    const signOptions = { expiresIn: Number(jwtConfig.expiresIn) };

    if (!secretKey) {
      throw new AppError('Erro interno: JWT_SECRET não configurado.', 500);
    }

    const token = jwt.sign(payload, secretKey, signOptions);
    
    return {
      message: 'Login realizado com sucesso!',
      token: token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        empresaId: usuario.empresaId,
      }
    };
  }
}

export default AuthService;