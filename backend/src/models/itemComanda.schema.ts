// src/models/itemComanda.schema.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config';
import Comanda from './comanda.schema';
import Product from './product.schema'; // Produto do nosso catálogo
import Empresa from './empresa.schema'; // Para denormalização e facilidade de query por empresa

export interface ItemComandaAttributes {
  id: number;
  comandaId: number;
  produtoId: number;
  empresaId: number; // Denormalizado da comanda para facilitar queries/isolamento
  quantidade: number;
  precoUnitarioCobrado: number; // Preço do produto no momento da adição à comanda
  subtotal: number; // quantidade * precoUnitarioCobrado
  observacaoItem?: string | null;
}

export interface ItemComandaCreationAttributes 
  extends Optional<ItemComandaAttributes, 'id' | 'observacaoItem'> {}

class ItemComanda extends Model<ItemComandaAttributes, ItemComandaCreationAttributes> 
  implements ItemComandaAttributes {
  public id!: number;
  public comandaId!: number;
  public produtoId!: number;
  public empresaId!: number;
  public quantidade!: number;
  public precoUnitarioCobrado!: number;
  public subtotal!: number;
  public observacaoItem?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly comanda?: Comanda;
  public readonly produto?: Product;
  public readonly empresa?: Empresa;
}

ItemComanda.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    comandaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Comanda, key: 'id' }, onDelete: 'CASCADE' }, // Se deletar a comanda, deleta os itens
    produtoId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Product, key: 'id' } }, // Não deleta o produto em si
    empresaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Empresa, key: 'id' } },
    quantidade: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    precoUnitarioCobrado: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, // Pode ser calculado, mas armazenar facilita
    observacaoItem: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'itens_comanda',
    modelName: 'ItemComanda',
    timestamps: true,
  }
);



export default ItemComanda;