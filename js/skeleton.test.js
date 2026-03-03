/**
 * Tests for SkeletonLoader Component
 */

// Import SkeletonLoader
const SkeletonLoader = require('./skeleton.js');

describe('SkeletonLoader', () => {
    describe('createFilmCardSkeleton', () => {
        it('should create a skeleton card element', () => {
            const skeleton = SkeletonLoader.createFilmCardSkeleton();
            
            expect(skeleton).toBeDefined();
            expect(skeleton.tagName).toBe('DIV');
            expect(skeleton.className).toBe('film-card skeleton');
        });

        it('should contain skeleton poster element', () => {
            const skeleton = SkeletonLoader.createFilmCardSkeleton();
            const poster = skeleton.querySelector('.skeleton-poster');
            
            expect(poster).toBeDefined();
            expect(poster).not.toBeNull();
        });

        it('should contain skeleton info section', () => {
            const skeleton = SkeletonLoader.createFilmCardSkeleton();
            const info = skeleton.querySelector('.skeleton-info');
            
            expect(info).toBeDefined();
            expect(info).not.toBeNull();
        });

        it('should contain all skeleton elements', () => {
            const skeleton = SkeletonLoader.createFilmCardSkeleton();
            
            expect(skeleton.querySelector('.skeleton-title')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-meta')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-genres')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-button')).not.toBeNull();
        });
    });

    describe('createListEntrySkeleton', () => {
        it('should create a skeleton list entry element', () => {
            const skeleton = SkeletonLoader.createListEntrySkeleton();
            
            expect(skeleton).toBeDefined();
            expect(skeleton.tagName).toBe('DIV');
            expect(skeleton.className).toBe('list-entry skeleton');
        });

        it('should contain skeleton poster element', () => {
            const skeleton = SkeletonLoader.createListEntrySkeleton();
            const poster = skeleton.querySelector('.skeleton-poster');
            
            expect(poster).toBeDefined();
            expect(poster).not.toBeNull();
        });

        it('should contain skeleton entry info section', () => {
            const skeleton = SkeletonLoader.createListEntrySkeleton();
            const info = skeleton.querySelector('.skeleton-entry-info');
            
            expect(info).toBeDefined();
            expect(info).not.toBeNull();
        });

        it('should contain all required skeleton elements', () => {
            const skeleton = SkeletonLoader.createListEntrySkeleton();
            
            expect(skeleton.querySelector('.skeleton-title')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-meta')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-genres')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-overview')).not.toBeNull();
            expect(skeleton.querySelector('.skeleton-metadata')).not.toBeNull();
        });
    });

    describe('showSkeletons', () => {
        let container;

        beforeEach(() => {
            container = document.createElement('div');
            container.id = 'test-container';
            document.body.appendChild(container);
        });

        afterEach(() => {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        it('should clear container before adding skeletons', () => {
            container.innerHTML = '<div>Existing content</div>';
            
            SkeletonLoader.showSkeletons(container, 3);
            
            // Check that the old content is gone and only skeleton cards remain
            const skeletons = container.querySelectorAll('.film-card.skeleton');
            expect(skeletons.length).toBe(3);
            expect(container.textContent).not.toContain('Existing content');
        });

        it('should add default number of skeletons (12) when count not specified', () => {
            SkeletonLoader.showSkeletons(container);
            
            const skeletons = container.querySelectorAll('.film-card.skeleton');
            expect(skeletons.length).toBe(12);
        });

        it('should add specified number of skeletons', () => {
            SkeletonLoader.showSkeletons(container, 5);
            
            const skeletons = container.querySelectorAll('.film-card.skeleton');
            expect(skeletons.length).toBe(5);
        });

        it('should handle zero count', () => {
            SkeletonLoader.showSkeletons(container, 0);
            
            const skeletons = container.querySelectorAll('.film-card.skeleton');
            expect(skeletons.length).toBe(0);
            expect(container.innerHTML).toBe('');
        });

        it('should handle null container gracefully', () => {
            // Should not throw error
            expect(() => {
                SkeletonLoader.showSkeletons(null, 5);
            }).not.toThrow();
        });

        it('should handle undefined container gracefully', () => {
            // Should not throw error
            expect(() => {
                SkeletonLoader.showSkeletons(undefined, 5);
            }).not.toThrow();
        });

        it('should create unique skeleton elements', () => {
            SkeletonLoader.showSkeletons(container, 3);
            
            const skeletons = container.querySelectorAll('.film-card.skeleton');
            expect(skeletons[0]).not.toBe(skeletons[1]);
            expect(skeletons[1]).not.toBe(skeletons[2]);
        });
    });

    describe('showListSkeletons', () => {
        let container;

        beforeEach(() => {
            container = document.createElement('div');
            container.id = 'test-list-container';
            document.body.appendChild(container);
        });

        afterEach(() => {
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        it('should clear container before adding skeletons', () => {
            container.innerHTML = '<div>Existing content</div>';
            
            SkeletonLoader.showListSkeletons(container, 3);
            
            // Check that the old content is gone and only skeleton entries remain
            const skeletons = container.querySelectorAll('.list-entry.skeleton');
            expect(skeletons.length).toBe(3);
            expect(container.textContent).not.toContain('Existing content');
        });

        it('should add default number of skeletons (6) when count not specified', () => {
            SkeletonLoader.showListSkeletons(container);
            
            const skeletons = container.querySelectorAll('.list-entry.skeleton');
            expect(skeletons.length).toBe(6);
        });

        it('should add specified number of skeletons', () => {
            SkeletonLoader.showListSkeletons(container, 4);
            
            const skeletons = container.querySelectorAll('.list-entry.skeleton');
            expect(skeletons.length).toBe(4);
        });

        it('should handle zero count', () => {
            SkeletonLoader.showListSkeletons(container, 0);
            
            const skeletons = container.querySelectorAll('.list-entry.skeleton');
            expect(skeletons.length).toBe(0);
            expect(container.innerHTML).toBe('');
        });

        it('should handle null container gracefully', () => {
            // Should not throw error
            expect(() => {
                SkeletonLoader.showListSkeletons(null, 5);
            }).not.toThrow();
        });

        it('should handle undefined container gracefully', () => {
            // Should not throw error
            expect(() => {
                SkeletonLoader.showListSkeletons(undefined, 5);
            }).not.toThrow();
        });

        it('should create unique skeleton elements', () => {
            SkeletonLoader.showListSkeletons(container, 3);
            
            const skeletons = container.querySelectorAll('.list-entry.skeleton');
            expect(skeletons[0]).not.toBe(skeletons[1]);
            expect(skeletons[1]).not.toBe(skeletons[2]);
        });

        it('should create list entry skeletons with correct structure', () => {
            SkeletonLoader.showListSkeletons(container, 2);
            
            const skeletons = container.querySelectorAll('.list-entry.skeleton');
            expect(skeletons.length).toBe(2);
            
            // Check first skeleton has correct structure
            const firstSkeleton = skeletons[0];
            expect(firstSkeleton.querySelector('.skeleton-poster')).not.toBeNull();
            expect(firstSkeleton.querySelector('.skeleton-entry-info')).not.toBeNull();
            expect(firstSkeleton.querySelector('.skeleton-title')).not.toBeNull();
            expect(firstSkeleton.querySelector('.skeleton-meta')).not.toBeNull();
            expect(firstSkeleton.querySelector('.skeleton-genres')).not.toBeNull();
            expect(firstSkeleton.querySelector('.skeleton-overview')).not.toBeNull();
            expect(firstSkeleton.querySelector('.skeleton-metadata')).not.toBeNull();
        });
    });
});
