// Import Firebase v10 Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy, 
    limit, 
    where 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*
  ===================================================================
  SECURITY ADVICE & BEST PRACTICES:
  Frontend-এ শুধুমাত্র Firebase Web API Keys রাখা সম্পূর্ণ নিরাপদ। 
  Firestore Security Rules কনফিগার করে ডাটা এক্সেস কন্ট্রোল বজায় রাখুন।
  ===================================================================
*/

const firebaseConfig = {
    apiKey: "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE",
    authDomain: "ghotimarket.firebaseapp.com",
    projectId: "ghotimarket",
    storageBucket: "ghotimarket.firebasestorage.app",
    messagingSenderId: "481257644093",
    appId: "1:481257644093:web:0dfc3699d6b3c86afeca54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global State Variables (Shops system completely removed)
let allCategories = [];
let allProducts = [];

// Search System Optimization: Cache, Debounce Timer & Stale Request Tracking
const searchCache = new Map();
let searchDebounceTimer = null;
let currentSearchRequestId = 0;

// Initialize Lucide Icons & Footer Year
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Loader Progress Control
let progress = 0;
const progressFill = document.getElementById('load-progress');
const updateProgress = (val) => {
    progress = val;
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
};

/**
 * Main Data Loading Function using Asynchronous Non-Blocking Parallel Execution
 * Fetches banners, categories, and products independently (Shop fetching removed).
 * Each section renders immediately upon completion.
 */
async function loadData() {
    updateProgress(10);

    let completedTasks = 0;
    const totalTasks = 3; // Reduced total tasks from 4 to 3
    const incrementProgress = () => {
        completedTasks++;
        updateProgress(10 + Math.floor((completedTasks / totalTasks) * 90));
    };

    // 1. Fetch Banners
    const fetchBanners = getDocs(query(collection(db, "banners"), orderBy("createdAt", "desc")))
        .then(bannerSnap => renderBanner(bannerSnap))
        .catch(err => console.error("Banners Loading Error:", err))
        .finally(incrementProgress);

    // 2. Fetch Categories (Strict Limit: 20)
    const fetchCategories = getDocs(query(collection(db, "categories"), limit(20)))
        .then(catSnap => renderCategories(catSnap))
        .catch(err => console.error("Categories Loading Error:", err))
        .finally(incrementProgress);

    // 3. Fetch Products (Strict Limit: 12)
    const fetchProducts = getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12)))
        .then(prodSnap => renderProducts(prodSnap))
        .catch(err => console.error("Products Loading Error:", err))
        .finally(incrementProgress);

    // Ensure all promises settle independently
    await Promise.allSettled([fetchBanners, fetchCategories, fetchProducts]);

    // Smooth & Fast Loader Hiding (Artificial delays removed)
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 300);
    }
    handleScrollAnim();
    initSearch();
}

/**
 * Render Banner Section
 */
function renderBanner(bannerSnap) {
    const bannerWrapper = document.getElementById('banner-wrapper');
    if (!bannerWrapper) return;

    bannerWrapper.innerHTML = bannerSnap.docs.map((d, index) => {
        const banner = d.data();
        const loadingAttr = index === 0 ? 'loading="eager"' : 'loading="lazy"';
        return `
        <div class="swiper-slide">
            <a href="${banner.link || '#'}" ${banner.link ? 'target="_blank"' : ''} style="display:block;width:100%;height:100%;">
                <img src="${banner.url || 'https://via.placeholder.com/981x363'}" alt="Banner" ${loadingAttr}>
            </a>
        </div>
        `;
    }).join('');

    if (typeof Swiper !== 'undefined') {
        new Swiper('.banner-container', {
            loop: true,
            autoplay: { delay: 4000, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true }
        });
    }
}

/**
 * Render Categories Section (Strictly max 20)
 */
function renderCategories(catSnap) {
    const catGrid = document.getElementById('category-grid');
    if (!catGrid) return;

    allCategories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    catGrid.innerHTML = allCategories.slice(0, 20).map(cat => `
        <a href="https://ghotimarket.com/category.html?slug=${cat.slug || '#'}" class="category-card fade-up">
            <div class="cat-img-box">
                <img src="${cat.image || 'https://via.placeholder.com/80'}" alt="${cat.categoryName || 'Category'}" loading="lazy">
            </div>
            <div class="cat-name">${cat.categoryName || 'Unnamed'}</div>
        </a>
    `).join('');
}

/**
 * Render Latest Products Section
 */
function renderProducts(prodSnap) {
    const productBox = document.getElementById("latest-products");
    if (!productBox) return;

    allProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(product => product.active !== false);

    if (!allProducts.length) {
        productBox.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b;">কোনো পণ্য পাওয়া যায়নি</p>`;
        return;
    }

    productBox.innerHTML = allProducts.map(p => {
        let discount = "";
        if (p.oldPrice && p.oldPrice > p.price) {
            let percent = Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100);
            discount = `<span class="discount-badge">${percent}% OFF</span>`;
        }

        const productImage = p.images?.[0] || 'https://via.placeholder.com/300';
        const productName = p.name || "Unnamed Product";
        const productPrice = p.price || 0;

        return `
        <a class="home-product-card" href="https://ghotimarket.com/product.html?${p.slug || p.id}">
            <div class="product-image-box" style="position:relative;">
                ${discount}
                <img src="${productImage}" alt="${productName}" loading="lazy">
            </div>
            <div class="home-product-info">
                <div class="home-product-name">${productName}</div>
                <div class="price-box" style="margin-top:8px; display:flex; align-items:center; gap:8px;">
                    <span class="home-product-price" style="color:#FF6B35; font-size:16px; font-weight:800;">৳${productPrice}</span>
                    ${p.oldPrice && p.oldPrice > p.price ? `<span class="old-price" style="text-decoration:line-through; color:#94a3b8; font-size:13px;">৳${p.oldPrice}</span>` : ''}
                </div>
            </div>
        </a>
        `;
    }).join("");
}

/**
 * Scroll Animation Observer for Fade-Up Elements
 */
function handleScrollAnim() {
    const elements = document.querySelectorAll(".fade-up");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.15 });

    elements.forEach(el => observer.observe(el));
}

/**
 * Render Search Results Dropdown HTML
 */
function renderSearchResultsHTML(resultsBox, categories = [], products = []) {
    let html = '';

    // Render Categories Group
    if (categories.length > 0) {
        html += `<div class="search-group-title">ক্যাটাগরি</div>` + categories.map(c => `
            <a href="https://ghotimarket.com/category.html?slug=${c.slug || '#'}" class="search-item">
                <img src="${c.image || 'https://via.placeholder.com/40'}" alt="${c.categoryName || ''}" loading="lazy"> 
                <span class="search-item-title">${c.categoryName || 'Unnamed Category'}</span>
            </a>
        `).join('');
    }

    // Render Products Group
    if (products.length > 0) {
        html += `<div class="search-group-title">পণ্য</div>` + products.map(p => `
            <a href="https://ghotimarket.com/product.html?${p.slug || p.id}" class="search-item">
                <img src="${p.images?.[0] || 'https://via.placeholder.com/40'}" alt="${p.name || ''}" loading="lazy"> 
                <div class="search-item-info">
                    <span class="search-item-title">${p.name || 'Unnamed Product'}</span>
                    <span class="search-item-price">৳${p.price || 0}</span>
                </div>
            </a>
        `).join('');
    }

    if (!categories.length && !products.length) {
        html = '<div class="search-no-result">কোনো ফলাফল পাওয়া যায়নি</div>';
    }

    resultsBox.innerHTML = html;
    resultsBox.style.display = 'block';
}

/**
 * Process Search Logic:
 * 1. LOCAL-FIRST SEARCH (allCategories & allProducts)
 * 2. CACHE CHECK
 * 3. FIREBASE FALLBACK SEARCH (Debounced + Anti-Race-Condition)
 */
async function processSearch(rawQueryText) {
    const resultsBox = document.getElementById('search-results');
    if (!resultsBox) return;

    const queryText = rawQueryText.trim();
    const queryLower = queryText.toLowerCase();

    if (queryText.length < 2) {
        resultsBox.style.display = 'none';
        return;
    }

    // STEP 1: LOCAL-FIRST SEARCH
    const matchCats = allCategories.filter(c => c.categoryName && c.categoryName.toLowerCase().includes(queryLower)).slice(0, 3);
    const matchProds = allProducts.filter(p => {
        if (p.active === false) return false;
        const name = p.name ? p.name.toLowerCase() : "";
        const description = p.description ? p.description.toLowerCase() : "";
        const keywords = Array.isArray(p.keywords) ? p.keywords.join(" ").toLowerCase() : (p.keywords || "").toLowerCase();

        return name.includes(queryLower) || description.includes(queryLower) || keywords.includes(queryLower);
    }).slice(0, 5);

    // If local results exist, show immediately without querying Firebase
    if (matchCats.length > 0 || matchProds.length > 0) {
        renderSearchResultsHTML(resultsBox, matchCats, matchProds);
        return;
    }

    // STEP 2: CHECK IN-MEMORY CACHE FOR FIREBASE FALLBACKS
    const cacheKey = queryLower;
    if (searchCache.has(cacheKey)) {
        const cached = searchCache.get(cacheKey);
        renderSearchResultsHTML(resultsBox, cached.categories, cached.products);
        return;
    }

    // STEP 3: FIREBASE FALLBACK SEARCH
    resultsBox.innerHTML = `
        <div class="search-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>খুঁজছি...</span>
        </div>
    `;
    resultsBox.style.display = 'block';

    // Track Request ID for Race Condition Prevention
    currentSearchRequestId++;
    const thisRequestId = currentSearchRequestId;

    try {
        /*
          FIRESTORE SEARCH QUERY NOTES:
          Firestore Native Prefix Search matches string prefixes using `>=` and `<= text + \uf8ff`.
          For enhanced multi-word search in Firestore, ensure documents include normalized fields:
          - searchName: "iphone 15 pro max"
          - searchKeywords: ["iphone", "mobile", "apple"]
        */

        const catQuery = query(
            collection(db, "categories"),
            where("categoryName", ">=", queryText),
            where("categoryName", "<=", queryText + "\uf8ff"),
            limit(3)
        );

        const prodQuery = query(
            collection(db, "products"),
            where("name", ">=", queryText),
            where("name", "<=", queryText + "\uf8ff"),
            limit(5)
        );

        const [catSnap, prodSnap] = await Promise.all([
            getDocs(catQuery).catch(() => ({ docs: [] })),
            getDocs(prodQuery).catch(() => ({ docs: [] }))
        ]);

        // Stale Request Guard (Ignore if user typed something else while fetching)
        if (thisRequestId !== currentSearchRequestId) {
            return;
        }

        const remoteCategories = catSnap.docs ? catSnap.docs.map(d => ({ id: d.id, ...d.data() })) : [];
        const remoteProducts = prodSnap.docs 
            ? prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false)
            : [];

        // Cache results
        searchCache.set(cacheKey, {
            categories: remoteCategories,
            products: remoteProducts
        });

        renderSearchResultsHTML(resultsBox, remoteCategories, remoteProducts);

    } catch (error) {
        console.error("Firebase Search Fallback Error:", error);
        if (thisRequestId === currentSearchRequestId) {
            renderSearchResultsHTML(resultsBox, [], []);
        }
    }
}

/**
 * Initialize Smart Search Component with Debounce
 */
function initSearch() {
    const searchInput = document.getElementById('smartSearch');
    const resultsBox = document.getElementById('search-results');
    if (!searchInput || !resultsBox) return;

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value;

        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }

        if (val.trim().length < 2) {
            resultsBox.style.display = 'none';
            return;
        }

        // 350ms Debounce
        searchDebounceTimer = setTimeout(() => {
            processSearch(val);
        }, 350);
    });

    // Close search results on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            resultsBox.style.display = 'none';
        }
    });
}

// Trigger Application Initialization
loadData();
