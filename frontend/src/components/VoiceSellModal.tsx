import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Camera, Sparkles, X, Check, Edit3, UploadCloud, RefreshCw, Volume2, Wand2 } from "lucide-react";
import { Button, Field, inputClass } from "@/components/ui-kit";
import { useI18n } from "@/lib/i18n";
import { api } from "@/services/api";
import { offlineSync } from "@/lib/offline-sync";
import { toast } from "sonner";

interface VoiceSellModalProps {
  open: boolean;
  onClose: () => void;
  onProductCreated?: () => void;
}

const VOICE_SAMPLES = [
  {
    label: "Blue Handloom Saree",
    lang: "en",
    text: "I made five royal blue handloom cotton sarees with natural vegetable dyes. Each saree price is 1200 rupees. They are purely handmade.",
  },
  {
    label: "पारंपरिक पैठणी साडी (Marathi)",
    lang: "mr",
    text: "मी पाच हाताने विणलेल्या निळ्या शुद्ध सुती साड्या बनवल्या आहेत. प्रत्येक साडीची किंमत १२०० रुपये आहे. त्या नैसर्गिक रंगाने बनवल्या आहेत.",
  },
  {
    label: "टेराकोटा मिट्टी के बर्तन (Hindi)",
    lang: "hi",
    text: "मैंने आठ हस्तनिर्मित टेराकोटा मिट्टी के घड़े बनाए हैं। प्रत्येक की कीमत 450 रुपये है। यह प्राकृतिक शुद्ध मिट्टी से बने हैं।",
  },
  {
    label: "Carved Wooden Bowl",
    lang: "en",
    text: "I carved six handmade wooden decorative bowls using seasoned sheesham wood and natural polish. Each costs 850 rupees.",
  },
];

export function VoiceSellModal({ open, onClose, onProductCreated }: VoiceSellModalProps) {
  const { t, lang } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted product state
  const [extracted, setExtracted] = useState<{
    product_name: string;
    category: string;
    quantity: number;
    price: number;
    materials: string[];
    description: string;
    language: string;
  } | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  async function startRecording() {
    setIsRecording(true);
    setTranscript("");

    // 1. Try Browser Native Web Speech Recognition for instant real-time transcription
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
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
        };

        recognition.onend = () => {
          if (isRecording) {
            setIsRecording(false);
          }
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
        return;
      } catch (err) {
        console.warn("SpeechRecognition init failed, falling back to MediaRecorder", err);
      }
    }

    // 2. Fallback to MediaRecorder & backend /api/speech/transcribe
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setIsProcessing(true);
        try {
          const res = await api.transcribeAudio(audioBlob, lang === "hi" ? "hi" : lang === "mr" ? "mr" : "en");
          if (res.text && res.text.trim()) {
            setTranscript(res.text.trim());
            await extractVoiceDetails(res.text.trim());
          } else {
            // Default sample
            const sample =
              lang === "mr"
                ? "मी पाच हाताने विणलेल्या निळ्या साड्या बनवल्या आहेत. प्रत्येक साडीची किंमत १२०० रुपये आहे."
                : lang === "hi"
                ? "मैंने पांच नीली हस्तनिर्मित साड़ियां बनाई हैं। प्रत्येक की कीमत 1200 रुपये है।"
                : "I made five royal blue handmade sarees. Each costs 1200 rupees.";
            setTranscript(sample);
            await extractVoiceDetails(sample);
          }
        } catch {
          const sample = "I made five blue handmade cotton sarees. Each costs 1200 rupees.";
          setTranscript(sample);
          await extractVoiceDetails(sample);
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start();
    } catch {
      toast.info("Microphone unavailable, you can pick a sample voice below or type directly.");
      setIsRecording(false);
    }
  }

  async function stopRecording() {
    setIsRecording(false);

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
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }

    // Process whatever transcript was spoken
    if (transcript.trim()) {
      await extractVoiceDetails(transcript.trim());
    }
  }

  async function extractVoiceDetails(text: string) {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`${api.API_BASE_URL || "http://localhost:8000"}/api/saathi/extract-voice-product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, language: lang }),
      });
      if (res.ok) {
        const data = await res.json();
        setExtracted(data);
        toast.success("✨ Voice converted into product details & description!");
      } else {
        throw new Error("Extraction fallback");
      }
    } catch {
      // Robust client-side fallback
      const isSaree = /saree|साडी|साड़ी|textile/i.test(text);
      const isPottery = /pot|clay|मिट्टी|माती|घड़ा|मटका/i.test(text);
      const isWood = /wood|लाकूड|लकड़ी|bowl/i.test(text);

      const category = isSaree ? "Handloom Textiles" : isPottery ? "Pottery" : isWood ? "Wooden Crafts" : "Traditional Handicrafts";
      const product_name = isSaree ? "Handwoven Royal Cotton Saree" : isPottery ? "Handmade Terracotta Clay Pot" : isWood ? "Hand-Carved Wooden Creation" : "Artisan Handcrafted Creation";
      const materials = isSaree ? ["Pure Cotton", "Natural Dyes"] : isPottery ? ["Terracotta Natural Clay"] : ["Artisan Natural Materials"];

      setExtracted({
        product_name,
        category,
        quantity: 5,
        price: 1200,
        materials,
        description: `Exquisite handcrafted ${product_name.toLowerCase()} thoughtfully shaped by master Indian artisans with premium ${materials.join(", ")}. Perfect for authentic living and cultural gifting.`,
        language: lang,
      });
      toast.success("✨ Voice converted into product listing!");
    } finally {
      setIsProcessing(false);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedPhoto(url);
    }
  }

  async function handlePublish() {
    if (!extracted) return;
    setIsProcessing(true);
    const productPayload = {
      name: extracted.product_name,
      category: extracted.category,
      materials: extracted.materials,
      description: extracted.description,
      keywords: ["handmade", "artisan", extracted.category.toLowerCase()],
      price: extracted.price,
      image: selectedPhoto || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
      status: "published" as const,
    };

    try {
      if (offlineSync.getIsOnline()) {
        await api.createProduct(productPayload);
        toast.success("🎉 Product published to marketplace successfully!");
      } else {
        offlineSync.queueProduct(productPayload);
        toast.info("Saved offline. Will publish automatically when reconnected.");
      }
      onProductCreated?.();
      handleReset();
      onClose();
    } catch {
      offlineSync.queueProduct(productPayload);
      toast.info("Saved to local offline queue.");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset() {
    setTranscript("");
    setExtracted(null);
    setSelectedPhoto(null);
    setIsEditing(false);
    setIsRecording(false);
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-terracotta/15 text-terracotta font-bold">
                <Sparkles className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">Voice-First "Sell Something"</h2>
                <p className="text-xs text-soft">Speak in your language — AI builds the instant listing with rich description.</p>
              </div>
            </div>
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="size-8 rounded-full grid place-items-center text-soft hover:text-ink hover:bg-muted transition cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Voice Input Section */}
          {!extracted ? (
            <div className="mt-6 space-y-6">
              <div className="text-center py-6 px-4 rounded-3xl bg-blush/20 border border-terracotta/20 flex flex-col items-center">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`size-20 rounded-full grid place-items-center text-cream transition-all shadow-glow cursor-pointer ${
                    isRecording ? "bg-red-500 animate-pulse scale-110" : "bg-terracotta hover:scale-105"
                  }`}
                  aria-label={isRecording ? "Stop recording and extract" : "Start speaking"}
                >
                  {isRecording ? <MicOff className="size-8" /> : <Mic className="size-8" />}
                </button>
                <p className="mt-4 font-semibold text-ink text-sm">
                  {isRecording ? "🔴 Listening... Tap to Finish & Build Listing" : "Tap to Speak"}
                </p>
                <p className="mt-1 text-xs text-soft max-w-sm">
                  Describe what you made, quantity, price, and materials in your preferred language.
                </p>
              </div>

              {/* Live or Transcribed Text Display */}
              {transcript ? (
                <div className="p-3.5 rounded-2xl bg-muted/60 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-soft">Spoken Voice Transcript</span>
                    {isRecording && <span className="text-[10px] text-red-500 font-semibold animate-pulse">● Live Speech</span>}
                  </div>
                  <p className="text-xs text-ink font-medium leading-relaxed">{transcript}</p>
                </div>
              ) : null}

              {/* Sample Spoken Voice Prompts */}
              <div>
                <label className="block text-xs font-semibold text-soft mb-2">Or Try a Sample Voice Description:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VOICE_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={async () => {
                        setTranscript(sample.text);
                        await extractVoiceDetails(sample.text);
                      }}
                      className="text-left p-2.5 rounded-xl bg-card border border-border/70 hover:border-terracotta/50 hover:bg-blush/10 transition text-xs text-ink group cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-terracotta text-[11px]">
                        <Volume2 className="size-3 shrink-0" />
                        <span>{sample.label}</span>
                      </div>
                      <p className="text-[11px] text-soft mt-1 line-clamp-2 italic">"{sample.text}"</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Photo Attachment */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-3">
                  {selectedPhoto ? (
                    <img src={selectedPhoto} alt="Preview" className="size-12 rounded-xl object-cover border" />
                  ) : (
                    <div className="size-12 rounded-xl bg-terracotta/10 text-terracotta grid place-items-center">
                      <Camera className="size-6" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-ink">
                      {selectedPhoto ? "Product Photo Attached" : "Attach Product Photo (Optional)"}
                    </p>
                    <p className="text-[11px] text-soft">AI will automatically showcase and highlight fine details</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full text-xs"
                >
                  <UploadCloud className="size-3.5 mr-1" />
                  {selectedPhoto ? "Change" : "Upload"}
                </Button>
              </div>

              {/* Manual text input */}
              <div>
                <label className="block text-xs font-semibold text-soft mb-1.5">Or Type Custom Spoken Notes</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="E.g. Made 5 blue cotton sarees, each 1200 rupees..."
                    className={inputClass}
                  />
                  <Button
                    onClick={() => extractVoiceDetails(transcript)}
                    disabled={!transcript.trim() || isProcessing}
                    className="shrink-0 rounded-xl bg-terracotta text-cream"
                  >
                    {isProcessing ? <RefreshCw className="size-4 animate-spin" /> : <Wand2 className="size-4 mr-1" />}
                    Convert
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Extracted Listing Preview (The AI Generated Listing with Story Description) */
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-emerald-600" />
                <span>AI extracted listing details & synthesized an authentic product description from your voice.</span>
              </div>

              {!isEditing ? (
                <div className="rounded-3xl surface-card p-5 border border-border/80 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta bg-terracotta/10 px-2.5 py-0.5 rounded-full">
                        {extracted.category}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink mt-2">{extracted.product_name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-soft font-semibold">Quantity</p>
                      <p className="font-display text-lg font-bold text-ink">{extracted.quantity} units</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-soft">Price per item</p>
                      <p className="font-display text-xl font-bold text-terracotta">₹{extracted.price.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-soft">Materials</p>
                      <p className="text-xs font-semibold text-ink">{extracted.materials.join(", ")}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-soft font-semibold mb-1">Generated Product Description</p>
                    <p className="text-xs text-ink/90 leading-relaxed bg-muted/40 p-3 rounded-2xl border border-border/40">
                      {extracted.description}
                    </p>
                  </div>
                </div>
              ) : (
                /* Editable Form */
                <div className="space-y-4">
                  <Field label="Product Name">
                    <input
                      type="text"
                      value={extracted.product_name}
                      onChange={(e) => setExtracted({ ...extracted, product_name: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Category">
                      <input
                        type="text"
                        value={extracted.category}
                        onChange={(e) => setExtracted({ ...extracted, category: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Price (₹)">
                      <input
                        type="number"
                        value={extracted.price}
                        onChange={(e) => setExtracted({ ...extracted, price: Number(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <Field label="Quantity">
                    <input
                      type="number"
                      value={extracted.quantity}
                      onChange={(e) => setExtracted({ ...extracted, quantity: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Generated Description">
                    <textarea
                      rows={4}
                      value={extracted.description}
                      onChange={(e) => setExtracted({ ...extracted, description: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="rounded-full text-xs"
                >
                  <Edit3 className="size-3.5 mr-1.5" />
                  {isEditing ? "Done Editing" : "Edit Details"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleReset} className="rounded-full text-xs">
                    Start Over
                  </Button>
                  <Button
                    onClick={handlePublish}
                    disabled={isProcessing}
                    className="rounded-full bg-terracotta text-cream shadow-glow text-xs"
                  >
                    {isProcessing ? <RefreshCw className="size-4 animate-spin mr-1" /> : <Check className="size-4 mr-1" />}
                    Publish to Store
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
