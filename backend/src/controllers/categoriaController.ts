import { Request, Response, NextFunction } from 'express';
import CategoriaService from '../services/categoriaService';
import { CategoriaCreationAttributes } from '../models/categoria.schema'; 
import AppError from '../utils/appError'; 

class CategoriaController {
  /**
   * Cria uma nova categoria.
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }

      const empresaId = req.user.empresaId;
      const categoriaData: Omit<CategoriaCreationAttributes, 'empresaId'> = req.body;

      if (!categoriaData.nome) {
        throw new AppError('Nome da categoria é obrigatório.', 400);
      }

      const newCategoria = await CategoriaService.createCategoria(empresaId, categoriaData);
      res.status(201).json(newCategoria);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todas as categorias da empresa do usuário logado.
   */
  public static async listByEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }

      const empresaId = req.user.empresaId;
      const categorias = await CategoriaService.listCategoriasByEmpresa(empresaId);
      res.status(200).json(categorias);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém uma categoria específica pelo ID.
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }

      const empresaId = req.user.empresaId;
      const categoriaId = parseInt(req.params.id, 10);

      if (isNaN(categoriaId)) {
        throw new AppError('ID da categoria inválido.', 400);
      }

      const categoria = await CategoriaService.getCategoriaByIdAndEmpresa(categoriaId, empresaId);
      if (!categoria) {
        throw new AppError('Categoria não encontrada ou não pertence a esta empresa.', 404);
      }

      res.status(200).json(categoria);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma categoria existente.
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }

      const empresaId = req.user.empresaId;
      const categoriaId = parseInt(req.params.id, 10);

      if (isNaN(categoriaId)) {
        throw new AppError('ID da categoria inválido.', 400);
      }

      const updateData = req.body;
      const updatedCategoria = await CategoriaService.updateCategoria(categoriaId, empresaId, updateData);
      res.status(200).json(updatedCategoria);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deleta uma categoria.
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }

      const empresaId = req.user.empresaId;
      const categoriaId = parseInt(req.params.id, 10);

      if (isNaN(categoriaId)) {
        throw new AppError('ID da categoria inválido.', 400);
      }

      await CategoriaService.deleteCategoria(categoriaId, empresaId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default CategoriaController;
