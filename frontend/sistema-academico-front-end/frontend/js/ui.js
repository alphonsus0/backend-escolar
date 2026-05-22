/* ================================================== */
/* UI.JS - Componentes de Interface */
/* ================================================== */

/**
 * Sistema de Toasts (Notificações)
 */
const Toast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  
  show(message, type = 'info', title = null, duration = 4000) {
    this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    
    const titles = {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção',
      info: 'Informação'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title || titles[type]}</div>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Fechar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.hide(toast));
    
    this.container.appendChild(toast);
    
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }
    
    return toast;
  },
  
  hide(toast) {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  },
  
  success(message, title = null) {
    return this.show(message, 'success', title);
  },
  
  error(message, title = null) {
    return this.show(message, 'error', title);
  },
  
  warning(message, title = null) {
    return this.show(message, 'warning', title);
  },
  
  info(message, title = null) {
    return this.show(message, 'info', title);
  }
};

/**
 * Sistema de Modais
 */
const Modal = {
  activeModal: null,
  
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      this.activeModal = modal;
      document.body.style.overflow = 'hidden';
      
      // Foca no primeiro input
      const firstInput = modal.querySelector('input, select, textarea');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
  },
  
  close(modalId = null) {
    const modal = modalId ? document.getElementById(modalId) : this.activeModal;
    if (modal) {
      modal.classList.remove('active');
      this.activeModal = null;
      document.body.style.overflow = '';
    }
  },
  
  confirm(options) {
    const {
      title = 'Confirmar ação',
      message = 'Deseja continuar?',
      type = 'warning',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      onConfirm = () => {},
      onCancel = () => {}
    } = options;
    
    const icons = {
      danger: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    };
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal modal-sm confirm-modal">
        <div class="modal-body">
          <div class="confirm-icon ${type}">${icons[type]}</div>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" data-action="cancel">${cancelText}</button>
          <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" data-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    const handleAction = (action) => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 300);
      
      if (action === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    };
    
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => handleAction('cancel'));
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => handleAction('confirm'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handleAction('cancel');
    });
  }
};

/**
 * Loading States
 */
const Loading = {
  show(container = document.body, message = 'Carregando...') {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-content">
        <div class="spinner spinner-lg"></div>
        <p>${message}</p>
      </div>
    `;
    container.style.position = 'relative';
    container.appendChild(overlay);
    return overlay;
  },
  
  hide(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  },
  
  button(button, loading = true) {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = '<div class="spinner"></div> Aguarde...';
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
  }
};

/**
 * Paginação
 */
const Pagination = {
  create(options) {
    const {
      currentPage = 1,
      totalPages = 1,
      totalItems = 0,
      itemsPerPage = 10,
      onPageChange = () => {}
    } = options;
    
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    
    let paginationHTML = '<div class="table-footer">';
    paginationHTML += `<div class="table-info">Mostrando ${startItem} - ${endItem} de ${totalItems} registros</div>`;
    paginationHTML += '<div class="pagination">';
    
    // Botão anterior
    paginationHTML += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;
    
    // Números das páginas
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
      paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        paginationHTML += '<span class="pagination-ellipsis">...</span>';
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += '<span class="pagination-ellipsis">...</span>';
      }
      paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Botão próximo
    paginationHTML += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;
    
    paginationHTML += '</div></div>';
    
    return paginationHTML;
  },
  
  init(container, onPageChange) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.pagination-btn');
      if (btn && !btn.disabled) {
        const page = parseInt(btn.dataset.page);
        onPageChange(page);
      }
    });
  }
};

/**
 * Tabela Dinâmica
 */
const Table = {
  render(options) {
    const {
      columns = [],
      data = [],
      emptyMessage = 'Nenhum registro encontrado',
      loading = false,
      actions = true
    } = options;
    
    if (loading) {
      return `
        <div class="table-loading">
          <div class="spinner spinner-lg"></div>
          <p>Carregando dados...</p>
        </div>
      `;
    }
    
    if (data.length === 0) {
      return `
        <div class="table-empty">
          <div class="table-empty-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </div>
          <h3>${emptyMessage}</h3>
          <p>Clique em "Novo" para adicionar um registro.</p>
        </div>
      `;
    }
    
    let html = '<div class="table-wrapper"><table class="data-table">';
    
    // Header
    html += '<thead><tr>';
    columns.forEach(col => {
      html += `<th>${col.label}</th>`;
    });
    if (actions) {
      html += '<th>Ações</th>';
    }
    html += '</tr></thead>';
    
    // Body
    html += '<tbody>';
    data.forEach(item => {
      html += '<tr>';
      columns.forEach(col => {
        const value = col.render ? col.render(item[col.key], item) : (item[col.key] || '-');
        html += `<td class="${col.class || ''}">${value}</td>`;
      });
      if (actions) {
        html += `
          <td>
            <div class="cell-actions">
              <button class="btn-action edit" data-id="${item.id}" title="Editar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-action delete" data-id="${item.id}" title="Excluir">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              </button>
            </div>
          </td>
        `;
      }
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    
    return html;
  }
};

/**
 * Sidebar e Menu
 */
const Sidebar = {
  init() {
    const menuToggle = document.querySelector('.btn-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      });
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
    
    // Marca o link ativo
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.getAttribute('href') === currentPath || 
          currentPath.includes(link.getAttribute('href').replace('.html', ''))) {
        link.classList.add('active');
      }
    });
  }
};

/**
 * Busca local em tabelas
 */
const TableSearch = {
  init(inputSelector, tableSelector, columns = []) {
    const input = document.querySelector(inputSelector);
    const table = document.querySelector(tableSelector);
    
    if (!input || !table) return;
    
    input.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let found = false;
        
        cells.forEach((cell, index) => {
          if (columns.length === 0 || columns.includes(index)) {
            if (cell.textContent.toLowerCase().includes(searchTerm)) {
              found = true;
            }
          }
        });
        
        row.style.display = found ? '' : 'none';
      });
    });
  }
};

/**
 * Formatadores
 */
const Formatters = {
  date(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  },
  
  datetime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  },
  
  currency(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },
  
  number(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR').format(value);
  },
  
  truncate(str, length = 50) {
    if (!str) return '-';
    return str.length > length ? str.substring(0, length) + '...' : str;
  }
};

// Exporta para uso global
window.ui = {
  Toast,
  Modal,
  Loading,
  Pagination,
  Table,
  Sidebar,
  TableSearch,
  Formatters
};

// ==========================================
// FUNÇÕES GLOBAIS DE COMPATIBILIDADE
// ==========================================

/**
 * Exibe uma notificação toast
 */
function showToast(message, type = 'info') {
  Toast.show(message, type);
}

/**
 * Abre um modal pelo ID
 */
function openModal(modalId) {
  Modal.open(modalId);
}

/**
 * Fecha um modal pelo ID
 */
function closeModal(modalId) {
  Modal.close(modalId);
}

/**
 * Exibe diálogo de confirmação
 */
function showConfirmDialog(title, message, onConfirm) {
  Modal.confirm({
    title,
    message,
    type: 'danger',
    onConfirm
  });
}

/**
 * Mostra loading em um elemento
 */
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.add('loading');
  }
}

/**
 * Remove loading de um elemento
 */
function hideLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.classList.remove('loading');
  }
}

/**
 * Toggle da sidebar em mobile
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  
  if (sidebar) {
    sidebar.classList.toggle('open');
    if (overlay) {
      overlay.classList.toggle('active');
    }
  }
}

/**
 * Formata data para exibição
 */
function formatDate(dateString) {
  return Formatters.date(dateString);
}

/**
 * Formata data e hora para exibição
 */
function formatDateTime(dateString) {
  return Formatters.datetime(dateString);
}

// ==========================================
// INICIALIZAÇÃO GLOBAL
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa a sidebar
  Sidebar.init();
  
  // Fecha modais ao clicar fora
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal(e.target.id);
    }
  });
  
  // Fecha modais com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && Modal.activeModal) {
      closeModal(Modal.activeModal.id);
    }
  });
  
  // Exibe informações do usuário no header
  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    userInfo.textContent = userData.username || 'Usuário';
  }
});
