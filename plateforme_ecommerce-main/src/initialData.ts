/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Category, Product, Coupon, Review, User } from './types';

export const initialCategories: Category[] = [
  {
    id: 'cat_1',
    name: 'Smartphones & Tablettes',
    slug: 'smartphones-tablettes',
    description: 'Derniers smartphones haut de gamme et tablettes tactiles.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'cat_2',
    name: 'Ordinateurs & Accessoires',
    slug: 'ordinateurs-accessoires',
    description: 'Ordinateurs portables performants, claviers et souris de précision.',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'cat_3',
    name: 'Audio & Son',
    slug: 'audio-son',
    description: 'Casques audio sans fil, écouteurs True Wireless et enceintes nomades.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'cat_4',
    name: 'Objets Connectés',
    slug: 'objets-connectes',
    description: 'Montres intelligentes, trackers d\'activité et domotique moderne.',
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'cat_5',
    name: 'Accessoires Premium',
    slug: 'accessoires-premium',
    description: 'Sacs à dos en cuir, chargeurs à induction, et supports au design minimaliste.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=500'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod_1',
    name: 'iPhone 15 Pro Max Titanium',
    slug: 'iphone-15-pro-max-titanium',
    description: 'Le premier iPhone avec un design en titane de qualité aérospatiale, équipé de la puce A17 Pro ultra-puissante, d\'un bouton Action personnalisable et d\'un système d\'appareil photo puissant avec zoom optique 5x.',
    price: 1479,
    discountPrice: 1399,
    stock: 12,
    categoryId: 'cat_1',
    brand: 'Apple',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1695048133118-24db5020716f?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.8,
    reviewsCount: 3,
    featured: true,
    createdAt: '2026-01-15T08:00:00Z'
  },
  {
    id: 'prod_2',
    name: 'MacBook Pro 16" M3 Max',
    slug: 'macbook-pro-16-m3-max',
    description: 'Conçu pour les créatifs et les développeurs, le MacBook Pro de 16 pouces intègre la puce M3 Max avec CPU 16 cœurs et GPU 40 cœurs. Jusqu\'à 22 heures d\'autonomie et un écran Liquid Retina XDR éblouissant de 120Hz.',
    price: 3999,
    discountPrice: 3799,
    stock: 5,
    categoryId: 'cat_2',
    brand: 'Apple',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.9,
    reviewsCount: 2,
    featured: true,
    createdAt: '2026-02-10T10:00:00Z'
  },
  {
    id: 'prod_3',
    name: 'Sony WH-1000XM5 ANC',
    slug: 'sony-wh-1000xm5-anc',
    description: 'Le casque Sony WH-1000XM5 redéfinit l\'écoute sans distraction grâce à son système d\'annulation du bruit active (ANC) inégalé, ses haut-parleurs de 30mm pour un son de haute résolution, et son autonomie phénoménale de 30 heures.',
    price: 399,
    discountPrice: 349,
    stock: 25,
    categoryId: 'cat_3',
    brand: 'Sony',
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.6,
    reviewsCount: 4,
    featured: true,
    createdAt: '2026-03-01T14:30:00Z'
  },
  {
    id: 'prod_4',
    name: 'Apple Watch Ultra 2 Titanium',
    slug: 'apple-watch-ultra-2',
    description: 'La montre de sport ultime, conçue pour les environnements extrêmes avec un boîtier en titane de 49 mm, une autonomie de batterie allant jusqu\'à 72 heures en mode économie, un GPS double fréquence ultra-précis et un écran de 3000 nits.',
    price: 899,
    stock: 8,
    categoryId: 'cat_4',
    brand: 'Apple',
    images: [
      'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.7,
    reviewsCount: 2,
    featured: true,
    createdAt: '2026-01-22T09:15:00Z'
  },
  {
    id: 'prod_5',
    name: 'Clavier Mécanique Keychron K2',
    slug: 'keychron-k2-mechanical-keyboard',
    description: 'Clavier mécanique sans fil au format 75% compact avec touches rétroéclairées RGB. Swappable à chaud, compatible Mac/Windows, idéal pour la dactylographie intensive et le développement.',
    price: 129,
    discountPrice: 109,
    stock: 40,
    categoryId: 'cat_2',
    brand: 'Keychron',
    images: [
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.5,
    reviewsCount: 3,
    featured: false,
    createdAt: '2026-04-05T11:45:00Z'
  },
  {
    id: 'prod_6',
    name: 'Sac à dos en Cuir Voyageur',
    slug: 'sac-a-dos-en-cuir-voyageur',
    description: 'Sac à dos de voyage urbain fabriqué à la main à partir de cuir de vachette pleine fleur de première qualité. Comprend un compartiment matelassé pour ordinateur de 16" et de multiples poches antivols.',
    price: 199,
    stock: 15,
    categoryId: 'cat_5',
    brand: 'Nomatic',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.4,
    reviewsCount: 2,
    featured: false,
    createdAt: '2026-02-18T16:20:00Z'
  },
  {
    id: 'prod_7',
    name: 'Samsung Galaxy S24 Ultra',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Bienvenue dans l\'ère de l\'IA mobile avec Galaxy AI. Doté d\'un cadre en titane robuste, d\'un écran Dynamic AMOLED 2X de 6,8 pouces à 120Hz de haute luminosité et d\'un zoom optique Quad avec capteur principal 200 Mpx.',
    price: 1459,
    discountPrice: 1299,
    stock: 18,
    categoryId: 'cat_1',
    brand: 'Samsung',
    images: [
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.8,
    reviewsCount: 2,
    featured: false,
    createdAt: '2026-03-25T10:10:00Z'
  },
  {
    id: 'prod_8',
    name: 'Dell XPS 15 9530',
    slug: 'dell-xps-15-9530',
    description: 'Le Dell XPS 15 offre un équilibre parfait entre puissance et portabilité. Écran tactile OLED 3.5K InfinityEdge de 15,6 pouces, processeur Intel Core i9 de 13ème génération et carte graphique NVIDIA RTX 4060.',
    price: 2499,
    discountPrice: 2299,
    stock: 7,
    categoryId: 'cat_2',
    brand: 'Dell',
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.5,
    reviewsCount: 2,
    featured: false,
    createdAt: '2026-03-15T09:40:00Z'
  },
  {
    id: 'prod_9',
    name: 'Bose SoundLink Revolve+',
    slug: 'bose-soundlink-revolve-plus',
    description: 'L\'enceinte Bluetooth portable la plus performante de Bose. Offre un son à 360° profond et puissant, avec une poignée de transport pratique en tissu et un boîtier en aluminium monobloc résistant à l\'eau (IP55).',
    price: 329,
    stock: 30,
    categoryId: 'cat_3',
    brand: 'Bose',
    images: [
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.7,
    reviewsCount: 2,
    featured: false,
    createdAt: '2026-04-12T15:00:00Z'
  },
  {
    id: 'prod_10',
    name: 'Chargeur Sans Fil 3-en-1 Magnétique',
    slug: 'chargeur-sans-fil-3-en-1-magnetique',
    description: 'Station de charge rapide sans fil 15W certifiée MagSafe. Rechargez simultanément votre iPhone, vos AirPods et votre Apple Watch. Design ultra-moderne en alliage d\'aluminium.',
    price: 89,
    discountPrice: 79,
    stock: 50,
    categoryId: 'cat_5',
    brand: 'Anker',
    images: [
      'https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&q=80&w=600'
    ],
    rating: 4.3,
    reviewsCount: 1,
    featured: false,
    createdAt: '2026-04-20T10:15:00Z'
  }
];

export const initialCoupons: Coupon[] = [
  {
    id: 'coup_1',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    minAmount: 50,
    active: true,
    expiryDate: '2027-12-31T23:59:59Z'
  },
  {
    id: 'coup_2',
    code: 'SUMMER20',
    type: 'percentage',
    value: 20,
    minAmount: 100,
    active: true,
    expiryDate: '2026-09-30T23:59:59Z'
  },
  {
    id: 'coup_3',
    code: 'SOLID50',
    type: 'fixed',
    value: 50,
    minAmount: 300,
    active: true,
    expiryDate: '2027-01-01T00:00:00Z'
  }
];

export const initialReviews: Review[] = [
  {
    id: 'rev_1',
    productId: 'prod_1',
    userId: 'user_customer_1',
    userName: 'Thomas Durand',
    rating: 5,
    comment: 'Une pure merveille technologique. L\'appareil photo zoom 5x est incroyable et la finition en titane est magnifique !',
    createdAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'rev_2',
    productId: 'prod_1',
    userId: 'user_customer_2',
    userName: 'Sophie Martin',
    rating: 4,
    comment: 'Excellent téléphone, très rapide et léger. Seul bémol : le chargeur n\'est plus inclus dans la boîte à ce prix là.',
    createdAt: '2026-01-25T14:30:00Z'
  },
  {
    id: 'rev_3',
    productId: 'prod_1',
    userId: 'user_customer_3',
    userName: 'Nicolas Dubois',
    rating: 5,
    comment: 'Meilleur achat de l\'année ! L\'écran de 120Hz est super fluide et l\'autonomie tient largement 2 jours entiers en utilisation normale.',
    createdAt: '2026-02-01T09:00:00Z'
  },
  {
    id: 'rev_4',
    productId: 'prod_2',
    userId: 'user_customer_1',
    userName: 'Thomas Durand',
    rating: 5,
    comment: 'Un monstre de puissance. Mes rendus de vidéos 4K s\'exportent en quelques secondes. Écran XDR sublime.',
    createdAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'rev_5',
    productId: 'prod_2',
    userId: 'user_customer_3',
    userName: 'Nicolas Dubois',
    rating: 5,
    comment: 'Idéal pour le développement logiciel intensif. Un peu lourd à transporter mais l\'écran de 16" compense largement.',
    createdAt: '2026-02-28T16:00:00Z'
  },
  {
    id: 'rev_6',
    productId: 'prod_3',
    userId: 'user_customer_2',
    userName: 'Sophie Martin',
    rating: 5,
    comment: 'La réduction de bruit est bluffante dans le métro ! Son très clair et enveloppant.',
    createdAt: '2026-03-05T15:20:00Z'
  },
  {
    id: 'rev_7',
    productId: 'prod_3',
    userId: 'user_customer_4',
    userName: 'Émilie Moreau',
    rating: 4,
    comment: 'Très confortable à porter même pendant plusieurs heures. Mais le design est un peu imposant sur une petite tête.',
    createdAt: '2026-03-10T09:10:00Z'
  }
];

export const initialUsers: User[] = [
  {
    id: 'user_admin_1',
    name: 'Admin E-Commerce',
    email: 'admin@ecommerce.com',
    role: 'admin',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'user_customer_1',
    name: 'Thomas Durand',
    email: 'thomas@example.com',
    role: 'customer',
    address: '12 Rue de la Paix, 75002 Paris',
    phone: '0612345678',
    createdAt: '2026-01-10T12:00:00Z'
  },
  {
    id: 'user_customer_2',
    name: 'Sophie Martin',
    email: 'sophie@example.com',
    role: 'customer',
    address: '45 Avenue des Champs-Élysées, 75008 Paris',
    phone: '0687654321',
    createdAt: '2026-01-12T14:00:00Z'
  },
  {
    id: 'user_madagascar',
    name: 'Narindra',
    email: 'andriamifehy18@gmail.com',
    role: 'admin',
    address: 'Antananarivo 101',
    phone: '0347454871',
    password: 'password123',
    createdAt: '2026-07-13T00:00:00Z'
  }
];
