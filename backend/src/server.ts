// src/server.ts
import express from "express";
import cors from 'cors';
import serverConfig from "./config/server.config"; // Suas configurações de servidor (porta, env)
import db from "./models"; // 👈 Importa o objeto db do models/index.ts
import morgan from 'morgan';

// Middlewares
import { errorHandler } from "./middlewares/errorMiddleware";

// Importação de Rotas
import authRoutes from "./routes/authRoutes";
import productRoutes from './routes/productRoutes';
import categoriaRoutes from './routes/categoriaRoutes';
import adminEmpresaRoutes from "./routes/adminEmpresaRoutes";
import userRoutes from "./routes/userRoutes"; 
import caixaRoutes from "./routes/caixaRoutes";
import comandaRoutes from "./routes/comandaRoutes";
import relatorioRoutes from "./routes/relatorioRoutes";
import syncRoutes from "./routes/syncRoutes";
import dashboardRoutes from './routes/dashboardRoutes';

const app = express();

// Middlewares Globais da Aplicação
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rota de Health Check
app.get("/api/health", (req, res) => {
  res.send("API ComandixPro está funcionando perfeitamente!");
});

// Registro das Rotas da API
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminEmpresaRoutes);
app.use('/api/produtos', productRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use("/api/usuarios", userRoutes);  
app.use("/api/caixa", caixaRoutes); // Corrigido de "/aoi/caixa"
app.use("/api/comandas", comandaRoutes); 
app.use("/api/relatorios", relatorioRoutes); 
app.use("/api/sync", syncRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Middleware de Tratamento de Erros Global (deve ser o último middleware registrado)
app.use(errorHandler);

const PORT = serverConfig.port;

const startServer = async () => {
  try {
    // Autentica a conexão com o banco usando a instância do sequelize de db
    await db.sequelize.authenticate();
    console.log("Conexão com o banco de dados estabelecida com sucesso.");

    // Sincroniza os modelos com o banco usando a instância do sequelize de db
    // O 'alter: true' é útil em desenvolvimento, mas use migrações em produção.
    await db.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log("Banco de dados sincronizado com sucesso.");

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor ComandixPro rodando com maestria na porta ${PORT}`);
      console.log(`Ambiente: ${serverConfig.nodeEnv}`);
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor ou sincronizar o banco de dados:", error);
    process.exit(1);
  }
};

startServer();