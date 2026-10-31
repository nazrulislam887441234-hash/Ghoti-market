
"use strict";

(function (global) {
  const BD_ADDRESS_DATABASE = {
    "ঢাকা": {
      en: "Dhaka",
      districts: {
        "ঢাকা": { en: "Dhaka", upazilas: ["সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার", "মিরপুর", "ধানমন্ডি", "গুলশান", "উত্তরা", "মোহাম্মদপুর", "তেজগাঁও", "বাড্ডা", "পল্টন", "মতিঝিল", "খিলগাঁও", "রামপুরা", "যাত্রাবাড়ী", "সূত্রাপুর", "লালবাগ", "কোতোয়ালী", "চকবাজার", "কামরাঙ্গীরচর", "হাজারীবাগ", "ডেমরা", "কদমতলী", "শ্যামপুর", "সবুজবাগ", "শাহবাগ", "কলাবাগান", "কাফরুল", "ক্যান্টনমেন্ট", "পল্লবী", "রূপনগর", "তুরাগ", "উত্তরখান", "দক্ষিণখান", "বিমানবন্দর", "ভাটারা", "বনানী", "খিলক্ষেত", "আদাবর", "শেরেবাংলা নগর", "শাহ আলী", "দারুসসালাম", "হাতিরঝিল", "ওয়ারী", "বংশাল", "মুগদা", "গেণ্ডারিয়া"] },
        "গাজীপুর": { en: "Gazipur", upazilas: ["গাজীপুর সদর", "কালিয়াকৈর", "কালীগঞ্জ", "কাপাসিয়া", "শ্রীপুর", "টঙ্গী"] },
        "কিশোরগঞ্জ": { en: "Kishoreganj", upazilas: ["কিশোরগঞ্জ সদর", "অষ্টগ্রাম", "ইটনা", "করিমগঞ্জ", "কটিয়াদী", "কুলিয়ারচর", "তাড়াইল", "নিকলী", "পাকুন্দিয়া", "বাজিতপুর", "ভৈরব", "হোসেনপুর", "মিঠামইন"] },
        "মানিকগঞ্জ": { en: "Manikganj", upazilas: ["মানিকগঞ্জ সদর", "সিঙ্গাইর", "শিবালয়", "সাটুরিয়া", "হরিরামপুর", "ঘিওর", "দৌলতপুর"] },
        "মুন্সীগঞ্জ": { en: "Munshiganj", upazilas: ["মুন্সীগঞ্জ সদর", "শ্রীনগর", "সিরাজদিখান", "লৌহজং", "গজারিয়া", "টংগিবাড়ী"] },
        "নারায়ণগঞ্জ": { en: "Narayanganj", upazilas: ["নারায়ণগঞ্জ সদর", "বন্দর", "রূপগঞ্জ", "সোনারগাঁও", "আড়াইহাজার"] },
        "নরসিংদী": { en: "Narsingdi", upazilas: ["নরসিংদী সদর", "বেলাবো", "মনোহরদী", "পলাশ", "রায়পুরা", "শিবপুর"] },
        "টাঙ্গাইল": { en: "Tangail", upazilas: ["টাঙ্গাইল সদর", "বাসাইল", "ভূঞাপুর", "দেলদুয়ার", "ঘাটাইল", "গোপালপুর", "মধুপুর", "মির্জাপুর", "নাগরপুর", "সখিপুর", "ধনবাড়ী", "কালিহাতী"] },
        "ফরিদপুর": { en: "Faridpur", upazilas: ["ফরিদপুর সদর", "আলফাডাঙ্গা", "বোয়ালমারী", "মধুখালী", "নগরকান্দা", "সদরপুর", "চরভদ্রাসন", "ভাঙ্গা", "সালথা"] },
        "গোপালগঞ্জ": { en: "Gopalganj", upazilas: ["গোপালগঞ্জ সদর", "কাশিয়ানী", "কোটালীপাড়া", "মুকসুদপুর", "টুঙ্গিপাড়া"] },
        "মাদারীপুর": { en: "Madaripur", upazilas: ["মাদারীপুর সদর", "শিবচর", "কালকিনি", "রাজৈর", "ডাসার"] },
        "রাজবাড়ী": { en: "Rajbari", upazilas: ["রাজবাড়ী সদর", "গোয়ালন্দ", "পাংশা", "বালিয়াকান্দি", "কালুখালী"] },
        "শরীয়তপুর": { en: "Shariatpur", upazilas: ["শরীয়তপুর সদর", "ডামুড্যা", "নড়িয়া", "ভেদরগঞ্জ", "গোসাইরহাট", "জাজিরা", "সখিপুর"] }
      }
    },
    "চট্টগ্রাম": {
      en: "Chattogram",
      districts: {
        "চট্টগ্রাম": { en: "Chattogram", upazilas: ["আনোয়ারা", "বাঁশখালী", "বোয়ালখালী", "চন্দনাইশ", "ফটিকছড়ি", "হাটহাজারী", "কর্ণফুলী", "লোহাগাড়া", "মীরসরাই", "পটিয়া", "রাঙ্গুনিয়া", "রাউজান", "সন্দ্বীপ", "সাতকানিয়া", "সীতাকুণ্ড"] },
        "কক্সবাজার": { en: "Cox's Bazar", upazilas: ["কক্সবাজার সদর", "চকরিয়া", "কুতুবদিয়া", "মহেশখালী", "রামু", "টেকনাফ", "উখিয়া", "পেকুয়া", "ঈদগাঁও"] },
        "কুমিল্লা": { en: "Cumilla", upazilas: ["কুমিল্লা আদর্শ সদর", "কুমিল্লা সদর দক্ষিণ", "চান্দিনা", "দাউদকান্দি", "দেবিদ্বার", "হোমনা", "লাকসাম", "মুরাদনগর", "নাঙ্গলকোট", "মেঘনা", "তিতাস", "মনোহরগঞ্জ", "বরুড়া", "বুড়িচং", "ব্রাহ্মণপাড়া", "চৌদ্দগ্রাম", "লালমাই"] },
        "ফেনী": { en: "Feni", upazilas: ["ফেনী সদর", "ছাগলনাইয়া", "দাগনভূঞা", "পরশুরাম", "ফুলগাজী", "সোনাগাজী"] },
        "ব্রাহ্মণবাড়িয়া": { en: "Brahmanbaria", upazilas: ["ব্রাহ্মণবাড়িয়া সদর", "আশুগঞ্জ", "আখাউড়া", "কসবা", "নবীনগর", "নাসিরনগর", "বাঞ্ছারামপুর", "সরাইল", "বিজয়নগর"] },
        "চাঁদপুর": { en: "Chandpur", upazilas: ["চাঁদপুর সদর", "ফরিদগঞ্জ", "হাইমচর", "হাজীগঞ্জ", "কচুয়া", "মতলব উত্তর", "মতলব দক্ষিণ", "শাহরাস্তি"] },
        "নোয়াখালী": { en: "Noakhali", upazilas: ["নোয়াখালী সদর", "বেগমগঞ্জ", "চাটখিল", "কোম্পানীগঞ্জ", "সেনবাগ", "হাতিয়া", "কবিরহাট", "সুবর্ণচর", "সোনাইমুড়ী"] },
        "লক্ষ্মীপুর": { en: "Lakshmipur", upazilas: ["লক্ষ্মীপুর সদর", "রায়পুর", "রামগঞ্জ", "রামগতি", "কমলনগর"] },
        "রাঙ্গামাটি": { en: "Rangamati", upazilas: ["রাঙ্গামাটি সদর", "বাঘাইছড়ি", "বরকল", "বিলাইছড়ি", "জুরাছড়ি", "কাপ্তাই", "কাউখালী", "লংগদু", "নানিয়ারচর", "রাজস্থলী"] },
        "বান্দরবান": { en: "Bandarban", upazilas: ["বান্দরবান সদর", "আলীকদম", "নাইক্ষ্যংছড়ি", "রোয়াংছড়ি", "রুমা", "থানচি", "লামা"] },
        "খাগড়াছড়ি": { en: "Khagrachhari", upazilas: ["খাগড়াছড়ি সদর", "দীঘিনালা", "পানছড়ি", "মহালছড়ি", "মাটিরাঙ্গা", "মানিকছড়ি", "রামগড়", "লক্ষ্মীছড়ি", "গুইমারা"] }
      }
    },
    "রাজশাহী": { en: "Rajshahi", districts: { "রাজশাহী": { en: "Rajshahi", upazilas: ["বাঘা", "বাগমারা", "চারঘাট", "দুর্গাপুর", "গোদাগাড়ী", "মোহনপুর", "পবা", "পুঠিয়া", "তানোর"] }, "চাঁপাইনবাবগঞ্জ": { en: "Chapai Nawabganj", upazilas: ["চাঁপাইনবাবগঞ্জ সদর", "গোমস্তাপুর", "নাচোল", "ভোলাহাট", "শিবগঞ্জ"] }, "নাটোর": { en: "Natore", upazilas: ["নাটোর সদর", "বাগাতিপাড়া", "বড়াইগ্রাম", "গুরুদাসপুর", "লালপুর", "সিংড়া", "নলডাঙ্গা"] }, "নওগাঁ": { en: "Naogaon", upazilas: ["নওগাঁ সদর", "আত্রাই", "বদলগাছী", "ধামইরহাট", "মান্দা", "মহাদেবপুর", "পত্নীতলা", "পোরশা", "রাণীনগর", "সাপাহার", "নিয়ামতপুর"] }, "পাবনা": { en: "Pabna", upazilas: ["পাবনা সদর", "আটঘরিয়া", "ঈশ্বরদী", "চাটমোহর", "বেড়া", "ভাঙ্গুড়া", "ফরিদপুর", "সুজানগর", "সাঁথিয়া"] }, "সিরাজগঞ্জ": { en: "Sirajganj", upazilas: ["সিরাজগঞ্জ সদর", "বেলকুচি", "চৌহালী", "কামারখন্দ", "কাজীপুর", "রায়গঞ্জ", "শাহজাদপুর", "তাড়াশ", "উল্লাপাড়া"] }, "বগুড়া": { en: "Bogura", upazilas: ["বগুড়া সদর", "আদমদীঘি", "কাহালু", "নন্দীগ্রাম", "শেরপুর", "ধুনট", "গাবতলী", "শাজাহানপুর", "শিবগঞ্জ", "সোনাতলা", "দুপচাঁচিয়া", "সারিয়াকান্দি"] }, "জয়পুরহাট": { en: "Joypurhat", upazilas: ["জয়পুরহাট সদর", "আক্কেলপুর", "কালাই", "ক্ষেতলাল", "পাঁচবিবি"] } } },
    "খুলনা": { en: "Khulna", districts: { "খুলনা": { en: "Khulna", upazilas: ["কয়রা", "ডুমুরিয়া", "তেরখাদা", "দাকোপ", "দিঘলিয়া", "পাইকগাছা", "ফুলতলা", "বটিয়াঘাটা", "রূপসা"] }, "বাগেরহাট": { en: "Bagerhat", upazilas: ["বাগেরহাট সদর", "কচুয়া", "চিতলমারী", "ফকিরহাট", "মোংলা", "মোড়েলগঞ্জ", "মোল্লাহাট", "রামপাল", "শরণখোলা"] }, "সাতক্ষীরা": { en: "Satkhira", upazilas: ["সাতক্ষীরা সদর", "আশাশুনি", "দেবহাটা", "কলারোয়া", "কালীগঞ্জ", "শ্যামনগর", "তালা"] }, "যশোর": { en: "Jashore", upazilas: ["যশোর সদর", "অভয়নগর", "বাঘারপাড়া", "চৌগাছা", "ঝিকরগাছা", "কেশবপুর", "মনিরামপুর", "শার্শা"] }, "মাগুরা": { en: "Magura", upazilas: ["মাগুরা সদর", "মহম্মদপুর", "শালিখা", "শ্রীপুর"] }, "ঝিনাইদহ": { en: "Jhenaidah", upazilas: ["ঝিনাইদহ সদর", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর", "শৈলকুপা", "হরিণাকুণ্ডু"] }, "নড়াইল": { en: "Narail", upazilas: ["নড়াইল সদর", "কালিয়া", "লোহাগড়া"] }, "কুষ্টিয়া": { en: "Kushtia", upazilas: ["কুষ্টিয়া সদর", "কুমারখালী", "খোকসা", "দৌলতপুর", "ভেড়ামারা", "মিরপুর"] }, "চুয়াডাঙ্গা": { en: "Chuadanga", upazilas: ["চুয়াডাঙ্গা সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"] }, "মেহেরপুর": { en: "Meherpur", upazilas: ["মেহেরপুর সদর", "গাংনী", "মুজিবনগর"] } } },
    "বরিশাল": { en: "Barishal", districts: { "বরিশাল": { en: "Barishal", upazilas: ["বরিশাল সদর", "আগৈলঝাড়া", "বাবুগঞ্জ", "বাকেরগঞ্জ", "বানারীপাড়া", "গৌরনদী", "হিজলা", "মেহেন্দিগঞ্জ", "মুলাদী", "উজিরপুর"] }, "পটুয়াখালী": { en: "Patuakhali", upazilas: ["পটুয়াখালী সদর", "বাউফল", "দশমিনা", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "দুমকি", "রাঙ্গাবালী"] }, "ভোলা": { en: "Bhola", upazilas: ["ভোলা সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"] }, "পিরোজপুর": { en: "Pirojpur", upazilas: ["পিরোজপুর সদর", "ভাণ্ডারিয়া", "কাউখালী", "মঠবাড়িয়া", "নাজিরপুর", "নেছারাবাদ"] }, "বরগুনা": { en: "Barguna", upazilas: ["বরগুনা সদর", "আমতলী", "বামনা", "বেতাগী", "পাথরঘাটা", "তালতলী"] }, "ঝালকাঠি": { en: "Jhalakathi", upazilas: ["ঝালকাঠি সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"] } } },
    "সিলেট": { en: "Sylhet", districts: { "সিলেট": { en: "Sylhet", upazilas: ["সিলেট সদর", "বালাগঞ্জ", "বিয়ানীবাজার", "বিশ্বনাথ", "কোম্পানীগঞ্জ", "ফেঞ্চুগঞ্জ", "গোলাপগঞ্জ", "গোয়াইনঘাট", "জৈন্তাপুর", "কানাইঘাট", "জকিগঞ্জ", "দক্ষিণ সুরমা", "ওসমানীনগর"] }, "মৌলভীবাজার": { en: "Moulvibazar", upazilas: ["মৌলভীবাজার সদর", "বড়লেখা", "জুড়ী", "কমলগঞ্জ", "কুলাউড়া", "রাজনগর", "শ্রীমঙ্গল"] }, "হবিগঞ্জ": { en: "Habiganj", upazilas: ["হবিগঞ্জ সদর", "আজমিরীগঞ্জ", "বাহুবল", "বানিয়াচং", "চুনারুঘাট", "মাধবপুর", "নবীগঞ্জ", "লাখাই", "শায়েস্তাগঞ্জ"] }, "সুনামগঞ্জ": { en: "Sunamganj", upazilas: ["সুনামগঞ্জ সদর", "ছাতক", "দিরাই", "ধর্মপাশা", "দোয়ারাবাজার", "জগন্নাথপুর", "জামালগঞ্জ", "তাহিরপুর", "শাল্লা", "শান্তিগঞ্জ", "বিশ্বম্ভরপুর", "মধ্যনগর"] } } },
    "রংপুর": { en: "Rangpur", districts: { "রংপুর": { en: "Rangpur", upazilas: ["রংপুর সদর", "বদরগঞ্জ", "গঙ্গাচড়া", "কাউনিয়া", "মিঠাপুকুর", "পীরগাছা", "পীরগঞ্জ", "তারাগঞ্জ"] }, "গাইবান্ধা": { en: "Gaibandha", upazilas: ["গাইবান্ধা সদর", "ফুলছড়ি", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সাদুল্লাপুর", "সাঘাটা", "সুন্দরগঞ্জ"] }, "কুড়িগ্রাম": { en: "Kurigram", upazilas: ["কুড়িগ্রাম সদর", "নাগেশ্বরী", "ভূরুঙ্গামারী", "ফুলবাড়ী", "রাজারহাট", "উলিপুর", "চিলমারী", "রৌমারী", "চর রাজিবপুর"] }, "লালমনিরহাট": { en: "Lalmonirhat", upazilas: ["লালমনিরহাট সদর", "আদিতমারী", "কালীগঞ্জ", "হাতীবান্ধা", "পাটগ্রাম"] }, "দিনাজপুর": { en: "Dinajpur", upazilas: ["দিনাজপুর সদর", "বিরামপুর", "বীরগঞ্জ", "বোচাগঞ্জ", "চিরিরবন্দর", "ফুলবাড়ী", "ঘোড়াঘাট", "হাকিমপুর", "কাহারোল", "খানসামা", "নবাবগঞ্জ", "পার্বতীপুর", "বিরল"] }, "ঠাকুরগাঁও": { en: "Thakurgaon", upazilas: ["ঠাকুরগাঁও সদর", "বালিয়াডাঙ্গী", "হরিপুর", "পীরগঞ্জ", "রাণীশংকৈল"] }, "পঞ্চগড়": { en: "Panchagarh", upazilas: ["পঞ্চগড় সদর", "আটোয়ারী", "বোদা", "দেবীগঞ্জ", "তেঁতুলিয়া"] }, "নীলফামারী": { en: "Nilphamari", upazilas: ["নীলফামারী সদর", "ডিমলা", "ডোমার", "জলঢাকা", "কিশোরগঞ্জ", "সৈয়দপুর"] } } },
    "ময়মনসিংহ": { en: "Mymensingh", districts: { "ময়মনসিংহ": { en: "Mymensingh", upazilas: ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ভালুকা", "ত্রিশাল", "গৌরীপুর", "ঈশ্বরগঞ্জ", "নান্দাইল", "ফুলপুর", "তারাকান্দা", "হালুয়াঘাট", "ধোবাউড়া", "গফরগাঁও", "ফুলবাড়িয়া"] }, "জামালপুর": { en: "Jamalpur", upazilas: ["জামালপুর সদর", "বকশীগঞ্জ", "দেওয়ানগঞ্জ", "ইসলামপুর", "মাদারগঞ্জ", "মেলান্দহ", "সরিষাবাড়ী"] }, "নেত্রকোণা": { en: "Netrokona", upazilas: ["নেত্রকোণা সদর", "আটপাড়া", "বারহাট্টা", "দুর্গাপুর", "কলমাকান্দা", "কেন্দুয়া", "মদন", "মোহনগঞ্জ", "পূর্বধলা", "খালিয়াজুড়ী"] }, "শেরপুর": { en: "Sherpur", upazilas: ["শেরপুর সদর", "ঝিনাইগাতী", "নকলা", "নালিতাবাড়ী", "শ্রীবরদী"] } } }
  };

  const DEFAULT_CONFIG = {
    divisionId: "cust-vibag",
    districtId: "cust-jela",
    upazilaId: "cust-thana",
    deliveryChargeId: "delivery-charge-display",
    deliveryChargeInputId: "delivery-charge-input",
    selectedImageInputId: "selected-image-url"
  };

  let activeConfig = { ...DEFAULT_CONFIG };

  // ====== NEW: PRODUCT DATA GETTER (Boss's 4th point) ======
  function getProductDeliveryConfig() {
    // Option 1: global variable window.GHOTI_PRODUCT
    // Option 2: data attributes on body: <body data-inside-dhaka="60" data-outside-dhaka="120">
    // Option 3: fallback default
    let product = global.GHOTI_PRODUCT || {};
    
    // Try to read from DOM if not in global
    if (!product.inside_dhaka) {
      let body = document.body;
      let insideAttr = body.getAttribute('data-inside-dhaka') || document.getElementById('product-data')?.getAttribute('data-inside-dhaka');
      let outsideAttr = body.getAttribute('data-outside-dhaka') || document.getElementById('product-data')?.getAttribute('data-outside-dhaka');
      if (insideAttr) product.inside_dhaka = parseInt(insideAttr);
      if (outsideAttr) product.outside_dhaka = parseInt(outsideAttr);
    }

    let inside = product.inside_dhaka ? parseInt(product.inside_dhaka) : 60;
    let outside = product.outside_dhaka ? parseInt(product.outside_dhaka) : 120;
    
    // Safety: if NaN, use default
    if (isNaN(inside)) inside = 60;
    if (isNaN(outside)) outside = 120;

    return { inside, outside };
  }

  // ====== NEW: AUTO DELIVERY CHARGE SETTER ======
  function setAutoDeliveryCharge(divisionName) {
    const chargeDisplay = document.getElementById(activeConfig.deliveryChargeId);
    const chargeInput = document.getElementById(activeConfig.deliveryChargeInputId);
    
    if (!divisionName) return;

    const config = getProductDeliveryConfig();
    let charge = 0;

    if (divisionName === "ঢাকা") {
      charge = config.inside;
    } else {
      charge = config.outside;
    }

    // Set value in hidden input (for order submission)
    if (chargeInput) {
      chargeInput.value = charge;
    }

    // Show to customer if display element exists (optional, not select box)
    if (chargeDisplay) {
      chargeDisplay.textContent = `ডেলিভারি চার্জ: ${charge} টাকা`;
      chargeDisplay.setAttribute('data-charge', charge);
    }

    // Dispatch custom event so other scripts can listen
    const event = new CustomEvent('ghotiDeliveryChargeUpdated', { detail: { division: divisionName, charge: charge } });
    document.dispatchEvent(event);

    console.log(`[GHOTI] Division: ${divisionName} => Delivery Charge Auto Set: ${charge} Tk (Inside:${config.inside}, Outside:${config.outside})`);
  }

  function populateSelect(element, placeholderText, optionsList = []) {
    if (!element) return;
    element.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = placeholderText;
    element.appendChild(defaultOption);
    optionsList.forEach(function (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      element.appendChild(option);
    });
  }

  function initAddressDropdowns(userConfig) {
    if (userConfig && typeof userConfig === "object") {
      activeConfig = { ...DEFAULT_CONFIG, ...userConfig };
    }

    const divisionSelect = document.getElementById(activeConfig.divisionId);
    const districtSelect = document.getElementById(activeConfig.districtId);
    const upazilaSelect = document.getElementById(activeConfig.upazilaId);

    if (!divisionSelect || !districtSelect || !upazilaSelect) {
      return false;
    }

    districtSelect.disabled = true;
    upazilaSelect.disabled = true;

    const divisions = Object.keys(BD_ADDRESS_DATABASE);
    populateSelect(divisionSelect, "বিভাগ নির্বাচন করুন", divisions);
    populateSelect(districtSelect, "জেলা নির্বাচন করুন", []);
    populateSelect(upazilaSelect, "উপজেলা/থানা নির্বাচন করুন", []);

    // ====== FIX 1 & 2: Division change => District + Auto Delivery Charge ======
    divisionSelect.addEventListener("change", function () {
      const selectedDivision = this.value;
      populateSelect(districtSelect, "জেলা নির্বাচন করুন", []);
      populateSelect(upazilaSelect, "উপজেলা/থানা নির্বাচন করুন", []);
      districtSelect.disabled = true;
      upazilaSelect.disabled = true;

      if (selectedDivision && BD_ADDRESS_DATABASE[selectedDivision]) {
        const districts = Object.keys(BD_ADDRESS_DATABASE[selectedDivision].districts);
        populateSelect(districtSelect, "জেলা নির্বাচন করুন", districts);
        districtSelect.disabled = false;

        // AUTO SET DELIVERY CHARGE HERE - Boss's point 1 & 4
        setAutoDeliveryCharge(selectedDivision);
      }
    });

    districtSelect.addEventListener("change", function () {
      const selectedDivision = divisionSelect.value;
      const selectedDistrict = this.value;
      populateSelect(upazilaSelect, "উপজেলা/থানা নির্বাচন করুন", []);
      upazilaSelect.disabled = true;

      if (selectedDivision && selectedDistrict && BD_ADDRESS_DATABASE[selectedDivision] && BD_ADDRESS_DATABASE[selectedDivision].districts[selectedDistrict]) {
        const upazilas = BD_ADDRESS_DATABASE[selectedDivision].districts[selectedDistrict].upazilas;
        populateSelect(upazilaSelect, "উপজেলা/থানা নির্বাচন করুন", upazilas);
        upazilaSelect.disabled = false;
      }
    });

    // ====== FIX 3: Image Selection Logic ======
    initImageSelection();

    return true;
  }

  // ====== FIX 3: Image Selection - Which image clicked saves ======
  function initImageSelection() {
    const selectedImageInput = document.getElementById(activeConfig.selectedImageInputId);
    const thumbs = document.querySelectorAll('.product-thumb, [data-product-thumb], .ghoti-thumb');
    const mainImage = document.querySelector('.main-image, #main-product-image, [data-main-image]');

    if (!selectedImageInput && thumbs.length === 0) {
      // No image system found, create one dynamically
      return;
    }

    // Set initial selected image to first image if exists
    if (mainImage && selectedImageInput && !selectedImageInput.value) {
      selectedImageInput.value = mainImage.src;
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', function() {
        let imgSrc = this.src || this.getAttribute('data-src') || this.querySelector('img')?.src;
        if (!imgSrc) return;

        // Update hidden input - this is what will be saved on order
        if (selectedImageInput) {
          selectedImageInput.value = imgSrc;
        }

        // Also update global for other scripts
        global.GHOTI_SELECTED_IMAGE = imgSrc;

        // Update main image display
        if (mainImage) {
          mainImage.src = imgSrc;
        }

        // Visual feedback - active class
        thumbs.forEach(t => t.classList.remove('active-thumb'));
        this.classList.add('active-thumb');

        console.log(`[GHOTI] Image selected: ${imgSrc}`);
        
        const event = new CustomEvent('ghotiImageSelected', { detail: { imageUrl: imgSrc } });
        document.dispatchEvent(event);
      });
    });
  }

  // Auto init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initAddressDropdowns(); });
  } else {
    initAddressDropdowns();
  }

  global.BangladeshAddress = {
    init: initAddressDropdowns,
    getSelectedAddress: function () {
      const divisionSelect = document.getElementById(activeConfig.divisionId);
      const districtSelect = document.getElementById(activeConfig.districtId);
      const upazilaSelect = document.getElementById(activeConfig.upazilaId);
      return {
        division: divisionSelect ? divisionSelect.value : "",
        district: districtSelect ? districtSelect.value : "",
        upazila: upazilaSelect ? upazilaSelect.value : "",
        deliveryCharge: document.getElementById(activeConfig.deliveryChargeInputId)?.value || "",
        selectedImage: document.getElementById(activeConfig.selectedImageInputId)?.value || global.GHOTI_SELECTED_IMAGE || ""
      };
    },
    getRawData: function () { return BD_ADDRESS_DATABASE; },
    getDivisions: function () { return Object.keys(BD_ADDRESS_DATABASE); },
    getDistricts: function (divisionName) {
      if (divisionName && BD_ADDRESS_DATABASE[divisionName]) {
        return Object.keys(BD_ADDRESS_DATABASE[divisionName].districts);
      }
      return [];
    },
    getUpazilas: function (divisionName, districtName) {
      if (divisionName && districtName && BD_ADDRESS_DATABASE[divisionName] && BD_ADDRESS_DATABASE[divisionName].districts[districtName]) {
        return BD_ADDRESS_DATABASE[divisionName].districts[districtName].upazilas;
      }
      return [];
    },
    // New helpers
    setDeliveryCharge: setAutoDeliveryCharge,
    getProductConfig: getProductDeliveryConfig
  };

})(typeof window !== "undefined" ? window : this);
বস দেখেন তো এখানে সকল থানা/জেলা/বিভাগ আছে কিনা
