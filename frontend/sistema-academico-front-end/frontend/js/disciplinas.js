/* ================================================== */
/* DISCIPLINAS.JS - CRUD de Disciplinas */
/* ================================================== */

const ENDPOINT = '/disciplinas';
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.initAuth(true)) return;
  window.ui.Sidebar.init();
  window.auth.updateUserUI();
  setupEventListeners();
  await loadData();
  setupLogout();
});

function setupEventListeners() {
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('form-entity').addEventListener('submit', handleSubmit);
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => btn.addEventListener('click', closeModal));
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('modal-form').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });
}

async function loadData() {
  const tableBody = document.getElementById('table-body');
  const tableCount = document.getElementById('table-count');
  
  tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 3rem;"><div class="spinner spinner-lg" style="margin: 0 auto;"></div><p style="margin-top: 1rem;">Carregando...</p></td></tr>`;
  
  try {
    const response = await window.api.getData(ENDPOINT);
    allData = Array.isArray(response) ? response : [];
    filteredData = [...allData];
    tableCount.textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding: 3rem;"><p style="color: var(--danger);">Erro ao carregar dados.</p><button class="btn btn-primary mt-3" onclick="loadData()">Tentar novamente</button></td></tr>`;
    window.ui.Toast.error('Erro ao carregar dados');
  }
}

function renderTable() {
  const tableBody = document.getElementById('table-body');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (filteredData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><h3>Nenhuma disciplina encontrada</h3><p>Clique em "Nova Disciplina" para adicionar.</p></div></td></tr>`;
    paginationContainer.innerHTML = '';
    return;
  }
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  tableBody.innerHTML = pageData.map(item => `
    <tr>
      <td class="cell-id">${item.id || '-'}</td>
      <td class="cell-name">${item.nome || '-'}</td>
      <td>${item.codigo || '-'}</td>
      <td>${item.carga_horaria ? item.carga_horaria + 'h' : '-'}</td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${item.id})" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="btn-action delete" onclick="deleteItem(${item.id})" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </td>
    </tr>
  `).join('');
  
  paginationContainer.innerHTML = window.ui.Pagination.create({ currentPage, totalPages, totalItems: filteredData.length, itemsPerPage });
  paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (!btn.disabled) { currentPage = parseInt(btn.dataset.page); renderTable(); } });
  });
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  filteredData = allData.filter(item => (item.nome && item.nome.toLowerCase().includes(searchTerm)) || (item.codigo && item.codigo.toLowerCase().includes(searchTerm)));
  currentPage = 1;
  renderTable();
}

function openModal(data = null) {
  editingId = data ? data.id : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Disciplina' : 'Nova Disciplina';
  document.getElementById('form-entity').reset();
  if (data) {
    document.getElementById('field-nome').value = data.nome || '';
    document.getElementById('field-codigo').value = data.codigo || '';
    document.getElementById('field-carga_horaria').value = data.carga_horaria || '';
    document.getElementById('field-descricao').value = data.descricao || '';
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-nome').focus();
}

function closeModal() {
  document.getElementById('modal-form').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  window.ui.Loading.button(btn, true);
  
  const formData = {
    nome: document.getElementById('field-nome').value.trim(),
    codigo: document.getElementById('field-codigo').value.trim(),
    carga_horaria: parseInt(document.getElementById('field-carga_horaria').value) || null,
    descricao: document.getElementById('field-descricao').value.trim() || null
  };
  
  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, formData);
      window.ui.Toast.success('Disciplina atualizada!');
    } else {
      await window.api.postData(ENDPOINT, formData);
      window.ui.Toast.success('Disciplina cadastrada!');
    }
    closeModal();
    await loadData();
  } catch (error) {
    window.ui.Toast.error(error.message || 'Erro ao salvar');
  } finally {
    window.ui.Loading.button(btn, false);
  }
}

async function editItem(id) {
  try {
    const data = await window.api.getData(`${ENDPOINT}/${id}`);
    openModal(data);
  } catch (error) {
    window.ui.Toast.error('Erro ao carregar dados');
  }
}

function deleteItem(id) {
  window.ui.Modal.confirm({
    title: 'Excluir Disciplina',
    message: 'Tem certeza que deseja excluir esta disciplina?',
    type: 'danger',
    confirmText: 'Excluir',
    onConfirm: async () => {
      try {
        await window.api.deleteData(`${ENDPOINT}/${id}`);
        window.ui.Toast.success('Disciplina excluída!');
        await loadData();
      } catch (error) {
        window.ui.Toast.error(error.message || 'Erro ao excluir');
      }
    }
  });
}

function setupLogout() {
  document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.ui.Modal.confirm({ title: 'Sair', message: 'Deseja sair?', type: 'warning', confirmText: 'Sair', onConfirm: () => window.auth.logout() });
    });
  });
}

window.editItem = editItem;
window.deleteItem = deleteItem;
window.loadData = loadData;
