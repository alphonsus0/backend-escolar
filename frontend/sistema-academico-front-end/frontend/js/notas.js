/* NOTAS.JS - CRUD de Notas */

const ENDPOINT = '/notas';
let currentPage = 1;
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingId = null;

// Lookups carregados sob demanda para mostrar nomes em vez de IDs.
let alunosMap = {};        // pessoa_id -> aluno
let matriculasMap = {};    // idMatricula -> matricula
let disciplinasMap = {};   // idDisciplina -> disciplina
let ofertasMap = {};       // idOfertaDisciplina -> oferta
let avaliacoesMap = {};    // idAvaliacao -> avaliacao

function toMap(arr, key) {
  return Object.fromEntries((arr || []).map(x => [x[key], x]));
}

async function loadLookups() {
  try {
    const [alunos, matriculas, disciplinas, ofertas, avaliacoes] = await Promise.all([
      window.api.getData('/alunos?limit=500'),
      window.api.getData('/matriculas?limit=500'),
      window.api.getData('/disciplinas?limit=500'),
      window.api.getData('/ofertas?limit=500'),
      window.api.getData('/avaliacoes?limit=500'),
    ]);
    alunosMap      = toMap(alunos, 'pessoa_id');
    matriculasMap  = toMap(matriculas, 'idMatricula');
    disciplinasMap = toMap(disciplinas, 'idDisciplina');
    ofertasMap     = toMap(ofertas, 'idOfertaDisciplina');
    avaliacoesMap  = toMap(avaliacoes, 'idAvaliacao');
  } catch (e) { console.error('Erro ao carregar lookups:', e); }
}

function nomeAlunoDaMatricula(siMatricula) {
  const m = matriculasMap[siMatricula];
  if (!m) return `#${siMatricula}`;
  const a = alunosMap[m.pessoa_id];
  return a ? a.nome : `aluno #${m.pessoa_id}`;
}

function nomeDisciplinaDaOferta(idOferta) {
  const o = ofertasMap[idOferta];
  if (!o) return `#${idOferta}`;
  const d = disciplinasMap[o.idDisciplina];
  return d ? d.nomeDisciplina : `disc #${o.idDisciplina}`;
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
    tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><h3>Nenhuma nota encontrada</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(n => {
    const av = avaliacoesMap[n.idAvaliacao];
    const nomeAv = av ? av.nomeAvaliacao : `#${n.idAvaliacao}`;
    return `
    <tr>
      <td class="cell-id">${n.idNota}</td>
      <td>${nomeAlunoDaMatricula(n.siMatricula)}</td>
      <td>${nomeDisciplinaDaOferta(n.idOfertaDisciplina)}</td>
      <td>${nomeAv}</td>
      <td><strong>${parseFloat(n.nota).toFixed(2)}</strong></td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${n.idNota})">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${n.idNota})">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  if (window.ui && window.ui.Pagination) {
    pag.innerHTML = window.ui.Pagination.create({ currentPage, totalPages: total, totalItems: filteredData.length, itemsPerPage });
    pag.querySelectorAll('.pagination-btn').forEach(b => b.addEventListener('click', () => {
      if (!b.disabled) { currentPage = parseInt(b.dataset.page); renderTable(); }
    }));
  }
}

function handleSearch(e) {
  const q = e.target.value.toLowerCase();
  filteredData = allData.filter(n => {
    const aluno = nomeAlunoDaMatricula(n.siMatricula).toLowerCase();
    const disc  = nomeDisciplinaDaOferta(n.idOfertaDisciplina).toLowerCase();
    const av    = avaliacoesMap[n.idAvaliacao];
    const avNome = av ? av.nomeAvaliacao.toLowerCase() : '';
    return aluno.includes(q) || disc.includes(q) || avNome.includes(q) ||
           String(n.idNota).includes(q);
  });
  currentPage = 1;
  renderTable();
}

async function loadSelects() {
  await loadLookups();
  const matSel = document.getElementById('field-siMatricula');
  matSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(matriculasMap).map(m => {
      const a = alunosMap[m.pessoa_id];
      const nome = a ? a.nome : `aluno #${m.pessoa_id}`;
      return `<option value="${m.idMatricula}">${nome} — matrícula #${m.idMatricula} (${m.anoLetivo}/${m.semestre})</option>`;
    }).join('');
  const ofSel = document.getElementById('field-idOfertaDisciplina');
  ofSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(ofertasMap).map(o => {
      const d = disciplinasMap[o.idDisciplina];
      const nome = d ? d.nomeDisciplina : `disc #${o.idDisciplina}`;
      return `<option value="${o.idOfertaDisciplina}">${nome} — ${o.anoLetivo}/${o.semestre} (turma ${o.idTurma})</option>`;
    }).join('');
  const avSel = document.getElementById('field-idAvaliacao');
  avSel.innerHTML = '<option value="">Selecione...</option>' +
    Object.values(avaliacoesMap).map(a => `<option value="${a.idAvaliacao}">${a.nomeAvaliacao} (peso ${a.peso})</option>`).join('');
}

async function openModal(data = null) {
  editingId = data ? data.idNota : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Nota' : 'Nova Nota';
  document.getElementById('form-entity').reset();
  await loadSelects();

  // Em edição, só `nota` pode mudar (procedure restringe).
  ['field-siMatricula','field-idOfertaDisciplina','field-idAvaliacao']
    .forEach(id => { const el = document.getElementById(id); if (el) el.disabled = !!data; });

  if (data) {
    document.getElementById('field-siMatricula').value        = data.siMatricula;
    document.getElementById('field-idOfertaDisciplina').value = data.idOfertaDisciplina;
    document.getElementById('field-idAvaliacao').value        = data.idAvaliacao;
    document.getElementById('field-nota').value               = data.nota;
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
  document.getElementById('field-nota').focus();
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

  const nota = parseFloat(document.getElementById('field-nota').value);

  try {
    if (editingId) {
      await window.api.putData(`${ENDPOINT}/${editingId}`, { nota });
      window.ui && window.ui.Toast && window.ui.Toast.success('Nota atualizada!');
    } else {
      const payload = {
        siMatricula:        parseInt(document.getElementById('field-siMatricula').value, 10),
        idOfertaDisciplina: parseInt(document.getElementById('field-idOfertaDisciplina').value, 10),
        idAvaliacao:        parseInt(document.getElementById('field-idAvaliacao').value, 10),
        nota,
      };
      await window.api.postData(ENDPOINT, payload);
      window.ui && window.ui.Toast && window.ui.Toast.success('Nota lançada! Média recalculada via trigger.');
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
    window.ui.Modal.confirm({ title:'Excluir Nota', message:'A média será recalculada.', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(id) });
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
