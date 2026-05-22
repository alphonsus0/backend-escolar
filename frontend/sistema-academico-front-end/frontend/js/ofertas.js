/* ================================================== */
/* OFERTAS.JS - CRUD de Ofertas */
/* ================================================== */

const ENDPOINT = '/ofertas';
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;
let disciplinas = [];
let turmas = [];
let professores = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.auth.initAuth(true)) return;
  window.ui.Sidebar.init();
  window.auth.updateUserUI();
  setupEventListeners();
  await Promise.all([loadData(), loadDisciplinas(), loadTurmas(), loadProfessores()]);
  setupLogout();
});

async function loadDisciplinas() {
  try { disciplinas = await window.api.getData('/disciplinas') || []; populateSelect('field-disciplina_id', disciplinas, 'nome'); } catch (e) { console.error(e); }
}
async function loadTurmas() {
  try { turmas = await window.api.getData('/turmas') || []; populateSelect('field-turma_id', turmas, 'nome'); } catch (e) { console.error(e); }
}
async function loadProfessores() {
  try { professores = await window.api.getData('/professores') || []; populateSelect('field-professor_id', professores, 'nome'); } catch (e) { console.error(e); }
}

function populateSelect(selectId, data, labelField) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const val = select.value;
  select.innerHTML = '<option value="">Selecione...</option>' + (Array.isArray(data) ? data : []).map(i => `<option value="${i.id}">${i[labelField] || i.id}</option>`).join('');
  if (val) select.value = val;
}

function setupEventListeners() {
  document.getElementById('btn-new').addEventListener('click', () => openModal());
  document.getElementById('form-entity').addEventListener('submit', handleSubmit);
  document.querySelectorAll('[data-action="close-modal"]').forEach(btn => btn.addEventListener('click', closeModal));
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('modal-form').addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) closeModal(); });
}

async function loadData() {
  const tableBody = document.getElementById('table-body');
  const tableCount = document.getElementById('table-count');
  tableBody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding: 3rem;"><div class="spinner spinner-lg" style="margin: 0 auto;"></div></td></tr>`;
  try {
    allData = await window.api.getData(ENDPOINT) || [];
    filteredData = [...allData];
    tableCount.textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center"><p style="color: var(--danger);">Erro ao carregar.</p></td></tr>`;
    window.ui.Toast.error('Erro ao carregar dados');
  }
}

function getName(list, id, field = 'nome') { const item = list.find(i => i.id === id); return item ? item[field] : id; }

function renderTable() {
  const tableBody = document.getElementById('table-body');
  const paginationContainer = document.getElementById('pagination-container');
  if (filteredData.length === 0) { tableBody.innerHTML = `<tr><td colspan="6"><div class="table-empty"><h3>Nenhuma oferta encontrada</h3></div></td></tr>`; paginationContainer.innerHTML = ''; return; }
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const pageData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  tableBody.innerHTML = pageData.map(item => `
    <tr>
      <td class="cell-id">${item.id || '-'}</td>
      <td>${getName(disciplinas, item.disciplina_id)}</td>
      <td>${getName(turmas, item.turma_id)}</td>
      <td>${getName(professores, item.professor_id)}</td>
      <td>${item.semestre || '-'}</td>
      <td><div class="cell-actions"><button class="btn-action edit" onclick="editItem(${item.id})"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button class="btn-action delete" onclick="deleteItem(${item.id})"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></div></td>
    </tr>
  `).join('');
  paginationContainer.innerHTML = window.ui.Pagination.create({ currentPage, totalPages, totalItems: filteredData.length, itemsPerPage });
  paginationContainer.querySelectorAll('.pagination-btn').forEach(btn => { btn.addEventListener('click', () => { if (!btn.disabled) { currentPage = parseInt(btn.dataset.page); renderTable(); } }); });
}

function handleSearch(e) {
  const term = e.target.value.toLowerCase();
  filteredData = allData.filter(i => getName(disciplinas, i.disciplina_id).toLowerCase().includes(term) || getName(turmas, i.turma_id).toLowerCase().includes(term));
  currentPage = 1; renderTable();
}

function openModal(data = null) {
  editingId = data ? data.id : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Oferta' : 'Nova Oferta';
  document.getElementById('form-entity').reset();
  if (data) {
    document.getElementById('field-disciplina_id').value = data.disciplina_id || '';
    document.getElementById('field-turma_id').value = data.turma_id || '';
    document.getElementById('field-professor_id').value = data.professor_id || '';
    document.getElementById('field-semestre').value = data.semestre || '';
    document.getElementById('field-ano').value = data.ano || '';
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() { document.getElementById('modal-form').classList.remove('active'); document.body.style.overflow = ''; editingId = null; }

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  window.ui.Loading.button(btn, true);
  const formData = {
    disciplina_id: parseInt(document.getElementById('field-disciplina_id').value),
    turma_id: parseInt(document.getElementById('field-turma_id').value),
    professor_id: parseInt(document.getElementById('field-professor_id').value) || null,
    semestre: document.getElementById('field-semestre').value.trim() || null,
    ano: parseInt(document.getElementById('field-ano').value) || null
  };
  try {
    if (editingId) { await window.api.putData(`${ENDPOINT}/${editingId}`, formData); window.ui.Toast.success('Oferta atualizada!'); }
    else { await window.api.postData(ENDPOINT, formData); window.ui.Toast.success('Oferta cadastrada!'); }
    closeModal(); await loadData();
  } catch (error) { window.ui.Toast.error(error.message || 'Erro ao salvar'); }
  finally { window.ui.Loading.button(btn, false); }
}

async function editItem(id) { try { openModal(await window.api.getData(`${ENDPOINT}/${id}`)); } catch (e) { window.ui.Toast.error('Erro ao carregar'); } }
function deleteItem(id) {
  window.ui.Modal.confirm({ title: 'Excluir Oferta', message: 'Confirma exclusão?', type: 'danger', confirmText: 'Excluir',
    onConfirm: async () => { try { await window.api.deleteData(`${ENDPOINT}/${id}`); window.ui.Toast.success('Excluída!'); await loadData(); } catch (e) { window.ui.Toast.error(e.message); } }
  });
}

function setupLogout() { document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(btn => { btn.addEventListener('click', (e) => { e.preventDefault(); window.ui.Modal.confirm({ title: 'Sair', message: 'Deseja sair?', type: 'warning', confirmText: 'Sair', onConfirm: () => window.auth.logout() }); }); }); }

window.editItem = editItem;
window.deleteItem = deleteItem;
window.loadData = loadData;
