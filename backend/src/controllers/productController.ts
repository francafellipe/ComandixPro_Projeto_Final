// src/controllers/productController.ts
import { Request, Response, NextFunction } from 'express';
import ProductService from '../services/productService';
import { ProductCreationAttributes } from '../models/product.schema'; 
import AppError from '../utils/appError'; 



class ProductController {
  /**
   * Cria um novo produto.
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) { // Verificação de segurança
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }
      const empresaId = req.user.empresaId;
      // Validação do corpo da requisição (pode ser feita com Zod ou express-validator aqui)
      const productData: Omit<ProductCreationAttributes, 'empresaId' | 'id' | 'disponivel' | 'categoria'> & { categoria?: string, disponivel?: boolean } = req.body;

      if (!productData.nome || productData.preco === undefined) {
          throw new AppError('Nome e preço são obrigatórios para criar um produto.', 400);
      }

      const newProduct = await ProductService.createProduct(empresaId, productData);
      res.status(201).json(newProduct);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todos os produtos da empresa do usuário logado.
   */
  public static async listByEmpresa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }
      const empresaId = req.user.empresaId;
      const products = await ProductService.listProductsByEmpresa(empresaId);
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém um produto específico pelo ID.
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }
      const empresaId = req.user.empresaId;
      const productId = parseInt(req.params.id, 10);

      if (isNaN(productId)) {
        throw new AppError('ID do produto inválido.', 400);
      }

      const product = await ProductService.getProductByIdAndEmpresa(productId, empresaId);
      if (!product) {
        throw new AppError('Produto não encontrado ou não pertence a esta empresa.', 404);
      }
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um produto existente.
   */
  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }
      const empresaId = req.user.empresaId;
      const productId = parseInt(req.params.id, 10);

      if (isNaN(productId)) {
        throw new AppError('ID do produto inválido.', 400);
      }

      const updateData = req.body; // O ProductService já lida com campos undefined

      const updatedProduct = await ProductService.updateProduct(productId, empresaId, updateData);
      res.status(200).json(updatedProduct);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deleta um produto.
   */
  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId === undefined || req.user.empresaId === null) {
        throw new AppError('Informações da empresa não encontradas na autenticação.', 403);
      }
      const empresaId = req.user.empresaId;
      const productId = parseInt(req.params.id, 10);

      if (isNaN(productId)) {
        throw new AppError('ID do produto inválido.', 400);
      }

      await ProductService.deleteProduct(productId, empresaId);
      res.status(204).send(); 
    } catch (error) {
      next(error);
    }
  }
}

export default ProductController;