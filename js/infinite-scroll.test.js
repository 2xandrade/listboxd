/**
 * Tests for InfiniteScroll Component
 */

// Import InfiniteScroll
const InfiniteScroll = require('./infinite-scroll.js');

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor(callback, options) {
        this.callback = callback;
        this.options = options;
        this.observedElements = [];
    }

    observe(element) {
        this.observedElements.push(element);
    }

    unobserve(element) {
        this.observedElements = this.observedElements.filter(el => el !== element);
    }

    disconnect() {
        this.observedElements = [];
    }

    // Helper method to trigger intersection
    triggerIntersection(isIntersecting) {
        if (this.observedElements.length > 0) {
            const entries = this.observedElements.map(element => ({
                target: element,
                isIntersecting: isIntersecting,
                intersectionRatio: isIntersecting ? 1 : 0
            }));
            this.callback(entries);
        }
    }
}

global.IntersectionObserver = MockIntersectionObserver;

describe('InfiniteScroll', () => {
    let container;
    let mockCallback;
    let infiniteScroll;

    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);

        // Create mock callback
        mockCallback = jest.fn().mockResolvedValue(true);
    });

    afterEach(() => {
        // Clean up
        if (infiniteScroll) {
            infiniteScroll.destroy();
            infiniteScroll = null;
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('constructor and init', () => {
        it('should create an InfiniteScroll instance', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            expect(infiniteScroll).toBeDefined();
            expect(infiniteScroll.container).toBe(container);
            expect(infiniteScroll.loadMoreCallback).toBe(mockCallback);
        });

        it('should initialize with correct default state', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            expect(infiniteScroll.isLoading).toBe(false);
            expect(infiniteScroll.hasMore).toBe(true);
        });

        it('should create sentinel element', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            expect(infiniteScroll.sentinel).toBeDefined();
            expect(infiniteScroll.sentinel).not.toBeNull();
            expect(infiniteScroll.sentinel.className).toBe('infinite-scroll-sentinel');
        });

        it('should append sentinel to container', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            const sentinel = container.querySelector('.infinite-scroll-sentinel');
            expect(sentinel).not.toBeNull();
            expect(sentinel).toBe(infiniteScroll.sentinel);
        });

        it('should create IntersectionObserver', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            expect(infiniteScroll.observer).toBeDefined();
            expect(infiniteScroll.observer).not.toBeNull();
            expect(infiniteScroll.observer).toBeInstanceOf(IntersectionObserver);
        });
    });

    describe('handleIntersection', () => {
        it('should call loadMoreCallback when sentinel is intersecting', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            // Simulate intersection
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });

        it('should not call loadMoreCallback when sentinel is not intersecting', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            // Simulate no intersection
            const entries = [{
                isIntersecting: false,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should not call loadMoreCallback when already loading', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.isLoading = true;
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should not call loadMoreCallback when hasMore is false', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.hasMore = false;
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(mockCallback).not.toHaveBeenCalled();
        });

        it('should set isLoading to true during callback execution', async () => {
            let loadingDuringCallback = false;
            const slowCallback = jest.fn(async () => {
                loadingDuringCallback = infiniteScroll.isLoading;
                return true;
            });
            
            infiniteScroll = new InfiniteScroll(container, slowCallback);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(loadingDuringCallback).toBe(true);
        });

        it('should set isLoading to false after callback completes', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(infiniteScroll.isLoading).toBe(false);
        });

        it('should update hasMore based on callback return value', async () => {
            const callbackReturningFalse = jest.fn().mockResolvedValue(false);
            infiniteScroll = new InfiniteScroll(container, callbackReturningFalse);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(infiniteScroll.hasMore).toBe(false);
        });

        it('should handle callback errors gracefully', async () => {
            const errorCallback = jest.fn().mockRejectedValue(new Error('Load failed'));
            infiniteScroll = new InfiniteScroll(container, errorCallback);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            // Should not throw
            await expect(infiniteScroll.handleIntersection(entries)).resolves.not.toThrow();
            
            // Should reset loading state
            expect(infiniteScroll.isLoading).toBe(false);
        });

        it('should set isLoading to false even when callback throws error', async () => {
            const errorCallback = jest.fn().mockRejectedValue(new Error('Load failed'));
            infiniteScroll = new InfiniteScroll(container, errorCallback);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            await infiniteScroll.handleIntersection(entries);
            
            expect(infiniteScroll.isLoading).toBe(false);
        });
    });

    describe('reset', () => {
        it('should reset hasMore to true', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.hasMore = false;
            
            infiniteScroll.reset();
            
            expect(infiniteScroll.hasMore).toBe(true);
        });

        it('should reset isLoading to false', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.isLoading = true;
            
            infiniteScroll.reset();
            
            expect(infiniteScroll.isLoading).toBe(false);
        });

        it('should reset both hasMore and isLoading', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.hasMore = false;
            infiniteScroll.isLoading = true;
            
            infiniteScroll.reset();
            
            expect(infiniteScroll.hasMore).toBe(true);
            expect(infiniteScroll.isLoading).toBe(false);
        });
    });

    describe('destroy', () => {
        it('should disconnect observer', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            const disconnectSpy = jest.spyOn(infiniteScroll.observer, 'disconnect');
            
            infiniteScroll.destroy();
            
            expect(disconnectSpy).toHaveBeenCalledTimes(1);
        });

        it('should remove sentinel element', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            const sentinel = infiniteScroll.sentinel;
            
            expect(container.contains(sentinel)).toBe(true);
            
            infiniteScroll.destroy();
            
            expect(container.contains(sentinel)).toBe(false);
        });

        it('should handle null observer gracefully', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.observer = null;
            
            expect(() => {
                infiniteScroll.destroy();
            }).not.toThrow();
        });

        it('should handle null sentinel gracefully', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.sentinel = null;
            
            expect(() => {
                infiniteScroll.destroy();
            }).not.toThrow();
        });

        it('should handle both observer and sentinel being null', () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.observer = null;
            infiniteScroll.sentinel = null;
            
            expect(() => {
                infiniteScroll.destroy();
            }).not.toThrow();
        });
    });

    describe('integration scenarios', () => {
        it('should allow multiple load cycles', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            // First load
            await infiniteScroll.handleIntersection(entries);
            expect(mockCallback).toHaveBeenCalledTimes(1);
            
            // Second load
            await infiniteScroll.handleIntersection(entries);
            expect(mockCallback).toHaveBeenCalledTimes(2);
            
            // Third load
            await infiniteScroll.handleIntersection(entries);
            expect(mockCallback).toHaveBeenCalledTimes(3);
        });

        it('should stop loading when hasMore becomes false', async () => {
            let callCount = 0;
            const limitedCallback = jest.fn(async () => {
                callCount++;
                return callCount < 3; // Return false on third call
            });
            
            infiniteScroll = new InfiniteScroll(container, limitedCallback);
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            // First two loads should work
            await infiniteScroll.handleIntersection(entries);
            await infiniteScroll.handleIntersection(entries);
            await infiniteScroll.handleIntersection(entries);
            
            expect(limitedCallback).toHaveBeenCalledTimes(3);
            expect(infiniteScroll.hasMore).toBe(false);
            
            // Fourth attempt should not call callback
            await infiniteScroll.handleIntersection(entries);
            expect(limitedCallback).toHaveBeenCalledTimes(3); // Still 3
        });

        it('should allow reset and continue loading', async () => {
            infiniteScroll = new InfiniteScroll(container, mockCallback);
            infiniteScroll.hasMore = false;
            
            const entries = [{
                isIntersecting: true,
                target: infiniteScroll.sentinel
            }];
            
            // Should not load when hasMore is false
            await infiniteScroll.handleIntersection(entries);
            expect(mockCallback).not.toHaveBeenCalled();
            
            // Reset
            infiniteScroll.reset();
            
            // Should load after reset
            await infiniteScroll.handleIntersection(entries);
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });
});
