/* MATRICULAS.JS - CRUD de Matrículas + ação Enturmar */

const ENDPOINT = '/matriculas';
let currentPage = 1;
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

let alunosMap = {}, turmasMap = {};

function toMap(arr, key) {
  return Object.fromEntries((arr || []).map(x => [x[key], x]));
}

async function loadLookups() {
  try {
    const [alunos, turmas] = await Promise.all([
      window.api.getData('/alunos?limit=500'),
      window.api.getData('/turmas?limit=500'),
    ]);
    alunosMap = toMap(alunos, 'pessoa_id');
    turmasMap = toMap(turmas, 'idTurma');
  } catch (e) { console.error('Erro ao carregar lookups:', e); }
}

function nomeAluno(pid) { const a = alunosMap[pid]; return a ? a.nome : `#${pid}`; }
function nomeTurma(id)  { const t = turmasMap[id];  return t ? t.nomeTurma : `#${id}`; }

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
  tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:3rem"><div class="spinner spinner-lg" style="margin:0 auto"></div></td></tr>`;
  try {
    await loadLookups();
    const r = await window.api.getData(ENDPOINT);
    allData = Array.isArray(r) ? r : [];
    filteredData = [...allData];
    document.getElementById('table-count').textContent = `${allData.length} registro(s)`;
    renderTable();
  } catch (e) {
    console.error(e);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:3rem;color:var(--danger)">Erro ao carregar.</td></tr>`;
  }
}

function renderTable() {
  const tbody = document.getElementById('table-body');
  const pag = document.getElementById('pagination-container');
  if (filteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><h3>Nenhuma matrícula encontrada</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(m => `
    <tr>
      <td class="cell-id">${m.idMatricula}</td>
      <td>${nomeAluno(m.pessoa_id)}</td>
      <td>${nomeTurma(m.idTurma)}</td>
      <td>${m.anoLetivo}/${m.semestre}</td>
      <td>${formatDate(m.dataMatricula)}</td>
      <td><span class="badge">${m.statusMatricula}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="enturmar(${m.idMatricula})" title="Cria cursamentos para todas as ofertas ATIVAs da turma/semestre">Enturmar</button>
      </td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${m.idMatricula})">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${m.idMatricula})">🗑</button>
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

function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleDateString('pt-BR');
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase();
  filteredData = allData.filter(m =>
    nomeAluno(m.pessoa_id).toLowerCase().includes(q) ||
    nomeTurma(m.idTurma).toLowerCase().includes(q) ||
    String(m.idMatricula).includes(q) ||
    (m.statusMatricula && m.statusMatricula.toLowerCase().includes(q))
  );
  currentPage = 1;
  renderTable();
}

async function loadSelects() {
  await loadLookups();
  const alSel = document.getElementById('field-pessoa_id');
  alSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(alunosMap).map(a => `<option value="${a.pessoa_id}">${a.nome} (RA ${a.RAaluno})</option>`).join('');
  const tuSel = document.getElementById('field-idTurma');
  tuSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(turmasMap).map(t => `<option value="${t.idTurma}">${t.nomeTurma} — ${t.turno} (${t.anoLetivo})</option>`).join('');
}

async function openModal(data = null) {
  editingId = data ? data.idMatricula : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Matrícula' : 'Nova Matrícula';
  document.getElementById('form-entity').reset();
  await loadSelects();

  // Em edição, só status/data podem mudar (procedure restringe).
  ['field-pessoa_id','field-idTurma','field-anoLetivo','field-semestre']
    .forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !!data; });

  document.getElementById('field-anoLetivo').value = data ? data.anoLetivo : new Date().getFullYear();
  document.getElementById('field-semestre').value  = data ? data.semestre : 1;

  if (data) {
    document.getElementById('field-pessoa_id').value       = data.pessoa_id;
    document.getElementById('field-idTurma').value         = data.idTurma;
    document.getElementById('field-dataMatricula').value   = data.dataMatricula || '';
    document.getElementById('field-statusMatricula').value = data.statusMatricula || 'ATIVA';
  } else {
    document.getElementById('field-dataMatricula').value = new Date().toISOString().slice(0,10);
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

  try {
    if (editingId) {
      const update = {
        statusMatricula: document.getElementById('field-statusMatricula').value,
        dataMatricula:   document.getElementById('field-dataMatricula').value || null,
      };
      await window.api.putData(`${ENDPOINT}/${editingId}`, update);
      window.ui && window.ui.Toast && window.ui.Toast.success('Matrícula atualizada!');
    } else {
      const payload = {
        anoLetivo:       parseInt(document.getElementById('field-anoLetivo').value, 10),
        semestre:        parseInt(document.getElementById('field-semestre').value, 10),
        dataMatricula:   document.getElementById('field-dataMatricula').value,
        statusMatricula: document.getElementById('field-statusMatricula').value,
        pessoa_id:       parseInt(document.getElementById('field-pessoa_id').value, 10),
        idTurma:         parseInt(document.getElementById('field-idTurma').value, 10),
      };
      await window.api.postData(ENDPOINT, payload);
      window.ui && window.ui.Toast && window.ui.Toast.success('Matrícula cadastrada!');
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
    window.ui.Modal.confirm({ title:'Excluir Matrícula', message:'Confirma exclusão?', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(id) });
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

async function enturmar(id) {
  try {
    await window.api.postData(`${ENDPOINT}/${id}/enturmar`, {});
    window.ui && window.ui.Toast && window.ui.Toast.success('Aluno enturmado! Cursamentos criados.');
  } catch (e) {
    console.error(e);
    window.ui && window.ui.Toast && window.ui.Toast.error(e.message || 'Erro ao enturmar');
  }
}

function setupLogout() {
  document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(b =>
    b.addEventListener('click', e => { e.preventDefault(); window.auth && window.auth.logout && window.auth.logout(); }));
}

window.editItem = editItem;
window.deleteItem = deleteItem;
window.enturmar = enturmar;
window.loadData = loadData;
