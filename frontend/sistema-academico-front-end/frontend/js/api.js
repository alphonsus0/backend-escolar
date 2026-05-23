/* ================================================== */
/* API.JS - Funções centralizadas para consumo da API */
/* ================================================== */

const API_BASE_URL = 'http://172.20.11';

/**
 * Obtém o token de autenticação do localStorage
 */
function getAuthToken() {
  return localStorage.getItem('access_token');
}

/**
 * Configura os headers padrão para as requisições
 */
function getHeaders(includeAuth = true, isFormData = false) {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

/**
 * Trata erros da API
 */
async function handleResponse(response) {
  if (response.status === 401) {
    // Token expirado ou inválido
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    window.location.href = '/frontend/login.html';
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.detail || errorData.message || `Erro HTTP: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  // Verifica se há conteúdo na resposta
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  
  return null;
}

/**
 * Normaliza o endpoint para garantir que comece com /
 */
function normalizeEndpoint(endpoint) {
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint;
  }
  return endpoint;
}

/**
 * Requisição GET
 */
async function getData(endpoint, params = {}) {
  try {
    endpoint = normalizeEndpoint(endpoint);
    let url = `${API_BASE_URL}${endpoint}`;
    
    // Adiciona parâmetros de query string se existirem
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro na requisição GET:', error);
    throw error;
  }
}

/**
 * Requisição POST
 */
async function postData(endpoint, data = {}, isFormUrlEncoded = false) {
  try {
    endpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${endpoint}`;
    
    let body;
    let headers;
    
    if (isFormUrlEncoded) {
      // Para autenticação OAuth2
      body = new URLSearchParams(data).toString();
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
      const token = getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } else {
      body = JSON.stringify(data);
      headers = getHeaders();
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro na requisição POST:', error);
    throw error;
  }
}

/**
 * Requisição PUT
 */
async function putData(endpoint, data = {}) {
  try {
    endpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro na requisição PUT:', error);
    throw error;
  }
}

/**
 * Requisição DELETE
 */
async function deleteData(endpoint) {
  try {
    endpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro na requisição DELETE:', error);
    throw error;
  }
}

/**
 * Requisição PATCH
 */
async function patchData(endpoint, data = {}) {
  try {
    endpoint = normalizeEndpoint(endpoint);
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error('Erro na requisição PATCH:', error);
    throw error;
  }
}

// Exporta as funções para uso global
window.api = {
  getData,
  postData,
  putData,
  deleteData,
  patchData,
  getAuthToken,
  API_BASE_URL
};
