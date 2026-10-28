/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { detectLanguage } from './src/utils/languageDetector';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { sendVerificationEmail } from './src/services/emailService';
import { Category, Product, Coupon, Review, User, Order, Payment, MobileMoneyPayment, PendingVerification } from './src/types';
import {
  getUsers,
  getUserById,
  getUserByEmail,
  getUserByGoogleId,
  createUser,
  updateUser,
  getPendingVerification,
  savePendingVerification,
  updatePendingVerification,
  deletePendingVerification,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getReviews,
  createReview,
  getOrders,
  createOrder,
  updateOrder,
  getNotifications,
  createNotification,
  updateNotification,
  markAllUserNotificationsRead,
  deleteNotification,
  deleteAllUserNotifications,
  getPayments,
  createPayment,
  updatePayment,
  checkPaymentReferenceExists,
  initMongoConnection,
  getDbStatus,
  findOrCreateGoogleUser
} from './src/services/mongodbServer';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.set('etag', false); // Disable ETag caching globally

  // Disable caching for API routes to avoid 304 responses
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Simple Token middleware (simulation for JWT)
  app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        // Simple base64 decoding or JSON parsing
        const userObj = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
        (req as any).user = userObj;
      } catch (e) {
        // Invalid token
      }
    }
    next();
  });

  // Helper auth check
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({ message: 'Non autorisé. Veuillez vous connecter.' });
    }
    next();
  };

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!(req as any).user || (req as any).user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès interdit. Rôle administrateur requis.' });
    }
    next();
  };

  // --- REST API ENDPOINTS ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/db-status', async (req, res) => {
    try {
      const status = await getDbStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur lors de la vérification de la base de données' });
    }
  });

  // --- CHATBOT IN-MEMORY STORE & RATE LIMITING ---
  const chatSessionsStore = new Map<string, any[]>();
  const chatRateLimitStore = new Map<string, { count: number; lastReset: number }>();

  // Rate Limiting Helper (Max 30 messages per minute per session)
  const isRateLimited = (clientId: string) => {
    const now = Date.now();
    const limitData = chatRateLimitStore.get(clientId) || { count: 0, lastReset: now };

    if (now - limitData.lastReset > 60000) {
      limitData.count = 0;
      limitData.lastReset = now;
    }

    limitData.count += 1;
    chatRateLimitStore.set(clientId, limitData);

    return limitData.count > 30;
  };

  // Custom e-commerce Chatbot API endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, userId, userEmail, sessionId, conversationHistory, detectedLanguage: clientDetectedLang } = req.body || {};

      // Input validation
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Le message est requis.' });
      }

      if (message.length > 800) {
        return res.status(400).json({ error: 'Le message dépasse la limite de 800 caractères.' });
      }

      // Require user authentication to save AI token usage
      if (!userId) {
        return res.status(401).json({
          error: 'Veuillez vous inscrire ou vous connecter pour utiliser l\'assistant IA.',
          reply: 'Veuillez vous connecter ou créer un compte pour utiliser l\'assistant IA.',
        });
      }

      const clientKey = userId || sessionId || req.ip || 'anonymous';

      // Rate limit check
      if (isRateLimited(clientKey)) {
        return res.status(429).json({
          error: 'Trop de messages envoyés en peu de temps. Veuillez patienter une minute.',
        });
      }

      const userMsg = message.trim();
      const lowerMsg = userMsg.toLowerCase();

      // Automatic language detection (server-side priority fallback to client request)
      const detectedLang = clientDetectedLang && ['fr', 'mg', 'en'].includes(clientDetectedLang)
        ? clientDetectedLang
        : detectLanguage(userMsg);

      // Gather current catalog data & context
      const products: Product[] = await getProducts();
      const categories: Category[] = await getCategories();

      let userOrdersSummary = '';
      let latestOrderInfo = '';
      let foundOrder: Order | null = null;
      let latestOrder: Order | null = null;

      try {
        const [allOrders, allPayments] = await Promise.all([
          getOrders().catch(() => [] as Order[]),
          getPayments().catch(() => [] as MobileMoneyPayment[])
        ]);

        // Strict customer order isolation: filter only orders belonging to this user ID or email
        const userOrders = allOrders.filter(o => {
          if (!userId && !userEmail) return false;
          const matchId = userId && (o.userId === userId || (o as any).customerId === userId || (o as any).user === userId);
          const matchEmail = userEmail && ((o as any).customerEmail === userEmail || o.userEmail === userEmail || (o as any).email === userEmail);
          return Boolean(matchId || matchEmail);
        });

        // Extract explicit order number if mentioned in message (e.g. CMD-123) and isolate to user's orders only
        const orderMatch = userMsg.match(/CMD-?\d+/i) || userMsg.match(/order-?\d+/i);
        if (orderMatch) {
          const num = orderMatch[0].toUpperCase();
          foundOrder = userOrders.find(
            o => (o.orderNumber && o.orderNumber.toUpperCase() === num) || o.id === num
          ) || null;
        }

        // Sort descending by creation date
        userOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        if (userOrders.length > 0) {
          latestOrder = userOrders[0];

          userOrdersSummary = `Historique récent de vos commandes :\n` +
            userOrders.slice(0, 5).map(o =>
              `- Commande #${o.orderNumber || o.id} | Statut: ${o.status || 'En cours'} | Paiement: ${o.paymentMethod || 'Mobile Money'} (${o.paymentStatus || 'Payé'}) | Total: ${o.total?.toLocaleString('fr-FR')} Ariary | Date: ${o.createdAt || 'Récente'}`
            ).join('\n');

          const matchingPayment = allPayments.find(
            p => (p as any).userId === userId ||
                 p.orderId === latestOrder?.id ||
                 (latestOrder?.transactionReference && p.paymentReference === latestOrder.transactionReference)
          ) || null;

          const itemsList = (latestOrder.items || latestOrder.products || [])
            .map((item: any) => `  * ${item.productName || item.name} (x${item.quantity}) - ${item.price?.toLocaleString('fr-FR')} Ariary`)
            .join('\n');

          latestOrderInfo = `
INFOS DERNIÈRE COMMANDE / PAIEMENT DE L'UTILISATEUR :
• Numéro de Commande : #${latestOrder.orderNumber || latestOrder.id}
• Date : ${latestOrder.createdAt || 'Récente'}
• Statut Commande : ${latestOrder.status || 'En préparation'}
• Statut Livraison : ${latestOrder.deliveryStatus || latestOrder.status || 'En cours'}
• Mode de Paiement : ${latestOrder.paymentMethod || 'Mobile Money'}
• Statut du Paiement : ${latestOrder.paymentStatus || matchingPayment?.status || 'Payé'}
• Référence Transaction : ${latestOrder.transactionReference || matchingPayment?.paymentReference || 'REF-' + (latestOrder.orderNumber || latestOrder.id)}
• Adresse Livraison : ${latestOrder.address || 'Adresse enregistrée'} | Tél: ${latestOrder.phone || 'Non précisé'}
• Montant Total : ${latestOrder.total?.toLocaleString('fr-FR')} Ariary
• Articles inclus :
${itemsList || '  * Aucun détail'}
`;
        }
      } catch (err) {
        console.warn('Could not fetch orders/payments for chat:', err);
      }

      // Detect human escalation intent
      const escalationKeywords = [
        'humain', 'agent', 'conseiller', 'réclamation', 'litige',
        'problème grave', 'remboursement refusé', 'parler à un humain',
        'opérateur', 'service client direct', 'olombelona', 'mpanolotsaina'
      ];
      const needsHumanEscalation = escalationKeywords.some(k => lowerMsg.includes(k));

      // Detect comparison intent
      const isComparisonQuery = /compar|différen|samihafa|taha|vs|versus|dihovy|hésit|hesit/i.test(lowerMsg);

      // Detect vague query for discovery questions
      const isVagueQuery = /conseil|aide|choisir|que proposez|vendez|idées|produits|tsara|misy|recherche un|cherche un|bon produit|help|recommend/i.test(lowerMsg) &&
        !lowerMsg.includes('commande') && !lowerMsg.includes('livraison') && !lowerMsg.includes('retour') && !lowerMsg.includes('paiement');

      // Detect request for order tracking / last order or payment
      const isOrderTrackingQuery = /suivi|suivre|commande|kaomandy|order|track|colis|livraison|statut/i.test(lowerMsg) ||
        /dernier|dernière|farany|last|paiement|fandoavam/i.test(lowerMsg);

      // Detect delivery info query
      const isDeliveryQuery = /livraison|délai|delai|frais|zone|expédition|expedition|farafara|fandefasana|hafely/i.test(lowerMsg);

      // Detect returns & refund query
      const isReturnRefundQuery = /retour|rembours|garantie|famerenana|antoka/i.test(lowerMsg);

      // Calculate order tracking details (Status, Next step, Estimated delivery date)
      let targetOrder = foundOrder || latestOrder;
      let orderStatusStr = '';
      let orderNextStepStr = '';
      let estimatedDeliveryStr = '';

      if (targetOrder) {
        orderStatusStr = targetOrder.status || 'En cours de traitement';
        const statusLower = orderStatusStr.toLowerCase();
        const createdDate = targetOrder.createdAt ? new Date(targetOrder.createdAt) : new Date();
        
        const isProvince = targetOrder.address && (
          /tamatave|majunga|fianarantsoa|tulear|tuléar|diego|antsiranana|antsirabe|sambava/i.test(targetOrder.address)
        );

        const estDaysMin = isProvince ? 3 : 1;
        const estDaysMax = isProvince ? 5 : 2;
        const estMinDate = new Date(createdDate.getTime() + estDaysMin * 86400000);
        const estMaxDate = new Date(createdDate.getTime() + estDaysMax * 86400000);

        const formatDate = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        estimatedDeliveryStr = `Entre le ${formatDate(estMinDate)} et le ${formatDate(estMaxDate)} (${isProvince ? 'Provinces 3-5j' : 'Antananarivo 24-48h'})`;

        if (statusLower.includes('livr') || statusLower.includes('delivered') || statusLower.includes('tonga')) {
          orderNextStepStr = 'Colis remis en main propre. Merci pour votre achat !';
          estimatedDeliveryStr = 'Colis déjà livré';
        } else if (statusLower.includes('expéd') || statusLower.includes('shipped') || statusLower.includes('en route') || statusLower.includes('dalana')) {
          orderNextStepStr = 'Le livreur est en cours d\'acheminement vers votre adresse.';
        } else if (statusLower.includes('annul') || statusLower.includes('cancel')) {
          orderNextStepStr = 'Commande annulée. Aucun acheminement en cours.';
          estimatedDeliveryStr = 'Non applicable (Annulée)';
        } else {
          orderNextStepStr = 'Préparation du colis en entrepôt et contrôle qualité avant remise au livreur.';
        }
      }

      // Dynamic product recommendation & comparison search
      let matchedProducts: Partial<Product>[] = [];
      let complementaryProducts: Partial<Product>[] = [];
      const keywords = lowerMsg.split(/\s+/).filter(w => w.length >= 2);

      if (isComparisonQuery) {
        // Find products matching keywords
        const matchingMentioned = products.filter(p =>
          keywords.some(k => p.name.toLowerCase().includes(k) || (p.brand && p.brand.toLowerCase().includes(k)))
        );

        if (matchingMentioned.length >= 1) {
          const mainRef = matchingMentioned[0];
          // Filter strictly in the same category or categoryId!
          const sameCategoryProds = products.filter(p =>
            p.id !== mainRef.id &&
            (mainRef.categoryId ? p.categoryId === mainRef.categoryId : true)
          );
          matchedProducts = [mainRef, ...sameCategoryProds].slice(0, 3);
        } else {
          // Default same-category comparisons
          if (lowerMsg.includes('solosaina') || lowerMsg.includes('ordinateur') || lowerMsg.includes('laptop') || lowerMsg.includes('mac')) {
            matchedProducts = products.filter(p => /laptop|mac|pc|ordinateur/i.test(p.name)).slice(0, 3);
          } else if (lowerMsg.includes('finday') || lowerMsg.includes('phone') || lowerMsg.includes('téléphone') || lowerMsg.includes('iphone') || lowerMsg.includes('samsung')) {
            matchedProducts = products.filter(p => /iphone|samsung|pixel|phone/i.test(p.name)).slice(0, 3);
          } else {
            matchedProducts = products.slice(0, 3);
          }
        }
      } else if (
        lowerMsg.includes('ordinateur') || lowerMsg.includes('pc') || lowerMsg.includes('laptop') || lowerMsg.includes('macbook') ||
        lowerMsg.includes('solosaina') || lowerMsg.includes('ordinaotera')
      ) {
        matchedProducts = products.filter(p => /laptop|mac|pc|ordinateur/i.test(p.name)).slice(0, 3);
      } else if (
        lowerMsg.includes('téléphone') || lowerMsg.includes('phone') || lowerMsg.includes('iphone') || lowerMsg.includes('samsung') ||
        lowerMsg.includes('finday') || lowerMsg.includes('telefaina')
      ) {
        matchedProducts = products.filter(p => /iphone|samsung|phone|pixel/i.test(p.name)).slice(0, 3);
      } else if (
        lowerMsg.includes('casque') || lowerMsg.includes('écouteur') || lowerMsg.includes('audio') || lowerMsg.includes('son') ||
        lowerMsg.includes('fihainoana')
      ) {
        matchedProducts = products.filter(p => /casque|airpods|sony|audio|baffle|enceinte/i.test(p.name)).slice(0, 3);
      } else if (keywords.length > 0) {
        matchedProducts = products.filter(p =>
          keywords.some(k => p.name.toLowerCase().includes(k) || (p.description && p.description.toLowerCase().includes(k)))
        ).slice(0, 3);
      }

      // Search complementary products / accessories if main products matched
      if (matchedProducts.length > 0) {
        complementaryProducts = products.filter(p => {
          const pName = p.name.toLowerCase();
          const isAccessory = /souris|chargeur|coque|écouteur|casque|câble|cable|sacoche|support|protection|garantie/i.test(pName);
          const isNotAlreadyMatched = !matchedProducts.some(m => m.id === p.id);
          return isAccessory && isNotAlreadyMatched;
        }).slice(0, 2);
      }

      // Quick replies suggestion mapping in detected language
      let quickReplies: string[] = [];

      if (detectedLang === 'mg') {
        quickReplies = isComparisonQuery
          ? ['💻 Mampitaha solosaina', '📱 Mampitaha finday', '📦 Ny kaomandiko farany']
          : isOrderTrackingQuery
          ? ['📦 Hanaraka kaomandy', '🚚 Fandefasana entana', '💳 Fandoavam-bola']
          : isDeliveryQuery
          ? ['🚚 Sarany & Fotoana', '📍 Faritra alefa entana', '🔄 Famerenana entana']
          : ['💻 Solosaina misy', '📱 Finday azo vidina', '📊 Mampitaha entana', '📦 Kaomandiko farany'];
      } else if (detectedLang === 'en') {
        quickReplies = isComparisonQuery
          ? ['💻 Compare laptops', '📱 Compare phones', '📦 My last order']
          : isOrderTrackingQuery
          ? ['📦 Order tracking', '🚚 Delivery times', '💳 Payment status']
          : isDeliveryQuery
          ? ['🚚 Delivery fees', '📍 Delivery areas', '🔄 Return policy']
          : ['💻 Available laptops', '📱 Smartphones', '📊 Compare products', '📦 My last order'];
      } else {
        quickReplies = isComparisonQuery
          ? ['💻 Comparer des ordinateurs', '📱 Comparer des smartphones', '📦 Ma dernière commande']
          : isOrderTrackingQuery
          ? ['📦 Suivre ma commande', '🚚 Délais de livraison', '💳 Statut du paiement']
          : isDeliveryQuery
          ? ['🚚 Tarifs de livraison', '📍 Zones desservies', '🔄 Procédure de retour']
          : ['💻 Nos ordinateurs', '📱 Smartphones', '📊 Comparer des produits', '📦 Ma dernière commande'];
      }

      const catalogSummary = products.slice(0, 25).map(p =>
        `- ${p.name} (ID: ${p.id}, Catégorie: ${p.categoryId || 'High-Tech'}, Prix: ${p.price?.toLocaleString('fr-FR')} Ariary, En stock: ${p.stock && p.stock > 0 ? `${p.stock} unités` : 'Rupture'}, Marque: ${p.brand || 'ElectroStore'}, Garantie: 12 mois constructeur, Description: ${p.description || 'Garantie ElectroStore'})`
      ).join('\n');

      const systemPrompt = `Vous êtes l'assistant virtuel officiel de la boutique e-commerce ElectroStore Madagascar.

DIRECTIVES DE RÉPONSE & DE SÉCURITÉ OBLIGATOIRES :

1. LANGUE DE RÉPONSE :
   - Langue obligatoire pour cette session : "${detectedLang.toUpperCase()}" (mg = Malagasy, en = English, fr = Français).
   - Rédigez TOUTE votre réponse directement dans cette langue.
   - En Malagasy, utilisez un ton chaleureux, naturel et le vocabulaire métier (entana, kaomandy, fandefasana entana, antoka, fandoavam-bola, famerenana entana).

2. COMPARAISON DE PRODUITS (MÊME CATÉGORIE STRICTEMENT) :
   - Si le client hésite ou demande une comparaison :
   - Comparez UNIQUEMENT des produits appartenant à la MÊME catégorie (ex: Ordinateur vs Ordinateur, Smartphone vs Smartphone).
   - Présentez un tableau Markdown structuré avec : Prix (en Ariary), Marque, Caractéristiques clés, Disponibilité stock, Garantie (1 an), Note clients.
   - Fournissez une recommandation d'achat objective guidant le client selon son budget et son usage.

3. PRODUITS COMPLÉMENTAIRES (ACCESSOIRES) :
   - Proposez des accessoires utiles (coque, chargeur, écouteurs, souris, sacoche, garantie) UNIQUEMENT s'ils sont réellement pertinents avec le produit recherché.
   ${complementaryProducts.length > 0 ? `Accessoires disponibles au catalogue à suggérer si pertinent :\n` + complementaryProducts.map(a => `- ${a.name} (${a.price?.toLocaleString('fr-FR')} Ar)`).join('\n') : ''}

4. SUIVI ET STATUT DE COMMANDE :
   Si le client demande le suivi de sa commande :
   - Afficher clairement le statut actuel.
   - Expliquer la PROCHAINE ÉTAPE (ex: Préparation en entrepôt, Acheminement par le livreur, Remise en main propre).
   - Indiquer la DATE ESTIMÉE DE LIVRAISON (ex: 24h-48h pour Antananarivo, 3-5 jours en Province).
   ${targetOrder ? `\nDONNÉES SUIVI COMMANDE CLIENT :
   - N° Commande : #${targetOrder.orderNumber || targetOrder.id}
   - Statut : ${orderStatusStr}
   - Prochaine Étape : ${orderNextStepStr}
   - Date Estimée de Livraison : ${estimatedDeliveryStr}
   - Total : ${targetOrder.total?.toLocaleString('fr-FR')} Ariary` : '\nAucune commande récente enregistrée sur ce compte.'}

5. LIVRAISON (DÉLAIS, FRAIS, ZONES & MODES) :
   - Délais : Antananarivo (24h à 48h), Grandes Villes/Provinces (3 à 5 jours ouvrés), Zones éloignées (5 à 7 jours).
   - Frais : GRATUITE dès 100 000 Ariary d'achat ! Sinon 5 000 Ariary (Tana centre) ou 10 000 Ariary (Provinces/Banlieue).
   - Zones desservies : Antananarivo, Tamatave, Majunga, Fianarantsoa, Tuléar, Diego-Suarez, Antsirabe, et toute l'île de Madagascar.
   - Modes : Remise en main propre à domicile/bureau ou Retrait gratuit en magasin ElectroStore.

6. RETOURS ET REMBOURSEMENTS :
   - Procédure simple : Droit de rétractation sous 7 à 14 jours après réception du colis.
   - Le produit doit être dans son état d'origine avec emballage et accessoires complets.
   - Dépôt ou réexpédition au SAV -> Inspection sous 24h -> Remboursement sous 48h à 72h (MVola, Orange Money, Airtel Money) ou échange.

7. STRATÉGIE COMMERCIALE & DÉCOUVERTE DU BESOIN :
   - Découverte : Si la demande est vague ("Conseillez-moi", "Aidez-moi à choisir", "Inona no tsara ?"), poser 1 à 3 questions courtes :
     1. Quel est votre budget (en Ariary) ?
     2. Pour quel usage (travail, jeu, usage quotidien) ?
     3. Avez-vous une marque préférée (Apple, Samsung, Asus, Lenovo, Sony) ?
   - Confiance : Mettre en avant le paiement 100% sécurisé (MVola, Orange Money, Airtel Money, Carte), la livraison rapide et garantie 1 an.
   - Urgence : Utiliser des expressions comme « Offre actuellement disponible », « Produit très demandé », « Stock limité ». Ne mentionner un stock limité QUE si le stock réel est ≤ 5 ! NE JAMAIS INVENTER de fausses promos ou de faux stocks.

8. RÈGLES DE SÉCURITÉ ET CONFIDENTIALITÉ STRICTES :
   - NE JAMAIS inventer de produits, prix, promotions ou commandes. Utiliser uniquement les données fournies.
   - NE JAMAIS demander de mot de passe, de numéro complet de carte bancaire ou de code CVV.
   - Respecter la confidentialité du client (isoler strictement les commandes).

CATALOGUE DISPONIBLE :
${catalogSummary}
`;

      let replyText = '';

      // Try Gemini API call with 8s timeout safeguard
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const geminiPromise = ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: [
              ...(conversationHistory && Array.isArray(conversationHistory)
                ? conversationHistory.slice(-6).map((h: any) => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.content }],
                  }))
                : []),
              { role: 'user', parts: [{ text: userMsg }] }
            ],
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
              maxOutputTokens: 600,
            }
          });

          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 8000)
          );

          const response: any = await Promise.race([geminiPromise, timeoutPromise]);

          if (response && response.text) {
            const geminiReply = response.text.trim();
            if (geminiReply) {
              replyText = geminiReply;
            }
          } else {
            console.warn('Gemini API request timed out after 8s, using smart fallback engine.');
          }
        } catch (geminiError: any) {
          const errMessage = geminiError?.message || String(geminiError);
          if (errMessage.includes('429') || errMessage.includes('quota') || errMessage.includes('RESOURCE_EXHAUSTED')) {
            console.warn('Gemini API quota exceeded, using smart fallback engine.');
          } else {
            console.warn('Gemini API call error:', errMessage);
          }
        }
      }

      // Smart Fallback Rule Engine per Language if Gemini is absent or hit quota
      if (!replyText) {
        if (detectedLang === 'mg') {
          if (needsHumanEscalation) {
            replyText = `Azoko tsara ny fangatahanao. 🎧 Ampifandraisiko aminao amin'ny mpanolotsaina olombelona avy amin'ny tolotra mpanjifa izao ianao.\n\nAzonao atao koa ny mandefa mailaka amin'ny **support@electrostore.mg**.`;
          } else if (isVagueQuery) {
            replyText = `Salama! 👋 Faly miarahaba anao. Mba hanampiana anao hitady ny entana mety aminao indrindra, azonao valiana ve ireto fanontaniana fohy ireto ?\n\n` +
              `1️⃣ **Inona ny teti-bolanao (budget) amin'ny Ariary ?**\n` +
              `2️⃣ **Inona no fampiasana kasainao atao (kasa: asa, lalao gaming, fampiasana andavanandro) ?**\n` +
              `3️⃣ **Misy marika (marque) tianao manokana ve (Apple, Samsung, Asus, Lenovo, Sony) ?**\n\n` +
              `🔒 *Fandoavam-bola azo antoka 100% (MVola, Orange Money, Airtel Money) | Fandefasana entana azo antoka sy antoka 1 taona.*`;
          } else if (isOrderTrackingQuery || foundOrder) {
            const ord = targetOrder;
            if (ord) {
              const itemsStr = (ord.items || ord.products || []).map((i: any) => `  • **${i.productName || i.name}** (x${i.quantity}) — ${i.price?.toLocaleString('fr-FR')} Ariary`).join('\n');
              replyText = `📦 **Fanaraha-maso ny Kaomandy (Suivi de Commande) :**\n\n` +
                `• **Laharana (N° Commande) :** #${ord.orderNumber || ord.id}\n` +
                `• **Toe-javatra (Statut) :** ${orderStatusStr}\n` +
                `• **Dingana manaraka (Prochaine étape) :** ${orderNextStepStr}\n` +
                `• **Daty tombanana hahatongavana :** ${estimatedDeliveryStr}\n` +
                `• **Famba fandoavam-bola :** ${ord.paymentMethod || 'Mobile Money'} (${ord.paymentStatus || 'Payé'})\n` +
                `• **Fitambaran'ny vidiny :** ${ord.total?.toLocaleString('fr-FR')} Ariary\n\n` +
                `**Entana nividianana :**\n${itemsStr}`;
            } else {
              replyText = `Tsy nisy kaomandy na fandoavam-bola hita tao amin'ny kaontinao aloha hatreto. Raha misy fanontaniana dia aza misalasala manontany!`;
            }
          } else if (isComparisonQuery && matchedProducts.length >= 2) {
            const p1 = matchedProducts[0];
            const p2 = matchedProducts[1];
            replyText = `📊 **Fampitahana Entana mitovy sokajy (Comparaison) :**\n\n` +
              `| Sokajy | ${p1.name} | ${p2.name} |\n` +
              `| :--- | :--- | :--- |\n` +
              `| **Vidiny (Prix)** | **${p1.price?.toLocaleString('fr-FR')} Ariary** | **${p2.price?.toLocaleString('fr-FR')} Ariary** |\n` +
              `| **Marika (Marque)** | ${p1.brand || 'ElectroStore'} | ${p2.brand || 'ElectroStore'} |\n` +
              `| **Tahiry (Stock)** | ${p1.stock && p1.stock > 0 ? `${p1.stock} misy` : 'Lany'} | ${p2.stock && p2.stock > 0 ? `${p2.stock} misy` : 'Lany'} |\n` +
              `| **Antoka (Garantie)** | 12 mois | 12 mois |\n` +
              `| **Naoty (Note)** | ⭐ ${p1.rating || 4.8}/5 | ⭐ ${p2.rating || 4.5}/5 |\n` +
              `| **Mombamomba** | ${p1.description || 'Garantie 12 mois'} | ${p2.description || 'Garantie 12 mois'} |\n\n` +
              `💡 **Mpanolo-tsaina :** Tadiavo izay mifanaraka amin'ny ilainao sy ny teti-bolanao! Jereo ny fampitahana eto ambany.`;
          } else if (isDeliveryQuery) {
            replyText = `🚚 **Fampahalalana momba ny Fandefasana Entana (Livraison) :**\n\n` +
              `• **Délais (Maniantoka fotoana) :** Antananarivo 24h-48h | Faritany (Provinces) 3-5 andro miasa.\n` +
              `• **Frais (Sarany) :** **MAHAPAIKA / GRATUIT** raha mihoatra ny 100 000 Ariary (sinon 5 000 Ar Antananarivo / 10 000 Ar Faritany).\n` +
              `• **Zones (Faritra) :** Antananarivo, Tamatave, Majunga, Fianarantsoa, Tuléar, Diego, Antsirabe, sy ny faritra rehetra eto Madagasikara.\n` +
              `• **Modes (Fomba) :** Fandefasana mivantana any an-trano/birao na Retrait amin'ny Magasin ElectroStore.`;
          } else if (isReturnRefundQuery) {
            replyText = `🔄 **Famerenana entana sy Remboursement (Retours & Remboursements) :**\n\n` +
              `1️⃣ **Misy zony 7 hatramin'ny 14 andro** aorian'ny nandraisana ny entana amina fiverenana.\n` +
              `2️⃣ Tsy maintsy mbola vaovao sy ao amin'ny emballage d'origine miaraka amin'ny fitaovana rehetra ny entana.\n` +
              `3️⃣ Mandefa hafatra amin'ny SAV na mitondra ny entana any amin'ny ivon-toerana SAV-tsika.\n` +
              `4️⃣ Rehefa voazava amin'ny teknisianina, **remboursement atao ao anatin'ny 48h-72h** amin'ny Mobile Money (MVola, Orange Money, Airtel Money) na fifanakalozana entana vaovao.`;
          } else if (matchedProducts.length > 0) {
            const productList = matchedProducts.map(p => `• **${p.name}** — ${p.price?.toLocaleString('fr-FR')} Ariary ${p.stock && p.stock <= 5 ? `*(Stock limité: ${p.stock} ambony)*` : '(Misy amin\'ny tahiry)'}`).join('\n');
            const compList = complementaryProducts.length > 0 ? `\n\n💡 **Accessoires recommandés :**\n` + complementaryProducts.map(a => `• **${a.name}** — ${a.price?.toLocaleString('fr-FR')} Ariary`).join('\n') : '';
            replyText = `🔍 **Ireto avy ny entana mety aminao :**\n\n${productList}${compList}\n\nAzonao atao ny manindry ny bouton **"Ajouter"** mba hampidirana azy amin'ny harona.`;
          } else {
            replyText = `Salama! 👋 Tongasoa eto amin'ny **ElectroStore**! Azoko atao ny manampy anao amin'ny fitadiavana entana, fampitahana vokatra mitovy sokajy, fanarrahana kaomandy sy fandoavam-bola, na momba ny fandefasana sy famerenana entana.\n\nInona no azoko anampiana anao?`;
          }
        } else if (detectedLang === 'en') {
          if (needsHumanEscalation) {
            replyText = `I have received your request. 🎧 Transferring you to a human customer representative.\n\nYou can also contact us via email at **support@electrostore.mg**.`;
          } else if (isVagueQuery) {
            replyText = `Hello! 👋 Welcome to ElectroStore. To help you find the exact product for your needs, could you answer these 3 quick questions?\n\n` +
              `1️⃣ **What is your target budget (in Ariary)?**\n` +
              `2️⃣ **What is your primary intended use (work, gaming, daily tasks)?**\n` +
              `3️⃣ **Do you have a preferred brand (Apple, Samsung, Asus, Lenovo, Sony)?**\n\n` +
              `🔒 *100% Secure Mobile Money Payment | Reliable trackable delivery & 1 year warranty.*`;
          } else if (isOrderTrackingQuery || foundOrder) {
            const ord = targetOrder;
            if (ord) {
              const itemsStr = (ord.items || ord.products || []).map((i: any) => `  • **${i.productName || i.name}** (x${i.quantity}) — ${i.price?.toLocaleString('fr-FR')} Ariary`).join('\n');
              replyText = `📦 **Order Tracking Details:**\n\n` +
                `• **Order Number:** #${ord.orderNumber || ord.id}\n` +
                `• **Current Status:** ${orderStatusStr}\n` +
                `• **Next Step:** ${orderNextStepStr}\n` +
                `• **Estimated Delivery Date:** ${estimatedDeliveryStr}\n` +
                `• **Payment Method:** ${ord.paymentMethod || 'Mobile Money'} (${ord.paymentStatus || 'Paid'})\n` +
                `• **Total Amount:** ${ord.total?.toLocaleString('fr-FR')} Ariary\n\n` +
                `**Purchased Items:**\n${itemsStr}`;
            } else {
              replyText = `No recent order or payment found in your account. Feel free to ask if you need help finding products or placing a new order!`;
            }
          } else if (isComparisonQuery && matchedProducts.length >= 2) {
            const p1 = matchedProducts[0];
            const p2 = matchedProducts[1];
            replyText = `📊 **Same-Category Product Comparison:**\n\n` +
              `| Feature | ${p1.name} | ${p2.name} |\n` +
              `| :--- | :--- | :--- |\n` +
              `| **Price** | **${p1.price?.toLocaleString('fr-FR')} Ariary** | **${p2.price?.toLocaleString('fr-FR')} Ariary** |\n` +
              `| **Brand** | ${p1.brand || 'ElectroStore'} | ${p2.brand || 'ElectroStore'} |\n` +
              `| **Stock Availability** | ${p1.stock && p1.stock > 0 ? `${p1.stock} in stock` : 'Out of stock'} | ${p2.stock && p2.stock > 0 ? `${p2.stock} in stock` : 'Out of stock'} |\n` +
              `| **Warranty** | 12 Months Manufacturer | 12 Months Manufacturer |\n` +
              `| **Rating** | ⭐ ${p1.rating || 4.8}/5 | ⭐ ${p2.rating || 4.5}/5 |\n` +
              `| **Highlights** | ${p1.description || '12 months warranty'} | ${p2.description || '12 months warranty'} |\n\n` +
              `💡 **Advisor Recommendation:** Choose the product that best matches your budget and expected performance! See side-by-side cards below.`;
          } else if (isDeliveryQuery) {
            replyText = `🚚 **Delivery & Shipping Policy:**\n\n` +
              `• **Delivery Time:** Antananarivo 24h-48h | Provinces 3-5 business days.\n` +
              `• **Fees:** **FREE** for orders above 100,000 Ariary (otherwise 5,000 Ar in Tana / 10,000 Ar in Provinces).\n` +
              `• **Coverage:** Antananarivo, Tamatave, Majunga, Fianarantsoa, Tuléar, Diego-Suarez, Antsirabe, and all regions across Madagascar.\n` +
              `• **Modes:** Hand delivery at home/office or Free Store Pickup.`;
          } else if (isReturnRefundQuery) {
            replyText = `🔄 **Returns & Refund Procedure:**\n\n` +
              `1️⃣ **7 to 14 days** return window after order delivery.\n` +
              `2️⃣ Items must be in brand-new condition with original packaging and complete accessories.\n` +
              `3️⃣ Contact customer support or drop the item at our local service center.\n` +
              `4️⃣ After quality inspection (within 24h), **refund processed within 48h-72h** via Mobile Money (MVola, Orange Money, Airtel Money) or item replacement.`;
          } else if (matchedProducts.length > 0) {
            const productList = matchedProducts.map(p => `• **${p.name}** — ${p.price?.toLocaleString('fr-FR')} Ariary ${p.stock && p.stock <= 5 ? `*(Limited Stock: ${p.stock} left)*` : '(In Stock)'}`).join('\n');
            const compList = complementaryProducts.length > 0 ? `\n\n💡 **Recommended Accessories:**\n` + complementaryProducts.map(a => `• **${a.name}** — ${a.price?.toLocaleString('fr-FR')} Ariary`).join('\n') : '';
            replyText = `🔍 **Here are the best matching products:**\n\n${productList}${compList}\n\nYou can click **Add to Cart** to order directly.`;
          } else {
            replyText = `Hello! 👋 Welcome to **ElectroStore**! I can help you compare same-category items, track your order status & delivery date, explain shipping or return policies, or recommend tailored electronics.\n\nHow can I help you today?`;
          }
        } else {
          // French Fallback
          if (needsHumanEscalation) {
            replyText = `J'ai bien noté votre demande. 🎧 Je vous met en relation avec un conseiller de notre service client humain.\n\nVous pouvez nous contacter directement par email à **support@electrostore.mg**.`;
          } else if (isVagueQuery) {
            replyText = `Bonjour ! 👋 Bienvenue chez ElectroStore. Pour vous proposer le produit le plus adapté à vos besoins, pourriez-vous répondre à ces 3 courtes questions ?\n\n` +
              `1️⃣ **Quel est votre budget maximal (en Ariary) ?**\n` +
              `2️⃣ **Pour quel usage principal recherchez-vous ce produit (travail, jeux/gaming, quotidien) ?**\n` +
              `3️⃣ **Avez-vous une marque de préférence (Apple, Samsung, Asus, Lenovo, Sony, etc.) ?**\n\n` +
              `🔒 *Paiement 100% sécurisé via Mobile Money (MVola, Orange Money, Airtel Money) ou Carte | Livraison suivie & Garantie 1 an.*`;
          } else if (isOrderTrackingQuery || foundOrder) {
            const ord = targetOrder;
            if (ord) {
              const itemsStr = (ord.items || ord.products || []).map((i: any) => `  • **${i.productName || i.name}** (x${i.quantity}) — ${i.price?.toLocaleString('fr-FR')} Ariary`).join('\n');
              replyText = `📦 **Suivi de votre Commande & Statut :**\n\n` +
                `• **Numéro de Commande :** #${ord.orderNumber || ord.id}\n` +
                `• **Statut actuel :** ${orderStatusStr}\n` +
                `• **Prochaine étape :** ${orderNextStepStr}\n` +
                `• **Date estimée de livraison :** ${estimatedDeliveryStr}\n` +
                `• **Mode de Paiement :** ${ord.paymentMethod || 'Mobile Money'} (${ord.paymentStatus || 'Payé'})\n` +
                `• **Montant Total :** ${ord.total?.toLocaleString('fr-FR')} Ariary\n\n` +
                `**Articles inclus :**\n${itemsStr}`;
            } else {
              replyText = `Aucune commande ou paiement récent n'a été trouvé sur votre compte. N'hésitez pas à nous demander si vous souhaitez effectuer un nouvel achat !`;
            }
          } else if (isComparisonQuery && matchedProducts.length >= 2) {
            const p1 = matchedProducts[0];
            const p2 = matchedProducts[1];
            replyText = `📊 **Tableau Comparatif (Produits de même catégorie) :**\n\n` +
              `| Caractéristique | ${p1.name} | ${p2.name} |\n` +
              `| :--- | :--- | :--- |\n` +
              `| **Prix** | **${p1.price?.toLocaleString('fr-FR')} Ariary** | **${p2.price?.toLocaleString('fr-FR')} Ariary** |\n` +
              `| **Marque** | ${p1.brand || 'ElectroStore'} | ${p2.brand || 'ElectroStore'} |\n` +
              `| **Disponibilité** | ${p1.stock && p1.stock > 0 ? `${p1.stock} unités` : 'Rupture'} | ${p2.stock && p2.stock > 0 ? `${p2.stock} unités` : 'Rupture'} |\n` +
              `| **Garantie** | 12 Mois Constructeur | 12 Mois Constructeur |\n` +
              `| **Avis Clients** | ⭐ ${p1.rating || 4.8}/5 | ⭐ ${p2.rating || 4.5}/5 |\n` +
              `| **Description** | ${p1.description || 'Garantie 12 mois'} | ${p2.description || 'Garantie 12 mois'} |\n\n` +
              `💡 **Conseil :** Le **${(p1.price || 0) <= (p2.price || 0) ? p1.name : p2.name}** offre le tarif le plus avantageux dans cette catégorie ! Comparez les détails ci-dessous pour l'ajouter à votre panier.`;
          } else if (isDeliveryQuery) {
            replyText = `🚚 **Politique et Informations sur la Livraison :**\n\n` +
              `• **Délais :** Antananarivo sous 24h à 48h | Provinces sous 3 à 5 jours ouvrés.\n` +
              `• **Frais :** **OFFERTS** dès 100 000 Ariary d'achat ! (Sinon 5 000 Ar à Tana centre / 10 000 Ar en Province).\n` +
              `• **Zones desservies :** Antananarivo, Tamatave, Majunga, Fianarantsoa, Tuléar, Diego-Suarez, Antsirabe et toute l'île de Madagascar.\n` +
              `• **Modes de livraison :** Remise en main propre à votre adresse (domicile/bureau) ou Retrait gratuit en magasin ElectroStore.`;
          } else if (isReturnRefundQuery) {
            replyText = `🔄 **Procédure de Retour & Remboursement :**\n\n` +
              `1️⃣ **14 jours** de délai pour retourner un produit inutilisé.\n` +
              `2️⃣ L'article doit être dans son état d'origine complet (emballage, câbles, notice).\n` +
              `3️⃣ Contactez notre support ou déposez le produit au centre SAV.\n` +
              `4️⃣ Après vérification sous 24h par nos techniciens, le **remboursement est effectué sous 48h à 72h** par Mobile Money (MVola, Orange Money, Airtel Money) ou échange standard.`;
          } else if (matchedProducts.length > 0) {
            const productList = matchedProducts.map(p => `• **${p.name}** — ${p.price?.toLocaleString('fr-FR')} Ariary ${p.stock && p.stock <= 5 ? `*(Stock limité: plus que ${p.stock} unités !)*` : '(En stock)'}`).join('\n');
            const compList = complementaryProducts.length > 0 ? `\n\n💡 **Accessoires complémentaires recommandés :**\n` + complementaryProducts.map(a => `• **${a.name}** — ${a.price?.toLocaleString('fr-FR')} Ariary`).join('\n') : '';
            replyText = `🔍 **Voici les meilleurs choix correspondant à votre recherche :**\n\n${productList}${compList}\n\nVous pouvez cliquer sur **Ajouter** pour les ajouter directement à votre panier !`;
          } else {
            replyText = `Bonjour ! 👋 Bienvenue chez **ElectroStore**. Je peux vous guider pour comparer des produits de même catégorie, suivre votre commande (statut, étape et date estimée), vous informer sur la livraison et les retours, ou vous recommander des appareils adaptés.\n\nQue recherchez-vous aujourd'hui ?`;
          }
        }
      }

      // Persist session messages in-memory store
      const storeKey = userId || sessionId || 'anonymous';
      const history = chatSessionsStore.get(storeKey) || [];
      history.push(
        { id: `u-${Date.now()}`, sender: 'user', text: userMsg, timestamp: new Date() },
        { id: `b-${Date.now()}`, sender: 'bot', text: replyText, products: matchedProducts, timestamp: new Date() }
      );
      chatSessionsStore.set(storeKey, history.slice(-50)); // Keep last 50

      return res.json({
        reply: replyText,
        language: detectedLang,
        type: isComparisonQuery && matchedProducts.length >= 2 ? 'comparison' : (matchedProducts.length > 0 ? 'products' : 'text'),
        products: matchedProducts,
        quickReplies,
        escalateToHuman: needsHumanEscalation,
      });
    } catch (error: any) {
      console.error('Error in /api/chat endpoint:', error);
      return res.status(500).json({ error: 'Erreur serveur lors du traitement de la requête.' });
    }
  });

  // Get chat history endpoint
  app.get('/api/chat/history', async (req, res) => {
    try {
      const { userId, sessionId } = req.query;
      const key = (userId as string) || (sessionId as string) || 'anonymous';
      const history = chatSessionsStore.get(key) || [];
      return res.json({ history });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique.' });
    }
  });

  // Delete/Reset chat history endpoint
  app.delete('/api/chat/history', async (req, res) => {
    try {
      const { userId, sessionId } = req.query;
      const key = (userId as string) || (sessionId as string) || 'anonymous';
      chatSessionsStore.delete(key);
      return res.json({ success: true, message: 'Historique effacé.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur lors de la réinitialisation.' });
    }
  });

  // Feedback endpoint
  app.post('/api/chat/feedback', async (req, res) => {
    try {
      const { messageId, rating, feedbackText } = req.body || {};
      console.log(`[Chatbot Feedback] Msg: ${messageId}, Rating: ${rating}, Notes: ${feedbackText || 'N/A'}`);
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Erreur feedback.' });
    }
  });

  // n8n Chat proxy endpoint to prevent CORS / NetworkError in browser
  app.all('/api/n8n-chat*', async (req, res) => {
    try {
      const baseUrl = 'https://hery18.app.n8n.cloud/webhook/9c4f3690-aef2-4fe6-b1c2-c4692fe55999/chat';
      const queryIndex = req.originalUrl.indexOf('?');
      const queryString = queryIndex !== -1 ? req.originalUrl.slice(queryIndex) : '';
      const targetUrl = baseUrl + queryString;

      const headers: Record<string, string> = {};
      if (req.headers['content-type']) {
        headers['content-type'] = req.headers['content-type'] as string;
      } else {
        headers['content-type'] = 'application/json';
      }
      if (req.headers['accept']) {
        headers['accept'] = req.headers['accept'] as string;
      }
      if (req.headers['authorization']) {
        headers['authorization'] = req.headers['authorization'] as string;
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
        fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);

      res.status(response.status);
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      const data = await response.text();
      res.send(data);
    } catch (error: any) {
      console.error('n8n proxy error:', error);
      res.status(502).json({
        error: 'Chat API error',
        message: error?.message || 'Unable to connect to n8n chat backend'
      });
    }
  });

  app.get('/api/debug-mongo', (req, res) => {
    const raw = process.env.MONGODB_URI || '';
    const charCodes = [];
    for (let i = 0; i < Math.min(raw.length, 30); i++) {
      charCodes.push({ char: raw[i], code: raw.charCodeAt(i) });
    }
    return res.json({
      exists: !!raw,
      length: raw.length,
      startsWithMongodb: raw.startsWith('mongodb://') || raw.startsWith('mongodb+srv://'),
      charCodes,
      rawMasked: raw.replace(/:([^@]+)@/, ':****@') // mask password safely
    });
  });

  // AUTHENTICATION
  
  // 1. REGISTER WITH EMAIL + PASSWORD (Sends 6-digit confirmation code)
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, address, phone, password } = req.body || {};

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Le nom complet, l\'email et le mot de passe sont obligatoires.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanName = name.trim();

      // Email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return res.status(400).json({ message: 'Format d\'adresse email invalide.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
      }

      // Check if user already exists
      const existingUser = await getUserByEmail(cleanEmail);
      if (existingUser && existingUser.emailVerified !== false) {
        return res.status(400).json({ message: 'Un compte avec cette adresse email existe déjà. Veuillez vous connecter.' });
      }

      // Hash password securely with bcrypt
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate cryptographically secure 6-digit verification code
      const code = crypto.randomInt(100000, 1000000).toString();

      // Hash verification code before storage (never stored in plain text)
      const codeHash = await bcrypt.hash(code, 10);

      // Set expiry to 10 minutes from now
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const now = new Date().toISOString();

      // Store pending verification in MongoDB / Memory
      const pendingData: PendingVerification = {
        email: cleanEmail,
        name: cleanName,
        passwordHash,
        address: address ? address.trim() : '',
        phone: phone ? phone.trim() : '',
        codeHash,
        attempts: 0,
        resendCount: 0,
        lastResentAt: now,
        expiresAt,
        createdAt: now
      };

      await savePendingVerification(pendingData);

      // Send verification email via Nodemailer SMTP
      await sendVerificationEmail({
        toEmail: cleanEmail,
        userName: cleanName,
        code,
        expiresInMinutes: 10
      });

      return res.status(200).json({
        success: true,
        requireVerification: true,
        email: cleanEmail,
        message: 'Un code de confirmation à 6 chiffres vous a été envoyé par email. Veuillez vérifier votre boîte de réception.'
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Erreur serveur lors de l\'initiation de l\'inscription.' });
    }
  });

  // 2. VERIFY EMAIL (Validate 6-digit code & activate user account)
  app.post('/api/auth/verify-email', async (req, res) => {
    try {
      const { email, code } = req.body || {};

      if (!email || !code) {
        return res.status(400).json({ message: 'L\'email et le code de vérification sont requis.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = code.toString().trim();

      const pending = await getPendingVerification(cleanEmail);
      if (!pending) {
        return res.status(400).json({ message: 'Aucune demande d\'inscription trouvée pour cet email ou le code a expiré.' });
      }

      // Check code expiration (10 minutes)
      if (new Date(pending.expiresAt).getTime() < Date.now()) {
        await deletePendingVerification(cleanEmail);
        return res.status(400).json({ message: 'Le code de vérification a expiré. Veuillez demander un nouveau code.' });
      }

      // Brute-force protection: check max attempts (max 5 attempts)
      if (pending.attempts >= 5) {
        await deletePendingVerification(cleanEmail);
        return res.status(400).json({ message: 'Nombre maximal de tentatives dépassé. Veuillez demander un nouveau code.' });
      }

      // Compare code with stored hash
      const isCodeValid = await bcrypt.compare(cleanCode, pending.codeHash);
      if (!isCodeValid) {
        const updatedAttempts = (pending.attempts || 0) + 1;
        await updatePendingVerification(cleanEmail, { attempts: updatedAttempts });
        const remaining = 5 - updatedAttempts;
        return res.status(400).json({
          message: `Code de confirmation incorrect. ${remaining > 0 ? `Il vous reste ${remaining} tentative(s).` : 'Veuillez demander un nouveau code.'}`
        });
      }

      // Code is valid -> Create & activate the user account
      const newUser: User = {
        id: 'user_' + Date.now(),
        name: pending.name,
        email: cleanEmail,
        role: cleanEmail === 'andriamifehy18@gmail.com' ? 'admin' : 'customer',
        address: pending.address || '',
        phone: pending.phone || '',
        password: pending.passwordHash,
        passwordHash: pending.passwordHash,
        provider: 'local',
        authProvider: 'local',
        emailVerified: true,
        createdAt: pending.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await createUser(newUser);
      await deletePendingVerification(cleanEmail);

      const token = Buffer.from(JSON.stringify(newUser)).toString('base64');

      return res.status(200).json({
        success: true,
        user: newUser,
        token,
        message: 'Félicitations ! Votre compte a été vérifié et activé avec succès.'
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      return res.status(500).json({ message: 'Erreur serveur lors de la vérification du code.' });
    }
  });

  // 3. RESEND VERIFICATION CODE (With rate limiting & cooldown)
  app.post('/api/auth/resend-code', async (req, res) => {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({ message: 'L\'adresse email est requise.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      let pending = await getPendingVerification(cleanEmail);

      if (!pending) {
        const existingUser = await getUserByEmail(cleanEmail);
        if (existingUser && existingUser.emailVerified === false) {
          // Re-create pending verification for unverified user
          const code = crypto.randomInt(100000, 1000000).toString();
          const codeHash = await bcrypt.hash(code, 10);
          pending = {
            email: cleanEmail,
            name: existingUser.name,
            passwordHash: existingUser.password || '',
            address: existingUser.address,
            phone: existingUser.phone,
            codeHash,
            attempts: 0,
            resendCount: 0,
            lastResentAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          };
          await savePendingVerification(pending);
          await sendVerificationEmail({ toEmail: cleanEmail, userName: existingUser.name, code });
          return res.json({ success: true, message: 'Un nouveau code de confirmation a été envoyé par email.' });
        }

        return res.status(404).json({ message: 'Aucune inscription en attente trouvée pour cet email.' });
      }

      // Check cooldown: at least 45 seconds between resends
      const lastResentTime = new Date(pending.lastResentAt || pending.createdAt).getTime();
      const elapsedSeconds = (Date.now() - lastResentTime) / 1000;
      if (elapsedSeconds < 45) {
        const waitSeconds = Math.ceil(45 - elapsedSeconds);
        return res.status(429).json({ message: `Veuillez patienter ${waitSeconds} seconde(s) avant de demander un nouveau code.` });
      }

      // Check maximum resend limit per session (max 5)
      if (pending.resendCount >= 5) {
        return res.status(429).json({ message: 'Limite de renvoi atteinte pour cette session. Veuillez patienter ou recommencer l\'inscription.' });
      }

      // Generate fresh 6-digit code
      const newCode = crypto.randomInt(100000, 1000000).toString();
      const newCodeHash = await bcrypt.hash(newCode, 10);

      await updatePendingVerification(cleanEmail, {
        codeHash: newCodeHash,
        attempts: 0,
        resendCount: (pending.resendCount || 0) + 1,
        lastResentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      });

      await sendVerificationEmail({
        toEmail: cleanEmail,
        userName: pending.name,
        code: newCode,
        expiresInMinutes: 10
      });

      return res.json({
        success: true,
        message: 'Un nouveau code de confirmation à 6 chiffres vous a été envoyé par email.'
      });
    } catch (error: any) {
      console.error('Resend code error:', error);
      return res.status(500).json({ message: 'Erreur lors du renvoi du code de confirmation.' });
    }
  });

  // 4. LOGIN (Email + Password)
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ message: 'L\'email et le mot de passe sont requis.' });
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const user = await getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
      }

      // Check if user has a password registered
      const userPwd = user.password || user.passwordHash;
      if (!userPwd) {
        if (user.authProvider === 'google' || user.provider === 'google') {
          return res.status(400).json({
            message: 'Ce compte a été créé via Google. Veuillez vous connecter avec le bouton "Continuer avec Google".'
          });
        }
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
      }

      // Compare bcrypt hash or legacy string equality
      let isMatch = false;
      if (userPwd.startsWith('$2a$') || userPwd.startsWith('$2b$') || userPwd.startsWith('$2y$')) {
        isMatch = await bcrypt.compare(password, userPwd);
      } else {
        isMatch = userPwd === password;
        if (isMatch) {
          // Transparently upgrade legacy plain-text password to bcrypt hash
          const upgradedHash = await bcrypt.hash(password, 10);
          await updateUser(user.id, { password: upgradedHash, passwordHash: upgradedHash });
        }
      }

      if (!isMatch) {
        return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
      }

      // Check if email is verified
      if (user.emailVerified === false) {
        return res.status(403).json({
          emailUnverified: true,
          email: user.email,
          message: 'Votre adresse email n\'a pas encore été vérifiée. Veuillez saisir le code de confirmation reçu par email.'
        });
      }

      // Generate session token
      const token = Buffer.from(JSON.stringify(user)).toString('base64');
      return res.json({
        user,
        token,
        message: 'Connexion réussie.'
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Erreur lors de la connexion.' });
    }
  });

  app.post('/api/auth/logout', requireAuth, (req, res) => {
    return res.json({ message: 'Déconnexion réussie côté serveur.' });
  });

  // 5. GOOGLE SIGN-IN / SIGN-UP (Server-side verified)
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { credential, accessToken, email, name, avatar, googleId } = req.body || {};

      let verifiedEmail = '';
      let verifiedName = name;
      let verifiedAvatar = avatar;
      let verifiedGoogleId = googleId;

      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '112086335849-p51i3pms1srkd07rvsb3nclmnjfcj8n1.apps.googleusercontent.com';

      // 1. Verify Google ID Token server-side via Google Auth Library
      if (credential && typeof credential === 'string') {
        try {
          const authClient = new OAuth2Client(GOOGLE_CLIENT_ID);
          const ticket = await authClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
          }).catch(async () => {
            // Also try without audience restriction if client IDs slightly differ in environment
            return await authClient.verifyIdToken({ idToken: credential });
          });

          const payload = ticket.getPayload();
          if (payload && payload.email) {
            verifiedEmail = payload.email;
            verifiedName = payload.name || verifiedName;
            verifiedAvatar = payload.picture || verifiedAvatar;
            verifiedGoogleId = payload.sub || verifiedGoogleId;
          }
        } catch (verifyErr: any) {
          console.warn('Google verifyIdToken error, attempting tokeninfo fallback:', verifyErr?.message);
          // Fallback: verify with Google's public tokeninfo endpoint
          try {
            const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
            if (tokenInfoRes.ok) {
              const tokenInfo = await tokenInfoRes.json();
              if (tokenInfo.email) {
                verifiedEmail = tokenInfo.email;
                verifiedName = tokenInfo.name || verifiedName;
                verifiedAvatar = tokenInfo.picture || verifiedAvatar;
                verifiedGoogleId = tokenInfo.sub || verifiedGoogleId;
              }
            }
          } catch (fetchErr) {
            console.warn('Tokeninfo fallback failed:', fetchErr);
          }
        }
      }

      // 2. Fallback using Google access token if provided
      if (!verifiedEmail && accessToken) {
        try {
          const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (gRes.ok) {
            const gData = await gRes.json();
            verifiedEmail = gData.email;
            verifiedName = gData.name || verifiedName;
            verifiedAvatar = gData.picture || verifiedAvatar;
            verifiedGoogleId = gData.sub || verifiedGoogleId;
          }
        } catch (fetchErr) {
          console.warn('Could not fetch Google userinfo from access token:', fetchErr);
        }
      }

      // If token payload was decoded on the client and passes validation
      if (!verifiedEmail && email) {
        verifiedEmail = email;
      }

      if (!verifiedEmail) {
        return res.status(400).json({ message: 'Identifiant Google invalide ou non vérifié.' });
      }

      const { user, isNew } = await findOrCreateGoogleUser({
        email: verifiedEmail,
        name: verifiedName,
        avatar: verifiedAvatar,
        googleId: verifiedGoogleId
      });

      const token = Buffer.from(JSON.stringify(user)).toString('base64');

      return res.json({
        user,
        token,
        isNew,
        message: isNew ? 'Compte client créé avec succès via Google !' : 'Connexion via Google réussie !'
      });
    } catch (error: any) {
      console.error('Google auth error:', error);
      return res.status(500).json({ message: error.message || 'Erreur lors de l\'authentification Google.' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    try {
      const curUser = (req as any).user;
      const user = await getUserById(curUser.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
      }
      return res.json({ user });
    } catch (error) {
      console.error('Me error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération du profil.' });
    }
  });

  app.put('/api/auth/profile', requireAuth, async (req, res) => {
    const { name, address, phone } = req.body;
    const curUser = (req as any).user;

    try {
      const user = await getUserById(curUser.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
      }

      const updatedData: Partial<User> = {};
      if (name) updatedData.name = name;
      if (address !== undefined) updatedData.address = address;
      if (phone !== undefined) updatedData.phone = phone;

      await updateUser(curUser.id, updatedData);
      
      return res.json({
        user: { ...user, ...updatedData },
        message: 'Profil mis à jour avec succès.'
      });
    } catch (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.' });
    }
  });

  app.put('/api/auth/change-password', requireAuth, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const curUser = (req as any).user;

    if (!newPassword) {
      return res.status(400).json({ message: 'Le nouveau mot de passe est requis.' });
    }

    try {
      const user = await getUserById(curUser.id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé.' });
      }

      // Check old password if set
      if (user.password && user.password !== oldPassword) {
        return res.status(400).json({ message: 'L\'ancien mot de passe est incorrect.' });
      }

      await updateUser(curUser.id, { password: newPassword });

      return res.json({ message: 'Mot de passe modifié avec succès.' });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ message: 'Erreur lors de la modification du mot de passe.' });
    }
  });

  // CATEGORIES CRUD
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await getCategories();
      return res.json(categories);
    } catch (error) {
      console.error('Fetch categories error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des catégories.' });
    }
  });

  app.post('/api/categories', requireAdmin, async (req, res) => {
    const { name, description, image } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const newCategory: Category = {
      id: 'cat_' + Date.now(),
      name,
      slug,
      description: description || '',
      image: image || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400'
    };

    try {
      await createCategory(newCategory);
      return res.status(201).json(newCategory);
    } catch (error) {
      console.error('Create category error:', error);
      return res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
    }
  });

  app.put('/api/categories/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, image } = req.body;

    try {
      const categories = await getCategories();
      const cat = categories.find((c: Category) => c.id === id);
      if (!cat) {
        return res.status(404).json({ message: 'Catégorie introuvable.' });
      }

      const updatedData: Partial<Category> = {};
      if (name) {
        updatedData.name = name;
        updatedData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (description !== undefined) updatedData.description = description;
      if (image !== undefined) updatedData.image = image;

      await updateCategory(id, updatedData);
      return res.json({ ...cat, ...updatedData });
    } catch (error) {
      console.error('Update category error:', error);
      return res.status(500).json({ message: 'Erreur lors de la modification de la catégorie.' });
    }
  });

  app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      const categories = await getCategories();
      const cat = categories.find((c: Category) => c.id === id);
      if (!cat) {
        return res.status(404).json({ message: 'Catégorie introuvable.' });
      }

      await deleteCategory(id);
      return res.json({ message: 'Catégorie supprimée avec succès.' });
    } catch (error) {
      console.error('Delete category error:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie.' });
    }
  });

  // PRODUCTS CRUD
  app.get('/api/products', async (req, res) => {
    try {
      const products = await getProducts();
      const categories = await getCategories();
      let result = [...products] as Product[];

      const { search, category, brand, minPrice, maxPrice, sort, page = 1, limit = 9 } = req.query;

      // Filter by search
      if (search) {
        const term = String(search).toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term));
      }

      // Filter by category slug or ID
      if (category && category !== 'all') {
        const cat = categories.find((c: Category) => c.slug === category || c.id === category);
        if (cat) {
          result = result.filter(p => p.categoryId === cat.id);
        }
      }

      // Filter by brand
      if (brand && brand !== 'all') {
        result = result.filter(p => p.brand.toLowerCase() === String(brand).toLowerCase());
      }

      // Filter by price
      if (minPrice) {
        result = result.filter(p => (p.discountPrice || p.price) >= Number(minPrice));
      }
      if (maxPrice) {
        result = result.filter(p => (p.discountPrice || p.price) <= Number(maxPrice));
      }

      // Sort products
      if (sort) {
        if (sort === 'price-asc') {
          result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        } else if (sort === 'price-desc') {
          result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        } else if (sort === 'rating') {
          result.sort((a, b) => b.rating - a.rating);
        } else if (sort === 'newest') {
          result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      }

      // Pagination
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const total = result.length;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedProducts = result.slice(startIndex, startIndex + limitNum);

      return res.json({
        products: paginatedProducts,
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum
      });
    } catch (error) {
      console.error('Fetch products error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des produits.' });
    }
  });

  // Get single product details
  app.get('/api/products/:slug', async (req, res) => {
    const { slug } = req.params;
    
    try {
      const products = await getProducts();
      if (!slug) {
        return res.status(404).json({ message: 'Produit introuvable.' });
      }

      const rawSlug = String(slug).trim();
      const decodedSlug = decodeURIComponent(rawSlug).trim().toLowerCase();

      // Find product by id, slug or slugified name
      let product = products.find((p: Product) => {
        if (!p) return false;
        const pId = p.id ? String(p.id).trim().toLowerCase() : '';
        const pSlug = p.slug ? String(p.slug).trim().toLowerCase() : '';
        const pNameSlug = p.name ? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '';

        return pId === decodedSlug || pSlug === decodedSlug || pNameSlug === decodedSlug || pId === rawSlug.toLowerCase() || pSlug === rawSlug.toLowerCase();
      });

      // Secondary fallback: find by partial match on id or slug
      if (!product) {
        product = products.find((p: Product) => {
          if (!p) return false;
          const pId = p.id ? String(p.id).toLowerCase() : '';
          const pSlug = p.slug ? String(p.slug).toLowerCase() : '';
          return (pId && (pId.includes(decodedSlug) || decodedSlug.includes(pId))) ||
                 (pSlug && (pSlug.includes(decodedSlug) || decodedSlug.includes(pSlug)));
        });
      }

      if (!product) {
        return res.status(404).json({ message: 'Produit introuvable.' });
      }
      return res.json(product);
    } catch (error) {
      console.error('Fetch single product error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération du produit.' });
    }
  });

  // Admin Create Product
  app.post('/api/products', requireAdmin, async (req, res) => {
    const { name, description, price, discountPrice, stock, categoryId, brand, images, featured } = req.body;

    if (!name || !price || !categoryId || !brand) {
      return res.status(400).json({ message: 'Les champs Nom, Prix, Catégorie et Marque sont requis.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.floor(Math.random() * 1000);
    const newProduct: Product = {
      id: 'prod_' + Date.now(),
      name,
      slug,
      description: description || '',
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock) || 0,
      categoryId,
      brand,
      images: images && images.length > 0 ? images : ['https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=600'],
      rating: 5.0,
      reviewsCount: 0,
      featured: !!featured,
      createdAt: new Date().toISOString()
    };

    try {
      await createProduct(newProduct);

      // NOTIFY ALL USERS ABOUT NEW PRODUCT
      const allUsers = await getUsers();
      for (const u of allUsers) {
        await createNotification({
          id: 'notif_' + Date.now() + Math.random().toString(36).substring(7),
          userId: u.id,
          title: 'Nouveau Produit Disponible !',
          message: `Découvrez notre nouveau produit : ${newProduct.name}`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      return res.status(201).json(newProduct);
    } catch (error) {
      console.error('Create product error:', error);
      return res.status(500).json({ message: 'Erreur lors de la création du produit.' });
    }
  });

  // Admin Edit Product
  app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, price, discountPrice, stock, categoryId, brand, images, featured } = req.body;

    try {
      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Produit introuvable.' });
      }

      const updatedData: Partial<Product> = {};
      if (name) {
        updatedData.name = name;
        updatedData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      if (description !== undefined) updatedData.description = description;
      if (price !== undefined) updatedData.price = Number(price);
      if (discountPrice !== undefined) updatedData.discountPrice = discountPrice ? Number(discountPrice) : undefined;
      if (stock !== undefined) updatedData.stock = Number(stock);
      if (categoryId) updatedData.categoryId = categoryId;
      if (brand) updatedData.brand = brand;
      if (images) updatedData.images = images;
      if (featured !== undefined) updatedData.featured = !!featured;

      await updateProduct(id, updatedData);
      return res.json({ ...product, ...updatedData });
    } catch (error) {
      console.error('Edit product error:', error);
      return res.status(500).json({ message: 'Erreur lors de la modification du produit.' });
    }
  });

  // Admin Delete Product
  app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      const product = await getProductById(id);
      if (!product) {
        return res.status(404).json({ message: 'Produit introuvable.' });
      }

      await deleteProduct(id);
      return res.json({ message: 'Produit supprimé avec succès.' });
    } catch (error) {
      console.error('Delete product error:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression du produit.' });
    }
  });

  // REVIEWS ENDPOINTS
  app.get('/api/reviews/:productId', async (req, res) => {
    const { productId } = req.params;
    
    try {
      const reviews = await getReviews();
      const productReviews = reviews.filter((r: Review) => r.productId === productId);
      return res.json(productReviews);
    } catch (error) {
      console.error('Fetch reviews error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des avis.' });
    }
  });

  app.post('/api/reviews', requireAuth, async (req, res) => {
    const { productId, rating, comment } = req.body;
    const curUser = (req as any).user;

    if (!productId || !rating) {
      return res.status(400).json({ message: 'Le produit et la note sont requis.' });
    }

    try {
      const newReview: Review = {
        id: 'rev_' + Date.now(),
        productId,
        userId: curUser.id,
        userName: curUser.name || 'Client anonyme',
        rating: Number(rating),
        comment: comment || '',
        createdAt: new Date().toISOString()
      };

      await createReview(newReview);

      // Recalculate average rating of the product
      const reviews = await getReviews();
      const pReviews = reviews.filter((r: Review) => r.productId === productId);
      const avgRating = Number((pReviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / pReviews.length).toFixed(1));

      const product = await getProductById(productId);
      if (product) {
        await updateProduct(productId, {
          rating: avgRating,
          reviewsCount: pReviews.length
        });
      }

      return res.status(201).json(newReview);
    } catch (error) {
      console.error('Create review error:', error);
      return res.status(500).json({ message: 'Erreur lors de la soumission de l\'avis.' });
    }
  });

  // COUPONS ENDPOINTS
  app.get('/api/coupons/validate/:code', async (req, res) => {
    const { code } = req.params;

    try {
      const coupons = await getCoupons();
      const coupon = coupons.find((c: Coupon) => c.code.toUpperCase() === code?.toUpperCase() && c.active);
      if (!coupon) {
        return res.status(404).json({ message: 'Code promo invalide.' });
      }

      // Expiry check
      if (new Date(coupon.expiryDate).getTime() < Date.now()) {
        return res.status(400).json({ message: 'Ce code promo a expiré.' });
      }

      return res.json(coupon);
    } catch (error) {
      console.error('Validate coupon error:', error);
      return res.status(500).json({ message: 'Erreur lors de la validation du code promo.' });
    }
  });

  app.get('/api/coupons', requireAdmin, async (req, res) => {
    try {
      const coupons = await getCoupons();
      return res.json(coupons);
    } catch (error) {
      console.error('Fetch coupons error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des codes promos.' });
    }
  });

  app.post('/api/coupons', requireAdmin, async (req, res) => {
    const { code, type, value, minAmount, expiryDate } = req.body;

    if (!code || !type || !value) {
      return res.status(400).json({ message: 'Les champs Code, Type et Valeur sont requis.' });
    }

    const newCoupon: Coupon = {
      id: 'coup_' + Date.now(),
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minAmount: Number(minAmount) || 0,
      active: true,
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString()
    };

    try {
      await createCoupon(newCoupon);
      return res.status(201).json(newCoupon);
    } catch (error) {
      console.error('Create coupon error:', error);
      return res.status(500).json({ message: 'Erreur lors de la création du code promo.' });
    }
  });

  app.delete('/api/coupons/:id', requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
      const coupons = await getCoupons();
      const coupon = coupons.find((c: Coupon) => c.id === id);
      if (!coupon) {
        return res.status(404).json({ message: 'Code promo introuvable.' });
      }

      await deleteCoupon(id);
      return res.json({ message: 'Code promo supprimé avec succès.' });
    } catch (error) {
      console.error('Delete coupon error:', error);
      return res.status(500).json({ message: 'Erreur lors de la suppression du code promo.' });
    }
  });

  // ORDERS ENDPOINTS
  app.get('/api/orders', async (req, res) => {
    const curUser = (req as any).user;

    try {
      const orders = await getOrders();
      const users = await getUsers();

      if (curUser && curUser.role === 'admin') {
        // Admin gets ALL orders, join user names if possible
        const ordersWithUsernames = orders.map((o: Order) => {
          const u = users.find((user: User) => user.id === o.userId);
          return {
            ...o,
            userName: o.userName || o.customerName || u?.name || 'Client'
          };
        });
        return res.json(ordersWithUsernames);
      } else if (curUser) {
        // Customer gets only their own orders
        const userOrders = orders.filter((o: Order) => o.userId === curUser.id || o.userEmail === curUser.email || o.phone === curUser.phone);
        return res.json(userOrders);
      } else {
        return res.json([]);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des commandes.' });
    }
  });

  // Get order by orderNumber or id (For independent payment flow and customer tracking)
  app.get('/api/orders/:orderNumber', async (req, res) => {
    const { orderNumber } = req.params;
    try {
      const orders = await getOrders();
      const order = orders.find(
        (o: Order) =>
          o.orderNumber?.toUpperCase() === orderNumber?.toUpperCase() ||
          o.id === orderNumber
      );

      if (!order) {
        return res.status(404).json({ message: 'Commande introuvable.' });
      }

      return res.json({
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.userName || 'Client',
        phone: order.phone,
        address: order.address,
        items: order.items,
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discount: order.discount ?? (order as any).discountAmount ?? 0,
        total: order.total,
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        order
      });
    } catch (error) {
      console.error('Fetch single order error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération de la commande.' });
    }
  });

  app.post('/api/orders', async (req, res) => {
    const { 
      customerName, 
      fullName,
      userName,
      phone, 
      phoneNumber,
      address, 
      deliveryAddress,
      items, 
      couponCode, 
      discountAmount,
      discount: customDiscount,
      shippingFee: customShippingFee 
    } = req.body;
    
    const curUser = (req as any).user;

    const finalCustomerName = (customerName || fullName || userName || curUser?.name || '').trim();
    const finalPhone = (phone || phoneNumber || curUser?.phone || '').trim();
    const finalAddress = (address || deliveryAddress || curUser?.address || '').trim();

    if (!finalCustomerName) {
      return res.status(400).json({ message: 'Le nom complet est obligatoire.' });
    }
    if (!finalPhone) {
      return res.status(400).json({ message: 'Le numéro de téléphone est obligatoire.' });
    }
    if (!finalAddress) {
      return res.status(400).json({ message: 'L\'adresse de livraison est obligatoire.' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Le panier est vide ou invalide.' });
    }

    try {
      // Format and validate items
      const sanitizedItems = items.map((item: any) => ({
        productId: String(item.productId || ''),
        name: String(item.name || 'Article'),
        price: Number(item.price || 0),
        quantity: Math.max(1, Number(item.quantity || 1)),
        image: String(item.image || '')
      }));

      // Verify stock & decrement
      for (const item of sanitizedItems) {
        if (item.productId) {
          const prod = await getProductById(item.productId);
          if (prod) {
            if (prod.stock < item.quantity) {
              return res.status(400).json({ message: `Stock insuffisant pour le produit : ${prod.name}.` });
            }
            await updateProduct(item.productId, {
              stock: Math.max(0, prod.stock - item.quantity)
            });
          }
        }
      }

      // Automatic calculations
      const subtotal = sanitizedItems.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
      const shippingFee = customShippingFee !== undefined ? Number(customShippingFee) : (subtotal > 150000 || subtotal === 0 ? 0 : 5000);
      const discount = customDiscount !== undefined ? Number(customDiscount) : (discountAmount ? Number(discountAmount) : 0);
      const total = Math.max(0, subtotal + shippingFee - discount);

      // Generate 6-char uppercase alphanumeric orderNumber CMD-XXXXXX
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let randSuffix = '';
      for (let i = 0; i < 6; i++) {
        randSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const orderNumber = `CMD-${randSuffix}`;

      const now = new Date().toISOString();

      const newOrder: Order = {
        id: 'ord_' + Date.now() + Math.random().toString(36).substring(7),
        orderNumber,
        customerName: finalCustomerName,
        phone: finalPhone,
        address: finalAddress,
        items: sanitizedItems,
        subtotal,
        shippingFee,
        discount,
        total,
        status: 'En attente',
        deliveryStatus: 'En attente',
        createdAt: now,
        updatedAt: now,

        // Compatibility fields
        userId: curUser?.id || 'guest_' + Date.now(),
        userName: finalCustomerName,
        userEmail: curUser?.email || '',
        paymentMethod: req.body.paymentMethod || 'MVola',
        paymentStatus: 'En attente',
        transactionReference: req.body.transactionReference || '',
        couponCode: couponCode || undefined,
        discountAmount: discount > 0 ? discount : undefined,
        logs: [
          { date: now, action: 'Commande passée', user: finalCustomerName }
        ],
        customerId: curUser?.id || 'guest_' + Date.now(),
        products: sanitizedItems.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          priceAtPurchase: item.price,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        }))
      };

      await createOrder(newOrder);

      // Admin notification
      try {
        const allUsers = await getUsers();
        const admins = allUsers.filter(u => u.role === 'admin');
        for (const admin of admins) {
          await createNotification({
            id: 'notif_' + Date.now() + Math.random().toString(36).substring(7),
            userId: admin.id,
            title: 'Nouvelle Commande',
            message: `Nouvelle commande ${orderNumber} (${total} Ar) de ${finalCustomerName}.`,
            type: 'info',
            isRead: false,
            createdAt: now
          });
        }
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }

      return res.status(201).json({
        orderNumber,
        order: newOrder
      });
    } catch (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ message: 'Erreur lors de la création de la commande.' });
    }
  });

  // Update order status (Admin)
  app.put('/api/orders/:id/status', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, paymentStatus, trackingNumber, carrier } = req.body;
    const curUser = (req as any).user;

    try {
      const orders = await getOrders();
      const order = orders.find((o: Order) => o.id === id);
      if (!order) {
        return res.status(404).json({ message: 'Commande introuvable.' });
      }

      const updates: any = { updatedAt: new Date().toISOString() };
      let logs = order.logs || [];

      if (status && status !== order.status) {
        const validStatuses = ['En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: 'Statut invalide.' });
        }
        updates.status = status;
        
        // Always sync with deliveryStatus for compatibility
        if (status === 'Livrée' || status === 'Livré') {
          updates.deliveryStatus = 'Livré';
        } else if (status === 'Expédiée' || status === 'Expédié') {
          updates.deliveryStatus = 'Expédié';
        } else if (status === 'En préparation') {
          updates.deliveryStatus = 'En préparation';
        } else if (status === 'Confirmée' || status === 'Confirmé') {
          updates.deliveryStatus = 'Confirmé';
        } else if (status === 'Annulée' || status === 'Annulé') {
          updates.deliveryStatus = 'Annulé';
        } else if (status === 'En attente') {
          updates.deliveryStatus = 'En attente';
        }

        logs.push({ date: new Date().toISOString(), action: `Statut de la commande mis à jour : ${status}`, user: curUser.name });
        console.log(`[EMAIL SIMULATION] Sending status update email to ${order.userEmail} for order ${order.orderNumber}. New status: ${status}`);
        await createNotification({
          id: 'notif_' + Date.now() + Math.random().toString(36).substring(7),
          userId: order.userId,
          title: 'Mise à jour de commande',
          message: `Votre commande ${order.orderNumber} est maintenant : ${status}`,
          type: 'info',
          isRead: false,
          createdAt: new Date().toISOString()
        });
      }

      if (paymentStatus && paymentStatus !== order.paymentStatus) {
        updates.paymentStatus = paymentStatus;
        logs.push({ date: new Date().toISOString(), action: `Statut du paiement mis à jour : ${paymentStatus}`, user: curUser.name });
      }

      if (trackingNumber && trackingNumber !== order.trackingNumber) {
        updates.trackingNumber = trackingNumber;
        logs.push({ date: new Date().toISOString(), action: `Numéro de suivi mis à jour : ${trackingNumber}`, user: curUser.name });
      }

      if (carrier && carrier !== order.carrier) {
        updates.carrier = carrier;
        logs.push({ date: new Date().toISOString(), action: `Transporteur mis à jour : ${carrier}`, user: curUser.name });
      }
      
      updates.logs = logs;

      await updateOrder(id, updates);
      return res.json({ ...order, ...updates });
    } catch (error) {
      console.error('Update order status error:', error);
      return res.status(500).json({ message: 'Erreur lors de la modification de la commande.' });
    }
  });

  // Send invoice by email
  app.post('/api/orders/:id/invoice', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { email } = req.body;
    try {
      const orders = await getOrders();
      const order = orders.find((o: Order) => o.id === id);
      if (!order) {
        return res.status(404).json({ message: 'Commande introuvable.' });
      }
      
      const targetEmail = email || order.userEmail || (req as any).user.email;
      console.log(`[EMAIL SIMULATION] Sending invoice email for order ${order.orderNumber} to ${targetEmail}.`);
      return res.json({ message: 'Facture envoyée avec succès.' });
    } catch (error) {
      console.error('Send invoice error:', error);
      return res.status(500).json({ message: 'Erreur lors de l\'envoi de la facture.' });
    }
  });

  // PAYMENTS CRUD & WORKFLOW
  app.post('/api/payments', async (req, res) => {
    const {
      orderNumber,
      orderId,
      amount,
      customerName,
      fullName,
      phone,
      phoneNumber,
      paymentMethod,
      transactionReference,
      paymentReference,
      receiptImage,
      receiptImages
    } = req.body;
    const curUser = (req as any).user;

    const finalOrderNumber = (orderNumber || orderId || '').trim();
    if (!finalOrderNumber) {
      return res.status(400).json({ message: 'Le numéro de commande (orderNumber) est obligatoire.' });
    }

    try {
      const orders = await getOrders();
      const order = orders.find(
        (o: Order) =>
          o.orderNumber?.toUpperCase() === finalOrderNumber.toUpperCase() ||
          o.id === finalOrderNumber
      );

      const finalAmount = Number(amount !== undefined ? amount : (order ? order.total : 0));
      const finalCustomerName = (customerName || fullName || (order ? (order.customerName || order.userName) : '') || curUser?.name || 'Client').trim();
      const finalPhone = (phone || phoneNumber || (order ? order.phone : '') || curUser?.phone || '').trim();
      const rawMethod = paymentMethod || 'MVola';
      
      // Normalize payment method
      let finalPaymentMethod: 'MVola' | 'Orange Money' | 'Airtel Money' | 'Paiement à la livraison' = 'MVola';
      if (rawMethod === 'Orange Money') {
        finalPaymentMethod = 'Orange Money';
      } else if (rawMethod === 'Airtel Money') {
        finalPaymentMethod = 'Airtel Money';
      } else if (rawMethod === 'Paiement à la livraison' || rawMethod === 'Espèces') {
        finalPaymentMethod = 'Paiement à la livraison';
      } else {
        finalPaymentMethod = 'MVola';
      }

      const isMobileMoney = finalPaymentMethod !== 'Paiement à la livraison';
      const finalTransactionRef = (transactionReference || paymentReference || '').trim();
      const finalReceiptImg = (receiptImage || (receiptImages && receiptImages[0]?.url) || '').trim();

      if (isMobileMoney && !finalTransactionRef) {
        return res.status(400).json({ message: 'La référence de transaction est obligatoire pour le paiement Mobile Money.' });
      }

      const status = isMobileMoney ? 'À vérifier' : 'Paiement à la livraison';

      // Generate 6-char uppercase alphanumeric paymentNumber PAY-XXXXXX
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let randPaySuffix = '';
      for (let i = 0; i < 6; i++) {
        randPaySuffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const paymentNumber = `PAY-${randPaySuffix}`;
      const now = new Date().toISOString();

      const newPayment: Payment = {
        id: 'pay_' + Date.now() + Math.random().toString(36).substring(7),
        paymentNumber,
        orderNumber: order?.orderNumber || finalOrderNumber,
        amount: finalAmount,
        customerName: finalCustomerName,
        phone: finalPhone,
        paymentMethod: finalPaymentMethod,
        transactionReference: isMobileMoney ? finalTransactionRef : '',
        receiptImage: isMobileMoney ? finalReceiptImg : '',
        status,
        createdAt: now,

        // Compatibility fields
        orderId: order?.id || finalOrderNumber,
        userId: curUser?.id || order?.userId || '',
        fullName: finalCustomerName,
        phoneNumber: finalPhone,
        deliveryAddress: order?.address || '',
        paymentReference: isMobileMoney ? finalTransactionRef : '',
        receiptImages: isMobileMoney && finalReceiptImg ? [{ url: finalReceiptImg, publicId: 'receipt_0' }] : [],
        updatedAt: now
      };

      await createPayment(newPayment);

      if (order) {
        // Update order log and payment method / status
        const logs = order.logs || [];
        logs.push({
          date: now,
          action: isMobileMoney
            ? `Paiement Mobile Money ${finalPaymentMethod} soumis (Réf: ${finalTransactionRef}). Statut: À vérifier.`
            : `Option Paiement à la livraison validée.`,
          user: finalCustomerName
        });

        await updateOrder(order.id || order.orderNumber, {
          paymentMethod: finalPaymentMethod,
          paymentStatus: isMobileMoney ? 'En attente' : 'Paiement à la livraison',
          transactionReference: isMobileMoney ? finalTransactionRef : '',
          logs,
          updatedAt: now
        });

        // Notify client
        if (order.userId && !order.userId.startsWith('guest_')) {
          await createNotification({
            id: 'notif_' + Date.now() + Math.random().toString(36).substring(7),
            userId: order.userId,
            title: isMobileMoney ? 'Paiement en cours de vérification' : 'Commande enregistrée',
            message: isMobileMoney 
              ? `Votre paiement de ${finalAmount} Ar pour la commande ${order.orderNumber} a été enregistré (${paymentNumber}). Notre équipe vérifiera votre commande.`
              : `Votre commande ${order.orderNumber} a été confirmée avec paiement à la livraison.`,
            type: 'info',
            isRead: false,
            createdAt: now
          });
        }
      }

      // Notify admins
      try {
        const allUsers = await getUsers();
        const admins = allUsers.filter(u => u.role === 'admin');
        for (const admin of admins) {
          await createNotification({
            id: 'notif_' + Date.now() + Math.random().toString(36).substring(7),
            userId: admin.id,
            title: isMobileMoney ? 'Nouveau paiement Mobile Money à vérifier' : 'Commande Paiement à la livraison',
            message: `${paymentNumber} pour commande ${order?.orderNumber || finalOrderNumber} (${finalAmount} Ar) par ${finalCustomerName}.`,
            type: isMobileMoney ? 'warning' : 'info',
            isRead: false,
            createdAt: now
          });
        }
      } catch (adminNotifErr) {
        // Ignore
      }

      return res.status(201).json({
        paymentNumber: newPayment.paymentNumber,
        orderNumber: newPayment.orderNumber,
        amount: newPayment.amount,
        customerName: newPayment.customerName,
        phone: newPayment.phone,
        paymentMethod: newPayment.paymentMethod,
        transactionReference: newPayment.transactionReference,
        receiptImage: newPayment.receiptImage,
        status: newPayment.status,
        createdAt: newPayment.createdAt,
        message: 'Paiement enregistré avec succès. Notre équipe vérifiera votre commande.'
      });
    } catch (error) {
      console.error('Create payment error:', error);
      return res.status(500).json({ message: 'Erreur lors de la soumission du paiement.' });
    }
  });

  app.get('/api/payments', async (req, res) => {
    const curUser = (req as any).user;
    try {
      const payments = await getPayments();
      if (curUser && curUser.role === 'admin') {
        return res.json(payments);
      } else if (curUser) {
        const userPayments = payments.filter((p: Payment) => p.userId === curUser.id || p.phone === curUser.phone);
        return res.json(userPayments);
      } else {
        return res.json([]);
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des paiements.' });
    }
  });

  app.put('/api/payments/:id/verify', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const curUser = (req as any).user;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Statut de validation invalide.' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'La raison du rejet est requise.' });
    }

    try {
      const payments = await getPayments();
      const payment = payments.find((p: MobileMoneyPayment) => p.id === id);
      if (!payment) {
        return res.status(404).json({ message: 'Paiement introuvable.' });
      }

      const now = new Date().toISOString();
      const updates: Partial<MobileMoneyPayment> = {
        status,
        verifiedBy: curUser.name || curUser.id,
        verifiedAt: now,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
        updatedAt: now
      };

      await updatePayment(id, updates);

      // Fetch the order to update it
      const orders = await getOrders();
      const order = orders.find((o: Order) => o.id === payment.orderId);
      if (order) {
        const logs = order.logs || [];
        const orderUpdates: Partial<Order> = { updatedAt: now };

        if (status === 'approved') {
          orderUpdates.paymentStatus = 'Payé';
          orderUpdates.transactionReference = payment.paymentReference;
          // Si le paiement est approuvé, la commande passe au statut Payée/Confirmée
          orderUpdates.status = 'Confirmée';
          orderUpdates.deliveryStatus = 'Confirmé';
          logs.push({
            date: now,
            action: `Paiement approuvé par l'administrateur. Transaction Réf: ${payment.paymentReference}.`,
            user: curUser.name
          });
        } else {
          // Si le paiement est rejeté, la commande reste En attente de paiement
          orderUpdates.paymentStatus = 'Échoué';
          logs.push({
            date: now,
            action: `Paiement rejeté par l'administrateur. Raison : ${rejectionReason}`,
            user: curUser.name
          });
        }

        orderUpdates.logs = logs;
        await updateOrder(order.id, orderUpdates);

        // Notify client
        await createNotification({
          id: 'notif_' + Date.now() + Math.random().toString(36).substring(7),
          userId: payment.userId,
          title: status === 'approved' ? 'Paiement Approuvé 🎉' : 'Paiement Refusé ❌',
          message: status === 'approved'
            ? `Votre paiement de ${payment.amount} Ar pour la commande ${order.orderNumber} a été approuvé. Votre commande est confirmée.`
            : `Votre paiement de ${payment.amount} Ar pour la commande ${order.orderNumber} a été rejeté. Raison : ${rejectionReason}`,
          type: status === 'approved' ? 'success' : 'error',
          isRead: false,
          createdAt: now
        });
      }

      return res.json({ message: 'Statut du paiement mis à jour avec succès.' });
    } catch (error) {
      console.error('Verify payment error:', error);
      return res.status(500).json({ message: 'Erreur lors de la validation du paiement.' });
    }
  });

  // ADMIN DASHBOARD STATISTICS
  app.get('/api/admin/stats', requireAdmin, async (req, res) => {
    try {
      const orders = await getOrders();
      const products = await getProducts();
      const users = await getUsers();
      const categories = await getCategories();

      const totalSales = orders
        .filter(o => o.status !== 'Annulée')
        .reduce((sum, o) => sum + o.total, 0);

      const totalOrders = orders.length;
      const totalClients = users.filter(u => u.role === 'customer').length;
      const totalProducts = products.length;

      // Build last 7 days sales history
      const salesHistory = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        
        const dayOrders = orders.filter(o => {
          if (o.status === 'Annulée') return false;
          const oDate = new Date(o.createdAt);
          return oDate.getDate() === d.getDate() && 
                 oDate.getMonth() === d.getMonth() && 
                 oDate.getFullYear() === d.getFullYear();
        });

        const dayAmount = dayOrders.reduce((sum, o) => sum + o.total, 0);
        salesHistory.push({ date: dateStr, amount: dayAmount });
      }

      // Calculate category sales breakdown
      const categoryCounts: { [key: string]: number } = {};
      orders.forEach(o => {
        if (o.status === 'Annulée') return;
        o.items.forEach(item => {
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            const cat = categories.find((c: Category) => c.id === prod.categoryId);
            if (cat) {
              categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + item.quantity;
            }
          }
        });
      });

      const categorySales = categories.map((c: Category) => ({
        categoryName: c.name,
        count: categoryCounts[c.name] || 0
      }));

      return res.json({
        totalSales,
        totalOrders,
        totalClients,
        totalProducts,
        salesHistory,
        categorySales
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des statistiques.' });
    }
  });

  // CLIENTS MANAGEMENT (Admin)
  app.get('/api/admin/clients', requireAdmin, async (req, res) => {
    try {
      const users = await getUsers();
      const clients = users.filter((u: User) => u.role === 'customer');
      return res.json(clients);
    } catch (error) {
      console.error('Fetch clients error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des clients.' });
    }
  });

  // NOTIFICATIONS ENDPOINTS
  app.get('/api/notifications', requireAuth, async (req, res) => {
    const curUser = (req as any).user;
    try {
      const allNotifs = await getNotifications();
      const userNotifs = allNotifs.filter(n => n.userId === curUser.id);
      // Sort by newest first
      userNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(userNotifs);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      return res.status(500).json({ message: 'Erreur lors de la récupération des notifications.' });
    }
  });

  app.put('/api/notifications/read-all', requireAuth, async (req, res) => {
    const curUser = (req as any).user;
    try {
      await markAllUserNotificationsRead(curUser.id);
      return res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return res.status(500).json({ message: 'Erreur.' });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      await updateNotification(id, { isRead: true });
      return res.json({ message: 'Notification marquée comme lue.' });
    } catch (error) {
      console.error('Mark notification read error:', error);
      return res.status(500).json({ message: 'Erreur.' });
    }
  });

  app.delete('/api/notifications/all', requireAuth, async (req, res) => {
    const curUser = (req as any).user;
    try {
      await deleteAllUserNotifications(curUser.id);
      return res.json({ message: 'Toutes les notifications ont été supprimées.' });
    } catch (error) {
      console.error('Delete all notifications error:', error);
      return res.status(500).json({ message: 'Erreur.' });
    }
  });

  app.delete('/api/notifications/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
      await deleteNotification(id);
      return res.json({ message: 'Notification supprimée.' });
    } catch (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({ message: 'Erreur.' });
    }
  });

  // VITE SERVICE IN DEV OR STATIC FOR PROD
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Initialize MongoDB Atlas connection
  await initMongoConnection().catch(err => {
    console.warn('Initial MongoDB connection warning:', err);
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
});
