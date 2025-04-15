// api-cotacao.js
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para processar JSON no corpo das requisições
app.use(bodyParser.json());

// Cache em memória para armazenar o histórico de cotações
const historicoCotacoes = [];

// GET /cotacao - buscar a cotação atual em API pública
app.get('/cotacao', async (req, res) => {  
    try {
      console.log('Tentando API...');
      const moedaBase = req.query.moeda?.toUpperCase() || 'EUR';
      const fallbackResponse = await axios.get(`https://open.er-api.com/v6/latest/${moedaBase}`);
      
      if (fallbackResponse.data && fallbackResponse.data.rates && fallbackResponse.data.rates.BRL) {
        const cotacao = {
          moeda: moedaBase,
          valor: fallbackResponse.data.rates.BRL,
          data: new Date(),
          fonte: 'API open.er-api.com'
        };
        
        historicoCotacoes.push(cotacao);
        return res.json(cotacao);
      }
    } catch (fallbackError) {
      console.error('Erro na API:', fallbackError.message);
    }
    
    res.status(500).json({ 
      erro: 'Falha ao buscar cotação', 
      detalhes: error.message,
      sugestao: 'Tente novamente mais tarde ou use o endpoint POST /cotacao para registrar manualmente.'
    });
  }
);

// POST /cotacao - registrar uma cotação manual
app.post('/cotacao', (req, res) => {
  try {
    const { moeda, valor } = req.body;
    
    // Validação dos dados recebidos
    if (!moeda || !valor || isNaN(valor)) {
      return res.status(400).json({ 
        erro: 'Dados inválidos', 
        mensagem: 'Forneça uma moeda válida e um valor numérico'
      });
    }
    
    const cotacao = {
      moeda: moeda.toUpperCase(),
      valor: parseFloat(valor),
      data: new Date(),
      fonte: 'Manual'
    };
    
    // Adicionar ao histórico
    historicoCotacoes.push(cotacao);
    
    res.status(201).json({
      mensagem: 'Cotação registrada com sucesso',
      cotacao
    });
  } catch (error) {
    console.error('Erro ao registrar cotação:', error.message);
    res.status(500).json({ erro: 'Falha ao registrar cotação', detalhes: error.message });
  }
});

// GET /historico - retorna todas as cotações registradas em cache
app.get('/historico', (req, res) => {
  res.json({
    total: historicoCotacoes.length,
    cotacoes: historicoCotacoes
  });
});

// Rota de teste para verificar se o servidor está funcionando
app.get('/teste', (req, res) => {
  res.json({ 
    status: 'Servidor funcionando corretamente!'
  });
});

// Rota para informação sobre o serviço
app.get('/', (req, res) => {
  res.json({
    servico: 'API de Cotação de Moedas',
    endpoints: [
      { metodo: 'GET', path: '/cotacao', descricao: 'Consulta cotação atual (parâmetro opcional: ?moeda=USD)' },
      { metodo: 'POST', path: '/cotacao', descricao: 'Registra cotação manual', body: { moeda: 'USD', valor: 5.25 } },
      { metodo: 'GET', path: '/historico', descricao: 'Lista todas as cotações registradas' },
      { metodo: 'GET', path: '/teste', descricao: 'Verifica o status do servidor' }
    ],
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Informações sobre a API: http://localhost:${PORT}/`);
  console.log(`Teste o servidor em: http://localhost:${PORT}/teste`);
  console.log(`Consulte cotações em: http://localhost:${PORT}/cotacao`);
});