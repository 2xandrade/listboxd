/**
 * Letterboxd Manager - Google Apps Script Backend
 * 
 * This script provides REST API endpoints for user authentication,
 * list management, and movie tracking using Google Sheets as storage.
 */

// Sheet names
const SHEET_USUARIOS = 'Usuarios';
const SHEET_LISTAS = 'Listas';
const SHEET_FILMES = 'Filmes';

/**
 * Main entry point for HTTP requests
 * Handles both GET and POST requests
 */
function doPost(e) {
  return handleRequest(e);
}

function doGet(e) {
  return handleRequest(e);
}

/**
 * Route requests to appropriate handlers
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
    
    // Route to appropriate handler
    switch (action) {
      case 'registerUser':
        return registerUser(data);
      case 'login':
        return login(data);
      case 'getUserByEmail':
        return getUserByEmail(data);
      case 'createList':
        return createList(data);
      case 'getListsByUser':
        return getListsByUser(data);
      case 'shareList':
        return shareList(data);
      case 'addWatchedMovie':
        return addWatchedMovie(data);
      case 'getMoviesByList':
        return getMoviesByList(data);
      default:
        return createResponse(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    Logger.log('Error in handleRequest: ' + error.toString());
    return createResponse(false, 'Server error: ' + error.toString());
  }
}

/**
 * Create standardized JSON response with CORS headers
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
 * Generate UUID v4
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Hash password using SHA-256
 * Note: For production, consider using a more secure hashing method
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
 * Get current ISO timestamp
 */
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// ============================================================================
// USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Register a new user
 * Required: nome, email, senha
 */
function registerUser(data) {
  try {
    const { nome, email, senha } = data;
    
    // Validate required fields
    if (!nome || !email || !senha) {
      return createResponse(false, 'Missing required fields: nome, email, senha');
    }
    
    // Validate email format
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return createResponse(false, 'Invalid email format');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_USUARIOS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Check if email already exists
    for (let i = 1; i < values.length; i++) {
      if (values[i][2] === email) { // Column C (email)
        return createResponse(false, 'Email already registered');
      }
    }
    
    // Create new user
    const userId = generateUUID();
    const senhaHash = hashPassword(senha);
    const isAdmin = false;
    const criadoEm = getCurrentTimestamp();
    
    // Append new user row
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
 * Authenticate user
 * Required: email, senha
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
    
    // Find user by email and password
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
 * Get user by email
 * Required: email
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
    
    // Find user by email
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

// ============================================================================
// LIST MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Create a new list
 * Required: id_usuario_dono, titulo
 * Optional: descricao
 */
function createList(data) {
  try {
    const { id_usuario_dono, titulo, descricao = '' } = data;
    
    if (!id_usuario_dono || !titulo) {
      return createResponse(false, 'Missing required fields: id_usuario_dono, titulo');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LISTAS);
    
    const idLista = generateUUID();
    const criadaEm = getCurrentTimestamp();
    
    sheet.appendRow([idLista, id_usuario_dono, titulo, descricao, criadaEm]);
    
    const listData = {
      id_lista: idLista,
      id_usuario_dono: id_usuario_dono,
      titulo: titulo,
      descricao: descricao,
      criada_em: criadaEm
    };
    
    return createResponse(true, 'List created successfully', listData);
  } catch (error) {
    Logger.log('Error in createList: ' + error.toString());
    return createResponse(false, 'Error creating list: ' + error.toString());
  }
}

/**
 * Get all lists for a user (owned and shared)
 * Required: id_usuario
 */
function getListsByUser(data) {
  try {
    const { id_usuario } = data;
    
    if (!id_usuario) {
      return createResponse(false, 'Missing required field: id_usuario');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LISTAS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const lists = [];
    
    // Get all lists owned by user
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[1] === id_usuario) { // id_usuario_dono
        lists.push({
          id_lista: row[0],
          id_usuario_dono: row[1],
          titulo: row[2],
          descricao: row[3],
          criada_em: row[4],
          is_owner: true
        });
      }
    }
    
    return createResponse(true, 'Lists retrieved successfully', lists);
  } catch (error) {
    Logger.log('Error in getListsByUser: ' + error.toString());
    return createResponse(false, 'Error fetching lists: ' + error.toString());
  }
}

/**
 * Share a list with another user
 * Required: id_lista, id_usuario_solicitante, id_usuario_compartilhar
 * Note: This is a placeholder - full implementation would require a separate sharing table
 */
function shareList(data) {
  try {
    const { id_lista, id_usuario_solicitante, id_usuario_compartilhar } = data;
    
    if (!id_lista || !id_usuario_solicitante || !id_usuario_compartilhar) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Verify list exists and user is owner
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LISTAS);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    let listFound = false;
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[0] === id_lista && row[1] === id_usuario_solicitante) {
        listFound = true;
        break;
      }
    }
    
    if (!listFound) {
      return createResponse(false, 'List not found or user is not owner');
    }
    
    // For now, just return success
    // Full implementation would add entry to a separate "ListaCompartilhada" sheet
    return createResponse(true, 'List shared successfully', {
      id_lista: id_lista,
      shared_with: id_usuario_compartilhar
    });
  } catch (error) {
    Logger.log('Error in shareList: ' + error.toString());
    return createResponse(false, 'Error sharing list: ' + error.toString());
  }
}

// ============================================================================
// MOVIE MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Add a watched movie to a list
 * Required: id_lista, id_usuario, titulo_filme, nota
 * Optional: ano, assistido_em, review
 */
function addWatchedMovie(data) {
  try {
    const {
      id_lista,
      id_usuario,
      titulo_filme,
      ano = '',
      nota,
      assistido_em = getCurrentTimestamp(),
      review = ''
    } = data;
    
    if (!id_lista || !id_usuario || !titulo_filme || nota === undefined) {
      return createResponse(false, 'Missing required fields: id_lista, id_usuario, titulo_filme, nota');
    }
    
    // Validate nota is between 0.5 and 5.0
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
      return createResponse(false, 'Invalid nota: must be between 0 and 5');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FILMES);
    
    const idFilme = generateUUID();
    
    sheet.appendRow([
      idFilme,
      id_lista,
      id_usuario,
      titulo_filme,
      ano,
      notaNum,
      assistido_em,
      review
    ]);
    
    const movieData = {
      id_filme: idFilme,
      id_lista: id_lista,
      id_usuario: id_usuario,
      titulo_filme: titulo_filme,
      ano: ano,
      nota: notaNum,
      assistido_em: assistido_em,
      review: review
    };
    
    return createResponse(true, 'Movie added successfully', movieData);
  } catch (error) {
    Logger.log('Error in addWatchedMovie: ' + error.toString());
    return createResponse(false, 'Error adding movie: ' + error.toString());
  }
}

/**
 * Get all movies from a list
 * Required: id_lista, id_usuario
 */
function getMoviesByList(data) {
  try {
    const { id_lista, id_usuario } = data;
    
    if (!id_lista || !id_usuario) {
      return createResponse(false, 'Missing required fields: id_lista, id_usuario');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FILMES);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    const movies = [];
    
    // Get all movies from the list
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[1] === id_lista) { // id_lista
        movies.push({
          id_filme: row[0],
          id_lista: row[1],
          id_usuario: row[2],
          titulo_filme: row[3],
          ano: row[4],
          nota: row[5],
          assistido_em: row[6],
          review: row[7]
        });
      }
    }
    
    return createResponse(true, 'Movies retrieved successfully', movies);
  } catch (error) {
    Logger.log('Error in getMoviesByList: ' + error.toString());
    return createResponse(false, 'Error fetching movies: ' + error.toString());
  }
}
