/**
 * SkeletonLoader Component
 * Provides skeleton screen loading states for better UX
 */
class SkeletonLoader {
    /**
     * Create skeleton card for film loading
     * @returns {HTMLElement} Skeleton card element
     */
    static createFilmCardSkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'film-card skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
                <div class="skeleton-genres"></div>
                <div class="skeleton-button"></div>
            </div>
        `;
        return skeleton;
    }
    
    /**
     * Create skeleton entry for list loading
     * @returns {HTMLElement} Skeleton list entry element
     */
    static createListEntrySkeleton() {
        const skeleton = document.createElement('div');
        skeleton.className = 'list-entry skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-poster"></div>
            <div class="skeleton-entry-info">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta"></div>
                <div class="skeleton-genres"></div>
                <div class="skeleton-overview"></div>
                <div class="skeleton-metadata"></div>
            </div>
        `;
        return skeleton;
    }
    
    /**
     * Show skeleton loading state
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of skeletons to show (default: 12)
     */
    static showSkeletons(container, count = 12) {
        if (!container) {
            console.error('SkeletonLoader: Container element is required');
            return;
        }
        
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createFilmCardSkeleton());
        }
    }
    
    /**
     * Show skeleton list entries
     * @param {HTMLElement} container - Container element
     * @param {number} count - Number of skeleton entries to show (default: 6)
     */
    static showListSkeletons(container, count = 6) {
        if (!container) {
            console.error('SkeletonLoader: Container element is required');
            return;
        }
        
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            container.appendChild(this.createListEntrySkeleton());
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkeletonLoader;
}
