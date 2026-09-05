// Performance optimization utilities
// Mobile-first performance enhancements for 3G networks and mid-range Android devices

/**
 * Debounce function to limit how often a function can fire
 * Useful for search inputs and scroll events
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution rate
 * Useful for scroll handlers and resize events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy load images with intersection observer
 * Reduces initial page load time
 */
export function lazyLoadImages() {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: "50px", // Start loading 50px before entering viewport
  });

  document.querySelectorAll("img[data-src]").forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * Preload critical resources
 * Call this for critical fonts or scripts needed above the fold
 */
export function preloadResource(href: string, as: "font" | "script" | "style") {
  if (typeof document === "undefined") return;
  
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  
  if (as === "font") {
    link.crossOrigin = "anonymous";
  }
  
  document.head.appendChild(link);
}

/**
 * Detect network connection quality
 * Adjust UI behavior based on connection speed
 */
export function getNetworkQuality(): "slow" | "medium" | "fast" {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return "medium";
  }

  const connection = (navigator as any).connection;
  if (!connection) return "medium";

  const effectiveType = connection.effectiveType;
  const saveData = connection.saveData;

  if (saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
    return "slow";
  }
  if (effectiveType === "3g") {
    return "medium";
  }
  return "fast";
}

/**
 * Request animation frame throttle
 * Better performance than setTimeout for animations
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let ticking = false;
  
  return function tick(this: any, ...args: Parameters<T>) {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback.apply(this, args);
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * Measure and log performance metrics
 * Useful for monitoring real-world performance
 */
export function measurePerformance() {
  if (typeof window === "undefined" || !("performance" in window)) {
    return;
  }

  // Measure page load time
  window.addEventListener("load", () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;
    
    console.log("Performance Metrics:", {
      pageLoadTime: `${pageLoadTime}ms`,
      connectTime: `${connectTime}ms`,
      renderTime: `${renderTime}ms`,
    });
  });
}

/**
 * Optimize images for mobile by using appropriate formats and sizes
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  width: number,
  height: number,
  quality: number = 80
): string {
  // This would integrate with your image CDN
  // For now, return the URL as-is
  return baseUrl;
}

/**
 * Virtual scrolling for long lists
 * Reduces DOM nodes and improves scroll performance
 */
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  totalItems: number;
  renderItem: (index: number) => HTMLElement;
}

export function setupVirtualScroll(
  container: HTMLElement,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, totalItems, renderItem } = options;
  
  let scrollTop = 0;
  const visibleItems = Math.ceil(containerHeight / itemHeight) + 2;
  
  function render() {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
    const endIndex = Math.min(totalItems, startIndex + visibleItems);
    
    container.innerHTML = "";
    
    for (let i = startIndex; i < endIndex; i++) {
      const item = renderItem(i);
      item.style.position = "absolute";
      item.style.top = `${i * itemHeight}px`;
      item.style.height = `${itemHeight}px`;
      container.appendChild(item);
    }
  }
  
  container.addEventListener("scroll", rafThrottle(() => {
    scrollTop = container.scrollTop;
    render();
  }));
  
  render();
}