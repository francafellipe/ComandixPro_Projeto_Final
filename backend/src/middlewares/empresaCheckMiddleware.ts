import { Request, Response, NextFunction } from 'express';
import Empresa from '../models/empresa.schema';
import AppError from '../utils/appError';
import { UserRole } from '../models/usuario.schema';

export const empresaCheckMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Usuário não autenticado.', 401));
    }

    if (req.user.role === UserRole.ADMIN_GLOBAL) {
      return next(); // ADMIN_GLOBAL bypassa esta verificação
    }

    if (req.user.empresaId === undefined || req.user.empresaId === null) {
      return next(new AppError('Usuário não está associado a uma empresa.', 403));
    }

    const empresaId = req.user.empresaId;
    const empresa = await Empresa.findByPk(empresaId);

    if (!empresa) {
      return next(new AppError(`Empresa com ID ${empresaId} não encontrada.`, 404));
    }

    if (!empresa.ativa) {
      return next(new AppError(`A empresa '${empresa.nome}' está atualmente inativa. Operação não permitida.`, 403));
    }

    const hoje = new Date();
    const licencaValidaAte = new Date(empresa.licencaValidaAte);
    licencaValidaAte.setHours(23, 59, 59, 999);

    if (licencaValidaAte < hoje) {
      return next(new AppError(
        `A licença da empresa '${empresa.nome}' expirou em ${empresa.licencaValidaAte.toLocaleDateString('pt-BR')}. Operação não permitida.`,
        403
      ));
    }

    // Opcional: deixar isso ativo se quiser usar a empresa posteriormente no controller
    req.empresaVerificada = empresa;

    next();

  } catch (error: any) {
    if (!(error instanceof AppError)) {
      console.error("Erro inesperado no empresaCheckMiddleware:", error);
    }
    return next(error instanceof AppError ? error : new AppError('Erro ao verificar status da empresa.', 500));
  }
};
