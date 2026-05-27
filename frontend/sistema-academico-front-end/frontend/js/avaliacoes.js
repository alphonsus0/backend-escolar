/* AVALIACOES.JS - CRUD de Avaliações */

const ENDPOINT = '/avaliacoes';
let currentPage = 1;
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

let ofertasMap = {};       // idOfertaDisciplina -> oferta
let disciplinasMap = {};   // idDisciplina -> disciplina
let turmasMap = {};        // idTurma -> turma

function toMap(arr, key) {
  return Object.fromEntries((arr || []).map(x => [x[key], x]));
}

async function loadLookups() {
  try {
    const [ofertas, disciplinas, turmas] = await Promise.all([
      window.api.getData('/ofertas?limit=500'),
      window.api.getData('/disciplinas?limit=500'),
      window.api.getData('/turmas?limit=500'),
    ]);
    ofertasMap     = toMap(ofertas, 'idOfertaDisciplina');
    disciplinasMap = toMap(disciplinas, 'idDisciplina');
    turmasMap      = toMap(turmas, 'idTurma');
  } catch (e) { console.error('Erro ao carregar lookups:', e); }
}

function descOferta(idOferta) {
  const o = ofertasMap[idOferta];
  if (!o) return `#${idOferta}`;
  const d = disciplinasMap[o.idDisciplina];
  const t = turmasMap[o.idTurma];
  const dn = d ? d.nomeDisciplina : `disc #${o.idDisciplina}`;
  const tn = t ? t.nomeTurma : `turma #${o.idTurma}`;
  return `${dn} — ${tn} (${o.anoLetivo}/${o.semestre})`;
}

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
    await loadLookups();
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
    tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><h3>Nenhuma avaliação encontrada</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(a => `
    <tr>
      <td class="cell-id">${a.idAvaliacao}</td>
      <td class="cell-name">${a.nomeAvaliacao || '-'}</td>
      <td>${a.tipoAvaliacao}</td>
      <td>${formatDate(a.dataAvaliacao)}</td>
      <td>${a.peso}</td>
      <td>${descOferta(a.idOfertaDisciplina)}</td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${a.idAvaliacao})">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${a.idAvaliacao})">🗑</button>
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
  filteredData = allData.filter(a =>
    (a.nomeAvaliacao && a.nomeAvaliacao.toLowerCase().includes(q)) ||
    (a.tipoAvaliacao && a.tipoAvaliacao.toLowerCase().includes(q)) ||
    String(a.idAvaliacao).includes(q)
  );
  currentPage = 1;
  renderTable();
}

async function loadOfertaSelect() {
  await loadLookups();
  const sel = document.getElementById('field-idOfertaDisciplina');
  sel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(ofertasMap).map(o => `<option value="${o.idOfertaDisciplina}">${descOferta(o.idOfertaDisciplina)}</option>`).join('');
}

async function openModal(data = null) {
  editingId = data ? data.idAvaliacao : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Avaliação' : 'Nova Avaliação';
  document.getElementById('form-entity').reset();
  await loadOfertaSelect();

  const ofertaF = document.getElementById('field-idOfertaDisciplina');
  ofertaF.disabled = !!data;

  if (data) {
    document.getElementById('field-peso').value               = data.peso;
    document.getElementById('field-nomeAvaliacao').value      = data.nomeAvaliacao;
    document.getElementById('field-dataAvaliacao').value      = data.dataAvaliacao;
    document.getElementById('field-tipoAvaliacao').value      = data.tipoAvaliacao;
    document.getElementById('field-descAvaliacao').value      = data.descAvaliacao || '';
    document.getElementById('field-idOfertaDisciplina').value = data.idOfertaDisciplina;
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
    peso:          parseFloat(document.getElementById('field-peso').value),
    nomeAvaliacao: document.getElementById('field-nomeAvaliacao').value.trim(),
    dataAvaliacao: document.getElementById('field-dataAvaliacao').value,
    tipoAvaliacao: document.getElementById('field-tipoAvaliacao').value,
    descAvaliacao: document.getElementById('field-descAvaliacao').value.trim() || null,
  };

  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, base);
      window.ui && window.ui.Toast && window.ui.Toast.success('Avaliação atualizada!');
    } else {
      const payload = {
        idOfertaDisciplina: parseInt(document.getElementById('field-idOfertaDisciplina').value, 10),
        ...base,
      };
      await window.api.postData(ENDPOINT, payload);
      window.ui && window.ui.Toast && window.ui.Toast.success('Avaliação cadastrada!');
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
    window.ui.Modal.confirm({ title:'Excluir Avaliação', message:'Confirma exclusão?', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(id) });
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
