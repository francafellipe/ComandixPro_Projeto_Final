// src/models/empresa.schema.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";
import Usuario from "./usuario.schema";
import Product from "./product.schema";
import Caixa from "./caixa.schema";
import Comanda from "./comanda.schema";

// EXPORTAR ESTA INTERFACE
export interface EmpresaAttributes {
    id: number;
    nome: string;
    emailContato: string;
    cnpj?: string;
    licencaValidaAte: Date;
    ativa: boolean;
}

// EXPORTAR ESTA INTERFACE
export interface EmpresaCreationAttributes extends Optional<EmpresaAttributes, "id"> { }

class Empresa extends Model<EmpresaAttributes, EmpresaCreationAttributes> implements EmpresaAttributes {
    public id!: number;
    public nome!: string;
    public emailContato!: string;
    public cnpj?: string;
    public licencaValidaAte!: Date;
    public ativa!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly usuarios?: Usuario[];
    public readonly produtos?: Product[];
    public readonly caixas?: Caixa[];
    public readonly comandas?: Comanda[];
}

Empresa.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    emailContato: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        }
    },
    cnpj: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    licencaValidaAte: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ativa: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    sequelize,
    tableName: "empresas",
    modelName: "Empresa",
});



export default Empresa;