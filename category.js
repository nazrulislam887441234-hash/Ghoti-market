import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getFirestore,
    collection,
    query,
    where,
    limit,
    startAfter,
    orderBy,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// --- Firebase Configuration ---
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
const auth = getAuth(app);


// ============================================================
// STATE VARIABLES
// ============================================================

let loadedProductsList = [];
let lastVisibleDoc = null;
let hasMore = true;
let isLoadingMore = false;
let isInitialLoad = true;
let productsInitialLoadFinished = false;


// ============================================================
// AUTH & STATE FLAGS
// ============================================================

let currentUser = null;
let authReady = false;
let userCartItems = [];


// ============================================================
// PRODUCT MAPS & DUPLICATE PROTECTORS
// ============================================================

const productMap = new Map();
const loadedProductIds = new Set();


// ============================================================
// VARIANT MODAL STATE
// ============================================================

let activeModalProduct = null;
let selectedVariantsState = {};


// ============================================================
// DOM ELEMENTS
// ============================================================

const productGrid = document.getElementById('product-grid');
const loadingGifContainer = document.getElementById('loading-gif-container');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const indexRequiredState = document.getElementById('index-required-state');
const retryBtn = document.getElementById('retry-btn');
const createIndexBtn = document.getElementById('create-index-btn');
const infiniteLoader = document.getElementById('infinite-loader');
const scrollSentinel = document.getElementById('scroll-sentinel');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('product-search');


// ============================================================
// MODAL ELEMENTS
// ============================================================

const modalOverlay = document.getElementById('variant-modal-overlay');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalProductImg = document.getElementById('modal-product-img');
const modalProductName = document.getElementById('modal-product-name');
const modalBasePriceVal = document.getElementById('modal-base-price-val');
const variantGroupsContainer = document.getElementById('variant-groups-container');
const modalWarning = document.getElementById('modal-warning');
const modalFinalPrice = document.getElementById('modal-final-price');
const modalCartBtn = document.getElementById('modal-cart-btn');
const modalBuynowBtn = document.getElementById('modal-buynow-btn');
const toast = document.getElementById('toast');


// ============================================================
// CENTRALIZED UI STATE MANAGEMENT
// ============================================================

function updateUIState() {

    if (
        !indexRequiredState.classList.contains('hidden') ||
        !errorState.classList.contains('hidden')
    ) {
        loadingGifContainer.classList.add('hidden');
        return;
    }

    if (loadedProductsList.length > 0) {

        loadingGifContainer.classList.add('hidden');
        emptyState.classList.add('hidden');
        productGrid.classList.remove('hidden');

        return;
    }

    if (!productsInitialLoadFinished) {

        loadingGifContainer.classList.remove('hidden');
        emptyState.classList.add('hidden');
        productGrid.classList.add('hidden');

        return;
    }

    loadingGifContainer.classList.add('hidden');

    if (loadedProductsList.length === 0) {

        emptyState.classList.remove('hidden');
        productGrid.classList.add('hidden');

    }
}


// ============================================================
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(auth, (user) => {

    currentUser = user;
    authReady = true;

    if (user) {

        fetchUserCart(user.uid);

    } else {

        userCartItems = [];
        updateAllCardButtons();

    }
});


// ============================================================
// WAIT FOR AUTH READY
// ============================================================

async function waitForAuthReady(timeout = 5000) {

    if (authReady) return currentUser;

    const start = Date.now();

    while (!authReady && Date.now() - start < timeout) {

        await new Promise(resolve => setTimeout(resolve, 50));

    }

    return currentUser;
}


// ============================================================
// FETCH USER CART
// ============================================================

async function fetchUserCart(uid) {

    try {

        const q = query(
            collection(db, "carts"),
            where("uid", "==", uid)
        );

        const querySnapshot = await getDocs(q);

        userCartItems = [];

        querySnapshot.forEach((docSnap) => {

            userCartItems.push({
                cartDocId: docSnap.id,
                ...docSnap.data()
            });

        });

        updateAllCardButtons();

    } catch (error) {

        console.error(
            "Error fetching cart from Firestore:",
            error
        );

    }
}


// ============================================================
// SLUG & TITLE
// ============================================================

const urlParams = new URLSearchParams(window.location.search);

const rawSlug = urlParams.get('slug');

const slug = rawSlug
    ? rawSlug.trim()
    : null;


if (!slug) {

    window.location.href = 'index.html';

}


function formatTitle(str) {

    if (!str) return 'ক্যাটাগরি';

    return str
        .split('-')
        .map(word =>
            word.charAt(0).toUpperCase() +
            word.slice(1).toLowerCase()
        )
        .join(' ');

}


pageTitle.innerText = formatTitle(slug);


// ============================================================
// XSS SECURITY ESCAPE
// ============================================================

function escapeHTML(str) {

    if (typeof str !== 'string') return '';

    return str.replace(/[&<>"']/g, function(match) {

        const map = {

            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'

        };

        return map[match];

    });

}


// ============================================================
// PRODUCT URL
// ============================================================

function getProductUrl(product) {

    if (product && product.slug) {

        return `https://ghotimarket.com/product?${encodeURIComponent(product.slug)}`;

    }

    return `https://ghotimarket.com/product?id=${encodeURIComponent(product.id || '')}`;

}


// ============================================================
// CHECK PRODUCT IN CART
// ============================================================

function isProductInCart(productId) {

    return userCartItems.some(
        item =>
            item.id === productId ||
            item.docId === productId
    );

}


// ============================================================
// EXTRACT FIREBASE INDEX URL
// ============================================================

function extractIndexUrl(errorMessage) {

    if (
        !errorMessage ||
        typeof errorMessage !== 'string'
    ) {
        return null;
    }

    const match = errorMessage.match(
        /https:\/\/console\.firebase\.google\.com[^\s]+/
    );

    return match ? match[0] : null;

}


// ============================================================
// CREATE PRODUCT CARD
// ============================================================

function createProductCard(product) {

    productMap.set(product.id, product);

    const safeName = escapeHTML(
        product.name || 'Unnamed Product'
    );

    const safeShopName = escapeHTML(
        product.shopName || 'Ghoti Shop'
    );

    const price = Number(product.price) || 0;

    const oldPrice = Number(product.oldPrice) || 0;

    const images = Array.isArray(product.images)
        ? product.images
        : [];

    const firstImg =
        images.length > 0 &&
        typeof images[0] === 'string'
            ? escapeHTML(images[0])
            : 'https://via.placeholder.com/300';

    const cardUrl = getProductUrl(product);

    const inCart = isProductInCart(product.id);


    let priceBoxHTML =
        `<span class="current-price">৳ ${price}</span>`;


    if (
        oldPrice > price &&
        oldPrice > 0 &&
        price >= 0
    ) {

        const discountPercent =
            Math.round(
                ((oldPrice - price) / oldPrice) * 100
            );

        const saveAmount =
            oldPrice - price;


        if (
            discountPercent > 0 &&
            discountPercent < 100
        ) {

            priceBoxHTML += `

                <span class="old-price">
                    ৳ ${oldPrice}
                </span>

                <span class="discount-badge">
                    ${discountPercent}% OFF
                </span>

                <div class="save-text">
                    Save ৳${saveAmount}
                </div>

            `;

        }

    }


    const card = document.createElement('div');

    card.className = 'product-card';


    card.innerHTML = `

        <a
            href="${cardUrl}"
            style="text-decoration:none;color:inherit;display:block;"
        >

            <img
                src="${firstImg}"
                class="product-img"
                alt="${safeName}"
                loading="lazy"
                decoding="async"
                onerror="this.onerror=null;this.src='https://via.placeholder.com/300?text=No+Image';"
            >

        </a>


        <div class="product-info">

            <a
                href="${cardUrl}"
                style="text-decoration:none;color:inherit;"
            >

                <h3 class="product-name">
                    ${safeName}
                </h3>

            </a>


            <div class="price-box">

                ${priceBoxHTML}

            </div>


            <p class="shop-name">

                <i
                    data-lucide="store"
                    style="width:12px;height:12px;"
                ></i>

                ${safeShopName}

            </p>


            <div class="card-buttons">

                <button
                    class="btn-action-cart ${inCart ? 'hidden' : ''}"
                    data-action="cart"
                    data-id="${product.id}"
                >
                    🛒 কার্টে যোগ করুন
                </button>


                <button
                    class="btn-action-buynow"
                    data-action="buynow"
                    data-id="${product.id}"
                >
                    ⚡ এখনই কিনুন
                </button>

            </div>

        </div>

    `;


    return card;

}


// ============================================================
// FAST BATCH PRODUCT LOADING
// CREATED AT DESC
// ============================================================

async function fetchProductsBatch() {

    if (
        isLoadingMore ||
        !hasMore
    ) {
        return;
    }


    isLoadingMore = true;


    if (!isInitialLoad) {

        infiniteLoader.classList.remove('hidden');

    }


    try {

        let q;


        // প্রতি batch-এ 10টি product
        const batchLimit = 10;


        // ====================================================
        // FIRST PAGE
        // ====================================================

        if (!lastVisibleDoc) {

            q = query(

                collection(db, "products"),

                where(
                    "categorySlug",
                    "==",
                    slug
                ),

                where(
                    "active",
                    "==",
                    true
                ),

                // নতুন product আগে
                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(batchLimit)

            );

        }


        // ====================================================
        // NEXT PAGE
        // ====================================================

        else {

            q = query(

                collection(db, "products"),

                where(
                    "categorySlug",
                    "==",
                    slug
                ),

                where(
                    "active",
                    "==",
                    true
                ),

                // একই sorting বজায় থাকবে
                orderBy(
                    "createdAt",
                    "desc"
                ),

                startAfter(lastVisibleDoc),

                limit(batchLimit)

            );

        }


        const querySnapshot =
            await getDocs(q);


        productsInitialLoadFinished = true;


        // ====================================================
        // NO MORE PRODUCTS
        // ====================================================

        if (querySnapshot.empty) {

            hasMore = false;

            infiniteLoader.classList.add('hidden');

            isLoadingMore = false;

            updateUIState();

            return;

        }


        // ====================================================
        // LAST DOCUMENT
        // ====================================================

        lastVisibleDoc =
            querySnapshot.docs[
                querySnapshot.docs.length - 1
            ];


        // ====================================================
        // CHECK MORE DATA
        // ====================================================

        if (
            querySnapshot.docs.length <
            batchLimit
        ) {

            hasMore = false;

        }


        // ====================================================
        // PREPARE PRODUCTS
        // ====================================================

        let productsToDisplay = [];


        querySnapshot.forEach((docSnap) => {

            const data = docSnap.data();


            if (data) {

                const prodId = docSnap.id;


                if (
                    !loadedProductIds.has(prodId)
                ) {

                    loadedProductIds.add(prodId);


                    productsToDisplay.push({

                        id: prodId,

                        ...data

                    });

                }

            }

        });


        if (isInitialLoad) {

            isInitialLoad = false;

        }


        // ====================================================
        // RENDER
        // ====================================================

        if (productsToDisplay.length > 0) {

            loadedProductsList.push(
                ...productsToDisplay
            );


            const fragment =
                document.createDocumentFragment();


            productsToDisplay.forEach(product => {

                fragment.appendChild(
                    createProductCard(product)
                );

            });


            productGrid.appendChild(fragment);


            lucide.createIcons({
                attrs: {
                    'stroke-width': 2
                }
            });

        }


        updateUIState();


        if (!hasMore) {

            infiniteLoader.classList.add('hidden');

        }


    } catch (error) {

        console.error(
            "Error fetching batch products from Firestore:",
            error
        );


        const errorMsg =
            String(
                error?.message || error
            );


        const isIndexError =
            errorMsg.includes(
                "FAILED_PRECONDITION"
            ) ||
            errorMsg.includes(
                "requires an index"
            ) ||
            errorMsg.includes(
                "create_composite"
            ) ||
            errorMsg.includes(
                "index"
            );


        // ====================================================
        // FIRESTORE INDEX ERROR
        // ====================================================

        if (isIndexError) {

            const indexUrl =
                extractIndexUrl(errorMsg);


            loadingGifContainer.classList.add(
                'hidden'
            );

            errorState.classList.add(
                'hidden'
            );

            emptyState.classList.add(
                'hidden'
            );

            infiniteLoader.classList.add(
                'hidden'
            );

            indexRequiredState.classList.remove(
                'hidden'
            );


            if (indexUrl) {

                createIndexBtn.onclick = () => {

                    window.open(
                        indexUrl,
                        "_blank",
                        "noopener,noreferrer"
                    );

                };

            } else {

                createIndexBtn.onclick = () => {

                    window.open(
                        "https://console.firebase.google.com/",
                        "_blank",
                        "noopener,noreferrer"
                    );

                };

            }

            return;

        }


        // ====================================================
        // GENERAL ERROR
        // ====================================================

        if (isInitialLoad) {

            productsInitialLoadFinished = true;

            loadingGifContainer.classList.add(
                'hidden'
            );

            errorState.classList.remove(
                'hidden'
            );

        } else {

            showToast(
                'পরবর্তী পণ্যগুলো লোড করতে সমস্যা হয়েছে।'
            );

        }


    } finally {

        isLoadingMore = false;


        if (!isInitialLoad) {

            infiniteLoader.classList.add(
                'hidden'
            );

        }

    }

}


// ============================================================
// INFINITE SCROLL
// ============================================================

const observerCallback = (entries) => {

    entries.forEach(entry => {

        if (
            entry.isIntersecting &&
            hasMore &&
            !isLoadingMore &&
            searchInput.value.trim() === ''
        ) {

            fetchProductsBatch();

        }

    });

};


const observerOptions = {

    root: null,

    // আগে থেকেই 500px দূর থেকে load শুরু করবে
    rootMargin: '500px',

    threshold: 0.1

};


const observer =
    new IntersectionObserver(
        observerCallback,
        observerOptions
    );


observer.observe(scrollSentinel);


// ============================================================
// CART & CHECKOUT
// ============================================================

async function addProductToCart(
    product,
    chosenVariants = {},
    finalPrice = null,
    buttonEl = null
) {

    const user =
        await waitForAuthReady();


    if (!user) {

        window.location.href =
            'https://ghotimarket.com/login';

        return;

    }


    const exists =
        isProductInCart(product.id);


    if (exists) {

        updateProductCardButtons(
            product.id
        );

        return;

    }


    let originalHTML = '';


    if (buttonEl) {

        originalHTML =
            buttonEl.innerHTML;


        buttonEl.disabled = true;


        buttonEl.classList.add(
            'btn-loading'
        );


        buttonEl.innerHTML = `

            <span
                style="
                    display:inline-block;
                    width:14px;
                    height:14px;
                    border:2px solid #fff;
                    border-top-color:transparent;
                    border-radius:50%;
                    animation:spin 0.8s linear infinite;
                    vertical-align:middle;
                    margin-right:6px;
                "
            ></span>

            সেভ হচ্ছে...

        `;

    }


    const basePrice =
        Number(product.price) || 0;


    const price =
        finalPrice !== null
            ? finalPrice
            : basePrice;


    const firstImg =
        (
            Array.isArray(product.images) &&
            product.images[0]
        )
            ? product.images[0]
            : 'https://via.placeholder.com/300';


    const cartItemData = {

        uid: user.uid,

        email: user.email || '',

        id: product.id,

        docId: product.id,

        slug: product.slug || '',

        name:
            product.name ||
            'Unnamed Product',

        price: price,

        basePrice: basePrice,

        selectedVariants:
            chosenVariants,

        image: firstImg,

        shopName:
            product.shopName ||
            'Ghoti Shop',

        sellerId:
            product.sellerId ||
            '',

        affiliate:
            product.affiliate === "on"
                ? "on"
                : "off",

        oldPrice:
            Number(product.oldPrice) || 0,

        discount:
            Number(product.discount) || 0,

        quantity: 1,

        createdAt:
            new Date().toISOString()

    };


    try {

        const docRef =
            await addDoc(
                collection(db, "carts"),
                cartItemData
            );


        userCartItems.push({

            cartDocId: docRef.id,

            ...cartItemData

        });


        updateProductCardButtons(
            product.id
        );


        showToast(
            'পণ্যটি আপনার কার্টে সফলভাবে যোগ করা হয়েছে।'
        );


    } catch (error) {

        console.error(
            "Error adding to carts collection:",
            error
        );


        showToast(
            'কার্টে যোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
        );


    } finally {

        if (buttonEl) {

            buttonEl.disabled = false;

            buttonEl.classList.remove(
                'btn-loading'
            );

            buttonEl.innerHTML =
                originalHTML;

        }

    }

}


// ============================================================
// UPDATE PRODUCT CARD BUTTONS
// ============================================================

function updateProductCardButtons(productId) {

    const cards =
        productGrid.querySelectorAll(
            `.product-card`
        );


    cards.forEach(card => {

        const cartBtn =
            card.querySelector(
                `[data-action="cart"][data-id="${productId}"]`
            );


        if (cartBtn) {

            cartBtn.classList.add(
                'hidden'
            );

        }

    });

}


function updateAllCardButtons() {

    userCartItems.forEach(item => {

        updateProductCardButtons(
            item.id || item.docId
        );

    });

}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    toast.textContent = message;

    toast.classList.remove('hidden');

    toast.classList.add('show');


    setTimeout(() => {

        toast.classList.remove('show');


        setTimeout(() => {

            toast.classList.add('hidden');

        }, 300);

    }, 3000);

}


// ============================================================
// VARIANTS
// ============================================================

function hasVariants(product) {

    return (
        product &&
        Array.isArray(product.variants) &&
        product.variants.length > 0
    );

}


function renderVariantModal(product) {

    activeModalProduct = product;

    selectedVariantsState = {};


    modalProductImg.src =
        (
            Array.isArray(product.images) &&
            product.images[0]
        )
            ? product.images[0]
            : 'https://via.placeholder.com/100';


    modalProductName.textContent =
        product.name || '';


    modalBasePriceVal.textContent =
        Number(product.price) || 0;


    modalWarning.classList.add(
        'hidden'
    );


    variantGroupsContainer.innerHTML =
        '';


    const variants =
        Array.isArray(product.variants)
            ? product.variants
            : [];


    variants.forEach(group => {

        const groupDiv =
            document.createElement('div');


        groupDiv.className =
            'variant-group';


        const title =
            document.createElement('h5');


        title.className =
            'variant-group-title';


        title.textContent =
            group.name || 'Option';


        groupDiv.appendChild(title);


        const valuesContainer =
            document.createElement('div');


        valuesContainer.className =
            'variant-values';


        const values =
            Array.isArray(group.values)
                ? group.values
                : [];


        values.forEach(valObj => {

            const valBtn =
                document.createElement('button');


            valBtn.type =
                'button';


            valBtn.className =
                'variant-val-btn';


            const valName =
                valObj.value || '';


            const extraPrice =
                Number(
                    valObj.extraPrice
                ) || 0;


            valBtn.innerHTML = `

                ${escapeHTML(valName)}

                ${
                    extraPrice > 0
                        ? `
                            <span class="extra-price">
                                (+৳${extraPrice})
                            </span>
                        `
                        : ''
                }

            `;


            valBtn.addEventListener(
                'click',
                () => {

                    valuesContainer
                        .querySelectorAll(
                            '.variant-val-btn'
                        )
                        .forEach(
                            b =>
                                b.classList.remove(
                                    'active'
                                )
                        );


                    valBtn.classList.add(
                        'active'
                    );


                    selectedVariantsState[
                        group.name
                    ] = {

                        value: valName,

                        extraPrice:
                            extraPrice

                    };


                    updateModalPrice();


                    modalWarning.classList.add(
                        'hidden'
                    );

                }
            );


            valuesContainer.appendChild(
                valBtn
            );

        });


        groupDiv.appendChild(
            valuesContainer
        );


        variantGroupsContainer.appendChild(
            groupDiv
        );

    });


    updateModalPrice();


    modalOverlay.classList.add(
        'active'
    );


    lucide.createIcons({
        attrs: {
            'stroke-width': 2
        }
    });

}


// ============================================================
// CALCULATE VARIANT PRICE
// ============================================================

function getCalculatedCurrentPrice() {

    if (!activeModalProduct) {
        return 0;
    }


    let base =
        Number(
            activeModalProduct.price
        ) || 0;


    let extra = 0;


    for (
        const key in selectedVariantsState
    ) {

        if (
            selectedVariantsState[key]
        ) {

            extra +=
                Number(
                    selectedVariantsState[key]
                        .extraPrice
                ) || 0;

        }

    }


    return base + extra;

}


function updateModalPrice() {

    const finalPrice =
        getCalculatedCurrentPrice();


    modalFinalPrice.textContent =
        finalPrice;

}


// ============================================================
// VALIDATE VARIANTS
// ============================================================

function validateAndGetChosenVariants() {

    if (!activeModalProduct) {
        return null;
    }


    const variants =
        Array.isArray(
            activeModalProduct.variants
        )
            ? activeModalProduct.variants
            : [];


    const chosenVariants = {};


    for (let group of variants) {

        if (
            !selectedVariantsState[
                group.name
            ] ||
            !selectedVariantsState[
                group.name
            ].value
        ) {

            return null;

        }


        chosenVariants[
            group.name
        ] =
            selectedVariantsState[
                group.name
            ].value;

    }


    return chosenVariants;

}


// ============================================================
// PRODUCT CARD EVENT DELEGATION
// ============================================================

productGrid.addEventListener(
    'click',
    async (e) => {

        const cartBtn =
            e.target.closest(
                '[data-action="cart"]'
            );


        const buyNowBtn =
            e.target.closest(
                '[data-action="buynow"]'
            );


        // ====================================================
        // CART
        // ====================================================

        if (cartBtn) {

            e.preventDefault();

            e.stopPropagation();


            const productId =
                cartBtn.getAttribute(
                    'data-id'
                );


            const product =
                productMap.get(productId);


            if (product) {

                if (
                    isProductInCart(
                        product.id
                    )
                ) {

                    showToast(
                        'এই পণ্যটি ইতিমধ্যে আপনার কার্টে রয়েছে।'
                    );

                    return;

                }


                if (hasVariants(product)) {

                    renderVariantModal(
                        product
                    );

                } else {

                    await addProductToCart(

                        product,

                        {},

                        Number(
                            product.price
                        ) || 0,

                        cartBtn

                    );

                }

            }

        }


        // ====================================================
        // BUY NOW
        // ====================================================

        else if (buyNowBtn) {

            e.preventDefault();

            e.stopPropagation();


            const productId =
                buyNowBtn.getAttribute(
                    'data-id'
                );


            const product =
                productMap.get(productId);


            if (product) {

                if (
                    !isProductInCart(
                        product.id
                    )
                ) {

                    if (
                        hasVariants(product)
                    ) {

                        renderVariantModal(
                            product
                        );

                        return;

                    } else {

                        await addProductToCart(

                            product,

                            {},

                            Number(
                                product.price
                            ) || 0,

                            buyNowBtn

                        );

                    }

                }


                window.location.href =
                    'checkout.html';

            }

        }

    }
);


// ============================================================
// MODAL CART
// ============================================================

modalCartBtn.addEventListener(
    'click',
    async () => {

        if (!activeModalProduct) {
            return;
        }


        if (
            isProductInCart(
                activeModalProduct.id
            )
        ) {

            modalOverlay.classList.remove(
                'active'
            );


            showToast(
                'এই পণ্যটি ইতিমধ্যে আপনার কার্টে রয়েছে।'
            );


            return;

        }


        const chosenVariants =
            validateAndGetChosenVariants();


        if (!chosenVariants) {

            modalWarning.textContent =
                "অনুগ্রহ করে সব অপশন নির্বাচন করুন।";


            modalWarning.classList.remove(
                'hidden'
            );


            return;

        }


        const finalPrice =
            getCalculatedCurrentPrice();


        await addProductToCart(

            activeModalProduct,

            chosenVariants,

            finalPrice,

            modalCartBtn

        );


        modalOverlay.classList.remove(
            'active'
        );

    }
);


// ============================================================
// MODAL BUY NOW
// ============================================================

modalBuynowBtn.addEventListener(
    'click',
    async () => {

        if (!activeModalProduct) {
            return;
        }


        if (
            !isProductInCart(
                activeModalProduct.id
            )
        ) {

            const chosenVariants =
                validateAndGetChosenVariants();


            if (!chosenVariants) {

                modalWarning.textContent =
                    "অনুগ্রহ করে সব অপশন নির্বাচন করুন।";


                modalWarning.classList.remove(
                    'hidden'
                );


                return;

            }


            const finalPrice =
                getCalculatedCurrentPrice();


            await addProductToCart(

                activeModalProduct,

                chosenVariants,

                finalPrice,

                modalBuynowBtn

            );

        }


        modalOverlay.classList.remove(
            'active'
        );


        window.location.href =
            'checkout.html';

    }
);


// ============================================================
// MODAL CLOSE
// ============================================================

modalCloseBtn.addEventListener(
    'click',
    () => {

        modalOverlay.classList.remove(
            'active'
        );

    }
);


// ============================================================
// CLIENT-SIDE SEARCH
// ============================================================

searchInput.addEventListener(
    'input',
    (e) => {

        const term =
            e.target.value
                .toLowerCase()
                .trim();


        if (
            loadedProductsList.length === 0
        ) {

            return;

        }


        // ====================================================
        // RESET SEARCH
        // ====================================================

        if (term === '') {

            productGrid.innerHTML = '';


            const fragment =
                document.createDocumentFragment();


            loadedProductsList.forEach(
                product => {

                    fragment.appendChild(
                        createProductCard(
                            product
                        )
                    );

                }
            );


            productGrid.appendChild(
                fragment
            );


            updateUIState();


            lucide.createIcons({
                attrs: {
                    'stroke-width': 2
                }
            });


            return;

        }


        // ====================================================
        // FILTER
        // ====================================================

        const filtered =
            loadedProductsList.filter(
                p => {

                    const name =
                        String(
                            p.name || ''
                        ).toLowerCase();


                    const keywords =
                        Array.isArray(
                            p.keywords
                        )
                            ? p.keywords.map(
                                k =>
                                    String(k)
                                        .toLowerCase()
                            )
                            : [];


                    return (
                        name.includes(term) ||
                        keywords.some(
                            k =>
                                k.includes(term)
                        )
                    );

                }
            );


        productGrid.innerHTML = '';


        if (
            filtered.length === 0
        ) {

            productGrid.classList.add(
                'hidden'
            );


            infiniteLoader.classList.add(
                'hidden'
            );


            errorState.classList.add(
                'hidden'
            );


            indexRequiredState.classList.add(
                'hidden'
            );


            emptyState.classList.remove(
                'hidden'
            );

        } else {

            emptyState.classList.add(
                'hidden'
            );


            errorState.classList.add(
                'hidden'
            );


            indexRequiredState.classList.add(
                'hidden'
            );


            productGrid.classList.remove(
                'hidden'
            );


            infiniteLoader.classList.add(
                'hidden'
            );


            const fragment =
                document.createDocumentFragment();


            filtered.forEach(p => {

                fragment.appendChild(
                    createProductCard(p)
                );

            });


            productGrid.appendChild(
                fragment
            );

        }


        lucide.createIcons({
            attrs: {
                'stroke-width': 2
            }
        });

    }
);


// ============================================================
// COMPLETE RESET RETRY SYSTEM
// ============================================================

retryBtn.addEventListener(
    'click',
    () => {

        errorState.classList.add(
            'hidden'
        );


        indexRequiredState.classList.add(
            'hidden'
        );


        loadedProductsList = [];


        lastVisibleDoc = null;


        hasMore = true;


        isLoadingMore = false;


        isInitialLoad = true;


        productsInitialLoadFinished = false;


        productMap.clear();


        loadedProductIds.clear();


        productGrid.innerHTML =
            '';


        loadingGifContainer.classList.remove(
            'hidden'
        );


        fetchProductsBatch();

    }
);


// ============================================================
// INITIAL LOAD
// ============================================================

fetchProductsBatch();


lucide.createIcons({
    attrs: {
        'stroke-width': 2
    }
});
