/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dotenv from 'dotenv';
dotenv.config({ override: true });
import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { Category, Product, Coupon, Review, User, Order, Notification, Payment, MobileMoneyPayment, PendingVerification } from '../types';
import {
  initialCategories,
  initialProducts,
  initialCoupons,
  initialReviews,
  initialUsers
} from '../initialData';

let rawUri = process.env.MONGODB_URI || 'mongodb+srv://narindra:narindra1810@cluster0.67mnvw1.mongodb.net/ecommerce_db?appName=Cluster0';
if (rawUri.startsWith('"') && rawUri.endsWith('"')) rawUri = rawUri.slice(1, -1).trim();
if (rawUri.startsWith("'") && rawUri.endsWith("'")) rawUri = rawUri.slice(1, -1).trim();

let mongoUri = rawUri;
if (mongoUri && !mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
  console.warn(`⚠️ MONGODB_URI has an invalid scheme ("${mongoUri}"). It must start with "mongodb://" or "mongodb+srv://".`);
  mongoUri = '';
}

let dbName = process.env.MONGODB_DB_NAME || 'ecommerce_db';
if (dbName.startsWith('"') && dbName.endsWith('"')) dbName = dbName.slice(1, -1).trim();
if (dbName.startsWith("'") && dbName.endsWith("'")) dbName = dbName.slice(1, -1).trim();

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let isConnected = false;
let lastConnectionError: string | null = null;

// Fallback in-memory database storage
const inMemoryStore = {
  customers: JSON.parse(JSON.stringify(initialUsers)) as User[],
  pendingVerifications: [] as PendingVerification[],
  categories: JSON.parse(JSON.stringify(initialCategories)) as Category[],
  products: JSON.parse(JSON.stringify(initialProducts)) as Product[],
  coupons: JSON.parse(JSON.stringify(initialCoupons)) as Coupon[],
  reviews: JSON.parse(JSON.stringify(initialReviews)) as Review[],
  orders: [
    {
      id: "ord_281030",
      customerId: "user_1783502130882",
      customerName: "Lalaina",
      total: 8999,
      paymentStatus: "En attente",
      deliveryStatus: "En attente",
      createdAt: "2026-07-16T10:26:19.412Z",
      products: [
        {
          productId: "prod_1784192711058",
          name: "Sony",
          priceAtPurchase: 8999,
          quantity: 1,
          price: 8999,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200"
        }
      ],
      logs: [
        {
          date: "2026-07-16T09:59:52.729Z",
          action: "Commande passée",
          user: "Lalaina"
        },
        {
          date: "2026-07-16T10:04:13.627Z",
          action: "Paiement Mobile Money MVola soumis (Réf: 4566666). En attente de vérification.",
          user: "Lalaina"
        },
        {
          date: "2026-07-16T10:26:19.412Z",
          action: "Paiement Mobile Money MVola soumis (Réf: 45565). En attente de vérification.",
          user: "Lalaina"
        }
      ],
      orderNumber: "CMD-RIAJD7-2729",
      phone: "+2612323232333232",
      shippingFee: 0,
      status: "En attente",
      subtotal: 8999,
      updatedAt: "2026-07-16T10:26:19.412Z",
      userEmail: "fenomirindralalaina@gmail.com",
      userId: "user_1783502130882",
      userName: "Lalaina",
      address: "Antananarivo 101",
      paymentMethod: "Mvola"
    },
    {
      id: "ord_302401",
      customerId: "user_1784266748386",
      customerName: "fehy",
      total: 33333,
      paymentStatus: "En attente",
      deliveryStatus: "En attente",
      createdAt: "2026-07-21T08:37:44.435Z",
      products: [
        {
          productId: "prod_1784112252551",
          name: "test54",
          priceAtPurchase: 33333,
          quantity: 1,
          price: 33333,
          image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
        }
      ],
      logs: [
        {
          date: "2026-07-21T08:37:44.435Z",
          action: "Commande passée",
          user: "fehy"
        },
        {
          date: "2026-07-21T08:38:17.822Z",
          action: "Paiement Mobile Money MVola soumis (Réf: MVola-33333). En attente de vérification.",
          user: "fehy"
        }
      ],
      orderNumber: "CMD-T5KGV4-4435",
      phone: "+261347454871",
      shippingFee: 0,
      status: "En attente",
      subtotal: 33333,
      updatedAt: "2026-07-21T08:38:17.822Z",
      userEmail: "fehy@gmail.com",
      userId: "user_1784266748386",
      userName: "fehy",
      address: "fehy",
      paymentMethod: "Mvola"
    }
  ] as unknown as Order[],
  notifications: [] as Notification[],
  payments: [
    {
      id: "pay_4566666",
      orderId: "ord_281030",
      userId: "user_1783502130882",
      fullName: "Lalaina",
      phoneNumber: "+2612323232333232",
      deliveryAddress: "Antananarivo 101",
      paymentMethod: "MVola",
      paymentReference: "4566666",
      amount: 8999,
      receiptImages: [] as { url: string; publicId: string }[],
      status: "pending",
      createdAt: "2026-07-16T10:04:13.627Z",
      updatedAt: "2026-07-16T10:04:13.627Z"
    },
    {
      id: "pay_45565",
      orderId: "ord_281030",
      userId: "user_1783502130882",
      fullName: "Lalaina",
      phoneNumber: "+2612323232333232",
      deliveryAddress: "Antananarivo 101",
      paymentMethod: "MVola",
      paymentReference: "45565",
      amount: 8999,
      receiptImages: [] as { url: string; publicId: string }[],
      status: "pending",
      createdAt: "2026-07-16T10:26:19.412Z",
      updatedAt: "2026-07-16T10:26:19.412Z"
    },
    {
      id: "pay_MVola-33333",
      orderId: "ord_302401",
      userId: "user_1784266748386",
      fullName: "fehy",
      phoneNumber: "+261347454871",
      deliveryAddress: "fehy",
      paymentMethod: "MVola",
      paymentReference: "MVola-33333",
      amount: 33333,
      receiptImages: [] as { url: string; publicId: string }[],
      status: "pending",
      createdAt: "2026-07-21T08:38:17.822Z",
      updatedAt: "2026-07-21T08:38:17.822Z"
    }
  ] as unknown as MobileMoneyPayment[]
};

// Always ensure the main admin user is present in-memory with correct roles
const adminUserIndex = inMemoryStore.customers.findIndex(u => u.email === 'andriamifehy18@gmail.com');
const adminUserObj: User = {
  id: 'user_madagascar',
  name: 'Narindra',
  email: 'andriamifehy18@gmail.com',
  role: 'admin',
  address: 'Antananarivo 101',
  phone: '0347454871',
  password: 'password123',
  createdAt: '2026-07-15T07:13:20.075Z'
};
if (adminUserIndex > -1) {
  inMemoryStore.customers[adminUserIndex] = { ...inMemoryStore.customers[adminUserIndex], ...adminUserObj };
} else {
  inMemoryStore.customers.push(adminUserObj);
}

// Always ensure customer fehy is present in-memory with correct data
const fehyUserIndex = inMemoryStore.customers.findIndex(u => u.id === 'user_1784266748386');
const fehyUserObj: User = {
  id: 'user_1784266748386',
  name: 'fehy',
  email: 'fehy@gmail.com',
  role: 'customer',
  address: 'fehy',
  phone: '+261347454871',
  password: 'password123',
  createdAt: '2026-07-21T08:37:44.435Z'
};
if (fehyUserIndex > -1) {
  inMemoryStore.customers[fehyUserIndex] = { ...inMemoryStore.customers[fehyUserIndex], ...fehyUserObj };
} else {
  inMemoryStore.customers.push(fehyUserObj);
}

// Always ensure test product test54 is present in-memory with correct data
const testProductIndex = inMemoryStore.products.findIndex(p => p.id === 'prod_1784112252551');
const testProductObj: Product = {
  id: 'prod_1784112252551',
  name: 'test54',
  slug: 'test54-1784112252551',
  description: 'Produit test54 haut de gamme.',
  price: 33333,
  stock: 10,
  categoryId: 'cat_1',
  brand: 'Sony',
  images: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='],
  rating: 5.0,
  reviewsCount: 0,
  featured: false,
  createdAt: '2026-07-21T08:37:44.435Z'
};
if (testProductIndex > -1) {
  inMemoryStore.products[testProductIndex] = { ...inMemoryStore.products[testProductIndex], ...testProductObj };
} else {
  inMemoryStore.products.push(testProductObj);
}

let useInMemoryFallback = !mongoUri;
let initialConnectionFailed = false;

export async function initMongoConnection(): Promise<boolean> {
  if (!mongoUri) {
    console.log('ℹ️ Aucune URI MongoDB fournie, utilisation du stockage mémoire.');
    useInMemoryFallback = true;
    return false;
  }

  try {
    console.log(`⏳ Connexion à MongoDB Atlas (${dbName})...`);
    if (!client) {
      client = new MongoClient(mongoUri, {
        connectTimeoutMS: 3500,
        serverSelectionTimeoutMS: 3500,
        socketTimeoutMS: 4000,
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        tls: true,
      });
    }

    await client.connect();
    dbInstance = client.db(dbName);
    
    // Ping command to verify live connection
    await dbInstance.command({ ping: 1 });
    
    isConnected = true;
    useInMemoryFallback = false;
    initialConnectionFailed = false;
    lastConnectionError = null;

    console.log(`✅ Connecté avec succès à la base de données MongoDB : "${dbName}"`);
    await seedMongoDatabaseIfEmpty(dbInstance);
    return true;
  } catch (error: any) {
    console.error('⚠️ Échec de connexion à MongoDB Atlas:', error.message || error);
    lastConnectionError = error.message || String(error);
    isConnected = false;
    useInMemoryFallback = true;
    return false;
  }
}

export async function getDbStatus() {
  if (dbInstance && isConnected) {
    try {
      await dbInstance.command({ ping: 1 });
      const [productsCount, ordersCount, usersCount] = await Promise.all([
        dbInstance.collection('products').countDocuments().catch(() => 0),
        dbInstance.collection('orders').countDocuments().catch(() => 0),
        dbInstance.collection('customers').countDocuments().catch(() => 0),
      ]);
      return {
        connected: true,
        type: 'mongodb',
        database: dbName,
        counts: {
          products: productsCount,
          orders: ordersCount,
          users: usersCount,
        }
      };
    } catch {
      // Ping failed
    }
  }

  return {
    connected: isConnected,
    type: useInMemoryFallback ? 'in-memory-fallback' : 'mongodb',
    database: dbName,
    error: lastConnectionError,
    counts: {
      products: inMemoryStore.products.length,
      orders: inMemoryStore.orders.length,
      users: inMemoryStore.customers.length,
    }
  };
}

async function getDb(): Promise<Db> {
  if (dbInstance && isConnected) return dbInstance;

  if (useInMemoryFallback && initialConnectionFailed) {
    throw new Error('Using in-memory database fallback.');
  }

  if (!mongoUri) {
    useInMemoryFallback = true;
    throw new Error('MongoDB URI is not set');
  }

  if (!client) {
    client = new MongoClient(mongoUri, {
      connectTimeoutMS: 3500,
      serverSelectionTimeoutMS: 3500,
      socketTimeoutMS: 4000,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      tls: true,
    });
  }

  try {
    await client.connect();
    dbInstance = client.db(dbName);
    await dbInstance.command({ ping: 1 });
    isConnected = true;
    useInMemoryFallback = false;
    initialConnectionFailed = false;
    console.log(`Connected to MongoDB successfully: database "${dbName}"`);
    await seedMongoDatabaseIfEmpty(dbInstance);
    return dbInstance;
  } catch (error: any) {
    console.error('Failed to connect to MongoDB, falling back to in-memory store:', error.message || error);
    lastConnectionError = error.message || String(error);
    initialConnectionFailed = true;
    useInMemoryFallback = true;
    throw error;
  }
}

async function executeDbOp<T>(op: (db: Db) => Promise<T>, fallback: T, timeoutMs = 3000): Promise<T> {
  if (useInMemoryFallback) return fallback;
  try {
    const dbPromise = getDb();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    );
    const db = await Promise.race([dbPromise, timeoutPromise]);
    return await Promise.race([op(db), timeoutPromise]);
  } catch (err: any) {
    if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError' || err.message?.includes('timeout')) {
      isConnected = false;
      lastConnectionError = err.message || 'Database operation timed out';
    }
    return fallback;
  }
}

async function seedMongoDatabaseIfEmpty(db: Db) {
  try {
    const categoriesCount = await db.collection('categories').countDocuments();
    if (categoriesCount === 0) {
      if (initialCategories.length > 0) await db.collection('categories').insertMany(initialCategories as any[]);
    }

    const productsCount = await db.collection('products').countDocuments();
    if (productsCount === 0) {
      if (initialProducts.length > 0) await db.collection('products').insertMany(initialProducts as any[]);
    }

    const couponsCount = await db.collection('coupons').countDocuments();
    if (couponsCount === 0) {
      if (initialCoupons.length > 0) await db.collection('coupons').insertMany(initialCoupons as any[]);
    }

    const reviewsCount = await db.collection('reviews').countDocuments();
    if (reviewsCount === 0) {
      if (initialReviews.length > 0) await db.collection('reviews').insertMany(initialReviews as any[]);
    }

    const customersCount = await db.collection('customers').countDocuments();
    if (customersCount === 0) {
      if (initialUsers.length > 0) await db.collection('customers').insertMany(initialUsers as any[]);
    }
    // Always ensure the main admin user exists with correct data
    await db.collection('customers').updateOne(
      { email: 'andriamifehy18@gmail.com' },
      {
        $set: adminUserObj
      },
      { upsert: true }
    );

    // Always ensure customer fehy exists with correct data
    await db.collection('customers').updateOne(
      { id: 'user_1784266748386' },
      {
        $set: fehyUserObj
      },
      { upsert: true }
    );

    // Always ensure test product exists with correct data
    await db.collection('products').updateOne(
      { id: 'prod_1784112252551' },
      {
        $set: testProductObj
      },
      { upsert: true }
    );

    // Always ensure the requested orders exist
    for (const order of inMemoryStore.orders) {
      const dbOrder = toDbOrder(order);
      await db.collection('orders').updateOne(
        { id: order.id },
        {
          $set: dbOrder
        },
        { upsert: true }
      );
    }

    for (const pay of inMemoryStore.payments) {
      await db.collection('payments').updateOne(
        { id: pay.id },
        {
          $set: pay
        },
        { upsert: true }
      );
    }

    // Create text indexes for search and authentication
    await db.collection('products').createIndex({ name: 'text', description: 'text', brand: 'text' }).catch(() => {});
    await db.collection('categories').createIndex({ slug: 1 }, { unique: true }).catch(() => {});
    await db.collection('customers').createIndex({ email: 1 }, { unique: true, sparse: true }).catch(() => {});
    await db.collection('customers').createIndex({ googleId: 1 }, { sparse: true }).catch(() => {});
    await db.collection('pending_verifications').createIndex({ email: 1 }, { unique: true }).catch(() => {});
    await db.collection('pending_verifications').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});

  } catch (error) {
    console.error('Error seeding MongoDB database:', error);
  }
}

export async function getUsers(): Promise<User[]> {
  if (useInMemoryFallback) return inMemoryStore.customers;
  try {
    const db = await getDb();
    return await db.collection('customers').find({}).toArray() as unknown as User[];
  } catch {
    return inMemoryStore.customers;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  if (useInMemoryFallback) return inMemoryStore.customers.find(u => u.id === id) || null;
  try {
    const db = await getDb();
    return await db.collection('customers').findOne({ id }) as unknown as User | null;
  } catch {
    return inMemoryStore.customers.find(u => u.id === id) || null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (useInMemoryFallback) {
    return inMemoryStore.customers.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }
  try {
    const db = await getDb();
    const found = await db.collection('customers').findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (found) return found as unknown as User;
    return inMemoryStore.customers.find(u => u.email.toLowerCase() === cleanEmail) || null;
  } catch {
    return inMemoryStore.customers.find(u => u.email.toLowerCase() === cleanEmail) || null;
  }
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  if (!googleId) return null;
  if (useInMemoryFallback) {
    return inMemoryStore.customers.find(u => u.googleId === googleId) || null;
  }
  try {
    const db = await getDb();
    const found = await db.collection('customers').findOne({ googleId });
    if (found) return found as unknown as User;
    return inMemoryStore.customers.find(u => u.googleId === googleId) || null;
  } catch {
    return inMemoryStore.customers.find(u => u.googleId === googleId) || null;
  }
}

export async function createUser(user: User): Promise<void> {
  const idx = inMemoryStore.customers.findIndex(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  if (idx > -1) {
    inMemoryStore.customers[idx] = user;
  } else {
    inMemoryStore.customers.push(user);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('customers').updateOne({ id: user.id }, { $set: user }, { upsert: true });
  } catch {
    // Fallback in-memory already handled
  }
}

export async function updateUser(id: string, partial: Partial<User>): Promise<void> {
  const idx = inMemoryStore.customers.findIndex(u => u.id === id);
  if (idx > -1) {
    inMemoryStore.customers[idx] = { ...inMemoryStore.customers[idx], ...partial };
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('customers').updateOne({ id }, { $set: partial });
  } catch {
    // Fallback in-memory already handled
  }
}

// --- PENDING VERIFICATIONS ---
export async function getPendingVerification(email: string): Promise<PendingVerification | null> {
  const cleanEmail = email.trim().toLowerCase();
  const now = new Date().getTime();

  // In-memory lookup
  const inMem = inMemoryStore.pendingVerifications.find(p => p.email.toLowerCase() === cleanEmail);
  if (inMem) {
    if (new Date(inMem.expiresAt).getTime() < now) {
      inMemoryStore.pendingVerifications = inMemoryStore.pendingVerifications.filter(p => p.email.toLowerCase() !== cleanEmail);
    } else {
      return inMem;
    }
  }

  if (useInMemoryFallback) return null;

  try {
    const db = await getDb();
    const found = await db.collection('pending_verifications').findOne({ email: cleanEmail });
    if (found) {
      if (new Date(found.expiresAt).getTime() < now) {
        await db.collection('pending_verifications').deleteOne({ email: cleanEmail });
        return null;
      }
      return found as unknown as PendingVerification;
    }
    return null;
  } catch {
    return null;
  }
}

export async function savePendingVerification(data: PendingVerification): Promise<void> {
  const cleanEmail = data.email.trim().toLowerCase();
  const item: PendingVerification = { ...data, email: cleanEmail };

  const idx = inMemoryStore.pendingVerifications.findIndex(p => p.email.toLowerCase() === cleanEmail);
  if (idx > -1) {
    inMemoryStore.pendingVerifications[idx] = item;
  } else {
    inMemoryStore.pendingVerifications.push(item);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('pending_verifications').updateOne(
      { email: cleanEmail },
      { $set: item },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error saving pending verification to MongoDB:', err);
  }
}

export async function updatePendingVerification(email: string, updates: Partial<PendingVerification>): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  const idx = inMemoryStore.pendingVerifications.findIndex(p => p.email.toLowerCase() === cleanEmail);
  if (idx > -1) {
    inMemoryStore.pendingVerifications[idx] = { ...inMemoryStore.pendingVerifications[idx], ...updates };
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('pending_verifications').updateOne(
      { email: cleanEmail },
      { $set: updates }
    );
  } catch (err) {
    console.error('Error updating pending verification in MongoDB:', err);
  }
}

export async function deletePendingVerification(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  inMemoryStore.pendingVerifications = inMemoryStore.pendingVerifications.filter(p => p.email.toLowerCase() !== cleanEmail);

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('pending_verifications').deleteOne({ email: cleanEmail });
  } catch (err) {
    console.error('Error deleting pending verification from MongoDB:', err);
  }
}

export async function findOrCreateGoogleUser(googleData: {
  email: string;
  name?: string;
  avatar?: string;
  googleId?: string;
}): Promise<{ user: User; isNew: boolean }> {
  const cleanEmail = googleData.email.toLowerCase().trim();
  
  // 1. Search by googleId or email
  let existing: User | null = null;
  if (googleData.googleId) {
    existing = await getUserByGoogleId(googleData.googleId);
  }
  if (!existing) {
    existing = await getUserByEmail(cleanEmail);
  }

  if (existing) {
    const updates: Partial<User> = {
      emailVerified: true,
      updatedAt: new Date().toISOString()
    };
    if (googleData.googleId && !existing.googleId) updates.googleId = googleData.googleId;
    if (googleData.avatar && !existing.avatar) updates.avatar = googleData.avatar;
    if (!existing.authProvider) updates.authProvider = 'google';
    if (!existing.provider) updates.provider = 'google';

    await updateUser(existing.id, updates);
    const updatedUser = { ...existing, ...updates };
    return { user: updatedUser, isNew: false };
  }

  const cleanName = googleData.name?.trim() || cleanEmail.split('@')[0];
  const newUser: User = {
    id: 'user_g_' + (googleData.googleId || Date.now()),
    name: cleanName,
    email: cleanEmail,
    role: cleanEmail === 'andriamifehy18@gmail.com' ? 'admin' : 'customer',
    avatar: googleData.avatar || '',
    googleId: googleData.googleId || '',
    provider: 'google',
    authProvider: 'google',
    emailVerified: true,
    address: '',
    phone: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await createUser(newUser);
  return { user: newUser, isNew: true };
}

export async function getCategories(): Promise<Category[]> {
  if (useInMemoryFallback) return inMemoryStore.categories;
  try {
    const db = await getDb();
    return await db.collection('categories').find({}).toArray() as unknown as Category[];
  } catch {
    return inMemoryStore.categories;
  }
}

export async function createCategory(cat: Category): Promise<void> {
  const idx = inMemoryStore.categories.findIndex(c => c.id === cat.id);
  if (idx > -1) {
    inMemoryStore.categories[idx] = cat;
  } else {
    inMemoryStore.categories.push(cat);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('categories').updateOne({ id: cat.id }, { $set: cat }, { upsert: true });
  } catch {
    // Ignore
  }
}

export async function updateCategory(id: string, partial: Partial<Category>): Promise<void> {
  const idx = inMemoryStore.categories.findIndex(c => c.id === id);
  if (idx > -1) {
    inMemoryStore.categories[idx] = { ...inMemoryStore.categories[idx], ...partial };
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('categories').updateOne({ id }, { $set: partial });
  } catch {
    // Ignore
  }
}

export async function deleteCategory(id: string): Promise<void> {
  inMemoryStore.categories = inMemoryStore.categories.filter(c => c.id !== id);
  inMemoryStore.products = inMemoryStore.products.filter(p => p.categoryId !== id);

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('categories').deleteOne({ id });
    await db.collection('products').deleteMany({ categoryId: id });
  } catch {
    // Ignore
  }
}

export async function getProducts(): Promise<Product[]> {
  if (useInMemoryFallback) return inMemoryStore.products;
  try {
    const db = await getDb();
    return await db.collection('products').find({}).toArray() as unknown as Product[];
  } catch {
    return inMemoryStore.products;
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  if (useInMemoryFallback) return inMemoryStore.products.find(p => p.id === id) || null;
  try {
    const db = await getDb();
    return await db.collection('products').findOne({ id }) as unknown as Product | null;
  } catch {
    return inMemoryStore.products.find(p => p.id === id) || null;
  }
}

export async function createProduct(prod: Product): Promise<void> {
  const idx = inMemoryStore.products.findIndex(p => p.id === prod.id);
  if (idx > -1) {
    inMemoryStore.products[idx] = prod;
  } else {
    inMemoryStore.products.push(prod);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('products').updateOne({ id: prod.id }, { $set: prod }, { upsert: true });
  } catch {
    // Ignore
  }
}

export async function updateProduct(id: string, partial: Partial<Product>): Promise<void> {
  const idx = inMemoryStore.products.findIndex(p => p.id === id);
  if (idx > -1) {
    inMemoryStore.products[idx] = { ...inMemoryStore.products[idx], ...partial };
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('products').updateOne({ id }, { $set: partial });
  } catch {
    // Ignore
  }
}

export async function deleteProduct(id: string): Promise<void> {
  inMemoryStore.products = inMemoryStore.products.filter(p => p.id !== id);
  inMemoryStore.reviews = inMemoryStore.reviews.filter(r => r.productId !== id);

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('products').deleteOne({ id });
    await db.collection('reviews').deleteMany({ productId: id });
  } catch {
    // Ignore
  }
}

export async function getCoupons(): Promise<Coupon[]> {
  if (useInMemoryFallback) return inMemoryStore.coupons;
  try {
    const db = await getDb();
    return await db.collection('coupons').find({}).toArray() as unknown as Coupon[];
  } catch {
    return inMemoryStore.coupons;
  }
}

export async function createCoupon(coupon: Coupon): Promise<void> {
  const idx = inMemoryStore.coupons.findIndex(c => c.id === coupon.id);
  if (idx > -1) {
    inMemoryStore.coupons[idx] = coupon;
  } else {
    inMemoryStore.coupons.push(coupon);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('coupons').updateOne({ id: coupon.id }, { $set: coupon }, { upsert: true });
  } catch {
    // Ignore
  }
}

export async function deleteCoupon(id: string): Promise<void> {
  inMemoryStore.coupons = inMemoryStore.coupons.filter(c => c.id !== id);

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('coupons').deleteOne({ id });
  } catch {
    // Ignore
  }
}

export async function getReviews(): Promise<Review[]> {
  if (useInMemoryFallback) return inMemoryStore.reviews;
  try {
    const db = await getDb();
    return await db.collection('reviews').find({}).toArray() as unknown as Review[];
  } catch {
    return inMemoryStore.reviews;
  }
}

export async function createReview(review: Review): Promise<void> {
  const idx = inMemoryStore.reviews.findIndex(r => r.id === review.id);
  if (idx > -1) {
    inMemoryStore.reviews[idx] = review;
  } else {
    inMemoryStore.reviews.push(review);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    await db.collection('reviews').updateOne({ id: review.id }, { $set: review }, { upsert: true });
  } catch {
    // Ignore
  }
}

function toDbOrder(o: any): any {
  if (!o) return o;
  const adapted = adaptOrder(o);
  const orderNum = adapted.orderNumber || `CMD-${(adapted.id || Date.now()).toString().slice(-6).toUpperCase()}`;
  return {
    orderNumber: orderNum,
    customerName: adapted.customerName || adapted.userName || 'Client',
    phone: adapted.phone || '',
    address: adapted.address || '',
    items: (adapted.items || []).map((item: any) => ({
      productId: item.productId || '',
      name: item.name || '',
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      image: item.image || ''
    })),
    subtotal: Number(adapted.subtotal ?? adapted.total ?? 0),
    shippingFee: Number(adapted.shippingFee || 0),
    discount: Number(adapted.discount ?? adapted.discountAmount ?? 0),
    total: Number(adapted.total || 0),
    status: adapted.status || 'En attente',
    deliveryStatus: adapted.deliveryStatus || 'En attente',
    createdAt: adapted.createdAt || new Date().toISOString(),
    updatedAt: adapted.updatedAt || adapted.createdAt || new Date().toISOString(),

    // Extra fields for compatibility
    id: adapted.id || orderNum,
    customerId: adapted.customerId || adapted.userId || '',
    userId: adapted.userId || adapted.customerId || '',
    userName: adapted.userName || adapted.customerName || 'Client',
    userEmail: adapted.userEmail || '',
    paymentMethod: adapted.paymentMethod || 'MVola',
    paymentStatus: adapted.paymentStatus || 'En attente',
    transactionReference: adapted.transactionReference || '',
    discountAmount: Number(adapted.discountAmount ?? adapted.discount ?? 0),
    couponCode: adapted.couponCode || '',
    trackingNumber: adapted.trackingNumber || '',
    carrier: adapted.carrier || '',
    products: adapted.products || [],
    logs: adapted.logs || []
  };
}

function adaptOrder(o: any): Order {
  if (!o) return o;
  
  // Synchronize deliveryStatus with status using robust normalizing
  const normStatus = (o.deliveryStatus || o.status || 'En attente').toString().toLowerCase().trim();
  if (normStatus.includes('livr') || normStatus === 'delivered' || normStatus === 'payé' || normStatus === 'paye') {
    o.status = 'Livrée';
    o.deliveryStatus = 'Livré';
  } else if (normStatus.includes('exped') || normStatus.includes('expéd') || normStatus === 'shipped') {
    o.status = 'Expédiée';
    o.deliveryStatus = 'Expédié';
  } else if (normStatus.includes('prépar') || normStatus.includes('prepar') || normStatus === 'processing' || normStatus === 'en préparation') {
    o.status = 'En préparation';
    o.deliveryStatus = 'En préparation';
  } else if (normStatus.includes('confirm') || normStatus === 'approved') {
    o.status = 'Confirmée';
    o.deliveryStatus = 'Confirmé';
  } else if (normStatus.includes('annul') || normStatus === 'cancelled' || normStatus === 'canceled' || normStatus === 'rejected') {
    o.status = 'Annulée';
    o.deliveryStatus = 'Annulé';
  } else {
    o.status = 'En attente';
    o.deliveryStatus = 'En attente';
  }

  // Ensure customerId and customerName are set
  if (!o.customerId && o.userId) {
    o.customerId = o.userId;
  }
  if (!o.customerName && o.userName) {
    o.customerName = o.userName;
  }
  
  // Ensure userId and userName are set
  if (!o.userId && o.customerId) {
    o.userId = o.customerId;
  }
  if (!o.userName && o.customerName) {
    o.userName = o.customerName;
  }

  // Ensure paymentMethod and paymentStatus are set
  if (!o.paymentMethod) {
    o.paymentMethod = 'Mvola';
  }
  if (!o.paymentStatus) {
    o.paymentStatus = 'En attente';
  }

  // Ensure products is set if items is present
  if ((!o.products || o.products.length === 0) && o.items && o.items.length > 0) {
    o.products = o.items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      priceAtPurchase: Number(item.price),
      quantity: Number(item.quantity),
      price: Number(item.price),
      image: item.image || ''
    }));
  }

  // Ensure items is set if products is present
  if ((!o.items || o.items.length === 0) && o.products && o.products.length > 0) {
    o.items = o.products.map((prod: any) => ({
      productId: prod.productId,
      name: prod.name,
      price: Number(prod.price || prod.priceAtPurchase),
      quantity: Number(prod.quantity),
      image: prod.image || ''
    }));
  }

  return o;
}

export async function getOrders(): Promise<Order[]> {
  if (useInMemoryFallback) return inMemoryStore.orders.map(o => adaptOrder(o));
  try {
    const db = await getDb();
    const list = await db.collection('orders').find({}).toArray() as unknown as Order[];
    return list.map(o => adaptOrder(o));
  } catch {
    return inMemoryStore.orders.map(o => adaptOrder(o));
  }
}

export async function createOrder(order: Order): Promise<void> {
  const adapted = adaptOrder(order);
  const idx = inMemoryStore.orders.findIndex(o => o.id === adapted.id);
  if (idx > -1) {
    inMemoryStore.orders[idx] = adapted;
  } else {
    inMemoryStore.orders.push(adapted);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    const dbOrder = toDbOrder(adapted);
    await db.collection('orders').updateOne(
      { id: adapted.id },
      { 
        $set: dbOrder
      },
      { upsert: true }
    );
  } catch {
    // Ignore
  }
}

export async function updateOrder(id: string, partial: Partial<Order>): Promise<void> {
  const idx = inMemoryStore.orders.findIndex(o => o.id === id);
  if (idx > -1) {
    const updated = adaptOrder({ ...inMemoryStore.orders[idx], ...partial });
    inMemoryStore.orders[idx] = updated;
    
    if (useInMemoryFallback) return;
    try {
      const db = await getDb();
      const dbOrder = toDbOrder(updated);
      await db.collection('orders').updateOne(
        { id },
        { 
          $set: dbOrder
        }
      );
    } catch {
      // Ignore
    }
  } else {
    if (useInMemoryFallback) return;
    try {
      const db = await getDb();
      await db.collection('orders').updateOne(
        { id },
        { 
          $set: partial
        }
      );
    } catch {
      // Ignore
    }
  }
}

export async function getNotifications(): Promise<Notification[]> {
  if (useInMemoryFallback) return inMemoryStore.notifications;
  return await executeDbOp(async (db) => {
    const list = await db.collection('notifications').find({}).toArray();
    return list as unknown as Notification[];
  }, inMemoryStore.notifications, 2500);
}

export async function createNotification(notification: Notification): Promise<void> {
  const idx = inMemoryStore.notifications.findIndex(n => n.id === notification.id);
  if (idx > -1) {
    inMemoryStore.notifications[idx] = notification;
  } else {
    inMemoryStore.notifications.push(notification);
  }

  if (useInMemoryFallback) return;
  await executeDbOp(async (db) => {
    await db.collection('notifications').updateOne({ id: notification.id }, { $set: notification }, { upsert: true });
  }, undefined, 2500);
}

export async function updateNotification(id: string, partial: Partial<Notification>): Promise<void> {
  const idx = inMemoryStore.notifications.findIndex(n => n.id === id);
  if (idx > -1) {
    inMemoryStore.notifications[idx] = { ...inMemoryStore.notifications[idx], ...partial };
  }

  if (useInMemoryFallback) return;
  await executeDbOp(async (db) => {
    await db.collection('notifications').updateOne({ id }, { $set: partial });
  }, undefined, 2500);
}

export async function markAllUserNotificationsRead(userId: string): Promise<void> {
  // Update in-memory store immediately
  inMemoryStore.notifications.forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });

  if (useInMemoryFallback) return;
  await executeDbOp(async (db) => {
    await db.collection('notifications').updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  }, undefined, 2500);
}

export async function deleteNotification(id: string): Promise<void> {
  inMemoryStore.notifications = inMemoryStore.notifications.filter(n => n.id !== id);

  if (useInMemoryFallback) return;
  await executeDbOp(async (db) => {
    await db.collection('notifications').deleteOne({ id });
  }, undefined, 2500);
}

export async function deleteAllUserNotifications(userId: string): Promise<void> {
  inMemoryStore.notifications = inMemoryStore.notifications.filter(n => n.userId !== userId);

  if (useInMemoryFallback) return;
  await executeDbOp(async (db) => {
    await db.collection('notifications').deleteMany({ userId });
  }, undefined, 2500);
}

function toDbPayment(p: any): any {
  const payNum = p.paymentNumber || (p.id ? (p.id.startsWith('pay_') ? `PAY-${p.id.slice(4, 10).toUpperCase()}` : p.id) : `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const ordNum = p.orderNumber || p.orderId || '';
  const isCash = p.paymentMethod === 'Paiement à la livraison';
  const defaultStatus = isCash ? 'Paiement à la livraison' : 'À vérifier';
  const custName = p.customerName || p.fullName || 'Client';
  const phone = p.phone || p.phoneNumber || '';
  const receiptImg = p.receiptImage || (p.receiptImages && p.receiptImages[0]?.url) || '';

  return {
    paymentNumber: payNum,
    orderNumber: ordNum,
    amount: Number(p.amount || 0),
    customerName: custName,
    phone: phone,
    paymentMethod: p.paymentMethod || 'MVola',
    transactionReference: isCash ? '' : (p.transactionReference || p.paymentReference || ''),
    receiptImage: isCash ? '' : receiptImg,
    status: p.status || defaultStatus,
    createdAt: p.createdAt || new Date().toISOString(),

    // Extra fields for backwards compatibility
    id: p.id || payNum,
    orderId: ordNum,
    userId: p.userId || '',
    fullName: custName,
    phoneNumber: phone,
    deliveryAddress: p.deliveryAddress || '',
    paymentReference: isCash ? '' : (p.paymentReference || p.transactionReference || ''),
    receiptImages: isCash ? [] : (p.receiptImages || (receiptImg ? [{ url: receiptImg, publicId: 'proof_0' }] : [])),
    verifiedBy: p.verifiedBy || '',
    verifiedAt: p.verifiedAt || '',
    rejectionReason: p.rejectionReason || '',
    updatedAt: p.updatedAt || p.createdAt || new Date().toISOString()
  };
}

function fromDbPayment(dbPay: any): Payment {
  const payNum = dbPay.paymentNumber || (dbPay.id ? (dbPay.id.startsWith('pay_') ? `PAY-${dbPay.id.slice(4, 10).toUpperCase()}` : dbPay.id) : `PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const ordNum = dbPay.orderNumber || dbPay.orderId || '';
  const isCash = dbPay.paymentMethod === 'Paiement à la livraison';
  const defaultStatus = isCash ? 'Paiement à la livraison' : 'À vérifier';
  const custName = dbPay.customerName || dbPay.fullName || 'Client';
  const phone = dbPay.phone || dbPay.phoneNumber || '';
  const receiptImg = dbPay.receiptImage || (dbPay.receiptImages && dbPay.receiptImages[0]?.url) || (dbPay.proofs && dbPay.proofs[0]) || '';

  return {
    id: dbPay.id || payNum,
    paymentNumber: payNum,
    orderNumber: ordNum,
    amount: Number(dbPay.amount || 0),
    customerName: custName,
    phone: phone,
    paymentMethod: dbPay.paymentMethod || dbPay.provider || 'MVola',
    transactionReference: isCash ? '' : (dbPay.transactionReference || dbPay.paymentReference || dbPay.reference || ''),
    receiptImage: isCash ? '' : receiptImg,
    status: dbPay.status || defaultStatus,
    createdAt: dbPay.createdAt || dbPay.sentAt || new Date().toISOString(),

    // Extra fields for backwards compatibility
    orderId: ordNum,
    userId: dbPay.userId || '',
    fullName: custName,
    phoneNumber: phone,
    deliveryAddress: dbPay.deliveryAddress || '',
    paymentReference: isCash ? '' : (dbPay.paymentReference || dbPay.transactionReference || ''),
    receiptImages: isCash ? [] : (dbPay.receiptImages || (receiptImg ? [{ url: receiptImg, publicId: 'proof_0' }] : [])),
    verifiedBy: dbPay.verifiedBy || undefined,
    verifiedAt: dbPay.verifiedAt || undefined,
    rejectionReason: dbPay.rejectionReason || undefined,
    updatedAt: dbPay.updatedAt || dbPay.createdAt || new Date().toISOString()
  };
}

export async function getPayments(): Promise<MobileMoneyPayment[]> {
  if (useInMemoryFallback) return inMemoryStore.payments;
  try {
    const db = await getDb();
    const list = await db.collection('payments').find({}).toArray();
    return list.map(item => fromDbPayment(item));
  } catch {
    return inMemoryStore.payments;
  }
}

export async function createPayment(payment: MobileMoneyPayment): Promise<void> {
  const idx = inMemoryStore.payments.findIndex(p => p.id === payment.id);
  if (idx > -1) {
    inMemoryStore.payments[idx] = payment;
  } else {
    inMemoryStore.payments.push(payment);
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    const dbObj = toDbPayment(payment);
    await db.collection('payments').updateOne({ id: payment.id }, { $set: dbObj }, { upsert: true });
  } catch {
    // Ignore
  }
}

export async function updatePayment(id: string, partial: Partial<MobileMoneyPayment>): Promise<void> {
  const idx = inMemoryStore.payments.findIndex(p => p.id === id);
  let updatedPayment: MobileMoneyPayment;
  if (idx > -1) {
    inMemoryStore.payments[idx] = { ...inMemoryStore.payments[idx], ...partial };
    updatedPayment = inMemoryStore.payments[idx];
  } else {
    updatedPayment = partial as MobileMoneyPayment;
  }

  if (useInMemoryFallback) return;
  try {
    const db = await getDb();
    const updateFields: any = {};
    if (partial.status !== undefined) updateFields.status = partial.status;
    if (partial.verifiedBy !== undefined) updateFields.verifiedBy = partial.verifiedBy;
    if (partial.verifiedAt !== undefined) updateFields.verifiedAt = partial.verifiedAt;
    if (partial.rejectionReason !== undefined) updateFields.rejectionReason = partial.rejectionReason;
    if (partial.paymentReference !== undefined) updateFields.paymentReference = partial.paymentReference;
    if (partial.fullName !== undefined) updateFields.fullName = partial.fullName;
    if (partial.phoneNumber !== undefined) updateFields.phoneNumber = partial.phoneNumber;
    if (partial.deliveryAddress !== undefined) updateFields.deliveryAddress = partial.deliveryAddress;
    if (partial.amount !== undefined) updateFields.amount = Number(partial.amount);
    if (partial.paymentMethod !== undefined) updateFields.paymentMethod = partial.paymentMethod;
    if (partial.receiptImages !== undefined) updateFields.receiptImages = partial.receiptImages;
    if (partial.updatedAt !== undefined) updateFields.updatedAt = partial.updatedAt;

    await db.collection('payments').updateOne({ id }, { $set: updateFields });
  } catch {
    // Ignore
  }
}

export async function checkPaymentReferenceExists(reference: string): Promise<boolean> {
  if (useInMemoryFallback) {
    return inMemoryStore.payments.some(p => p.paymentReference.trim().toLowerCase() === reference.trim().toLowerCase());
  }
  try {
    const db = await getDb();
    const escapedRef = reference.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp('^' + escapedRef + '$', 'i');
    const count = await db.collection('payments').countDocuments({
      $or: [
        { paymentReference: { $regex: regex } },
        { reference: { $regex: regex } }
      ]
    });
    return count > 0;
  } catch {
    return inMemoryStore.payments.some(p => p.paymentReference.trim().toLowerCase() === reference.trim().toLowerCase());
  }
}
