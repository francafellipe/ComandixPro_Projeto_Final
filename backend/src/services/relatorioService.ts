// src/services/relatorioService.ts
import sequelize from '../config/db.config';
import { Op, fn, col, literal } from 'sequelize'; // fn, col, literal para agregações
import Comanda, { ComandaStatus, FormaPagamento } from '../models/comanda.schema';
import Empresa from '../models/empresa.schema'; // Para verificar a empresa
import AppError from '../utils/appError';

// DTO para a resposta do relatório de vendas
export interface VendasPorFormaPagamentoDTO {
  [key: string]: number; // Ex: { 'Dinheiro': 150.00, 'Cartão de Crédito': 300.50 }
}

export interface RelatorioVendasResponseDTO {
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  empresaId: number;
  totalVendidoBruto: number;         // Soma de todas as comandas pagas
  numeroComandasPagas: number;
  ticketMedio: number;
  vendasPorFormaPagamento: VendasPorFormaPagamentoDTO;
  // Poderíamos adicionar mais detalhes, como produtos mais vendidos, etc. no futuro
}

class RelatorioService {
  /**
   * Gera um relatório de vendas para uma empresa em um determinado período.
   * @param empresaId - ID da empresa.
   * @param dataInicio - Data de início do período (YYYY-MM-DD).
   * @param dataFim - Data de fim do período (YYYY-MM-DD).
   * @returns O objeto do relatório de vendas.
   */
  public static async getRelatorioVendas(
    empresaId: number,
    dataInicio: string,
    dataFim: string
  ): Promise<RelatorioVendasResponseDTO> {
    // Validar se a empresa existe
    const empresa = await Empresa.findByPk(empresaId);
    if (!empresa) {
      throw new AppError('Empresa não encontrada.', 404);
    }

    // Formatar datas para incluir o dia inteiro
    const inicioPeriodo = new Date(`${dataInicio}T00:00:00.000Z`); // UTC para consistência
    const fimPeriodo = new Date(`${dataFim}T23:59:59.999Z`);   // UTC para consistência

    if (isNaN(inicioPeriodo.getTime()) || isNaN(fimPeriodo.getTime())) {
        throw new AppError('Formato de data inválido. Use YYYY-MM-DD.', 400);
    }
    if (fimPeriodo < inicioPeriodo) {
        throw new AppError('A data final não pode ser anterior à data inicial.', 400);
    }


    try {
      // Buscar todas as comandas PAGAS dentro do período para a empresa
      const comandasPagas = await Comanda.findAll({
        where: {
          empresaId,
          status: ComandaStatus.PAGA,
          dataFechamento: { // Usar dataFechamento pois é quando o pagamento é confirmado
            [Op.between]: [inicioPeriodo, fimPeriodo],
          },
        },
        attributes: [
          // Contar o número de comandas pagas
          [fn('COUNT', col('id')), 'numeroComandasPagas'],
          // Somar o total de todas as comandas pagas
          [fn('SUM', col('totalComanda')), 'totalVendidoBruto'],
        ],
        raw: true, // Retorna dados puros para agregações
      });

      // O resultado de agregações com raw:true é um array com um objeto,
      // ou um array vazio se não houver resultados.
      // Precisamos tratar os valores que podem ser null se não houver comandas.
      const agregadosBase = (comandasPagas[0] as any) || {};
      const numeroComandasPagas = parseInt(agregadosBase.numeroComandasPagas, 10) || 0;
      const totalVendidoBruto = parseFloat(agregadosBase.totalVendidoBruto) || 0;

      // Calcular ticket médio
      const ticketMedio = numeroComandasPagas > 0 ? totalVendidoBruto / numeroComandasPagas : 0;

      // Buscar vendas agrupadas por forma de pagamento
      const vendasPorFormaPagamentoRaw = await Comanda.findAll({
        where: {
          empresaId,
          status: ComandaStatus.PAGA,
          dataFechamento: {
            [Op.between]: [inicioPeriodo, fimPeriodo],
          },
          formaPagamento: { [Op.not]: null } // Apenas onde a forma de pagamento foi definida
        },
        attributes: [
          'formaPagamento',
          [fn('SUM', col('totalComanda')), 'total'],
        ],
        group: ['formaPagamento'],
        raw: true,
      });

      const vendasPorFormaPagamento: VendasPorFormaPagamentoDTO = {};
      (vendasPorFormaPagamentoRaw as any[]).forEach(item => {
        if (item.formaPagamento) { // Garante que formaPagamento não é null
          vendasPorFormaPagamento[item.formaPagamento as string] = parseFloat(item.total);
        }
      });

      return {
        periodo: { dataInicio, dataFim },
        empresaId,
        totalVendidoBruto: parseFloat(totalVendidoBruto.toFixed(2)),
        numeroComandasPagas,
        ticketMedio: parseFloat(ticketMedio.toFixed(2)),
        vendasPorFormaPagamento,
      };

    } catch (error: any) {
      console.error(`Erro ao gerar relatório de vendas para empresa ${empresaId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Detalhes do erro não disponíveis.';
      throw new AppError(`Falha ao gerar relatório de vendas: ${errorMessage}`, 500);
    }
  }

  // --- Outros métodos de relatório (ex: produtos mais vendidos) virão aqui ---
}

export default RelatorioService;