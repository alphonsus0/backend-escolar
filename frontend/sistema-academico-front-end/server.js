const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos do diretório frontend
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Redireciona a raiz para a página de login
app.get('/', (req, res) => {
  res.redirect('/frontend/login.html');
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎓 Sistema Acadêmico Frontend                            ║
║                                                            ║
║   Servidor rodando em: http://localhost:${PORT}              ║
║                                                            ║
║   Páginas disponíveis:                                     ║
║   • Login: http://localhost:${PORT}/frontend/login.html      ║
║   • Dashboard: http://localhost:${PORT}/frontend/index.html  ║
║                                                            ║
║   ⚠️  Certifique-se que o backend FastAPI está rodando     ║
║       em http://127.0.0.1:8001                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
