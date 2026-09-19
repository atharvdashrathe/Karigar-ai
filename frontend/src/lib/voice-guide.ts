/**
 * CENTRAL VOICE GUIDE SYSTEM — Karigar AI
 * -------------------------------------------------------------
 * Provides simple, non-annoying audio narration and page guidance
 * for rural artisans and buyers across 8 Indian languages:
 * English (en), Hindi (hi), Marathi (mr), Bengali (bn),
 * Tamil (ta), Telugu (te), Kannada (kn), Gujarati (gu).
 */
import { type Lang } from "@/lib/i18n";

const LANG_VOICE_TAGS: Record<Lang, string[]> = {
  hi: ["hi-IN", "hi_IN", "hi"],
  mr: ["mr-IN", "mr_IN", "mr", "hi-IN"],
  bn: ["bn-IN", "bn_IN", "bn-BD", "bn"],
  ta: ["ta-IN", "ta_IN", "ta-LK", "ta"],
  te: ["te-IN", "te_IN", "te"],
  kn: ["kn-IN", "kn_IN", "kn"],
  gu: ["gu-IN", "gu_IN", "gu"],
  en: ["en-IN", "en-GB", "en-US", "en"],
};

export type PageExplanationKey =
  | "dashboard"
  | "sell"
  | "sell_photo"
  | "sell_voice"
  | "sell_listing"
  | "sell_pricing"
  | "sell_ready"
  | "sell_success"
  | "products"
  | "marketplace"
  | "product_detail"
  | "orders"
  | "earnings"
  | "marketing"
  | "ai_tools"
  | "profile";

export const VOICE_EXPLANATIONS: Record<PageExplanationKey, Record<Lang, string>> = {
  dashboard: {
    en: "Welcome to your Karigar dashboard. Here you can sell products, see your products, check orders and view your earnings.",
    hi: "आपके कारीगर डैशबोर्ड में स्वागत है। यहाँ आप नए उत्पाद बेच सकते हैं, अपने उत्पाद देख सकते हैं, ग्राहकों के ऑर्डर चेक कर सकते हैं और अपनी कमाई देख सकते हैं।",
    mr: "तुमच्या कारागीर डॅशबोर्डवर स्वागत आहे. येथे तुम्ही नवीन उत्पादने विकू शकता, तुमची उत्पादने पाहू शकता, ऑर्डर तपासू शकता आणि तुमची कमाई पाहू शकता.",
    bn: "আপনার কারিগর ড্যাশবোর্ডে স্বাগতম। এখানে আপনি পণ্য বিক্রি করতে পারেন, আপনার পণ্য দেখতে পারেন, অর্ডার চেক করতে পারেন এবং আপনার আয় দেখতে পারেন।",
    ta: "உங்கள் காரிகர் டாஷ்போர்டிற்கு நல்வரவு. இங்கே நீங்கள் தயாரிப்புகளை விற்கலாம், ஆர்டர்களை சரிபார்க்கலாம் மற்றும் உங்கள் வருவாயைக் காணலாம்.",
    te: "మీ కారిగర్ డాష్‌బోర్డ్‌కు స్వాగతం. ఇక్కడ మీరు ఉత్పత్తులను అమ్మవచ్చు, ఆర్డర్‌లను తనిఖీ చేయవచ్చు మరియు మీ ఆదాయాన్ని చూడవచ్చు.",
    kn: "ನಿಮ್ಮ ಕಾರಿಗರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸುಸ್ವಾಗತ. ಇಲ್ಲಿ ನೀವು ಉತ್ಪನ್ನಗಳನ್ನು ಮಾರಾಟ ಮಾಡಬಹುದು, ಆರ್ಡರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು ಮತ್ತು ನಿಮ್ಮ ಗಳಿಕೆಯನ್ನು ನೋಡಬಹುದು.",
    gu: "તમારા કારીગર ડેશબોર્ડમાં આપનું સ્વાગત છે. અહીં તમે ઉત્પાદનો વેચી શકો છો, તમારા ઉત્પાદનો જોઈ શકો છો, ઓર્ડર ચકાસી શકો છો અને તમારી કમાણી જોઈ શકો છો.",
  },
  sell: {
    en: "Here you can create a new product. You can add a photo or tell us about your product using your voice.",
    hi: "यहाँ आप अपना नया उत्पाद बना सकते हैं। आप फोटो जोड़ सकते हैं या अपनी आवाज़ में बोलकर उत्पाद की जानकारी दे सकते हैं।",
    mr: "येथे तुम्ही तुमचे नवीन उत्पादन तयार करू शकता. तुम्ही फोटो जोडू शकता किंवा तुमच्या आवाजात उत्पादनाची माहिती सांगू शकता.",
    bn: "এখানে আপনি একটি নতুন পণ্য তৈরি করতে পারেন। আপনি ছবি যোগ করতে পারেন বা কণ্ঠস্বর দিয়ে পণ্য সম্পর্কে বলতে পারেন।",
    ta: "இங்கே நீங்கள் ஒரு புதிய தயாரிப்பை உருவாக்கலாம். நீங்கள் ஒரு புகைப்படத்தைச் சேர்க்கலாம் அல்லது உங்கள் குரலைப் பயன்படுத்தி தயாரிப்பைப் பற்றி சொல்லலாம்.",
    te: "ఇక్కడ మీరు కొత్త ఉత్పత్తిని సృష్టించవచ్చు. మీరు ఫోటోను జోడించవచ్చు లేదా మీ వాయిస్‌ని ఉపయోగించి మీ ఉత్పత్తి గురించి చెప్పవచ్చు.",
    kn: "ಇಲ್ಲಿ ನೀವು ಹೊಸ ಉತ್ಪನ್ನವನ್ನು ರಚಿಸಬಹುದು. ನೀವು ಫೋಟೋವನ್ನು ಸೇರಿಸಬಹುದು ಅಥವಾ ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಬಳಸಿಕೊಂಡು ಉತ್ಪನ್ನದ ವಿವರಗಳನ್ನು ಹೇಳಬಹುದು.",
    gu: "અહીં તમે નવું ઉત્પાદન બનાવી શકો છો. તમે ફોટો ઉમેરી શકો છો અથવા તમારા અવાજનો ઉપયોગ કરીને ઉત્પાદન વિશે જણાવી શકો છો.",
  },
  sell_photo: {
    en: "First, add a photo of your product. You can take a new photo or choose one from your phone.",
    hi: "पहले, अपने उत्पाद का फोटो जोड़ें। आप नया फोटो खींच सकते हैं या अपने फोन से चुन सकते हैं।",
    mr: "प्रथम, तुमच्या उत्पादनाचा फोटो जोडा. तुम्ही नवीन फोटो काढू शकता किंवा तुमच्या फोनमधून निवडू शकता.",
    bn: "প্রথমে, আপনার পণ্যের একটি ছবি যোগ করুন। আপনি একটি নতুন ছবি তুলতে পারেন বা আপনার ফোন থেকে বেছে নিতে পারেন।",
    ta: "முதலில், உங்கள் தயாரிப்பின் புகைப்படத்தைச் சேர்க்கவும். நீங்கள் புதிய புகைப்படம் எடுக்கலாம் அல்லது உங்கள் போனிலிருந்து தேர்ந்தெடுக்கலாம்.",
    te: "ముందుగా, మీ ఉత్పత్తి ఫోటోను జోడించండి. మీరు కొత్త ఫోటో తీయవచ్చు లేదా మీ ఫోన్ నుండి ఎంచుకోవచ్చు.",
    kn: "ಮೊದಲು, ನಿಮ್ಮ ಉತ್ಪನ್ನದ ಫೋಟೋ ಸೇರಿಸಿ. ನೀವು ಹೊಸ ಫೋಟೋ ತೆಗೆಯಬಹುದು ಅಥವಾ ನಿಮ್ಮ ಫೋನ್‌ನಿಂದ ಆಯ್ಕೆ ಮಾಡಬಹುದು.",
    gu: "પ્રથમ, તમારા ઉત્પાદનનો ફોટો ઉમેરો. તમે નવો ફોટો લઈ શકો છો અથવા તમારા ફોનમાંથી પસંદ કરી શકો છો.",
  },
  sell_voice: {
    en: "Now tell me about your product. You can speak in your local language.",
    hi: "अब मुझे अपने उत्पाद के बारे में बताएं। आप अपनी मातृभाषा में आसानी से बोल सकते हैं।",
    mr: "आता मला तुमच्या उत्पादनाबद्दल सांगा. तुम्ही तुमच्या भाषेत सहज बोलू शकता.",
    bn: "এখন আমাকে আপনার পণ্য সম্পর্কে বলুন। আপনি আপনার স্থানীয় ভাষায় কথা বলতে পারেন।",
    ta: "இப்போது உங்கள் தயாரிப்பைப் பற்றி என்னிடம் கூறுங்கள். நீங்கள் உங்கள் சொந்த மொழியில் பேசலாம்.",
    te: "ఇప్పుడు మీ ఉత్పత్తి గురించి నాకు చెప్పండి. మీరు మీ స్థానిక భాషలో మాట్లాడవచ్చు.",
    kn: "ಈಗ ನಿಮ್ಮ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ ನನಗೆ ತಿಳಿಸಿ. ನೀವು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಬಹುದು.",
    gu: "હવે મને તમારા ઉત્પાદન વિશે કહો. તમે તમારી સ્થાનિક ભાષામાં બોલી શકો છો.",
  },
  sell_listing: {
    en: "I have prepared your product information. Please check it before publishing.",
    hi: "मैंने आपकी उत्पाद जानकारी तैयार कर ली है। कृपया प्रकाशित करने से पहले इसकी जांच कर लें।",
    mr: "मी तुमच्या उत्पादनाची माहिती तयार केली आहे. कृपया प्रकाशित करण्यापूर्वी ती तपासून घ्या.",
    bn: "আমি আপনার পণ্যের তথ্য প্রস্তুত করেছি। প্রকাশ করার আগে অনুগ্রহ করে দেখে নিন।",
    ta: "உங்கள் தயாரிப்பு தகவலை நான் தயார் செய்துவிட்டேன். வெளியிடுவதற்கு முன் அதைச் சரிபார்க்கவும்.",
    te: "నేను మీ ఉత్పత్తి సమాచారాన్ని సిద్ధం చేసాను. ప్రచురించే ముందు దయచేసి తనిఖీ చేయండి.",
    kn: "ನಾನು ನಿಮ್ಮ ಉತ್ಪನ್ನದ ಮಾಹಿತಿಯನ್ನು ಸಿದ್ಧಪಡಿಸಿದ್ದೇನೆ. ಪ್ರಕಟಿಸುವ ಮೊದಲು ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.",
    gu: "મેં તમારી ઉત્પાદન માહિતી તૈયાર કરી છે. કૃપા કરીને પ્રકાશિત કરતા પહેલા તેને તપાસો.",
  },
  sell_pricing: {
    en: "Please check the product price. You can change it if needed.",
    hi: "कृपया उत्पाद की कीमत जांचें। यदि आवश्यक हो तो आप इसे बदल सकते हैं।",
    mr: "कृपया उत्पादनाची किंमत तपासा. गरज भासल्यास तुम्ही ती बदलू शकता.",
    bn: "অনুগ্রহ করে পণ্যের মূল্য পরীক্ষা করুন। প্রয়োজনে পরিবর্তন করতে পারেন।",
    ta: "தயாரிப்பு விலையை சரிபார்க்கவும். தேவைப்பட்டால் மாற்றலாம்.",
    te: "దయచేసి ఉత్పత్తి ధరను తనిఖీ చేయండి. అవసరమైతే మార్చవచ్చు.",
    kn: "ದಯವಿಟ್ಟು ಉತ್ಪನ್ನದ ಬೆಲೆಯನ್ನು ಪರಿಶೀಲಿಸಿ. ಅಗತ್ಯವಿದ್ದರೆ ನೀವು ಬದಲಾಯಿಸಬಹುದು.",
    gu: "કૃપા કરીને ઉત્પાદનની કિંમત તપાસો. જો જરૂરી હોય તો તમે તેને બદલી શકો છો.",
  },
  sell_ready: {
    en: "Your product is ready. Would you like to publish it so customers can see it?",
    hi: "आपका उत्पाद तैयार है। क्या आप इसे प्रकाशित करना चाहते हैं ताकि ग्राहक इसे बाज़ार में देख सकें?",
    mr: "तुमचे उत्पादन तयार आहे. ग्राहक ते पाहू शकतील यासाठी तुम्ही ते प्रकाशित करू इच्छिता का?",
    bn: "আপনার পণ্য প্রস্তুত। আপনি কি এটি প্রকাশ করতে চান যাতে ক্রেতারা দেখতে পারেন?",
    ta: "உங்கள் தயாரிப்பு தயாராக உள்ளது. வாடிக்கையாளர்கள் பார்க்கும்படி வெளியிட விரும்புகிறீர்களா?",
    te: "మీ ఉత్పత్తి సిద్ధంగా ఉంది. కస్టమర్‌లు చూసేలా మీరు దీన్ని ప్రచురించాలనుకుంటున్నారా?",
    kn: "ನಿಮ್ಮ ಉತ್ಪನ್ನ ಸಿದ್ಧವಾಗಿದೆ. ಗ್ರಾಹಕರು ನೋಡುವಂತೆ ನೀವು ಅದನ್ನು ಪ್ರಕಟಿಸಲು ಬಯಸುವಿರಾ?",
    gu: "તમારું ઉત્પાદન તૈયાર છે. શું તમે તેને પ્રકાશિત કરવા માંગો છો જેથી ગ્રાહકો તેને જોઈ શકે?",
  },
  sell_success: {
    en: "Your product has been published successfully. Customers can now see it in the marketplace.",
    hi: "आपका उत्पाद सफलतापूर्वक प्रकाशित हो गया है। ग्राहक अब इसे बाज़ार में देख सकते हैं और ऑर्डर भेज सकते हैं।",
    mr: "तुमचे उत्पादन यशस्वीरीत्या प्रकाशित झाले आहे. ग्राहक आता ते बाजारपेठेत पाहू शकतात आणि चौकशी पाठवू शकतात.",
    bn: "আপনার পণ্য সফলভাবে প্রকাশিত হয়েছে। গ্রাহকরা এখন এটি বাজারে দেখতে পাবেন।",
    ta: "உங்கள் தயாரிப்பு வெற்றிகரமாக வெளியிடப்பட்டது. வாடிக்கையாளர்கள் இப்போது சந்தையில் பார்க்கலாம்.",
    te: "మీ ఉత్పత్తి విజయవంతంగా ప్రచురించబడింది. కస్టమర్‌లు ఇప్పుడు మార్కెట్‌లో చూడగలరు.",
    kn: "ನಿಮ್ಮ ಉತ್ಪನ್ನವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪ್ರಕಟಿಸಲಾಗಿದೆ. ಗ್ರಾಹಕರು ಈಗ ಅದನ್ನು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ನೋಡಬಹುದು.",
    gu: "તમારું ઉત્પાદન સફળતાપૂર્વક પ્રકાશિત થયું છે. ગ્રાહકો હવે તેને બજારમાં જોઈ શકે છે.",
  },
  products: {
    en: "Here you can see the products you have added, manage stock, and edit details.",
    hi: "यहाँ आप अपने द्वारा जोड़े गए उत्पाद देख सकते हैं, स्टॉक प्रबंधित कर सकते हैं और विवरण बदल सकते हैं।",
    mr: "येथे तुम्ही जोडलेली उत्पादने पाहू शकता, साठा व्यवस्थापित करू शकता आणि माहिती बदलू शकता.",
    bn: "এখানে আপনি আপনার যোগ করা পণ্যগুলি দেখতে পারেন এবং স্টক পরিচালনা করতে পারেন।",
    ta: "இங்கே நீங்கள் சேர்த்த தயாரிப்புகளைப் பார்க்கலாம் மற்றும் இருப்பை நிர்வகிக்கலாம்.",
    te: "ఇక్కడ మీరు జోడించిన ఉత్పత్తులను చూడవచ్చు మరియు స్టాక్‌ను నిర్వహించవచ్చు.",
    kn: "ಇಲ್ಲಿ ನೀವು ಸೇರಿಸಿದ ಉತ್ಪನ್ನಗಳನ್ನು ನೋಡಬಹುದು ಮತ್ತು ದಾಸ್ತಾನು ನಿರ್ವಹಿಸಬಹುದು.",
    gu: "અહીં તમે તમારા ઉમેરેલા ઉત્પાદનો જોઈ શકો છો અને સ્ટોક મેનેજ કરી શકો છો.",
  },
  marketplace: {
    en: "Welcome to the marketplace. Here you can find authentic handmade products made by Indian artisans.",
    hi: "बाज़ार में आपका स्वागत है। यहाँ आप भारतीय कारीगरों द्वारा हस्तनिर्मित प्रामाणिक उत्पाद देख सकते हैं और खरीद सकते हैं।",
    mr: "बाजारपेठेत आपले स्वागत आहे. येथे तुम्ही भारतीय कारागिरांनी हाताने तयार केलेल्या अस्सल वस्तू पाहू शकता आणि खरेदी करू शकता.",
    bn: "মার্কেটপ্লেসে স্বাগতম। এখানে আপনি ভারতীয় কারিগরদের হাতে তৈরি খাঁটি পণ্য পাবেন।",
    ta: "சந்தைக்கு நல்வரவு. இங்கே நீங்கள் கைவினைஞர்களால் உருவாக்கப்பட்ட உண்மையான கைவினைப் பொருட்களைக் காணலாம்.",
    te: "మార్కెట్‌ప్లేస్‌కు స్వాగతం. ఇక్కడ మీరు కళాకారులు తయారు చేసిన ప్రామాణિક చేతితో తయారు చేసిన ఉత్పత్తులను కనుగొనవచ్చు.",
    kn: "ಮಾರುಕಟ್ಟೆಗೆ ಸುಸ್ವಾಗತ. ಇಲ್ಲಿ ನೀವು ಭಾರತೀಯ ಕುಶಲಕರ್ಮಿಗಳು ತಯಾರಿಸಿದ ಅಪ್ಪಟ ಕರಕುಶಲ ಉತ್ಪನ್ನಗಳನ್ನು ಕಾಣಬಹುದು.",
    gu: "બજારમાં આપનું સ્વાગત છે. અહીં તમે ભારતીય કારીગરો દ્વારા બનાવેલા અધિકૃત ઉત્પાદનો મેળવી શકો છો.",
  },
  product_detail: {
    en: "Here you can see the product story, artisan details, fair pricing, and send enquiries directly to the maker.",
    hi: "यहाँ आप उत्पाद की कहानी, कारीगर का विवरण, उचित मूल्य देख सकते हैं और सीधे कारीगर को संदेश भेज सकते हैं।",
    mr: "येथे तुम्ही उत्पादनाची कथा, कारागिराची माहिती, रास्त किंमत पाहू शकता आणि थेट कारागिराशी संपर्क साधू शकता.",
    bn: "এখানে আপনি পণ্যের গল্প, কারিগরের বিবরণ এবং সরাসরি প্রস্তুতকারককে বার্তা পাঠাতে পারেন।",
    ta: "இங்கே நீங்கள் தயாரிப்புக் கதை, கைவினைஞர் விவரங்கள் மற்றும் நேரடியாக விசாரணைகளை அனுப்பலாம்.",
    te: "ఇక్కడ మీరు ఉత్పత్తి కథ, కళాకారుడి వివరాలు మరియు తయారీదారునికి నేరుగా సందేశం పంపవచ్చు.",
    kn: "ಇಲ್ಲಿ ನೀವು ಉತ್ಪನ್ನದ ಕಥೆ, ಕುಶಲಕರ್ಮಿಗಳ ವಿವರಗಳು ಮತ್ತು ನೇರವಾಗಿ ಸಂದೇಶ ಕಳುಹಿಸಬಹುದು.",
    gu: "અહીં તમે ઉત્પાદનની વાર્તા, કારીગરની વિગતો જોઈ શકો છો અને સીધો સંપર્ક કરી શકો છો.",
  },
  orders: {
    en: "Here you can see the customer orders received for your handmade products and update their delivery status.",
    hi: "यहाँ आप अपने हस्तनिर्मित उत्पादों के लिए प्राप्त ग्राहक ऑर्डर देख सकते हैं और डिलीवरी स्थिति अपडेट कर सकते हैं।",
    mr: "येथे तुम्ही तुमच्या उत्पादनांसाठी आलेल्या ग्राहकांच्या ऑर्डर्स पाहू शकता आणि त्यांची स्थिती तपासू शकता.",
    bn: "এখানে আপনি আপনার পণ্যের জন্য প্রাপ্ত গ্রাহক অর্ডার দেখতে পারেন।",
    ta: "இங்கே உங்கள் தயாரிப்புகளுக்காக பெறப்பட்ட வாடிக்கையாளர் ஆர்டர்களைக் காணலாம்.",
    te: "ఇక్కడ మీరు మీ ఉత్పత్తుల కోసం వచ్చిన కస్టమర్ ఆర్డర్‌లను చూడవచ్చు.",
    kn: "ಇಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಉತ್ಪನ್ನಗಳಿಗಾಗಿ ಸ್ವೀಕರಿಸಿದ ಗ್ರಾಹಕ ಆರ್ಡರ್‌ಗಳನ್ನು ನೋಡಬಹುದು.",
    gu: "અહીં તમે તમારા ઉત્પાદનો માટે મળેલા ગ્રાહક ઓર્ડર જોઈ શકો છો.",
  },
  earnings: {
    en: "Here you can view your total earnings, completed sales, and payout balance.",
    hi: "यहाँ आप अपनी कुल कमाई, पूरी हुई बिक्री और बैंक भुगतान राशि देख सकते हैं।",
    mr: "येथे तुम्ही तुमची एकूण कमाई, पूर्ण झालेली विक्री आणि बँक खात्यातील रक्कम पाहू शकता.",
    bn: "এখানে আপনি আপনার মোট আয় এবং বিক্রয় দেখতে পারেন।",
    ta: "இங்கே உங்கள் மொத்த வருவாய் மற்றும் விற்பனையைக் காணலாம்.",
    te: "ఇక్కడ మీరు మీ మొత్తం ఆదాయం మరియు అమ్మకాలను చూడవచ్చు.",
    kn: "ಇಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಒಟ್ಟು ಗಳಿಕೆ ಮತ್ತು ಮಾರಾಟವನ್ನು ನೋಡಬಹುದು.",
    gu: "અહીં તમે તમારી કુલ કમાણી અને વેચાણ જોઈ શકો છો.",
  },
  marketing: {
    en: "This AI tool helps you create promotional messages for WhatsApp, Instagram, and video reels in seconds.",
    hi: "यह एआई टूल आपको व्हाट्सएप, इंस्टाग्राम और वीडियो रील्स के लिए सुंदर प्रचार संदेश बनाने में मदद करता है।",
    mr: "हे एआय टूल तुम्हाला व्हॉट्सॲप, इंस्टाग्राम आणि व्हिडिओ रील्ससाठी आकर्षक प्रचार संदेश तयार करण्यास मदत करते.",
    bn: "এই এআই টুল আপনাকে হোয়াটসঅ্যাপ ও ইনস্টাগ্রামের জন্য প্রচারমূলক বার্তা তৈরি করতে সহায়তা করে।",
    ta: "இந்த AI கருவி WhatsApp மற்றும் Instagram க்கான விளம்பர செய்திகளை உருவாக்க உதவுகிறது.",
    te: "ఈ AI సాధనం WhatsApp మరియు Instagram కోసం ప్రచార సందేశాలను సృష్టించడానికి సహాయపడుతుంది.",
    kn: "ಈ AI ಉಪಕರಣವು WhatsApp ಮತ್ತು Instagram ಗಾಗಿ ಸಂದೇಶಗಳನ್ನು ರಚಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
    gu: "આ AI ટૂલ તમને WhatsApp અને Instagram માટે પ્રચાર સંદેશાઓ બનાવવામાં મદદ કરે છે.",
  },
  ai_tools: {
    en: "Karigar AI tools help you enhance photos, calculate fair prices, and write multilingual descriptions.",
    hi: "कारीगर एआई उपकरण आपके फोटो सुधारने, सही कीमत तय करने और कई भाषाओं में विवरण लिखने में मदद करते हैं।",
    mr: "कारागीर एआय साधने तुमचे फोटो सुधारण्यास, योग्य किंमत ठरवण्यास आणि अनेक भाषांमध्ये माहिती लिहिण्यास मदत करतात.",
    bn: "কারিগর এআই সরঞ্জামগুলি আপনাকে ছবি উন্নত করতে এবং সঠিক দাম নির্ধারণ করতে সহায়তা করে।",
    ta: "காரிகர் AI கருவிகள் புகைப்படங்களை மேம்படுத்தவும் நியாயமான விலையை நிர்ணயிக்கவும் உதவுகின்றன.",
    te: "కారిగర్ AI సాధనాలు ఫోటోలను మెరుగుపరచడానికి మరియు సరైన ధరను నిర్ణయించడానికి సహాయపడతాయి.",
    kn: "ಕಾರಿಗರ್ AI ಉಪಕರಣಗಳು ಫೋಟೋಗಳನ್ನು ಸುಧಾರಿಸಲು ಮತ್ತು ಸರಿಯಾದ ಬೆಲೆಯನ್ನು ನಿರ್ಧರಿಸಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.",
    gu: "કારીગર AI ટૂલ્સ ફોટા સુધારવા અને યોગ્ય કિંમત નક્કી કરવામાં મદદ કરે છે.",
  },
  profile: {
    en: "Here you can update your artisan profile, craft details, location, and preferred language.",
    hi: "यहाँ आप अपना कारीगर प्रोफाइल, शिल्प विवरण, पता और पसंदीदा भाषा अपडेट कर सकते हैं।",
    mr: "येथे तुम्ही तुमचे कारागीर प्रोफाइल, कलेचा प्रकार, पत्ता आणि भाषा बदलू शकता.",
    bn: "এখানে আপনি আপনার প্রোফাইল এবং পছন্দের ভাষা আপডেট করতে পারেন।",
    ta: "இங்கே உங்கள் சுயவிவரம் மற்றும் மொழியைப் புதுப்பிக்கலாம்.",
    te: "ఇక్కడ మీరు మీ ప్రొఫైల్ మరియు భాషను అప్‌డేట్ చేయవచ్చు.",
    kn: "ಇಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಭಾಷೆಯನ್ನು ನವೀಕರಿಸಬಹುದು.",
    gu: "અહીં તમે તમારી પ્રોફાઇલ અને ભાષા અપડેટ કરી શકો છો.",
  },
};

class VoiceGuideManager {
  private isSpeaking = false;
  private isMuted = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private listeners: Set<(speaking: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      const savedMute = localStorage.getItem("karigar_voice_muted");
      this.isMuted = savedMute === "true";
    }
  }

  public subscribe(listener: (speaking: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.isSpeaking));
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("karigar_voice_muted", String(muted));
      if (muted) {
        this.stop();
      }
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public stop() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.notify();
  }

  public speak(text: string, lang: Lang = "en") {
    if (this.isMuted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    this.stop();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Select voice matching language
      const voices = window.speechSynthesis.getVoices();
      const tags = LANG_VOICE_TAGS[lang] || LANG_VOICE_TAGS["en"];
      
      let matchedVoice = voices.find((v) =>
        tags.some((tag) => v.lang.toLowerCase().replace("_", "-").startsWith(tag.toLowerCase()))
      );

      // Fallback: any Indian English or default voice
      if (!matchedVoice && lang !== "en") {
        matchedVoice = voices.find((v) => v.lang.includes("hi") || v.lang.includes("IN"));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = tags[0] || "en-IN";
      }

      utterance.rate = 0.95; // Slightly slower, clear cadence for rural friendliness
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.notify();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notify();
      };

      utterance.onerror = (e) => {
        console.warn("SpeechSynthesis error:", e);
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.notify();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
      this.isSpeaking = false;
      this.notify();
    }
  }

  public explainPage(key: PageExplanationKey, lang: Lang = "en") {
    const text = VOICE_EXPLANATIONS[key]?.[lang] || VOICE_EXPLANATIONS[key]?.["en"];
    if (text) {
      this.speak(text, lang);
    }
  }

  public announceSuccess(message: string, lang: Lang = "en") {
    this.speak(message, lang);
  }

  public announceError(message: string, lang: Lang = "en") {
    this.speak(message, lang);
  }
}

export const voiceGuide = new VoiceGuideManager();
