import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE",
  authDomain: "ghotimarket.firebaseapp.com",
  projectId: "ghotimarket",
  storageBucket: "ghotimarket.firebasestorage.app",
  messagingSenderId: "481257644093",
  appId: "1:481257644093:web:0dfc3699d6b3c86afeca54"
};
const FALLBACK_IMG = "https://ghotimarket.com/logo.png";
const LOADING_GIF = "https://ghotimarket.com/loading.gif";
const PAGE_SIZE = 10;
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const auth = getAuth(app);

let swiperInstance = null;
let lastProductDoc = null;
let isLoadingProducts = false;
let reachedEnd = false;
let observer = null;
let cachedProducts = [];
let searchDebounce = null;
const $ = (id) => document.getElementById(id);

function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[ch]); }
function safeHttpUrl(value, fallback = FALLBACK_IMG) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try { const url = new URL(value, location.origin); return ["https:", "http:"].includes(url.protocol) ? url.href : fallback; } catch { return fallback; }
}
function safeLink(value) {
  if (typeof value !== "string" || !value.trim()) return "#";
  try { const u = new URL(value, location.origin); return ["https:", "http:"].includes(u.protocol) ? u.href : "#"; } catch { return "#"; }
}
function productUrl(slug) {
  const clean = String(slug || "").trim();
  return clean ? `https://ghotimarket.com/product?${encodeURIComponent(clean)}` : "https://ghotimarket.com/all-product";
}
function imageFallbacks(container) {
  container?.querySelectorAll("img[data-fallback]").forEach(img => {
    img.addEventListener("error", () => { img.src = FALLBACK_IMG; img.removeAttribute("data-fallback"); }, { once: true });
  });
}
function toggleMenu(force) {
  const menu = $("sideMenu"), overlay = $("menuOverlay");
  const open = typeof force === "boolean" ? force : !menu.classList.contains("active");
  menu?.classList.toggle("active", open); overlay?.classList.toggle("active", open);
  $("menuBtn")?.setAttribute("aria-expanded", String(open));
}
function trackEvent(eventName, params = {}) { if (typeof window.gtag === "function") window.gtag("event", eventName, params); }

async function loadBanners() {
  const wrapper = $("banner-wrapper");
  try {
    const bannerQuery = query(collection(db, "banners"), orderBy("createdAt", "asc"));
    const snap = await getDocs(bannerQuery);
    const banners = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(b => typeof b.url === "string" && b.url.trim());
    if (!banners.length) { wrapper.innerHTML = `<div class="swiper-slide banner-loading">এই মুহূর্তে কোনো ব্যানার নেই</div>`; return; }
    wrapper.innerHTML = banners.map((b, i) => {
      const img = safeHttpUrl(b.url); const link = safeLink(b.link);
      const target = /^https?:\/\//i.test(String(b.link || "")) && new URL(b.link).origin !== location.origin ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<div class="swiper-slide"><a href="${escapeHTML(link)}"${target} aria-label="প্রমোশনাল ব্যানার ${i + 1}"><img src="${escapeHTML(img)}" alt="Ghoti Market promotional banner" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} data-fallback="1"></a></div>`;
    }).join("");
    imageFallbacks(wrapper);
    if (typeof window.Swiper === "function") {
      swiperInstance?.destroy(true, true);
      swiperInstance = new window.Swiper(".banner-container", { loop: banners.length > 1, speed: 650, autoplay: banners.length > 1 ? { delay: 3800, disableOnInteraction: false, pauseOnMouseEnter: true } : false, pagination: { el: ".swiper-pagination", clickable: true }, keyboard: { enabled: true }, watchOverflow: true });
    }
  } catch (error) { console.error("Banner loading failed:", error); wrapper.innerHTML = `<div class="swiper-slide banner-loading">ব্যানার লোড করা যায়নি।</div>`; }
}
function productImage(product) { const images = Array.isArray(product.images) ? product.images : []; return safeHttpUrl(images[0] || product.image); }
function renderProductCard(product) {
  const name = product.Name || product.name || "পণ্যের নাম নেই"; const price = Number(product.price); const oldPrice = Number(product.oldPrice);
  const validPrice = Number.isFinite(price) && price >= 0 ? price : 0;
  const hasDiscount = Number.isFinite(oldPrice) && oldPrice > validPrice && oldPrice > 0;
  const discountPercent = hasDiscount ? Math.round(((oldPrice - validPrice) / oldPrice) * 100) : 0;
  const freeDelivery = product.freeDelivery === true; const slug = product.slug || product.id || "";
  return `<a class="home-product-card" href="${escapeHTML(productUrl(slug))}" data-product-id="${escapeHTML(product.id || "")}"><div class="product-image-box">${hasDiscount ? `<span class="discount-badge">${discountPercent}% ছাড়</span>` : ""}${freeDelivery ? `<span class="free-delivery-badge">ফ্রি ডেলিভারি!</span>` : ""}<img src="${escapeHTML(productImage(product))}" alt="${escapeHTML(name)}" loading="lazy" data-fallback="1"></div><div class="home-product-info"><div class="home-product-name">${escapeHTML(name)}</div><div class="price-box"><span class="home-product-price">৳${validPrice.toLocaleString("en-BD")}</span>${hasDiscount ? `<span class="old-price">৳${oldPrice.toLocaleString("en-BD")}</span>` : ""}</div><div class="product-action-btn"><i class="fas fa-cart-shopping"></i> পণ্য দেখুন</div></div></a>`;
}
function renderProducts(products, append = false) {
  const box = $("latest-products"); if (!append) box.innerHTML = "";
  const html = products.map(renderProductCard).join("");
  if (append) box.insertAdjacentHTML("beforeend", html); else box.innerHTML = html || `<p class="initial-loading">এখন কোনো সক্রিয় পণ্য পাওয়া যায়নি।</p>`;
  imageFallbacks(box);
}
function setLoading(show) { const loader = $("infinite-loader"); if (!loader) return; loader.hidden = !show; }
async function fetchProductPage() {
  let productQuery = lastProductDoc ? query(collection(db, "products"), where("active", "==", true), orderBy("createdAt", "desc"), startAfter(lastProductDoc), limit(PAGE_SIZE)) : query(collection(db, "products"), where("active", "==", true), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
  const snap = await getDocs(productQuery); if (!snap.empty) lastProductDoc = snap.docs[snap.docs.length - 1];
  return { docs: snap.docs, products: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
}

async function loadNextProducts({ initial = false } = {}) {
  if (isLoadingProducts || reachedEnd) {
    if (reachedEnd && !initial) {
      const status = $("products-status");
      if (status && !status.innerHTML.includes("সব পণ্য দেখে ফেলেছেন")) {
        status.innerHTML = `<div style="text-align:center; padding:25px 15px; background:#f8fafc; border-radius:16px; margin-top:15px; border:1px dashed #e2e8f0;"><div style="font-size:28px;">✅</div><div style="font-weight:700; margin:8px 0 4px; color:#0f172a;">আপনি সব পণ্য দেখে ফেলেছেন!</div><div style="font-size:13px; color:#64748b; margin-bottom:12px;">মোট ${cachedProducts.length} টি পণ্য আছে</div><a href="/all-product" style="display:inline-block; background:#FF6A00; color:#fff; padding:9px 18px; border-radius:10px; text-decoration:none; font-weight:600; font-size:14px;">সব পণ্য একসাথে দেখুন</a></div>`;
      }
      setLoading(false);
      if (observer) observer.unobserve($("scroll-sentinel"));
    }
    return;
  }
  isLoadingProducts = true; if (!initial) setLoading(true);
  try {
    const { docs, products } = await fetchProductPage();
    if (!products.length) {
      reachedEnd = true;
      if (!cachedProducts.length) { $("latest-products").innerHTML = `<p class="initial-loading">এখন কোনো সক্রিয় পণ্য পাওয়া যায়নি।</p>`; }
      else { $("products-status").innerHTML = `<div style="text-align:center; padding:25px 15px; background:#f8fafc; border-radius:16px; margin-top:15px; border:1px dashed #e2e8f0;"><div style="font-size:28px;">✅</div><div style="font-weight:700; margin:8px 0 4px; color:#0f172a;">আপনি সব পণ্য দেখে ফেলেছেন!</div><div style="font-size:13px; color:#64748b; margin-bottom:12px;">মোট ${cachedProducts.length} টি পণ্য আছে</div><a href="/all-product" style="display:inline-block; background:#FF6A00; color:#fff; padding:9px 18px; border-radius:10px; text-decoration:none; font-weight:600; font-size:14px;">সব পণ্য একসাথে দেখুন</a></div>`; }
      if (observer) observer.unobserve($("scroll-sentinel"));
      return;
    }
    cachedProducts.push(...products); renderProducts(products, !initial);
    if (docs.length < PAGE_SIZE) { reachedEnd = true; if (observer) observer.unobserve($("scroll-sentinel")); }
  } catch (error) {
    console.error("Product loading failed:", error);
    $("products-status").textContent = "পণ্য লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।";
    if (observer) observer.unobserve($("scroll-sentinel"));
  } finally { isLoadingProducts = false; setLoading(false); }
}

function initInfiniteScroll() {
  const sentinel = $("scroll-sentinel");
  if (!sentinel || !("IntersectionObserver" in window)) { window.addEventListener("scroll", () => { if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 700) loadNextProducts(); }, { passive: true }); return; }
  observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) loadNextProducts(); }, { root: null, rootMargin: "700px 0px", threshold: 0 });
  observer.observe(sentinel);
}
function initSearch() {
  const input = $("smartSearch"), results = $("search-results");
  input?.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      const term = input.value.trim().toLocaleLowerCase();
      if (term.length < 2) { results.classList.remove("show"); results.innerHTML = ""; return; }
      const matches = cachedProducts.filter(p => { const name = String(p.Name || p.name || "").toLocaleLowerCase(); const keywords = Array.isArray(p.keywords) ? p.keywords.join(" ") : String(p.keywords || ""); return `${name} ${p.description || ""} ${keywords}`.toLocaleLowerCase().includes(term); }).slice(0, 8);
      results.innerHTML = matches.length ? matches.map(p => `<a class="search-result" href="${escapeHTML(productUrl(p.slug || p.id))}"><img src="${escapeHTML(productImage(p))}" alt="" data-fallback="1"><span>${escapeHTML(p.Name || p.name || "পণ্য")}</span></a>`).join("") : `<div class="search-empty">মিল পাওয়া যায়নি।<br><a href="/all-product">সব পণ্য দেখুন</a></div>`;
      imageFallbacks(results); results.classList.add("show");
    }, 160);
  });
  input?.addEventListener("keydown", event => { if (event.key === "Enter") { const first = results.querySelector("a"); if (first && results.classList.contains("show")) location.href = first.href; else if (input.value.trim()) location.href = `/search?q=${encodeURIComponent(input.value.trim())}`; } if (event.key === "Escape") results.classList.remove("show"); });
  document.addEventListener("click", event => { if (!event.target.closest(".search-wrapper")) results?.classList.remove("show"); });
}
function initCartBadge() {
  onAuthStateChanged(auth, async user => {
    const badge = $("cartCount"); if (!badge) return; if (!user) { badge.hidden = true; return; }
    try { const cartSnap = await getDocs(query(collection(db, "carts"), where("uid", "==", user.uid))); let total = 0; cartSnap.forEach(doc => { total += Number(doc.data().quantity) || 1; }); badge.textContent = total > 99 ? "99+" : String(total); badge.hidden = total <= 0; } catch (error) { badge.hidden = true; }
  });
}
function initNetworkStatus() { const toast = $("offline-toast"); const update = () => { if (toast) toast.style.display = navigator.onLine ? "none" : "block"; }; addEventListener("online", update); addEventListener("offline", update); update(); }
function initMenu() { $("menuBtn")?.addEventListener("click", () => toggleMenu()); $("menuOverlay")?.addEventListener("click", () => toggleMenu(false)); document.querySelectorAll(".side-menu a").forEach(a => a.addEventListener("click", () => toggleMenu(false))); document.addEventListener("keydown", e => { if (e.key === "Escape") toggleMenu(false); }); }
function init() { $("year").textContent = new Date().getFullYear(); initMenu(); initSearch(); initNetworkStatus(); initCartBadge(); loadBanners(); loadNextProducts({ initial: true }); initInfiniteScroll(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
