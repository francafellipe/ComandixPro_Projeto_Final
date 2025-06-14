import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'comandix',
    process.env.DB_USER || 'comandixadmin',
    process.env.DB_PASSWORD || 'Fafl3447@',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        port: Number(process.env.DB_PORT) || 5432,
        // logging: false,
    }
);

export default sequelize;
