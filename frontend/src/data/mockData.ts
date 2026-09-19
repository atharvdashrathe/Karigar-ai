/**
 * DEMO DATA — not real business data.
 * Everything here is hand-written sample content for the prototype.
 * When the FastAPI backend is connected, these become API responses.
 */
import bamboo from "@/assets/product-bamboo-basket.jpg";
import textile from "@/assets/product-indigo-textile.jpg";
import jewellery from "@/assets/product-brass-jewellery.jpg";
import painting from "@/assets/product-watercolor-painting.jpg";
import wooden from "@/assets/product-wooden-craft.jpg";
import savita from "@/assets/artisan-savita.jpg";
import basketBefore from "@/assets/demo-basket-before.jpg";

export const IMAGES = { bamboo, textile, jewellery, painting, wooden, savita, basketBefore };

export type ProductStatus = "published" | "draft";

export type Product = {
  id: string;
  name: string;
  category: string;
  materials: string[];
  description: string;
  keywords: string[];
  price: number;
  image: string;
  status: ProductStatus;
  inventory: number;
  artisan: string;
  artisanId: string;
  location: string;
  craft: string;
  badge?: "trending" | "new" | "top";
  isDemo: true;
};

export const artisan = {
  id: "a1",
  name: "Savita Patil",
  business: "Savita Handmade Bamboo Crafts",
  craft: "Bamboo weaving",
  location: "Sangli, Maharashtra",
  language: "Marathi",
  avatar: savita,
  since: "2019",
  isDemo: true as const,
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Handcrafted Bamboo Basket",
    category: "Traditional Handicrafts",
    materials: ["Bamboo", "Natural dye"],
    description:
      "A hand-woven bamboo basket made using a weaving technique passed down through three generations in Sangli. Each basket is shaped over two days from locally harvested bamboo, sanded smooth and finished with a natural dye. Light, sturdy and food-safe — ideal for fruit storage, gifting and home décor.",
    keywords: ["handmade", "bamboo", "traditional craft", "home décor"],
    price: 699,
    image: bamboo,
    status: "published",
    inventory: 24,
    artisan: "Savita Patil",
    artisanId: "a1",
    location: "Sangli, Maharashtra",
    craft: "Bamboo weaving",
    badge: "trending",
    isDemo: true,
  },
  {
    id: "p2",
    name: "Handwoven Indigo Textile",
    category: "Handloom Textiles",
    materials: ["Cotton", "Natural indigo"],
    description:
      "A handloom cotton throw dyed in small batches with natural indigo. The uneven speckles across the weave are a signature of hand dyeing, so no two pieces are identical.",
    keywords: ["handloom", "indigo", "cotton", "throw"],
    price: 1240,
    image: textile,
    status: "published",
    inventory: 8,
    artisan: "Ravi Kulkarni",
    artisanId: "a2",
    location: "Belagavi, Karnataka",
    craft: "Handloom weaving",
    badge: "new",
    isDemo: true,
  },
  {
    id: "p3",
    name: "Artisan Brass Jewellery Set",
    category: "Artisan Jewellery",
    materials: ["Brass", "Glass stone"],
    description:
      "A hand-finished brass earring and pendant set with cast medallions polished by hand. Lightweight, nickel-free, and made in a family workshop in Kutch.",
    keywords: ["brass", "jewellery", "handmade", "festive"],
    price: 3850,
    image: jewellery,
    status: "published",
    inventory: 5,
    artisan: "Anita Mistry",
    artisanId: "a3",
    location: "Bhuj, Gujarat",
    craft: "Metal craft",
    badge: "top",
    isDemo: true,
  },
  {
    id: "p4",
    name: "Handmade Watercolour Painting",
    category: "Art & Paintings",
    materials: ["Cotton paper", "Watercolour"],
    description:
      "An original watercolour of a Konkan village street painted on 300 gsm cotton paper. Signed by the artist and supplied unframed.",
    keywords: ["watercolour", "original art", "village", "wall art"],
    price: 2200,
    image: painting,
    status: "published",
    inventory: 1,
    artisan: "Deepak Jadhav",
    artisanId: "a4",
    location: "Ratnagiri, Maharashtra",
    craft: "Painting",
    isDemo: true,
  },
  {
    id: "p5",
    name: "Traditional Carved Wooden Bowl",
    category: "Wooden Crafts",
    materials: ["Sheesham wood"],
    description:
      "A single-piece sheesham bowl with a hand-carved floral band around the rim, finished with food-safe oil. Turned and carved entirely by hand.",
    keywords: ["wood carving", "bowl", "handmade", "kitchen"],
    price: 840,
    image: wooden,
    status: "draft",
    inventory: 12,
    artisan: "Savita Patil",
    artisanId: "a1",
    location: "Sangli, Maharashtra",
    craft: "Wood carving",
    isDemo: true,
  },
];

export const categories = [
  "Traditional Handicrafts",
  "Handloom Textiles",
  "Artisan Jewellery",
  "Art & Paintings",
  "Wooden Crafts",
];

export const dashboardStats = {
  products: 18,
  orders: 12,
  earnings: 12450,
  enquiries: 7,
  isDemo: true as const,
};

export type Enquiry = {
  id: string;
  buyer: string;
  productId: string;
  productName: string;
  message: string;
  date: string;
  status: "new" | "responded" | "completed";
  isDemo: true;
};

export const enquiries: Enquiry[] = [
  {
    id: "e1",
    buyer: "Meera Shah · Craft Bazaar, Mumbai",
    productId: "p1",
    productName: "Handcrafted Bamboo Basket",
    message: "I'm interested in ordering 50 units for a festival hamper. Can you deliver by 20th?",
    date: "2 Sep 2026",
    status: "new",
    isDemo: true,
  },
  {
    id: "e2",
    buyer: "Arjun Rao · Studio Home, Bengaluru",
    productId: "p1",
    productName: "Handcrafted Bamboo Basket",
    message: "Do you make a smaller size? Looking for 20 pieces monthly.",
    date: "31 Aug 2026",
    status: "new",
    isDemo: true,
  },
  {
    id: "e3",
    buyer: "Nisha Kamat · The Weave Store, Pune",
    productId: "p5",
    productName: "Traditional Carved Wooden Bowl",
    message: "Please share wholesale pricing for 30 bowls.",
    date: "27 Aug 2026",
    status: "responded",
    isDemo: true,
  },
  {
    id: "e4",
    buyer: "Farhan Qureshi · Gift Co., Delhi",
    productId: "p1",
    productName: "Handcrafted Bamboo Basket",
    message: "Order of 15 baskets received, thank you!",
    date: "12 Aug 2026",
    status: "completed",
    isDemo: true,
  },
];

export const salesOverview = [
  { month: "Mar", earnings: 4200, orders: 4 },
  { month: "Apr", earnings: 5600, orders: 6 },
  { month: "May", earnings: 4900, orders: 5 },
  { month: "Jun", earnings: 7400, orders: 8 },
  { month: "Jul", earnings: 9100, orders: 10 },
  { month: "Aug", earnings: 12450, orders: 12 },
];

/** The AI result the demo flow "produces" for the bamboo basket. */
export const demoAiResult = {
  imageScore: { total: 92, background: 95, lighting: 88, sharpness: 93, framing: 90 },
  transcript: {
    mr: "ही बांबूची टोपली आम्ही हाताने विणतो. स्थानिक बांबू वापरतो, दोन दिवस लागतात.",
    hi: "यह बाँस की टोकरी हम हाथ से बुनते हैं। स्थानीय बाँस से बनी, दो दिन लगते हैं।",
    en: "We weave this bamboo basket by hand using local bamboo. It takes about two days.",
  },
  catalogue: {
    name: "Handcrafted Bamboo Basket",
    category: "Traditional Handicrafts",
    materials: ["Bamboo"],
    keywords: ["handmade", "bamboo", "traditional craft", "home décor"],
    description: {
      en: products[0]!.description,
      hi: "सांगली की तीन पीढ़ियों से चली आ रही बुनाई तकनीक से बनी हाथ से बुनी बाँस की टोकरी। स्थानीय बाँस से दो दिन में तैयार, हल्की और मज़बूत — फल रखने, उपहार और घर की सजावट के लिए उपयुक्त।",
      mr: "सांगलीतील तीन पिढ्यांच्या विणकाम पद्धतीने हाताने विणलेली बांबूची टोपली. स्थानिक बांबूपासून दोन दिवसांत तयार, हलकी आणि मजबूत — फळे ठेवण्यासाठी, भेटवस्तू आणि घर सजावटीसाठी योग्य.",
    },
  },
  pricing: { suggested: 699, min: 650, max: 800, cost: 420, margin: 279, confidence: 86 },
  listingScore: { total: 92, image: 95, catalogue: 94, description: 90, pricing: 91, completeness: 89 },
};
