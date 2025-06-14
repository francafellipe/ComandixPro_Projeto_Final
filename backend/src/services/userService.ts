// src/services/userService.ts
import Usuario, { UserRole, UsuarioCreationAttributes, UsuarioAttributes } from '../models/usuario.schema';
import AppError from '../utils/appError';
// A função generateHash não é mais necessária aqui se o hook do modelo Usuario estiver funcionando.

// DTO para os dados de entrada da criação do usuário pela empresa admin
export interface CreateUserInEmpresaDTO {
    nome: string;
    email: string; // Email de login do novo usuário (deve ser único no sistema)
    senhaPlain: string; // Senha em texto plano
    role: UserRole; // Papel do novo usuário (ex: CAIXA, GARCOM, ADMIN_EMPRESA)
}

// DTO para o usuário retornado (sem a senha)
export interface UserResponseDTO extends Omit<UsuarioAttributes, 'senha'> { }

// DTO para atualização de usuário pela empresa admin
export interface UpdateUserInEmpresaDTO {
    nome?: string;
    role?: UserRole; // Permitir alteração de papel
    ativo?: boolean; // Permitir alteração de status
    // Não incluímos email ou senha aqui para simplificar e por segurança.
    // Essas operações exigiriam fluxos mais complexos.
}

class UserService {
    /**
     * Cria um novo usuário dentro de uma empresa específica.
     * Apenas um ADMIN_EMPRESA pode criar usuários para sua própria empresa.
     * @param empresaId - O ID da empresa do admin que está criando o usuário.
     * @param userData - Dados do novo usuário a ser criado.
     * @returns O objeto do usuário criado (sem a senha).
     */
    public static async createUserInEmpresa(
        empresaId: number, // Este ID virá do token do admin_empresa logado
        userData: CreateUserInEmpresaDTO
    ): Promise<UserResponseDTO> {
        const { nome, email, senhaPlain, role } = userData;

        // 1. Validação do Papel (Role)
        // Um admin_empresa não pode criar um admin_global.
        // E só pode criar papéis pertinentes à sua empresa.
        const allowedRolesToCreate: UserRole[] = [
            UserRole.ADMIN_EMPRESA,
            UserRole.CAIXA,
            UserRole.GARCOM,
        ];
        if (!allowedRolesToCreate.includes(role)) {
            throw new AppError(`O papel '${role}' não pode ser atribuído por um administrador de empresa.`, 400);
        }

        // 2. Validar se já existe um usuário com o email proposto (em todo o sistema)
        const existingUser = await Usuario.findOne({ where: { email } });
        if (existingUser) {
            throw new AppError(`Já existe um usuário cadastrado com o email: ${email}`, 409); // 409 Conflict
        }

        try {
            // 3. Preparar dados para criação do Usuário
            // O hook `beforeCreate` no modelo Usuario cuidará de hashear a senhaPlain
            // se ela for passada no campo 'senha'.
            const newUserCreationData: UsuarioCreationAttributes = {
                nome,
                email,
                senha: senhaPlain, // Passamos a senha plana, o hook no modelo Usuario irá hasheá-la
                role,
                empresaId: empresaId, // Vincula o novo usuário à empresa do admin logado
                ativo: true, // Novos usuários são criados como ativos por padrão
            };

            const novoUsuario = await Usuario.create(newUserCreationData);

            // Remover a senha do objeto de retorno por segurança
            const { senha, ...userDataToReturn } = novoUsuario.toJSON() as UsuarioAttributes;

            return userDataToReturn;

        } catch (error: any) {
            // Tratar outros erros (ex: validação do Sequelize, erros de banco)
            if (error instanceof AppError) { // Se já for um AppError, repassa
                throw error;
            }
            console.error("Erro ao criar usuário na empresa:", error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao criar o usuário: ${errorMessage}`, 500);
        }
    }

    /**
     * Lista todos os usuários de uma empresa específica.
     * @param empresaId - O ID da empresa cujos usuários serão listados.
     * @returns Uma lista de objetos de usuário (sem senha).
     */
    public static async listUsersByEmpresa(empresaId: number): Promise<UserResponseDTO[]> {
        try {
            const usuarios = await Usuario.findAll({
                where: { empresaId: empresaId },
                attributes: { exclude: ['senha'] }, // Exclui o campo 'senha' da consulta
                order: [['nome', 'ASC']], // Opcional: ordena por nome
            });

            // Embora 'attributes: { exclude: ['senha'] }' já remova do resultado do Sequelize,
            // se quisermos garantir e retornar objetos planos com tipagem UserResponseDTO:
            return usuarios.map(user => {
                const { senha, ...userData } = user.toJSON() as UsuarioAttributes;
                return userData;
            });
            // Se 'attributes: { exclude: ['senha'] }' for suficiente, pode retornar 'usuarios' diretamente,
            // mas o map garante a conformidade com UserResponseDTO explicitamente.

        } catch (error: any) {
            console.error(`Erro ao listar usuários da empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao buscar a lista de usuários: ${errorMessage}`, 500);
        }
    }

    /**
    * Busca um usuário específico pelo seu ID, dentro de uma empresa específica.
    * @param userId - O ID do usuário a ser buscado.
    * @param empresaId - O ID da empresa à qual o usuário deve pertencer.
    * @returns O objeto do usuário (sem senha) se encontrado e pertencente à empresa, caso contrário null.
    */
    public static async getUserInEmpresaById(
        userId: number,
        empresaId: number
    ): Promise<UserResponseDTO | null> {
        try {
            const usuario = await Usuario.findOne({
                where: {
                    id: userId,
                    empresaId: empresaId // Garante que o usuário pertença à empresa correta
                },
                attributes: { exclude: ['senha'] }, // Exclui o campo 'senha'
            });

            if (!usuario) {
                return null;
            }

            // Se 'attributes: { exclude: ['senha'] }' já removeu, este passo pode ser redundante
            // mas garante a conformidade com UserResponseDTO.
            const { senha, ...userData } = usuario.toJSON() as UsuarioAttributes;
            return userData;

        } catch (error: any) {
            console.error(`Erro ao buscar usuário ${userId} da empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao buscar dados do usuário: ${errorMessage}`, 500);
        }
    }

    /**
 * Atualiza os dados de um usuário existente dentro de uma empresa específica.
 * @param userId - O ID do usuário a ser atualizado.
 * @param empresaId - O ID da empresa do admin que está realizando a atualização.
 * @param updateData - Dados a serem atualizados no usuário.
 * @returns O objeto do usuário atualizado (sem senha).
 */
    public static async updateUserInEmpresa(
        userId: number,
        empresaId: number, // Do admin logado
        updateData: UpdateUserInEmpresaDTO
    ): Promise<UserResponseDTO> {
        try {
            const usuario = await Usuario.findOne({
                where: { id: userId, empresaId: empresaId }
            });

            if (!usuario) {
                throw new AppError('Usuário não encontrado nesta empresa ou ID inválido para atualização.', 404);
            }

            // Validação do Papel (Role) se estiver sendo alterado
            if (updateData.role) {
                const allowedRolesToAssign: UserRole[] = [
                    UserRole.ADMIN_EMPRESA,
                    UserRole.CAIXA,
                    UserRole.GARCOM,
                ];
                if (!allowedRolesToAssign.includes(updateData.role)) {
                    throw new AppError(`O papel '${updateData.role}' não pode ser atribuído por um administrador de empresa.`, 400);
                }
                // Um admin de empresa não pode rebaixar a si mesmo se for o único admin? (Lógica de negócio mais complexa, para depois)
                // Um admin de empresa não pode mudar o papel de um ADMIN_GLOBAL (mas ADMIN_GLOBAL não terá empresaId)
            }

            // Filtrar campos undefined para não sobrescrever indevidamente
            const filteredUpdateData: Partial<UpdateUserInEmpresaDTO> = {};
            (Object.keys(updateData) as Array<keyof UpdateUserInEmpresaDTO>).forEach(key => {
                if (updateData[key] !== undefined) {
                    (filteredUpdateData as any)[key] = updateData[key];
                }
            });

            if (Object.keys(filteredUpdateData).length === 0) {
                // Nenhum dado válido para atualizar, retorna o usuário como está (sem a senha)
                const { senha, ...userData } = usuario.toJSON() as UsuarioAttributes;
                return userData;
            }

            await usuario.update(filteredUpdateData);

            // Retornar os dados atualizados sem a senha
            const { senha, ...updatedUserData } = usuario.toJSON() as UsuarioAttributes;
            return updatedUserData;

        } catch (error: any) {
            if (error instanceof AppError) { throw error; }
            console.error(`Erro ao atualizar usuário ${userId} da empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao atualizar dados do usuário: ${errorMessage}`, 500);
        }
    }

    /**
   * Define o status de ativação (ativo/inativo) de um usuário dentro de uma empresa específica.
   * @param userId - O ID do usuário cujo status será alterado.
   * @param empresaId - O ID da empresa do admin que está realizando a alteração.
   * @param novoStatus - O novo status de ativação (true para ativar, false para desativar).
   * @returns O objeto do usuário atualizado (sem senha).
   */
    public static async setUserStatusInEmpresa(
        userId: number,
        empresaId: number, // Do admin logado
        novoStatus: boolean
    ): Promise<UserResponseDTO> {
        try {
            const usuario = await Usuario.findOne({
                where: { id: userId, empresaId: empresaId }
            });

            if (!usuario) {
                throw new AppError('Usuário não encontrado nesta empresa ou ID inválido para alterar status.', 404);
            }

            // Lógica de negócio adicional: Um admin_empresa não pode desativar a si mesmo se for o único admin_empresa ativo?
            // Por agora, permitimos a alteração direta do status.
            // Essa lógica mais complexa pode ser adicionada depois se necessário.

            if (usuario.ativo !== novoStatus) {
                await usuario.update({ ativo: novoStatus });
            }

            const { senha, ...updatedUserData } = usuario.toJSON() as UsuarioAttributes;
            return updatedUserData;

        } catch (error: any) {
            if (error instanceof AppError) { throw error; }
            console.error(`Erro ao definir status do usuário ${userId} da empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao definir status do usuário: ${errorMessage}`, 500);
        }
    }

    /**
   * Realiza o "soft delete" de um usuário dentro de uma empresa específica.
   * O usuário não é removido do banco, mas marcado como deletado (campo deletedAt é preenchido).
   * @param userIdToDelete - O ID do usuário a ser "deletado".
   * @param adminEmpresaId - O ID da empresa do admin que está realizando a operação.
   * @param performingAdminUserId - O ID do admin que está realizando a operação (para evitar auto-deleção).
   */
    public static async softDeleteUserInEmpresa(
        userIdToDelete: number,
        adminEmpresaId: number, // Do admin logado
        performingAdminUserId: number // ID do admin logado
    ): Promise<void> { // Retorna void pois a operação não resulta em dados para o cliente além do sucesso
        try {
            // Um admin não pode deletar a si mesmo
            if (userIdToDelete === performingAdminUserId) {
                throw new AppError('Um administrador não pode deletar a si próprio.', 403);
            }

            const usuario = await Usuario.findOne({
                where: {
                    id: userIdToDelete,
                    empresaId: adminEmpresaId
                    // paranoid: true já garante que SELECT ... WHERE deletedAt IS NULL
                }
            });

            if (!usuario) {
                // Usuário não encontrado ou não pertence à empresa, ou já foi soft-deletado
                throw new AppError('Usuário não encontrado nesta empresa ou já deletado.', 404);
            }

            // Lógica de negócio adicional:
            // Verificar se é o último ADMIN_EMPRESA da empresa? Se sim, impedir? (Para depois)

            await usuario.destroy(); // Sequelize com paranoid:true fará o soft delete

        } catch (error: any) {
            if (error instanceof AppError) { throw error; }
            console.error(`Erro ao realizar soft delete do usuário ${userIdToDelete} da empresa ${adminEmpresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao deletar o usuário: ${errorMessage}`, 500);
        }
    }


}

export default UserService;