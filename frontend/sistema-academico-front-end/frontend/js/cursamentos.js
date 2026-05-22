// ==========================================
// CURSAMENTOS - CRUD Operations
// ==========================================

let cursamentosData = [];
let cursamentosFiltrados = [];
let paginaAtualCursamentos = 1;
const itensPorPaginaCursamentos = 10;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    carregarCursamentos();
    carregarSelectsParaCursamento();
    setupEventListeners();
});

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchCursamentos');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtrarCursamentos(e.target.value);
        });
    }

    // Formulário
    const form = document.getElementById('formCursamento');
    if (form) {
        form.addEventListener('submit', handleSubmitCursamento);
    }
}

// ==========================================
// CARREGAR DADOS
// ==========================================

async function carregarCursamentos() {
    try {
        showLoading('tableCursamentos');
        cursamentosData = await getData('cursamentos');
        cursamentosFiltrados = [...cursamentosData];
        renderizarTabelaCursamentos();
    } catch (error) {
        showToast('Erro ao carregar cursamentos: ' + error.message, 'error');
    } finally {
        hideLoading('tableCursamentos');
    }
}

async function carregarSelectsParaCursamento() {
    try {
        // Carregar matrículas para o select
        const matriculas = await getData('matriculas');
        const selectMatricula = document.getElementById('cursamentoMatricula');
        if (selectMatricula) {
            selectMatricula.innerHTML = '<option value="">Selecione uma matrícula</option>';
            matriculas.forEach(m => {
                selectMatricula.innerHTML += `<option value="${m.id_matricula}">Matrícula #${m.id_matricula} - Aluno ${m.id_aluno}</option>`;
            });
        }

        // Carregar ofertas para o select
        const ofertas = await getData('ofertas');
        const selectOferta = document.getElementById('cursamentoOferta');
        if (selectOferta) {
            selectOferta.innerHTML = '<option value="">Selecione uma oferta</option>';
            ofertas.forEach(o => {
                selectOferta.innerHTML += `<option value="${o.id_oferta}">Oferta #${o.id_oferta} - Turma ${o.id_turma} / Disciplina ${o.id_disciplina}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================

function renderizarTabelaCursamentos() {
    const tbody = document.querySelector('#tableCursamentos tbody');
    if (!tbody) return;

    const inicio = (paginaAtualCursamentos - 1) * itensPorPaginaCursamentos;
    const fim = inicio + itensPorPaginaCursamentos;
    const cursamentosPagina = cursamentosFiltrados.slice(inicio, fim);

    if (cursamentosPagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">📚</div>
                    <p>Nenhum cursamento encontrado</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = cursamentosPagina.map(c => `
        <tr>
            <td>${c.id_cursamento}</td>
            <td>${c.id_matricula}</td>
            <td>${c.id_oferta}</td>
            <td>${c.status || 'Em andamento'}</td>
            <td><span class="badge ${c.frequencia >= 75 ? 'badge-success' : 'badge-danger'}">${c.frequencia || 0}%</span></td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editarCursamento(${c.id_cursamento})" title="Editar">
                    <span class="icon">✏️</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmarExclusaoCursamento(${c.id_cursamento})" title="Excluir">
                    <span class="icon">🗑️</span>
                </button>
            </td>
        </tr>
    `).join('');

    renderizarPaginacaoCursamentos();
}

function renderizarPaginacaoCursamentos() {
    const totalPaginas = Math.ceil(cursamentosFiltrados.length / itensPorPaginaCursamentos);
    const pagination = document.getElementById('paginationCursamentos');
    if (!pagination) return;

    let html = '';
    
    html += `<button class="btn btn-sm" ${paginaAtualCursamentos === 1 ? 'disabled' : ''} onclick="mudarPaginaCursamentos(${paginaAtualCursamentos - 1})">Anterior</button>`;
    
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="btn btn-sm ${i === paginaAtualCursamentos ? 'btn-primary' : ''}" onclick="mudarPaginaCursamentos(${i})">${i}</button>`;
    }
    
    html += `<button class="btn btn-sm" ${paginaAtualCursamentos === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaCursamentos(${paginaAtualCursamentos + 1})">Próximo</button>`;
    
    pagination.innerHTML = html;
}

function mudarPaginaCursamentos(pagina) {
    const totalPaginas = Math.ceil(cursamentosFiltrados.length / itensPorPaginaCursamentos);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaAtualCursamentos = pagina;
    renderizarTabelaCursamentos();
}

// ==========================================
// FILTRO
// ==========================================

function filtrarCursamentos(termo) {
    termo = termo.toLowerCase();
    cursamentosFiltrados = cursamentosData.filter(c => 
        String(c.id_cursamento).includes(termo) ||
        String(c.id_matricula).includes(termo) ||
        String(c.id_oferta).includes(termo) ||
        (c.status && c.status.toLowerCase().includes(termo))
    );
    paginaAtualCursamentos = 1;
    renderizarTabelaCursamentos();
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

function abrirModalCursamento() {
    document.getElementById('modalCursamentoTitle').textContent = 'Novo Cursamento';
    document.getElementById('formCursamento').reset();
    document.getElementById('cursamentoId').value = '';
    openModal('modalCursamento');
}

async function editarCursamento(id) {
    try {
        showLoading('formCursamento');
        const cursamento = await getData(`cursamentos/${id}`);
        
        document.getElementById('modalCursamentoTitle').textContent = 'Editar Cursamento';
        document.getElementById('cursamentoId').value = cursamento.id_cursamento;
        document.getElementById('cursamentoMatricula').value = cursamento.id_matricula;
        document.getElementById('cursamentoOferta').value = cursamento.id_oferta;
        document.getElementById('cursamentoStatus').value = cursamento.status || '';
        document.getElementById('cursamentoFrequencia').value = cursamento.frequencia || 0;
        
        openModal('modalCursamento');
    } catch (error) {
        showToast('Erro ao carregar cursamento: ' + error.message, 'error');
    } finally {
        hideLoading('formCursamento');
    }
}

async function handleSubmitCursamento(e) {
    e.preventDefault();
    
    const id = document.getElementById('cursamentoId').value;
    const dados = {
        id_matricula: parseInt(document.getElementById('cursamentoMatricula').value),
        id_oferta: parseInt(document.getElementById('cursamentoOferta').value),
        status: document.getElementById('cursamentoStatus').value,
        frequencia: parseFloat(document.getElementById('cursamentoFrequencia').value) || 0
    };

    try {
        showLoading('formCursamento');
        
        if (id) {
            await putData(`cursamentos/${id}`, dados);
            showToast('Cursamento atualizado com sucesso!', 'success');
        } else {
            await postData('cursamentos', dados);
            showToast('Cursamento criado com sucesso!', 'success');
        }
        
        closeModal('modalCursamento');
        await carregarCursamentos();
    } catch (error) {
        showToast('Erro ao salvar cursamento: ' + error.message, 'error');
    } finally {
        hideLoading('formCursamento');
    }
}

function confirmarExclusaoCursamento(id) {
    showConfirmDialog(
        'Excluir Cursamento',
        'Tem certeza que deseja excluir este cursamento? Esta ação não pode ser desfeita.',
        () => excluirCursamento(id)
    );
}

async function excluirCursamento(id) {
    try {
        await deleteData(`cursamentos/${id}`);
        showToast('Cursamento excluído com sucesso!', 'success');
        await carregarCursamentos();
    } catch (error) {
        showToast('Erro ao excluir cursamento: ' + error.message, 'error');
    }
}
