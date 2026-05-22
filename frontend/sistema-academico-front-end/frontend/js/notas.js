// ==========================================
// NOTAS - CRUD Operations
// ==========================================

let notasData = [];
let notasFiltradas = [];
let paginaAtualNotas = 1;
const itensPorPaginaNotas = 10;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    carregarNotas();
    carregarSelectsParaNota();
    setupEventListeners();
});

function setupEventListeners() {
    // Busca
    const searchInput = document.getElementById('searchNotas');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtrarNotas(e.target.value);
        });
    }

    // Formulário
    const form = document.getElementById('formNota');
    if (form) {
        form.addEventListener('submit', handleSubmitNota);
    }
}

// ==========================================
// CARREGAR DADOS
// ==========================================

async function carregarNotas() {
    try {
        showLoading('tableNotas');
        notasData = await getData('notas');
        notasFiltradas = [...notasData];
        renderizarTabelaNotas();
    } catch (error) {
        showToast('Erro ao carregar notas: ' + error.message, 'error');
    } finally {
        hideLoading('tableNotas');
    }
}

async function carregarSelectsParaNota() {
    try {
        // Carregar cursamentos para o select
        const cursamentos = await getData('cursamentos');
        const selectCursamento = document.getElementById('notaCursamento');
        if (selectCursamento) {
            selectCursamento.innerHTML = '<option value="">Selecione um cursamento</option>';
            cursamentos.forEach(c => {
                selectCursamento.innerHTML += `<option value="${c.id_cursamento}">Cursamento #${c.id_cursamento}</option>`;
            });
        }

        // Carregar avaliações para o select
        const avaliacoes = await getData('avaliacoes');
        const selectAvaliacao = document.getElementById('notaAvaliacao');
        if (selectAvaliacao) {
            selectAvaliacao.innerHTML = '<option value="">Selecione uma avaliação</option>';
            avaliacoes.forEach(a => {
                selectAvaliacao.innerHTML += `<option value="${a.id_avaliacao}">${a.descricao || 'Avaliação #' + a.id_avaliacao} - Peso: ${a.peso || 1}</option>`;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar selects:', error);
    }
}

// ==========================================
// RENDERIZAÇÃO
// ==========================================

function renderizarTabelaNotas() {
    const tbody = document.querySelector('#tableNotas tbody');
    if (!tbody) return;

    const inicio = (paginaAtualNotas - 1) * itensPorPaginaNotas;
    const fim = inicio + itensPorPaginaNotas;
    const notasPagina = notasFiltradas.slice(inicio, fim);

    if (notasPagina.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-icon">💯</div>
                    <p>Nenhuma nota encontrada</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = notasPagina.map(n => `
        <tr>
            <td>${n.id_nota}</td>
            <td>${n.id_cursamento}</td>
            <td>${n.id_avaliacao}</td>
            <td><span class="badge ${getNotaBadgeClass(n.valor)}">${n.valor !== null && n.valor !== undefined ? n.valor.toFixed(1) : '-'}</span></td>
            <td>${n.data_lancamento ? formatDate(n.data_lancamento) : '-'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editarNota(${n.id_nota})" title="Editar">
                    <span class="icon">✏️</span>
                </button>
                <button class="btn btn-sm btn-danger" onclick="confirmarExclusaoNota(${n.id_nota})" title="Excluir">
                    <span class="icon">🗑️</span>
                </button>
            </td>
        </tr>
    `).join('');

    renderizarPaginacaoNotas();
}

function getNotaBadgeClass(valor) {
    if (valor === null || valor === undefined) return 'badge-secondary';
    if (valor >= 7) return 'badge-success';
    if (valor >= 5) return 'badge-warning';
    return 'badge-danger';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function renderizarPaginacaoNotas() {
    const totalPaginas = Math.ceil(notasFiltradas.length / itensPorPaginaNotas);
    const pagination = document.getElementById('paginationNotas');
    if (!pagination) return;

    let html = '';
    
    html += `<button class="btn btn-sm" ${paginaAtualNotas === 1 ? 'disabled' : ''} onclick="mudarPaginaNotas(${paginaAtualNotas - 1})">Anterior</button>`;
    
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<button class="btn btn-sm ${i === paginaAtualNotas ? 'btn-primary' : ''}" onclick="mudarPaginaNotas(${i})">${i}</button>`;
    }
    
    html += `<button class="btn btn-sm" ${paginaAtualNotas === totalPaginas ? 'disabled' : ''} onclick="mudarPaginaNotas(${paginaAtualNotas + 1})">Próximo</button>`;
    
    pagination.innerHTML = html;
}

function mudarPaginaNotas(pagina) {
    const totalPaginas = Math.ceil(notasFiltradas.length / itensPorPaginaNotas);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaAtualNotas = pagina;
    renderizarTabelaNotas();
}

// ==========================================
// FILTRO
// ==========================================

function filtrarNotas(termo) {
    termo = termo.toLowerCase();
    notasFiltradas = notasData.filter(n => 
        String(n.id_nota).includes(termo) ||
        String(n.id_cursamento).includes(termo) ||
        String(n.id_avaliacao).includes(termo) ||
        String(n.valor).includes(termo)
    );
    paginaAtualNotas = 1;
    renderizarTabelaNotas();
}

// ==========================================
// CRUD OPERATIONS
// ==========================================

function abrirModalNota() {
    document.getElementById('modalNotaTitle').textContent = 'Nova Nota';
    document.getElementById('formNota').reset();
    document.getElementById('notaId').value = '';
    document.getElementById('notaDataLancamento').value = new Date().toISOString().split('T')[0];
    openModal('modalNota');
}

async function editarNota(id) {
    try {
        showLoading('formNota');
        const nota = await getData(`notas/${id}`);
        
        document.getElementById('modalNotaTitle').textContent = 'Editar Nota';
        document.getElementById('notaId').value = nota.id_nota;
        document.getElementById('notaCursamento').value = nota.id_cursamento;
        document.getElementById('notaAvaliacao').value = nota.id_avaliacao;
        document.getElementById('notaValor').value = nota.valor || '';
        document.getElementById('notaDataLancamento').value = nota.data_lancamento ? nota.data_lancamento.split('T')[0] : '';
        
        openModal('modalNota');
    } catch (error) {
        showToast('Erro ao carregar nota: ' + error.message, 'error');
    } finally {
        hideLoading('formNota');
    }
}

async function handleSubmitNota(e) {
    e.preventDefault();
    
    const id = document.getElementById('notaId').value;
    const dados = {
        id_cursamento: parseInt(document.getElementById('notaCursamento').value),
        id_avaliacao: parseInt(document.getElementById('notaAvaliacao').value),
        valor: parseFloat(document.getElementById('notaValor').value),
        data_lancamento: document.getElementById('notaDataLancamento').value || null
    };

    try {
        showLoading('formNota');
        
        if (id) {
            await putData(`notas/${id}`, dados);
            showToast('Nota atualizada com sucesso!', 'success');
        } else {
            await postData('notas', dados);
            showToast('Nota registrada com sucesso!', 'success');
        }
        
        closeModal('modalNota');
        await carregarNotas();
    } catch (error) {
        showToast('Erro ao salvar nota: ' + error.message, 'error');
    } finally {
        hideLoading('formNota');
    }
}

function confirmarExclusaoNota(id) {
    showConfirmDialog(
        'Excluir Nota',
        'Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.',
        () => excluirNota(id)
    );
}

async function excluirNota(id) {
    try {
        await deleteData(`notas/${id}`);
        showToast('Nota excluída com sucesso!', 'success');
        await carregarNotas();
    } catch (error) {
        showToast('Erro ao excluir nota: ' + error.message, 'error');
    }
}
