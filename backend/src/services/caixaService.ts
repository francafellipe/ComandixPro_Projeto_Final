import sequelize from '../config/db.config';
import { fn, col } from 'sequelize';
import Caixa, { CaixaStatus, CaixaCreationAttributes } from '../models/caixa.schema';
import Empresa from '../models/empresa.schema';
import Usuario, { UserRole } from '../models/usuario.schema';
import MovimentacaoCaixa, { TipoMovimentacaoCaixa, MovimentacaoCaixaCreationAttributes } from '../models/movimentacaoCaixa.schema';
import Comanda, { ComandaStatus } from '../models/comanda.schema';
import AppError from '../utils/appError';

export interface AbrirCaixaDTO {
    saldoInicial: number;
    observacoesAbertura?: string | null;
}

export interface RegistrarMovimentacaoDTO {
    tipo: TipoMovimentacaoCaixa;
    valor: number;
    observacao?: string | null;
}

export interface FecharCaixaDTO {
    saldoFinalInformado: number;
    observacoesFechamento?: string | null;
}

class CaixaService {
    public static async abrirCaixa(
        empresaId: number,
        usuarioAberturaId: number,
        dadosAbertura: AbrirCaixaDTO
    ): Promise<Caixa> {
        const { saldoInicial, observacoesAbertura } = dadosAbertura;

        const empresa = await Empresa.findByPk(empresaId);
        if (!empresa) throw new AppError('Empresa não encontrada.', 404);

        const usuario = await Usuario.findByPk(usuarioAberturaId);
        if (!usuario) throw new AppError('Usuário de abertura não encontrado.', 404);

        if (usuario.empresaId !== empresaId && usuario.role !== UserRole.ADMIN_GLOBAL) {
            throw new AppError('Usuário não pertence à empresa informada.', 403);
        }

        const caixaAberto = await Caixa.findOne({ where: { empresaId, status: CaixaStatus.ABERTO } });
        if (caixaAberto) throw new AppError('Já existe um caixa aberto para esta empresa.', 409);

        if (typeof saldoInicial !== 'number' || saldoInicial < 0) {
            throw new AppError('Saldo inicial inválido.', 400);
        }

        try {
            const novoCaixa: CaixaCreationAttributes = {
                empresaId,
                usuarioAberturaId,
                saldoInicial,
                dataAbertura: new Date(),
                status: CaixaStatus.ABERTO,
                observacoesAbertura: observacoesAbertura || null,
                totalVendasDinheiro: 0,
                totalVendasCartao: 0,
                totalVendasPix: 0,
                totalSuprimentos: 0,
                totalSangrias: 0,
                saldoFinalCalculado: 0,
                diferencaCaixa: 0,
            };

            return await Caixa.create(novoCaixa);
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido.';
            throw new AppError(`Falha ao abrir o caixa: ${message}`, 500);
        }
    }

    public static async getStatusCaixaAtual(empresaId: number): Promise<Caixa | null> {
        try {
            return await Caixa.findOne({ 
                where: { empresaId, status: CaixaStatus.ABERTO },
                include: [
                    {
                        model: MovimentacaoCaixa,
                        as: 'movimentacoes',
                        attributes: ['id', 'tipo', 'valor', 'observacao', 'criadoEm'],
                        limit: 10,
                        order: [['criadoEm', 'DESC']]
                    }
                ]
            });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido.';
            throw new AppError(`Falha ao buscar status do caixa: ${message}`, 500);
        }
    }

    public static async registrarMovimentacao(
        empresaId: number,
        usuarioId: number,
        dadosMovimentacao: RegistrarMovimentacaoDTO
    ): Promise<MovimentacaoCaixa> {
        const { tipo, valor, observacao } = dadosMovimentacao;

        if (typeof valor !== 'number' || valor <= 0) {
            throw new AppError('O valor da movimentação deve ser um número positivo.', 400);
        }
        if (!Object.values(TipoMovimentacaoCaixa).includes(tipo)) {
            throw new AppError(`Tipo de movimentação inválido: ${tipo}.`, 400);
        }

        const transaction = await sequelize.transaction();
        try {
            const caixaAberto = await Caixa.findOne({
                where: { empresaId, status: CaixaStatus.ABERTO },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!caixaAberto) {
                await transaction.rollback();
                throw new AppError('Nenhum caixa aberto encontrado para registrar a movimentação.', 404);
            }

            const novaMovimentacaoData: MovimentacaoCaixaCreationAttributes = {
                caixaId: caixaAberto.id,
                tipo,
                valor,
                observacao: observacao || null,
                usuarioId,
                empresaId,
            };
            const novaMovimentacao = await MovimentacaoCaixa.create(novaMovimentacaoData, { transaction });

            if (tipo === TipoMovimentacaoCaixa.SUPRIMENTO) {
                caixaAberto.totalSuprimentos = (Number(caixaAberto.totalSuprimentos) + Number(valor));
            } else if (tipo === TipoMovimentacaoCaixa.SANGRIA) {
                caixaAberto.totalSangrias = (Number(caixaAberto.totalSangrias) + Number(valor));
            }
            await caixaAberto.save({ transaction });

            await transaction.commit();
            return novaMovimentacao;

        } catch (error: any) {
            await transaction.rollback();
            if (error instanceof AppError) throw error;
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido.';
            throw new AppError(`Falha ao registrar movimentação no caixa: ${errorMessage}`, 500);
        }
    }

    public static async fecharCaixa(
        empresaId: number,
        usuarioFechamentoId: number,
        dadosFechamento: FecharCaixaDTO
    ): Promise<Caixa> {
        const { saldoFinalInformado, observacoesFechamento } = dadosFechamento;

        const transaction = await sequelize.transaction();
        try {
            const caixa = await Caixa.findOne({
                where: { empresaId, status: CaixaStatus.ABERTO },
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!caixa) {
                await transaction.rollback();
                throw new AppError('Nenhum caixa aberto encontrado.', 404);
            }

            if (typeof saldoFinalInformado !== 'number' || saldoFinalInformado < 0) {
                await transaction.rollback();
                throw new AppError('Saldo final inválido.', 400);
            }

            const comandasAbertas = await Comanda.count({
                where: { empresaId, status: ComandaStatus.ABERTA },
                transaction,
            });

            if (comandasAbertas > 0) {
                await transaction.rollback();
                throw new AppError('Existem comandas abertas. Finalize-as antes de fechar o caixa.', 403);
            }

            const saldoCalculado =
                Number(caixa.saldoInicial) +
                Number(caixa.totalVendasDinheiro) +
                Number(caixa.totalVendasCartao) +
                Number(caixa.totalVendasPix) +
                Number(caixa.totalSuprimentos) -
                Number(caixa.totalSangrias);

            const diferenca = Number(saldoFinalInformado) - saldoCalculado;

            caixa.status = CaixaStatus.FECHADO;
            caixa.dataFechamento = new Date();
            caixa.usuarioFechamentoId = usuarioFechamentoId;
            caixa.saldoFinalCalculado = saldoCalculado;
            caixa.saldoFinalInformado = saldoFinalInformado;
            caixa.diferencaCaixa = diferenca;
            caixa.observacoesFechamento = observacoesFechamento || null;

            await caixa.save({ transaction });
            await transaction.commit();
            return caixa;
        } catch (error: any) {
            await transaction.rollback();
            const message = error instanceof Error ? error.message : 'Erro desconhecido.';
            throw new AppError(`Falha ao fechar o caixa: ${message}`, 500);
        }
    }

    public static async getDetalhesFechamento(empresaId: number): Promise<any> {
        try {
            const caixaAberto = await Caixa.findOne({
                where: { empresaId, status: CaixaStatus.ABERTO },
                include: [
                    {
                        model: MovimentacaoCaixa,
                        as: 'movimentacoes',
                        attributes: ['tipo', 'valor']
                    }
                ]
            });

            if (!caixaAberto) {
                throw new AppError('Nenhum caixa aberto encontrado.', 404);
            }

            const totalVendas = Number(caixaAberto.totalVendasDinheiro) + 
                               Number(caixaAberto.totalVendasCartao) + 
                               Number(caixaAberto.totalVendasPix);

            const saldoTeorico = Number(caixaAberto.saldoInicial) + 
                                Number(caixaAberto.totalVendasDinheiro) + 
                                Number(caixaAberto.totalSuprimentos) - 
                                Number(caixaAberto.totalSangrias);

            return {
                saldoInicial: Number(caixaAberto.saldoInicial),
                totalVendas: totalVendas,
                totalVendasDinheiro: Number(caixaAberto.totalVendasDinheiro),
                totalVendasCartao: Number(caixaAberto.totalVendasCartao),
                totalVendasPix: Number(caixaAberto.totalVendasPix),
                totalSuprimentos: Number(caixaAberto.totalSuprimentos),
                totalSangrias: Number(caixaAberto.totalSangrias),
                saldoTeorico: saldoTeorico
            };
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            const message = error instanceof Error ? error.message : 'Erro desconhecido.';
            throw new AppError(`Falha ao buscar detalhes de fechamento: ${message}`, 500);
        }
    }

    public static async getRelatorioCaixa(caixaId: number, empresaId: number): Promise<any> {
        const caixa = await Caixa.findOne({
            where: {
                id: caixaId,
                empresaId
            }
        });

        if (!caixa) throw new AppError('Caixa não encontrado para esta empresa.', 404);

        const movimentacoes = await MovimentacaoCaixa.findAll({
            where: { caixaId: caixa.id },
            attributes: ['tipo', [fn('SUM', col('valor')), 'total']],
            group: ['tipo'],
            raw: true
        });

        const totaisPorTipo: Record<string, number> = {};
        movimentacoes.forEach(m => {
            totaisPorTipo[m.tipo] = parseFloat((m as unknown as { tipo: string; total: string }).total || '0');
        });

        return {
            caixaId: caixa.id,
            empresaId: caixa.empresaId,
            status: caixa.status,
            dataAbertura: caixa.dataAbertura,
            dataFechamento: caixa.dataFechamento,
            saldoInicial: caixa.saldoInicial,
            saldoFinalCalculado: caixa.saldoFinalCalculado,
            saldoFinalInformado: caixa.saldoFinalInformado,
            diferencaCaixa: caixa.diferencaCaixa,
            totalVendasDinheiro: caixa.totalVendasDinheiro,
            totalVendasCartao: caixa.totalVendasCartao,
            totalVendasPix: caixa.totalVendasPix,
            totalSuprimentos: caixa.totalSuprimentos,
            totalSangrias: caixa.totalSangrias,
            totaisPorMovimentacao: totaisPorTipo,
            observacoesAbertura: caixa.observacoesAbertura,
            observacoesFechamento: caixa.observacoesFechamento
        };
    }
}

export default CaixaService;