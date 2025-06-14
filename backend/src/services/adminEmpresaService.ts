// src/services/adminEmpresaService.ts
import sequelize from '../config/db.config';
import Empresa, { EmpresaAttributes, EmpresaCreationAttributes } from '../models/empresa.schema';
import Usuario, { UserRole, UsuarioCreationAttributes, UsuarioAttributes } from '../models/usuario.schema';
import AppError from '../utils/appError';

export interface CreateEmpresaComAdminDTO {
  empresaData: Omit<EmpresaCreationAttributes, 'id' | 'ativa'> & { ativa?: boolean };
  adminUserData: {
    nome: string;
    email: string;
    senhaPlain: string;
  };
}

export interface AdminUserResponseDTO extends Omit<UsuarioAttributes, 'senha'> {}

export interface UpdateEmpresaDTO {
  nome?: string;
  emailContato?: string;
  cnpj?: string;
  licencaValidaAte?: Date;
  ativa?: boolean;
}

class AdminEmpresaService {
  public static async createEmpresaComAdmin(
    data: CreateEmpresaComAdminDTO
  ): Promise<{ empresa: Empresa; admin: AdminUserResponseDTO }> {
    // ... (lógica do try, validações, etc. permanecem as mesmas) ...
    const { empresaData, adminUserData } = data;

    const existingUser = await Usuario.findOne({ where: { email: adminUserData.email } });
    if (existingUser) {
      throw new AppError(`Já existe um usuário cadastrado com o email: ${adminUserData.email}`, 409);
    }

    if (empresaData.emailContato) {
        const existingEmpresaEmail = await Empresa.findOne({ where: { emailContato: empresaData.emailContato } });
        if (existingEmpresaEmail) {
            throw new AppError(`Já existe uma empresa cadastrada com o email de contato: ${empresaData.emailContato}`, 409);
        }
    }
    if (empresaData.cnpj) {
        const existingEmpresaCnpj = await Empresa.findOne({ where: { cnpj: empresaData.cnpj } });
        if (existingEmpresaCnpj) {
            throw new AppError(`Já existe uma empresa cadastrada com o CNPJ: ${empresaData.cnpj}`, 409);
        }
    }

    const transaction = await sequelize.transaction();
    try {
      const novaEmpresa = await Empresa.create(
        { ...empresaData, ativa: empresaData.ativa !== undefined ? empresaData.ativa : true, },
        { transaction }
      );
      const novoAdminData: UsuarioCreationAttributes = {
        nome: adminUserData.nome,
        email: adminUserData.email,
        senha: adminUserData.senhaPlain,
        role: UserRole.ADMIN_EMPRESA,
        empresaId: novaEmpresa.id,
        ativo: true,
      };
      const novoAdmin = await Usuario.create(novoAdminData, { transaction });
      await transaction.commit();
      const { senha, ...adminDataSemSenha } = novoAdmin.toJSON() as UsuarioAttributes;
      return { empresa: novaEmpresa, admin: adminDataSemSenha };
    } catch (error: any) {
      await transaction.rollback();
      if (error instanceof AppError) { throw error; } // Repassa AppErrors já tratados
      console.error("Erro ao criar empresa com admin:", error);
      // CORRIGIDO: new AppError com 2 argumentos
      const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
      throw new AppError(`Falha ao criar a empresa e seu administrador: ${errorMessage}`, 500);
    }
  }

  public static async listEmpresas(): Promise<Empresa[]> {
    try {
      return await Empresa.findAll({ order: [['nome', 'ASC']] });
    } catch (error: any) {
      console.error("Erro ao listar empresas:", error);
      // CORRIGIDO: new AppError com 2 argumentos
      const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
      throw new AppError(`Falha ao buscar a lista de empresas: ${errorMessage}`, 500);
    }
  }

  public static async getEmpresaById(id: number): Promise<Empresa | null> {
    try {
      return await Empresa.findByPk(id);
    } catch (error: any) {
      console.error(`Erro ao buscar empresa por ID (${id}):`, error);
      // CORRIGIDO: new AppError com 2 argumentos
      const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
      throw new AppError(`Falha ao buscar dados da empresa: ${errorMessage}`, 500);
    }
  }

  public static async updateEmpresa(id: number, data: UpdateEmpresaDTO): Promise<Empresa> {
    try {
      const empresa = await Empresa.findByPk(id);
      if (!empresa) {
        throw new AppError('Empresa não encontrada com o ID fornecido para atualização.', 404);
      }

      if (data.emailContato && data.emailContato !== empresa.emailContato) {
        const existingEmpresaEmail = await Empresa.findOne({ where: { emailContato: data.emailContato } });
        if (existingEmpresaEmail) {
          throw new AppError(`Já existe outra empresa cadastrada com o email de contato: ${data.emailContato}`, 409);
        }
      }
      if (data.cnpj && data.cnpj !== empresa.cnpj) {
        const existingEmpresaCnpj = await Empresa.findOne({ where: { cnpj: data.cnpj } });
        if (existingEmpresaCnpj) {
          throw new AppError(`Já existe outra empresa cadastrada com o CNPJ: ${data.cnpj}`, 409);
        }
      }

      const updateDataFiltered: Partial<UpdateEmpresaDTO> = {};
      (Object.keys(data) as Array<keyof UpdateEmpresaDTO>).forEach(key => {
        if (data[key] !== undefined) {
          (updateDataFiltered as any)[key] = data[key];
        }
      });

      if (Object.keys(updateDataFiltered).length === 0) {
        return empresa;
      }

      await empresa.update(updateDataFiltered);
      return empresa;

    } catch (error: any) {
      if (error instanceof AppError) { throw error; }
      console.error(`Erro ao atualizar empresa por ID (${id}):`, error);
      // CORRIGIDO: new AppError com 2 argumentos
      const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
      throw new AppError(`Falha ao atualizar dados da empresa: ${errorMessage}`, 500);
    }
  }
  /**
   * Define o status de ativação de uma empresa (ativa/inativa).
   * A ativação para 'true' só é permitida se a licença da empresa não estiver expirada.
   * A desativação ('false') é sempre permitida.
   * Acessível apenas pelo ADMIN_GLOBAL.
   * @param id - O ID da empresa.
   * @param novoStatus - O novo status de ativação (true para ativar, false para desativar).
   * @returns A instância da empresa atualizada.
   */
  public static async setEmpresaStatus(id: number, novoStatus: boolean): Promise<Empresa> {
    try {
      const empresa = await Empresa.findByPk(id);

      if (!empresa) {
        throw new AppError('Empresa não encontrada com o ID fornecido.', 404);
      }

      // Se a intenção é ATIVAR a empresa
      if (novoStatus === true) {
        const hoje = new Date();
        // Remove a parte do horário da data da licença para comparar apenas a data
        const licencaValidaAte = new Date(empresa.licencaValidaAte);
        licencaValidaAte.setHours(23, 59, 59, 999); // Garante que a licença é válida até o fim do dia

        if (licencaValidaAte < hoje) {
          throw new AppError(
            'Não é possível ativar a empresa pois sua licença está expirada. Por favor, atualize a data da licença primeiro.',
            400 // Bad Request, pois a ação não pode ser completada devido a uma condição de negócio
          );
        }
      }

      // Se chegou aqui, ou é para desativar, ou é para ativar e a licença está válida.
      // Ou se o status já for o desejado, não faz nada além de retornar a empresa.
      if (empresa.ativa !== novoStatus) {
        await empresa.update({ ativa: novoStatus });
      }
      
      return empresa; // Retorna a empresa (com o status atualizado ou como estava se não mudou)

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error(`Erro ao definir status da empresa por ID (${id}):`, error);
      const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
      throw new AppError(`Falha ao definir status da empresa: ${errorMessage}`, 500);
    }
  }
}

export default AdminEmpresaService;