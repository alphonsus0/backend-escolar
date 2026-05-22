/* ================================================== */
/* DASHBOARD.JS - Página Inicial */
/* ================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Verifica autenticação
  if (!window.auth.initAuth(true)) return;
  
  // Inicializa componentes
  window.ui.Sidebar.init();
  window.auth.updateUserUI();
  
  // Carrega estatísticas
  await loadDashboardStats();
  
  // Configura logout
  setupLogout();
});

/**
 * Carrega estatísticas do dashboard
 */
async function loadDashboardStats() {
  const statsContainer = document.getElementById('stats-container');
  if (!statsContainer) return;
  
  try {
    // Carrega contagens de cada entidade
    const [alunos, professores, disciplinas, turmas, matriculas] = await Promise.all([
      getData('alunos').catch(() => []),
      getData('professores').catch(() => []),
      getData('disciplinas').catch(() => []),
      getData('turmas').catch(() => []),
      getData('matriculas').catch(() => [])
    ]);
    
    const stats = [
      {
        title: 'Alunos',
        value: Array.isArray(alunos) ? alunos.length : 0,
        icon: 'users',
        color: 'blue',
        link: '/frontend/pages/alunos.html'
      },
      {
        title: 'Professores',
        value: Array.isArray(professores) ? professores.length : 0,
        icon: 'user-check',
        color: 'green',
        link: '/frontend/pages/professores.html'
      },
      {
        title: 'Disciplinas',
        value: Array.isArray(disciplinas) ? disciplinas.length : 0,
        icon: 'book',
        color: 'orange',
        link: '/frontend/pages/disciplinas.html'
      },
      {
        title: 'Turmas',
        value: Array.isArray(turmas) ? turmas.length : 0,
        icon: 'layers',
        color: 'purple',
        link: '/frontend/pages/turmas.html'
      }
    ];
    
    statsContainer.innerHTML = stats.map(stat => `
      <a href="${stat.link}" class="stat-card">
        <div class="stat-info">
          <h4>${stat.title}</h4>
          <div class="stat-value">${stat.value}</div>
          <div class="stat-change positive">
            <span>Total cadastrado</span>
          </div>
        </div>
        <div class="stat-icon ${stat.color}">
          ${getIcon(stat.icon)}
        </div>
      </a>
    `).join('');
    
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    window.ui.Toast.error('Erro ao carregar estatísticas do dashboard');
  }
}

/**
 * Configura botão de logout
 */
function setupLogout() {
  const logoutBtns = document.querySelectorAll('.btn-logout, [data-action="logout"]');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.ui.Modal.confirm({
        title: 'Sair do sistema',
        message: 'Deseja realmente sair do sistema?',
        type: 'warning',
        confirmText: 'Sair',
        onConfirm: () => window.auth.logout()
      });
    });
  });
}

/**
 * Retorna ícone SVG
 */
function getIcon(name) {
  const icons = {
    'users': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'user-check': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
    'book': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    'layers': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>'
  };
  return icons[name] || '';
}
