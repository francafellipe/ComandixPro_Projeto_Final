// src/validators/relatorio.validator.ts
import { z } from 'zod';

// Schema Zod para validar os query parameters da rota de relatório de vendas
export const getRelatorioVendasQuerySchema = z.object({
  query: z.object({
    dataInicio: z.string({ required_error: "dataInicio é obrigatória na query string." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de dataInicio inválido. Use YYYY-MM-DD." }),
    dataFim: z.string({ required_error: "dataFim é obrigatória na query string." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Formato de dataFim inválido. Use YYYY-MM-DD." })
  }).refine(data => {
    // Validação adicional para garantir que dataFim não seja anterior a dataInicio
    // A transformação para Date já foi feita no service, aqui validamos as strings
    // Se as datas forem inválidas (ex: 2023-13-01), a regex já pega.
    // Esta refine é para a relação entre as datas.
    const inicio = new Date(data.dataInicio + "T00:00:00Z"); // Use Z para evitar problemas de fuso local na comparação
    const fim = new Date(data.dataFim + "T00:00:00Z");
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
        return false; // Se as datas forem inválidas após a regex (improvável), mas para segurança
    }
    return fim >= inicio;
  }, { message: "dataFim deve ser igual ou posterior a dataInicio.", path: ['dataFim'] }) // path para o erro ser associado a dataFim
});

// Adicionar aqui outros schemas de validação para relatórios no futuro