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

// Rota para consulta à IA (Groq + Llama 3.1 GRATUITO)
app.post('/consulta-perplexity', async (req, res) => {
  console.log('Recebido:', req.body);
  
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('GROQ_API_KEY não configurada');
    }
    
    // Chamada real ao Groq (GRATUITO)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em Lei Rouanet e projetos culturais no Brasil. Seja específico, prático e focado nos aspectos legais e estratégicos da Lei 8.313/91.'
          },
          {
            role: 'user',
            content: req.body.texto || 'Ajude-me com meu projeto cultural para Lei Rouanet'
          }
        ],
        model: 'llama-3.1-8b-instant',  // MODELO GRATUITO E RÁPIDO
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    res.json({
      sugestao: data.choices[0]?.message?.content || 'Erro na consulta à IA',
      fonte: 'Groq + Llama 3.1 (Gratuito)',
      modelo: 'llama-3.1-8b-instant'
    });

  } catch (error) {
    console.error('Erro:', error);
    res.json({
      sugestao: 'Simulação: Seu projeto está bem estruturado! Considere adicionar mais contrapartidas sociais para aumentar a pontuação na Lei Rouanet.',
      erro: error.message,
      fonte: 'Fallback (simulado)'
    });
  }
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
