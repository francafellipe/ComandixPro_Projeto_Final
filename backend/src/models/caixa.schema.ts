// src/models/caixa.schema.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config';
import Usuario from './usuario.schema';
import Empresa from './empresa.schema';
import MovimentacaoCaixa from './movimentacaoCaixa.schema';
import Comanda from './comanda.schema';

export enum CaixaStatus {
  ABERTO = 'Aberto',
  FECHADO = 'Fechado',
}

export interface CaixaAttributes {
  id: number;
  dataAbertura: Date;
  dataFechamento?: Date | null;
  saldoInicial: number;
  totalVendasDinheiro: number;
  totalVendasCartao: number;
  totalVendasPix: number;
  totalSuprimentos: number;
  totalSangrias: number;
  saldoFinalCalculado: number; // (saldoInicial + vendas + suprimentos) - sangrias
  saldoFinalInformado?: number | null; // Valor contado no caixa ao fechar
  diferencaCaixa: number; // saldoFinalInformado - saldoFinalCalculado
  observacoesAbertura?: string | null;
  observacoesFechamento?: string | null;
  usuarioAberturaId: number;
  usuarioFechamentoId?: number | null;
  empresaId: number;
  status: CaixaStatus;
}

export interface CaixaCreationAttributes extends Optional<CaixaAttributes,
  'id' |
  'dataFechamento' |
  'totalVendasDinheiro' |
  'totalVendasCartao' |
  'totalVendasPix' |
  'totalSuprimentos' |
  'totalSangrias' |
  'saldoFinalCalculado' |
  'saldoFinalInformado' |
  'diferencaCaixa' |
  'observacoesFechamento' |
  'usuarioFechamentoId'
> { }

class Caixa extends Model<CaixaAttributes, CaixaCreationAttributes> implements CaixaAttributes {
  public id!: number;
  public dataAbertura!: Date;
  public dataFechamento?: Date | null;
  public saldoInicial!: number;
  public totalVendasDinheiro!: number;
  public totalVendasCartao!: number;
  public totalVendasPix!: number;
  public totalSuprimentos!: number;
  public totalSangrias!: number;
  public saldoFinalCalculado!: number;
  public saldoFinalInformado?: number | null;
  public diferencaCaixa!: number;
  public observacoesAbertura?: string | null;
  public observacoesFechamento?: string | null;
  public usuarioAberturaId!: number;
  public usuarioFechamentoId?: number | null;
  public empresaId!: number;
  public status!: CaixaStatus;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly usuarioAbertura?: Usuario;
  public readonly usuarioFechamento?: Usuario;
  public readonly empresa?: Empresa;
  public readonly movimentacoes?: MovimentacaoCaixa[];
  public readonly comandas?: Comanda[];
}

Caixa.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    dataAbertura: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dataFechamento: { type: DataTypes.DATE, allowNull: true },
    saldoInicial: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    totalVendasDinheiro: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    totalVendasCartao: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    totalVendasPix: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    totalSuprimentos: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    totalSangrias: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    saldoFinalCalculado: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    saldoFinalInformado: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    diferencaCaixa: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    observacoesAbertura: { type: DataTypes.TEXT, allowNull: true },
    observacoesFechamento: { type: DataTypes.TEXT, allowNull: true },
    usuarioAberturaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: 'id' },
    },
    usuarioFechamentoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Usuario, key: 'id' },
    },
    empresaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Empresa, key: 'id' },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CaixaStatus)),
      allowNull: false,
      defaultValue: CaixaStatus.ABERTO,
    },
  },
  {
    sequelize,
    tableName: 'caixas',
    modelName: 'Caixa',
    timestamps: true,
    // Poderíamos adicionar um scope para buscar apenas caixas abertos facilmente
    // defaultScope: { where: { status: CaixaStatus.ABERTO } },
    // scopes: { abertos: { where: { status: CaixaStatus.ABERTO } } }
  }
);



export default Caixa;