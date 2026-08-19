import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    getDoc,
    doc,
    query, 
    where, 
    limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration
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

// Global App States
let allProducts = [];
let allCategories = [];

// Initialize Homepage
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    updateProgress(30);
    await loadData();
    updateProgress(100);
    
    setTimeout(() => {
        const loader = document.getElementById("loader");
        if (loader) loader.classList.add("hidden");
    }, 300);

    setupSearch();
    updateYear();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function updateProgress(val) {
    const bar = document.getElementById("load-progress");
    if (bar) bar.style.width = `${val}%`;
}

function updateYear() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
}

// Load Initial Landing Page Data (12 Products Only)
async function loadData() {
    try {
        // 1. Banners
        const bannerSnap = await getDocs(collection(db, "banners"));
        const banners = [];
        bannerSnap.forEach(docSnap => banners.push(docSnap.data()));
        renderBanners(banners);
        updateProgress(50);

        // 2. Categories
        const catSnap = await getDocs(collection(db, "categories"));
        allCategories = [];
        catSnap.forEach(docSnap => {
            allCategories.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderCategories(allCategories);
        updateProgress(75);

        // 3. Initial 12 Products
        const prodQuery = query(
            collection(db, "products"), 
            where("active", "==", true), 
            limit(12)
        );
        const prodSnap = await getDocs(prodQuery);
        allProducts = [];
        prodSnap.forEach(docSnap => {
            allProducts.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderProducts(allProducts);

    } catch (error) {
        console.error("Error loading homepage data:", error);
    }
}

// Render Handlers
function renderBanners(banners) {
    const wrapper = document.getElementById("banner-wrapper");
    if (!wrapper) return;

    if (!banners || banners.length === 0) {
        wrapper.innerHTML = `
            <div class="swiper-slide">
                <img src="https://via.placeholder.com/981x363?text=Ghoti+Market" alt="Banner">
            </div>`;
    } else {
        wrapper.innerHTML = banners.map(b => `
            <div class="swiper-slide">
                <a href="${b.link || '#'}">
                    <img src="${b.imageUrl || b.image}" alt="Ghoti Market Banner" loading="lazy">
                </a>
            </div>
        `).join('');
    }

    if (typeof Swiper !== 'undefined') {
        new Swiper('.banner-container', {
            loop: true,
            autoplay: { delay: 3500, disableOnInteraction: false },
            pagination: { el: '.swiper-pagination', clickable: true },
        });
    }
}

function renderCategories(categories) {
    const grid = document.getElementById("category-grid");
    if (!grid) return;

    if (!categories || categories.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#94a3b8;font-size:13px;">কোনো ক্যাটাগরি পাওয়া যায়নি</p>`;
        return;
    }

    grid.innerHTML = categories.slice(0, 8).map(c => `
        <a href="https://ghotimarket.com/category/${c.slug || c.id}" class="category-card">
            <img src="${c.icon || c.image || 'https://i.ibb.co.com/RG2hrf3y/background-remove-ghoti-market.png'}" alt="${c.name || 'Category'}" loading="lazy">
            <span>${c.name || 'ক্যাটাগরি'}</span>
        </a>
    `).join('');
}

function renderProducts(products) {
    const grid = document.getElementById("latest-products");
    if (!grid) return;

    if (!products || products.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#94a3b8;font-size:13px;">কোনো পণ্য পাওয়া যায়নি</p>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <a href="https://ghotimarket.com/product/${p.id}" class="product-card">
            <img src="${p.thumbnail || (p.images && p.images[0]) || 'https://via.placeholder.com/200'}" alt="${p.title || p.name}" loading="lazy">
            <div class="product-title">${p.title || p.name}</div>
            <div class="product-price">৳ ${p.price || 0}</div>
        </a>
    `).join('');
}

// -------------------------------------------------------------------
// HIGH-PERFORMANCE CLIENT-SIDE SEARCH SYSTEM (ZERO CLOUD FUNCTIONS)
// -------------------------------------------------------------------

// Utility: Debounce Handler
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function setupSearch() {
    const input = document.getElementById("smartSearch");
    const resultsContainer = document.getElementById("search-results");

    if (!input || !resultsContainer) return;

    // Search Engine State
    const searchCache = new Map();
    let currentSearchId = 0;

    // Core Search Execution Logic
    async function performSearch(rawQuery) {
        const queryText = rawQuery.trim().toLowerCase();

        // 1. Min Character Filter
        if (queryText.length < 2) {
            resultsContainer.style.display = "none";
            resultsContainer.innerHTML = "";
            return;
        }

        // 2. Check Memory Cache
        if (searchCache.has(queryText)) {
            const cached = searchCache.get(queryText);
            renderSearchResults(cached.categories, cached.products, resultsContainer);
            return;
        }

        // 3. UI Loading State
        resultsContainer.style.display = "block";
        resultsContainer.innerHTML = `
            <div style="padding:15px;text-align:center;color:#64748b;font-size:13px;">
                পণ্য খোঁজা হচ্ছে...
            </div>`;

        const searchId = ++currentSearchId;

        try {
            // Local Category Filter (From pre-loaded categories)
            const matchedCategories = allCategories.filter(c => 
                c.name && c.name.toLowerCase().includes(queryText)
            ).slice(0, 2);

            // Generate search token to query Firestore
            const tokens = queryText.split(/\s+/);
            const primaryToken = tokens[0]; // First word token

            // Indexed Firestore Query - Strict Limit of 10 Read Operations
            const searchQuery = query(
                collection(db, "products"),
                where("active", "==", true),
                where("searchTokens", "array-contains", primaryToken),
                limit(10)
            );

            const querySnapshot = await getDocs(searchQuery);
            
            // Abort if another request was triggered
            if (searchId !== currentSearchId) return;

            let matchedProducts = [];
            
            querySnapshot.forEach(docSnap => {
                const product = { id: docSnap.id, ...docSnap.data() };
                
                // If user typed multi-word search (e.g., "black shirt"), verify secondary tokens client-side
                if (tokens.length > 1) {
                    const fullText = `${product.name} ${product.description} ${product.shopName}`.toLowerCase();
                    const matchAll = tokens.every(token => fullText.includes(token));
                    if (matchAll) matchedProducts.push(product);
                } else {
                    matchedProducts.push(product);
                }
            });

            // Limit Results
            matchedProducts = matchedProducts.slice(0, 8);

            // Cache Results
            searchCache.set(queryText, {
                categories: matchedCategories,
                products: matchedProducts
            });

            // Render Output
            renderSearchResults(matchedCategories, matchedProducts, resultsContainer);

        } catch (error) {
            if (searchId !== currentSearchId) return;
            console.error("Firestore Search Error:", error);
            resultsContainer.innerHTML = `
                <div style="padding:15px;text-align:center;color:#ef4444;font-size:13px;">
                    সার্চ করতে সমস্যা হয়েছে। দয়া করে নেটওয়ার্ক চেক করুন।
                </div>`;
        }
    }

    // Debounce Search Execution (300ms)
    const debouncedSearch = debounce((q) => performSearch(q), 300);

    input.addEventListener("input", (e) => {
        debouncedSearch(e.target.value);
    });

    // Close Dropdown when Clicking Outside
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = "none";
        }
    });

    input.addEventListener("focus", () => {
        if (input.value.trim().length >= 2) {
            performSearch(input.value);
        }
    });
}

// Compatible Render Search Results Function
function renderSearchResults(categories, products, container) {
    if ((!categories || categories.length === 0) && (!products || products.length === 0)) {
        container.innerHTML = `
            <div style="padding:15px;text-align:center;color:#94a3b8;font-size:13px;">
                কোনো ফলাফল পাওয়া যায়নি
            </div>`;
        container.style.display = "block";
        return;
    }

    let html = "";

    // Render Category Items
    if (categories && categories.length > 0) {
        categories.forEach(c => {
            html += `
                <a href="https://ghotimarket.com/category/${c.slug || c.id}" class="search-result-item">
                    <img src="${c.icon || c.image || 'https://i.ibb.co.com/RG2hrf3y/background-remove-ghoti-market.png'}" alt="${c.name}">
                    <div>
                        <div class="search-result-title">${c.name}</div>
                        <div class="search-result-type">ক্যাটাগরি</div>
                    </div>
                </a>
            `;
        });
    }

    // Render Product Items
    if (products && products.length > 0) {
        products.forEach(p => {
            const title = p.title || p.name || 'পণ্য';
            const price = p.price ? `৳ ${p.price}` : '';
            const thumb = p.thumbnail || (p.images && p.images[0]) || 'https://via.placeholder.com/40';

            html += `
                <a href="https://ghotimarket.com/product/${p.id}" class="search-result-item">
                    <img src="${thumb}" alt="${title}" loading="lazy">
                    <div>
                        <div class="search-result-title">${title}</div>
                        <div class="search-result-type">${price} • পণ্য</div>
                    </div>
                </a>
            `;
        });
    }

    container.innerHTML = html;
    container.style.display = "block";
}
