
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, limit, getDocs, doc, getDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
  apiKey: "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE",
  authDomain: "ghotimarket.firebaseapp.com",
  databaseURL: "https://ghotimarket-default-rtdb.firebaseio.com",
  projectId: "ghotimarket",
  storageBucket: "ghotimarket.firebasestorage.app",
  messagingSenderId: "481257644093",
  appId: "1:481257644093:web:0dfc3699d6b3c86afeca54",
  measurementId: "G-4SR8V2EKC1"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== CONSTANTS & PLACEHOLDERS =====
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x350?text=No+Image';

// ===== GLOBAL STATE & CACHE =====
let currentSlug = null;
let currentProductCache = null;
let isLoading = false;
const userCache = new Map();
const productCache = new Map();

// ===== DOM ELEMENT CACHE HELPERS =====
const getEl = (id) => document.getElementById(id);

// ===== UTILITY FUNCTIONS =====
const safeText = (val, def = '') => val ?? def;
const safeNumber = (val, def = 0) => Number(val) || def;
const hideElement = (el) => { if (el) el.style.display = 'none'; };
const showElement = (el, displayType = 'inline-block') => { if (el) el.style.display = displayType; };

// ===== UNIVERSAL POPUP SYSTEM =====
/**
 * Shows a universal popup with custom title, message, and type.
 * Types: success, error, warning, info
 */
export const showPopup = ({ title = "সতর্কতা", message = "", type = "info" }) => {
    try {
        const popupEl = getEl("universalPopup");
        const titleEl = getEl("popupTitle");
        const msgEl = getEl("popupMessage");
        const iconEl = getEl("popupIcon");

        if (!popupEl || !titleEl || !msgEl || !iconEl) return;

        titleEl.innerText = title;
        msgEl.innerText = message;

        // Configure icons and accents based on type
        iconEl.className = "fas";
        switch (type) {
            case "success":
                iconEl.classList.add("fa-check-circle");
                iconEl.style.color = "var(--success)";
                break;
            case "error":
                iconEl.classList.add("fa-triangle-exclamation");
                iconEl.style.color = "var(--primary)";
                break;
            case "warning":
                iconEl.classList.add("fa-exclamation-circle");
                iconEl.style.color = "var(--warning)";
                break;
            case "info":
            default:
                iconEl.classList.add("fa-info-circle");
                iconEl.style.color = "var(--accent)";
                break;
        }

        popupEl.classList.add("show");

    } catch (err) {
        console.error("Popup Rendering Error:", err);
    }
};

const closeUniversalPopup = () => {
    const popupEl = getEl("universalPopup");
    if (popupEl) popupEl.classList.remove("show");
};

// ===== VERIFIED CHECK FUNCTION =====
const isVerifiedUser = (user) => {
    if (!user) return false;
    const val = user.verified;

    // Reject explicit falsy or negative values
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
        return false;
    }

    // Accept true, numbers like 1, or approved string tokens
    if (val === true || val === 1) return true;

    if (typeof val === "string") {
        const lowerVal = val.trim().toLowerCase();
        const validTokens = ["true", "1", "yes", "verified"];
        return validTokens.includes(lowerVal);
    }

    return Boolean(val);
};

// ===== USERNAME VALIDATION HELPER =====
const getValidUsername = (usernameInput) => {
    if (usernameInput === null || usernameInput === undefined) return null;
    let value = String(usernameInput).trim();
    if (value === "" || value === "null" || value === "undefined" || value === "false") return null;

    // Strip leading @ character if present
    value = value.replace(/^@+/, "").trim();
    if (value === "") return null;

    return encodeURIComponent(value);
};

// ===== SELLER LINK UPDATER FUNCTION =====
function updateSellerLink(sellerId, sellerData = null) {
    const cleanSellerId = sellerId ? String(sellerId).trim() : null;
    const validUsername = sellerData ? getValidUsername(sellerData.username) : null;

    let targetUrl = null;

    // 1. Priority: Valid Username
    if (validUsername) {
        targetUrl = `https://ghotimarket.com/seller?@${validUsername}`;
    } 
    // 2. Fallback: Valid Seller ID
    else if (cleanSellerId && cleanSellerId !== "") {
        targetUrl = `https://ghotimarket.com/profile?sellerId=${encodeURIComponent(cleanSellerId)}`;
    }

    const shopLink = getEl("pShopLink");
    const links = document.querySelectorAll('a.seller-profile-link, [data-seller-profile-url], .shop-name-area a');

    if (targetUrl) {
        if (shopLink) {
            shopLink.setAttribute('href', targetUrl);
            shopLink.style.pointerEvents = 'auto';
            shopLink.style.opacity = '1';
            shopLink.style.cursor = 'pointer';
        }
        links.forEach(link => {
            link.setAttribute('href', targetUrl);
            link.style.pointerEvents = 'auto';
            link.style.opacity = '1';
            link.style.cursor = 'pointer';
        });
    } else {
        // Disabled only when neither valid username nor sellerId exists
        if (shopLink) {
            shopLink.removeAttribute('href');
            shopLink.style.pointerEvents = 'none';
            shopLink.style.opacity = '0.5';
            shopLink.style.cursor = 'default';
        }
        links.forEach(link => {
            link.removeAttribute('href');
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.5';
            link.style.cursor = 'default';
        });
    }

    return targetUrl;
}

// ===== GET SLUG FROM URL =====
const getSlugFromURL = () => {
    try {
        const pathname = window.location.pathname;
        const search = window.location.search;

        // Guard: Never extract slugs if we are explicitly on another core page
        if (pathname.includes('seller') || pathname.includes('profile') || pathname.includes('order') || pathname.includes('contact') || pathname.includes('privacy') || pathname.includes('categories') || pathname.includes('all-product')) {
            console.debug("Navigation Guard: Skipped slug extraction for non-product path ->", pathname);
            return null;
        }

        const urlParams = new URLSearchParams(search);
        let slug = urlParams.get("product-slug");
        if (slug) return decodeURIComponent(slug.trim());

        for (const [key, value] of urlParams.entries()) {
            if (key !== 'fbclid' && key !== 'utm_source' && key !== 'utm_medium' && value === '') {
                return decodeURIComponent(key.trim());
            }
        }

        if (search.startsWith('?') && search.length > 1) {
            const raw = search.substring(1).split('&')[0];
            if (raw && !raw.includes('=') && !raw.startsWith('fbclid')) {
                return decodeURIComponent(raw.trim());
            }
        }

        const pathParts = pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'product.html' && lastPart !== '' && !lastPart.includes('.')) {
            return decodeURIComponent(lastPart);
        }
        if (window.location.hash) return decodeURIComponent(window.location.hash.substring(1));

        return null;
    } catch (err) {
        console.error("URL Parsing Error:", err);
        return null;
    }
};

// ===== SHARE POPUP HANDLERS =====
const openSharePopup = () => {
    const sharePopup = getEl("sharePopup");
    if (sharePopup) sharePopup.classList.add("show");
};

const closeSharePopup = () => {
    const sharePopup = getEl("sharePopup");
    if (sharePopup) sharePopup.classList.remove("show");
};

const shareNow = async () => {
    if (!currentProductCache) {
        showPopup({ title: "শেয়ার ব্যর্থ", message: "শেয়ার করার মতো কোনো পণ্য পাওয়া যায়নি।", type: "warning" });
        return;
    }

    const shareText = `🛒 ${safeText(currentProductCache.name)}\n\n💰 ৳${safeNumber(currentProductCache.price)}\n\n📝 ${safeText(currentProductCache.description).substring(0, 100)}...`;

    try {
        if (navigator.share) {
            await navigator.share({
                title: safeText(currentProductCache.name),
                text: shareText,
                url: window.location.href
            });
        } else {
            await copyLinkToClipboard();
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            showPopup({ title: "শেয়ার ব্যর্থ", message: "লিংক শেয়ার করা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।", type: "error" });
        }
    } finally {
        closeSharePopup();
    }
};

const copyLinkToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        const copyPopup = getEl("copyPopup");
        if (copyPopup) {
            copyPopup.classList.add("show");
        } else {
            showPopup({ title: "সফল হয়েছে", message: "পণ্যের লিংক সফলভাবে কপি হয়েছে।", type: "success" });
        }
    } catch (error) {
        showPopup({ title: "ক্লিপবোর্ড ব্যর্থ", message: "ক্লিপবোর্ডে লিংক কপি করা সম্ভব হয়নি।", type: "error" });
    } finally {
        closeSharePopup();
    }
};

// ===== LOAD PRODUCT BY SLUG =====
const loadProductBySlug = async (slug, push = true) => {
    if (!slug || isLoading) return;
    slug = slug.trim();
    isLoading = true;

    showElement(getEl("loader"), "block");
    hideElement(getEl("mainContent"));

    try {
        let productData = productCache.get(slug);

        if (!productData) {
            const q = query(collection(db, "products"), where("slug", "==", slug), limit(1));
            const snap = await getDocs(q);

            if (snap.empty) {
                showPopup({ title: "পাওয়া যায়নি", message: "কাঙ্ক্ষিত পণ্যটি খুঁজে পাওয়া যায়নি।", type: "warning" });
                await loadRelatedProducts(null, null, true);
                hideElement(getEl("loader"));
                showElement(getEl("mainContent"), "block");
                isLoading = false;
                return;
            }

            const productDoc = snap.docs[0];
            productData = productDoc.data();
            productData.docId = productDoc.id;
            productCache.set(slug, productData);
        }

        currentSlug = slug;
        currentProductCache = productData;

        if (push) {
            const newUrl = `product.html?product-slug=${encodeURIComponent(slug)}`;
            history.pushState({ slug }, '', newUrl);
        }

        renderProduct(productData);
        await loadRelatedProducts(productData.docId, productData.categorySlug, false);

    } catch (error) {
        console.error("Product Load Error:", error);
        showPopup({
            title: "নেটওয়ার্ক ত্রুটি",
            message: "সার্ভার থেকে পণ্য লোড করার সময় সমস্যা হয়েছে। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করুন।",
            type: "error"
        });
    } finally {
        hideElement(getEl("loader"));
        showElement(getEl("mainContent"), "block");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        isLoading = false;
    }
};

// ===== RENDER PRODUCT =====
const renderProduct = (p) => {
    const name = safeText(p.name, 'Product');
    const desc = safeText(p.description, 'GHOTI MARKET Product');
    const images = Array.isArray(p.images) ? p.images : [];
    const img = images[0] || PLACEHOLDER_IMAGE;
    const price = safeNumber(p.price);

    // Update Meta and Canonical Tags
    document.title = `${name} - ৳${price} | GHOTI MARKET`;
    setMetaTag('meta[name="description"]', desc.substring(0, 160));
    setMetaTag('meta[property="og:title"]', name);
    setMetaTag('meta[property="og:description"]', desc.substring(0, 160));
    setMetaTag('meta[property="og:image"]', img);
    setMetaTag('meta[property="og:url"]', window.location.href);

    const canonicalEl = document.querySelector('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.setAttribute('href', window.location.href);

    getEl("pName").innerText = name;
    getEl("pPrice").innerText = `৳ ${price}`;
    const descriptionEl = getEl("pDesc");

if (descriptionEl) {
    const markdownHTML = marked.parse(desc || 'কোন বিবরণ নেই');

    descriptionEl.innerHTML = DOMPurify.sanitize(markdownHTML);
}

    const oldPrice = safeNumber(p.oldPrice);
    const oldPriceEl = getEl("oldPrice");
    const discountBadgeEl = getEl("discountBadge");

    if (oldPrice > price) {
        oldPriceEl.innerText = `৳ ${oldPrice}`;
        showElement(oldPriceEl, 'inline');
        const save = oldPrice - price;
        const percent = Math.round((save / oldPrice) * 100);
        discountBadgeEl.innerText = `-${percent}%`;
        showElement(discountBadgeEl, 'inline-block');
    } else {
        hideElement(oldPriceEl);
        hideElement(discountBadgeEl);
    }

    const sellerId = safeText(p.sellerId).trim();
    const logoImg = getEl("pShopLogoImg");
    const verifiedBadge = getEl("verifiedBadge");
    const shopNameEl = getEl("pShopName");

    if (shopNameEl) {
        shopNameEl.innerText = safeText(p.shopName, "Unknown Shop");
    }

    hideElement(logoImg);
    hideElement(verifiedBadge);

    // Immediate fallback seller link initialization using sellerId (non-blocking)
    if (sellerId) {
        updateSellerLink(sellerId, null);

        if (userCache.has(sellerId)) {
            const cachedUser = userCache.get(sellerId);
            console.debug("Loaded Seller from Cache:", { sellerId, cachedUser });

            if (!p.shopName && cachedUser.shopName && shopNameEl) {
                shopNameEl.innerText = cachedUser.shopName;
            }

            updateSellerLink(sellerId, cachedUser);

            if (cachedUser.shopLogo) {
                logoImg.src = cachedUser.shopLogo;
                logoImg.onerror = () => hideElement(logoImg);
                showElement(logoImg, 'inline-block');
            } else {
                hideElement(logoImg);
            }

            if (isVerifiedUser(cachedUser)) {
                showElement(verifiedBadge, 'inline-flex');
            } else {
                hideElement(verifiedBadge);
            }

        } else {
            getDoc(doc(db, "users", sellerId)).then(userSnap => {
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    userCache.set(sellerId, userData);
                    console.debug("Loaded Seller from Firestore:", { sellerId, userData });

                    if (!p.shopName && userData.shopName && shopNameEl) {
                        shopNameEl.innerText = userData.shopName;
                    }

                    updateSellerLink(sellerId, userData);

                    if (userData.shopLogo) {
                        logoImg.src = userData.shopLogo;
                        logoImg.onerror = () => hideElement(logoImg);
                        showElement(logoImg, 'inline-block');
                    } else {
                        hideElement(logoImg);
                    }

                    if (isVerifiedUser(userData)) {
                        showElement(verifiedBadge, 'inline-flex');
                    } else {
                        hideElement(verifiedBadge);
                    }

                } else {
                    console.warn("Seller Profile Document Missing for ID:", sellerId);
                    updateSellerLink(sellerId, null);
                }
            }).catch(err => {
                console.error("Seller Profile Load Error:", err);
                updateSellerLink(sellerId, null);
            });
        }
    } else {
        console.warn("Seller ID is missing or empty.");
        updateSellerLink(null, null);
    }

    const slider = getEl("imgSlider");
    if (images.length > 0) {
        slider.innerHTML = images.map(iUrl => `<img src="${iUrl}" alt="${name}" onerror="this.src='${PLACEHOLDER_IMAGE}'">`).join("");
        getEl("imgCounter").innerText = `ছবি ${images.length} টি`;
    } else {
        slider.innerHTML = `<img src="${PLACEHOLDER_IMAGE}" alt="No Image">`;
        getEl("imgCounter").innerText = `ছবি 0 টি`;
    }

    const orderBtn = getEl("orderNowBtn");
    if (p.slug) {
        orderBtn.href = `order.html?product-slug=${encodeURIComponent(p.slug)}`;
        orderBtn.classList.remove('disabled');
    } else {
        orderBtn.href = '#';
        orderBtn.classList.add('disabled');
    }
};

const setMetaTag = (selector, content) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
};

// ===== RELATED PRODUCTS =====
const loadRelatedProducts = async (currentId, categorySlug, isFallback) => {
    try {
        let q;
        const relatedTitleEl = getEl("relatedTitle");

        if (categorySlug && !isFallback) {
            q = query(collection(db, "products"), where("categorySlug", "==", categorySlug), orderBy("createdAt", "desc"), limit(10));
            relatedTitleEl.innerText = "একই ক্যাটাগরির পণ্য";
        } else {
            q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(10));
            relatedTitleEl.innerText = "সর্বশেষ পণ্য";
        }

        const snap = await getDocs(q);
        const grid = getEl("relatedProducts");
        grid.innerHTML = "";

        snap.forEach(productDoc => {
            if (productDoc.id === currentId) return;
            const item = productDoc.data();
            if (!item.slug) return;

            const itemPrice = safeNumber(item.price);
            const itemOldPrice = safeNumber(item.oldPrice);

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <img src="${item.images?.[0] || PLACEHOLDER_IMAGE}" alt="${safeText(item.name)}" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                <p>${safeText(item.name)}</p>
                <div class="price-box">
                    <span class="current-price">৳ ${itemPrice}</span>
                    ${itemOldPrice > itemPrice ? `<span class="old-price">৳ ${itemOldPrice}</span>` : ""}
                </div>
            `;

            card.addEventListener('click', () => {
                console.debug("Navigation Type: Related Product Card Clicked", item.slug);
                loadProductBySlug(item.slug, true);
            });

            grid.appendChild(card);
        });
    } catch (error) {
        console.error("Related Products Error:", error);
    }
};

// ===== EVENT LISTENERS & INITIALIZATION =====
window.addEventListener('popstate', (event) => {
    console.debug("Navigation Type: Browser Popstate Triggered");
    const slug = event.state?.slug || getSlugFromURL();
    if (slug) {
        loadProductBySlug(slug, false);
    } else {
        const currentUrlSlug = getSlugFromURL();
        if (currentUrlSlug) {
            loadProductBySlug(currentUrlSlug, false);
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Button Event Bindings
    getEl("backNavBtn")?.addEventListener('click', () => {
        console.debug("Navigation Type: Browser Back Button");
        history.back();
    });
    getEl("shareBtnTrig")?.addEventListener('click', openSharePopup);
    getEl("shareNowBtn")?.addEventListener('click', shareNow);
    getEl("copyLinkBtn")?.addEventListener('click', copyLinkToClipboard);
    getEl("closeSharePopupBtn")?.addEventListener('click', closeSharePopup);
    getEl("popupCloseBtn")?.addEventListener('click', closeUniversalPopup);

    // Global Link Interception Guard (Strictly targets and handles local SPA vs standard external pages)
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;

        console.debug("Click Target Checked:", { href, text: anchor.innerText });

        // Identify non-product URLs that must use standard browser navigation
        const isExternalOrNonProduct =
            href.includes('seller') ||
            href.includes('profile') ||
            href.includes('order') ||
            href.includes('contact') ||
            href.includes('privacy') ||
            href.includes('categories') ||
            href.includes('all-product') ||
            href.includes('://');

        if (isExternalOrNonProduct) {
            console.debug("Navigation Type: Standard Browser Navigation Allowed for Non-Product Link ->", href);
            return; // Let standard browser navigation handle it natively without interference
        }

        // Handle internal SPA product links cleanly if any exist
        if (href.includes('product.html') || (!href.includes('/') && !href.includes('.'))) {
            let targetSlug = null;
            if (href.includes('product-slug=')) {
                const urlParams = new URLSearchParams(href.split('?')[1]);
                targetSlug = urlParams.get('product-slug');
            } else if (!href.includes('.')) {
                targetSlug = href;
            }

            if (targetSlug) {
                e.preventDefault();
                console.debug("Navigation Type: SPA Internal Product Link Intercepted ->", targetSlug);
                loadProductBySlug(targetSlug, true);
            }
        }
    });

    // Initial Load based on URL
    const slug = getSlugFromURL();
    if (slug) {
        console.debug("Navigation Type: Initial Load via Slug ->", slug);
        loadProductBySlug(slug, false);
    } else {
        console.warn("Navigation Type: No slug detected on product page load.");
        showPopup({ title: "সতর্কতা", message: "কোনো বৈধ প্রোডাক্ট লিংক পাওয়া যায়নি।", type: "warning" });
        loadRelatedProducts(null, null, true);
        hideElement(getEl("loader"));
        showElement(getEl("mainContent"), "block");
    }

    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
