/**
 * Facebook Story (9:16 - 1080x1920px) Generator
 * Conforms to the e-commerce artistic direction for Madagascar market
 */

export interface StoryDesignOptions {
  productName: string;
  imageUrl?: string;
  price: number;
  category?: string;
  shopName?: string;
  websiteUrl?: string;
  whatsappNumber?: string;
  badge?: string;
  colorTheme?: "blue" | "emerald" | "ruby" | "purple" | "obsidian" | "gold";
  customBadge?: string;
}

export const STORY_THEMES = {
  blue: {
    name: "Bleu Royal & Océan",
    bgGradient: ["#0B132B", "#1C2541", "#1E3A8A"],
    accentColor: "#3B82F6",
    badgeBg: "linear-gradient(135deg, #F97316, #EA580C)",
    badgeColor: "#FFFFFF",
    priceBoxBg: "rgba(255, 255, 255, 0.96)",
    priceTextColor: "#0F172A",
    buttonBg: "#10B981",
    buttonTextColor: "#FFFFFF",
  },
  emerald: {
    name: "Émeraude & Forêt Luxe",
    bgGradient: ["#022C22", "#064E3B", "#047857"],
    accentColor: "#10B981",
    badgeBg: "linear-gradient(135deg, #F59E0B, #D97706)",
    badgeColor: "#FFFFFF",
    priceBoxBg: "rgba(255, 255, 255, 0.96)",
    priceTextColor: "#064E3B",
    buttonBg: "#2563EB",
    buttonTextColor: "#FFFFFF",
  },
  ruby: {
    name: "Ruby & Sunset",
    bgGradient: ["#2A0815", "#4C0519", "#881337"],
    accentColor: "#F43F5E",
    badgeBg: "linear-gradient(135deg, #E11D48, #BE123C)",
    badgeColor: "#FFFFFF",
    priceBoxBg: "rgba(255, 255, 255, 0.96)",
    priceTextColor: "#881337",
    buttonBg: "#10B981",
    buttonTextColor: "#FFFFFF",
  },
  purple: {
    name: "Violet Impérial",
    bgGradient: ["#180828", "#2E1065", "#4C1D95"],
    accentColor: "#8B5CF6",
    badgeBg: "linear-gradient(135deg, #EC4899, #DB2777)",
    badgeColor: "#FFFFFF",
    priceBoxBg: "rgba(255, 255, 255, 0.96)",
    priceTextColor: "#2E1065",
    buttonBg: "#059669",
    buttonTextColor: "#FFFFFF",
  },
  obsidian: {
    name: "Noir Obsidienne & Titane",
    bgGradient: ["#09090B", "#18181B", "#27272A"],
    accentColor: "#E4E4E7",
    badgeBg: "linear-gradient(135deg, #F97316, #C2410C)",
    badgeColor: "#FFFFFF",
    priceBoxBg: "rgba(255, 255, 255, 0.96)",
    priceTextColor: "#18181B",
    buttonBg: "#2563EB",
    buttonTextColor: "#FFFFFF",
  },
  gold: {
    name: "Or & Prestige",
    bgGradient: ["#1A1305", "#3D2B06", "#784E07"],
    accentColor: "#FBBF24",
    badgeBg: "linear-gradient(135deg, #F59E0B, #B45309)",
    badgeColor: "#FFFFFF",
    priceBoxBg: "rgba(255, 255, 255, 0.96)",
    priceTextColor: "#451A03",
    buttonBg: "#10B981",
    buttonTextColor: "#FFFFFF",
  },
};

/**
 * Loads an image safely from URL or returns null
 */
async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("[Story Generator] Impossible de charger l'image distante :", url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Renders the high definition 1080x1920 Canvas
 */
export async function renderStoryToCanvas(
  options: StoryDesignOptions,
  targetCanvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const width = 1080;
  const height = 1920;

  const canvas = targetCanvas || document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible d'initialiser le contexte Canvas 2D");

  const themeKey = options.colorTheme || "blue";
  const theme = STORY_THEMES[themeKey] || STORY_THEMES.blue;

  // 1. Fond dégradé vertical premium
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, theme.bgGradient[0]);
  bgGrad.addColorStop(0.5, theme.bgGradient[1]);
  bgGrad.addColorStop(1, theme.bgGradient[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 1.1 Particules / Cercles de lumière subtils
  ctx.save();
  const glow = ctx.createRadialGradient(width / 2, 800, 100, width / 2, 800, 700);
  glow.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 200, width, 1200);
  ctx.restore();

  // 2. Badge en haut (ex: 🔥 NOUVEAUTÉ)
  const badgeText = options.customBadge || options.badge || "🔥 NOUVEAUTÉ";
  ctx.save();
  ctx.font = "bold 36px 'Plus Jakarta Sans', -apple-system, sans-serif";
  const badgeWidth = ctx.measureText(badgeText).width + 64;
  const badgeHeight = 70;
  const badgeX = (width - badgeWidth) / 2;
  const badgeY = 130;

  // Badge background pill
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 35);
  ctx.fillStyle = theme.badgeBg.includes("gradient") ? "#EA580C" : theme.badgeBg;
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  ctx.fill();

  // Badge text
  ctx.shadowColor = "transparent";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badgeText, width / 2, badgeY + badgeHeight / 2);
  ctx.restore();

  // 3. Cadre Image Produit (Centré, grand et avec ombres douces)
  const imgBoxX = 90;
  const imgBoxY = 250;
  const imgBoxW = width - 180; // 900px
  const imgBoxH = 820;

  // Background card for product
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 44);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;
  ctx.fill();
  ctx.restore();

  // Subtle border on product card
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 44);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.stroke();
  ctx.restore();

  // Load and draw product image
  if (options.imageUrl) {
    const img = await loadImage(options.imageUrl);
    if (img) {
      ctx.save();
      // Clip to card boundaries with padding
      ctx.beginPath();
      ctx.roundRect(imgBoxX + 24, imgBoxY + 24, imgBoxW - 48, imgBoxH - 48, 36);
      ctx.clip();

      // Maintain aspect ratio inside box
      const padding = 40;
      const drawW = imgBoxW - padding * 2;
      const drawH = imgBoxH - padding * 2;
      const hRatio = drawW / img.width;
      const vRatio = drawH / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShiftX = imgBoxX + padding + (drawW - img.width * ratio) / 2;
      const centerShiftY = imgBoxY + padding + (drawH - img.height * ratio) / 2;

      ctx.drawImage(img, 0, 0, img.width, img.height, centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
      ctx.restore();
    }
  } else {
    // Placeholder icon/text if no image
    ctx.save();
    ctx.fillStyle = "#64748B";
    ctx.font = "bold 42px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("📦 Photo Produit", width / 2, imgBoxY + imgBoxH / 2);
    ctx.restore();
  }

  // 4. Catégorie (Pill discrète)
  if (options.category) {
    ctx.save();
    ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif";
    const catText = options.category.toUpperCase();
    const catWidth = ctx.measureText(catText).width + 36;
    const catX = (width - catWidth) / 2;
    const catY = 1120;

    ctx.beginPath();
    ctx.roundRect(catX, catY, catWidth, 48, 24);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(catText, width / 2, catY + 24);
    ctx.restore();
  }

  // 5. Nom du produit (Grand, élégant et lisible)
  ctx.save();
  ctx.font = "bold 56px 'Plus Jakarta Sans', -apple-system, sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 4;

  const rawName = options.productName || "Nouveau Produit";
  // Word wrap max 2 lines
  const words = rawName.split(" ");
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if (ctx.measureText(line1 + w + " ").width < 860 && !line2) {
      line1 += w + " ";
    } else {
      line2 += w + " ";
    }
  }

  const titleStartY = options.category ? 1190 : 1150;
  ctx.fillText(line1.trim(), width / 2, titleStartY);
  if (line2.trim()) {
    ctx.fillText(line2.trim(), width / 2, titleStartY + 70);
  }
  ctx.restore();

  // 6. Encart Prix en évidence (ex: 1 450 000 Ar)
  const priceVal = options.price || 0;
  const priceStr = `${priceVal.toLocaleString("fr-FR")} Ar`;
  const priceBoxY = titleStartY + (line2.trim() ? 160 : 100);

  ctx.save();
  ctx.font = "bold 64px 'Plus Jakarta Sans', sans-serif";
  const priceTextW = ctx.measureText(priceStr).width;
  const priceBoxW = Math.max(priceTextW + 80, 520);
  const priceBoxH = 100;
  const priceBoxX = (width - priceBoxW) / 2;

  // Box background
  ctx.beginPath();
  ctx.roundRect(priceBoxX, priceBoxY, priceBoxW, priceBoxH, 28);
  ctx.fillStyle = theme.priceBoxBg;
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 10;
  ctx.fill();

  // Box text
  ctx.shadowColor = "transparent";
  ctx.fillStyle = theme.priceTextColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(priceStr, width / 2, priceBoxY + priceBoxH / 2);
  ctx.restore();

  // 7. Bouton visuel d'action & Encart WhatsApp
  const btnY = priceBoxY + 120;
  const btnW = 680;
  const btnH = 92;
  const btnX = (width - btnW) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 46);
  ctx.fillStyle = theme.buttonBg;
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 10;
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.fillStyle = theme.buttonTextColor;
  ctx.font = "bold 38px 'Plus Jakarta Sans', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("📩 Commandez en MP", width / 2, btnY + btnH / 2);
  ctx.restore();

  // 7b. Badge WhatsApp dédié
  const whatsappNumber = options.whatsappNumber || "0347454871";
  const formattedWa = "034 74 548 71";
  const waBoxY = btnY + 112;
  const waBoxW = 580;
  const waBoxH = 68;
  const waBoxX = (width - waBoxW) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(waBoxX, waBoxY, waBoxW, waBoxH, 34);
  ctx.fillStyle = "rgba(37, 211, 102, 0.22)"; // Subtle WhatsApp green glow
  ctx.strokeStyle = "rgba(37, 211, 102, 0.6)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fill();

  ctx.font = "bold 30px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`💬 WhatsApp : ${formattedWa}`, width / 2, waBoxY + waBoxH / 2);
  ctx.restore();

  // 8. Pied de page (Boutique + Site Web + Mention Livraison Madagascar)
  const shopName = options.shopName || "PREMIUM SHOP Madagascar Official";
  const websiteUrl = options.websiteUrl || "http://localhost:30000";

  ctx.save();
  ctx.font = "600 28px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.textAlign = "center";
  ctx.fillText(`✨ ${shopName}`, width / 2, 1750);

  ctx.font = "bold 26px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "#60A5FA"; // light blue link color
  ctx.fillText(`🌐 ${websiteUrl}`, width / 2, 1795);

  ctx.font = "400 23px 'Plus Jakarta Sans', sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillText("🛵 Livraison Antananarivo & Provinces", width / 2, 1838);
  ctx.restore();

  return canvas;
}

/**
 * Generates Base64 Data URL of the story (PNG 1080x1920)
 */
export async function exportStoryDataUrl(options: StoryDesignOptions): Promise<string> {
  const canvas = await renderStoryToCanvas(options);
  return canvas.toDataURL("image/png", 0.95);
}

/**
 * Triggers direct browser download of the Story file
 */
export async function downloadStoryPng(options: StoryDesignOptions, fileName?: string): Promise<void> {
  const dataUrl = await exportStoryDataUrl(options);
  const cleanName = (fileName || options.productName || "facebook_story")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");

  const link = document.createElement("a");
  link.download = `story_fb_${cleanName}_1080x1920.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
