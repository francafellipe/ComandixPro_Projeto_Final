// src/models/comanda.schema.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/db.config';
import Empresa from './empresa.schema';
import Usuario from './usuario.schema';
import Caixa from './caixa.schema';
import ItemComanda from './itemComanda.schema';


export enum ComandaStatus {
  ABERTA = 'Aberta',
  FECHADA = 'Fechada', // Aguardando pagamento ou processamento final
  PAGA = 'Paga',
  CANCELADA = 'Cancelada',
}

export enum FormaPagamento {
  DINHEIRO = 'Dinheiro',
  CARTAO_CREDITO = 'Cartão de Crédito',
  CARTAO_DEBITO = 'Cartão de Débito',
  PIX = 'PIX',
  OUTRO = 'Outro',
}

export interface ComandaAttributes {
  id: number;
  empresaId: number;
  usuarioAberturaId: number; // Usuário que abriu a comanda (garçom, caixa)
  caixaId?: number | null;    // Caixa ao qual a comanda foi/será associada no pagamento
  mesa?: string | null;
  nomeCliente?: string | null;
  status: ComandaStatus;
  totalComanda: number;
  formaPagamento?: FormaPagamento | null;
  dataAbertura: Date;
  dataFechamento?: Date | null; // Quando foi fechada para pagamento ou paga
  observacoes?: string | null;
}

export interface ComandaCreationAttributes 
  extends Optional<ComandaAttributes, 
    'id' | 
    'caixaId' | 
    'mesa' | 
    'nomeCliente' | 
    'totalComanda' | 
    'formaPagamento' | 
    'dataFechamento' | 
    'observacoes'
  > {}

class Comanda extends Model<ComandaAttributes, ComandaCreationAttributes> implements ComandaAttributes {
  public id!: number;
  public empresaId!: number;
  public usuarioAberturaId!: number;
  public caixaId?: number | null;
  public mesa?: string | null;
  public nomeCliente?: string | null;
  public status!: ComandaStatus;
  public totalComanda!: number;
  public formaPagamento?: FormaPagamento | null;
  public dataAbertura!: Date;
  public dataFechamento?: Date | null;
  public observacoes?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associações
  public readonly empresa?: Empresa;
  public readonly usuarioAbertura?: Usuario;
  public readonly caixa?: Caixa;
  public readonly itensComanda?: ItemComanda[];
}

Comanda.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    empresaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Empresa, key: 'id' } },
    usuarioAberturaId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Usuario, key: 'id' } },
    caixaId: { type: DataTypes.INTEGER, allowNull: true, references: { model: Caixa, key: 'id' } },
    mesa: { type: DataTypes.STRING, allowNull: true },
    nomeCliente: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM(...Object.values(ComandaStatus)), allowNull: false, defaultValue: ComandaStatus.ABERTA },
    totalComanda: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
    formaPagamento: { type: DataTypes.ENUM(...Object.values(FormaPagamento)), allowNull: true },
    dataAbertura: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    dataFechamento: { type: DataTypes.DATE, allowNull: true },
    observacoes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    tableName: 'comandas',
    modelName: 'Comanda',
    timestamps: true,
  }
);


export default Comanda;