/* TURMAS.JS - CRUD de Turmas */

const ENDPOINT = '/turmas';
let currentPage = 1;
const itemsPerPage = 10;
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
  document.querySelectorAll('[data-action="close-modal"]').forEach(b => b.addEventListener('click', closeModal));
  document.getElementById('search-input').addEventListener('input', handleSearch);
  document.getElementById('modal-form').addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });
}

async function loadData() {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:3rem"><div class="spinner spinner-lg" style="margin:0 auto"></div></td></tr>`;
  try {
    const r = await window.api.getData(ENDPOINT);
    allData = Array.isArray(r) ? r : [];
    filteredData = [...allData];
    document.getElementById('table-count').textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:3rem;color:var(--danger)">Erro ao carregar.</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const pag = document.getElementById('pagination-container');
  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><h3>Nenhuma turma encontrada</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(t => `
    <tr>
      <td class="cell-id">${t.idTurma}</td>
      <td class="cell-name">${t.nomeTurma || '-'}</td>
      <td>${t.turno}</td>
      <td>${t.serie}</td>
      <td>${t.salasTurma}</td>
      <td>${t.anoLetivo}</td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${t.idTurma})">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${t.idTurma})">🗑</button>
        </div>
      </td>
    </tr>`).join('');
  if (window.ui && window.ui.Pagination) {
    pag.innerHTML = window.ui.Pagination.create({ currentPage, totalPages: total, totalItems: filteredData.length, itemsPerPage });
    pag.querySelectorAll('.pagination-btn').forEach(b => b.addEventListener('click', () => {
      if (!b.disabled) { currentPage = parseInt(b.dataset.page); renderTable(); }
    }));
  }
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase();
  filteredData = allData.filter(t =>
    (t.nomeTurma && t.nomeTurma.toLowerCase().includes(q)) ||
    String(t.idTurma).includes(q)
  );
  currentPage = 1;
  renderTable();
}

function openModal(data = null) {
  editingId = data ? data.idTurma : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Turma' : 'Nova Turma';
  document.getElementById('form-entity').reset();
  if (data) {
    document.getElementById('field-nomeTurma').value  = data.nomeTurma || '';
    document.getElementById('field-turno').value      = data.turno || 'MATUTINO';
    document.getElementById('field-serie').value      = data.serie || '';
    document.getElementById('field-salasTurma').value = data.salasTurma || '';
    document.getElementById('field-anoLetivo').value  = data.anoLetivo || new Date().getFullYear();
  } else {
    document.getElementById('field-anoLetivo').value  = new Date().getFullYear();
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-nomeTurma').focus();
}

function closeModal() {
  document.getElementById('modal-form').classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  if (window.ui && window.ui.Loading) window.ui.Loading.button(btn, true);

  const base = {
    nomeTurma:  document.getElementById('field-nomeTurma').value.trim(),
    turno:      document.getElementById('field-turno').value,
    serie:      document.getElementById('field-serie').value.trim(),
    salasTurma: document.getElementById('field-salasTurma').value.trim(),
    anoLetivo:  parseInt(document.getElementById('field-anoLetivo').value, 10),
  };

  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Turma atualizada!');
    } else {
      await window.api.postData(ENDPOINT, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Turma cadastrada!');
    }
    closeModal();
    await loadData();
  } catch (err) {
    console.error(err);
    window.ui && window.ui.Toast && window.ui.Toast.error(err.message || 'Erro ao salvar');
  } finally {
    if (window.ui && window.ui.Loading) window.ui.Loading.button(btn, false);
  }
}

async function editItem(id) {
  try { openModal(await window.api.getData(`${ENDPOINT}/${id}`)); }
  catch (e) { console.error(e); window.ui && window.ui.Toast && window.ui.Toast.error('Erro ao carregar'); }
}

function deleteItem(id) {
  if (window.ui && window.ui.Modal) {
    window.ui.Modal.confirm({ title:'Excluir Turma', message:'Confirma exclusão?', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(id) });
  } else if (confirm('Excluir?')) doDelete(id);
}

async function doDelete(id) {
  try {
    await window.api.deleteData(`${ENDPOINT}/${id}`);
    window.ui && window.ui.Toast && window.ui.Toast.success('Excluído!');
    await loadData();
  } catch (e) {
    console.error(e);
    window.ui && window.ui.Toast && window.ui.Toast.error(e.message || 'Erro ao excluir');
  }
}

function setupLogout() {
  document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(b =>
    b.addEventListener('click', e => { e.preventDefault(); window.auth && window.auth.logout && window.auth.logout(); }));
}

window.editItem = editItem;
window.deleteItem = deleteItem;
window.loadData = loadData;
