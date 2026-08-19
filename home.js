// GHOTI MARKET Homepage Optimization Engine (Production-Ready v2.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ----------------------------------------------------
// 1. CONFIGURATION & CONSTANTS
// ----------------------------------------------------
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE",
    authDomain: "ghotimarket.firebaseapp.com",
    projectId: "ghotimarket",
    storageBucket: "ghotimarket.firebasestorage.app",
    messagingSenderId: "481257644093",
    appId: "1:481257644093:web:0dfc3699d6b3c86afeca54"
};

const CACHE_KEYS = {
    BANNERS: 'gm_cache_banners_v1',
    CATEGORIES: 'gm_cache_categories_v1',
    PRODUCTS: 'gm_cache_products_v1'
};

const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes TTL
const REQUEST_TIMEOUT = 8000;    // 8 Seconds Timeout
const SEARCH_DEBOUNCE_MS = 150;  // Debounce delay
const FALLBACK_IMG = 'https://via.placeholder.com/300?text=Image+Unavailable';

// Firebase Initialization
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// Global Application Memory State
let swiperInstance = null;
let globalSearchIndex = { categories: [], products: [] };
let isFetching = { banners: false, categories: false, products: false };
let sharedObserver = null;

// ----------------------------------------------------
// 2. UTILITY & SECURITY FUNCTIONS
// ----------------------------------------------------

/**
 * Sanitizes unsafe HTML to prevent XSS vulnerability
 */
function escapeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[m]);
}

/**
 * Validates URLs against malformed or javascript: protocols
 */
function safeURL(urlStr, fallback = '#') {
    if (!urlStr || typeof urlStr !== 'string') return fallback;
    try {
        const parsed = new URL(urlStr, window.location.origin);
        if (['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol)) {
            return escapeHTML(urlStr);
        }
    } catch (_) {
        if (urlStr.startsWith('/') || urlStr.startsWith('#')) return escapeHTML(urlStr);
    }
    return fallback;
}

/**
 * Debounce Function for Performance Optimization
 */
function debounce(func, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
}

/**
 * Fast deep-comparison to check if DOM needs re-rendering
 */
function isDataEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Promise Timeout Wrapper to prevent hanging network requests
 */
function withTimeout(promiseMs, promise) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Request Timeout")), promiseMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

// ----------------------------------------------------
// 3. SMART CLIENT-SIDE CACHE ENGINE
// ----------------------------------------------------

function getCache(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.data || !parsed.timestamp) return null;
        return parsed;
    } catch (e) {
        console.warn(`Cache read error for ${key}:`, e);
        localStorage.removeItem(key);
        return null;
    }
}

function setCache(key, data) {
    try {
        const payload = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
        console.warn(`Cache write error for ${key}:`, e);
    }
}

function isCacheValid(cacheObj) {
    if (!cacheObj) return false;
    return (Date.now() - cacheObj.timestamp) < CACHE_TTL;
}

// ----------------------------------------------------
// 4. SKELETON UI CONTROL
// ----------------------------------------------------

function showSkeletons() {
    const bannerBox = document.getElementById('banner-wrapper');
    if (bannerBox && !bannerBox.children.length) {
        bannerBox.innerHTML = `<div class="swiper-slide"><div class="skeleton banner-skeleton"></div></div>`;
    }

    const catGrid = document.getElementById('category-grid');
    if (catGrid && !catGrid.children.length) {
        catGrid.innerHTML = Array(12).fill(0).map(() => `
            <div class="category-card">
                <div class="skeleton cat-skeleton"></div>
                <div class="skeleton" style="height:12px; margin-top:8px; width:70%;"></div>
            </div>
        `).join('');
    }

    const prodGrid = document.getElementById('latest-products');
    if (prodGrid && !prodGrid.children.length) {
        prodGrid.innerHTML = Array(8).fill(0).map(() => `
            <div class="home-product-card" style="padding:10px;">
                <div class="skeleton product-skeleton"></div>
                <div class="skeleton" style="height:14px; margin-top:10px; width:85%;"></div>
                <div class="skeleton" style="height:16px; margin-top:8px; width:40%;"></div>
            </div>
        `).join('');
    }
}

function removeMainLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 300);
    }
}

// ----------------------------------------------------
// 5. RENDERING ENGINES
// ----------------------------------------------------

function renderBanners(banners) {
    const bannerWrapper = document.getElementById('banner-wrapper');
    if (!bannerWrapper || !banners.length) return;

    bannerWrapper.innerHTML = banners.map((banner, index) => {
        const targetAttr = banner.link ? 'target="_blank" rel="noopener noreferrer"' : '';
        const loadingAttr = index === 0 ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';
        const link = safeURL(banner.link);
        const imgUrl = safeURL(banner.url, FALLBACK_IMG);

        return `
        <div class="swiper-slide">
            <a href="${link}" ${targetAttr} style="display:block;width:100%;height:100%;">
                <img src="${imgUrl}" alt="Banner" ${loadingAttr} data-fallback="${FALLBACK_IMG}">
            </a>
        </div>
        `;
    }).join('');

    attachImageErrorHandlers(bannerWrapper);

    // Swiper Singleton Management
    if (typeof Swiper !== 'undefined') {
        if (swiperInstance) {
            swiperInstance.destroy(true, true);
        }
        swiperInstance = new Swiper('.banner-container', {
            loop: banners.length > 1,
            autoplay: banners.length > 1 ? { delay: 4000, disableOnInteraction: false } : false,
            pagination: { el: '.swiper-pagination', clickable: true }
        });
    }
}

function renderCategories(categories) {
    const catGrid = document.getElementById('category-grid');
    if (!catGrid) return;

    if (!categories.length) {
        catGrid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#94a3b8;">কোনো ক্যাটাগরি পাওয়া যায়নি</p>`;
        return;
    }

    catGrid.innerHTML = categories.slice(0, 24).map(cat => {
        const catName = escapeHTML(cat.categoryName || 'Unnamed');
        const catSlug = escapeHTML(cat.slug || '#');
        const catImage = safeURL(cat.image, FALLBACK_IMG);
        const link = `https://ghotimarket.com/category.html?slug=${catSlug}`;

        return `
        <a href="${link}" class="category-card fade-up">
            <div class="cat-img-box">
                <img src="${catImage}" alt="${catName}" loading="lazy" decoding="async" data-fallback="${FALLBACK_IMG}">
            </div>
            <div class="cat-name">${catName}</div>
        </a>
        `;
    }).join('');

    attachImageErrorHandlers(catGrid);
    applyScrollAnimations();
}

function renderProducts(products) {
    const productBox = document.getElementById("latest-products");
    if (!productBox) return;

    if (!products.length) {
        productBox.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b;">কোনো পণ্য পাওয়া যায়নি।</p>`;
        return;
    }

    productBox.innerHTML = products.map((p, index) => {
        let discount = "";
        const price = Number(p.price) || 0;
        const oldPrice = Number(p.oldPrice) || 0;

        if (oldPrice > price) {
            const percent = Math.round(((oldPrice - price) / oldPrice) * 100);
            discount = `<span class="discount-badge">${percent}% OFF</span>`;
        }

        const productImage = safeURL(p.images?.[0], FALLBACK_IMG);
        const productName = escapeHTML(p.name || "Unnamed Product");
        const productSlug = escapeHTML(p.slug || p.id || '');
        const productLink = `https://ghotimarket.com/product.html?${productSlug}`;
        
        // Above-the-fold image strategy
        const loadingAttr = index < 4 ? 'loading="eager"' : 'loading="lazy" decoding="async"';

        return `
        <a class="home-product-card fade-up" href="${productLink}">
            <div class="product-image-box" style="position:relative;">
                ${discount}
                <img src="${productImage}" alt="${productName}" ${loadingAttr} data-fallback="${FALLBACK_IMG}">
            </div>
            <div class="home-product-info">
                <div class="home-product-name">${productName}</div>
                <div class="price-box" style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                    <span class="home-product-price" style="color:#FF6B35; font-size:16px; font-weight:800;">৳${price}</span>
                    ${oldPrice > price ? `<span class="old-price" style="text-decoration:line-through; color:#94a3b8; font-size:13px;">৳${oldPrice}</span>` : ''}
                </div>
            </div>
        </a>
        `;
    }).join("");

    attachImageErrorHandlers(productBox);
    applyScrollAnimations();
}

/**
 * Reusable Broken Image Fallback Handler
 */
function attachImageErrorHandlers(container) {
    if (!container) return;
    const imgs = container.querySelectorAll('img');
    imgs.forEach(img => {
        img.onerror = function() {
            this.onerror = null; // Prevent loop
            this.src = this.getAttribute('data-fallback') || FALLBACK_IMG;
        };
    });
}

// ----------------------------------------------------
// 6. INDEPENDENT FIREBASE FETCHERS
// ----------------------------------------------------

async function fetchBannersBackground(cachedData) {
    if (isFetching.banners) return;
    isFetching.banners = true;

    try {
        // Reasonable limit applied to prevent excessive read operations
        const q = query(collection(db, "banners"), orderBy("createdAt", "desc"), limit(10));
        const snap = await withTimeout(REQUEST_TIMEOUT, getDocs(q));
        const freshData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (!cachedData || !isDataEqual(cachedData, freshData)) {
            renderBanners(freshData);
            setCache(CACHE_KEYS.BANNERS, freshData);
        }
    } catch (err) {
        console.error("Banners Network Error:", err);
    } finally {
        isFetching.banners = false;
    }
}

async function fetchCategoriesBackground(cachedData) {
    if (isFetching.categories) return;
    isFetching.categories = true;

    try {
        const q = query(collection(db, "categories"), limit(24));
        const snap = await withTimeout(REQUEST_TIMEOUT, getDocs(q));
        const freshData = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (!cachedData || !isDataEqual(cachedData, freshData)) {
            renderCategories(freshData);
            setCache(CACHE_KEYS.CATEGORIES, freshData);
            buildSearchIndexCategories(freshData);
        }
    } catch (err) {
        console.error("Categories Network Error:", err);
    } finally {
        isFetching.categories = false;
    }
}

async function fetchProductsBackground(cachedData) {
    if (isFetching.products) return;
    isFetching.products = true;

    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20));
        const snap = await withTimeout(REQUEST_TIMEOUT, getDocs(q));
        const freshData = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(product => product.active !== false);

        if (!cachedData || !isDataEqual(cachedData, freshData)) {
            renderProducts(freshData);
            setCache(CACHE_KEYS.PRODUCTS, freshData);
            buildSearchIndexProducts(freshData);
        }
    } catch (err) {
        console.error("Products Network Error:", err);
    } finally {
        isFetching.products = false;
    }
}

// ----------------------------------------------------
// 7. PRE-NORMALIZED SEARCH INDEX ENGINE
// ----------------------------------------------------

function buildSearchIndexCategories(categories) {
    globalSearchIndex.categories = categories.map(c => ({
        id: c.id,
        categoryName: c.categoryName || '',
        slug: c.slug || '',
        image: c.image || '',
        nameLower: (c.categoryName || '').toLowerCase()
    }));
}

function buildSearchIndexProducts(products) {
    globalSearchIndex.products = products.map(p => ({
        id: p.id,
        name: p.name || '',
        slug: p.slug || p.id || '',
        image: p.images?.[0] || '',
        nameLower: (p.name || '').toLowerCase(),
        descLower: (p.description || '').toLowerCase(),
        keywordsLower: Array.isArray(p.keywords) ? p.keywords.join(" ").toLowerCase() : (p.keywords || '').toLowerCase()
    }));
}

function initSearch() {
    const searchInput = document.getElementById('smartSearch');
    const resultsBox = document.getElementById('search-results');
    if (!searchInput || !resultsBox) return;

    const executeSearch = debounce((queryVal) => {
        const val = queryVal.toLowerCase().trim();
        if (val.length < 2) {
            resultsBox.style.display = 'none';
            return;
        }

        const matchCats = globalSearchIndex.categories
            .filter(c => c.nameLower.includes(val))
            .slice(0, 3);

        const matchProds = globalSearchIndex.products
            .filter(p => p.nameLower.includes(val) || p.descLower.includes(val) || p.keywordsLower.includes(val))
            .slice(0, 5);

        let html = '';

        if (matchCats.length) {
            html += `<div class="search-group-title" style="font-weight:bold; padding:6px 12px; background:#f1f5f9; font-size:12px; color:#475569;">ক্যাটাগরি</div>`;
            html += matchCats.map(c => `
                <a href="https://ghotimarket.com/category.html?slug=${escapeHTML(c.slug)}" class="search-item" style="display:flex; align-items:center; gap:8px; padding:8px 12px; text-decoration:none; color:#1e293b;">
                    <img src="${safeURL(c.image, FALLBACK_IMG)}" alt="${escapeHTML(c.categoryName)}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;"> 
                    <span>${escapeHTML(c.categoryName)}</span>
                </a>
            `).join('');
        }

        if (matchProds.length) {
            html += `<div class="search-group-title" style="font-weight:bold; padding:6px 12px; background:#f1f5f9; font-size:12px; color:#475569;">পণ্য</div>`;
            html += matchProds.map(p => `
               <a href="https://ghotimarket.com/product.html?${escapeHTML(p.slug)}" class="search-item" style="display:flex; align-items:center; gap:8px; padding:8px 12px; text-decoration:none; color:#1e293b;">
                    <img src="${safeURL(p.image, FALLBACK_IMG)}" alt="${escapeHTML(p.name)}" style="width:30px; height:30px; object-fit:cover; border-radius:4px;"> 
                    <span>${escapeHTML(p.name)}</span>
                </a>
            `).join('');
        }

        resultsBox.innerHTML = html || '<p style="text-align:center; padding:10px; color:#94a3b8; margin:0;">কিছু পাওয়া যায়নি</p>';
        resultsBox.style.display = 'block';
    }, SEARCH_DEBOUNCE_MS);

    searchInput.addEventListener('input', (e) => executeSearch(e.target.value));

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            resultsBox.style.display = 'none';
        }
    });
}

// ----------------------------------------------------
// 8. OPTIMIZED SCROLL ANIMATION (SINGLETON OBSERVER)
// ----------------------------------------------------

function applyScrollAnimations() {
    if (typeof IntersectionObserver === 'undefined') return;

    if (!sharedObserver) {
        sharedObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target); // Stop observing once animated
                }
            });
        }, { threshold: 0.1 });
    }

    document.querySelectorAll(".fade-up:not(.visible)").forEach(el => {
        sharedObserver.observe(el);
    });
}

// ----------------------------------------------------
// 9. NETWORK & OFFLINE HANDLER
// ----------------------------------------------------

function initNetworkMonitoring() {
    const toast = document.getElementById('offline-toast');
    
    const updateOnlineStatus = () => {
        if (!navigator.onLine) {
            if (toast) toast.style.display = 'block';
        } else {
            if (toast) toast.style.display = 'none';
            // Background refresh when coming back online
            refreshAllInBackground();
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

function refreshAllInBackground() {
    const bCache = getCache(CACHE_KEYS.BANNERS);
    const cCache = getCache(CACHE_KEYS.CATEGORIES);
    const pCache = getCache(CACHE_KEYS.PRODUCTS);

    fetchBannersBackground(bCache?.data);
    fetchCategoriesBackground(cCache?.data);
    fetchProductsBackground(pCache?.data);
}

// ----------------------------------------------------
// 10. MAIN APP INITIALIZATION (NON-BLOCKING)
// ----------------------------------------------------

function initApp() {
    // 1. Static UI Helpers
    if (typeof lucide !== 'undefined') lucide.createIcons();
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // 2. Read Local Storage Cache
    const cachedBanners = getCache(CACHE_KEYS.BANNERS);
    const cachedCategories = getCache(CACHE_KEYS.CATEGORIES);
    const cachedProducts = getCache(CACHE_KEYS.PRODUCTS);

    let hasAnyCache = false;

    // Render Banners immediately from Cache if available
    if (cachedBanners && Array.isArray(cachedBanners.data)) {
        renderBanners(cachedBanners.data);
        hasAnyCache = true;
    }

    // Render Categories immediately from Cache if available
    if (cachedCategories && Array.isArray(cachedCategories.data)) {
        renderCategories(cachedCategories.data);
        buildSearchIndexCategories(cachedCategories.data);
        hasAnyCache = true;
    }

    // Render Products immediately from Cache if available
    if (cachedProducts && Array.isArray(cachedProducts.data)) {
        renderProducts(cachedProducts.data);
        buildSearchIndexProducts(cachedProducts.data);
        hasAnyCache = true;
    }

    // 3. Skeleton UI Behavior
    if (hasAnyCache) {
        removeMainLoader(); // Instantly show UI without blocking user!
    } else {
        showSkeletons();
        removeMainLoader();
    }

    // 4. Initialize Search & Network Listeners
    initSearch();
    initNetworkMonitoring();

    // 5. Trigger Background Firebase Refresh (Non-blocking, Independent Execution)
    fetchBannersBackground(cachedBanners?.data);
    fetchCategoriesBackground(cachedCategories?.data);
    fetchProductsBackground(cachedProducts?.data);
}

// Execute on DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
