const express = require('express');
const app = express();
app.use(express.json());

// Permite requisições do frontend (CORS básico)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Rota para consulta à Perplexity (simulada por enquanto)
app.post('/consulta-perplexity', async (req, res) => {
  console.log('Recebido:', req.body);
  res.json({ 
    mensagem: 'Backend ONA funcionando!', 
    sugestao: 'Projeto cultural simulado pela IA',
    recebido: req.body 
  });
});

// Rota para consulta ao SALIC (simulada)
app.post('/consulta-salic', async (req, res) => {
  res.json({
    projetos_similares: [
      { nome: 'Projeto Exemplo 1', valor: 'R$ 100.000' },
      { nome: 'Projeto Exemplo 2', valor: 'R$ 200.000' }
    ]
  });
});

// Rota de teste
app.get('/', (req, res) => {
  res.json({ status: 'API ONA rodando perfeitamente!' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Backend ONA rodando na porta ${port}`);
});

module.exports = app;
