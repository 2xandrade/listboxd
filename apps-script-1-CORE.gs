/**
 * Letterboxd Manager - CORE (Arquivo 1 de 3)
 * 
 * Este arquivo contém as funções principais de roteamento e utilitários.
 * 
 * INSTRUÇÕES DE INSTALAÇÃO:
 * 1. No Google Apps Script, crie um novo projeto
 * 2. Adicione este arquivo (apps-script-1-CORE.gs)
 * 3. Adicione apps-script-2-USERS.gs
 * 4. Adicione apps-script-3-MOVIES-LISTS.gs
 * 5. Faça o deploy como Web App com acesso "Qualquer pessoa"
 */

// ============================================================================
// CONFIGURAÇÕES GLOBAIS
// ============================================================================

// Nomes das abas da planilha
const SHEET_USUARIOS = 'Usuarios';
const SHEET_LISTAS = 'Listas';
const SHEET_FILMES = 'Filmes';

// ============================================================================
// FUNÇÕES DE ENTRADA (ROUTING)
// ============================================================================

/**
 * Ponto de entrada para requisições POST
 */
function doPost(e) {
  return handleRequest(e);
}

/**
 * Ponto de entrada para requisições GET
 */
function doGet(e) {
  return handleRequest(e);
}

/**
 * Roteia requisições para os handlers apropriados
 */
function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents) : {};
    const data = { ...params, ...postData };
    
    const action = data.action;
    
    if (!action) {
      return createResponse(false, 'Missing action parameter');
    }
    
    // Roteamento para handlers específicos
    switch (action) {
      // Endpoints de usuários (definidos em apps-script-2-USERS.gs)
      case 'registerUser':
        return registerUser(data);
      case 'login':
        return login(data);
      case 'getUserByEmail':
        return getUserByEmail(data);
      case 'getAllUsers':
        return getAllUsers(data);
      
      // Endpoints de listas (definidos em apps-script-3-MOVIES-LISTS.gs)
      case 'createList':
        return createList(data);
      case 'getListsByUser':
        return getListsByUser(data);
      case 'shareList':
        return shareList(data);
      
      // Endpoints de filmes (definidos em apps-script-3-MOVIES-LISTS.gs)
      case 'addWatchedMovie':
        return addWatchedMovie(data);
      case 'getMoviesByList':
        return getMoviesByList(data);
      case 'updateMovie':
        return updateMovie(data);
      case 'deleteMovie':
        return deleteMovie(data);
      
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

// ============================================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================================

/**
 * Cria resposta JSON padronizada com headers CORS
 */
function createResponse(success, message, data = null) {
  const response = {
    ok: success,
    message: message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  const output = ContentService.createTextOutput(JSON.stringify(response));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Gera UUID v4
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Hash de senha usando SHA-256
 * Nota: Para produção, considere usar um método mais seguro
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  
  return rawHash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

/**
 * Retorna timestamp ISO atual
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}
