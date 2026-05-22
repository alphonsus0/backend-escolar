/* ================================================== */
/* AUTH.JS - Autenticação e Proteção de Rotas */
/* ================================================== */

const AUTH_CONFIG = {
  tokenKey: 'access_token',
  userDataKey: 'user_data',
  loginPage: '/frontend/login.html',
  dashboardPage: '/frontend/index.html'
};

/**
 * Verifica se o usuário está autenticado
 */
function isAuthenticated() {
  const token = localStorage.getItem(AUTH_CONFIG.tokenKey);
  return !!token;
}

/**
 * Obtém os dados do usuário logado
 */
function getUserData() {
  const userData = localStorage.getItem(AUTH_CONFIG.userDataKey);
  return userData ? JSON.parse(userData) : null;
}

/**
 * Salva os dados de autenticação
 */
function saveAuthData(token, userData = null) {
  localStorage.setItem(AUTH_CONFIG.tokenKey, token);
  if (userData) {
    localStorage.setItem(AUTH_CONFIG.userDataKey, JSON.stringify(userData));
  }
}

/**
 * Remove os dados de autenticação (logout)
 */
function clearAuthData() {
  localStorage.removeItem(AUTH_CONFIG.tokenKey);
  localStorage.removeItem(AUTH_CONFIG.userDataKey);
}

/**
 * Realiza o login
 */
async function login(username, password) {
  try {
    const response = await window.api.postData('/auth/login', {
      username,
      password
    }, true); // true para form-urlencoded
    
    if (response && response.access_token) {
      saveAuthData(response.access_token, response.user || { username });
      return { success: true };
    }
    
    throw new Error('Resposta inválida do servidor');
  } catch (error) {
    console.error('Erro no login:', error);
    return { 
      success: false, 
      error: error.message || 'Erro ao realizar login'
    };
  }
}

/**
 * Realiza o logout
 */
function logout() {
  clearAuthData();
  window.location.href = AUTH_CONFIG.loginPage;
}

/**
 * Protege a página atual (redireciona se não autenticado)
 */
function protectRoute() {
  if (!isAuthenticated()) {
    window.location.href = AUTH_CONFIG.loginPage;
    return false;
  }
  return true;
}

/**
 * Redireciona para dashboard se já estiver autenticado
 */
function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = AUTH_CONFIG.dashboardPage;
    return true;
  }
  return false;
}

/**
 * Inicializa a verificação de autenticação
 */
function initAuth(requireAuth = true) {
  if (requireAuth) {
    return protectRoute();
  }
  return true;
}

/**
 * Atualiza a UI com informações do usuário
 */
function updateUserUI() {
  const userData = getUserData();
  const userNameEl = document.querySelector('.user-name');
  const userAvatarEl = document.querySelector('.user-avatar');
  
  if (userData && userNameEl) {
    userNameEl.textContent = userData.username || userData.nome || 'Usuário';
  }
  
  if (userData && userAvatarEl) {
    const initials = (userData.username || userData.nome || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    userAvatarEl.textContent = initials;
  }
}

// Exporta as funções para uso global
window.auth = {
  isAuthenticated,
  getUserData,
  saveAuthData,
  clearAuthData,
  login,
  logout,
  protectRoute,
  redirectIfAuthenticated,
  initAuth,
  updateUserUI,
  AUTH_CONFIG
};

// ==========================================
// FUNÇÕES GLOBAIS DE COMPATIBILIDADE
// ==========================================

/**
 * Verifica autenticação e redireciona se necessário
 * Chamada no início de cada página protegida
 */
function checkAuth() {
  if (!isAuthenticated()) {
    window.location.href = AUTH_CONFIG.loginPage;
    return false;
  }
  updateUserUI();
  return true;
}
