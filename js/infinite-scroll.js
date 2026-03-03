/**
 * InfiniteScroll Component
 * Implements infinite scrolling using Intersection Observer API
 * Automatically loads more content when user scrolls near the bottom
 */
class InfiniteScroll {
    /**
     * Create an InfiniteScroll instance
     * @param {HTMLElement} container - Container element to observe
     * @param {Function} loadMoreCallback - Async callback to load more items, should return boolean indicating if more items exist
     */
    constructor(container, loadMoreCallback) {
        this.container = container;
        this.loadMoreCallback = loadMoreCallback;
        this.isLoading = false;
        this.hasMore = true;
        this.observer = null;
        this.sentinel = null;
        
        this.init();
    }
    
    /**
     * Initialize the infinite scroll observer
     * Creates sentinel element and sets up Intersection Observer
     */
    init() {
        // Create sentinel element at the bottom
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'infinite-scroll-sentinel';
        this.container.appendChild(this.sentinel);
        
        // Setup Intersection Observer
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                root: null,
                rootMargin: '200px',
                threshold: 0.1
            }
        );
        
        this.observer.observe(this.sentinel);
    }
    
    /**
     * Handle intersection events from the observer
     * Triggers loading more content when sentinel becomes visible
     * @param {IntersectionObserverEntry[]} entries - Array of intersection entries
     */
    async handleIntersection(entries) {
        const entry = entries[0];
        
        if (entry.isIntersecting && !this.isLoading && this.hasMore) {
            this.isLoading = true;
            
            try {
                const hasMore = await this.loadMoreCallback();
                this.hasMore = hasMore;
            } catch (error) {
                console.error('Error loading more items:', error);
            } finally {
                this.isLoading = false;
            }
        }
    }
    
    /**
     * Reset the infinite scroll state
     * Useful when starting a new list or applying filters
     */
    reset() {
        this.hasMore = true;
        this.isLoading = false;
    }
    
    /**
     * Destroy the infinite scroll instance
     * Disconnects observer and removes sentinel element
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        if (this.sentinel) {
            this.sentinel.remove();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfiniteScroll;
}
