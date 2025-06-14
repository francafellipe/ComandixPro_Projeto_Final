// src/config/server.config.ts
import dotenv from 'dotenv';
dotenv.config();

export default {
  port: Number(process.env.PORT) || 3001, // Corrigido para process.env.PORT
  nodeEnv: process.env.NODE_ENV || 'development',
};