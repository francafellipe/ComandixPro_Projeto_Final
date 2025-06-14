// src/models/product.schema.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config';
import Empresa from './empresa.schema';
import ItemComanda from './itemComanda.schema';

export interface ProductAttributes {
  id: number;
  nome: string;
  preco: number;
  categoriaId?: number | null;
  disponivel: boolean;
  empresaId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'categoriaId' | 'disponivel' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: number;
  public nome!: string;
  public preco!: number;
  public categoriaId?: number | null;
  public disponivel!: boolean;
  public empresaId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly empresa?: Empresa;
  public readonly emItemsDeComanda?: ItemComanda[];
}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    preco: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    categoriaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'categorias',
        key: 'id',
      },
    },
    disponivel: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Empresa,
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'produtos',
    modelName: 'Product',
  }
);



export default Product;