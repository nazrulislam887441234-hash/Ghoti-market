import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
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

// Data Storage
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

// Fetch Banners, Categories & Products (No Users / Shops query)
async function loadData() {
    try {
        // 1. Fetch Banners
        const bannerSnap = await getDocs(collection(db, "banners"));
        const banners = [];
        bannerSnap.forEach(doc => banners.push(doc.data()));
        renderBanners(banners);
        updateProgress(50);

        // 2. Fetch Categories
        const catSnap = await getDocs(collection(db, "categories"));
        allCategories = [];
        catSnap.forEach(doc => {
            allCategories.push({ id: doc.id, ...doc.data() });
        });
        renderCategories(allCategories);
        updateProgress(75);

        // 3. Fetch Products
        const prodQuery = query(collection(db, "products"), limit(12));
        const prodSnap = await getDocs(prodQuery);
        allProducts = [];
        prodSnap.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        renderProducts(allProducts);

    } catch (error) {
        console.error("Error loading homepage data:", error);
    }
}

// Render Banners Slider
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

// Render Categories Grid
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

// Render Products Grid
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

// Search System (Only Products & Categories, Shops disabled)
function setupSearch() {
    const input = document.getElementById("smartSearch");
    const resultsContainer = document.getElementById("search-results");

    if (!input || !resultsContainer) return;

    input.addEventListener("input", (e) => {
        const queryText = e.target.value.trim().toLowerCase();
        
        if (queryText.length < 2) {
            resultsContainer.style.display = "none";
            resultsContainer.innerHTML = "";
            return;
        }

        // Filter Categories
        const matchedCategories = allCategories.filter(c => 
            (c.name && c.name.toLowerCase().includes(queryText))
        ).slice(0, 3);

        // Filter Products
        const matchedProducts = allProducts.filter(p => 
            (p.title && p.title.toLowerCase().includes(queryText)) ||
            (p.name && p.name.toLowerCase().includes(queryText)) ||
            (p.category && p.category.toLowerCase().includes(queryText))
        ).slice(0, 6);

        renderSearchResults(matchedCategories, matchedProducts, resultsContainer);
    });

    // Close search dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.style.display = "none";
        }
    });
}

function renderSearchResults(categories, products, container) {
    if (categories.length === 0 && products.length === 0) {
        container.innerHTML = `<div style="padding:15px;text-align:center;color:#94a3b8;font-size:13px;">কোনো ফলাফল পাওয়া যায়নি</div>`;
        container.style.display = "block";
        return;
    }

    let html = "";

    // Categories Result List
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

    // Products Result List
    products.forEach(p => {
        html += `
            <a href="https://ghotimarket.com/product/${p.id}" class="search-result-item">
                <img src="${p.thumbnail || (p.images && p.images[0]) || 'https://via.placeholder.com/40'}" alt="${p.title || p.name}">
                <div>
                    <div class="search-result-title">${p.title || p.name}</div>
                    <div class="search-result-type">৳ ${p.price || 0} • পণ্য</div>
                </div>
            </a>
        `;
    });

    container.innerHTML = html;
    container.style.display = "block";
}
