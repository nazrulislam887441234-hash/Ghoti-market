export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";
    
    // সোশ্যাল মিডিয়া বট ক্রলার চিহ্নিতকরণ (Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Slack ইত্যাদি)
    const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|SkypeUriPreview|Pinterest|Applebot|Googlebot/i.test(userAgent);

    // যদি কোনো সোশ্যাল মিডিয়া বট বা ক্রলার রিকোয়েস্ট করে
    if (isBot) {
      try {
        const searchParams = url.searchParams;
        let slugVal = searchParams.get("slug");

        // যদি কুয়েরি প্যারামিটারে স্লাগ না থাকে, তবে পাথ থেকে নেওয়ার চেষ্টা করা
        if (!slugVal) {
          const parts = url.pathname.split('/');
          const last = parts[parts.length - 1];
          if (last && last !== 'category.html' && last !== '') {
            slugVal = decodeURIComponent(last);
          }
        }

        if (slugVal) {
          const cleanSlug = slugVal.trim();
          
          // সুন্দর টাইটেল ফরম্যাটিং (যেমন: electronics-items -> Electronics Items)
          const formattedCategoryName = cleanSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          const categoryTitle = `${formattedCategoryName} | GHOTI MARKET`;
          const categoryDesc = `Explore best quality products in ${formattedCategoryName} category on Ghoti Market. Shop now and get amazing deals!`;
          const categoryImage = "https://i.ibb.co/RG2hrf3y/background-remove-ghoti-market.png";
          const currentUrl = request.url;

          const html = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${categoryTitle}</title>
    <meta name="description" content="${categoryDesc}">
    <meta property="og:title" content="${categoryTitle}">
    <meta property="og:description" content="${categoryDesc}">
    <meta property="og:image" content="${categoryImage}">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${categoryTitle}">
    <meta name="twitter:description" content="${categoryDesc}">
    <meta name="twitter:image" content="${categoryImage}">
</head>
<body>
    <h1>${categoryTitle}</h1>
    <p>${categoryDesc}</p>
    <img src="${categoryImage}" alt="${formattedCategoryName}" />
</body>
</html>`;

          return new Response(html, {
            headers: { "Content-Type": "text/html;charset=UTF-8" }
          });
        }
      } catch (err) {
        console.error("Category Worker Preview Error:", err);
      }
    }

    // সাধারণ ভিজিটরদের রিকোয়েস্ট মূল হোস্টিং সার্ভারে পাঠিয়ে দেওয়া
    return fetch(request);
  }
};
