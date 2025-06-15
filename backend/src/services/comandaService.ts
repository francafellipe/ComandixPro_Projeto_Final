// src/services/comandaService.ts
import sequelize from '../config/db.config';
import Comanda, { ComandaStatus, ComandaCreationAttributes, FormaPagamento } from '../models/comanda.schema';
import ItemComanda, { ItemComandaCreationAttributes, ItemComandaAttributes } from '../models/itemComanda.schema';
import Product from '../models/product.schema';
import Caixa, { CaixaStatus } from '../models/caixa.schema';
import Usuario from '../models/usuario.schema';
// import Empresa from '../models/empresa.schema'; // Importe se for usar diretamente Empresa aqui
import AppError from '../utils/appError';
import { Op } from 'sequelize';
import { normalizeComandaStatus } from '../utils/helper';

// DTO para criar uma nova comanda
export interface CriarComandaDTO {
    mesa?: string | null;
    nomeCliente?: string | null;
    observacoes?: string | null;
}
// DTO para adicionar um item à comanda
export interface AdicionarItemComandaDTO {
    produtoId: number;
    quantidade: number;
    observacaoItem?: string | null;
}
// Interface para filtros de listagem de comandas
export interface ListarComandasFiltrosDTO {
    status?: string; // Aceita string para maior flexibilidade na validação
    mesa?: string;
    dataInicio?: string; // Formato YYYY-MM-DD
    dataFim?: string;    // Formato YYYY-MM-DD
}

export interface ProcessarPagamentoDTO {
    formaPagamento: FormaPagamento;
    // Outros campos como valorPago (se permitir pagamento parcial/troco) podem ser adicionados no futuro.
}

export interface AtualizarItemComandaDTO {
    quantidade: number;
}

class ComandaService {
    /**
     * Cria uma nova comanda para uma empresa.
     * A comanda é aberta e associada a um caixa aberto, se houver.
     * @param empresaId - ID da empresa.
     * @param usuarioAberturaId - ID do usuário que está abrindo a comanda.
     * @param dadosComanda - Dados opcionais como mesa e nome do cliente.
     * @returns A nova comanda criada.
     */
    public static async criarComanda(
        empresaId: number,
        usuarioAberturaId: number,
        dadosComanda: CriarComandaDTO
    ): Promise<Comanda> {
        const caixaAberto = await Caixa.findOne({
            where: { empresaId, status: CaixaStatus.ABERTO },
        });

        if (!caixaAberto) {
            throw new AppError('Nenhum caixa aberto encontrado para esta empresa. Abra um caixa antes de criar comandas.', 400);
        }

        const usuario = await Usuario.findByPk(usuarioAberturaId);
        if (!usuario || usuario.empresaId !== empresaId) {
            throw new AppError('Usuário não autorizado a abrir comandas para esta empresa.', 403);
        }

        const comandaData: ComandaCreationAttributes = {
            empresaId,
            usuarioAberturaId,
            caixaId: caixaAberto.id,
            mesa: dadosComanda.mesa,
            nomeCliente: dadosComanda.nomeCliente,
            observacoes: dadosComanda.observacoes,
            status: ComandaStatus.ABERTA,
            totalComanda: 0,
            dataAbertura: new Date(),
        };

        try {
            const novaComanda = await Comanda.create(comandaData);
            return novaComanda;
        } catch (error: any) {
            console.error(`Erro ao criar comanda para empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao criar comanda: ${errorMessage}`, 500);
        }
    }

    /**
     * Adiciona um item a uma comanda existente.
     * Recalcula o total da comanda.
     */
    public static async adicionarItemComanda(
        empresaId: number,
        comandaId: number,
        dadosItem: AdicionarItemComandaDTO
    ): Promise<ItemComanda> {
        const transaction = await sequelize.transaction();
        try {
            const comanda = await Comanda.findOne({
                where: { id: comandaId, empresaId, status: ComandaStatus.ABERTA },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!comanda) {
                await transaction.rollback();
                throw new AppError('Comanda não encontrada, não pertence à empresa ou não está aberta.', 404);
            }

            const produto = await Product.findOne({
                where: { id: dadosItem.produtoId, empresaId, disponivel: true },
                transaction,
            });

            if (!produto) {
                await transaction.rollback();
                throw new AppError('Produto não encontrado, não pertence à empresa ou está indisponível.', 404);
            }

            if (dadosItem.quantidade <= 0) {
                await transaction.rollback();
                throw new AppError('A quantidade do item deve ser maior que zero.', 400);
            }

            const precoUnitarioCobrado = produto.preco;
            const subtotal = precoUnitarioCobrado * dadosItem.quantidade;

            const novoItemData: ItemComandaCreationAttributes = {
                comandaId: comanda.id,
                produtoId: produto.id,
                empresaId: empresaId,
                quantidade: dadosItem.quantidade,
                precoUnitarioCobrado,
                subtotal,
                observacaoItem: dadosItem.observacaoItem,
            };
            const novoItem = await ItemComanda.create(novoItemData, { transaction });

            comanda.totalComanda = Number(comanda.totalComanda) + subtotal;
            await comanda.save({ transaction });

            await transaction.commit();
            return novoItem;

        } catch (error: any) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            console.error(`Erro ao adicionar item à comanda ${comandaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao adicionar item à comanda: ${errorMessage}`, 500);
        }
    }

    public static async visualizarComanda(empresaId: number, comandaId: number): Promise<Comanda | null> {
        try {
            const comanda = await Comanda.findOne({
                where: { id: comandaId, empresaId },
                include: [
                    {
                        model: ItemComanda,
                        as: 'itensComanda',
                        include: [{ model: Product, as: 'produto', attributes: ['id', 'nome'] }],
                        separate: true,
                        order:[['createdAt', 'DESC']]
                    },
                    { model: Usuario, as: 'usuarioAbertura', attributes: ['id', 'nome'] },
                    { model: Caixa, as: 'caixa' }
                ]
            });
            return comanda;
        } catch (error: any) {
            console.error(`Erro ao visualizar comanda ${comandaId} para empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao buscar detalhes da comanda: ${errorMessage}`, 500);
        }
    }

    public static async listarComandas(empresaId: number, filtros?: ListarComandasFiltrosDTO): Promise<Comanda[]> {
        try {
            const whereConditions: any = { empresaId };
            if (filtros?.status) {
                const statusNormalizado = normalizeComandaStatus(filtros.status);
                if (statusNormalizado) {
                    whereConditions.status = statusNormalizado;
                } else {
                    // Se não for um status válido, usar o valor original
                    whereConditions.status = filtros.status;
                }
            }
            if (filtros?.mesa) {
                whereConditions.mesa = filtros.mesa;
            }
            if (filtros?.dataInicio && filtros?.dataFim) {
                whereConditions.dataAbertura = {
                    [Op.between]: [`${filtros.dataInicio} 00:00:00`, `${filtros.dataFim} 23:59:59`]
                };
            } else if (filtros?.dataInicio) {
                whereConditions.dataAbertura = { [Op.gte]: `${filtros.dataInicio} 00:00:00` };
            } else if (filtros?.dataFim) {
                whereConditions.dataAbertura = { [Op.lte]: `${filtros.dataFim} 23:59:59` };
            }

            const comandas = await Comanda.findAll({
                where: whereConditions,
                include: [
                    {
                        model: Usuario,
                        as: 'usuarioAbertura',
                        attributes: ['id', 'nome']
                    }
                ],
                order: [['dataAbertura', 'DESC']],
                attributes: [
                    'id', 'empresaId', 'mesa', 'nomeCliente', 'status',
                    'totalComanda', 'dataAbertura', 'dataFechamento', 'formaPagamento'
                ]
            });
            return comandas;
        } catch (error: any) {
            console.error(`Erro ao listar comandas para empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao buscar lista de comandas: ${errorMessage}`, 500);
        }
    }

    /**
     * Atualiza a quantidade de um item em uma comanda e recalcula os totais.
     */
    public static async atualizarItemComanda(
        empresaId: number,
        comandaId: number,
        itemComandaId: number,
        dadosAtualizacao: AtualizarItemComandaDTO
    ): Promise<Comanda> {
        const { quantidade } = dadosAtualizacao;

        if (typeof quantidade !== 'number' || quantidade <= 0) {
            throw new AppError('A quantidade deve ser um número maior que zero.', 400);
        }

        const transaction = await sequelize.transaction();
        try {
            const comanda = await Comanda.findOne({
                where: { id: comandaId, empresaId, status: ComandaStatus.ABERTA },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!comanda) {
                await transaction.rollback();
                throw new AppError('Comanda não encontrada, não pertence à empresa ou não está aberta.', 404);
            }

            const itemParaAtualizar = await ItemComanda.findOne({
                where: { id: itemComandaId, comandaId: comanda.id },
                transaction,
            });

            if (!itemParaAtualizar) {
                await transaction.rollback();
                throw new AppError('Item não encontrado nesta comanda.', 404);
            }

            // Guarda o subtotal antigo para recalcular o total da comanda
            const subtotalAntigo = Number(itemParaAtualizar.subtotal);

            // Atualiza o item
            itemParaAtualizar.quantidade = quantidade;
            itemParaAtualizar.subtotal = Number(itemParaAtualizar.precoUnitarioCobrado) * quantidade;
            await itemParaAtualizar.save({ transaction });

            // Recalcula o total da comanda
            const novoSubtotal = Number(itemParaAtualizar.subtotal);
            comanda.totalComanda = Number(comanda.totalComanda) - subtotalAntigo + novoSubtotal;
            await comanda.save({ transaction });

            await transaction.commit();

            // Rebusca a comanda para retornar o estado mais recente com todas as inclusões
            const comandaAtualizada = await this.visualizarComanda(empresaId, comandaId);
            if (!comandaAtualizada) {
                throw new AppError('Erro ao buscar dados da comanda após atualização.', 500);
            }
            return comandaAtualizada;

        } catch (error: any) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            console.error(`Erro ao atualizar item ${itemComandaId} da comanda ${comandaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao atualizar item da comanda: ${errorMessage}`, 500);
        }
    }

    public static async removerItemComanda(
        empresaId: number,
        comandaId: number,
        itemComandaId: number
    ): Promise<Comanda> {
        const transaction = await sequelize.transaction();
        try {
            const comanda = await Comanda.findOne({
                where: { id: comandaId, empresaId, status: ComandaStatus.ABERTA },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!comanda) {
                await transaction.rollback();
                throw new AppError('Comanda não encontrada, não pertence à empresa ou não está aberta para modificação.', 404);
            }

            const itemParaRemover = await ItemComanda.findOne({
                where: { id: itemComandaId, comandaId: comanda.id },
                transaction,
            });

            if (!itemParaRemover) {
                await transaction.rollback();
                throw new AppError('Item não encontrado nesta comanda.', 404);
            }

            comanda.totalComanda = Number(comanda.totalComanda) - Number(itemParaRemover.subtotal);
            await comanda.save({ transaction });
            await itemParaRemover.destroy({ transaction });
            await transaction.commit();

            // Rebusca a comanda para retornar com os itens atualizados
            const comandaAtualizada = await ComandaService.visualizarComanda(empresaId, comandaId);
            if (!comandaAtualizada) { // Checagem de segurança, embora improvável aqui
                throw new AppError('Comanda não encontrada após remoção do item.', 500);
            }
            return comandaAtualizada;

        } catch (error: any) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            console.error(`Erro ao remover item ${itemComandaId} da comanda ${comandaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao remover item da comanda: ${errorMessage}`, 500);
        }
    }
    /**
   * Cancela uma comanda existente.
   * Só permite cancelar comandas que estão com status 'Aberta'.
   * @param empresaId - ID da empresa.
   * @param comandaId - ID da comanda a ser cancelada.
   * @returns A comanda atualizada com o status 'Cancelada'.
   */
    public static async cancelarComanda(
        empresaId: number,
        comandaId: number
    ): Promise<Comanda> {
        const transaction = await sequelize.transaction();
        try {
            // 1. Buscar a comanda e garantir que pertence à empresa
            const comanda = await Comanda.findOne({
                where: { id: comandaId, empresaId },
                transaction,
                lock: transaction.LOCK.UPDATE, // Bloqueia para atualização
            });

            if (!comanda) {
                await transaction.rollback();
                throw new AppError('Comanda não encontrada ou não pertence a esta empresa.', 404);
            }

            // 2. Verificar se a comanda pode ser cancelada
            // Por exemplo, só permitir cancelar comandas que estão 'Aberta'
            if (comanda.status !== ComandaStatus.ABERTA) {
                await transaction.rollback();
                throw new AppError(`Não é possível cancelar a comanda pois seu status é '${comanda.status}'. Apenas comandas 'Abertas' podem ser canceladas.`, 400);
            }

            // Lógica adicional pode ser necessária aqui:
            // - Estornar itens ao estoque (se houver controle de estoque).
            // - Registrar motivo do cancelamento (poderia ser um novo campo na comanda ou um DTO).

            // 3. Atualizar o status da comanda para CANCELADA
            comanda.status = ComandaStatus.CANCELADA;
            // Poderia também definir dataFechamento aqui se o cancelamento implicar em um "fechamento"
            // comanda.dataFechamento = new Date(); 
            await comanda.save({ transaction });

            // Nota: Se o cancelamento implicar em remover itens ou zerar o total,
            // essa lógica seria adicionada aqui também dentro da transação.
            // Por ora, apenas mudamos o status.

            await transaction.commit();
            return comanda;

        } catch (error: any) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            console.error(`Erro ao cancelar comanda ${comandaId} para empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao cancelar comanda: ${errorMessage}`, 500);
        }
    }

    /**
  * Processa o pagamento de uma comanda, atualizando seu status para 'PAGA',
  * registrando a forma de pagamento, e atualizando os totais do caixa aberto.
  * @param empresaId - ID da empresa.
  * @param comandaId - ID da comanda a ser paga.
  * @param usuarioId - ID do usuário processando o pagamento (Caixa ou AdminEmpresa).
  * @param dadosPagamento - Dados do pagamento, como a forma de pagamento.
  * @returns A comanda atualizada.
  */
    public static async processarPagamentoComanda(
        empresaId: number,
        comandaId: number,
        usuarioId: number, // Usuário que está processando o pagamento
        dadosPagamento: ProcessarPagamentoDTO
    ): Promise<Comanda> {
        const transaction = await sequelize.transaction();
        try {
            // 1. Buscar a comanda e garantir que pertence à empresa e está em um status apropriado
            //    (ABERTA ou talvez FECHADA se houver um fluxo de "fechar conta" antes de pagar)
            const comanda = await Comanda.findOne({
                where: {
                    id: comandaId,
                    empresaId,
                    status: { [Op.or]: [ComandaStatus.ABERTA, ComandaStatus.FECHADA] } // Permite pagar comanda aberta ou já "fechada para pagamento"
                },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!comanda) {
                await transaction.rollback();
                throw new AppError('Comanda não encontrada, não pertence à empresa ou não pode ser paga (verifique o status).', 404);
            }

            // 2. Validar forma de pagamento
            if (!Object.values(FormaPagamento).includes(dadosPagamento.formaPagamento)) {
                await transaction.rollback();
                throw new AppError(`Forma de pagamento inválida: ${dadosPagamento.formaPagamento}.`, 400);
            }

            // 3. Encontrar o caixa aberto para a empresa
            const caixaAberto = await Caixa.findOne({
                where: { empresaId, status: CaixaStatus.ABERTO },
                transaction,
                lock: transaction.LOCK.UPDATE, // Bloqueia o caixa para atualização de totais
            });

            if (!caixaAberto) {
                await transaction.rollback();
                throw new AppError('Nenhum caixa aberto encontrado para esta empresa. Não é possível processar o pagamento.', 400);
            }

            // 4. Atualizar a Comanda
            comanda.status = ComandaStatus.PAGA;
            comanda.formaPagamento = dadosPagamento.formaPagamento;
            comanda.dataFechamento = new Date(); // Define a data de fechamento/pagamento
            comanda.caixaId = caixaAberto.id; // Associa a comanda ao caixa que processou o pagamento
            // Considerar adicionar usuarioFechamentoId = usuarioId se relevante

            await comanda.save({ transaction });

            // 5. Atualizar os totais de Venda no Caixa
            const valorTotalComanda = Number(comanda.totalComanda);
            switch (dadosPagamento.formaPagamento) {
                case FormaPagamento.DINHEIRO:
                    caixaAberto.totalVendasDinheiro = Number(caixaAberto.totalVendasDinheiro) + valorTotalComanda;
                    break;
                case FormaPagamento.CARTAO_CREDITO:
                case FormaPagamento.CARTAO_DEBITO: // Agrupando cartões por enquanto
                    caixaAberto.totalVendasCartao = Number(caixaAberto.totalVendasCartao) + valorTotalComanda;
                    break;
                case FormaPagamento.PIX:
                    caixaAberto.totalVendasPix = Number(caixaAberto.totalVendasPix) + valorTotalComanda;
                    break;
                // Caso 'Outro', pode não ir para um total específico ou ir para um 'totalVendasOutros'
            }
            await caixaAberto.save({ transaction });

            await transaction.commit();
            return comanda; // Retorna a comanda atualizada

        } catch (error: any) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            console.error(`Erro ao processar pagamento da comanda ${comandaId} para empresa ${empresaId}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
            throw new AppError(`Falha ao processar pagamento da comanda: ${errorMessage}`, 500);
        }
    }
}

export default ComandaService;