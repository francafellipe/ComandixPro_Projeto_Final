// src/utils/hash.utils.ts
import bcrypt from 'bcryptjs';

const saltRounds = 10;

export const generateHash = async (plainPassword: string): Promise<string> => {
  if (!plainPassword) { // Adiciona uma verificação simples
     throw new Error("Senha não pode ser vazia para gerar hash.");
  }
  return bcrypt.hash(plainPassword, saltRounds);
};

export const comparePassword = async (plainPassword: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hash);
};