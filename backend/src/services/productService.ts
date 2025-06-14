// src/services/productService.ts
import Product, { ProductCreationAttributes, ProductAttributes } from '../models/product.schema';
import Empresa from '../models/empresa.schema'; // Para verificar se a empresa existe, se necessário
import AppError from '../utils/appError';

interface ProductUpdateAttributes { // Atributos que podem ser atualizados
    nome?: string;
    preco?: number;
    categoriaId?: number | null;
    disponivel?: boolean;
}

class ProductService {
    public static async createProduct(
        empresaId: number,
        productData: Omit<ProductCreationAttributes, 'empresaId'>
    ): Promise<Product> {
        const empresaExists = await Empresa.findByPk(empresaId);
        if (!empresaExists) {
            throw new AppError('Empresa não encontrada para associar o produto.', 404);
        }

        // Criar um objeto explicitamente tipado para Product.create
        const creationData: ProductCreationAttributes = {
            ...productData, // productData deve conter nome, preco (obrigatórios) e outros opcionais
            empresaId: empresaId, // Adicionamos o empresaId
        };

        // Os campos opcionais em ProductCreationAttributes que não estiverem em productData
        // (como 'disponivel' ou 'categoria' se não forem passados) usarão seus defaults
        // ou serão null se allowNull:true e não tiverem default.
        // 'id' será gerado pelo banco.

        const newProduct = await Product.create(creationData);
        return newProduct;
    }

    // ... restante dos métodos do ProductService ...
    // (listProductsByEmpresa, getProductByIdAndEmpresa, updateProduct, deleteProduct)
    // O método updateProduct já usa uma abordagem segura para lidar com undefined.

    public static async listProductsByEmpresa(empresaId: number): Promise<Product[]> {
        const products = await Product.findAll({
            where: { empresaId: empresaId },
        });
        return products;
    }

    public static async getProductByIdAndEmpresa(id: number, empresaId: number): Promise<Product | null> {
        const product = await Product.findOne({
            where: { id: id, empresaId: empresaId },
        });
        return product;
    }

    public static async updateProduct(
        id: number,
        empresaId: number,
        updateData: ProductUpdateAttributes
    ): Promise<Product> {
        const product = await ProductService.getProductByIdAndEmpresa(id, empresaId);

        if (!product) {
            throw new AppError('Produto não encontrado ou não pertence a esta empresa.', 404);
        }

        const cleanedUpdateData: Partial<ProductAttributes> = {};
        (Object.keys(updateData) as Array<keyof ProductUpdateAttributes>).forEach(key => {
            if (updateData[key] !== undefined) {
                (cleanedUpdateData as any)[key] = updateData[key];
            }
        });

        // Se cleanedUpdateData estiver vazio, não fazemos o update.
        if (Object.keys(cleanedUpdateData).length === 0) {
            return product;
        }

        await product.update(cleanedUpdateData);
        return product;
    }

    public static async deleteProduct(id: number, empresaId: number): Promise<void> {
        const product = await ProductService.getProductByIdAndEmpresa(id, empresaId);

        if (!product) {
            throw new AppError('Produto não encontrado ou não pertence a esta empresa.', 404);
        }

        await product.destroy();
    }
}

export default ProductService;