import { UserRole } from '../models/usuario.schema';
import Empresa from '../models/empresa.schema';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: number;
        role: UserRole;
        empresaId?: number;
      };
      empresaVerificada?: Empresa;
    }
  }
}

export {};
