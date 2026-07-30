// Import Firebase SDKs (v10 Modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    limit, 
    getDocs, 
    startAfter 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration (Same as home.js)
const firebaseConfig = {
    apiKey: "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE",
    authDomain: "ghotimarket.firebaseapp.com",
    projectId: "ghotimarket",
    storageBucket: "ghotimarket.appspot.com",
    messagingSenderId: "9382019283",
    appId: "1:9382019283:web:abc12345"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Variables
let allLoadedShops = [];
let lastVisibleDoc = null;
const SHOPS_PER_PAGE = 50;
let isLoading = false;

// DOM Elements
const shopGrid = document.getElementById("shop-grid");
const loadMoreContainer = document.getElementById("load-more-container");
const loadMoreBtn = document.getElementById("load-more-btn");
const emptyShopMessage = document.getElementById("empty-shop-message");
const shopSearchInput = document.getElementById("shop-search-input");
const clearSearchBtn = document.getElementById("clear-search-btn");
const searchToggleBtn = document.getElementById("search-toggle-btn");
const headerSearchBar = document.getElementById("header-search-bar");
const progressBar = document.getElementById("progress-bar");
const backToTopBtn = document.getElementById("back-to-top");

// Initialize Page
document.addEventListener("DOMContentLoaded", () => {
    updateProgressBar(30);
    fetchInitialShops();
    setupEventListeners();
});

// Progress Bar Handler
function updateProgressBar(percent) {
    if (progressBar) {
        progressBar.style.width = percent + "%";
        if (percent >= 100) {
            setTimeout(() => {
                progressBar.style.opacity = "0";
            }, 300);
        }
    }
}

/**
 * Helper Function to Check Shop Visibility
 */
function isVisibleShop(shop) {
    const val = shop.verified;

    console.log("Shop:", shop.shopName);
    console.log("Verified:", shop.verified);
    console.log("Type:", typeof shop.verified);

    // Explicitly reject falsy or negative values
    if (
        val === false ||
        val === "false" ||
        val === "False" ||
        val === "FALSE" ||
        val === 0 ||
        val === "0" ||
        val === null ||
        val === undefined ||
        val === "" ||
        val === "no" ||
        val === "No" ||
        val === "NO"
    ) {
        console.log("Visible:", false);
        return false;
    }

    // Accept true, numbers like 1, or approved string tokens
    if (val === true || val === 1) {
        console.log("Visible:", true);
        return true;
    }

    if (typeof val === "string") {
        const lowerVal = val.trim().toLowerCase();
        const invalidTokens = ["false", "0", "no", "off", "inactive", "unverified"];
        const isVisible = !invalidTokens.includes(lowerVal) && lowerVal !== "";
        console.log("Visible:", isVisible);
        return isVisible;
    }

    const isVisible = Boolean(val);
    console.log("Visible:", isVisible);
    return isVisible;
}

// Fetch Initial 50 Shops
async function fetchInitialShops() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const shopsQuery = query(
            collection(db, "users"),
            where("shopName", "!=", null),
            orderBy("shopName"),
            orderBy("createdAt", "desc"),
            limit(SHOPS_PER_PAGE)
        );

        // Note: If compound queries require specific indexes, a fallback query sorting only by createdAt can be used:
        const fallbackQuery = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            limit(SHOPS_PER_PAGE)
        );

        let snapshot;
        try {
            snapshot = await getDocs(shopsQuery);
        } catch (err) {
            // Fallback if index is missing for compound query
            snapshot = await getDocs(fallbackQuery);
        }

        allLoadedShops = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(shop => shop.shopName && isVisibleShop(shop));

        if (snapshot.docs.length > 0) {
            lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
        }

        renderShops(allLoadedShops);

        // Show/Hide Load More Button
        if (snapshot.docs.length < SHOPS_PER_PAGE) {
            loadMoreContainer.style.display = "none";
        } else {
            loadMoreContainer.style.display = "block";
        }

    } catch (error) {
        console.error("Error fetching shops: ", error);
        shopGrid.innerHTML = `<div class="error-state"><p>শপ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।</p></div>`;
    } finally {
        isLoading = false;
        updateProgressBar(100);
    }
}

// Fetch Next Batch of Shops
async function fetchMoreShops() {
    if (isLoading || !lastVisibleDoc) return;
    isLoading = true;
    loadMoreBtn.innerHTML = `<span>লোড হচ্ছে...</span> <i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
        const nextQuery = query(
            collection(db, "users"),
            orderBy("createdAt", "desc"),
            startAfter(lastVisibleDoc),
            limit(SHOPS_PER_PAGE)
        );

        const snapshot = await getDocs(nextQuery);

        if (snapshot.docs.length > 0) {
            lastVisibleDoc = snapshot.docs[snapshot.docs.length - 1];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.shopName && isVisibleShop(data) && !allLoadedShops.some(s => s.id === doc.id)) {
                    allLoadedShops.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            renderShops(allLoadedShops);
        }

        if (snapshot.docs.length < SHOPS_PER_PAGE) {
            loadMoreContainer.style.display = "none";
        }
    } catch (error) {
        console.error("Error fetching more shops: ", error);
    } finally {
        isLoading = false;
        loadMoreBtn.innerHTML = `<span>আরো শপ দেখুন</span> <i class="fa-solid fa-chevron-down"></i>`;
    }
}

// Render Shops to DOM with Animation & Lazy Loading
function renderShops(shopsToRender) {
    shopGrid.innerHTML = "";

    const validShopsToRender = shopsToRender.filter(shop => shop.shopName && isVisibleShop(shop));

    if (validShopsToRender.length === 0) {
        emptyShopMessage.style.display = "block";
        return;
    } else {
        emptyShopMessage.style.display = "none";
    }

    validShopsToRender.forEach((shop, index) => {
        const shopUrl = shop.username 
            ? `https://ghotimarket.com/seller?@${shop.username}` 
            : `https://ghotimarket.com/profile?sellerId=${shop.id}`;

        const defaultBanner = "https://via.placeholder.com/400x160?text=Ghoti+Market+Shop";
        const defaultLogo = "https://via.placeholder.com/80x80?text=Logo";

        const cardHTML = `
            <a href="${shopUrl}" class="shop-card fade-up" style="animation-delay: ${index * 0.05}s">
                <div class="shop-banner-wrapper">
                    <img data-src="${shop.shopBanner || defaultBanner}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 160'%3E%3C/svg%3E" alt="${shop.shopName}" class="shop-banner lazy-image" />
                </div>
                <div class="shop-card-body">
                    <div class="shop-logo-wrapper">
                        <img data-src="${shop.shopLogo || defaultLogo}" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3C/svg%3E" alt="${shop.shopName}" class="shop-logo lazy-image" />
                    </div>
                    <div class="shop-info">
                        <h3 class="shop-name">
                            ${escapeHTML(shop.shopName)}
                            <span class="verified-badge" title="Verified Shop"><i class="fa-solid fa-circle-check"></i></span>
                        </h3>
                        <p class="shop-category">${escapeHTML(shop.category || "General Store")}</p>
                    </div>
                </div>
            </a>
        `;
        shopGrid.insertAdjacentHTML("beforeend", cardHTML);
    });

    initLazyLoading();
}

// Lazy Loading Implementation using Intersection Observer
function initLazyLoading() {
    const lazyImages = document.querySelectorAll(".lazy-image");
    
    if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.classList.add("loaded");
                    imageObserver.unobserve(image);
                }
            });
        });
        lazyImages.forEach(image => imageObserver.observe(image));
    } else {
        lazyImages.forEach(image => {
            image.src = image.dataset.src;
        });
    }
}

// Event Listeners & Interactions Setup
function setupEventListeners() {
    // Load More Click
    loadMoreBtn.addEventListener("click", fetchMoreShops);

    // Toggle Search Bar on Mobile Header
    searchToggleBtn.addEventListener("click", () => {
        headerSearchBar.classList.toggle("active");
        if (headerSearchBar.classList.contains("active")) {
            shopSearchInput.focus();
        }
    });

    // Search Filter Logic (Searches loaded shops)
    shopSearchInput.addEventListener("input", (e) => {
        const queryText = e.target.value.toLowerCase().trim();
        
        if (queryText.length > 0) {
            clearSearchBtn.style.display = "block";
        } else {
            clearSearchBtn.style.display = "none";
        }

        const filteredShops = allLoadedShops.filter(shop => 
            isVisibleShop(shop) && (
                shop.shopName.toLowerCase().includes(queryText) || 
                (shop.category && shop.category.toLowerCase().includes(queryText))
            )
        );

        renderShops(filteredShops);
    });

    // Clear Search Input
    clearSearchBtn.addEventListener("click", () => {
        shopSearchInput.value = "";
        clearSearchBtn.style.display = "none";
        renderShops(allLoadedShops);
    });

    // Back To Top Scroll Handler
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    });

    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

// Utility: Escape HTML to Prevent XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag)
    );
}
