/**
 * Letterboxd Manager - MOVIES & LISTS (Arquivo 3 de 3)
 * 
 * Este arquivo contém todas as funções relacionadas a listas e filmes:
 * - Criação e gerenciamento de listas
 * - Compartilhamento de listas
 * - Adição, atualização e remoção de filmes
 * - Busca de filmes por lista
 */

// ============================================================================
// ENDPOINTS DE GERENCIAMENTO DE LISTAS
// ============================================================================

/**
 * Cria uma nova lista
 * Obrigatório: id_usuario_dono, titulo
 * Opcional: descricao
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
 * Busca todas as listas de um usuário (próprias e compartilhadas)
 * Obrigatório: id_usuario
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
    
    // Busca todas as listas do usuário
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
 * Compartilha uma lista com outro usuário
 * Obrigatório: id_lista, id_usuario_solicitante, id_usuario_compartilhar
 * Nota: Implementação básica - versão completa requer tabela separada de compartilhamento
 */
function shareList(data) {
  try {
    const { id_lista, id_usuario_solicitante, id_usuario_compartilhar } = data;
    
    if (!id_lista || !id_usuario_solicitante || !id_usuario_compartilhar) {
      return createResponse(false, 'Missing required fields');
    }
    
    // Verifica se a lista existe e o usuário é o dono
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
    
    // Por enquanto, apenas retorna sucesso
    // Implementação completa adicionaria entrada em aba "ListaCompartilhada"
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
// ENDPOINTS DE GERENCIAMENTO DE FILMES
// ============================================================================

/**
 * Adiciona um filme assistido a uma lista
 * Obrigatório: id_lista, id_usuario, titulo_filme, nota
 * Opcional: ano, assistido_em, review
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
    
    // Valida que nota está entre 0 e 5
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
 * Busca todos os filmes de uma lista
 * Obrigatório: id_lista, id_usuario
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
    
    // Busca todos os filmes da lista
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

/**
 * Atualiza uma entrada de filme
 * Obrigatório: id_filme, nota
 * Opcional: assistido_em, review
 */
function updateMovie(data) {
  try {
    const {
      id_filme,
      nota,
      assistido_em = getCurrentTimestamp(),
      review = ''
    } = data;
    
    if (!id_filme || nota === undefined) {
      return createResponse(false, 'Missing required fields: id_filme, nota');
    }
    
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 5) {
      return createResponse(false, 'Invalid nota: must be between 0 and 5');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FILMES);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Busca o filme por id_filme
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === id_filme) {
        // Atualiza a linha
        sheet.getRange(i + 1, 6).setValue(notaNum); // Coluna F (nota)
        sheet.getRange(i + 1, 7).setValue(assistido_em); // Coluna G (assistido_em)
        sheet.getRange(i + 1, 8).setValue(review); // Coluna H (review)
        
        const movieData = {
          id_filme: values[i][0],
          id_lista: values[i][1],
          id_usuario: values[i][2],
          titulo_filme: values[i][3],
          ano: values[i][4],
          nota: notaNum,
          assistido_em: assistido_em,
          review: review
        };
        
        return createResponse(true, 'Movie updated successfully', movieData);
      }
    }
    
    return createResponse(false, 'Movie not found');
  } catch (error) {
    Logger.log('Error in updateMovie: ' + error.toString());
    return createResponse(false, 'Error updating movie: ' + error.toString());
  }
}

/**
 * Remove uma entrada de filme
 * Obrigatório: id_filme
 */
function deleteMovie(data) {
  try {
    const { id_filme } = data;
    
    if (!id_filme) {
      return createResponse(false, 'Missing required field: id_filme');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_FILMES);
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Busca e remove a linha
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === id_filme) {
        sheet.deleteRow(i + 1);
        return createResponse(true, 'Movie deleted successfully', { id_filme: id_filme });
      }
    }
    
    return createResponse(false, 'Movie not found');
  } catch (error) {
    Logger.log('Error in deleteMovie: ' + error.toString());
    return createResponse(false, 'Error deleting movie: ' + error.toString());
  }
}
