
// src/models/categoria.schema.ts
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/db.config';

export interface CategoriaAttributes {
  id: number;
  nome: string;
  descricao?: string | null;
  empresaId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoriaCreationAttributes extends Optional<CategoriaAttributes, 'id' | 'descricao' | 'createdAt' | 'updatedAt'> {}

class Categoria extends Model<CategoriaAttributes, CategoriaCreationAttributes> implements CategoriaAttributes {
  public id!: number;
  public nome!: string;
  public descricao?: string | null;
  public empresaId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Categoria.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'categorias',
    modelName: 'Categoria',
    timestamps: true,
  }
);

export default Categoria;
