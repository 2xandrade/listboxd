/**
 * Tests for UserService (Google Sheets API integration)
 * 
 * NOTE: The original property-based tests tested the localStorage-based implementation
 * which has been replaced with Google Sheets API integration. These tests are now
 * obsolete as the UserService no longer manages local CRUD operations.
 * 
 * New tests for the Google Sheets API integration will be written in Phase 10 (Fase 10)
 * as part of the comprehensive testing phase.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

const UserService = require('./users.js');

describe('UserService - Google Sheets API Integration', () => {
  let userService;
  let mockGoogleSheetsApi;

  beforeEach(() => {
    // Create mock Google Sheets API
    mockGoogleSheetsApi = {
      getUserByEmail: jest.fn()
    };
    
    // Create UserService with mock API
    userService = new UserService(mockGoogleSheetsApi);
  });

  beforeEach(() => {
    // Create mock Google Sheets API
    mockGoogleSheetsApi = {
      getUserByEmail: jest.fn()
    };
    
    // Create UserService with mock API
    userService = new UserService(mockGoogleSheetsApi);
  });

  /**
   * Test: getUserByEmail should call API and return user data
   * Requirements: 4.3
   */
  describe('getUserByEmail', () => {
    it('should return user data when API call succeeds', async () => {
      const mockUser = {
        id_usuario: 'user123',
        nome: 'Test User',
        email: 'test@example.com',
        is_admin: false
      };
      
      mockGoogleSheetsApi.getUserByEmail.mockResolvedValue({
        ok: true,
        data: mockUser
      });
      
      const result = await userService.getUserByEmail('test@example.com');
      
      expect(mockGoogleSheetsApi.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when API returns no data', async () => {
      mockGoogleSheetsApi.getUserByEmail.mockResolvedValue({
        ok: true,
        data: null
      });
      
      const result = await userService.getUserByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });

    it('should return null and log error when API call fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockGoogleSheetsApi.getUserByEmail.mockRejectedValue(
        new Error('Network error')
      );
      
      const result = await userService.getUserByEmail('test@example.com');
      
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user:',
        'Network error'
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});

/*
 * ARCHIVED TESTS - localStorage-based implementation
 * 
 * The following tests were for the original localStorage-based UserService
 * implementation. They are kept here for reference but are no longer applicable
 * as the service now uses Google Sheets API for all user operations.
 * 
 * Original tests covered:
 * - Property 1: User creation persistence
 * - Property 2: User deletion completeness  
 * - Property 3: User update correctness
 * 
 * These operations are now handled by the Google Sheets backend and will be
 * tested as part of the integration testing phase (Fase 10).
 */
