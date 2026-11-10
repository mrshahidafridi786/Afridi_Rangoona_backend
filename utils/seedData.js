import mongoose from 'mongoose';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { ORDER_STATUS, PAYMENT_STATUS, USER_ROLES } from '../config/constants.js';

export const seedDatabaseIfEmpty = async () => {
  try {
    const existingProducts = await Product.estimatedDocumentCount();
    const existingCategories = await Category.estimatedDocumentCount();
    if (existingProducts > 0 && existingCategories > 0 && process.env.FORCE_SEED !== 'true') {
      return;
    }

    // 1. Seed or find Categories
    const categoriesData = [
      {
        name: 'Luxury Pret',
        slug: 'luxury-pret',
        description: 'Handcrafted contemporary silhouettes accented with fine heritage needlework.',
        image: '/assets/images/categories/luxury_pret.jpg'
      },
      {
        name: 'Artisanal Shawls & Stoles',
        slug: 'artisanal-shawls',
        description: 'Heirloom pashmina and raw wool wraps hand-spun by master artisans.',
        image: '/assets/images/categories/artisanal_shawls.jpg'
      },
      {
        name: 'Heritage Footwear',
        slug: 'heritage-footwear',
        description: 'Iconic bespoke Peshawari and Kaptaan chappals crafted from full-grain leather.',
        image: '/assets/images/categories/heritage_footwear.jpg'
      },
      {
        name: 'Signature Fragrances',
        slug: 'signature-fragrances',
        description: 'Rare oud, Ambergris, and damask rose blends bottled in crystalline glass flacons.',
        image: '/assets/images/categories/signature_fragrances.jpg'
      },
      {
        name: 'Handcrafted Accessories',
        slug: 'handcrafted-accessories',
        description: 'Brass-embossed jewelry boxes, hand-tooled leather folios, and cufflinks.',
        image: '/assets/images/categories/handcrafted_accessories.jpg'
      }
    ];

    const catMap = {};
    for (const catData of categoriesData) {
      let cat = await Category.findOneAndUpdate(
        { slug: catData.slug },
        { $set: catData },
        { upsert: true, new: true }
      );
      catMap[cat.slug] = cat._id;
    }

    // 2. Seed Admin User
    let admin = await User.findOne({ email: 'admin@afridirangoona.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Afridi Administrator',
        email: 'admin@afridirangoona.com',
        phone: '+92 300 1234567',
        passwordHash: 'Admin@Afridi2026',
        role: USER_ROLES.ADMIN,
        accountStatus: 'active',
        addresses: [{
          isDefault: true,
          recipientName: 'Headquarters Administrator',
          phone: '+92 300 1234567',
          street: 'AFRIDI RANGOONA Hujra, University Road',
          city: 'Peshawar',
          state: 'KPK',
          postalCode: '25000',
          country: 'Pakistan'
        }]
      });
    }

    // 3. Seed Customer User
    let customer = await User.findOne({ email: 'customer@afridirangoona.com' });
    if (!customer) {
      customer = await User.create({
        name: 'Taimur Khan',
        email: 'customer@afridirangoona.com',
        phone: '+92 321 9876543',
        passwordHash: 'Customer@2026',
        role: USER_ROLES.CUSTOMER,
        accountStatus: 'active',
        addresses: [{
          isDefault: true,
          recipientName: 'Taimur Khan',
          phone: '+92 321 9876543',
          street: 'Bungalow 42, Khyber Road, Cantt',
          city: 'Peshawar',
          state: 'KPK',
          postalCode: '25000',
          country: 'Pakistan'
        }]
      });
    }

    // 4. Comprehensive Product Catalog (5+ Products in Every Field/Category)
    const productsData = [
      // ==========================================
      // FIELD 1: LUXURY PRET
      // ==========================================
      {
        name: 'Imperial Crimson Zardozi Sherwani',
        slug: 'imperial-crimson-zardozi-sherwani',
        description: 'An architectural heirloom piece crafted from deep crimson raw silk, adorned with hand-carved zardozi embroidery and antique metallic dabka work. Ideal for ceremonial celebrations.',
        price: 185000,
        discountPrice: 165000,
        images: [
          '/assets/images/products/crimson_sherwani.jpg'
        ],
        category: catMap['luxury-pret'],
        variants: [
          { sku: 'SHER-CRIM-38', size: '38 (S)', color: 'Imperial Crimson', stock: 4, priceAdjustment: 0 },
          { sku: 'SHER-CRIM-40', size: '40 (M)', color: 'Imperial Crimson', stock: 6, priceAdjustment: 0 },
          { sku: 'SHER-CRIM-42', size: '42 (L)', color: 'Imperial Crimson', stock: 3, priceAdjustment: 5000 }
        ],
        stock: 13,
        featured: true,
        specifications: [
          { label: 'Fabric', value: '100% Pure Raw Silk' },
          { label: 'Embroidery', value: 'Hand-done Antique Zardozi' },
          { label: 'Care', value: 'Dry Clean Only' }
        ],
        tags: ['Sherwani', 'Couture', 'Wedding', 'Silk', 'Heritage']
      },
      {
        name: 'Raw Silk Kurta Set in Sand Ochre',
        slug: 'raw-silk-kurta-set-sand-ochre',
        description: 'A relaxed modern luxury silhouette cut from unbleached woven tussar silk with hidden placket horn buttons and subtle thread accents on the mandarin collar.',
        price: 38000,
        discountPrice: 34000,
        images: [
          '/assets/images/products/kurta_set.jpg'
        ],
        category: catMap['luxury-pret'],
        variants: [
          { sku: 'KRT-OCH-S', size: 'Small', color: 'Sand Ochre', stock: 8, priceAdjustment: 0 },
          { sku: 'KRT-OCH-M', size: 'Medium', color: 'Sand Ochre', stock: 14, priceAdjustment: 0 },
          { sku: 'KRT-OCH-L', size: 'Large', color: 'Sand Ochre', stock: 11, priceAdjustment: 0 }
        ],
        stock: 33,
        featured: true,
        specifications: [
          { label: 'Material', value: '100% Hand-Loomed Tussar Silk' },
          { label: 'Set Includes', value: 'Kurta & Tailored Pajama' }
        ],
        tags: ['Kurta', 'Pret', 'Menswear', 'Silk', 'Festive']
      },
      {
        name: 'Royal Emerald Jamawar Prince Coat',
        slug: 'royal-emerald-jamawar-prince-coat',
        description: 'Handwoven Benares jamawar fabric with antique gold bullion wire and self-embossed floral paisley weaves, finished with bespoke horn buttons.',
        price: 125000,
        discountPrice: 110000,
        images: [
          '/assets/images/products/prince_coat.jpg'
        ],
        category: catMap['luxury-pret'],
        variants: [
          { sku: 'COAT-EMR-38', size: '38 (S)', color: 'Royal Emerald', stock: 5, priceAdjustment: 0 },
          { sku: 'COAT-EMR-40', size: '40 (M)', color: 'Royal Emerald', stock: 7, priceAdjustment: 0 },
          { sku: 'COAT-EMR-42', size: '42 (L)', color: 'Royal Emerald', stock: 4, priceAdjustment: 4000 }
        ],
        stock: 16,
        featured: true,
        specifications: [
          { label: 'Fabric', value: 'Hand-Loomed Silk Jamawar' },
          { label: 'Lining', value: 'Italian Bemberg Satin' },
          { label: 'Closure', value: 'Antiqued Horn Buttons' }
        ],
        tags: ['Prince Coat', 'Jamawar', 'Emerald', 'Formal', 'Bespoke']
      },
      {
        name: 'Ivory Chanderi Silk Embroidered Angrakha',
        slug: 'ivory-chanderi-silk-embroidered-angrakha',
        description: 'Traditional overlapping royal Angrakha cut from sheer Chanderi silk with hand-embroidered resham threadwork, seed pearls, and silk tie cords.',
        price: 95000,
        discountPrice: 85000,
        images: [
          '/assets/images/products/crimson_sherwani.jpg'
        ],
        category: catMap['luxury-pret'],
        variants: [
          { sku: 'ANG-IVR-S', size: 'Small', color: 'Warm Ivory', stock: 4, priceAdjustment: 0 },
          { sku: 'ANG-IVR-M', size: 'Medium', color: 'Warm Ivory', stock: 8, priceAdjustment: 0 },
          { sku: 'ANG-IVR-L', size: 'Large', color: 'Warm Ivory', stock: 5, priceAdjustment: 0 }
        ],
        stock: 17,
        featured: false,
        specifications: [
          { label: 'Fabric', value: 'Pure Chanderi Silk' },
          { label: 'Handwork', value: 'Resham & Mukeesh Work' },
          { label: 'Color', value: 'Warm Ivory with Silver Tilla' }
        ],
        tags: ['Angrakha', 'Pret', 'Ivory', 'Chanderi', 'Couture']
      },
      {
        name: 'Midnight Navy Velvet Waistcoat Set',
        slug: 'midnight-navy-velvet-waistcoat-set',
        description: 'Plush micro-velvet waistcoat in midnight navy, detailed with hand-hammered brass crest buttons and subtle tilla piping along the lapel contour.',
        price: 52000,
        discountPrice: 46000,
        images: [
          '/assets/images/products/kurta_set.jpg'
        ],
        category: catMap['luxury-pret'],
        variants: [
          { sku: 'WST-NVY-S', size: 'Small', color: 'Midnight Navy', stock: 6, priceAdjustment: 0 },
          { sku: 'WST-NVY-M', size: 'Medium', color: 'Midnight Navy', stock: 12, priceAdjustment: 0 },
          { sku: 'WST-NVY-L', size: 'Large', color: 'Midnight Navy', stock: 9, priceAdjustment: 0 }
        ],
        stock: 27,
        featured: false,
        specifications: [
          { label: 'Fabric', value: 'Micro Silk Velvet' },
          { label: 'Buttons', value: 'Custom Chiseled Brass Crest' },
          { label: 'Pocketing', value: 'Double-Welt Slit Pockets' }
        ],
        tags: ['Waistcoat', 'Velvet', 'Navy', 'Occasionwear']
      },
      {
        name: 'Charcoal Textured Karandi Kurta Ensemble',
        slug: 'charcoal-textured-karandi-kurta-ensemble',
        description: 'Handspun winter karandi fabric dyed in deep charcoal gray with contrast herringbone weave and a crisp stiffened band collar.',
        price: 34000,
        discountPrice: 29500,
        images: [
          '/assets/images/products/kurta_set.jpg'
        ],
        category: catMap['luxury-pret'],
        variants: [
          { sku: 'KRT-CHR-M', size: 'Medium', color: 'Charcoal Gray', stock: 10, priceAdjustment: 0 },
          { sku: 'KRT-CHR-L', size: 'Large', color: 'Charcoal Gray', stock: 12, priceAdjustment: 0 }
        ],
        stock: 22,
        featured: false,
        specifications: [
          { label: 'Material', value: '100% Handspun Karandi' },
          { label: 'Dye', value: 'Azo-Free Pigment Dye' }
        ],
        tags: ['Karandi', 'Kurta', 'Winter', 'Minimalist']
      },

      // ==========================================
      // FIELD 2: ARTISANAL SHAWLS & STOLES
      // ==========================================
      {
        name: 'Cashmere Royal Pashmina Shawl',
        slug: 'cashmere-royal-pashmina-shawl',
        description: 'Woven on historic handlooms from pure Himalayan grade-A cashmere, this ivory wrap showcases intricate paisley sozni needlework that requires over three months of artisanal devotion.',
        price: 85000,
        discountPrice: 78000,
        images: [
          '/assets/images/products/swati_white.jpg'
        ],
        category: catMap['artisanal-shawls'],
        variants: [
          { sku: 'PSH-IVR-STD', size: 'Standard (100x200cm)', color: 'Warm Ivory', stock: 8, priceAdjustment: 0 },
          { sku: 'PSH-BLK-STD', size: 'Standard (100x200cm)', color: 'Charcoal Black', stock: 5, priceAdjustment: 0 }
        ],
        stock: 13,
        featured: true,
        specifications: [
          { label: 'Material', value: '100% Himalayan Pashmina' },
          { label: 'Weave', value: 'Artisanal Diamond Twill' },
          { label: 'Origin', value: 'Northern Valleys' }
        ],
        tags: ['Pashmina', 'Cashmere', 'Shawl', 'Heirloom', 'Ivory']
      },
      {
        name: 'Antique Tilla Border Himalayan Pashmina',
        slug: 'antique-tilla-border-himalayan-pashmina',
        description: 'Woven from 12-micron Himalayan cashmere with hand-twisted real silver-gilt tilla embroidery adorning all four borders (Dorda).',
        price: 95000,
        discountPrice: 88000,
        images: [
          '/assets/images/products/swati_white.jpg'
        ],
        category: catMap['artisanal-shawls'],
        variants: [
          { sku: 'TIL-ALM-STD', size: 'Standard (100x200cm)', color: 'Almond Beige', stock: 7, priceAdjustment: 0 },
          { sku: 'TIL-BLK-STD', size: 'Standard (100x200cm)', color: 'Noir Black', stock: 4, priceAdjustment: 0 }
        ],
        stock: 11,
        featured: true,
        specifications: [
          { label: 'Fiber', value: '100% Capra Hircus Cashmere' },
          { label: 'Embroidery', value: 'Real Metallic Tilla Wire' },
          { label: 'Border', value: 'Four-Sided Hashia Border' }
        ],
        tags: ['Tilla', 'Pashmina', 'Embroidered', 'Silver', 'Luxury']
      },
      {
        name: 'Black Diamond Kashmiri Kani Weave Shawl',
        slug: 'black-diamond-kashmiri-kani-weave-shawl',
        description: 'An extraordinary masterpiece woven using wooden Kani spools, recreating 18th-century royal Mughal court tapestries over a 9-month weaving period.',
        price: 145000,
        discountPrice: 130000,
        images: [
          '/assets/images/products/doshala_fawn.jpg'
        ],
        category: catMap['artisanal-shawls'],
        variants: [
          { sku: 'KANI-NOIR-STD', size: 'Standard (110x220cm)', color: 'Noir Multicolore', stock: 3, priceAdjustment: 0 }
        ],
        stock: 3,
        featured: true,
        specifications: [
          { label: 'Weaving Technique', value: 'Authentic Kani Wooden Spool' },
          { label: 'Crafting Time', value: '9 Months Continuous Handloom' },
          { label: 'Certificate', value: 'Master Artisan Heritage Seal' }
        ],
        tags: ['Kani', 'Shawl', 'Collector', 'Masterpiece', 'Cashmere']
      },
      {
        name: 'Saffron Marigold Reversible Cashmere Stole',
        slug: 'saffron-marigold-reversible-cashmere-stole',
        description: 'Double-woven two-tone cashmere stole displaying fiery Kashmiri saffron on one face and rich burnt sienna on the reverse with eyelash fringes.',
        price: 62000,
        discountPrice: 54000,
        images: [
          '/assets/images/products/swati_white.jpg'
        ],
        category: catMap['artisanal-shawls'],
        variants: [
          { sku: 'STL-SAF-STD', size: 'Stole (70x200cm)', color: 'Saffron / Sienna', stock: 12, priceAdjustment: 0 }
        ],
        stock: 12,
        featured: false,
        specifications: [
          { label: 'Fiber', value: 'Grade-A Pure Cashmere' },
          { label: 'Dye', value: 'Organic Saffron Extract' },
          { label: 'Fringes', value: 'Delicate Eyelash Finish' }
        ],
        tags: ['Stole', 'Saffron', 'Cashmere', 'Reversible', 'Scarf']
      },
      {
        name: 'Forest Green Dourukha Handloom Shawl',
        slug: 'forest-green-dourukha-handloom-shawl',
        description: 'Double-sided (Dourukha) intricate needlework where stitches look identical on both front and back, crafted in deep pine green and muted bronze.',
        price: 78000,
        discountPrice: 69000,
        images: [
          '/assets/images/products/doshala_fawn.jpg'
        ],
        category: catMap['artisanal-shawls'],
        variants: [
          { sku: 'DOU-GRN-STD', size: 'Standard (100x200cm)', color: 'Pine & Bronze', stock: 6, priceAdjustment: 0 }
        ],
        stock: 6,
        featured: false,
        specifications: [
          { label: 'Technique', value: 'Dourukha Double-Sided Needlework' },
          { label: 'Weight', value: 'Ultra-light 185g' }
        ],
        tags: ['Dourukha', 'Green', 'Shawl', 'Needlework']
      },
      {
        name: 'Natural Shah-Toosh Shade Woollen Doshala',
        slug: 'natural-shah-toosh-shade-woollen-doshala',
        description: 'An oversized traditional Doshala wrap spun in the natural fawn and walnut shade of Himalayan mountain wool, finished with fine spun fringe ends.',
        price: 110000,
        discountPrice: 98000,
        images: [
          '/assets/images/products/doshala_fawn.jpg'
        ],
        category: catMap['artisanal-shawls'],
        variants: [
          { sku: 'DOSH-NAT-OVR', size: 'Oversized (125x250cm)', color: 'Natural Fawn', stock: 5, priceAdjustment: 0 }
        ],
        stock: 5,
        featured: false,
        specifications: [
          { label: 'Material', value: '100% Virgin Mountain Fleece' },
          { label: 'Dimensions', value: '125cm x 250cm (Men’s Doshala)' }
        ],
        tags: ['Doshala', 'Natural', 'Wool', 'Heirloom', 'Warmth']
      },

      // ==========================================
      // FIELD 3: HERITAGE FOOTWEAR
      // ==========================================
      {
        name: 'Signature Double-Sole Kaptaan Chappal',
        slug: 'signature-double-sole-kaptaan-chappal',
        description: 'The defining archetype of Khyber leather craftsmanship. Handcrafted from vegetable-tanned oil-pull full grain cowhide with tire-tread rugged sole and gold needle detailing.',
        price: 24500,
        discountPrice: 21500,
        images: [
          '/assets/images/products/kaptaan_black.jpg'
        ],
        category: catMap['heritage-footwear'],
        variants: [
          { sku: 'KAP-BRN-41', size: '41 (EU)', color: 'Cognac Brown', stock: 12, priceAdjustment: 0 },
          { sku: 'KAP-BRN-42', size: '42 (EU)', color: 'Cognac Brown', stock: 15, priceAdjustment: 0 },
          { sku: 'KAP-BRN-43', size: '43 (EU)', color: 'Cognac Brown', stock: 9, priceAdjustment: 0 },
          { sku: 'KAP-BLK-42', size: '42 (EU)', color: 'Midnight Black', stock: 8, priceAdjustment: 0 }
        ],
        stock: 44,
        featured: true,
        specifications: [
          { label: 'Upper', value: 'Full-Grain Vegetable Tanned Leather' },
          { label: 'Insole', value: 'Memory Foam Padded Leather' },
          { label: 'Sole', value: 'Heavy-Duty Hand-Sewn Rubber' }
        ],
        tags: ['Footwear', 'Chappal', 'Leather', 'Kaptaan', 'Handcrafted']
      },
      {
        name: 'Classic Mustard Zalmi Peshawari Chappal',
        slug: 'classic-mustard-zalmi-peshawari-chappal',
        description: 'Hand-stitched in the historic Namak Mandi atelier, featuring premium vegetable-tanned mustard leather, low-profile lightweight sole, and brass side studs.',
        price: 22500,
        discountPrice: 19500,
        images: [
          '/assets/images/products/peshawari_mustard.jpg'
        ],
        category: catMap['heritage-footwear'],
        variants: [
          { sku: 'ZAL-MUS-41', size: '41 (EU)', color: 'Warm Mustard', stock: 14, priceAdjustment: 0 },
          { sku: 'ZAL-MUS-42', size: '42 (EU)', color: 'Warm Mustard', stock: 16, priceAdjustment: 0 },
          { sku: 'ZAL-MUS-43', size: '43 (EU)', color: 'Warm Mustard', stock: 11, priceAdjustment: 0 }
        ],
        stock: 41,
        featured: true,
        specifications: [
          { label: 'Leather', value: 'Full-Grain Vegetable Tanned Cowhide' },
          { label: 'Sole', value: 'Ergonomic Lightweight Rubber' },
          { label: 'Origin', value: 'Namak Mandi, Peshawar' }
        ],
        tags: ['Peshawari', 'Zalmi', 'Mustard', 'Chappal', 'Traditional']
      },
      {
        name: 'Hand-Burnished Oxblood Shikari Sandal',
        slug: 'hand-burnished-oxblood-shikari-sandal',
        description: 'A warrior-heritage open-toe Peshawari sandal with cross-over front straps hand-stained in rich oxblood patina, lined with soft glove leather.',
        price: 26000,
        discountPrice: 22500,
        images: [
          '/assets/images/products/peshawari_mustard.jpg'
        ],
        category: catMap['heritage-footwear'],
        variants: [
          { sku: 'SHK-OXB-41', size: '41 (EU)', color: 'Oxblood Patina', stock: 8, priceAdjustment: 0 },
          { sku: 'SHK-OXB-42', size: '42 (EU)', color: 'Oxblood Patina', stock: 10, priceAdjustment: 0 },
          { sku: 'SHK-OXB-43', size: '43 (EU)', color: 'Oxblood Patina', stock: 7, priceAdjustment: 0 }
        ],
        stock: 25,
        featured: false,
        specifications: [
          { label: 'Leather', value: 'Hand-Burnished Calfskin' },
          { label: 'Insole', value: 'Arch-Supported Orthopedic Core' },
          { label: 'Construction', value: 'Goodyear Welted Perimeter' }
        ],
        tags: ['Shikari', 'Oxblood', 'Leather', 'Patina', 'Luxury Footwear']
      },
      {
        name: 'Matte Black Norozi Tyre-Sole Chappal',
        slug: 'matte-black-norozi-tyre-sole-chappal',
        description: 'The authentic Balochi and Pashtun Norozi design with pronounced pointed toe box, triple-needle contrast nylon stitch, and reclaimed airplane tire sole.',
        price: 25500,
        discountPrice: 23000,
        images: [
          '/assets/images/products/kaptaan_black.jpg'
        ],
        category: catMap['heritage-footwear'],
        variants: [
          { sku: 'NOR-BLK-41', size: '41 (EU)', color: 'Matte Black', stock: 9, priceAdjustment: 0 },
          { sku: 'NOR-BLK-42', size: '42 (EU)', color: 'Matte Black', stock: 14, priceAdjustment: 0 },
          { sku: 'NOR-BLK-43', size: '43 (EU)', color: 'Matte Black', stock: 8, priceAdjustment: 0 }
        ],
        stock: 31,
        featured: false,
        specifications: [
          { label: 'Sole', value: 'Reclaimed High-Mileage Tire Tread' },
          { label: 'Thread', value: 'Heavy Waxed Nylon Hand-Cord' },
          { label: 'Toe Shape', value: 'Traditional Norozi Taper' }
        ],
        tags: ['Norozi', 'Black', 'Tyre Sole', 'Rugged', 'Balochi']
      },
      {
        name: 'Embroidered Gold Zardozi Khussa Slippers',
        slug: 'embroidered-gold-zardozi-khussa-slippers',
        description: 'Ceremonial pointed-toe slip-on shoes crafted from supple buff leather and densely encrusted with antique gold zardozi bullion and sequins.',
        price: 18500,
        discountPrice: 16000,
        images: [
          '/assets/images/products/peshawari_mustard.jpg'
        ],
        category: catMap['heritage-footwear'],
        variants: [
          { sku: 'KHU-GLD-41', size: '41 (EU)', color: 'Antique Gold', stock: 7, priceAdjustment: 0 },
          { sku: 'KHU-GLD-42', size: '42 (EU)', color: 'Antique Gold', stock: 11, priceAdjustment: 0 },
          { sku: 'KHU-GLD-43', size: '43 (EU)', color: 'Antique Gold', stock: 6, priceAdjustment: 0 }
        ],
        stock: 24,
        featured: false,
        specifications: [
          { label: 'Craft', value: 'Hand-done Zardozi Needlework' },
          { label: 'Lining', value: 'Soft Velvet Cushioned Bed' }
        ],
        tags: ['Khussa', 'Zardozi', 'Wedding', 'Gold', 'Footwear']
      },
      {
        name: 'Camel Leather Hand-Carved Peshawari Sandal',
        slug: 'camel-leather-hand-carved-peshawari-sandal',
        description: 'Made from sturdy yet breathable desert camel hide, embossed with geometric tribal relief cuts and finished with hand-hammered copper buckle hardware.',
        price: 28000,
        discountPrice: 24500,
        images: [
          '/assets/images/products/peshawari_mustard.jpg'
        ],
        category: catMap['heritage-footwear'],
        variants: [
          { sku: 'CAM-TAN-42', size: '42 (EU)', color: 'Desert Tan', stock: 8, priceAdjustment: 0 },
          { sku: 'CAM-TAN-43', size: '43 (EU)', color: 'Desert Tan', stock: 6, priceAdjustment: 0 }
        ],
        stock: 14,
        featured: false,
        specifications: [
          { label: 'Leather', value: '100% Desert Camel Hide' },
          { label: 'Hardware', value: 'Solid Copper Buckles' }
        ],
        tags: ['Camel Leather', 'Carved', 'Peshawari', 'Artisanal']
      },

      // ==========================================
      // FIELD 4: SIGNATURE FRAGRANCES
      // ==========================================
      {
        name: 'Oud Al-Afridi Extrait de Parfum (100ml)',
        slug: 'oud-al-afridi-extrait-de-parfum',
        description: 'A dark, smoky symphony of 25-year aged Cambodian agarwood, Damascus rose, and rare Moroccan saffron, anchored by base notes of tobacco leaf and dry bourbon vanilla.',
        price: 36000,
        discountPrice: 32000,
        images: [
          '/assets/images/products/oud_al_afridi.jpg'
        ],
        category: catMap['signature-fragrances'],
        variants: [
          { sku: 'OUD-100ML', size: '100ml Flacon', color: 'Amber Flacon', stock: 22, priceAdjustment: 0 }
        ],
        stock: 22,
        featured: true,
        specifications: [
          { label: 'Concentration', value: 'Extrait de Parfum (30% Oil)' },
          { label: 'Top Notes', value: 'Moroccan Saffron, Cardamom, Nutmeg' },
          { label: 'Heart Notes', value: 'Damascus Rose, Incense, Cedarwood' },
          { label: 'Base Notes', value: 'Aged Agarwood, Smoked Amber, Musk' }
        ],
        tags: ['Perfume', 'Oud', 'Fragrance', 'Extrait', 'Luxury']
      },
      {
        name: 'Ruh Gulab Taif Rose Attar (12ml)',
        slug: 'ruh-gulab-taif-rose-attar',
        description: 'Pure hydro-distilled Mountain Rose oil extracted in copper stills, blended into organic Mysore sandalwood oil base. 100% alcohol-free artisanal oil.',
        price: 24000,
        discountPrice: 21000,
        images: [
          '/assets/images/products/oud_al_afridi.jpg'
        ],
        category: catMap['signature-fragrances'],
        variants: [
          { sku: 'ROSE-12ML', size: '12ml Crystal Tola', color: 'Gold Crystal', stock: 18, priceAdjustment: 0 }
        ],
        stock: 18,
        featured: true,
        specifications: [
          { label: 'Concentration', value: '100% Concentrated Pure Perfume Oil' },
          { label: 'Base', value: 'Aged Mysore Sandalwood Oil' },
          { label: 'Alcohol', value: '0% (Halal & Alcohol-Free)' }
        ],
        tags: ['Attar', 'Rose', 'Ruh Gulab', 'Organic', 'Oil']
      },
      {
        name: 'Ambergris Royale Pure Parfum (100ml)',
        slug: 'ambergris-royale-pure-parfum',
        description: 'An oceanic and regal oriental blend built on genuine grey ambergris, Madagascan bourbon vanilla, bergamot rind, and smoky labdanum.',
        price: 42000,
        discountPrice: 38000,
        images: [
          '/assets/images/products/oud_al_afridi.jpg'
        ],
        category: catMap['signature-fragrances'],
        variants: [
          { sku: 'AMB-100ML', size: '100ml Flacon', color: 'Crystal Gold', stock: 15, priceAdjustment: 0 }
        ],
        stock: 15,
        featured: true,
        specifications: [
          { label: 'Concentration', value: 'Pure Parfum (28% Concentration)' },
          { label: 'Longevity', value: '14+ Hours Skin Scent' },
          { label: 'Flacon', value: 'Heavy French Crystal with Magnetic Cap' }
        ],
        tags: ['Ambergris', 'Parfum', 'Vanilla', 'Oceanic', 'Royale']
      },
      {
        name: 'Dehn Al Oud Cambodi Aged Reserve (6ml)',
        slug: 'dehn-al-oud-cambodi-aged-reserve',
        description: 'A thick, resinous nectar of 30-year wild-harvested Koh Kong agarwood with deep leather, dried plum, and warm balsamic animalic warmth.',
        price: 38000,
        discountPrice: 34000,
        images: [
          '/assets/images/products/oud_al_afridi.jpg'
        ],
        category: catMap['signature-fragrances'],
        variants: [
          { sku: 'CAM-OUD-6ML', size: '6ml Crystal Vial', color: 'Antique Amber', stock: 9, priceAdjustment: 0 }
        ],
        stock: 9,
        featured: false,
        specifications: [
          { label: 'Harvest Year', value: '1996 Reserve Distillation' },
          { label: 'Origin', value: 'Wild Forests of Koh Kong, Cambodia' }
        ],
        tags: ['Cambodi Oud', 'Aged', 'Rare', 'Agarwood']
      },
      {
        name: 'White Musk & Sandalwood Elixir (100ml)',
        slug: 'white-musk-sandalwood-elixir',
        description: 'An ethereal and luminous skin scent combining creamy white cedar, powdery white musk, iris pallida, and sun-warmed sandalwood.',
        price: 28000,
        discountPrice: 24500,
        images: [
          '/assets/images/products/oud_al_afridi.jpg'
        ],
        category: catMap['signature-fragrances'],
        variants: [
          { sku: 'MSK-100ML', size: '100ml Flacon', color: 'Frosted White', stock: 20, priceAdjustment: 0 }
        ],
        stock: 20,
        featured: false,
        specifications: [
          { label: 'Family', value: 'Woody Powdery Floral' },
          { label: 'Signature', value: 'Intimate Velvet Trail' }
        ],
        tags: ['White Musk', 'Sandalwood', 'Clean', 'Elixir']
      },
      {
        name: 'Smoked Bakhoor & Frankincense Incense Bricks',
        slug: 'smoked-bakhoor-frankincense-bricks',
        description: 'Generously infused with musk oil, amber resin, and Hojari frankincense tears. Melts slowly on charcoal to perfume rooms and couture garments.',
        price: 12500,
        discountPrice: 10500,
        images: [
          '/assets/images/products/brass_mabkhara.jpg'
        ],
        category: catMap['signature-fragrances'],
        variants: [
          { sku: 'BAK-120G', size: '120g Keepsake Box', color: 'Mahogany Casket', stock: 25, priceAdjustment: 0 }
        ],
        stock: 25,
        featured: false,
        specifications: [
          { label: 'Contents', value: '24 Compressed Aromatic Tablets' },
          { label: 'Resin', value: 'Royal Green Hojari Frankincense' }
        ],
        tags: ['Bakhoor', 'Incense', 'Home Fragrance', 'Frankincense']
      },

      // ==========================================
      // FIELD 5: HANDCRAFTED ACCESSORIES
      // ==========================================
      {
        name: 'Hand-Hammered Mughal Brass Jewelry Casket',
        slug: 'mughal-brass-jewelry-casket',
        description: 'Solid brass heirloom casket individually chiseled with arabesque botanical motifs, featuring velvet-lined interior compartments and an antique patinated clasp.',
        price: 18500,
        discountPrice: 15500,
        images: [
          '/assets/images/products/brass_mabkhara.jpg'
        ],
        category: catMap['handcrafted-accessories'],
        variants: [
          { sku: 'BOX-BRS-MD', size: 'Medium (22x15x10cm)', color: 'Antique Brass', stock: 10, priceAdjustment: 0 }
        ],
        stock: 10,
        featured: false,
        specifications: [
          { label: 'Metal', value: 'Solid Heavy Brass' },
          { label: 'Interior', value: 'Burgundy Silk Velvet' },
          { label: 'Finish', value: 'Hand-Polished Antique Patina' }
        ],
        tags: ['Accessories', 'Brass', 'Heirloom', 'Decor', 'Craft']
      },
      {
        name: 'Engraved Damascus Steel & Brass Cufflinks',
        slug: 'engraved-damascus-steel-brass-cufflinks',
        description: 'Hand-forged 512-layer Damascus pattern-welded steel encased in polished brass bezels with swivel toggle backs, presented in a velvet cedar keepsake box.',
        price: 14500,
        discountPrice: 12000,
        images: [
          '/assets/images/products/lapis_tasbih.jpg'
        ],
        category: catMap['handcrafted-accessories'],
        variants: [
          { sku: 'CUF-DAM-STD', size: 'One Size (Pair)', color: 'Steel & Gold', stock: 15, priceAdjustment: 0 }
        ],
        stock: 15,
        featured: true,
        specifications: [
          { label: 'Steel', value: '512-Layer Forged Damascus' },
          { label: 'Bezel', value: 'Jeweler-Grade Solid Brass' },
          { label: 'Closure', value: 'Heavy Duty Whale-Tail Toggle' }
        ],
        tags: ['Cufflinks', 'Damascus', 'Steel', 'Gentleman', 'Accessories']
      },
      {
        name: 'Full-Grain Cowhide Heirloom Document Folio',
        slug: 'full-grain-cowhide-heirloom-document-folio',
        description: 'A vegetable-tanned full-grain leather portfolio designed for 14-inch laptops and legal folios, secured with a solid brass wrap-around tab closure.',
        price: 26000,
        discountPrice: 22500,
        images: [
          '/assets/images/products/leather_folio.jpg'
        ],
        category: catMap['handcrafted-accessories'],
        variants: [
          { sku: 'FOL-TAN-14', size: '14" Laptop Folio', color: 'Cognac Tan', stock: 8, priceAdjustment: 0 },
          { sku: 'FOL-BRN-14', size: '14" Laptop Folio', color: 'Espresso Brown', stock: 6, priceAdjustment: 0 }
        ],
        stock: 14,
        featured: true,
        specifications: [
          { label: 'Leather', value: '2.2mm Oil-Infused Full Grain Cowhide' },
          { label: 'Hardware', value: 'Antiqued Hand-Turned Brass' },
          { label: 'Capacity', value: 'Up to 14" MacBook Pro + Folio Pad' }
        ],
        tags: ['Folio', 'Leather', 'Document Bag', 'Executive', 'Handmade']
      },
      {
        name: 'Lapis Lazuli & Antique Silver Prayer Beads',
        slug: 'lapis-lazuli-antique-silver-prayer-beads',
        description: 'Traditional 33-bead tasbih hand-strung with natural royal blue Badakhshan lapis lazuli gemstones, separated by solid sterling silver spacers and finished with an ornate silver tassel.',
        price: 19500,
        discountPrice: 16500,
        images: [
          '/assets/images/products/lapis_tasbih.jpg'
        ],
        category: catMap['handcrafted-accessories'],
        variants: [
          { sku: 'TSB-LAP-33', size: '33 Beads (8mm)', color: 'Lapis Blue & Silver', stock: 12, priceAdjustment: 0 }
        ],
        stock: 12,
        featured: false,
        specifications: [
          { label: 'Stone', value: 'Genuine Badakhshan Lapis Lazuli' },
          { label: 'Silver', value: '925 Sterling Silver Spacers' },
          { label: 'Count', value: '33 Counting Beads + Imamah' }
        ],
        tags: ['Tasbih', 'Lapis Lazuli', 'Silver', 'Spiritual', 'Beads']
      },
      {
        name: 'Hand-Chiseled Brass Incense Burner Mabkhara',
        slug: 'hand-chiseled-brass-incense-burner-mabkhara',
        description: 'Architectural Mughal pavilion silhouette brass burner with lattice jali ventilation lid, designed for burning bakhoor, frankincense, and oud chips safely.',
        price: 16000,
        discountPrice: 13500,
        images: [
          '/assets/images/products/brass_mabkhara.jpg'
        ],
        category: catMap['handcrafted-accessories'],
        variants: [
          { sku: 'MAB-BRS-20', size: 'Height 20cm', color: 'Antiqued Brass', stock: 9, priceAdjustment: 0 }
        ],
        stock: 9,
        featured: false,
        specifications: [
          { label: 'Material', value: 'Hand-Poured & Chiseled Brass' },
          { label: 'Design', value: 'Mughal Jali Open Lattice' }
        ],
        tags: ['Mabkhara', 'Incense Burner', 'Brass', 'Heritage Living']
      },
      {
        name: 'Hand-Embroidered Raw Silk Turban Kulla',
        slug: 'hand-embroidered-raw-silk-turban-kulla',
        description: 'A structured ceremonial skullcap (Kulla) wrapped in hand-woven raw silk, featuring zardozi sunburst crest embroidery worn under grand Peshawari turbans.',
        price: 21000,
        discountPrice: 18000,
        images: [
          '/assets/images/products/peshawari_kulla.jpg'
        ],
        category: catMap['handcrafted-accessories'],
        variants: [
          { sku: 'KUL-GLD-57', size: '57cm (M)', color: 'Imperial Gold', stock: 7, priceAdjustment: 0 },
          { sku: 'KUL-GLD-59', size: '59cm (L)', color: 'Imperial Gold', stock: 5, priceAdjustment: 0 }
        ],
        stock: 12,
        featured: false,
        specifications: [
          { label: 'Foundation', value: 'Reinforced Buckram Stiffened Core' },
          { label: 'Covering', value: '100% Hand-Woven Silk with Zari' }
        ],
        tags: ['Kulla', 'Turban', 'Peshawari', 'Ceremonial', 'Headwear']
      }
    ];

    for (const prodData of productsData) {
      await Product.findOneAndUpdate(
        { slug: prodData.slug },
        { $set: prodData },
        { upsert: true, new: true }
      );
    }

    // 5. Seed Coupons
    const couponsData = [
      {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minSpend: 5000,
        maxDiscount: 15000,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      {
        code: 'RANGOONA20',
        discountType: 'percentage',
        discountValue: 20,
        minSpend: 50000,
        maxDiscount: 30000,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    ];

    for (const c of couponsData) {
      const exists = await Coupon.findOne({ code: c.code });
      if (!exists) {
        await Coupon.create(c);
      }
    }

    // 6. Seed Sample Completed Order for verified review check
    const sampleProduct = await Product.findOne({ slug: 'imperial-crimson-zardozi-sherwani' });
    if (sampleProduct && customer) {
      const existingOrder = await Order.findOne({ orderNumber: 'AR-20261101-7782' });
      if (!existingOrder) {
        const order = await Order.create({
          orderNumber: 'AR-20261101-7782',
          user: customer._id,
          items: [{
            product: sampleProduct._id,
            name: sampleProduct.name,
            image: sampleProduct.images[0],
            variantSku: 'SHER-CRIM-40',
            color: 'Imperial Crimson',
            size: '40 (M)',
            price: 165000,
            quantity: 1,
            subtotal: 165000
          }],
          shippingAddress: {
            ...customer.addresses[0].toObject(),
            email: customer.email
          },
          subtotal: 165000,
          discount: 16500,
          shippingFee: 0,
          totalAmount: 148500,
          couponApplied: 'WELCOME10',
          paymentStatus: PAYMENT_STATUS.PAID,
          orderStatus: ORDER_STATUS.DELIVERED,
          paymentMethod: 'Stripe Sandbox',
          paymentReference: 'ch_seed_verified_123',
          trackingNumber: 'TCS-99482019'
        });

        await Review.create({
          user: customer._id,
          product: sampleProduct._id,
          order: order._id,
          rating: 5,
          title: 'Majestic craftsmanship and impeccable tailoring',
          comment: 'The zardozi handwork on this sherwani is truly museum grade. The weight of the silk drape and fit are exceptional.',
          verifiedPurchase: true,
          status: 'approved'
        });
      }
    }

    console.log('[Seed] Database populated successfully with idempotent checking.');
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
};
