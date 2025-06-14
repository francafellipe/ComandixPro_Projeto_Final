// src/models/index.ts
import sequelize from '../config/db.config'; // Sua instância do Sequelize

// Importe todas as classes dos modelos
import Product from './product.schema';
import Categoria from './categoria.schema';
import Empresa from './empresa.schema';
import Usuario from './usuario.schema';
import Caixa from './caixa.schema';
import MovimentacaoCaixa from './movimentacaoCaixa.schema';
import Comanda from './comanda.schema';
import ItemComanda from './itemComanda.schema';

// Crie um objeto para agrupar os modelos e a instância do sequelize
const db = {
  sequelize,
  Sequelize: require('sequelize'), // Para acesso ao construtor Sequelize e DataTypes se necessário
  Empresa,
  Usuario,
  Product,
  Caixa,
  MovimentacaoCaixa,
  Comanda,
  ItemComanda,
  Categoria,
};

// DEFINA TODAS AS ASSOCIAÇÕES AQUI:

// Empresa
Empresa.hasMany(Usuario, { foreignKey: 'empresaId', as: 'usuarios' });
Empresa.hasMany(Product, { foreignKey: 'empresaId', as: 'produtos' });
Empresa.hasMany(Caixa, { foreignKey: 'empresaId', as: 'caixas' });
Empresa.hasMany(Comanda, { foreignKey: 'empresaId', as: 'comandas' });
Empresa.hasMany(Categoria, {
  foreignKey: 'empresaId',
  as: 'categorias',
});
// MovimentacaoCaixa tem empresaId, então Empresa.hasMany(MovimentacaoCaixa) também é possível
Empresa.hasMany(MovimentacaoCaixa, { foreignKey: 'empresaId', as: 'movimentacoesCaixaDaEmpresa' });


// Usuario
Usuario.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });
Usuario.hasMany(Caixa, { foreignKey: 'usuarioAberturaId', as: 'caixasAbertosPorMim' });
Usuario.hasMany(Caixa, { foreignKey: 'usuarioFechamentoId', as: 'caixasFechadosPorMim' });
Usuario.hasMany(MovimentacaoCaixa, { foreignKey: 'usuarioId', as: 'movimentacoesCaixaFeitasPorMim' });
Usuario.hasMany(Comanda, { foreignKey: 'usuarioAberturaId', as: 'comandasAbertasPorMim' });

// Product
Product.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });
Product.hasMany(ItemComanda, { foreignKey: 'produtoId', as: 'emItensDeComanda' });
Product.belongsTo(Categoria, {
  foreignKey: 'categoriaId',
  as: 'categoria',
});

// Caixa
Caixa.belongsTo(Usuario, { foreignKey: 'usuarioAberturaId', as: 'usuarioAbertura' });
Caixa.belongsTo(Usuario, { foreignKey: 'usuarioFechamentoId', as: 'usuarioFechamento' });
Caixa.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });
Caixa.hasMany(MovimentacaoCaixa, { foreignKey: 'caixaId', as: 'movimentacoes' });
Caixa.hasMany(Comanda, { foreignKey: 'caixaId', as: 'comandasDoCaixa' });

// MovimentacaoCaixa
MovimentacaoCaixa.belongsTo(Caixa, { foreignKey: 'caixaId', as: 'caixa' });
MovimentacaoCaixa.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
MovimentacaoCaixa.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' }); // Já que tem empresaId direto

// Comanda
Comanda.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });
Comanda.belongsTo(Usuario, { foreignKey: 'usuarioAberturaId', as: 'usuarioAbertura' });
Comanda.belongsTo(Caixa, { foreignKey: 'caixaId', as: 'caixa' });
Comanda.hasMany(ItemComanda, { foreignKey: 'comandaId', as: 'itensComanda', onDelete: 'CASCADE' });

// ItemComanda
ItemComanda.belongsTo(Comanda, { foreignKey: 'comandaId', as: 'comanda' });
ItemComanda.belongsTo(Product, { foreignKey: 'produtoId', as: 'produto' });
ItemComanda.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });

Categoria.belongsTo(Empresa, {
  foreignKey: 'empresaId',
  as: 'empresa',
});

// Categoria tem muitos produtos
Categoria.hasMany(Product, {
  foreignKey: 'categoriaId',
  as: 'produtos',
});

export default db;