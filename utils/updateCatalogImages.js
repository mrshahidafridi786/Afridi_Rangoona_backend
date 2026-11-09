import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const categoryImages = {
  'luxury-pret': '/assets/images/categories/luxury_pret.jpg',
  'artisanal-shawls': '/assets/images/categories/artisanal_shawls.jpg',
  'heritage-footwear': '/assets/images/categories/heritage_footwear.jpg',
  'signature-fragrances': '/assets/images/categories/signature_fragrances.jpg',
  'handcrafted-accessories': '/assets/images/categories/handcrafted_accessories.jpg'
};

const productImages = {
  // Luxury Pret
  'imperial-crimson-zardozi-sherwani': ['/assets/images/products/crimson_sherwani.jpg'],
  'raw-silk-kurta-set-sand-ochre': ['/assets/images/products/kurta_set.jpg'],
  'royal-emerald-jamawar-prince-coat': ['/assets/images/products/prince_coat.jpg'],
  'ivory-chanderi-silk-embroidered-angrakha': ['/assets/images/products/crimson_sherwani.jpg'],
  'midnight-navy-velvet-waistcoat-set': ['/assets/images/products/kurta_set.jpg'],
  'charcoal-textured-karandi-kurta-ensemble': ['/assets/images/products/kurta_set.jpg'],

  // Artisanal Shawls & Stoles
  'cashmere-royal-pashmina-shawl': ['/assets/images/products/swati_white.jpg'],
  'antique-tilla-border-himalayan-pashmina': ['/assets/images/products/swati_white.jpg'],
  'black-diamond-kashmiri-kani-weave-shawl': ['/assets/images/products/doshala_fawn.jpg'],
  'saffron-marigold-reversible-cashmere-stole': ['/assets/images/products/swati_white.jpg'],
  'forest-green-dourukha-handloom-shawl': ['/assets/images/products/doshala_fawn.jpg'],
  'natural-shah-toosh-shade-woollen-doshala': ['/assets/images/products/doshala_fawn.jpg'],

  // Heritage Footwear
  'signature-double-sole-kaptaan-chappal': ['/assets/images/products/kaptaan_black.jpg'],
  'classic-mustard-zalmi-peshawari-chappal': ['/assets/images/products/peshawari_mustard.jpg'],
  'hand-burnished-oxblood-shikari-sandal': ['/assets/images/products/peshawari_mustard.jpg'],
  'matte-black-norozi-tyre-sole-chappal': ['/assets/images/products/kaptaan_black.jpg'],
  'embroidered-gold-zardozi-khussa-slippers': ['/assets/images/products/peshawari_mustard.jpg'],
  'camel-leather-hand-carved-peshawari-sandal': ['/assets/images/products/peshawari_mustard.jpg'],

  // Signature Fragrances
  'oud-al-afridi-extrait-de-parfum': ['/assets/images/products/oud_al_afridi.jpg'],
  'ruh-gulab-taif-rose-attar': ['/assets/images/products/oud_al_afridi.jpg'],
  'ambergris-royale-pure-parfum': ['/assets/images/products/oud_al_afridi.jpg'],
  'dehn-al-oud-cambodi-aged-reserve': ['/assets/images/products/oud_al_afridi.jpg'],
  'white-musk-sandalwood-elixir': ['/assets/images/products/oud_al_afridi.jpg'],
  'smoked-bakhoor-frankincense-bricks': ['/assets/images/products/brass_mabkhara.jpg'],

  // Handcrafted Accessories
  'mughal-brass-jewelry-casket': ['/assets/images/products/brass_mabkhara.jpg'],
  'engraved-damascus-steel-brass-cufflinks': ['/assets/images/products/lapis_tasbih.jpg'],
  'full-grain-cowhide-heirloom-document-folio': ['/assets/images/products/leather_folio.jpg'],
  'lapis-lazuli-antique-silver-prayer-beads': ['/assets/images/products/lapis_tasbih.jpg'],
  'hand-chiseled-brass-incense-burner-mabkhara': ['/assets/images/products/brass_mabkhara.jpg'],
  'hand-embroidered-raw-silk-turban-kulla': ['/assets/images/products/peshawari_kulla.jpg']
};

const runUpdate = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Update Categories
    console.log('Updating Categories...');
    for (const [slug, imgPath] of Object.entries(categoryImages)) {
      const res = await Category.updateOne({ slug }, { $set: { image: imgPath } });
      console.log(`Category [${slug}] updated:`, res.modifiedCount > 0 ? 'SUCCESS' : 'Already set or not found');
    }

    // 2. Update Products
    console.log('\nUpdating Products with authentic Pakhtoon imagery...');
    for (const [slug, imgs] of Object.entries(productImages)) {
      const res = await Product.updateOne({ slug }, { $set: { images: imgs } });
      console.log(`Product [${slug}] images updated:`, res.modifiedCount > 0 ? 'SUCCESS' : 'Already set or not found');
    }

    // Also update any remaining products that might have generic unsplash images
    const allProducts = await Product.find({});
    for (const prod of allProducts) {
      if (prod.images && prod.images.length > 0 && prod.images[0].includes('unsplash')) {
        // Fallback to a matching Pakhtoon category image
        let fallback = '/assets/images/products/kaptaan_black.jpg';
        const nameLower = prod.name.toLowerCase();
        if (nameLower.includes('chappal') || nameLower.includes('sandal') || nameLower.includes('khussa')) {
          fallback = '/assets/images/products/kaptaan_black.jpg';
        } else if (nameLower.includes('shawl') || nameLower.includes('pashmina') || nameLower.includes('doshala') || nameLower.includes('stole')) {
          fallback = '/assets/images/products/swati_white.jpg';
        } else if (nameLower.includes('oud') || nameLower.includes('attar') || nameLower.includes('parfum') || nameLower.includes('perfume')) {
          fallback = '/assets/images/products/oud_al_afridi.jpg';
        } else if (nameLower.includes('sherwani') || nameLower.includes('kurta') || nameLower.includes('coat') || nameLower.includes('waistcoat')) {
          fallback = '/assets/images/products/crimson_sherwani.jpg';
        } else if (nameLower.includes('brass') || nameLower.includes('tasbih') || nameLower.includes('kulla') || nameLower.includes('folio')) {
          fallback = '/assets/images/products/peshawari_kulla.jpg';
        }
        await Product.updateOne({ _id: prod._id }, { $set: { images: [fallback] } });
        console.log(`Replaced unsplash for [${prod.name}] -> ${fallback}`);
      }
    }

    console.log('\nAll products & categories updated successfully with authentic Pakhtoon images!');
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
};

runUpdate();
