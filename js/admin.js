/**
 * Admin Page Module
 * Manages the admin interface for user management
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

// Initialize services
const storageManager = new StorageManager();
const userService = new UserService(storageManager);
const authService = new AuthService(storageManager, userService);

// State
let editingUserId = null;

/**
 * Initialize the admin page
 * Implements route protection - only admins can access
 * Requirements: 2.4
 */
function initAdminPage() {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    // Not authenticated - redirect to main page (which will show login)
    notificationService.error('Você precisa estar autenticado para acessar esta página.');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    return;
  }
  
  // Check admin privileges - redirect if not admin
  if (!authService.isAdmin()) {
    notificationService.error('Acesso negado. Apenas administradores podem acessar esta página.');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    return;
  }

  // Set up navigation
  setupNavigation();

  // Set up event listeners
  setupEventListeners();

  // Load and display users
  loadUsers();
}

/**
 * Set up navigation menu
 */
function setupNavigation() {
  const navMenu = document.getElementById('nav-menu');
  const currentUser = authService.getCurrentUser();
  
  navMenu.innerHTML = `
    <a href="index.html">Filmes</a>
    <a href="admin.html" class="active">Admin</a>
    <span style="margin-left: auto; color: #9ab;">Olá, ${currentUser.username}</span>
    <button id="logout-btn" style="margin-left: 1rem;">Sair</button>
  `;

  // Logout button handler
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  const createUserForm = document.getElementById('create-user-form');
  createUserForm.addEventListener('submit', handleCreateUser);
}

/**
 * Load and display all users
 */
function loadUsers() {
  const users = userService.getAllUsers();
  const tbody = document.getElementById('users-tbody');
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum usuário cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr data-user-id="${user.id}">
      <td>${escapeHtml(user.username)}</td>
      <td>${user.isAdmin ? 'Administrador' : 'Usuário'}</td>
      <td>
        <button class="edit-btn" data-user-id="${user.id}">Editar</button>
        <button class="delete-btn" data-user-id="${user.id}" style="background-color: #ff4444; margin-left: 0.5rem;">Remover</button>
      </td>
    </tr>
  `).join('');

  // Add event listeners to action buttons
  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', handleEditUser);
  });

  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', handleDeleteUser);
  });
}

/**
 * Handle create user form submission
 */
async function handleCreateUser(event) {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const isAdmin = document.getElementById('is-admin').checked;
  const submitBtn = event.target.querySelector('button[type="submit"]');

  // Validate input
  if (!username || !password) {
    notificationService.error('Por favor, preencha todos os campos.');
    return;
  }

  // Set button loading state
  notificationService.setButtonLoading(submitBtn, true);

  try {
    // Hash password and create user
    const passwordHash = authService.hashPassword(password);
    userService.createUser(username, passwordHash, isAdmin);

    // Show success notification
    notificationService.success('Usuário criado com sucesso!');

    // Clear form
    document.getElementById('create-user-form').reset();

    // Reload user list
    loadUsers();
  } catch (error) {
    notificationService.error(`Erro ao criar usuário: ${error.message}`);
  } finally {
    // Remove button loading state
    notificationService.setButtonLoading(submitBtn, false);
  }
}

/**
 * Handle edit user button click
 */
function handleEditUser(event) {
  const userId = event.target.dataset.userId;
  const user = userService.getUserById(userId);

  if (!user) {
    notificationService.error('Usuário não encontrado.');
    return;
  }

  // Get the row
  const row = document.querySelector(`tr[data-user-id="${userId}"]`);
  
  // Replace row content with edit form
  row.innerHTML = `
    <td>
      <input type="text" id="edit-username-${userId}" value="${escapeHtml(user.username)}" style="width: 100%;">
    </td>
    <td>
      <label>
        <input type="checkbox" id="edit-isadmin-${userId}" ${user.isAdmin ? 'checked' : ''}>
        Admin
      </label>
    </td>
    <td>
      <button class="save-btn" data-user-id="${userId}">Salvar</button>
      <button class="cancel-btn" data-user-id="${userId}" style="background-color: #666; margin-left: 0.5rem;">Cancelar</button>
      <div style="margin-top: 0.5rem;">
        <input type="password" id="edit-password-${userId}" placeholder="Nova senha (opcional)" style="width: 100%;">
      </div>
    </td>
  `;

  // Add event listeners
  row.querySelector('.save-btn').addEventListener('click', handleSaveUser);
  row.querySelector('.cancel-btn').addEventListener('click', () => loadUsers());
}

/**
 * Handle save user changes
 */
function handleSaveUser(event) {
  const userId = event.target.dataset.userId;
  const username = document.getElementById(`edit-username-${userId}`).value.trim();
  const isAdmin = document.getElementById(`edit-isadmin-${userId}`).checked;
  const newPassword = document.getElementById(`edit-password-${userId}`).value;
  const saveBtn = event.target;

  if (!username) {
    notificationService.error('Nome de usuário não pode estar vazio.');
    return;
  }

  // Set button loading state
  notificationService.setButtonLoading(saveBtn, true);

  try {
    const updates = {
      username,
      isAdmin
    };

    // Only update password if provided
    if (newPassword) {
      updates.passwordHash = authService.hashPassword(newPassword);
    }

    userService.updateUser(userId, updates);
    notificationService.success('Usuário atualizado com sucesso!');
    loadUsers();
  } catch (error) {
    notificationService.error(`Erro ao atualizar usuário: ${error.message}`);
    notificationService.setButtonLoading(saveBtn, false);
  }
}

/**
 * Handle delete user button click
 */
function handleDeleteUser(event) {
  const userId = event.target.dataset.userId;
  const user = userService.getUserById(userId);

  if (!user) {
    notificationService.error('Usuário não encontrado.');
    return;
  }

  // Confirm deletion
  const confirmed = confirm(`Tem certeza que deseja remover o usuário "${user.username}"?`);
  
  if (!confirmed) {
    return;
  }

  try {
    userService.deleteUser(userId);
    notificationService.success('Usuário removido com sucesso!');
    loadUsers();
  } catch (error) {
    notificationService.error(`Erro ao remover usuário: ${error.message}`);
  }
}

/**
 * Handle logout - clear session and redirect
 * Requirements: 2.4
 */
function handleLogout() {
  // Clear session
  authService.logout();
  
  // Show notification
  notificationService.success('Logout realizado com sucesso!');
  
  // Redirect to main page after short delay
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Add CSS for active nav link
const style = document.createElement('style');
style.textContent = `
  nav a.active {
    background-color: #445566;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
  initAdminPage();
}
