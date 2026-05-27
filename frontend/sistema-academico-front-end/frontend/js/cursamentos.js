/* CURSAMENTOS.JS - CRUD de Cursamentos + ação Recalcular Média */

const ENDPOINT = '/cursamentos';
let currentPage = 1;
const itemsPerPage = 10;
let allData = [];
let filteredData = [];
let editingKey = null; // { siMatricula, idOfertaDisciplina }

let alunosMap = {}, matriculasMap = {}, disciplinasMap = {}, turmasMap = {}, ofertasMap = {};

function toMap(arr, key) {
  return Object.fromEntries((arr || []).map(x => [x[key], x]));
}

async function loadLookups() {
  try {
    const [alunos, matriculas, disciplinas, turmas, ofertas] = await Promise.all([
      window.api.getData('/alunos?limit=500'),
      window.api.getData('/matriculas?limit=500'),
      window.api.getData('/disciplinas?limit=500'),
      window.api.getData('/turmas?limit=500'),
      window.api.getData('/ofertas?limit=500'),
    ]);
    alunosMap      = toMap(alunos, 'pessoa_id');
    matriculasMap  = toMap(matriculas, 'idMatricula');
    disciplinasMap = toMap(disciplinas, 'idDisciplina');
    turmasMap      = toMap(turmas, 'idTurma');
    ofertasMap     = toMap(ofertas, 'idOfertaDisciplina');
  } catch (e) { console.error('Erro ao carregar lookups:', e); }
}

function nomeAlunoDaMatricula(siMatricula) {
  const m = matriculasMap[siMatricula];
  if (!m) return `#${siMatricula}`;
  const a = alunosMap[m.pessoa_id];
  return a ? a.nome : `aluno #${m.pessoa_id}`;
}

function descOferta(idOferta) {
  const o = ofertasMap[idOferta];
  if (!o) return `#${idOferta}`;
  const d = disciplinasMap[o.idDisciplina];
  const t = turmasMap[o.idTurma];
  const dn = d ? d.nomeDisciplina : `disc #${o.idDisciplina}`;
  const tn = t ? t.nomeTurma : `turma #${o.idTurma}`;
  return `${dn} — ${tn}`;
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
    tbody.innerHTML = `<tr><td colspan="8"><div class="table-empty"><h3>Nenhum cursamento encontrado</h3></div></td></tr>`;
    pag.innerHTML = '';
    return;
  }
  const total = Math.ceil(filteredData.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  tbody.innerHTML = filteredData.slice(start, start + itemsPerPage).map(c => `
    <tr>
      <td>${nomeAlunoDaMatricula(c.siMatricula)}</td>
      <td>${descOferta(c.idOfertaDisciplina)}</td>
      <td><strong>${c.mediaFinal != null ? parseFloat(c.mediaFinal).toFixed(2) : '—'}</strong></td>
      <td>${c.faltas}</td>
      <td><span class="badge">${c.situacaoFinal}</span></td>
      <td>${c.obs || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="recalcular(${c.siMatricula}, ${c.idOfertaDisciplina})" title="Executa sp_CalcularMediaFinalAluno">Recalcular</button>
      </td>
      <td>
        <div class="cell-actions">
          <button class="btn-action edit" onclick="editItem(${c.siMatricula}, ${c.idOfertaDisciplina})">✎</button>
          <button class="btn-action delete" onclick="deleteItem(${c.siMatricula}, ${c.idOfertaDisciplina})">🗑</button>
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
  filteredData = allData.filter(c => {
    const aluno = nomeAlunoDaMatricula(c.siMatricula).toLowerCase();
    const ofer = descOferta(c.idOfertaDisciplina).toLowerCase();
    return aluno.includes(q) || ofer.includes(q) ||
           (c.situacaoFinal && c.situacaoFinal.toLowerCase().includes(q));
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
    Object.values(ofertasMap).map(o => `<option value="${o.idOfertaDisciplina}">${descOferta(o.idOfertaDisciplina)}</option>`).join('');
}

async function openModal(data = null) {
  editingKey = data ? { siMatricula: data.siMatricula, idOfertaDisciplina: data.idOfertaDisciplina } : null;
  document.getElementById('modal-title').textContent = data ? 'Editar Cursamento' : 'Novo Cursamento';
  document.getElementById('form-entity').reset();
  await loadSelects();

  ['field-siMatricula','field-idOfertaDisciplina'].forEach(id => document.getElementById(id).disabled = !!data);

  if (data) {
    document.getElementById('field-siMatricula').value        = data.siMatricula;
    document.getElementById('field-idOfertaDisciplina').value = data.idOfertaDisciplina;
    document.getElementById('field-faltas').value             = data.faltas;
    document.getElementById('field-situacaoFinal').value      = data.situacaoFinal || 'EM_CURSO';
    document.getElementById('field-obs').value                = data.obs || '';
  } else {
    document.getElementById('field-faltas').value        = 0;
    document.getElementById('field-situacaoFinal').value = 'EM_CURSO';
  }
  document.getElementById('modal-form').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-form').classList.remove('active');
  document.body.style.overflow = '';
  editingKey = null;
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit');
  if (window.ui && window.ui.Loading) window.ui.Loading.button(btn, true);

  try {
    if (editingKey) {
      const payload = {
        faltas:        parseInt(document.getElementById('field-faltas').value, 10),
        situacaoFinal: document.getElementById('field-situacaoFinal').value,
        obs:           document.getElementById('field-obs').value.trim() || null,
      };
      await window.api.putData(`${ENDPOINT}/${editingKey.siMatricula}/${editingKey.idOfertaDisciplina}`, payload);
      window.ui && window.ui.Toast && window.ui.Toast.success('Cursamento atualizado!');
    } else {
      const payload = {
        siMatricula:        parseInt(document.getElementById('field-siMatricula').value, 10),
        idOfertaDisciplina: parseInt(document.getElementById('field-idOfertaDisciplina').value, 10),
        faltas:             parseInt(document.getElementById('field-faltas').value, 10),
        obs:                document.getElementById('field-obs').value.trim() || null,
      };
      await window.api.postData(ENDPOINT, payload);
      window.ui && window.ui.Toast && window.ui.Toast.success('Cursamento criado!');
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

async function editItem(si, oferta) {
  try { openModal(await window.api.getData(`${ENDPOINT}/${si}/${oferta}`)); }
  catch (e) { console.error(e); window.ui && window.ui.Toast && window.ui.Toast.error('Erro ao carregar'); }
}

function deleteItem(si, oferta) {
  if (window.ui && window.ui.Modal) {
    window.ui.Modal.confirm({ title:'Excluir Cursamento', message:'Notas vinculadas também serão excluídas.', type:'danger', confirmText:'Excluir', onConfirm:()=>doDelete(si, oferta) });
  } else if (confirm('Excluir?')) doDelete(si, oferta);
}

async function doDelete(si, oferta) {
  try {
    await window.api.deleteData(`${ENDPOINT}/${si}/${oferta}`);
    window.ui && window.ui.Toast && window.ui.Toast.success('Excluído!');
    await loadData();
  } catch (e) {
    console.error(e);
    window.ui && window.ui.Toast && window.ui.Toast.error(e.message || 'Erro ao excluir');
  }
}

async function recalcular(si, oferta) {
  try {
    await window.api.postData(`${ENDPOINT}/${si}/${oferta}/recalcular-media`, {});
    window.ui && window.ui.Toast && window.ui.Toast.success('Média recalculada!');
    await loadData();
  } catch (e) {
    console.error(e);
    window.ui && window.ui.Toast && window.ui.Toast.error(e.message || 'Erro ao recalcular');
  }
}

function setupLogout() {
  document.querySelectorAll('.btn-logout, [data-action="logout"]').forEach(b =>
    b.addEventListener('click', e => { e.preventDefault(); window.auth && window.auth.logout && window.auth.logout(); }));
}

window.editItem = editItem;
window.deleteItem = deleteItem;
window.recalcular = recalcular;
window.loadData = loadData;
