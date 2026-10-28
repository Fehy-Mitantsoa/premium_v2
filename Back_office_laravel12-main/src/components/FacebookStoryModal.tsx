import React, { useState, useEffect, useRef } from "react";
import { Product, SystemSettings } from "../types";
import { 
  renderStoryToCanvas, 
  downloadStoryPng, 
  exportStoryDataUrl, 
  STORY_THEMES, 
  StoryDesignOptions 
} from "../services/facebookStoryGenerator";
import { 
  X, 
  Download, 
  Send, 
  Palette, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Smartphone,
  Eye
} from "lucide-react";

interface FacebookStoryModalProps {
  product: Product;
  settings: SystemSettings;
  isOpen: boolean;
  onClose: () => void;
  onStoryPublished?: (updatedProduct: Product) => void;
}

export const FacebookStoryModal: React.FC<FacebookStoryModalProps> = ({
  product,
  settings,
  isOpen,
  onClose,
  onStoryPublished,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof STORY_THEMES>("blue");
  const [selectedBadge, setSelectedBadge] = useState<string>("🔥 NOUVEAUTÉ");
  const [customBadgeInput, setCustomBadgeInput] = useState<string>("");
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const priceVal = product.currentPrice || product.price || product.originalPrice || 0;
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : "";
  const shopName = settings.facebookPageName || "PREMIUM SHOP Madagascar";

  const standardBadges = [
    "🔥 NOUVEAUTÉ",
    "💎 ARRIVAGE EXCLUSIF",
    "⚡ STOCK LIMITÉ",
    "⭐ COUP DE CŒUR",
    "🏷️ PRIX SPÉCIAL",
  ];

  const currentBadge = customBadgeInput.trim() || selectedBadge;

  const currentOptions: StoryDesignOptions = {
    productName: product.name,
    imageUrl: imageUrl,
    price: priceVal,
    category: product.category,
    shopName: shopName,
    websiteUrl: "http://localhost:30000",
    whatsappNumber: "0347454871",
    badge: currentBadge,
    colorTheme: selectedTheme,
  };

  // Render canvas whenever options change
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const render = async () => {
      setIsRendering(true);
      try {
        if (canvasRef.current) {
          await renderStoryToCanvas(currentOptions, canvasRef.current);
        }
      } catch (err) {
        console.error("Erreur de rendu Story :", err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, selectedTheme, selectedBadge, customBadgeInput, product]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    await downloadStoryPng(currentOptions, product.name);
  };

  const handlePublishToFacebook = async () => {
    setIsPublishing(true);
    setPublishStatus("idle");
    setPublishMessage("");

    try {
      // Get base64 or upload data
      const dataUrl = await exportStoryDataUrl(currentOptions);

      const res = await fetch(`/api/products/${product.id}/facebook-story-publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageDataUrl: dataUrl,
          theme: selectedTheme,
          badge: currentBadge,
          productName: product.name,
          price: priceVal,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setPublishStatus("success");
        setPublishMessage(
          data.isSimulated
            ? "Story Facebook envoyée avec succès (Mode Bac à sable) !"
            : `Story publiée en direct sur la Page Facebook (ID: ${data.storyId || data.postId}) !`
        );
        if (onStoryPublished && data.product) {
          onStoryPublished(data.product);
        }
      } else {
        setPublishStatus("error");
        setPublishMessage(data.error || "Échec lors de la publication de la Story.");
      }
    } catch (err: any) {
      setPublishStatus("error");
      setPublishMessage(`Erreur réseau : ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyPrompt = () => {
    const promptText = `Crée une Story Facebook verticale 1080×1920 en style e-commerce premium pour "${product.name}". Utilise la photo du produit comme sujet principal sur un fond dégradé ${STORY_THEMES[selectedTheme].name}. Ajoute un badge "${currentBadge}" en haut, le nom du produit en grand, le prix ${priceVal.toLocaleString("fr-FR")} Ar dans un encart blanc, puis un bouton « 📩 Commandez en MP », un badge WhatsApp "💬 WhatsApp : 034 74 548 71", et affiche "${shopName}" avec le lien site web "http://localhost:30000" et "Livraison Antananarivo & Provinces" en bas. Design minimaliste, haute qualité.`;
    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Live 9:16 Smartphone Mockup Preview */}
        <div className="md:w-1/2 bg-slate-950 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 relative">
          <div className="flex items-center gap-2 mb-3 text-slate-300 text-xs font-semibold">
            <Smartphone className="w-4 h-4 text-blue-400" />
            Aperçu Story Mobile (1080 × 1920 px • 9:16)
          </div>

          {/* Smartphone Bezel */}
          <div className="relative w-[240px] h-[426px] sm:w-[270px] sm:h-[480px] rounded-[36px] p-2.5 bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden flex items-center justify-center">
            {/* Top camera notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-800"></div>
            </div>

            {/* Canvas Container */}
            <div className="w-full h-full rounded-[26px] overflow-hidden relative bg-slate-900 flex items-center justify-center">
              {isRendering && (
                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-10 text-white gap-2 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  Rendu HD...
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover select-none"
                style={{ imageRendering: "auto" }}
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Télécharger PNG HD (1080×1920)
            </button>
            <button
              onClick={handleCopyPrompt}
              className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              title="Copier l'invite IA Story"
            >
              {copiedPrompt ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
              {copiedPrompt ? "Copié !" : "Prompt IA"}
            </button>
          </div>
        </div>

        {/* Right Side: Customization Studio & Direct Publish */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto bg-slate-900 text-slate-100">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Studio Story Facebook</h3>
                  <p className="text-[11px] text-slate-400">{product.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customization Options */}
            <div className="py-4 space-y-4">
              {/* Palette & Theme selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-400" />
                  Palette Dégradé & Ambiance :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(STORY_THEMES) as Array<keyof typeof STORY_THEMES>).map((key) => {
                    const theme = STORY_THEMES[key];
                    const isSelected = selectedTheme === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTheme(key)}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? "border-blue-500 bg-blue-950/40 shadow-sm ring-1 ring-blue-500"
                            : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                        }`}
                      >
                        <div
                          className="w-full h-3.5 rounded-md"
                          style={{
                            background: `linear-gradient(90deg, ${theme.bgGradient[0]}, ${theme.bgGradient[1]}, ${theme.bgGradient[2]})`,
                          }}
                        />
                        <span className="text-[11px] font-medium text-slate-200 truncate">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Badge Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  Badge en haut de Story :
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {standardBadges.map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => {
                        setSelectedBadge(badge);
                        setCustomBadgeInput("");
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedBadge === badge && !customBadgeInput
                          ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou saisir un badge personnalisé..."
                  value={customBadgeInput}
                  onChange={(e) => setCustomBadgeInput(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Summary details */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Prix affiché :</span>
                  <span className="font-bold text-amber-400">{priceVal.toLocaleString("fr-FR")} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Page Facebook :</span>
                  <span className="font-medium text-slate-200">{shopName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Site Web :</span>
                  <span className="font-medium text-blue-400">http://localhost:30000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">WhatsApp :</span>
                  <span className="font-medium text-emerald-400">0347454871</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Call to action :</span>
                  <span className="font-medium text-emerald-400">📩 MP & WhatsApp</span>
                </div>
              </div>

              {/* Status Message */}
              {publishStatus === "success" && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Succès Story Facebook !</p>
                    <p className="text-[11px] mt-0.5">{publishMessage}</p>
                  </div>
                </div>
              )}

              {publishStatus === "error" && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Erreur de publication</p>
                    <p className="text-[11px] mt-0.5 leading-relaxed">{publishMessage}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={isPublishing || isRendering}
              onClick={handlePublishToFacebook}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publication sur Meta Story...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publier la Story sur Facebook 📸
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
