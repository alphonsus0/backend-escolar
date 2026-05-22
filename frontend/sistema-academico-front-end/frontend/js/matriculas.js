/* ================================================== */
/* MATRICULAS.JS - CRUD de Matrículas */
/* ================================================== */

const ENDPOINT = '/matriculas';
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;
let alunos = [];
let turmas = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.initAuth(true)) return;
  window.ui.Sidebar.init();
  window.auth.updateUserUI();
  setupEventListeners();
  await Promise.all([loadData(), loadAlunos(), loadTurmas()]);
  setupLogout();
});

async function loadAlunos() {
  try {
    const response = await window.api.getData('/alunos');
    alunos = Array.isArray(response) ? response : [];
    populateSelect('field-aluno_id', alunos, 'nome');
  } catch (error) {
    console.error('Erro ao carregar alunos:', error);
  }
}

async function loadTurmas() {
  try {
    const response = await window.api.getData('/turmas');
    turmas = Array.isArray(response) ? response : [];
    populateSelect('field-turma_id', turmas, 'nome');
  } catch (error) {
    console.error('Erro ao carregar turmas:', error);
  }
}

function populateSelect(selectId, data, labelField) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '<option value="">Selecione...</option>';
  data.forEach(item => {
    select.innerHTML += `<option value="${item.id}">${item[labelField] || item.id}</option>`;
  });
  if (currentValue) select.value = currentValue;
}

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
  
  tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 3rem;"><div class="spinner spinner-lg" style="margin: 0 auto;"></div><p style="margin-top: 1rem;">Carregando...</p></td></tr>`;
  
  try {
    const response = await window.api.getData(ENDPOINT);
    allData = Array.isArray(response) ? response : [];
    filteredData = [...allData];
    tableCount.textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 3rem;"><p style="color: var(--danger);">Erro ao carregar dados.</p><button class="btn btn-primary mt-3" onclick="loadData()">Tentar novamente</button></td></tr>`;
    window.ui.Toast.error('Erro ao carregar dados');
  }
}

function getAlunoNome(id) {
  const aluno = alunos.find(a => a.id === id);
  return aluno ? aluno.nome : id;
}

function getTurmaNome(id) {
  const turma = turmas.find(t => t.id === id);
  return turma ? turma.nome : id;
}

function renderTable() {
  const tableBody = document.getElementById('table-body');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (filteredData.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6"><div class="table-empty"><h3>Nenhuma matrícula encontrada</h3><p>Clique em "Nova Matrícula" para adicionar.</p></div></td></tr>`;
    paginationContainer.innerHTML = '';
    return;
  }
  
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  tableBody.innerHTML = pageData.map(item => `
    <tr>
      <td class="cell-id">${item.id || '-'}</td>
      <td>${getAlunoNome(item.aluno_id)}</td>
      <td>${getTurmaNome(item.turma_id)}</td>
      <td>${item.data_matricula ? window.ui.Formatters.date(item.data_matricula) : '-'}</td>
      <td><span class="status-badge ${item.status === 'ativo' ? 'active' : item.status === 'inativo' ? 'inactive' : 'pending'}">${item.status || '-'}</span></td>
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
  filteredData = allData.filter(item => {
    const alunoNome = getAlunoNome(item.aluno_id).toLowerCase();
    const turmaNome = getTurmaNome(item.turma_id).toLowerCase();
    return alunoNome.includes(searchTerm) || turmaNome.includes(searchTerm);
  });
  currentPage = 1;
  renderTable();
}

function openModal(data = null) {
  editingId = data ? data.id : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Matrícula' : 'Nova Matrícula';
  document.getElementById('form-entity').reset();
  if (data) {
    document.getElementById('field-aluno_id').value = data.aluno_id || '';
    document.getElementById('field-turma_id').value = data.turma_id || '';
    document.getElementById('field-data_matricula').value = data.data_matricula || '';
    document.getElementById('field-status').value = data.status || 'ativo';
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
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
    aluno_id: parseInt(document.getElementById('field-aluno_id').value),
    turma_id: parseInt(document.getElementById('field-turma_id').value),
    data_matricula: document.getElementById('field-data_matricula').value || null,
    status: document.getElementById('field-status').value || 'ativo'
  };
  
  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, formData);
      window.ui.Toast.success('Matrícula atualizada!');
    } else {
      await window.api.postData(ENDPOINT, formData);
      window.ui.Toast.success('Matrícula cadastrada!');
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
    title: 'Excluir Matrícula',
    message: 'Tem certeza que deseja excluir esta matrícula?',
    type: 'danger',
    confirmText: 'Excluir',
    onConfirm: async () => {
      try {
        await window.api.deleteData(`${ENDPOINT}/${id}`);
        window.ui.Toast.success('Matrícula excluída!');
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
