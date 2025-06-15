// src/utils/helper.ts
import { ComandaStatus } from '../models/comanda.schema';

/**
 * Utility functions for common operations.
 */

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Normaliza o status da comanda para o formato correto do enum
 */
export function normalizeComandaStatus(status: string): ComandaStatus | null {
  const statusUpper = status.toUpperCase();
  switch (statusUpper) {
    case 'ABERTA':
      return ComandaStatus.ABERTA;
    case 'FECHADA':
      return ComandaStatus.FECHADA;
    case 'PAGA':
      return ComandaStatus.PAGA;
    case 'CANCELADA':
      return ComandaStatus.CANCELADA;
    default:
      return null;
  }
}