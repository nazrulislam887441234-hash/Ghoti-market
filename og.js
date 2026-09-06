export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";
    
    // সোশ্যাল মিডিয়া বট ক্রলার চেক
    const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|SkypeUriPreview|Pinterest|Applebot/i.test(userAgent);

    if (isBot && (url.pathname.includes("/product") || url.search.toString().length > 0)) {
      try {
        let slug = url.searchParams.get("product-slug");
        if (!slug) {
          for (const [key, value] of url.searchParams.entries()) {
            if (key !== 'fbclid' && !key.startsWith('utm_') && value === '') {
              slug = key;
              break;
            }
          }
        }
        if (!slug) {
          const parts = url.pathname.split('/');
          const last = parts[parts.length - 1];
          if (last && last !== 'product.html' && last !== '') {
            slug = decodeURIComponent(last);
          }
        }

        if (slug) {
          // ফায়ারবেস থেকে ডাটা আনার কোড
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/ghotimarket/databases/(default)/documents/products`;
          const response = await fetch(firestoreUrl);
          const data = await response.json();

          let product = null;
          if (data && data.documents) {
            const docFound = data.documents.find(doc => {
              const fields = doc.fields;
              return fields && fields.slug && fields.slug.stringValue === slug;
            });

            if (docFound) {
              const f = docFound.fields;
              const rawPrice = f.price ? (f.price.integerValue || f.price.doubleValue || "") : "";
              product = {
                name: f.name ? f.name.stringValue : "GHOTI MARKET",
                description: f.description ? f.description.stringValue : "GHOTI MARKET থেকে সেরা দামে পণ্য কিনুন",
                image: (f.images && f.images.arrayValue && f.images.arrayValue.values && f.images.arrayValue.values[0]) 
                       ? f.images.arrayValue.values[0].stringValue 
                       : "https://ghotimarket.com/assets/logo.png",
                price: rawPrice
              };
            }
          }

          if (product) {
            const ogTitle = `${product.name} - ৳${product.price} | GHOTI MARKET`;
            const cleanDesc = product.description.replace(/<[^>]*>?/gm, ''); // HTML ট্যাগ রিমুভ করা
            const ogDesc = cleanDesc.substring(0, 150) + '...';
            const ogImage = product.image;
            const ogUrl = request.url;

            const html = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${ogTitle}</title>
    <meta name="description" content="${ogDesc}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${ogDesc}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:url" content="${ogUrl}">
    <meta property="og:type" content="product">
    <meta property="fb:app_id" content="">
</head>
<body>
    <h1>${product.name}</h1>
    <p>${ogDesc}</p>
    <img src="${ogImage}" alt="${product.name}" />
</body>
</html>`;

            return new Response(html, {
              headers: { "Content-Type": "text/html;charset=UTF-8" }
            });
          }
        }
      } catch (err) {
        console.error("Worker fetch error:", err);
      }
    }

    return fetch(request);
  }
};
