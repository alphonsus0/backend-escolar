/* ================================================== */
/* ALUNOS.JS - CRUD de Alunos */
/* ================================================== */

const ENDPOINT = '/alunos';
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Verifica autenticação
  if (!window.auth.initAuth(true)) return;
  
  // Inicializa componentes
  window.ui.Sidebar.init();
  window.auth.updateUserUI();
  
  // Configura eventos
  setupEventListeners();
  
  // Carrega dados
  await loadData();
  
  // Configura logout
  setupLogout();
});

/**
 * Configura event listeners
 */
function setupEventListeners() {
  // Botão novo
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  
  // Formulário
  document.getElementById('form-entity').addEventListener('submit', handleSubmit);
  
  // Fechar modal
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  
  // Busca
  document.getElementById('search-input').addEventListener('input', handleSearch);
  
  // Clique fora do modal
  document.getElementById('modal-form').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });
}

/**
 * Carrega dados da API
 */
async function loadData() {
  const tableBody = document.getElementById('table-body');
  const tableCount = document.getElementById('table-count');
  
  // Loading state
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center" style="padding: 3rem;">
        <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
        <p style="margin-top: 1rem; color: var(--text-secondary);">Carregando dados...</p>
      </td>
    </tr>
  `;
  
  try {
    const response = await window.api.getData(ENDPOINT);
    allData = Array.isArray(response) ? response : [];
    filteredData = [...allData];
    
    tableCount.textContent = `${allData.length} registro(s)`;
    
    renderTable();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center" style="padding: 3rem;">
          <p style="color: var(--danger);">Erro ao carregar dados. Verifique a conexão com a API.</p>
          <button class="btn btn-primary mt-3" onclick="loadData()">Tentar novamente</button>
        </td>
      </tr>
    `;
    window.ui.Toast.error('Erro ao carregar dados');
  }
}

/**
 * Renderiza a tabela
 */
function renderTable() {
  const tableBody = document.getElementById('table-body');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            <div class="table-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <h3>Nenhum aluno encontrado</h3>
            <p>Clique em "Novo Aluno" para adicionar um registro.</p>
          </div>
        </td>
      </tr>
    `;
    paginationContainer.innerHTML = '';
    return;
  }
  
  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageData = filteredData.slice(startIndex, endIndex);
  
  // Renderiza linhas
  tableBody.innerHTML = pageData.map(item => `
    <tr>
      <td class="cell-id">${item.id || '-'}</td>
      <td class="cell-name">${item.nome || '-'}</td>
      <td>${item.email || '-'}</td>
      <td>${item.cpf || '-'}</td>
      <td>${item.data_nascimento ? window.ui.Formatters.date(item.data_nascimento) : '-'}</td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${item.id})" title="Editar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn-action delete" onclick="deleteItem(${item.id})" title="Excluir">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Renderiza paginação
  paginationContainer.innerHTML = window.ui.Pagination.create({
    currentPage,
    totalPages,
    totalItems: filteredData.length,
    itemsPerPage
  });
  
  // Event listeners da paginação
  paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) {
        currentPage = parseInt(btn.dataset.page);
        renderTable();
      }
    });
  });
}

/**
 * Busca local
 */
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  
  filteredData = allData.filter(item => {
    return (
      (item.nome && item.nome.toLowerCase().includes(searchTerm)) ||
      (item.email && item.email.toLowerCase().includes(searchTerm)) ||
      (item.cpf && item.cpf.toLowerCase().includes(searchTerm))
    );
  });
  
  currentPage = 1;
  renderTable();
}

/**
 * Abre modal para criar/editar
 */
function openModal(data = null) {
  editingId = data ? data.id : null;
  
  const modal = document.getElementById('modal-form');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('form-entity');
  
  title.textContent = data ? 'Editar Aluno' : 'Novo Aluno';
  
  // Preenche formulário
  form.reset();
  if (data) {
    document.getElementById('field-nome').value = data.nome || '';
    document.getElementById('field-email').value = data.email || '';
    document.getElementById('field-cpf').value = data.cpf || '';
    document.getElementById('field-data_nascimento').value = data.data_nascimento || '';
    document.getElementById('field-telefone').value = data.telefone || '';
    document.getElementById('field-endereco').value = data.endereco || '';
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-nome').focus();
}

/**
 * Fecha modal
 */
function closeModal() {
  const modal = document.getElementById('modal-form');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

/**
 * Submete formulário
 */
async function handleSubmit(e) {
  e.preventDefault();
  
  const btn = document.getElementById('btn-submit');
  window.ui.Loading.button(btn, true);
  
  const formData = {
    nome: document.getElementById('field-nome').value.trim(),
    email: document.getElementById('field-email').value.trim(),
    cpf: document.getElementById('field-cpf').value.trim(),
    data_nascimento: document.getElementById('field-data_nascimento').value || null,
    telefone: document.getElementById('field-telefone').value.trim() || null,
    endereco: document.getElementById('field-endereco').value.trim() || null
  };
  
  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, formData);
      window.ui.Toast.success('Aluno atualizado com sucesso!');
    } else {
      await window.api.postData(ENDPOINT, formData);
      window.ui.Toast.success('Aluno cadastrado com sucesso!');
    }
    
    closeModal();
    await loadData();
  } catch (error) {
    console.error('Erro ao salvar:', error);
    window.ui.Toast.error(error.message || 'Erro ao salvar registro');
  } finally {
    window.ui.Loading.button(btn, false);
  }
}

/**
 * Editar item
 */
async function editItem(id) {
  try {
    const data = await window.api.getData(`${ENDPOINT}/${id}`);
    openModal(data);
  } catch (error) {
    console.error('Erro ao carregar:', error);
    window.ui.Toast.error('Erro ao carregar dados para edição');
  }
}

/**
 * Excluir item
 */
function deleteItem(id) {
  window.ui.Modal.confirm({
    title: 'Excluir Aluno',
    message: 'Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.',
    type: 'danger',
    confirmText: 'Excluir',
    onConfirm: async () => {
      try {
        await window.api.deleteData(`${ENDPOINT}/${id}`);
        window.ui.Toast.success('Aluno excluído com sucesso!');
        await loadData();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        window.ui.Toast.error(error.message || 'Erro ao excluir registro');
      }
    }
  });
}

/**
 * Configura logout
 */
function setupLogout() {
  document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.ui.Modal.confirm({
        title: 'Sair do sistema',
        message: 'Deseja realmente sair?',
        type: 'warning',
        confirmText: 'Sair',
        onConfirm: () => window.auth.logout()
      });
    });
  });
}

// Expõe funções globalmente
window.editItem = editItem;
window.deleteItem = deleteItem;
window.loadData = loadData;
