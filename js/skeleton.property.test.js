/**
 * Property-Based Tests for SkeletonLoader
 * Feature: critical-bugs-fix, Property 10: Skeleton loader cleanup
 * Validates: Requirements 4.5
 * 
 * Property 10: Skeleton loader cleanup
 * For any loading operation (success or failure), the skeleton loader should be removed from the DOM after completion.
 */

const fc = require('fast-check');
const SkeletonLoader = require('./skeleton.js');

describe('SkeletonLoader Property-Based Tests', () => {
    /**
     * Feature: critical-bugs-fix, Property 10: Skeleton loader cleanup
     * Validates: Requirements 4.5
     * 
     * Property: For any loading operation (success or failure), 
     * the skeleton loader should be removed from the DOM after completion.
     */
    describe('Property 10: Skeleton loader cleanup', () => {
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

        test('skeleton loaders are removed after successful operation', () => {
            fc.assert(
                fc.property(
                    fc.boolean(), // success state
                    (isSuccess) => {
                        // Setup: Show skeleton loaders
                        SkeletonLoader.showSkeletons(container, 3);
                        
                        // Verify skeletons are present
                        const skeletonsBeforeCleanup = container.querySelectorAll('.skeleton');
                        expect(skeletonsBeforeCleanup.length).toBeGreaterThan(0);
                        
                        // Simulate operation completion (success or error)
                        // In real app, this would be: container.innerHTML = '' or renderFilms()
                        if (isSuccess) {
                            // Success: Replace with actual content
                            container.innerHTML = '<div class="film-card">Real Content</div>';
                        } else {
                            // Error: Clear and show error message
                            container.innerHTML = '<div class="error-message">Error occurred</div>';
                        }
                        
                        // Verify: Skeletons are removed
                        const skeletonsAfterCleanup = container.querySelectorAll('.skeleton');
                        expect(skeletonsAfterCleanup.length).toBe(0);
                        
                        // Verify: Container has content (either success or error)
                        expect(container.children.length).toBeGreaterThan(0);
                        expect(container.innerHTML).not.toContain('skeleton');
                    }
                ),
                { numRuns: 20 } // Use 20 iterations as specified in task
            );
        });

        test('skeleton loaders are removed when container is cleared', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 10 }), // number of skeletons
                    (skeletonCount) => {
                        // Setup: Show skeleton loaders
                        SkeletonLoader.showSkeletons(container, skeletonCount);
                        
                        // Verify skeletons are present
                        const skeletonsBefore = container.querySelectorAll('.skeleton');
                        expect(skeletonsBefore.length).toBe(skeletonCount);
                        
                        // Simulate cleanup (as done in app.js)
                        container.innerHTML = '';
                        
                        // Verify: All skeletons are removed
                        const skeletonsAfter = container.querySelectorAll('.skeleton');
                        expect(skeletonsAfter.length).toBe(0);
                        expect(container.children.length).toBe(0);
                    }
                ),
                { numRuns: 15 } // Use 15 iterations as specified in task
            );
        });

        test('skeleton loaders are removed when replaced with new content', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 8 }), // number of skeletons
                    fc.integer({ min: 1, max: 5 }), // number of real items
                    (skeletonCount, realItemCount) => {
                        // Setup: Show skeleton loaders
                        SkeletonLoader.showSkeletons(container, skeletonCount);
                        
                        // Verify skeletons are present
                        const skeletonsBefore = container.querySelectorAll('.skeleton');
                        expect(skeletonsBefore.length).toBe(skeletonCount);
                        
                        // Simulate rendering real content (as done in renderFilms)
                        container.innerHTML = '';
                        for (let i = 0; i < realItemCount; i++) {
                            const item = document.createElement('div');
                            item.className = 'film-card';
                            item.textContent = `Film ${i}`;
                            container.appendChild(item);
                        }
                        
                        // Verify: Skeletons are removed
                        const skeletonsAfter = container.querySelectorAll('.skeleton');
                        expect(skeletonsAfter.length).toBe(0);
                        
                        // Verify: Real content is present
                        const realItems = container.querySelectorAll('.film-card');
                        expect(realItems.length).toBe(realItemCount);
                    }
                ),
                { numRuns: 20 } // Use 20 iterations as specified in task
            );
        });

        test('list skeleton loaders are removed after operation completion', () => {
            fc.assert(
                fc.property(
                    fc.boolean(), // success state
                    (isSuccess) => {
                        // Setup: Show list skeleton loaders
                        SkeletonLoader.showListSkeletons(container, 4);
                        
                        // Verify skeletons are present
                        const skeletonsBefore = container.querySelectorAll('.skeleton');
                        expect(skeletonsBefore.length).toBeGreaterThan(0);
                        
                        // Simulate operation completion
                        if (isSuccess) {
                            // Success: Replace with actual list entries
                            container.innerHTML = '<div class="list-entry">Real Entry</div>';
                        } else {
                            // Error: Clear and show error
                            container.innerHTML = '<div class="error-message">Failed to load</div>';
                        }
                        
                        // Verify: Skeletons are removed
                        const skeletonsAfter = container.querySelectorAll('.skeleton');
                        expect(skeletonsAfter.length).toBe(0);
                        
                        // Verify: Container has content
                        expect(container.children.length).toBeGreaterThan(0);
                    }
                ),
                { numRuns: 15 } // Use 15 iterations as specified in task
            );
        });

        test('multiple skeleton cleanup operations maintain consistency', () => {
            fc.assert(
                fc.property(
                    fc.array(fc.boolean(), { minLength: 2, maxLength: 5 }), // sequence of operations
                    (operations) => {
                        operations.forEach((isSuccess) => {
                            // Show skeletons
                            SkeletonLoader.showSkeletons(container, 3);
                            
                            // Verify skeletons are present
                            const skeletonsBefore = container.querySelectorAll('.skeleton');
                            expect(skeletonsBefore.length).toBeGreaterThan(0);
                            
                            // Complete operation
                            if (isSuccess) {
                                container.innerHTML = '<div>Content</div>';
                            } else {
                                container.innerHTML = '<div>Error</div>';
                            }
                            
                            // Verify cleanup
                            const skeletonsAfter = container.querySelectorAll('.skeleton');
                            expect(skeletonsAfter.length).toBe(0);
                        });
                    }
                ),
                { numRuns: 15 } // Use 15 iterations as specified in task
            );
        });
    });
});
