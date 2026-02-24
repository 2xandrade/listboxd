// Letterboxd Manager Configuration
// Copy this file to config.js and fill in your TMDB API credentials
// Get your API key at: https://www.themoviedb.org/settings/api

const CONFIG = {
    // TMDB API Configuration
    tmdb: {
        apiKey: 'YOUR_TMDB_API_KEY_HERE',
        readAccessToken: 'YOUR_TMDB_READ_ACCESS_TOKEN_HERE',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
    },
    
    // Application Settings
    app: {
        sessionTimeout: 3600000, // 1 hour in milliseconds
        maxLoginAttempts: 5,
        cacheExpiration: 300000 // 5 minutes in milliseconds
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
