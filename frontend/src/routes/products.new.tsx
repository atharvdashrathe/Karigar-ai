import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Camera, CheckCircle2, Mic, MicOff, Sparkles, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { VoiceGuideButton } from "@/components/VoiceGuideButton";
import { voiceGuide } from "@/lib/voice-guide";
import {
  Badge,
  Button,
  Card,
  Field,
  ProgressBar,
  SectionTitle,
  inputClass,
} from "@/components/ui-kit";
import { IMAGES } from "@/data/mockData";
import { useI18n } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/products/new")({
  head: () => ({
    meta: [
      { title: "Add a product — KarigarAI" },
      { name: "description", content: "Photo, voice, AI catalogue and fair price — publish a listing in minutes." },
      { property: "og:title", content: "Add a product — KarigarAI" },
      { property: "og:description", content: "Voice-first listing creation for artisans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AddProduct,
});

const STEPS = ["Photo", "Voice", "AI analysis", "Review", "Publish"];
const PIPELINE = [
  "Enhancing photo & removing background",
  "Transcribing voice with AI",
  "Translating to English & Hindi",
  "Writing e-commerce catalogue",
  "Calculating fair-trade dynamic price",
];

function getCraftVoiceStory(cat: string, mats: string[], craft?: string, l: "mr" | "hi" | "en" = "mr") {
  const c = (cat || "").toLowerCase();
  const cr = (craft || "").toLowerCase();
  const m = mats?.length ? mats.join(", ") : "";

  if (c.includes("brass") || c.includes("metal") || cr.includes("brass") || cr.includes("metal")) {
    if (l === "hi") return "यह पारंपरिक पीतल और धातु का हस्तनिर्मित पीस है, जिसे पारंपरिक ढलाई और हाथ की नक्काशी से बनाया गया है।";
    if (l === "mr") return "हे पारंपरिक पितळी आणि धातूचे हस्तनिर्मित उत्पादन आम्ही हाताने घडवले आहे, यात उत्तम नक्षीकाम आहे.";
    return "This is a handcrafted traditional brass and metalware piece made with hand-casting and intricate engraving.";
  }
  if (c.includes("wood") || cr.includes("wood") || cr.includes("carv")) {
    if (l === "hi") return "यह शुद्ध शीशम की लकड़ी से तराशा गया हस्तशिल्प है, जिस पर प्राकृतिक तेल की पॉलिश की गई है।";
    if (l === "mr") return "हे अस्सल शिसवी लाकडातून कोरलेले हस्तकला उत्पादन आहे, ज्यावर नैसर्गिक तेल पॉलिश केले आहे.";
    return "This is a handcrafted wooden craft carved from seasoned wood and finished with natural oils.";
  }
  if (c.includes("pottery") || c.includes("clay") || cr.includes("pottery") || c.includes("terracotta")) {
    if (l === "hi") return "यह शुद्ध टेराकोटा मिट्टी का बर्तन है, जिसे चाक पर हाथ से बनाकर भट्टी में पकाया गया है।";
    if (l === "mr") return "हे शुद्ध मातीचे भांडे कुंभाराच्या चाकावर हाताने घडवून भट्टीमध्ये भाजले आहे.";
    return "This is an authentic terracotta clay craft shaped on the potter's wheel and kiln-fired.";
  }
  if (c.includes("textile") || c.includes("handloom") || cr.includes("handloom") || cr.includes("weaving") || c.includes("cotton")) {
    if (l === "hi") return "यह शुद्ध सूती हथकरघा परिधान है, जिसे पारंपरिक करघे पर प्राकृतिक रंगों से बुना गया है।";
    if (l === "mr") return "हा अस्सल हातमाग सुती कपडा असून पारंपरिक पद्धतीने नैसर्गिक रंगांनी विणला आहे.";
    return "This is a pure handloom textile woven on traditional looms with natural eco-friendly dyes.";
  }
  if (c.includes("jewellery") || c.includes("jewelry")) {
    if (l === "hi") return "यह पारंपरिक हस्तनिर्मित आभूषण है, जिसे स्थानीय कारीगरों ने पारंपरिक रूपांकनों से सजाया है।";
    if (l === "mr") return "हे पारंपरिक हस्तनिर्मित दागिने स्थानिक कारागिरांनी सुबक नक्षीकामाने घडवले आहेत.";
    return "This is handcrafted artisan jewellery created with traditional ethnic motifs and fine finishing.";
  }
  if (c.includes("painting") || c.includes("art")) {
    if (l === "hi") return "यह मूल हस्तनिर्मित जलरंग पेंटिंग है, जो भारतीय ग्रामीण संस्कृति को दर्शाती है।";
    if (l === "mr") return "हे अस्सल हस्तनिर्मित जलरंग चित्र असून ग्रामीण संस्कृती आणि निसर्गाचे दर्शन घडवते.";
    return "This is an original handmade artwork painted with natural pigment colours on archival paper.";
  }
  if (c.includes("bamboo") || cr.includes("bamboo") || c.includes("basket")) {
    if (l === "hi") return "यह बाँस की हस्तनिर्मित टोकरी है, जिसे हमने स्थानीय प्राकृतिक बाँस से बुना है।";
    if (l === "mr") return "ही बांबूची टोपली आम्ही सांगलीच्या जंगलातील नैसर्गिक बांबूपासून बनवतो.";
    return "This is a handcrafted natural bamboo basket woven with care by traditional artisans.";
  }
  if (l === "hi") return `यह हस्तनिर्मित ${cat || "कारीगरी"} उत्पाद है, जो ${m || "प्राकृतिक सामग्री"} से बना है।`;
  if (l === "mr") return `हे हस्तनिर्मित ${cat || "कारागिरी"} उत्पादन असून ${m || "नैसर्गिक साहित्या"}पासून बनवले आहे.`;
  return `This is a handcrafted ${cat || "artisan"} product crafted using authentic materials (${m || "natural materials"}).`;
}

function AddProduct() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [imageScore, setImageScore] = useState<number | null>(null);
  const [imageSuggestions, setImageSuggestions] = useState<string[]>([]);
  
  const [lang, setLang] = useState<"mr" | "hi" | "en">("mr");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [stage, setStage] = useState(-1);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [craftType, setCraftType] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [pricingData, setPricingData] = useState<{
    suggested: number;
    min: number;
    max: number;
    cost: number;
    margin: number;
    confidence: number;
    explanation?: string;
  }>({
    suggested: 0,
    min: 0,
    max: 0,
    cost: 0,
    margin: 0,
    confidence: 85,
  });
  const [price, setPrice] = useState(0);
  const [listingScoreData, setListingScoreData] = useState({
    total: 92,
    image: 95,
    catalogue: 94,
    description: 90,
    pricing: 91,
  });
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

  async function handleFileUpload(file: File) {
    try {
      setBusy(true);
      const localUrl = URL.createObjectURL(file);
      setOriginalImagePreview(localUrl);
      setImage(localUrl);
      const res = await api.enhanceImage(file);
      setImage(res.enhancedUrl || localUrl);
      setImageScore(res.score.total);
      if (res.suggestions) setImageSuggestions(res.suggestions);
      const detCat = res.category || "Handmade Artwork";
      const detMats = res.materials && res.materials.length > 0 ? res.materials : ["Handcrafted Materials"];
      setCategory(detCat);
      setMaterials(detMats);
      if (res.craftType) setCraftType(res.craftType);
      if (res.tags) setTags(res.tags);
      
      const autoStory = getCraftVoiceStory(detCat, detMats, res.craftType, lang);
      setTranscript(autoStory);
      setName(`Handcrafted ${res.craftType || detCat}`);
      setDescription(autoStory);
      toast.success("Image uploaded & analyzed with AI!");
    } catch {
      toast.info("Uploaded photo ready. Continue to describe your craft.");
    } finally {
      setBusy(false);
    }
  }

  async function useDemoPhoto() {
    setBusy(true);
    setOriginalImagePreview(IMAGES.basketBefore);
    const res = await api.enhanceImage(null);
    setImage(res.enhancedUrl);
    setImageScore(res.score.total);
    setImageSuggestions(["Natural side lighting recommended for sharper texture."]);
    setCategory("Traditional Handicrafts");
    setMaterials(["Locally Sourced Natural Bamboo", "Organic Plant Fibers"]);
    setCraftType("Bamboo Weaving");
    setTranscript(getCraftVoiceStory("Traditional Handicrafts", ["Bamboo"], "Bamboo Weaving", lang));
    setBusy(false);
  }

  const speechRecognitionRef = useRef<any>(null);

  async function startRecording() {
    setRecording(true);
    setTranscript("");

    // 1. Try Browser Native Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";

        let finalTranscriptAccumulator = "";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscriptAccumulator += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const liveText = (finalTranscriptAccumulator + interimTranscript).trim();
          setTranscript(liveText);
          setDescription(liveText);
        };

        recognition.onerror = (event: any) => {
          console.warn("Web Speech API error:", event.error);
        };

        recognition.onend = () => {
          if (recording) {
            setRecording(false);
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        return;
      } catch (e) {
        console.warn("SpeechRecognition fallback to MediaRecorder", e);
      }
    }

    // 2. Fallback to MediaRecorder
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setBusy(true);
        try {
          const res = await api.transcribeAudio(audioBlob, lang);
          if (res.text && res.text.trim()) {
            setTranscript(res.text.trim());
            setDescription(res.text.trim());
            toast.success("Voice transcribed successfully!");
          } else {
            toast.info("Could not detect speech clearly. You can type in the box below.");
          }
        } catch {
          toast.error("Audio processing failed. You can type directly below.");
        } finally {
          setBusy(false);
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    } catch {
      toast.error("Microphone access denied. You can type your description directly in the box below.");
      setRecording(false);
    }
  }

  function stopRecording() {
    setRecording(false);
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (transcript.trim()) {
      toast.success("Voice story captured! Click Generate AI Catalogue to proceed.");
    }
  }

  async function useDemoVoice() {
    setBusy(true);
    const story = getCraftVoiceStory(category, materials, craftType, lang);
    setTranscript(story);
    setBusy(false);
  }

  async function runPipeline() {
    setStep(2);
    for (let i = 0; i < PIPELINE.length; i += 1) {
      setStage(i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 600));
    }
    try {
      const extraDetails = `Craft: ${craftType || category}. Materials: ${materials.join(", ")}. Tags: ${tags.join(", ")}.`;
      const cat = await api.generateCatalogue({
        transcript: transcript || extraDetails,
        source_language: lang,
        category,
        materials,
        extra_details: extraDetails,
      });
      setName(cat.name);
      setCategory(cat.category);
      setMaterials(cat.materials);
      setKeywords(cat.keywords);
      setDescription(cat.description[lang] || cat.description.en);

      const pricing = await api.predictPrice({
        category: cat.category,
        materials: cat.materials,
        name: cat.name,
        description: cat.description.en,
      });
      setPricingData(pricing);
      setPrice(pricing.suggested);

      const score = await api.getListingScore();
      if (score) setListingScoreData(score);
    } catch (e) {
      console.warn("AI pipeline error:", e);
    }

    setStage(PIPELINE.length);
    setStep(3);
  }

  async function publish(status: "published" | "draft") {
    setBusy(true);
    try {
      const created = await api.createProduct({
        name,
        category,
        materials,
        description,
        keywords,
        price,
        image: image ?? IMAGES.bamboo,
        status,
      });
      if (created?.id) {
        setCreatedProductId(created.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["marketplace"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(status === "published" ? "Product published to marketplace!" : "Draft saved!");
      if (status === "published") {
        setStep(4);
        voiceGuide.explainPage("sell_success", lang);
      } else {
        navigate({ to: "/products" });
      }
    } catch {
      toast.error("Failed to save product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title={t("addProduct")} subtitle="Photo → speak → AI writes it → review → publish">
      <div className="space-y-6">
        <Card className="p-5">
          <ProgressBar value={((step + 1) / STEPS.length) * 100} label={`Step ${step + 1} of ${STEPS.length}`} />
          <div className="mt-4 flex flex-wrap gap-2">
            {STEPS.map((s, i) => (
              <Badge key={s} tone={i === step ? "brand" : i < step ? "success" : "neutral"}>
                {i + 1}. {s}
              </Badge>
            ))}
          </div>
        </Card>

        {/* STEP 1: PHOTO */}
        {step === 0 ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle eyebrow="Step 1" title="Add a photo of your product" />
              <VoiceGuideButton pageKey="sell_photo" size="sm" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="grid cursor-pointer place-items-center rounded-3xl border-2 border-dashed border-border p-8 text-center transition hover:border-terracotta/60 hover:bg-cream/40"
              >
                <div className="grid size-14 place-items-center rounded-2xl bg-terracotta/10 text-terracotta">
                  <UploadCloud className="size-7" aria-hidden="true" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">Upload your product photo</p>
                <p className="mt-1 text-xs text-soft">Click or drag an image here, or use the demo image.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="glass" onClick={useDemoPhoto} disabled={busy}>
                    Try demo photo
                  </Button>
                  <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                    <Camera className="size-4 mr-1.5" /> Choose file
                  </Button>
                </div>
              </div>
              <div>
                {image ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <figure>
                        <img
                          src={originalImagePreview || IMAGES.basketBefore}
                          alt="Original photo before enhancement"
                          className="h-44 w-full rounded-2xl object-cover"
                        />
                        <figcaption className="mt-1 text-xs text-soft">Original Photo</figcaption>
                      </figure>
                      <figure>
                        <img
                          src={image}
                          alt="Enhanced product photo"
                          className="h-44 w-full rounded-2xl object-cover shadow-sm bg-white"
                        />
                        <figcaption className="mt-1 text-xs font-semibold text-terracotta">AI Enhanced (Clean Bg)</figcaption>
                      </figure>
                    </div>
                    <div className="mt-4">
                      <ProgressBar value={imageScore ?? 92} label={`Photo quality score: ${imageScore ?? 92}/100`} />
                    </div>
                    {imageSuggestions.length > 0 && (
                      <div className="mt-3 rounded-xl bg-surface-raised p-3 text-xs text-soft">
                        <span className="font-semibold text-ink">AI Suggestion:</span> {imageSuggestions[0]}
                      </div>
                    )}
                  </>
                ) : (
                  <ul className="space-y-2 text-sm text-soft">
                    <li>• Use daylight near a window for natural colors.</li>
                    <li>• Keep background plain or let AI remove it automatically.</li>
                    <li>• Fill the frame so product details are clear.</li>
                  </ul>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setStep(1)} disabled={!image || busy}>
                Continue to Voice
              </Button>
            </div>
          </Card>
        ) : null}

        {/* STEP 2: VOICE */}
        {step === 1 ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle eyebrow="Step 2" title="Describe your product in your language" />
              <VoiceGuideButton pageKey="sell_voice" size="sm" />
            </div>
            <div className="surface-glass mb-5 inline-flex rounded-full p-1">
              {([
                ["mr", "मराठी"],
                ["hi", "हिन्दी"],
                ["en", "English"],
              ] as const).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition",
                    lang === code ? "bg-terracotta text-cream" : "text-soft hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-4 py-4">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={busy}
                className={cn(
                  "relative grid size-24 place-items-center rounded-full transition-all duration-300 shadow-md",
                  recording
                    ? "bg-red-500 text-white animate-pulse ring-4 ring-red-200"
                    : "bg-terracotta text-white hover:bg-terracotta-deep",
                )}
              >
                {recording ? <MicOff className="size-8" /> : <Mic className="size-8" />}
                <span className="sr-only">{recording ? "Stop recording" : "Record voice"}</span>
              </button>

              <div className="text-center">
                <p className="text-sm font-semibold text-ink">
                  {recording ? "Listening... (Tap to stop)" : busy ? "AI Transcribing..." : "Tap mic and speak, or use sample voice"}
                </p>
                <div className="mt-2 flex justify-center gap-2">
                  <Button variant="glass" size="sm" onClick={useDemoVoice} disabled={busy || recording}>
                    Use sample voice
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <Field label="Spoken description / Transcript">
                <textarea
                  className={inputClass}
                  rows={4}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Describe your craft, materials used, techniques, and time spent..."
                />
              </Field>
            </div>
            <div className="mt-6 flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
              <Button onClick={runPipeline} disabled={(!transcript && !image) || busy || recording}>
                <Sparkles className="size-4 mr-1.5" aria-hidden="true" />
                Let AI build the listing
              </Button>
            </div>
          </Card>
        ) : null}

        {/* STEP 3: AI PIPELINE PROGRESS */}
        {step === 2 ? (
          <Card glass className="p-8">
            <SectionTitle eyebrow="Step 3" title="AI is crafting your listing & fair pricing" />
            <ProgressBar value={Math.round(((stage + 1) / PIPELINE.length) * 100)} label="Processing AI Pipelines" />
            <ul className="mt-6 space-y-3">
              {PIPELINE.map((s, i) => (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-full transition",
                      i < stage
                        ? "bg-sage/30 text-sage-deep"
                        : i === stage
                        ? "bg-blush text-terracotta-deep animate-pulse"
                        : "bg-ink/5 text-soft",
                    )}
                  >
                    {i < stage ? <CheckCircle2 className="size-4" aria-hidden="true" /> : i + 1}
                  </span>
                  <span className={i <= stage ? "font-semibold text-ink" : "text-soft"}>{s}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* STEP 4: REVIEW & DYNAMIC PRICE */}
        {step === 3 ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle eyebrow="Step 4" title="Review and edit your listing" />
                <VoiceGuideButton pageKey="sell_ready" size="sm" />
              </div>
              <div className="space-y-4">
                <Field label="Product title">
                  <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Category">
                  <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} />
                </Field>
                <Field label="Materials">
                  <input
                    className={inputClass}
                    value={materials.join(", ")}
                    onChange={(e) => setMaterials(e.target.value.split(",").map((s) => s.trim()))}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    className={inputClass}
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
                <Field label="Listing Price (₹)">
                  <input
                    className={inputClass}
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </Field>
              </div>
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <Button variant="ghost" onClick={() => publish("draft")} disabled={busy}>
                  Save as draft
                </Button>
                <Button onClick={() => publish("published")} disabled={busy}>
                  Publish to Marketplace
                </Button>
              </div>
            </Card>

            <div className="space-y-5">
              {/* Dynamic Price Box */}
              <Card glass className="p-6 border border-terracotta/20">
                <p className="text-xs font-semibold text-terracotta uppercase">AI Fair-Trade Dynamic Pricing</p>
                <p className="font-display text-3xl font-bold text-ink">₹{price}</p>
                <p className="mt-1 text-sm text-soft">
                  Suggested range ₹{pricingData.min} – ₹{pricingData.max} · {pricingData.confidence}% confidence
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-raised p-2.5">
                    <dt className="text-xs text-soft">Estimated Cost</dt>
                    <dd className="font-semibold text-ink">₹{pricingData.cost}</dd>
                  </div>
                  <div className="rounded-xl bg-surface-raised p-2.5">
                    <dt className="text-xs text-soft">Artisan Margin</dt>
                    <dd className="font-semibold text-sage-deep">₹{pricingData.margin}</dd>
                  </div>
                </dl>
                {pricingData.explanation && (
                  <p className="mt-3 text-xs text-soft italic bg-cream/30 p-2 rounded-lg">
                    💡 {pricingData.explanation}
                  </p>
                )}
              </Card>

              {/* Listing Score */}
              <Card className="p-6">
                <p className="font-display text-lg font-bold">Listing Quality Score</p>
                <p className="font-display text-4xl font-black text-terracotta-deep">
                  {listingScoreData.total}
                  <span className="text-base text-soft font-normal">/100</span>
                </p>
                <div className="mt-4 space-y-3">
                  <ProgressBar value={listingScoreData.image} label="Photo & background" />
                  <ProgressBar value={listingScoreData.catalogue} label="Catalogue metadata" />
                  <ProgressBar value={listingScoreData.description} label="Multilingual story" />
                  <ProgressBar value={listingScoreData.pricing} label="Fair pricing margin" />
                </div>
              </Card>
            </div>
          </div>
        ) : null}

        {/* STEP 5: PUBLISHED */}
        {step === 4 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-sage/30 text-sage-deep">
              <CheckCircle2 className="size-8" aria-hidden="true" />
            </div>
            <p className="mt-5 font-display text-2xl font-bold">✅ Product Published Successfully</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-soft">
              Your product is now visible to customers. Buyers across India can discover {name} in the marketplace and send you purchase enquiries.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {createdProductId && (
                <Button onClick={() => navigate({ to: `/marketplace/${createdProductId}` })}>
                  View Product
                </Button>
              )}
              <Button variant="glass" onClick={() => navigate({ to: "/marketplace" })}>
                Go to Marketplace
              </Button>
              <Button variant="ghost" onClick={() => navigate({ to: "/products" })}>
                Manage My Products
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
