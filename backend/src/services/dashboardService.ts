
import Comanda, { ComandaStatus } from '../models/comanda.schema';
import Caixa, { CaixaStatus } from '../models/caixa.schema';
import AppError from '../utils/appError';
import { Op } from 'sequelize';

export interface DashboardData {
    comandasAbertas: number;
    vendasHoje: number;
    statusMesas: Array<{
        mesa: string;
        status: string;
        total: number;
    }>;
    pedidosRecentes: Array<{
        id: number;
        mesa: string;
        cliente: string;
        total: number;
        status: string;
        dataAbertura: Date;
    }>;
}

class DashboardService {
    public static async getDashboard(empresaId: number): Promise<DashboardData> {
        try {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const fimHoje = new Date(hoje);
            fimHoje.setHours(23, 59, 59, 999);

            const comandasAbertas = await Comanda.count({
                where: {
                    empresaId,
                    status: ComandaStatus.ABERTA
                }
            });

            const vendasHojeResult = await Comanda.findAll({
                where: {
                    empresaId,
                    status: ComandaStatus.PAGA,
                    dataFechamento: {
                        [Op.between]: [hoje, fimHoje]
                    }
                },
                attributes: ['totalComanda']
            });

            const vendasHoje = vendasHojeResult.reduce((total, comanda) => {
                return total + Number(comanda.totalComanda);
            }, 0);

            const statusMesas = await Comanda.findAll({
                where: {
                    empresaId,
                    status: ComandaStatus.ABERTA,
                    mesa: { [Op.ne]: null }
                },
                attributes: ['mesa', 'status', 'totalComanda'],
                order: [['mesa', 'ASC']]
            });

            const pedidosRecentes = await Comanda.findAll({
                where: { empresaId },
                limit: 5,
                order: [['dataAbertura', 'DESC']],
                attributes: ['id', 'mesa', 'nomeCliente', 'totalComanda', 'status', 'dataAbertura']
            });

            return {
                comandasAbertas,
                vendasHoje,
                statusMesas: statusMesas.map(mesa => ({
                    mesa: mesa.mesa || 'S/N',
                    status: mesa.status,
                    total: Number(mesa.totalComanda)
                })),
                pedidosRecentes: pedidosRecentes.map(pedido => ({
                    id: pedido.id,
                    mesa: pedido.mesa || 'S/N',
                    cliente: pedido.nomeCliente || 'Cliente',
                    total: Number(pedido.totalComanda),
                    status: pedido.status,
                    dataAbertura: pedido.dataAbertura
                }))
            };

        } catch (error: any) {
            console.error(`Erro ao buscar dados do dashboard para empresa ${empresaId}:`, error);
            throw new AppError(`Falha ao buscar dados do dashboard: ${error.message}`, 500);
        }
    }
}

export default DashboardService;
