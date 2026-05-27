/* DISCIPLINAS.JS - CRUD de Disciplinas */

const ENDPOINT = '/disciplinas';
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
  tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:3rem"><div class="spinner spinner-lg" style="margin:0 auto"></div></td></tr>`;
  try {
    const r = await window.api.getData(ENDPOINT);
    allData = Array.isArray(r) ? r : [];
    filteredData = [...allData];
    document.getElementById('table-count').textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="padding:3rem;color:var(--danger)">Erro ao carregar. <button class="btn btn-primary" onclick="loadData()">Tentar novamente</button></td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const pag = document.getElementById('pagination-container');
  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="table-empty"><h3>Nenhuma disciplina encontrada</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(d => `
    <tr>
      <td class="cell-id">${d.idDisciplina}</td>
      <td class="cell-name">${d.nomeDisciplina || '-'}</td>
      <td>${d.cargaHoraria}h</td>
      <td><span class="badge">${d.statusDisciplina}</span></td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${d.idDisciplina})" title="Editar">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${d.idDisciplina})" title="Excluir">🗑</button>
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
  filteredData = allData.filter(d =>
    (d.nomeDisciplina && d.nomeDisciplina.toLowerCase().includes(q)) ||
    String(d.idDisciplina).includes(q)
  );
  currentPage = 1;
  renderTable();
}

function openModal(data = null) {
  editingId = data ? data.idDisciplina : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Disciplina' : 'Nova Disciplina';
  document.getElementById('form-entity').reset();
  if (data) {
    document.getElementById('field-nomeDisciplina').value   = data.nomeDisciplina || '';
    document.getElementById('field-cargaHoraria').value     = data.cargaHoraria || '';
    document.getElementById('field-statusDisciplina').value = data.statusDisciplina || 'ATIVA';
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-nomeDisciplina').focus();
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
    nomeDisciplina:   document.getElementById('field-nomeDisciplina').value.trim(),
    cargaHoraria:     parseInt(document.getElementById('field-cargaHoraria').value, 10),
    statusDisciplina: document.getElementById('field-statusDisciplina').value,
  };

  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Disciplina atualizada!');
    } else {
      await window.api.postData(ENDPOINT, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Disciplina cadastrada!');
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
    window.ui.Modal.confirm({ title:'Excluir Disciplina', message:'Confirma exclusão?', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(id) });
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
