/* OFERTAS.JS - CRUD de Ofertas de Disciplina */

const ENDPOINT = '/ofertas';
let currentPage = 1;
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

let disciplinasMap = {}, turmasMap = {}, profsMap = {};

function toMap(arr, key) {
  return Object.fromEntries((arr || []).map(x => [x[key], x]));
}

async function loadLookups() {
  try {
    const [disc, turmas, profs] = await Promise.all([
      window.api.getData('/disciplinas?limit=500'),
      window.api.getData('/turmas?limit=500'),
      window.api.getData('/professores?limit=500'),
    ]);
    disciplinasMap = toMap(disc, 'idDisciplina');
    turmasMap      = toMap(turmas, 'idTurma');
    profsMap       = toMap(profs, 'pessoa_id');
  } catch (e) { console.error('Erro ao carregar lookups:', e); }
}

function nomeDisc(id) { const d = disciplinasMap[id]; return d ? d.nomeDisciplina : `#${id}`; }
function nomeTurma(id) { const t = turmasMap[id]; return t ? t.nomeTurma : `#${id}`; }
function nomeProf(pid) { const p = profsMap[pid]; return p ? p.nome : `#${pid}`; }

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
  tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:3rem"><div class="spinner spinner-lg" style="margin:0 auto"></div></td></tr>`;
  try {
    await loadLookups();
    const r = await window.api.getData(ENDPOINT);
    allData = Array.isArray(r) ? r : [];
    filteredData = [...allData];
    document.getElementById('table-count').textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:3rem;color:var(--danger)">Erro ao carregar.</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const pag = document.getElementById('pagination-container');
  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><h3>Nenhuma oferta encontrada</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(o => `
    <tr>
      <td class="cell-id">${o.idOfertaDisciplina}</td>
      <td>${nomeDisc(o.idDisciplina)}</td>
      <td>${nomeTurma(o.idTurma)}</td>
      <td>${nomeProf(o.pessoa_id)}</td>
      <td>${o.anoLetivo}/${o.semestre}</td>
      <td>${o.sala}</td>
      <td>${o.diaOferta}</td>
      <td><span class="badge">${o.statusOferta}</span></td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${o.idOfertaDisciplina})">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${o.idOfertaDisciplina})">🗑</button>
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
  filteredData = allData.filter(o =>
    nomeDisc(o.idDisciplina).toLowerCase().includes(q) ||
    nomeTurma(o.idTurma).toLowerCase().includes(q) ||
    nomeProf(o.pessoa_id).toLowerCase().includes(q) ||
    (o.statusOferta && o.statusOferta.toLowerCase().includes(q))
  );
  currentPage = 1;
  renderTable();
}

async function loadSelects() {
  await loadLookups();
  const discSel = document.getElementById('field-idDisciplina');
  discSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(disciplinasMap).map(d => `<option value="${d.idDisciplina}">${d.nomeDisciplina} (${d.cargaHoraria}h)</option>`).join('');
  const tuSel = document.getElementById('field-idTurma');
  tuSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(turmasMap).map(t => `<option value="${t.idTurma}">${t.nomeTurma} — ${t.turno} (${t.anoLetivo})</option>`).join('');
  const prSel = document.getElementById('field-pessoa_id');
  prSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(profsMap).map(p => `<option value="${p.pessoa_id}">${p.nome} (${p.matriculaProf || 'matr. pendente'})</option>`).join('');
}

async function openModal(data = null) {
  editingId = data ? data.idOfertaDisciplina : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Oferta' : 'Nova Oferta';
  document.getElementById('form-entity').reset();
  await loadSelects();

  if (data) {
    document.getElementById('field-anoLetivo').value      = data.anoLetivo;
    document.getElementById('field-semestre').value       = data.semestre;
    document.getElementById('field-sala').value           = data.sala;
    document.getElementById('field-diaOferta').value      = data.diaOferta;
    document.getElementById('field-mediaAprovacao').value = data.mediaAprovacao;
    document.getElementById('field-statusOferta').value   = data.statusOferta;
    document.getElementById('field-idDisciplina').value   = data.idDisciplina;
    document.getElementById('field-idTurma').value        = data.idTurma;
    document.getElementById('field-pessoa_id').value      = data.pessoa_id;
  } else {
    document.getElementById('field-anoLetivo').value      = new Date().getFullYear();
    document.getElementById('field-semestre').value       = 1;
    document.getElementById('field-mediaAprovacao').value = 6;
    document.getElementById('field-statusOferta').value   = 'ATIVA';
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
  if (window.ui && window.ui.Loading) window.ui.Loading.button(btn, true);

  const base = {
    anoLetivo:      parseInt(document.getElementById('field-anoLetivo').value, 10),
    semestre:       parseInt(document.getElementById('field-semestre').value, 10),
    sala:           document.getElementById('field-sala').value.trim(),
    diaOferta:      document.getElementById('field-diaOferta').value.trim(),
    mediaAprovacao: parseFloat(document.getElementById('field-mediaAprovacao').value),
    statusOferta:   document.getElementById('field-statusOferta').value,
    idDisciplina:   parseInt(document.getElementById('field-idDisciplina').value, 10),
    idTurma:        parseInt(document.getElementById('field-idTurma').value, 10),
    pessoa_id:      parseInt(document.getElementById('field-pessoa_id').value, 10),
  };

  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Oferta atualizada!');
    } else {
      await window.api.postData(ENDPOINT, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Oferta cadastrada!');
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
    window.ui.Modal.confirm({ title:'Excluir Oferta', message:'Confirma exclusão?', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(id) });
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
