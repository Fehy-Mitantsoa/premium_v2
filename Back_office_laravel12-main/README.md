# 📐 Dossier de Conception Logicielle & Spécifications UML
## Projet : DataCommerce Dashboard & Plateforme E-Commerce Intelligente

---

## 📌 1. Présentation Générale du Projet

Le projet **DataCommerce Dashboard & HighTech Store Madagascar** est une plateforme intégrée d'administration et de gestion e-commerce moderne conçue pour le marché malgache et international. Elle unifie :
1. **Gestion Métier Complète :** Gestion des catalogues produits, catégories, clients, commandes et stocks (flux d'entrées/sorties).
2. **Paiements Locaux Sécurisés & Réconciliation Bidirectionnelle :** Validation, vérification des reçus et ré-approbation des paiements par Mobile Money (*MVola*, *Orange Money*, *Airtel Money*) synchronisés en temps réel avec les commandes.
3. **Réponse Automatique & Notifications E-mail Professionnelles :** Envoi automatique instantané d'e-mails de confirmation de commande responsive (HTML + Plain-Text), avec récapitulatif détaillé des articles, adresses, coordonnées du service client et diagnostic SMTP intégré.
4. **Agent IA Service Client WhatsApp :** Génération automatique de messages de suivi personnalisés et envoi via WhatsApp Web ou l'API Meta Cloud Business.
5. **Automatisation Marketing par IA (Posts & Stories) :** Rédaction publicitaire avec **Google Gemini AI** et publication en temps réel (Feed & Stories) sur la Page Facebook via **Meta Graph API v21.0**.
6. **Intelligence Décisionnelle & Assistant Admin IA :** Assistant conversationnel expert capable de requêter la base MongoDB et de générer des graphiques analytiques interactifs (Recharts / D3).
7. **Backend Polyglotte & Microservices :** Serveur Node.js/TypeScript (Express) principal et dépendances microservices Python (`requirements.txt`) pour le traitement de données, génération PDF et scripts IA.

---

## 🔄 2. Découpage par Sprints & Diagrammes de Classe

---

### 🔹 Sprint 1 : Authentification, RBAC & Journalisation d'Audit
*Objectifs :* Sécurisation des accès, gestion des profils (Administrateur, Analyste), contrôle d'accès basé sur les rôles (RBAC) et traçabilité complète des actions système et CRUD.

```mermaid
classDiagram
    direction TB

    class UserRole {
        <<enumeration>>
        ADMINISTRATEUR
        ANALYSTE
    }

    class UserStatus {
        <<enumeration>>
        ACTIF
        INACTIF
    }

    class LogType {
        <<enumeration>>
        AUTH
        CRUD
        SYSTEM
    }

    class User {
        +string id
        +string name
        +string email
        +string passwordHash
        +UserRole role
        +UserStatus status
        +DateTime lastLogin
        +DateTime createdAt
        +login(credentials: Credentials) bool
        +logout() void
        +hasPermission(action: string) bool
    }

    class ActivityLog {
        +string id
        +string username
        +string role
        +string action
        +string ip
        +DateTime timestamp
        +LogType type
        +logAction(user: User, action: string, type: LogType) void
    }

    class AuthService {
        +verifyToken(token: string) User
        +hashPassword(password: string) string
        +generateSession(user: User) string
    }

    User "1" --> "1" UserRole : possède
    User "1" --> "1" UserStatus : état
    User "1" ..> ActivityLog : génère
    ActivityLog "1" --> "1" LogType : catégorisé par
    AuthService ..> User : authentifie
```

---

### 🔹 Sprint 2 : Gestion du Catalogue, Promos & Mouvements de Stock
*Objectifs :* Gestion hiérarchique des catégories, fiches produits riches (prix en Ariary, remises, SKU, images multiples, seuil d'alerte) et traçabilité des flux de stock (Entrées/Sorties).

```mermaid
classDiagram
    direction TB

    class PromoType {
        <<enumeration>>
        PERCENTAGE
        FIXED
    }

    class ProductStatus {
        <<enumeration>>
        PUBLIE
        BROUILLON
    }

    class MovementType {
        <<enumeration>>
        ENTREE
        SORTIE
    }

    class Category {
        +string id
        +string name
        +string slug
        +string description
        +string image
        +getProductCount() int
    }

    class Promotion {
        +PromoType type
        +float value
        +bool active
        +calculateDiscount(basePrice: float) float
    }

    class Product {
        +string id
        +string name
        +string slug
        +string description
        +string categoryId
        +string brand
        +string sku
        +float originalPrice
        +float currentPrice
        +int stock
        +int minStockThreshold
        +string[] images
        +ProductStatus status
        +float rating
        +int reviewsCount
        +bool featured
        +DateTime createdAt
        +isLowStock() bool
        +applyPromotion(promo: Promotion) void
        +updateStock(qtyDelta: int) void
    }

    class StockMovement {
        +string id
        +string productId
        +string productName
        +int quantity
        +MovementType type
        +string userResponsible
        +DateTime date
        +string comment
        +executeMovement(product: Product) void
    }

    Category "1" *-- "0..*" Product : regroupe
    Product "1" *-- "0..1" Promotion : bénéficie de
    Promotion --> PromoType : type
    Product --> ProductStatus : statut
    Product "1" <-- "0..*" StockMovement : concerne
    StockMovement --> MovementType : type
```

---

### 🔹 Sprint 3 : Clients, Commandes, Paiements Mobile Money, E-mail & WhatsApp IA
*Objectifs :* Cycle de vie des clients, enregistrement des commandes, réconciliation financière bidirectionnelle Mobile Money (*MVola*, *Airtel Money*, *Orange Money*), notification automatique par e-mail professionnel responsive (HTML/Plain Text) et agent IA de notification client WhatsApp.

```mermaid
classDiagram
    direction TB

    class Provider {
        <<enumeration>>
        MVOLA
        AIRTEL_MONEY
        ORANGE_MONEY
    }

    class PaymentStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    class DeliveryStatus {
        <<enumeration>>
        EN_ATTENTE
        EN_PREPARATION
        EXPEDIEE
        LIVREE
        ANNULEE
    }

    class EmailStatus {
        <<enumeration>>
        NOT_SENT
        SENT
        FAILED
        SIMULATED
    }

    class Customer {
        +string id
        +string lastName
        +string firstName
        +string address
        +string phone
        +string email
        +int orderCount
        +float totalSpend
        +DateTime registrationDate
        +DateTime lastLoginDate
        +string status
        +getFullName() string
        +recalculateMetrics() void
    }

    class OrderItem {
        +string productId
        +string name
        +int quantity
        +float priceAtPurchase
        +getSubtotal() float
    }

    class OrderLog {
        +DateTime date
        +string action
        +string user
    }

    class Order {
        +string id
        +string customerId
        +string customerName
        +string orderNumber
        +string userEmail
        +float totalAmount
        +float shippingFee
        +string paymentStatus
        +DeliveryStatus deliveryStatus
        +string paymentMethod
        +string address
        +string phone
        +string transactionReference
        +bool emailSent
        +DateTime emailSentAt
        +string emailStatus
        +string emailId
        +string whatsappMessage
        +DateTime whatsappReplyGeneratedAt
        +string whatsappStatus
        +DateTime orderDate
        +calculateTotal() float
        +updateDeliveryStatus(status: DeliveryStatus, adminUser: string) void
        +syncWithPayment(payment: MobileMoneyPayment) void
    }

    class MobileMoneyPayment {
        +string id
        +string reference
        +string customerName
        +string phone
        +string deliveryAddress
        +string orderId
        +float amount
        +Provider provider
        +DateTime sentAt
        +PaymentStatus status
        +string rejectionReason
        +string verifiedBy
        +DateTime verifiedAt
        +string[] proofs
        +approve(verifier: string) void
        +reject(reason: string, verifier: string) void
        +reApprove(verifier: string) void
    }

    class EmailConfirmationService {
        +generateOrderConfirmationHtml(order: Order, options: object) string
        +generateOrderConfirmationText(order: Order, options: object) string
        +sendOrderConfirmationEmail(order: Order, options: object) Promise~EmailResult~
        +testSmtpConnection(settings: SystemSettings) Promise~bool~
    }

    class WhatsAppAgentService {
        +generateOrderConfirmation(order: Order, customer: Customer) Promise~string~
        +generatePaymentValidationMessage(order: Order, payment: MobileMoneyPayment) Promise~string~
        +buildWhatsAppDirectUrl(phone: string, message: string) string
    }

    Customer "1" *-- "0..*" Order : passe
    Order "1" *-- "1..*" OrderItem : contient
    Order "1" *-- "0..*" OrderLog : historise
    Order "1" --> "1" DeliveryStatus : état livraison
    Order "1" <..> "0..1" MobileMoneyPayment : réconciliation bidirectionnelle
    Order "1" --> "1" EmailStatus : état e-mail
    MobileMoneyPayment --> Provider : opérateur
    MobileMoneyPayment --> PaymentStatus : statut validation
    EmailConfirmationService ..> Order : génère et envoie e-mail
    WhatsAppAgentService ..> Order : génère message pour
```

---

### 🔹 Sprint 4 : Marketing IA, Stories & Automatisation Meta Graph API
*Objectifs :* Pipeline asynchrone non-bloquant : génération automatisée de textes de vente optimisés via Google Gemini AI et publication sur la Page Facebook pro (Posts & Stories) via Meta Graph API v21.0 avec gestion des réessais.

```mermaid
classDiagram
    direction TB

    class FacebookPubStatus {
        <<enumeration>>
        PENDING
        GENERATING
        PUBLISHING
        PUBLISHED
        FAILED
        DISABLED
    }

    class ProductMarketingExt {
        +FacebookPubStatus facebook_publication_status
        +string facebook_post_id
        +string facebook_post_content
        +DateTime facebook_published_at
        +string facebook_error
        +int facebook_attempts
    }

    class SystemSettings {
        +string mongoUri
        +string nodeApiUrl
        +bool automaticAlertsEnabled
        +bool facebookAutoPublishEnabled
        +string facebookPageId
        +string facebookPageName
        +bool whatsappAutoReplyEnabled
        +string whatsappPhoneNumberId
    }

    class AiMarketingService {
        +generateMarketingCopy(product: Product) Promise~string~
        +generateStoryCopy(product: Product) Promise~string~
        +buildDeterministicFallback(product: Product) string
    }

    class MetaGraphService {
        +publishPostToPage(pageId: string, content: string, imageUrl: string) Promise~MetaPublishResult~
        +publishStoryToPage(pageId: string, imageUrl: string, caption: string) Promise~MetaPublishResult~
        +verifyPageConnection(pageId: string, token: string) Promise~bool~
    }

    class FacebookAutomationWorker {
        +dispatchPostJob(productId: string, attempt: int) void
        +dispatchStoryJob(productId: string, storyData: object) void
        +handleRetryPolicy(productId: string, attempt: int, error: string) void
    }

    ProductMarketingExt --> FacebookPubStatus : statut
    FacebookAutomationWorker ..> SystemSettings : consulte config
    FacebookAutomationWorker ..> AiMarketingService : requiert texte
    FacebookAutomationWorker ..> MetaGraphService : publie via API
```

---

### 🔹 Sprint 5 : Analytics Décisionnels & Assistant Conversationnel Admin IA
*Objectifs :* Moteur d'analyse prédictive des ventes, KPI en temps réel, export de rapports PDF certifiés et assistant conversationnel avec génération de graphiques interactifs.

```mermaid
classDiagram
    direction TB

    class ChatRole {
        <<enumeration>>
        USER
        ASSISTANT
        SYSTEM
    }

    class ChatMessage {
        +string id
        +ChatRole role
        +string content
        +DateTime timestamp
        +ChartData chart
        +StatisticData stats
    }

    class ChartData {
        +string type
        +string title
        +object[] data
        +string xKey
        +string[] yKeys
    }

    class AdminChatBotService {
        +processQuery(query: string, history: ChatMessage[]) Promise~ChatMessage~
        +queryMongoDatabase(intent: object) Promise~any~
        +extractChartData(rawAnalysis: string) ChartData
    }

    class PdfExportService {
        +generateSalesReport(startDate: DateTime, endDate: DateTime) Blob
        +generateInventoryAuditReport() Blob
    }

    ChatMessage --> ChatRole : rôle
    ChatMessage *-- "0..1" ChartData : intègre
    AdminChatBotService ..> ChatMessage : produit
    AdminChatBotService ..> PdfExportService : peut invoquer
```

---

## 🌐 3. Diagramme de Classe Global Consolidé

Ce diagramme unifie l'ensemble des modules métiers, d'authentification, de paiement, de logistique, d'agent WhatsApp, d'automatisation IA et de décisionnel.

```mermaid
classDiagram
    direction TB

    %% Enums
    class UserRole { <<enumeration>> ADMINISTRATEUR, ANALYSTE }
    class MovementType { <<enumeration>> ENTREE, SORTIE }
    class PaymentStatus { <<enumeration>> PENDING, APPROVED, REJECTED }
    class DeliveryStatus { <<enumeration>> EN_ATTENTE, PREPARATION, EXPEDIEE, LIVREE, ANNULEE }
    class FbStatus { <<enumeration>> PENDING, GENERATING, PUBLISHING, PUBLISHED, FAILED }

    %% Core Classes
    class User {
        +string id
        +string name
        +string email
        +UserRole role
        +string status
        +DateTime lastLogin
    }

    class ActivityLog {
        +string id
        +string username
        +string role
        +string action
        +string ip
        +DateTime timestamp
        +string type
    }

    class Category {
        +string id
        +string name
        +string slug
        +string description
        +string image
    }

    class Product {
        +string id
        +string name
        +string slug
        +string categoryId
        +string brand
        +string sku
        +float originalPrice
        +float currentPrice
        +int stock
        +int minStockThreshold
        +string[] images
        +string status
        +FbStatus facebook_publication_status
        +string facebook_post_id
        +string facebook_post_content
        +DateTime facebook_published_at
    }

    class StockMovement {
        +string id
        +string productId
        +string productName
        +int quantity
        +MovementType type
        +string userResponsible
        +DateTime date
        +string comment
    }

    class Customer {
        +string id
        +string lastName
        +string firstName
        +string address
        +string phone
        +string email
        +int orderCount
        +float totalSpend
    }

    class OrderItem {
        +string productId
        +string name
        +int quantity
        +float priceAtPurchase
    }

    class Order {
        +string id
        +string customerId
        +string customerName
        +string orderNumber
        +float totalAmount
        +DeliveryStatus deliveryStatus
        +string paymentStatus
        +string paymentMethod
        +string transactionReference
        +string whatsappMessage
        +DateTime orderDate
    }

    class MobileMoneyPayment {
        +string id
        +string reference
        +string customerName
        +string phone
        +string orderId
        +float amount
        +string provider
        +PaymentStatus status
        +string verifiedBy
        +DateTime verifiedAt
        +string[] proofs
    }

    class SystemSettings {
        +string mongoUri
        +string nodeApiUrl
        +bool automaticAlertsEnabled
        +bool facebookAutoPublishEnabled
        +string facebookPageId
        +string facebookPageName
        +bool whatsappAutoReplyEnabled
        +string whatsappPhoneNumberId
    }

    %% Relations
    User "1" ..> ActivityLog : génère traçabilité
    Category "1" *-- "0..*" Product : classifie
    Product "1" <-- "0..*" StockMovement : ajuste stock
    Product "1" <-- "0..*" OrderItem : référencé dans
    Customer "1" *-- "0..*" Order : passe
    Order "1" *-- "1..*" OrderItem : contient
    Order "1" <..> "0..1" MobileMoneyPayment : synchronisation mutuelle
    Product ..> FbStatus : statut publication
```

---

## 📦 4. Diagramme de Paquetage (Package Diagram)

L'architecture est organisée selon les principes de la **Clean Architecture** et du découpage modulaire full-stack.

```mermaid
graph TD
    subgraph UI_Layer ["📦 Client Web Frontend (React 18 + Vite + Tailwind)"]
        Components["📦 Components
        - DashboardOverview
        - ProductManagement
        - CategoryManagement
        - OrderManagement
        - CustomerManagement
        - StockManagement
        - MobileMoneyManagement
        - ActivityLogs
        - SettingsPanel
        - AuthShield
        - FacebookStoryModal"]
        AdminAI_UI["📦 Admin-AI Submodule
        - AdminChatBot
        - ChartRenderer
        - MessageBubble
        - StatisticCard"]
        ClientServices["📦 Client Services & Utils
        - adminChatService
        - whatsappAutoService
        - pdfExport"]
    end

    subgraph Backend_Layer ["📦 Application Server Layer (Express + Node.js / TypeScript)"]
        ApiRoutes["📦 API Gateway & Controllers
        - /api/products
        - /api/categories
        - /api/orders
        - /api/orders/:id/email-preview
        - /api/orders/:id/send-email-confirmation
        - /api/customers
        - /api/stock-movements
        - /api/mobile-money
        - /api/settings
        - /api/settings/test-email
        - /api/settings/test-connection
        - /api/logs
        - /api/admin-chat
        - /api/facebook/publish-story"]
        
        BackgroundWorkers["📦 Automation & Background Workers
        - FacebookPublishingWorker
        - WhatsAppAgentWorker
        - EmailConfirmationWorker
        - StockAlertWorker
        - RetryPolicyHandler"]

        ServerServices["📦 Business Core Services
        - AiMarketingService
        - MetaGraphService
        - EmailConfirmationService
        - MongoDbRepository
        - WhatsAppService"]
    end

    subgraph Persistence_Layer ["📦 Persistence & Storage Layer"]
        MongoAtlas["🗄️ MongoDB Atlas Cluster
        Collections:
        - users
        - products
        - categories
        - customers
        - orders
        - stock_movements
        - payments
        - activity_logs
        - settings"]
        MemoryCache["⚡ In-Memory Fallback Cache"]
    end

    subgraph External_Services ["🌐 External Cloud Services & Third Parties"]
        GeminiAPI["🧠 Google Gemini AI API
        - gemini-3.7-flash
        - Marketing & WhatsApp Copy Generation"]
        MetaGraph["📱 Meta Graph API v21.0
        - Facebook Page Feed
        - Facebook Photos & Stories API"]
        SmtpRelay["✉️ Passerelle SMTP & Serveur Mail
        - STARTTLS / TLS SMTPS (Port 587 / 465)
        - Gmail / Brevo / SendGrid / Custom SMTP"]
        TelcoGateways["💳 Mobile Money Operators
        - Telma MVola Madagascar
        - Orange Money Madagascar
        - Airtel Money Madagascar"]
    end

    %% Dependencies
    Components --> ClientServices
    AdminAI_UI --> ClientServices
    ClientServices --> ApiRoutes
    Components --> ApiRoutes

    ApiRoutes --> ServerServices
    ApiRoutes --> BackgroundWorkers
    BackgroundWorkers --> ServerServices
    ServerServices --> MongoAtlas
    ServerServices --> MemoryCache

    ServerServices --> GeminiAPI
    ServerServices --> MetaGraph
    ServerServices --> SmtpRelay
    ServerServices --> TelcoGateways
```

---

## 🚀 5. Diagramme de Déploiement (Deployment Diagram)

Ce diagramme décrit l'infrastructure physique et conteneurisée sur **Google Cloud Platform (Cloud Run)**, les passerelles réseaux sécurisées et les services SaaS tiers.

```mermaid
graph TB
    subgraph Client_Device ["💻 Poste Client / Navigateur Web Admin"]
        Browser["🌐 Navigateur Web Moderne (Chrome, Firefox, Safari, Edge)
        • React SPA Bundle (HTML5, ES2022, CSS3/Tailwind)
        • Local Session & HTTPS Client"]
    end

    subgraph Cloud_Infrastructure ["☁️ Google Cloud Platform (GCP) / Cloud Run Sandbox"]
        subgraph Container_Node ["📦 Conteneur Docker / Cloud Run Node.js Environment"]
            NginxProxy["🛡️ Nginx Reverse Proxy
            • Port externe : 3000 (HTTPS Ingress)
            • SSL/TLS Termination
            • Rate Limiting & Gzip"]
            
            AppServer["⚙️ Node.js v20+ / Express Server (server.ts)
            • Vite Middleware (Dev Mode)
            • Static Bundle Hosting (dist/index.html)
            • RESTful API Endpoints (/api/*)
            • Gemini AI Client (@google/genai)
            • Meta Graph v21.0 API Worker
            • Background Async Job Queues"]
        end
    end

    subgraph Database_Cloud ["🗄️ MongoDB Cloud Services"]
        MongoAtlasCluster["🍃 MongoDB Atlas Cloud Database
        • Cluster0 (TLS/SSL Enforced, Replica Set)
        • Base de données : ecommerce_db
        • Collections indexées (products, orders, payments, logs)"]
    end

    subgraph External_APIs ["🌐 Services Cloud Tiers & Réseaux Sociaux"]
        GoogleGenAICloud["🧠 Google AI Studio / Gemini API Server
        • Endpoint : https://generativelanguage.googleapis.com
        • Modèle : gemini-3.7-flash"]

        MetaCloud["📘 Meta Graph API Platform
        • Endpoint : https://graph.facebook.com/v21.0
        • Scopes : pages_manage_posts, pages_read_engagement
        • Page Pro : HighTech Store Madagascar"]

        MobileMoneyTelcos["🇲🇬 Réseaux Télécoms & Passerelles Mobile Money
        • Telma MVola Madagascar
        • Orange Money Madagascar
        • Airtel Money Madagascar"]
    end

    %% Network Connections
    Browser -- "HTTPS (Port 443 / 3000)
    JSON / REST API" --> NginxProxy
    NginxProxy -- "Localhost IPC / Proxy" --> AppServer

    AppServer -- "MongoDB Wire Protocol (TLS 1.3)
    SRV Connection String : mongodb+srv://" --> MongoAtlasCluster

    AppServer -- "HTTPS / REST API (Bearer API Key)" --> GoogleGenAICloud
    AppServer -- "HTTPS / REST (Page Access Token v21.0)" --> MetaCloud
    AppServer -- "Notifications Webhook / API Rest" --> MobileMoneyTelcos
```

---

## 📋 6. Matrice de Traçabilité des Exigences & Entités Métier

| Module / Sprint | Entités Clés | Rôles Autorisés | Points d'Entrée API |
| :--- | :--- | :--- | :--- |
| **Sprint 1 : Sécurité** | `User`, `ActivityLog`, `SystemSettings` | Administrateur | `POST /api/login`, `GET /api/logs`, `POST /api/settings`, `POST /api/settings/test-connection` |
| **Sprint 2 : Catalogue** | `Product`, `Category`, `StockMovement` | Admin, Analyste | `GET/POST/PUT/DELETE /api/products`, `/api/categories`, `/api/stock-movements` |
| **Sprint 3 : Commercial, E-mail & Mobile Money** | `Customer`, `Order`, `MobileMoneyPayment`, `EmailConfirmation` | Admin, Analyste | `GET/POST/PUT /api/orders`, `/api/orders/:id/email-preview`, `POST /api/orders/:id/send-email-confirmation`, `POST /api/settings/test-email`, `/api/customers`, `/api/mobile-money`, `/api/mobile-money/:id` (Validation/Rejet/Ré-approbation) |
| **Sprint 4 : Marketing IA & Stories** | `Product (FB fields)`, `AiMarketingService` | Admin (Automate) | `POST /api/products/:id/facebook-publish`, `POST /api/facebook/publish-story`, Meta Graph v21.0 |
| **Sprint 5 : Décisionnel & WhatsApp** | `ChatMessage`, `ChartData`, `PdfExport`, `WhatsAppAgent` | Admin, Analyste | `POST /api/admin-chat`, Moteur décisionnel D3 / Recharts, WhatsApp Web Direct |

---

## 🐍 7. Dépendances & Microservices Python (`requirements.txt`)

Pour les scripts de traitement de données par lots, d'analyses prédictives et d'invoicing automatisé, l'environnement inclut le fichier `requirements.txt` :

```txt
# Google Gemini & GenAI SDK
google-genai>=1.0.0
google-generativeai>=0.8.0

# Base de Données NoSQL
pymongo>=4.9.0
motor>=3.6.0

# Frameworks Web & API (FastAPI / Flask)
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
flask>=3.1.0
flask-cors>=5.0.0

# Requêtes HTTP & Intégrations (Meta Graph API / WhatsApp / Mail)
requests>=2.32.3
httpx>=0.28.0
aiohttp>=3.11.0

# Configuration & Traitement de Données
python-dotenv>=1.0.1
pydantic>=2.10.0
pandas>=2.2.3
pillow>=11.0.0
reportlab>=4.2.5
```

---

## 🔒 8. Sécurité & Bonnes Pratiques

1. **Isolation des Secrets :** Les clés sensibles (`GEMINI_API_KEY`, `META_PAGE_ACCESS_TOKEN`, `MONGODB_URI`, `SMTP_PASS`) résident exclusivement côté serveur (`process.env` ou paramètres sécurisés) et ne sont jamais exposées au navigateur.
2. **Réconciliation Transactionnelle :** Synchronisation atomique entre les tables `orders` et `payments` (approbation, rejet, ré-approbation et mise à jour du chiffre d'affaires client).
3. **Idempotence des Tâches :** Protection contre les doubles envois d'e-mails de confirmation (`order.emailSent`), doubles publications Facebook et doubles validations Mobile Money.
4. **Tolérance aux Pannes & Mode Dégradé :** Fallback en mémoire dynamique si MongoDB Atlas ou les serveurs SMTP externes sont temporairement inaccessibles (simulation console traçable).
