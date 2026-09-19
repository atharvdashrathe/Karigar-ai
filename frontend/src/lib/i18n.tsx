import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Multilingual Translation System for Karigar AI.
 * Supports 8 Indian Regional Languages:
 * English, Hindi, Marathi, Bengali, Tamil, Telugu, Kannada, Gujarati.
 */
export type Lang = "en" | "hi" | "mr" | "bn" | "ta" | "te" | "kn" | "gu";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

type Dict = Record<string, Record<Lang, string>>;

const DICT: Dict = {
  // brand
  tagline: {
    en: "From Craft to Commerce — Powered by AI",
    hi: "शिल्प से व्यापार तक — एआई द्वारा समर्थित",
    mr: "कलेपासून व्यापारापर्यंत — एआय समर्थित",
    bn: "শিল্প থেকে বাণিজ্য — এআই দ্বারা চালিত",
    ta: "கைவினை முதல் வர்த்தகம் வரை — AI இயக்கத்தில்",
    te: "కళ నుండి వ్యాపారం వరకు — AI ఆధారిత",
    kn: "ಕರಕುಶಲತೆಯಿಂದ ವಾಣಿಜ್ಯದವರೆಗೆ — AI ಆಧಾರಿತ",
    gu: "શિલ્પથી વેપાર સુધી — AI દ્વારા સંચાલિત",
  },
  // navigation
  dashboard: {
    en: "Dashboard",
    hi: "डैशबोर्ड",
    mr: "डॅशबोर्ड",
    bn: "ড্যাশবোর্ড",
    ta: "டாஷ்போர்டு",
    te: "డ్యాష్‌బోర్డ్",
    kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    gu: "ડેશબોર્ડ",
  },
  products: {
    en: "Products",
    hi: "उत्पाद",
    mr: "उत्पादने",
    bn: "পণ্যসমূহ",
    ta: "தயாரிப்புகள்",
    te: "ఉత్పత్తులు",
    kn: "ಉತ್ಪನ್ನಗಳು",
    gu: "ઉત્પાદનો",
  },
  addProduct: {
    en: "Sell Something",
    hi: "कुछ बेचें (Sell)",
    mr: "काहीतरी विका (Sell)",
    bn: "কিছু বিক্রি করুন",
    ta: "விற்பனை செய்க",
    te: "ఏదైనా అమ్మండి",
    kn: "ಮಾರಾಟ ಮಾಡಿ",
    gu: "કંઈક વેચો",
  },
  sellSomething: {
    en: "Sell Something",
    hi: "कुछ बेचें (Sell)",
    mr: "काहीतरी विका (Sell)",
    bn: "কিছু বিক্রি করুন",
    ta: "விற்பனை செய்க",
    te: "ఏదైనా అమ్మండి",
    kn: "ಮಾರಾಟ ಮಾಡಿ",
    gu: "કંઈક વેચો",
  },
  marketplace: {
    en: "Marketplace",
    hi: "बाज़ार (Market)",
    mr: "बाजारपेठ",
    bn: "মার্কেটপ্লেস",
    ta: "சந்தை",
    te: "మార్కెట్‌ప్లేస్",
    kn: "ಮಾರುಕಟ್ಟೆ",
    gu: "બજાર",
  },
  collectives: {
    en: "Collectives",
    hi: "कारीगर समूह",
    mr: "कारीगर संघ",
    bn: "কারিগর গোষ্ঠী",
    ta: "கூட்டமைப்புகள்",
    te: "సమూహాలు",
    kn: "ಸಂಘಗಳು",
    gu: "કારીગર જૂથો",
  },
  enquiries: {
    en: "Enquiries",
    hi: "पूछताछ",
    mr: "चौकशी",
    bn: "অনুসন্ধান",
    ta: "விசாரணைகள்",
    te: "విచారణలు",
    kn: "ವಿಚಾರಣೆಗಳು",
    gu: "પૂછપરછ",
  },
  earnings: {
    en: "Earnings",
    hi: "कमाई",
    mr: "कमाई",
    bn: "আয়",
    ta: "வருவாய்",
    te: "ఆదాయం",
    kn: "ಗಳಿಕೆ",
    gu: "આવક",
  },
  profile: {
    en: "Profile",
    hi: "प्रोफ़ाइल",
    mr: "प्रोफाइल",
    bn: "প্রোফাইল",
    ta: "சுயவிவரம்",
    te: "ప్రొఫైల్",
    kn: "ಪ್ರೊಫೈಲ್",
    gu: "પ્રોફાઇલ",
  },
  admin: {
    en: "Admin",
    hi: "व्यवस्थापक (Admin)",
    mr: "प्रशासक (Admin)",
    bn: "অ্যাডমিন",
    ta: "நிர்வாகி",
    te: "అడ్మిన్",
    kn: "ನಿರ್ವಾಹಕ",
    gu: "એડમિન",
  },
  aiSaathi: {
    en: "AI Saathi",
    hi: "एआई साथी",
    mr: "एआय साथी",
    bn: "এআই সাথী",
    ta: "AI தோழன்",
    te: "AI సాథి",
    kn: "AI ಸಾಥಿ",
    gu: "AI સાથી",
  },
  marketingStudio: {
    en: "Marketing Kit",
    hi: "मार्केटिंग किट",
    mr: "मार्केटिंग किट",
    bn: "বিপণন কিট",
    ta: "சந்தைப்படுத்தல்",
    te: "మార్కెటింగ్ కిట్",
    kn: "ಮಾರ್ಕೆಟಿಂಗ್ ಕಿಟ್",
    gu: "માર્કેટિંગ કીટ",
  },
  safetyCenter: {
    en: "Scam Safety",
    hi: "सुरक्षा केंद्र",
    mr: "सुरक्षा केंद्र",
    bn: "সুরক্ষা কেন্দ্র",
    ta: "பாதுகாப்பு மையம்",
    te: "భద్రతా కేంద్రం",
    kn: "ಸುರಕ್ಷತಾ ಕೇಂದ್ರ",
    gu: "સુરક્ષા કેન્દ્ર",
  },
  // actions
  speakToSell: {
    en: "Speak to Sell",
    hi: "बोलकर बेचें",
    mr: "बोलून विक्री करा",
    bn: "কথা বলে বিক্রি করুন",
    ta: "பேசி விற்கவும்",
    te: "మాట్లాడి అమ్మండి",
    kn: "ಮಾತನಾಡಿ ಮಾರಿ",
    gu: "બોલીને વેચો",
  },
  voiceRecordHint: {
    en: "Tap microphone and describe your product in your mother tongue.",
    hi: "माइक दबाएँ और अपनी भाषा में उत्पाद का नाम, कीमत और सामग्री बताएं।",
    mr: "माईक दाबा आणि तुमच्या भाषेत उत्पादनाचे नाव, किंमत व माहिती सांगा.",
    bn: "মাইক্রোফোনে ট্যাপ করে আপনার নিজের ভাষায় পণ্যের বর্ণনা দিন।",
    ta: "மைக்ரோஃபோனைத் தட்டி உங்கள் தயாரிப்பை விவரிக்கவும்.",
    te: "మైక్రోఫోన్ నొక్కి మీ భాషలో ఉత్పత్తి వివరాలు చెప్పండి.",
    kn: "ಮೈಕ್ರೊಫೋನ್ ಒತ್ತಿ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಉತ್ಪನ್ನವನ್ನು ವಿವರಿಸಿ.",
    gu: "માઇક્રોફોન દબાવો અને તમારી ભાષામાં ઉત્પાદનની વિગતો આપો.",
  },
  smartPricing: {
    en: "Smart Pricing Calculator",
    hi: "स्मार्ट मूल्य कैलकुलेटर",
    mr: "स्मार्ट किंमत कॅल्क्युलेटर",
    bn: "স্মার্ট মূল্য ক্যালকুলেটর",
    ta: "ஸ்மார்ட் விலை கால்குலேட்டர்",
    te: "స్మార్ట్ ధర కాలిక్యులేటర్",
    kn: "ಸ್ಮಾರ್ಟ್ ಬೆಲೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
    gu: "સ્માર્ટ પ્રાઇસિંગ કેલ્ક્યુલેટર",
  },
  thankTheArtisan: {
    en: "Thank the Artisan ❤️",
    hi: "कारीगर को धन्यवाद दें ❤️",
    mr: "कारागिरांचे आभार माना ❤️",
    bn: "কারিগরকে ধন্যবাদ জানান ❤️",
    ta: "கைவினைஞருக்கு நன்றி ❤️",
    te: "కళాకారునికి ధన్యవాదాలు ❤️",
    kn: "ಕುಶಲಕರ್ಮಿಗೆ ಧನ್ಯವಾದಗಳು ❤️",
    gu: "કારીગરનો આભાર માનો ❤️",
  },
  meetTheMaker: {
    en: "Meet the Maker",
    hi: "शिल्पकार से मिलें",
    mr: "कलाकाराची ओळख",
    bn: "কারিগর পরিচিতি",
    ta: "உருவாக்கியவரை சந்திக்கவும்",
    te: "కళాకారుడిని కలవండి",
    kn: "ತಯಾರಕರನ್ನು ಭೇಟಿ ಮಾಡಿ",
    gu: "કારીગરને મળો",
  },
  hearHerStory: {
    en: "Hear Her Story",
    hi: "इनकी कहानी सुनें",
    mr: "त्यांची गोष्ट ऐका",
    bn: "তাঁর গল্প শুনুন",
    ta: "அவரது கதையைக் கேளுங்கள்",
    te: "వారి కథను వినండి",
    kn: "ಅವರ ಕಥೆಯನ್ನು ಕೇಳಿ",
    gu: "તેમની વાર્તા સાંભળો",
  },
  doorstepPickup: {
    en: "Doorstep Rural Pickup",
    hi: "घर से पिकअप सेवा",
    mr: "घरातून पार्सल पिकअप",
    bn: "দোরগোড়ায় পিকআপ",
    ta: "வீட்டு வாசல் பிக்கப்",
    te: "ఇంటి వద్దే పికప్",
    kn: "ಮನೆ ಬಾಗಿಲಲ್ಲೇ ಪಿಕಪ್",
    gu: "ઘરેથી પિકઅપ સેવા",
  },
  offlineSaved: {
    en: "Saved offline. Will sync when online.",
    hi: "ऑफ़लाइन सहेजा गया। इंटरनेट आने पर सिंक होगा।",
    mr: "ऑफलाइन जतन केले. इंटरनेट सुरू झाल्यावर सिंक होईल.",
    bn: "অফলাইনে সংরক্ষিত। অনলাইনে এলে সিঙ্ক হবে।",
    ta: "ஆஃப்லைனில் சேமிக்கப்பட்டது. ஆன்லைனில் ஒத்திசைக்கப்படும்.",
    te: "ఆఫ్‌లైన్‌లో సేవ్ చేయబడింది. ఆన్‌లైన్‌లోకి వచ్చినప్పుడు సమకాలీకరించబడుతుంది.",
    kn: "ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ. ಆನ್‌ಲೈನ್‌ಗೆ ಬಂದಾಗ ಸಿಂಕ್ ಆಗುತ್ತದೆ.",
    gu: "ઑફલાઇન સાચવવામાં આવ્યું. ઑનલાઇન થતાં સિંક થશે.",
  },
  syncingNow: {
    en: "Syncing pending offline changes...",
    hi: "लंबित बदलाव सिंक हो रहे हैं...",
    mr: "बदल सिंक होत आहेत...",
    bn: "পরিবর্তন সিঙ্ক হচ্ছে...",
    ta: "ஒத்திசைக்கப்படுகிறது...",
    te: "సమకాలీకరించబడుతోంది...",
    kn: "ಸಿಂಕ್ ಆಗುತ್ತಿದೆ...",
    gu: "સિંક થઈ રહ્યું છે...",
  },
  syncedSuccessfully: {
    en: "All changes synced successfully.",
    hi: "सभी बदलाव सफलतापूर्वक सिंक हुए।",
    mr: "सर्व बदल यशस्वीपणे सिंक झाले.",
    bn: "সব তথ্য সিঙ্ক হয়েছে।",
    ta: "வெற்றிகரமாக ஒத்திசைக்கப்பட்டது.",
    te: "విజయవంతంగా సమకాలీకరించబడింది.",
    kn: "ಯಶಸ್ವಿಯಾಗಿ ಸಿಂಕ್ ಆಗಿದೆ.",
    gu: "સફળતાપૂર્વક સિંક થયું.",
  },
  // safety rules
  scamNotice: {
    en: "Never enter UPI PIN to receive money. Receiving payment never requires a PIN.",
    hi: "पैसे प्राप्त करने के लिए कभी भी UPI PIN न डालें। पैसे लेने के लिए पिन की ज़रूरत नहीं होती।",
    mr: "पैसे मिळवण्यासाठी कधीही UPI PIN टाकू नका. पैसे घेण्यासाठी पिनची आवश्यकता नसते.",
    bn: "টাকা পেতে কখনো UPI PIN দেবেন না। টাকা গ্রহণের জন্য পিনের প্রয়োজন নেই।",
    ta: "பணம் பெற UPI PIN-ஐ உள்ளிட வேண்டாம். பணம் பெற PIN தேவையில்லை.",
    te: "డబ్బును స్వీకరించడానికి ఎప్పుడూ UPI PIN ను నమోదు చేయవద్దు.",
    kn: "ಹಣ ಸ್ವೀಕರಿಸಲು ಎಂದಿಗೂ UPI PIN ನಮೂದಿಸಬೇಡಿ.",
    gu: "પૈસા મેળવવા માટે ક્યારેય UPI PIN દાખલ કરશો નહીં.",
  },
  // basic form fields
  productName: {
    en: "Product Name",
    hi: "उत्पाद का नाम",
    mr: "उत्पादनाचे नाव",
    bn: "পণ্যের নাম",
    ta: "தயாரிப்பு பெயர்",
    te: "ఉత్పత్తి పేరు",
    kn: "ಉತ್ಪನ್ನದ ಹೆಸರು",
    gu: "ઉત્પાદનનું નામ",
  },
  category: {
    en: "Category",
    hi: "श्रेणी",
    mr: "श्रेणी",
    bn: "বিভাগ",
    ta: "வகை",
    te: "వర్గం",
    kn: "ವರ್ಗ",
    gu: "શ્રેણી",
  },
  price: {
    en: "Price",
    hi: "मूल्य (₹)",
    mr: "किंमत (₹)",
    bn: "মূল্য (₹)",
    ta: "விலை (₹)",
    te: "ధర (₹)",
    kn: "ಬೆಲೆ (₹)",
    gu: "કિંમત (₹)",
  },
  materials: {
    en: "Materials",
    hi: "सामग्री",
    mr: "साहित्य",
    bn: "উপাদান",
    ta: "பொருட்கள்",
    te: "పదార్థాలు",
    kn: "ವಸ್ತುಗಳು",
    gu: "સામગ્રી",
  },
  description: {
    en: "Description",
    hi: "विवरण",
    mr: "वर्णन",
    bn: "বিবরণ",
    ta: "விளக்கம்",
    te: "వివరణ",
    kn: "ವಿವರಣೆ",
    gu: "વર્ણન",
  },
  stock: {
    en: "Stock / Quantity",
    hi: "मात्रा (Stock)",
    mr: "संख्या (Stock)",
    bn: "মজুদ পরিমাণ",
    ta: "கையிருப்பு",
    te: "నిల్వ",
    kn: "ದಾಸ್ತಾನು",
    gu: "જથ્થો",
  },
  publish: {
    en: "Publish Product",
    hi: "प्रकाशित करें",
    mr: "प्रकाशित करा",
    bn: "প্রকাশ করুন",
    ta: "வெளியிடுங்கள்",
    te: "ప్రచురించండి",
    kn: "ಪ್ರಕಟಿಸಿ",
    gu: "પ્રકાશિત કરો",
  },
  edit: {
    en: "Edit",
    hi: "बदलें (Edit)",
    mr: "बदला (Edit)",
    bn: "সম্পাদনা",
    ta: "திருத்து",
    te: "సవరించండి",
    kn: "ತಿದ್ದಿ",
    gu: "સુધારો",
  },
  cancel: {
    en: "Cancel",
    hi: "रद्द करें",
    mr: "रद्द करा",
    bn: "বাতিল",
    ta: "ரத்து செய்",
    te: "రద్దు చేయండి",
    kn: "ರದ್ದುಮಾಡಿ",
    gu: "રદ કરો",
  },
  send: {
    en: "Send",
    hi: "भेजें",
    mr: "पाठवा",
    bn: "পাঠান",
    ta: "அனுப்பு",
    te: "పంపండి",
    kn: "ಕಳುಹಿಸಿ",
    gu: "મોકલો",
  },
  search: {
    en: "Search crafts, artisans or locations...",
    hi: "शिल्प, कारीगर या शहर खोजें...",
    mr: "कला, कारागीर किंवा ठिकाण शोधा...",
    bn: "শিল্প বা কারিগর অনুসন্ধান করুন...",
    ta: "கைவினைகளைத் தேடுங்கள்...",
    te: "కళలు లేదా కళాకారులను శోధించండి...",
    kn: "ಕರಕುಶಲ ವಸ್ತುಗಳನ್ನು ಹುಡುಕಿ...",
    gu: "શિલ્પ અથવા કારીગરો શોધો...",
  },
  orders: {
    en: "Orders",
    hi: "ऑर्डर",
    mr: "ऑर्डर",
    bn: "অর্ডার",
    ta: "ஆர்டர்கள்",
    te: "ఆర్డర్లు",
    kn: "ಆರ್ಡರ್‌ಗಳು",
    gu: "ઓર્ડર",
  },
  filters: {
    en: "Filters",
    hi: "फ़िल्टर",
    mr: "फिल्टर",
    bn: "ফিল্টার",
    ta: "வடிகட்டிகள்",
    te: "ఫిల్టర్లు",
    kn: "ಫಿಲ್ಟರ್‌ಗಳು",
    gu: "ફિલ્ટર્સ",
  },
};

const STORAGE_LANG_KEY = "karigar_ui_language";

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_LANG_KEY);
      if (saved && LANGUAGES.some((l) => l.code === saved)) {
        return saved as Lang;
      }
    }
    return "en";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, l);
    } catch {}
  };

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => {
        const item = DICT[key];
        if (!item) return key;
        return item[lang] || item["en"] || key;
      },
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
