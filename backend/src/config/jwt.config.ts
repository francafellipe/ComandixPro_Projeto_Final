// src/config/jwt.config.ts
import dotenv from 'dotenv';
dotenv.config();

interface JwtConfig {
  secret: string; // Garante que 'secret' seja sempre uma string
  expiresIn: string;
}

const envSecret: string | undefined = process.env.JWT_SECRET;
const fallbackSecret: string = 'seuSegredoSuperSecretoAquiParaDevAmbienteApenas';

// Em produção, é crucial ter o JWT_SECRET definido.
if (!envSecret && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: JWT_SECRET não está definido no ambiente de produção!');
  process.exit(1); // Termina a aplicação se o segredo não estiver definido em produção.
}

const config: JwtConfig = {
  // Usa o segredo do ambiente se definido, senão usa o fallback.
  // A verificação acima protege a produção. Em desenvolvimento, o fallback é usado se .env estiver ausente/vazio.
  secret: envSecret || fallbackSecret,
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

export default config;