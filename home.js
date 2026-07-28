// Import Firebase v10 Modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/*
  ===================================================================
  SECURITY ADVICE & BEST PRACTICES:
  Frontend-এ শুধুমাত্র Firebase Web API Keys (apiKey, appId, messagingSenderId ইত্যাদি) রাখা সম্পূর্ণ নিরাপদ, কারণ এগুলো পাবলিকলি এক্সপোজড হওয়ার জন্যই ডিজাইন করা হয়েছে। 
  তবে আপনার Firestore Database ও Storage এর ডেটা সুরক্ষার জন্য সর্বদা Firebase Console থেকে Strict Security Rules (Firestore Rules / Storage Rules) কনফিগার করে রাখুন যাতে unauthorised কেউ ডাটা রিড বা রাইট করতে না পারে।
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

// Global State Variables
let allShops = [];
let allCategories = [];
let allProducts = [];
let currentIndex = 0;
const perPage = 20;

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
 * Main Data Loading Function using Promise.all()
 * Fetches banners, categories, products, and users concurrently.
 */
async function loadData() {
    updateProgress(25);
    try {
        // Optimized Firestore Queries with Promise.all()
        const [bannerSnap, catSnap, prodSnap, shopSnap] = await Promise.all([
            getDocs(query(collection(db, "banners"), orderBy("createdAt", "desc"))),
            getDocs(query(collection(db, "categories"), limit(20))),
            getDocs(query(collection(db, "products"), orderBy("createdAt", "desc"), limit(10))),
            getDocs(query(collection(db, "users"), limit(20)))
        ]);

        updateProgress(60);

        // 1. Render Banners
        renderBanner(bannerSnap);

        // 2. Render Categories (Exact Firestore Order, Limit 20, No Random Shuffle)
        renderCategories(catSnap);

        updateProgress(80);

        // 3. Render Latest Products (Condition: active !== false, with Discount calculation)
        renderProducts(prodSnap);

        // 4. Render Shops (Filtered where shopName exists)
        renderShopsData(shopSnap);

        updateProgress(100);

        // Smoothly Remove Loader
        setTimeout(() => {
            const loader = document.getElementById('loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 600);
            }
            handleScrollAnim();
            initSearch();
        }, 400);

    } catch (err) {
        console.error("Firebase Optimization Error:", err);
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';
    }
}

/**
 * Render Banner Section
 */
function renderBanner(bannerSnap) {
    const bannerWrapper = document.getElementById('banner-wrapper');
    if (!bannerWrapper) return;

    bannerWrapper.innerHTML = bannerSnap.docs.map(d => {
        const banner = d.data();
        return `
        <div class="swiper-slide">
            <a href="${banner.link || '#'}" ${banner.link ? 'target="_blank"' : ''} style="display:block;width:100%;height:100%;">
                <img src="${banner.url || 'https://via.placeholder.com/981x363'}" alt="Banner" loading="lazy">
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
 * Render Categories Section (Strictly following Firestore order, max 20)
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
 * Render Latest Products Section (Handling active status, discount percentages & placeholders)
 */
function renderProducts(prodSnap) {
    const productBox = document.getElementById("latest-products");
    if (!productBox) return;

    allProducts = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(product => {
        if (product.active === false) return false;
        return true;
    });

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
 * Setup and Store Shops Data for Pagination
 */
function renderShopsData(shopSnap) {
    allShops = shopSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.shopName);
    renderShops();
}

/**
 * Render Shops Function with Pagination Support
 */
window.renderShops = function() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;

    if (currentIndex === 0) grid.innerHTML = '';

    const batch = allShops.slice(currentIndex, currentIndex + perPage);
    if (!batch.length && currentIndex === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#64748b;">কোনো শপ পাওয়া যায়নি</p>`;
        return;
    }

    grid.innerHTML += batch.map(s => {
        const shopBanner = s.shopBanner || 'https://via.placeholder.com/400x120';
        const shopLogo = s.shopLogo || 'https://via.placeholder.com/80';
        const shopName = s.shopName || 'Shop';
        const shopCategory = s.category || 'Verified Seller';
        const shopLink = s.username ? `https://ghotimarket.com/seller?@${encodeURIComponent(s.username)}` : `https://ghotimarket.com/profile?sellerId=${s.id}`;

        return `
        <a href="${shopLink}" class="shop-card fade-up">
            <div class="shop-banner"><img src="${shopBanner}" alt="Shop Banner" loading="lazy"></div>
            <div class="shop-info">
                <div class="shop-logo"><img src="${shopLogo}" alt="Shop Logo" loading="lazy"></div>
                <div class="shop-name">${shopName} ${s.verified ? '<i class="fa-solid fa-circle-check verified-badge"></i>' : ''}</div>
                <div class="shop-cat">${shopCategory}</div>
            </div>
        </a>
        `;
    }).join('');

    currentIndex += perPage;
    const loadMoreBtn = document.getElementById('load-more-shops');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = currentIndex >= allShops.length ? 'none' : 'inline-flex';
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    handleScrollAnim();
};

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
 * Smart Search Implementation (Safely handling undefined attributes & missing images)
 */
function initSearch() {
    const searchInput = document.getElementById('smartSearch');
    const resultsBox = document.getElementById('search-results');
    if (!searchInput || !resultsBox) return;

    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase().trim();
        if (val.length < 2) {
            resultsBox.style.display = 'none';
            return;
        }

        const matchCats = allCategories.filter(c => c.categoryName && c.categoryName.toLowerCase().includes(val)).slice(0, 3);
        const matchShops = allShops.filter(s => s.shopName && s.shopName.toLowerCase().includes(val)).slice(0, 5);
        const matchProds = allProducts.filter(p => {

    const name = p.name ? p.name.toLowerCase() : "";

    const description = p.description 
        ? p.description.toLowerCase() 
        : "";

    const keywords = Array.isArray(p.keywords)
        ? p.keywords.join(" ").toLowerCase()
        : "";

    return (
        name.includes(val) ||
        description.includes(val) ||
        keywords.includes(val)
    );

}).slice(0, 5);

        let html = '';

        if (matchCats.length) {
            html += `<div class="search-group-title">ক্যাটাগরি</div>` + matchCats.map(c => `
                <a href="https://ghotimarket.com/category.html?slug=${c.slug || '#'}" class="search-item">
                    <img src="${c.image || 'https://via.placeholder.com/40'}" alt="Cat" loading="lazy"> 
                    <span>${c.categoryName || ''}</span>
                </a>
            `).join('');
        }

        if (matchShops.length) {
            html += `<div class="search-group-title">শপ সমূহ</div>` + matchShops.map(s => `
                <a href="${s.username ? `https://ghotimarket.com/seller?@${encodeURIComponent(s.username)}` : `https://ghotimarket.com/profile?sellerId=${s.id}`}" class="search-item">
                    <img src="${s.shopLogo || 'https://via.placeholder.com/40'}" alt="Shop" loading="lazy"> 
                    <span>${s.shopName || ''}</span>
                </a>
            `).join('');
        }

        if (matchProds.length) {
            html += `<div class="search-group-title">পণ্য</div>` + matchProds.map(p => `
               <a href="https://ghotimarket.com/product?${p.slug || p.id}" class="search-item">
                    <img src="${p.images?.[0] || 'https://via.placeholder.com/40'}" alt="Product" loading="lazy"> 
                    <span>${p.name || ''}</span>
                </a>
            `).join('');
        }

        resultsBox.innerHTML = html || '<p style="text-align:center; padding:10px; color:#94a3b8">কিছু পাওয়া যায়নি</p>';
        resultsBox.style.display = 'block';
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
