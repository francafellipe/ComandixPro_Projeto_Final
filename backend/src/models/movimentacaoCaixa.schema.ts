// src/models/movimentacaoCaixa.schema.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config';
import Caixa from './caixa.schema';
import Usuario from './usuario.schema';
import Empresa from './empresa.schema';

export enum TipoMovimentacaoCaixa {
  SUPRIMENTO = 'suprimento', // Entrada de dinheiro
  SANGRIA = 'sangria',     // Saída de dinheiro
}

export interface MovimentacaoCaixaAttributes {
  id: number;
  caixaId: number;
  tipo: TipoMovimentacaoCaixa;
  valor: number;
  observacao?: string | null;
  dataHora: Date;
  usuarioId: number; // Usuário que registrou a movimentação
  empresaId: number; // Para facilitar queries e isolamento, embora possa ser derivado do Caixa
}

export interface MovimentacaoCaixaCreationAttributes 
  extends Optional<MovimentacaoCaixaAttributes, 'id' | 'dataHora' | 'observacao'> {}

class MovimentacaoCaixa extends Model<MovimentacaoCaixaAttributes, MovimentacaoCaixaCreationAttributes> 
  implements MovimentacaoCaixaAttributes {
  public id!: number;
  public caixaId!: number;
  public tipo!: TipoMovimentacaoCaixa;
  public valor!: number;
  public observacao?: string | null;
  public dataHora!: Date;
  public usuarioId!: number;
  public empresaId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly caixa?: Caixa;
  public readonly usuario?: Usuario;
  public readonly empresa?: Empresa;
}

MovimentacaoCaixa.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    caixaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Caixa, key: 'id' },
    },
    tipo: {
      type: DataTypes.ENUM(...Object.values(TipoMovimentacaoCaixa)),
      allowNull: false,
    },
    valor: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    observacao: { type: DataTypes.TEXT, allowNull: true },
    dataHora: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    usuarioId: { // Usuário que realizou a movimentação
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: 'id' },
    },
    empresaId: { // Redundante para segregação, mas facilita queries
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Empresa, key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'movimentacoes_caixa', // Nome da tabela no plural e com underscore
    modelName: 'MovimentacaoCaixa',
    timestamps: true,
  }
);

export default MovimentacaoCaixa;