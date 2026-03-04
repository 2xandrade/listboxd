/**
 * Integration tests for complete list management flow
 * Tests the full user journey for managing lists and films
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * Task 29: Testar fluxo completo de gerenciamento de listas
 * - Testar criação de lista ✓
 * - Testar busca de filmes ✓
 * - Testar adição de filme à lista ✓
 * - Testar remoção de filme da lista (N/A - not in current Google Sheets API)
 * - Testar filtros e ordenação ✓
 * - Testar marcação de filme como assistido ✓
 */

const ListService = require('./list.js');
const FilmService = require('./films.js');
const StorageManager = require('./storage.js');
const AuthService = require('./auth.js');

// Mock GoogleSheetsApi for testing
class MockGoogleSheetsApi {
  constructor() {
    this.users = new Map();
    this.lists = new Map();
    this.films = new Map();
    this.listCounter = 1;
    this.filmCounter = 1;
  }

  async registerUser(payload) {
    const { nome, email, senha } = payload;
    if (this.users.has(email)) {
      throw new Error('Email já existe');
    }
    const user = {
      id_usuario: `user_${Date.now()}_${Math.random()}`,
      nome, email, senha, is_admin: false
    };
    this.users.set(email, user);
    return { ok: true, data: user };
  }

  async login(payload) {
    const { email, senha } = payload;
    const user = this.users.get(email);
    if (!user || user.senha !== senha) {
      throw new Error('Invalid credentials');
    }
    return { ok: true, data: user };
  }

  async createList(payload) {
    const { id_usuario_dono, titulo, descricao } = payload;
    const list = {
      id_lista: `list_${this.listCounter++}`,
      id_usuario_dono, titulo, descricao: descricao || '',
      criada_em: new Date().toISOString()
    };
    this.lists.set(list.id_lista, list);
    return { ok: true, data: list };
  }

  async getListsByUser(idUsuario) {
    const userLists = Array.from(this.lists.values())
      .filter(list => list.id_usuario_dono === idUsuario);
    return { ok: true, data: userLists };
  }

  async addWatchedMovie(payload) {
    const { id_lista, id_usuario, titulo_filme, ano, nota, assistido_em, review } = payload;
    const film = {
      id_filme: `film_${this.filmCounter++}`,
      id_lista, id_usuario, titulo_filme, ano: ano || '', nota, assistido_em, review: review || ''
    };
    this.films.set(film.id_filme, film);
    return { ok: true, data: film };
  }

  async getMoviesByList(params) {
    const { id_lista } = params;
    const listFilms = Array.from(this.films.values())
      .filter(film => film.id_lista === id_lista);
    return { ok: true, data: listFilms };
  }

  clear() {
    this.users.clear();
    this.lists.clear();
    this.films.clear();
    this.listCounter = 1;
    this.filmCounter = 1;
  }
}

global.CONFIG = {
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p/w500',
    readAccessToken: 'test_token'
  },
  app: { cacheExpiration: 300000 }
};

describe('Complete List Management Flow - Task 29', () => {
  let listService, filmService, storageManager, authService, mockApi, testUser, testListId;

  beforeEach(async () => {
    storageManager = new StorageManager();
    mockApi = new MockGoogleSheetsApi();
    authService = new AuthService(storageManager, mockApi);
    listService = new ListService(mockApi, authService);
    filmService = new FilmService();
    localStorage.clear();
    
    await authService.register('Test User', 'test@example.com', 'password123');
    await authService.login('test@example.com', 'password123');
    testUser = authService.getCurrentUser();
    
    const list = await listService.createList('Test List', 'A test list');
    testListId = list.id_lista;
  });

  afterEach(() => {
    localStorage.clear();
    mockApi.clear();
    if (filmService.cache) filmService.cache.clear();
  });

  describe('1. Testar criação de lista', () => {
    it('should create a new list', async () => {
      const list = await listService.createList('My List', 'Description');
      expect(list).toBeDefined();
      expect(list.id_lista).toBeDefined();
      expect(list.titulo).toBe('My List');
      expect(list.id_usuario_dono).toBe(testUser.id);
    });

    it('should retrieve created lists', async () => {
      await listService.createList('List 1', 'First');
      await listService.createList('List 2', 'Second');
      const lists = await listService.getListsByUser();
      expect(lists.length).toBeGreaterThanOrEqual(3);
    });

    it('should require authentication', async () => {
      authService.logout();
      await expect(listService.createList('Test', 'Test')).rejects.toThrow('User not authenticated');
    });
  });

  describe('2. Testar busca de filmes', () => {
    it('should parse TMDB film data', () => {
      const tmdbFilm = {
        id: 550, title: 'Fight Club', poster_path: '/poster.jpg',
        vote_average: 8.4, genres: [{ id: 18, name: 'Drama' }],
        release_date: '1999-10-15', overview: 'Great film'
      };
      const parsed = filmService.parseFilm(tmdbFilm);
      expect(parsed.id).toBe(550);
      expect(parsed.title).toBe('Fight Club');
      expect(parsed.rating).toBe(8.4);
      expect(parsed.genres).toEqual(['Drama']);
      expect(parsed.year).toBe(1999);
    });

    it('should handle missing data', () => {
      const parsed = filmService.parseFilm({ id: 123, title: 'Test' });
      expect(parsed.poster).toBeNull();
      expect(parsed.rating).toBe(0);
      expect(parsed.genres).toEqual([]);
    });
  });

  describe('3. Testar adição de filme à lista', () => {
    it('should add watched movie', async () => {
      const film = { id: 155, title: 'The Dark Knight', year: 2008 };
      const watched = await listService.addWatchedMovie(testListId, film, 4.5, 'Great!');
      expect(watched.titulo_filme).toBe('The Dark Knight');
      expect(watched.nota).toBe(4.5);
      expect(watched.review).toBe('Great!');
    });

    it('should retrieve movies from list', async () => {
      await listService.addWatchedMovie(testListId, { id: 1, title: 'Film 1', year: 2020 }, 4.0);
      await listService.addWatchedMovie(testListId, { id: 2, title: 'Film 2', year: 2021 }, 3.5);
      const movies = await listService.getMoviesByList(testListId);
      expect(movies.length).toBe(2);
    });

    it('should validate rating', async () => {
      const film = { id: 13, title: 'Test', year: 1994 };
      await expect(listService.addWatchedMovie(testListId, film, 6.0)).rejects.toThrow();
      await expect(listService.addWatchedMovie(testListId, film, 0.0)).rejects.toThrow();
    });
  });

  describe('4. Testar filtros e ordenação', () => {
    it('should sort movies by rating', async () => {
      await listService.addWatchedMovie(testListId, { id: 1, title: 'Low', year: 2020 }, 2.5);
      await listService.addWatchedMovie(testListId, { id: 2, title: 'High', year: 2021 }, 5.0);
      await listService.addWatchedMovie(testListId, { id: 3, title: 'Med', year: 2019 }, 3.5);
      
      const movies = await listService.getMoviesByList(testListId);
      const sorted = movies.sort((a, b) => b.nota - a.nota);
      expect(sorted[0].nota).toBe(5.0);
      expect(sorted[2].nota).toBe(2.5);
    });

    it('should filter by title', async () => {
      await listService.addWatchedMovie(testListId, { id: 1, title: 'The Matrix', year: 1999 }, 4.0);
      await listService.addWatchedMovie(testListId, { id: 2, title: 'Inception', year: 2010 }, 4.0);
      
      const movies = await listService.getMoviesByList(testListId);
      const filtered = movies.filter(m => m.titulo_filme.includes('Matrix'));
      expect(filtered.length).toBe(1);
    });
  });

  describe('5. Testar marcação de filme como assistido', () => {
    it('should mark with rating and review', async () => {
      const film = { id: 550, title: 'Fight Club', year: 1999 };
      const watched = await listService.addWatchedMovie(testListId, film, 4.5, 'Amazing!');
      expect(watched.nota).toBe(4.5);
      expect(watched.review).toBe('Amazing!');
      expect(watched.assistido_em).toBeDefined();
    });

    it('should accept valid half-star ratings', async () => {
      const ratings = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0];
      for (let i = 0; i < ratings.length; i++) {
        const film = { id: 1000 + i, title: `Film ${i}`, year: 2020 };
        const watched = await listService.addWatchedMovie(testListId, film, ratings[i]);
        expect(watched.nota).toBe(ratings[i]);
      }
    });
  });

  describe('Complete Flow Integration', () => {
    it('should handle complete journey', async () => {
      const list = await listService.createList('Watchlist', 'My films');
      await listService.addWatchedMovie(list.id_lista, { id: 1, title: 'Film 1', year: 1999 }, 4.5);
      await listService.addWatchedMovie(list.id_lista, { id: 2, title: 'Film 2', year: 2010 }, 4.0);
      
      const movies = await listService.getMoviesByList(list.id_lista);
      expect(movies.length).toBe(2);
      
      const lists = await listService.getListsByUser();
      expect(lists.length).toBeGreaterThanOrEqual(2);
    });

    it('should maintain data integrity', async () => {
      const films = [
        { id: 2001, title: 'Film A', year: 2020 },
        { id: 2002, title: 'Film B', year: 2021 },
        { id: 2003, title: 'Film C', year: 2019 }
      ];
      
      for (let i = 0; i < films.length; i++) {
        await listService.addWatchedMovie(testListId, films[i], 3.0 + i * 0.5);
      }

      const movies = await listService.getMoviesByList(testListId);
      expect(movies.length).toBe(3);
      expect(movies[0].nota).toBe(3.0);
      expect(movies[1].nota).toBe(3.5);
      expect(movies[2].nota).toBe(4.0);
    });
  });
});
