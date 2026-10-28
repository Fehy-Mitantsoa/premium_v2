/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Product, Customer, Order } from "../types";

interface PDFReportData {
  products: Product[];
  customers: Customer[];
  orders: Order[];
  systemStatus: any;
}

export function generateDashboardPDF(data: PDFReportData) {
  const { products, customers, orders, systemStatus } = data;

  // Initialize jsPDF (A4 Portrait, mm units)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // ~297mm
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2); // ~180mm

  // Helper variables for positioning
  let y = margin;

  // Colors
  const colors = {
    primary: { r: 30, g: 41, b: 59 },     // Deep Slate (#1e293b)
    secondary: { r: 71, g: 85, b: 105 },  // Medium Slate (#475569)
    accent: { r: 59, g: 130, b: 246 },    // Elegant Blue (#3b82f6)
    success: { r: 16, g: 185, b: 129 },   // Emerald Green (#10b981)
    danger: { r: 239, g: 68, b: 68 },     // Bright Red (#ef4444)
    warning: { r: 245, g: 158, b: 11 },   // Amber Yellow (#f59e0b)
    lightBg: { r: 248, g: 250, b: 252 },  // Off-white/slate-50 (#f8fafc)
    border: { r: 226, g: 232, b: 240 },   // Light grey (#e2e8f0)
    text: { r: 51, g: 65, b: 85 },        // slate-700 (#334155)
  };

  // Helper functions
  const addHeader = (pageNumber: number) => {
    doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.rect(0, 0, pageWidth, 12, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text("MEMOIRE DE MASTER II - PLATEFORME E-COMMERCE INTELLIGENTE", margin, 7.5);
    
    doc.setFont("Helvetica", "normal");
    doc.text(`Rapport Décisionnel | Page ${pageNumber}/2`, pageWidth - margin, 7.5, { align: "right" });
  };

  const addFooter = (pageNumber: number) => {
    // Top border line for footer
    doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.text("© 2026 Plateforme E-Commerce Intelligente - Architecture MVC Laravel 12 & MongoDB Atlas", margin, pageHeight - 10);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")} | Page ${pageNumber}`, pageWidth - margin, pageHeight - 10, { align: "right" });
  };

  const drawSectionHeader = (title: string, currentY: number) => {
    // Bullet / Left bar decoration
    doc.setFillColor(colors.accent.r, colors.accent.g, colors.accent.b);
    doc.rect(margin, currentY, 3, 5.5, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text(title, margin + 5, currentY + 4.5);

    // Line underline
    doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

    return currentY + 12;
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE SUMMARY & FINANCIALS & STOCKS
  // =========================================================================
  addHeader(1);

  y += 6; // starting content position below top bar
 
  // Document Title Block
  doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
  doc.rect(margin, y, contentWidth, 24, "F");
  
  // Outer frame for title block
  doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  doc.setLineWidth(0.4);
  doc.rect(margin, y, contentWidth, 24, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text("RAPPORT DÉCISIONNEL AUTOMATISÉ D'ACTIVITÉ", margin + 5, y + 6);
  
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(colors.accent.r, colors.accent.g, colors.accent.b);
  doc.text("Système Automatisé d'Analyse des Ventes, du CRM et Gestion Omnicanale des Stocks", margin + 5, y + 11.5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
  const metadataString = `Auteur : andriamifehy18@gmail.com  |  Rôle : Administrateur  |  Connexion BDD : ${systemStatus.mongodb?.status === "Online" ? "MongoDB Atlas (Cloud Cluster)" : "Mode Local Emulé"}`;
  doc.text(metadataString, margin + 5, y + 18.5);

  y += 32;

  // 1. SECTION 1: SYNTHÈSE DES MÉTRIQUES FINANCIÈRES (KPIs)
  y = drawSectionHeader("1. SYNTHÈSE DES COMPTES & TRANSACTIONNEL (KPI)", y);

  // Math metrics
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "Payé" || o.deliveryStatus === "Livré" || o.deliveryStatus === "Expédié")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);

  const averageBasket = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
  const pendingOrdersCount = orders.filter(o => o.paymentStatus === "En attente").length;
  const payedOrdersCount = orders.filter(o => o.paymentStatus === "Payé").length;

  // Draw KPIs cards (3 columns)
  const colWidth = (contentWidth - 8) / 3;

  // KPI 1: Revenue
  doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
  doc.rect(margin, y, colWidth, 20, "F");
  doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  doc.rect(margin, y, colWidth, 20, "D");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
  doc.text("CHIFFRE D'AFFAIRES CUMULÉ", margin + 4, y + 5);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.success.r, colors.success.g, colors.success.b);
  doc.text(`${totalRevenue.toLocaleString("fr-FR")} Ar`, margin + 4, y + 12);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text("Commandes Validées et Expédiées", margin + 4, y + 17);

  // KPI 2: Avg Basket
  doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
  doc.rect(margin + colWidth + 4, y, colWidth, 20, "F");
  doc.rect(margin + colWidth + 4, y, colWidth, 20, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
  doc.text("PANIER MOYEN PAR COMMANDE", margin + colWidth + 8, y + 5);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text(`${averageBasket.toLocaleString("fr-FR")} Ar`, margin + colWidth + 8, y + 12);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text(`Calculé sur ${orders.length} factures`, margin + colWidth + 8, y + 17);

  // KPI 3: Orders Stats
  doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
  doc.rect(margin + (colWidth * 2) + 8, y, colWidth, 20, "F");
  doc.rect(margin + (colWidth * 2) + 8, y, colWidth, 20, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
  doc.text("STATUT DES FLUX COMMERCIAUX", margin + (colWidth * 2) + 12, y + 5);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(colors.accent.r, colors.accent.g, colors.accent.b);
  doc.text(`${orders.length} Commandes`, margin + (colWidth * 2) + 12, y + 12);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text(`${payedOrdersCount} Payées  |  ${pendingOrdersCount} En Attente`, margin + (colWidth * 2) + 12, y + 17);

  y += 26;

  // 2. SECTION 2: VALORISATION DES STOCKS PHYSIQUES (MongoDB)
  y = drawSectionHeader("2. VALORISATION DES STOCKS PHYSIQUES (MONGODB ATLAS)", y);

  // Calculate stock valuations
  const stockValuationOriginal = products.reduce((acc, curr) => acc + (curr.originalPrice * curr.stock), 0);
  const stockValuationCurrent = products.reduce((acc, curr) => acc + (curr.currentPrice * curr.stock), 0);
  const totalStockVolume = products.reduce((acc, curr) => acc + curr.stock, 0);
  const outOfStockProducts = products.filter(p => p.stock === 0).length;
  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.minStockThreshold || 10)).length;

  // 2 Cards layout for stocks
  const stockCardWidth = (contentWidth - 6) / 2;

  // Card 1: Valuations
  doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
  doc.rect(margin, y, stockCardWidth, 26, "F");
  doc.rect(margin, y, stockCardWidth, 26, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text("VALORISATION COMPTABLE DES STOCKS", margin + 5, y + 6);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text(`Valorisation Prix Public Conseillé :`, margin + 5, y + 12);
  doc.setFont("Helvetica", "bold");
  doc.text(`${stockValuationOriginal.toLocaleString("fr-FR")} Ar`, stockCardWidth + margin - 5, y + 12, { align: "right" });

  doc.setFont("Helvetica", "normal");
  doc.text(`Valorisation Active au Prix de Vente :`, margin + 5, y + 18);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(colors.success.r, colors.success.g, colors.success.b);
  doc.text(`${stockValuationCurrent.toLocaleString("fr-FR")} Ar`, stockCardWidth + margin - 5, y + 18, { align: "right" });
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
  doc.text(`Volume physique cumulé : ${totalStockVolume.toLocaleString()} unités`, margin + 5, y + 23.5);

  // Card 2: Alerts
  doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
  doc.rect(margin + stockCardWidth + 6, y, stockCardWidth, 26, "F");
  doc.rect(margin + stockCardWidth + 6, y, stockCardWidth, 26, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text("ALERTES DE REAPPROVISIONNEMENT ET RUPTURES", margin + stockCardWidth + 11, y + 6);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text(`Produits en Rupture Totale (0 stock) :`, margin + stockCardWidth + 11, y + 12);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(outOfStockProducts > 0 ? colors.danger.r : colors.text.r, outOfStockProducts > 0 ? colors.danger.g : colors.text.g, outOfStockProducts > 0 ? colors.danger.b : colors.text.b);
  doc.text(`${outOfStockProducts} fiches`, margin + (stockCardWidth * 2) + 6, y + 12, { align: "right" });

  doc.setFont("Helvetica", "normal");
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  doc.text(`Alerte Seuil Critique (Stock <= Seuil) :`, margin + stockCardWidth + 11, y + 18);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(lowStockProducts > 0 ? colors.warning.r : colors.text.r, lowStockProducts > 0 ? colors.warning.g : colors.text.g, lowStockProducts > 0 ? colors.warning.b : colors.text.b);
  doc.text(`${lowStockProducts} fiches`, margin + (stockCardWidth * 2) + 6, y + 18, { align: "right" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
  doc.text("Synchronisé instantanément avec le pipeline NoSQL", margin + stockCardWidth + 11, y + 23.5);

  y += 33;

  // 3. SECTION 3: TOP PRODUITS ET VENTES POPULAIRES (MATRICE DE REVENU)
  y = drawSectionHeader("3. PERFORMANCE PAR PRODUIT ET RÉPARTITION MARKETING", y);

  // Group orders by product to compute top items
  const productPerformanceMap: { [id: string]: { name: string; qty: number; revenue: number } } = {};
  orders.forEach(o => {
    (o.products || []).forEach(item => {
      if (!productPerformanceMap[item.productId]) {
        productPerformanceMap[item.productId] = {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
      }
      productPerformanceMap[item.productId].qty += item.quantity;
      productPerformanceMap[item.productId].revenue += item.quantity * item.priceAtPurchase;
    });
  });

  const performanceList = Object.entries(productPerformanceMap)
    .map(([id, info]) => ({ id, ...info }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // top 5

  // Render elegant custom table headers
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.rect(margin, y, contentWidth, 6.5, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("RÉFÉRENCE / NOM DU PRODUIT", margin + 3, y + 4.5);
  doc.text("UNITÉS VENDUES", margin + 110, y + 4.5, { align: "center" });
  doc.text("CONTRIBUTION REVENU (AR)", pageWidth - margin - 3, y + 4.5, { align: "right" });

  y += 6.5;

  // Draw rows
  performanceList.forEach((item, index) => {
    // Alternating background
    if (index % 2 === 0) {
      doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
      doc.rect(margin, y, contentWidth, 7, "F");
    }
    
    // Bottom border for each row
    doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text(item.name.length > 55 ? item.name.substring(0, 52) + "..." : item.name, margin + 3, y + 4.5);
    
    doc.setFont("Helvetica", "bold");
    doc.text(`${item.qty} unités`, margin + 110, y + 4.5, { align: "center" });
    
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text(`${item.revenue.toLocaleString("fr-FR")} Ar`, pageWidth - margin - 3, y + 4.5, { align: "right" });

    y += 7;
  });

  if (performanceList.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.text("Aucune transaction enregistrée pour l'analyse des ventes.", margin + 4, y + 5);
    y += 8;
  }

  // Footer for Page 1
  addFooter(1);

  // =========================================================================
  // PAGE 2: STRATEGIC REVIEWS & CRM LOGS
  // =========================================================================
  doc.addPage();
  y = margin;
  addHeader(2);

  y += 6; // spacing from header bar

  // Title of Page 2
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text("RAPPORT DÉCISIONNEL CRM & TRAÇABILITÉ DES VENTES", margin, y + 4);

  doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 6, pageWidth - margin, y + 6);

  y += 12;

  // 4. SECTION 4: HISTORIQUE RÉCENT DES COMMANDES ET FACTURATION CRM
  y = drawSectionHeader("4. RÉCENTES FACTURES ENREGISTRÉES DANS LE CRM (NO-SQL)", y);

  // Table of recent 10 orders (takes more space now that n8n is removed)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 10);

  // Headers
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.rect(margin, y, contentWidth, 6.5, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("RÉFÉRENCE COMMANDE", margin + 3, y + 4.5);
  doc.text("NOM DU CLIENT", margin + 45, y + 4.5);
  doc.text("DATE DE COMMANDE", margin + 95, y + 4.5);
  doc.text("STATUT DE PAIEMENT", margin + 135, y + 4.5);
  doc.text("MONTANT (AR)", pageWidth - margin - 3, y + 4.5, { align: "right" });

  y += 6.5;

  recentOrders.forEach((o, idx) => {
    // Alternating rows
    if (idx % 2 === 0) {
      doc.setFillColor(colors.lightBg.r, colors.lightBg.g, colors.lightBg.b);
      doc.rect(margin, y, contentWidth, 7, "F");
    }

    doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 7, pageWidth - margin, y + 7);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    doc.text(o.id, margin + 3, y + 4.5);

    doc.setFont("Helvetica", "normal");
    doc.text(o.customerName || "Client inconnu", margin + 45, y + 4.5);
    doc.text(new Date(o.orderDate).toLocaleDateString("fr-FR"), margin + 95, y + 4.5);
    
    // Status color
    if (o.paymentStatus === "Payé") {
      doc.setTextColor(colors.success.r, colors.success.g, colors.success.b);
      doc.setFont("Helvetica", "bold");
    } else if (o.paymentStatus === "En attente") {
      doc.setTextColor(colors.warning.r, colors.warning.g, colors.warning.b);
      doc.setFont("Helvetica", "bold");
    } else {
      doc.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
      doc.setFont("Helvetica", "normal");
    }
    doc.text(o.paymentStatus, margin + 135, y + 4.5);

    // Amount
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    doc.text(`${(o.totalAmount || 0).toLocaleString("fr-FR")} Ar`, pageWidth - margin - 3, y + 4.5, { align: "right" });

    y += 7;
  });

  if (recentOrders.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
    doc.text("Aucune commande enregistrée dans la base NoSQL.", margin + 4, y + 5);
    y += 8;
  }

  y += 12;

  // 5. SECTION 5: ANALYSES ALGORITHMIQUES & RECOMMANDATIONS STRATÉGIQUES
  y = drawSectionHeader("5. ANALYSES ET RECOMMANDATIONS STRATÉGIQUES DE L'IA", y);

  // Dynamic recommendations text depending on system parameters
  let stockRecommendation = "● Les niveaux globaux d'inventaire de la base de données MongoDB sont stables.";
  if (outOfStockProducts > 0 || lowStockProducts > 0) {
    stockRecommendation = `● ALERTE DE RUPTURE : ${outOfStockProducts} produits sont en rupture totale de stock, et ${lowStockProducts} produits ont dépassé le seuil minimum critique configuré. Il est recommandé de déclencher un réapprovisionnement d'urgence pour éviter les pertes de chiffre d'affaires.`;
  }

  const priceRecommendation = "● VEILLE DE PRODUCTION : Les transactions enregistrées indiquent une bonne corrélation entre les prix de vente appliqués et les paniers d'achat d'équipements de haute valeur ajoutée.";

  doc.setFillColor(243, 244, 246); // light slate background
  doc.rect(margin, y, contentWidth, 38, "F");
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 38, "D");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text("FEUILLE DE ROUTE OPÉRATIONNELLE DU GESTIONNAIRE :", margin + 4, y + 5);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  
  // Multi-line wrap for recommendations
  const wrappedStockRec = doc.splitTextToSize(stockRecommendation, contentWidth - 8);
  doc.text(wrappedStockRec, margin + 4, y + 10);

  const wrappedPriceRec = doc.splitTextToSize(priceRecommendation, contentWidth - 8);
  // calculate the spacing dynamic
  const priceY = y + 12 + (wrappedStockRec.length * 3);
  doc.text(wrappedPriceRec, margin + 4, priceY);

  const finalNotes = `● ACTIONS CLÉS RECOMMANDÉES : 1. Activer les alertes automatiques dans les Paramètres de la plateforme pour rester informé des ruptures. 2. Lancer un export de la base MongoDB Atlas CRM pour optimiser les relances des paniers moyens inférieurs à 500 000 Ar.`;
  const wrappedNotes = doc.splitTextToSize(finalNotes, contentWidth - 8);
  doc.text(wrappedNotes, margin + 4, priceY + 2 + (wrappedPriceRec.length * 3));

  // Footer for Page 2
  addFooter(2);

  // SAVE THE DOCUMENT
  const filename = `commerce_intelligent_rapport_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
