export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent") || "";
    
    // সোশ্যাল মিডিয়া বট ক্রলার চেক (ফেসবুক, টুইটার, লিংকডইন, হোয়াটসঅ্যাপ, টেলিগ্রাম ইত্যাদি)
    const isBot = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot|SkypeUriPreview|Pinterest|Applebot|Googlebot/i.test(userAgent);

    // প্রোফাইল পেজ অথবা হোমপেজে বা যেকোনো প্যারামিটারে বট আসলে Firestore থেকে ডাটা ফেচ করবে
    if (isBot) {
      try {
        let identifier = "";
        
        // ১. URL থেকে প্যারামিটার বা স্লাগ বের করা (যেমন: ?sellerId=xxx, ?username=xxx, অথবা সরাসরি ?username)
        const searchParams = url.searchParams;
        let sellerIdVal = searchParams.get("sellerId");
        let usernameVal = searchParams.get("username");
        let atVal = searchParams.get("@");

        if (sellerIdVal) {
          identifier = sellerIdVal.trim();
        } else if (usernameVal) {
          identifier = usernameVal.trim();
        } else if (atVal) {
          identifier = atVal.trim();
        } else {
          // যদি সরাসরি কোনো কি বা ভ্যালু থাকে (যেমন: ?luxuryshop বা ?oBalDCzGc)
          for (const [key, value] of searchParams.entries()) {
            let cleanKey = decodeURIComponent(key.trim());
            if (cleanKey && cleanKey !== 'fbclid' && cleanKey !== 'gclid' && !cleanKey.startsWith('utm_')) {
              if (cleanKey.startsWith('@')) {
                identifier = cleanKey.substring(1);
                break;
              }
              if (value === '' && !cleanKey.includes('=')) {
                identifier = cleanKey.replace(/^@/, '');
                break;
              }
            }
          }
        }

        // যদি উপরের নিয়মে না পাওয়া যায়, তবে পাথ থেকে নেওয়ার চেষ্টা করা
        if (!identifier) {
          const parts = url.pathname.split('/');
          const last = parts[parts.length - 1];
          if (last && last !== 'profile.html' && last !== '') {
            identifier = decodeURIComponent(last);
          }
        }

        if (identifier) {
          if (identifier.startsWith('@')) {
            identifier = identifier.substring(1);
          }

          const firestoreApiKey = env.FIREBASE_API_KEY || "AIzaSyBUhNhYvuo_FTvZ5RZR6Gn-4hsUY21S0XE";
          const projectId = "ghotimarket";

          // প্রথমে ডকুমেন্ট আইডি (sellerId) দিয়ে খোঁজা
          let userData = null;
          const docUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${identifier}`;
          const docRes = await fetch(docUrl);
          
          if (docRes.ok) {
            const docJson = await docRes.json();
            if (docJson && docJson.fields) {
              userData = docJson.fields;
            }
          }

          // যদি ডকুমেন্ট আইডি দিয়ে না পাওয়া যায়, তবে username ফিল্ড দিয়ে কুয়েরি করা
          if (!userData) {
            const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
            const queryBody = {
              structuredQuery: {
                from: [{ collectionId: "users" }],
                where: {
                  fieldFilter: {
                    field: { fieldPath: "username" },
                    op: "EQUAL",
                    value: { stringValue: identifier }
                  }
                },
                limit: 1
              }
            };

            const queryRes = await fetch(queryUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(queryBody)
            });

            if (queryRes.ok) {
              const queryJson = await queryRes.json();
              if (queryJson && queryJson.length > 0 && queryJson[0].document && queryJson[0].document.fields) {
                userData = queryJson[0].document.fields;
              }
            }
          }

          // যদি ইউজার ডাটা পাওয়া যায়, তবে ডাইনামিক মেটা ট্যাগ জেনারেট করে রিটার্ন করা
          if (userData) {
            const shopName = userData.shopName ? userData.shopName.stringValue : "Ghoti Market Seller";
            const shopDescription = userData.shopDescription ? userData.shopDescription.stringValue : `Browse products from ${shopName} on Ghoti Market.`;
            const shopLogo = userData.shopLogo ? userData.shopLogo.stringValue : "https://i.ibb.co/RG2hrf3y/background-remove-ghoti-market.png";
            const shopBanner = userData.shopBanner ? userData.shopBanner.stringValue : shopLogo;
            const currentUrl = request.url;

            const cleanDesc = shopDescription.replace(/<[^>]*>?/gm, '');
            const metaDesc = cleanDesc.length > 160 ? cleanDesc.substring(0, 157) + '...' : cleanDesc;
            const ogTitle = `${shopName} | Ghoti Market`;

            const html = `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${ogTitle}</title>
    <meta name="description" content="${metaDesc}">
    <meta property="og:title" content="${ogTitle}">
    <meta property="og:description" content="${metaDesc}">
    <meta property="og:image" content="${shopBanner}">
    <meta property="og:url" content="${currentUrl}">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${ogTitle}">
    <meta name="twitter:description" content="${metaDesc}">
    <meta name="twitter:image" content="${shopBanner}">
</head>
<body>
    <h1>${shopName}</h1>
    <p>${metaDesc}</p>
    <img src="${shopBanner}" alt="${shopName}" />
</body>
</html>`;

            return new Response(html, {
              headers: { "Content-Type": "text/html;charset=UTF-8" }
            });
          }
        }
      } catch (err) {
        console.error("Seller Worker Error:", err);
      }
    }

    // সাধারণ ভিজিটর বা ইউজার আসলে ক্লাউডফлэয়ার তার মূল পেজ বা হোস্টিং সাইটে রিকোয়েস্ট পাঠিয়ে দেবে
    return fetch(request);
  }
};
