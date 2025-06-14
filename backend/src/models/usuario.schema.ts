// src/models/usuario.schema.ts
import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";
import Empresa from "./empresa.schema";
import Caixa from "./caixa.schema";
import { generateHash } from "../utils/hash.utils";
import Comanda from "./comanda.schema";

export enum UserRole {
    ADMIN_GLOBAL = 'admin_global',
    ADMIN_EMPRESA = 'admin_empresa',
    GARCOM = 'garcom',
    CAIXA = 'caixa',
}
// EXPORTAR ESTA INTERFACE
export interface UsuarioAttributes {
    id: number;
    nome: string;
    email: string;
    senha: string;
    role: UserRole;
    empresaId?: number | null;
    ativo: boolean;
    deletedAt?: Date | null;
}
// EXPORTAR ESTA INTERFACE
export interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, "id" | "ativo" | "senha"> {
}

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
    public id!: number;
    public nome!: string;
    public email!: string;
    public senha!: string;
    public role!: UserRole;
    public empresaId?: number | null;
    public ativo!: boolean;
    public deletedAt?: Date | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly empresa?: Empresa;
    public readonly caixasAbertosPorMim?: Caixa[];
    public readonly caixasFechadosPorMim?: Caixa[];
}

Usuario.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    nome: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        }
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM(...Object.values(UserRole)),
        allowNull: false,
    },
    empresaId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Empresa, // Nome do modelo referenciado
            key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
    },
    ativo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    }
}, {
    sequelize,
    tableName: "usuarios",
    modelName: "Usuario",
    timestamps: true,
    paranoid: true,
    hooks: { 
        beforeCreate: async (usuario: Usuario) => {
            if (usuario.senha) {
                usuario.senha = await generateHash(usuario.senha);
            }
        },
        beforeUpdate: async (usuario: Usuario) => {
            if (usuario.changed('senha') && usuario.senha) {
                usuario.senha = await generateHash(usuario.senha);
            }
        }
    }
});


export default Usuario;