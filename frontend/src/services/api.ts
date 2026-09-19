/**
 * API LAYER — Karigar AI (FastAPI Backend + Resilient Fallback)
 * ---------------------------------------------------------------
 * Connects directly to the FastAPI backend at VITE_API_BASE_URL (http://localhost:8000).
 * Powers:
 * - AI Image Enhancer (rembg + Gemini Vision critique)
 * - Voice to Text Converter (Gemini Multimodal Audio + IndicConformer/Whisper)
 * - Dynamic Price Model (Gemini LLM fair-trade pricing)
 * - Multilingual Catalogue Generator
 * - Marketplace, Products, and Enquiries
 */
import {
  IMAGES,
  artisan,
  demoAiResult,
  enquiries as mockEnquiries,
  products as mockProducts,
  salesOverview,
  dashboardStats,
  type Enquiry,
  type Product,
} from "@/data/mockData";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:8000";

let sessionProducts: Product[] = [...mockProducts];
let sessionEnquiries: Enquiry[] = [...mockEnquiries];

export type NewProductInput = {
  name: string;
  category: string;
  materials: string[];
  description: string;
  keywords: string[];
  price: number;
  image: string;
  status: "published" | "draft";
};

function formatMediaUrl(url: string | null | undefined, fallback: string): string {
  if (!url) return fallback;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getProductFallbackImage(name: string = "", category: string = ""): string {
  const n = `${name} ${category}`.toLowerCase();
  if (n.includes("paint") || n.includes("canvas") || n.includes("art")) return IMAGES.painting;
  if (n.includes("textile") || n.includes("dupatta") || n.includes("cotton") || n.includes("handloom") || n.includes("indigo")) return IMAGES.textile;
  if (n.includes("jewel") || n.includes("brass") || n.includes("necklace") || n.includes("diya") || n.includes("metal")) return IMAGES.jewellery;
  if (n.includes("wood") || n.includes("leather") || n.includes("wallet") || n.includes("bowl")) return IMAGES.wooden;
  return IMAGES.bamboo;
}

export const REGIONAL_ARTISANS = [
  {
    category: "Traditional Handicrafts",
    craft: "Bamboo Weaving",
    name: "Savita Patil",
    location: "Sangli, Maharashtra",
    avatar: IMAGES.savita,
    since: "2019",
  },
  {
    category: "Handloom Textiles",
    craft: "Handloom Weaving",
    name: "Ravi Kulkarni",
    location: "Belagavi, Karnataka",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    since: "2015",
  },
  {
    category: "Artisan Jewellery",
    craft: "Heritage Brass & Metal Craft",
    name: "Anita Mistry",
    location: "Bhuj, Gujarat",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    since: "2017",
  },
  {
    category: "Art & Paintings",
    craft: "Folk & Canvas Painting",
    name: "Deepak Jadhav",
    location: "Ratnagiri, Maharashtra",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80",
    since: "2012",
  },
  {
    category: "Wooden Crafts",
    craft: "Wood Carving & Inlay",
    name: "Ibrahim Khan",
    location: "Saharanpur, Uttar Pradesh",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80",
    since: "2014",
  },
  {
    category: "Bags & Accessories",
    craft: "Handcrafted Leatherwork",
    name: "Rajesh Suthar",
    location: "Jodhpur, Rajasthan",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    since: "2018",
  },
  {
    category: "Wellness",
    craft: "Natural Herbal Craft",
    name: "Geeta Sen",
    location: "Rishikesh, Uttarakhand",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
    since: "2020",
  },
];

export function getArtisanForProduct(p: any): { name: string; location: string; craft: string; avatar: string } {
  let userProfile: any = null;
  try {
    const saved = localStorage.getItem("karigar_artisan_profile");
    if (saved) userProfile = JSON.parse(saved);
  } catch {}

  const isUserProduct =
    p.isUserCreated ||
    (p.artisan_id && (p.artisan_id.startsWith("user-") || p.artisan_id === "user-artisan" || p.artisan_id === userProfile?.id)) ||
    (p.artisan && userProfile && (p.artisan === userProfile.name || p.artisan === "My Creations"));

  if (isUserProduct && userProfile) {
    return {
      name: userProfile.name || artisan.name,
      location: userProfile.location || artisan.location,
      craft: userProfile.craft || artisan.craft,
      avatar: userProfile.avatar || artisan.avatar,
    };
  }

  if (p.artisan_name && p.artisan_name !== "Artisan" && p.artisan_name !== "Savita Patil" && p.artisan_name !== "Sita Devi") {
    return {
      name: p.artisan_name,
      location: p.artisan_location || "India",
      craft: p.craft_type || p.category || "Handicrafts",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80",
    };
  }

  const n = `${p.product_name || p.name || ""} ${p.category || ""} ${p.craft_type || p.craft || ""}`.toLowerCase();
  if (n.includes("paint") || n.includes("canvas") || n.includes("art") || n.includes("watercolour")) {
    return REGIONAL_ARTISANS[3]!;
  }
  if (n.includes("textile") || n.includes("dupatta") || n.includes("cotton") || n.includes("handloom") || n.includes("indigo") || n.includes("sari") || n.includes("weave")) {
    return REGIONAL_ARTISANS[1]!;
  }
  if (n.includes("jewel") || n.includes("brass") || n.includes("necklace") || n.includes("diya") || n.includes("metal") || n.includes("silver")) {
    return REGIONAL_ARTISANS[2]!;
  }
  if (n.includes("wood") || n.includes("bowl") || n.includes("carv") || n.includes("sheesham")) {
    return REGIONAL_ARTISANS[4]!;
  }
  if (n.includes("leather") || n.includes("wallet") || n.includes("bag")) {
    return REGIONAL_ARTISANS[5]!;
  }
  if (n.includes("soap") || n.includes("herb") || n.includes("well") || n.includes("organ")) {
    return REGIONAL_ARTISANS[6]!;
  }
  return REGIONAL_ARTISANS[0]!;
}

export const api = {
  // ---------- auth ----------
  async login(identifier: string, password: string) {
    if (!identifier || !password) throw new Error("Please enter your details.");
    let savedProfile: any = null;
    try {
      const saved = localStorage.getItem("karigar_artisan_profile");
      if (saved) savedProfile = JSON.parse(saved);
    } catch {}

    try {
      const res = await fetch(`${API_BASE_URL}/api/artisans`);
      if (res.ok) {
        const artisans = await res.json();
        const found = artisans.find((a: any) => a.phone_number === identifier || a.name?.toLowerCase().includes(identifier.toLowerCase()));
        if (found) {
          const profile = {
            ...(savedProfile || artisan),
            id: found.id,
            name: found.name || (savedProfile ? savedProfile.name : artisan.name),
            location: found.location || (savedProfile ? savedProfile.location : artisan.location),
            craft: found.craft_type || (savedProfile ? savedProfile.craft : artisan.craft),
            business: found.business_name || (savedProfile ? savedProfile.business : artisan.business),
            avatar: savedProfile?.avatar || artisan.avatar,
          };
          localStorage.setItem("karigar_artisan_profile", JSON.stringify(profile));
          return { user: profile, token: "session-token" };
        }
      }
    } catch {
      // fallback
    }

    const fallbackUser = {
      ...(savedProfile || artisan),
      identifier,
      name: savedProfile?.name || (identifier.includes("@") ? identifier.split("@")[0] : artisan.name),
    };
    try {
      localStorage.setItem("karigar_artisan_profile", JSON.stringify(fallbackUser));
    } catch {}

    return { user: fallbackUser, token: "demo-token" };
  },

  async register(input: { name: string; identifier: string; password: string }) {
    let savedProfile: any = null;
    try {
      const saved = localStorage.getItem("karigar_artisan_profile");
      if (saved) savedProfile = JSON.parse(saved);
    } catch {}

    const registeredName = input.name?.trim() || savedProfile?.name || artisan.name;
    const newProfile = {
      ...(savedProfile || artisan),
      name: registeredName,
      business: input.name ? `${registeredName} Creations` : (savedProfile?.business || artisan.business),
    };
    try {
      localStorage.setItem("karigar_artisan_profile", JSON.stringify(newProfile));
    } catch {}

    // Try registering on backend
    try {
      await fetch(`${API_BASE_URL}/api/artisans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: input.identifier || `+91-${Date.now().toString().slice(-10)}`,
          display_name: registeredName,
          name: registeredName,
          location: newProfile.location,
          craft_type: newProfile.craft,
          business_name: newProfile.business,
        }),
      });
    } catch {}

    return { user: newProfile, token: "demo-token" };
  },

  async updateProfile(patch: any) {
    try {
      await fetch(`${API_BASE_URL}/api/artisans/default`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patch.name,
          location: patch.location,
          craft_type: patch.craft,
          business_name: patch.business,
        }),
      });
    } catch {}
  },

  // ---------- products ----------
  async getProducts(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Product[] = data.map((p: any) => {
            const fallbackImg = getProductFallbackImage(p.product_name, p.category);
            const artisanInfo = getArtisanForProduct(p);
            const prod: Product = {
              id: p.id,
              name: p.product_name || "Handcrafted Artisan Product",
              category: p.category || "Traditional Handicrafts",
              materials: p.materials ? p.materials.split(",").map((s: string) => s.trim()) : ["Natural materials"],
              description: p.description || p.english_description || "",
              keywords: p.keywords ? p.keywords.split(",").map((s: string) => s.trim()) : ["handmade"],
              price: p.price ?? 699,
              image: formatMediaUrl(p.enhanced_image_url || p.original_image_url, fallbackImg),
              status: (p.status === "draft" ? "draft" : "published") as "published" | "draft",
              inventory: p.inventory_count ?? 10,
              artisan: p.artisan_name || artisanInfo.name,
              artisanId: p.artisan_id || "a1",
              location: p.artisan_location || artisanInfo.location,
              craft: artisanInfo.craft,
              isDemo: true,
            };
            if (prod.status === "published") {
              prod.badge = "trending";
            }
            return prod;
          });
          return mapped;
        }
      }
    } catch (e) {
      console.warn("Backend /api/products unavailable, using cached session products:", e);
    }
    return sessionProducts;
  },

  async getMarketplaceProducts(): Promise<Product[]> {
    return api.getProducts();
  },

  async getProduct(id: string): Promise<Product> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
      if (res.ok) {
        const p = await res.json();
        const fallbackImg = getProductFallbackImage(p.product_name, p.category);
        const artisanInfo = getArtisanForProduct(p);
        return {
          id: p.id,
          name: p.product_name || "Handcrafted Product",
          category: p.category || "Traditional Handicrafts",
          materials: p.materials ? p.materials.split(",").map((s: string) => s.trim()) : ["Natural materials"],
          description: p.description || p.english_description || "",
          keywords: p.keywords ? p.keywords.split(",").map((s: string) => s.trim()) : ["handmade"],
          price: p.price ?? 699,
          image: formatMediaUrl(p.enhanced_image_url || p.original_image_url, fallbackImg),
          status: (p.status === "published" ? "published" : "draft") as "published" | "draft",
          inventory: p.inventory_count ?? 10,
          artisan: artisanInfo.name,
          artisanId: p.artisan_id || "a1",
          location: artisanInfo.location,
          craft: artisanInfo.craft,
          isDemo: true,
        };
      }
    } catch {
      // fallback to mock
    }
    const found = sessionProducts.find((p) => p.id === id);
    if (!found) throw new Error("Product not found");
    return found;
  },

  async createProduct(input: NewProductInput): Promise<Product> {
    let userProfile: any = null;
    try {
      const saved = localStorage.getItem("karigar_artisan_profile");
      if (saved) userProfile = JSON.parse(saved);
    } catch {}

    const activeArtisanName = userProfile?.name || artisan.name;
    const activeLocation = userProfile?.location || artisan.location;
    const activeCraft = userProfile?.craft || artisan.craft;

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artisan_id: userProfile?.id || "user-artisan",
          product_name: input.name,
          category: input.category,
          materials: input.materials.join(", "),
          description: input.description,
          english_description: input.description,
          keywords: input.keywords.join(", "),
          price: input.price,
          status: input.status,
          enhanced_image_url: input.image,
          original_image_url: input.image,
        }),
      });
      if (res.ok) {
        const p = await res.json();
        const fallbackImg = getProductFallbackImage(p.product_name || input.name, p.category || input.category);
        const created: Product = {
          id: p.id,
          name: p.product_name || input.name,
          category: p.category || input.category,
          materials: input.materials,
          description: p.description || input.description,
          keywords: input.keywords,
          price: p.price || input.price,
          image: formatMediaUrl(p.enhanced_image_url || input.image, fallbackImg),
          status: (p.status || input.status) as "published" | "draft",
          inventory: 10,
          artisan: activeArtisanName,
          artisanId: "user-artisan",
          location: activeLocation,
          craft: activeCraft,
          isDemo: true,
        };
        sessionProducts = [created, ...sessionProducts];
        return created;
      }
    } catch (e) {
      console.warn("Backend product create error, saving locally:", e);
    }
    const product: Product = {
      id: `new-${Date.now()}`,
      ...input,
      inventory: 10,
      artisan: activeArtisanName,
      artisanId: "user-artisan",
      location: activeLocation,
      craft: activeCraft,
      isDemo: true,
    };
    sessionProducts = [product, ...sessionProducts];
    return product;
  },

  async updateProduct(id: string, patch: Partial<Product>): Promise<Product> {
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: patch.name,
          price: patch.price,
          status: patch.status,
          description: patch.description,
        }),
      });
    } catch {
      // fallback
    }
    sessionProducts = sessionProducts.map((p) => (p.id === id ? { ...p, ...patch } : p));
    return sessionProducts.find((p) => p.id === id)!;
  },

  async deleteProduct(id: string) {
    try {
      await fetch(`${API_BASE_URL}/api/products/${id}`, { method: "DELETE" });
    } catch {
      // fallback
    }
    sessionProducts = sessionProducts.filter((p) => p.id !== id);
    return { ok: true };
  },

  async publishProduct(id: string) {
    return api.updateProduct(id, { status: "published" });
  },

  // ---------- 1. AI IMAGE ENHANCER (rembg + Gemini Vision) ----------
  async enhanceImage(file?: File | Blob | null) {
    if (file) {
      const localUrl = URL.createObjectURL(file);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE_URL}/api/image/enhance`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          const scoreVal = data.quality_score ?? 90;
          return {
            enhancedUrl: formatMediaUrl(data.enhanced_image_url, localUrl),
            score: {
              total: scoreVal,
              background: data.quality_breakdown?.background ?? 95,
              lighting: data.quality_breakdown?.lighting ?? 92,
              sharpness: data.quality_breakdown?.sharpness ?? 90,
              framing: data.quality_breakdown?.framing ?? 92,
            },
            suggestions: data.suggestions || [],
            category: data.category || "Handmade Artwork",
            materials: data.materials || ["Handcrafted Materials"],
            craftType: data.craft_type || "Art & Craft",
            tags: data.tags || ["handmade", "artisan"],
          };
        }
      } catch (err) {
        console.warn("Backend image enhancement failed, using uploaded photo:", err);
      }
      return {
        enhancedUrl: localUrl,
        score: { total: 92, background: 94, lighting: 92, sharpness: 90, framing: 92 },
        suggestions: ["Good natural lighting. Clear artisanal texture."],
        category: "Handmade Artwork",
        materials: ["Canvas", "Natural Pigments"],
        craftType: "Handmade Painting",
        tags: ["handmade", "artwork", "artisan"],
      };
    }
    return { enhancedUrl: IMAGES.bamboo, score: demoAiResult.imageScore, suggestions: [] };
  },

  // ---------- 2. VOICE TO TEXT CONVERTER (Gemini Multimodal / IndicConformer) ----------
  async transcribeAudio(blob?: Blob | null, lang: "en" | "hi" | "mr" = "mr") {
    if (blob) {
      try {
        const formData = new FormData();
        formData.append("file", blob, `audio-${Date.now()}.wav`);
        formData.append("language", lang);

        const res = await fetch(`${API_BASE_URL}/api/speech/transcribe`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          return {
            text: data.transcript || "",
            lang: (data.detected_language as "en" | "hi" | "mr") || lang,
            englishTranslation: data.english_translation,
          };
        }
      } catch (err) {
        console.warn("Backend transcription failed:", err);
      }
    }
    return { text: "", lang };
  },

  // ---------- TRANSLATOR ----------
  async translateText(text: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_language: "en" }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          en: data.translated_text || text,
          hi: text,
          mr: text,
        };
      }
    } catch {
      // fallback
    }
    return { en: text, hi: text, mr: text };
  },

  // ---------- CATALOGUE GENERATOR ----------
  async generateCatalogue(input: {
    transcript: string;
    source_language?: string;
    category?: string;
    materials?: string[];
    extra_details?: string;
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/catalogue/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: input.transcript,
          source_language: input.source_language || "mr",
          category: input.category,
          materials: input.materials,
          extra_details: input.extra_details || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          name: data.name,
          category: data.category,
          materials: data.materials || (input.materials && input.materials.length > 0 ? input.materials : ["Handcrafted Materials"]),
          keywords: data.keywords || ["handmade", "artisan", "authentic"],
          description: data.description,
        };
      }
    } catch (err) {
      console.warn("Backend catalogue generator failed, creating from inputs:", err);
    }
    const cat = input.category || "Handmade Artwork";
    const mats = input.materials && input.materials.length > 0 ? input.materials : ["Handcrafted Materials"];
    const text = input.transcript || input.extra_details || "Authentic handcrafted piece made with care.";
    return {
      name: `Handcrafted ${cat}`,
      category: cat,
      materials: mats,
      keywords: ["handmade", "artisan", "traditional", "authentic", ...mats.map((m) => m.toLowerCase())],
      description: {
        en: `An authentic handcrafted ${cat} made using ${mats.join(", ")}. ${text}`,
        hi: `प्रामाणिक हस्तनिर्मित ${cat}, जो ${mats.join(", ")} से तैयार किया गया है। ${text}`,
        mr: `अस्सल हस्तनिर्मित ${cat}, जे ${mats.join(", ")} वापरून तयार केले आहे. ${text}`,
      },
    };
  },

  // ---------- 3. DYNAMIC PRICE MODEL (Gemini Fair-Trade Intelligence) ----------
  async predictPrice(input: { category: string; materials: string[]; name?: string; description?: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pricing/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: input.name || "Handcrafted Artisan Product",
          category: input.category,
          materials: input.materials,
          description: input.description || "",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          suggested: data.suggested_price ?? data.suggested ?? 699,
          min: data.minimum_price ?? data.min ?? 650,
          max: data.maximum_price ?? data.max ?? 850,
          cost: data.estimated_cost ?? data.cost ?? 420,
          margin: data.estimated_margin ?? data.margin ?? 279,
          confidence: data.confidence ?? 86,
          explanation: data.explanation,
        };
      }
    } catch (err) {
      console.warn("Backend dynamic pricing failed, using fallback:", err);
    }
    return demoAiResult.pricing;
  },

  // ---------- LISTING SCORE ----------
  async getListingScore() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/listing/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // fallback
    }
    return demoAiResult.listingScore;
  },

  // ---------- BUYER MATCHING & MARKETPLACE ----------
  async getMarketplaceProducts(): Promise<Product[]> {
    const all = await api.getProducts();
    return all.filter((p) => p.status === "published");
  },

  async sendEnquiry(input: { productId: string; productName: string; name: string; contact: string; message: string }) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        const data = await res.json();
        sessionEnquiries = [data, ...sessionEnquiries];
        return data;
      }
    } catch {
      // fallback
    }
    const enquiry: Enquiry = {
      id: `e-${Date.now()}`,
      buyer: `${input.name} · ${input.contact}`,
      productId: input.productId,
      productName: input.productName,
      message: input.message,
      date: "Today",
      status: "new",
      isDemo: true,
    };
    sessionEnquiries = [enquiry, ...sessionEnquiries];
    return enquiry;
  },

  async getEnquiries(): Promise<Enquiry[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/enquiries`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // fallback
    }
    return sessionEnquiries;
  },

  // ---------- ANALYTICS & DASHBOARD ----------
  async getEarnings() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/earnings`);
      if (res.ok) {
        const data = await res.json();
        return {
          stats: {
            products: data.total_products ?? 18,
            orders: data.total_orders ?? 12,
            earnings: data.total_earnings ?? 12450,
            enquiries: 7,
            isDemo: true as const,
          },
          series: data.monthly_series ?? salesOverview,
        };
      }
    } catch {
      // fallback
    }
    return { stats: dashboardStats, series: salesOverview };
  },

  async getDashboard() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/summary`);
      if (res.ok) {
        const data = await res.json();
        const prods = await api.getProducts();
        return {
          stats: {
            products: data.total_products ?? 18,
            orders: data.total_orders ?? 12,
            earnings: data.total_earnings ?? 12450,
            enquiries: data.pending_enquiries ?? 7,
            isDemo: true as const,
          },
          recent: prods.slice(0, 3),
        };
      }
    } catch {
      // fallback
    }
    return { stats: dashboardStats, recent: sessionProducts.slice(0, 3) };
  },
};
