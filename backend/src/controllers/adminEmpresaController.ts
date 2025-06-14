import { Request, Response, NextFunction } from 'express';
import AdminEmpresaService, { CreateEmpresaComAdminDTO, UpdateEmpresaDTO } from '../services/adminEmpresaService';
import AppError from '../utils/appError';

interface SetEmpresaStatusBody {
  ativa: boolean;
}

class AdminEmpresaController {
  public static async createEmpresaComAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { empresaData, adminUserData } = req.body as CreateEmpresaComAdminDTO;

      if (!empresaData || !adminUserData) {
        throw new AppError('Dados da empresa e do usuário administrador são obrigatórios.', 400);
      }
      if (!empresaData.nome || !empresaData.emailContato || !empresaData.licencaValidaAte) {
        throw new AppError('Nome, email de contato e data de validade da licença da empresa são obrigatórios.', 400);
      }
      if (!adminUserData.nome || !adminUserData.email || !adminUserData.senhaPlain) {
        throw new AppError('Nome, email e senha do usuário administrador são obrigatórios.', 400);
      }

      const result = await AdminEmpresaService.createEmpresaComAdmin({ empresaData, adminUserData });

      res.status(201).json({
        message: 'Empresa e administrador inicial criados com sucesso!',
        empresa: result.empresa,
        admin: result.admin,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listEmpresas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresas = await AdminEmpresaService.listEmpresas();
      res.status(200).json(empresas);
    } catch (error) {
      next(error);
    }
  }

  public static async getEmpresaDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = parseInt(req.params.id, 10);
      if (isNaN(empresaId)) {
        throw new AppError('ID da empresa inválido fornecido na rota.', 400);
      }

      const empresa = await AdminEmpresaService.getEmpresaById(empresaId);
      if (!empresa) {
        throw new AppError('Empresa não encontrada com o ID fornecido.', 404);
      }

      res.status(200).json(empresa);
    } catch (error) {
      next(error);
    }
  }

  public static async updateEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = parseInt(req.params.id, 10);
      if (isNaN(empresaId)) {
        throw new AppError('ID da empresa inválido fornecido na rota.', 400);
      }

      const updateData: UpdateEmpresaDTO = req.body;
      if (Object.keys(updateData).length === 0) {
        throw new AppError('Nenhum dado fornecido para atualização.', 400);
      }

      if (updateData.licencaValidaAte && isNaN(new Date(updateData.licencaValidaAte).getTime())) {
        throw new AppError('Formato de data inválido para licencaValidaAte.', 400);
      }
      if (updateData.ativa !== undefined && typeof updateData.ativa !== 'boolean') {
        throw new AppError('O campo "ativa" deve ser um booleano.', 400);
      }

      const empresaAtualizada = await AdminEmpresaService.updateEmpresa(empresaId, updateData);
      res.status(200).json(empresaAtualizada);
    } catch (error) {
      next(error);
    }
  }

  public static async setEmpresaStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empresaId = parseInt(req.params.id, 10);
      if (isNaN(empresaId)) {
        throw new AppError('ID da empresa inválido fornecido na rota.', 400);
      }

      const { ativa } = req.body as SetEmpresaStatusBody;
      if (ativa === undefined || typeof ativa !== 'boolean') {
        throw new AppError('O campo "ativa" (booleano) é obrigatório no corpo da requisição.', 400);
      }

      const empresaAtualizada = await AdminEmpresaService.setEmpresaStatus(empresaId, ativa);

      res.status(200).json({
        message: `Status da empresa ${empresaAtualizada.nome} atualizado para ${empresaAtualizada.ativa ? 'ativa' : 'inativa'}.`,
        empresa: empresaAtualizada,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AdminEmpresaController;
