/* ================================================== */
/* ALUNOS.JS - CRUD de Alunos (PESSOA + ALUNO)         */
/* ================================================== */

const ENDPOINT = '/alunos';
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (window.auth && !window.auth.initAuth(true)) return;
  if (window.ui && window.ui.Sidebar) window.ui.Sidebar.init();
  if (window.auth && window.auth.updateUserUI) window.auth.updateUserUI();

  setupEventListeners();
  await loadData();
  setupLogout();
});

function setupEventListeners() {
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('form-entity').addEventListener('submit', handleSubmit);
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('modal-form').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });
}

async function loadData() {
  const tableBody = document.getElementById('table-body');
  const tableCount = document.getElementById('table-count');

  tableBody.innerHTML = `
    <tr><td colspan="6" class="text-center" style="padding: 3rem;">
      <div class="spinner spinner-lg" style="margin: 0 auto;"></div>
      <p style="margin-top: 1rem; color: var(--text-secondary);">Carregando dados...</p>
    </td></tr>`;

  try {
    const response = await window.api.getData(ENDPOINT);
    allData = Array.isArray(response) ? response : [];
    filteredData = [...allData];
    tableCount.textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    tableBody.innerHTML = `
      <tr><td colspan="6" class="text-center" style="padding: 3rem;">
        <p style="color: var(--danger);">Erro ao carregar dados. Verifique a conexão com a API.</p>
        <button class="btn btn-primary mt-3" onclick="loadData()">Tentar novamente</button>
      </td></tr>`;
    if (window.ui && window.ui.Toast) window.ui.Toast.error('Erro ao carregar dados');
  }
}

function renderTable() {
  const tableBody = document.getElementById('table-body');
  const paginationContainer = document.getElementById('pagination-container');

  if (filteredData.length === 0) {
    tableBody.innerHTML = `
      <tr><td colspan="6">
        <div class="table-empty">
          <h3>Nenhum aluno encontrado</h3>
          <p>Clique em "Novo Aluno" para adicionar um registro.</p>
        </div>
      </td></tr>`;
    paginationContainer.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  tableBody.innerHTML = pageData.map(item => `
    <tr>
      <td class="cell-id">${item.pessoa_id}</td>
      <td class="cell-name">${item.nome || '-'}</td>
      <td>${item.RAaluno || '-'}</td>
      <td>${item.matriculaAluno || '-'}</td>
      <td>${formatDate(item.dataNascimento)}</td>
      <td><span class="badge">${item.statusAluno || '-'}</span></td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${item.pessoa_id})" title="Editar">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${item.pessoa_id})" title="Excluir">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  if (window.ui && window.ui.Pagination) {
    paginationContainer.innerHTML = window.ui.Pagination.create({
      currentPage, totalPages, totalItems: filteredData.length, itemsPerPage
    });
    paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          currentPage = parseInt(btn.dataset.page);
          renderTable();
        }
      });
    });
  }
}

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('pt-BR');
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase();
  filteredData = allData.filter(item =>
    (item.nome && item.nome.toLowerCase().includes(q)) ||
    (item.cpf && item.cpf.toLowerCase().includes(q)) ||
    (item.matriculaAluno && item.matriculaAluno.toLowerCase().includes(q)) ||
    String(item.RAaluno || '').includes(q)
  );
  currentPage = 1;
  renderTable();
}

function openModal(data = null) {
  editingId = data ? data.pessoa_id : null;
  const modal = document.getElementById('modal-form');
  const title = document.getElementById('modal-title');
  const form  = document.getElementById('form-entity');

  title.textContent = data ? 'Editar Aluno' : 'Novo Aluno';
  form.reset();

  if (data) {
    document.getElementById('field-nome').value           = data.nome || '';
    document.getElementById('field-cpf').value            = data.cpf || '';
    document.getElementById('field-dataNascimento').value = data.dataNascimento || '';
    document.getElementById('field-telefone').value       = data.telefone || '';
    document.getElementById('field-endereco').value       = data.endereco || '';
    document.getElementById('field-statusAluno').value    = data.statusAluno || 'ATIVO';
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-nome').focus();
}

function closeModal() {
  const modal = document.getElementById('modal-form');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  if (window.ui && window.ui.Loading) window.ui.Loading.button(btn, true);

  const senhaInput = document.getElementById('field-senha');
  const senha = senhaInput ? senhaInput.value.trim() : '';

  const base = {
    nome:           document.getElementById('field-nome').value.trim(),
    cpf:            document.getElementById('field-cpf').value.trim(),
    dataNascimento: document.getElementById('field-dataNascimento').value || null,
    telefone:       document.getElementById('field-telefone').value.trim(),
    endereco:       document.getElementById('field-endereco').value.trim(),
    statusAluno:    document.getElementById('field-statusAluno').value,
  };
  if (senha) base.senha = senha;

  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Aluno atualizado!');
    } else {
      if (!base.senha) base.senha = 'senha123'; // default mínimo
      await window.api.postData(ENDPOINT, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Aluno cadastrado!');
    }
    closeModal();
    await loadData();
  } catch (error) {
    console.error('Erro ao salvar:', error);
    window.ui && window.ui.Toast && window.ui.Toast.error(error.message || 'Erro ao salvar');
  } finally {
    if (window.ui && window.ui.Loading) window.ui.Loading.button(btn, false);
  }
}

async function editItem(id) {
  try {
    const data = await window.api.getData(`${ENDPOINT}/${id}`);
    openModal(data);
  } catch (error) {
    console.error('Erro ao carregar:', error);
    window.ui && window.ui.Toast && window.ui.Toast.error('Erro ao carregar dados');
  }
}

function deleteItem(id) {
  if (window.ui && window.ui.Modal) {
    window.ui.Modal.confirm({
      title: 'Excluir Aluno',
      message: 'Tem certeza? Esta ação não pode ser desfeita.',
      type: 'danger',
      confirmText: 'Excluir',
      onConfirm: () => doDelete(id),
    });
  } else if (confirm('Excluir este aluno?')) {
    doDelete(id);
  }
}

async function doDelete(id) {
  try {
    await window.api.deleteData(`${ENDPOINT}/${id}`);
    window.ui && window.ui.Toast && window.ui.Toast.success('Aluno excluído!');
    await loadData();
  } catch (error) {
    console.error('Erro ao excluir:', error);
    window.ui && window.ui.Toast && window.ui.Toast.error(error.message || 'Erro ao excluir');
  }
}

function setupLogout() {
  document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.auth && window.auth.logout) window.auth.logout();
    });
  });
}

window.editItem = editItem;
window.deleteItem = deleteItem;
window.loadData = loadData;
