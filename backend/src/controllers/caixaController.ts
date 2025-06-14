import { Request, Response, NextFunction } from 'express';
import CaixaService, {
  AbrirCaixaDTO,
  RegistrarMovimentacaoDTO,
  FecharCaixaDTO,
} from '../services/caixaService';
import AppError from '../utils/appError';
import { TipoMovimentacaoCaixa } from '../models/movimentacaoCaixa.schema';
import { AuthenticatedRequest } from '../types';

class CaixaController {
  public static async abrirCaixa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId == null || req.user.userId == null) {
        throw new AppError('Informações da empresa ou do usuário não encontradas na autenticação.', 403);
      }

      const { saldoInicial, observacoesAbertura } = req.body as AbrirCaixaDTO;

      if (saldoInicial === undefined || typeof saldoInicial !== 'number' || saldoInicial < 0) {
        throw new AppError('Saldo inicial é obrigatório e deve ser um número não negativo.', 400);
      }

      if (observacoesAbertura !== undefined && typeof observacoesAbertura !== 'string') {
        throw new AppError('Observações de abertura, se fornecidas, devem ser uma string.', 400);
      }

      const dadosAbertura: AbrirCaixaDTO = { saldoInicial, observacoesAbertura };
      const novoCaixa = await CaixaService.abrirCaixa(req.user.empresaId, req.user.userId, dadosAbertura);

      res.status(201).json({
        message: 'Caixa aberto com sucesso!',
        caixa: novoCaixa,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getStatusCaixaAtual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId == null) {
        throw new AppError('Informações da empresa do usuário não encontradas na autenticação.', 403);
      }

      const caixaAberto = await CaixaService.getStatusCaixaAtual(req.user.empresaId);

      res.status(200).json(
        caixaAberto
          ? { status: 'aberto', caixa: caixaAberto }
          : { status: 'fechado', message: 'Nenhum caixa aberto para esta empresa no momento.' }
      );
    } catch (error) {
      next(error);
    }
  }

  public static async registrarMovimentacao(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId == null || req.user.userId == null) {
        throw new AppError('Informações da empresa ou do usuário não encontradas na autenticação.', 403);
      }

      const { tipo, valor, observacao } = req.body as RegistrarMovimentacaoDTO;

      if (!tipo || !Object.values(TipoMovimentacaoCaixa).includes(tipo as TipoMovimentacaoCaixa)) {
        throw new AppError(
          `Tipo de movimentação inválido. Valores permitidos: ${Object.values(TipoMovimentacaoCaixa).join(', ')}.`,
          400
        );
      }

      if (valor === undefined || typeof valor !== 'number' || valor <= 0) {
        throw new AppError('Valor da movimentação é obrigatório e deve ser um número positivo.', 400);
      }

      if (observacao !== undefined && typeof observacao !== 'string') {
        throw new AppError('Observação, se fornecida, deve ser uma string.', 400);
      }

      const dados: RegistrarMovimentacaoDTO = { tipo, valor, observacao };
      const novaMovimentacao = await CaixaService.registrarMovimentacao(req.user.empresaId, req.user.userId, dados);

      res.status(201).json({
        message: `Movimentação do tipo '${tipo}' registrada com sucesso!`,
        movimentacao: novaMovimentacao,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async fecharCaixa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId == null || req.user.userId == null) {
        throw new AppError('Informações da empresa ou do usuário não encontradas na autenticação.', 403);
      }

      const { saldoFinalInformado, observacoesFechamento } = req.body as FecharCaixaDTO;

      if (saldoFinalInformado === undefined || typeof saldoFinalInformado !== 'number' || saldoFinalInformado < 0) {
        throw new AppError('Saldo final informado é obrigatório e deve ser um número não negativo.', 400);
      }

      if (observacoesFechamento !== undefined && typeof observacoesFechamento !== 'string') {
        throw new AppError('Observações de fechamento, se fornecidas, devem ser uma string.', 400);
      }

      const dadosFechamento: FecharCaixaDTO = { saldoFinalInformado, observacoesFechamento };
      const caixaFechado = await CaixaService.fecharCaixa(req.user.empresaId, req.user.userId, dadosFechamento);

      res.status(200).json({
        message: 'Caixa fechado com sucesso!',
        caixa: caixaFechado,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getDetalhesFechamento(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId == null) {
        throw new AppError('Informações da empresa do usuário não encontradas na autenticação.', 403);
      }

      const detalhes = await CaixaService.getDetalhesFechamento(req.user.empresaId);
      res.status(200).json(detalhes);
    } catch (error) {
      next(error);
    }
  }

  public static async getRelatorioCaixa(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || req.user.empresaId == null) {
        throw new AppError('Informações da empresa do usuário não encontradas na autenticação.', 403);
      }

      const caixaId = parseInt(req.params.caixaId, 10);

      if (isNaN(caixaId)) {
        throw new AppError('ID do caixa inválido fornecido na rota.', 400);
      }

      const relatorio = await CaixaService.getRelatorioCaixa(req.user.empresaId, caixaId);

      if (!relatorio) {
        throw new AppError('Relatório de caixa não encontrado ou não pertence a esta empresa.', 404);
      }

      res.status(200).json(relatorio);
    } catch (error) {
      next(error);
    }
  }
}

export default CaixaController;
