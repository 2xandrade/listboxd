/**
 * Letterboxd Manager - USERS (Arquivo 2 de 3)
 * 
 * Este arquivo contém todas as funções relacionadas a usuários:
 * - Registro de novos usuários
 * - Login/autenticação
 * - Busca de usuários
 * - Listagem de todos os usuários (admin)
 */

// ============================================================================
// ENDPOINTS DE GERENCIAMENTO DE USUÁRIOS
// ============================================================================

/**
 * Registra um novo usuário
 * Obrigatório: nome, email, senha
 */
function registerUser(data) {
  try {
    const { nome, email, senha } = data;
    
    // Valida campos obrigatórios
    if (!nome || !email || !senha) {
      return createResponse(false, 'Missing required fields: nome, email, senha');
    }
    
    // Valida formato do email
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return createResponse(false, 'Invalid email format');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USUARIOS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Verifica se o email já existe
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === email) { // Coluna C (email)
        return createResponse(false, 'Email already registered');
      }
    }
    
    // Cria novo usuário
    const userId = generateUUID();
    const senhaHash = hashPassword(senha);
    const isAdmin = false;
    const criadoEm = getCurrentTimestamp();
    
    // Adiciona nova linha de usuário
    sheet.appendRow([userId, nome, email, senhaHash, isAdmin, criadoEm]);
    
    const userData = {
      id_usuario: userId,
      nome: nome,
      email: email,
      is_admin: isAdmin,
      criado_em: criadoEm
    };
    
    return createResponse(true, 'User registered successfully', userData);
  } catch (error) {
    Logger.log('Error in registerUser: ' + error.toString());
    return createResponse(false, 'Error registering user: ' + error.toString());
  }
}

/**
 * Autentica usuário
 * Obrigatório: email, senha
 */
function login(data) {
  try {
    const { email, senha } = data;
    
    if (!email || !senha) {
      return createResponse(false, 'Missing required fields: email, senha');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USUARIOS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const senhaHash = hashPassword(senha);
    
    // Busca usuário por email e senha
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[2] === email && row[3] === senhaHash) {
        const userData = {
          id_usuario: row[0],
          nome: row[1],
          email: row[2],
          is_admin: row[4] || false,
          criado_em: row[5]
        };
        
        return createResponse(true, 'Login successful', userData);
      }
    }
    
    return createResponse(false, 'Invalid email or password');
  } catch (error) {
    Logger.log('Error in login: ' + error.toString());
    return createResponse(false, 'Error during login: ' + error.toString());
  }
}

/**
 * Busca usuário por email
 * Obrigatório: email
 */
function getUserByEmail(data) {
  try {
    const { email } = data;
    
    if (!email) {
      return createResponse(false, 'Missing required field: email');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USUARIOS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Busca usuário por email
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[2] === email) {
        const userData = {
          id_usuario: row[0],
          nome: row[1],
          email: row[2],
          is_admin: row[4] || false,
          criado_em: row[5]
        };
        
        return createResponse(true, 'User found', userData);
      }
    }
    
    return createResponse(false, 'User not found');
  } catch (error) {
    Logger.log('Error in getUserByEmail: ' + error.toString());
    return createResponse(false, 'Error fetching user: ' + error.toString());
  }
}

/**
 * Lista todos os usuários (somente admin)
 * Obrigatório: id_usuario (deve ser admin)
 */
function getAllUsers(data) {
  try {
    const { id_usuario } = data;
    
    if (!id_usuario) {
      return createResponse(false, 'Missing required field: id_usuario');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USUARIOS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Verifica se o usuário solicitante é admin
    let isAdmin = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === id_usuario && values[i][4] === true) {
        isAdmin = true;
        break;
      }
    }
    
    if (!isAdmin) {
      return createResponse(false, 'Unauthorized: Admin access required');
    }
    
    // Busca todos os usuários (excluindo hash de senha)
    const users = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      users.push({
        id_usuario: row[0],
        nome: row[1],
        email: row[2],
        is_admin: row[4] || false,
        criado_em: row[5]
      });
    }
    
    return createResponse(true, 'Users retrieved successfully', users);
  } catch (error) {
    Logger.log('Error in getAllUsers: ' + error.toString());
    return createResponse(false, 'Error fetching users: ' + error.toString());
  }
}
