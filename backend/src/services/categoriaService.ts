
// src/services/categoriaService.ts
import Categoria, { CategoriaCreationAttributes, CategoriaAttributes } from '../models/categoria.schema';
import Empresa from '../models/empresa.schema';
import AppError from '../utils/appError';

interface CategoriaUpdateAttributes {
    nome?: string;
    descricao?: string | null;
}

class CategoriaService {
    public static async createCategoria(
        empresaId: number,
        categoriaData: Omit<CategoriaCreationAttributes, 'empresaId'>
    ): Promise<Categoria> {
        const empresaExists = await Empresa.findByPk(empresaId);
        if (!empresaExists) {
            throw new AppError('Empresa não encontrada para associar a categoria.', 404);
        }

        const creationData: CategoriaCreationAttributes = {
            ...categoriaData,
            empresaId: empresaId,
        };

        const newCategoria = await Categoria.create(creationData);
        return newCategoria;
    }

    public static async listCategoriasByEmpresa(empresaId: number): Promise<Categoria[]> {
        const categorias = await Categoria.findAll({
            where: { empresaId: empresaId },
            order: [['nome', 'ASC']],
        });
        return categorias;
    }

    public static async getCategoriaByIdAndEmpresa(id: number, empresaId: number): Promise<Categoria | null> {
        const categoria = await Categoria.findOne({
            where: { id: id, empresaId: empresaId },
        });
        return categoria;
    }

    public static async updateCategoria(
        id: number,
        empresaId: number,
        updateData: CategoriaUpdateAttributes
    ): Promise<Categoria> {
        const categoria = await CategoriaService.getCategoriaByIdAndEmpresa(id, empresaId);

        if (!categoria) {
            throw new AppError('Categoria não encontrada ou não pertence a esta empresa.', 404);
        }

        const cleanedUpdateData: Partial<CategoriaAttributes> = {};
        (Object.keys(updateData) as Array<keyof CategoriaUpdateAttributes>).forEach(key => {
            if (updateData[key] !== undefined) {
                (cleanedUpdateData as any)[key] = updateData[key];
            }
        });

        if (Object.keys(cleanedUpdateData).length === 0) {
            return categoria;
        }

        await categoria.update(cleanedUpdateData);
        return categoria;
    }

    public static async deleteCategoria(id: number, empresaId: number): Promise<void> {
        const categoria = await CategoriaService.getCategoriaByIdAndEmpresa(id, empresaId);

        if (!categoria) {
            throw new AppError('Categoria não encontrada ou não pertence a esta empresa.', 404);
        }

        await categoria.destroy();
    }
}

export default CategoriaService;
