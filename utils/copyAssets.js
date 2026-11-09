import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/A2Z/.gemini/antigravity/brain/a94b5ce0-5f28-4a66-ac07-ea3ac02f1d4b';
const projectRoot = 'c:/Users/A2Z/Desktop/Afridi Rangoona';
const prodFrontDir = path.resolve(projectRoot, 'frontend/public/assets/images/products');
const prodBackDir = path.resolve(projectRoot, 'backend/uploads/products');
const catFrontDir = path.resolve(projectRoot, 'frontend/public/assets/images/categories');
const catBackDir = path.resolve(projectRoot, 'backend/uploads/categories');

[prodFrontDir, prodBackDir, catFrontDir, catBackDir].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const files = fs.readdirSync(brainDir);

const mapping = {
  'kaptaan_black': 'kaptaan_black.jpg',
  'peshawari_mustard': 'peshawari_mustard.jpg',
  'swati_white': 'swati_white.jpg',
  'doshala_fawn': 'doshala_fawn.jpg',
  'kurta_set': 'kurta_set.jpg',
  'oud_al_afridi': 'oud_al_afridi.jpg',
  'crimson_sherwani': 'crimson_sherwani.jpg',
  'lapis_tasbih': 'lapis_tasbih.jpg',
  'peshawari_kulla': 'peshawari_kulla.jpg',
  'brass_mabkhara': 'brass_mabkhara.jpg',
  'leather_folio': 'leather_folio.jpg',
  'prince_coat': 'prince_coat.jpg',
  'bab_e_khyber': '../bab-e-khyber.jpg'
};

for (const [prefix, targetName] of Object.entries(mapping)) {
  const match = files.find(f => f.startsWith(prefix) && f.endsWith('.jpg'));
  if (match) {
    const src = path.join(brainDir, match);
    const destFront = path.resolve(prodFrontDir, targetName);
    const destBack = path.resolve(prodBackDir, targetName);
    fs.copyFileSync(src, destFront);
    fs.copyFileSync(src, destBack);
    console.log(`Copied ${match} -> ${targetName}`);
  } else {
    console.log(`Not found for prefix: ${prefix}`);
  }
}

// Category images mapping
const catMapping = {
  'prince_coat.jpg': 'luxury_pret.jpg',
  'swati_white.jpg': 'artisanal_shawls.jpg',
  'kaptaan_black.jpg': 'heritage_footwear.jpg',
  'oud_al_afridi.jpg': 'signature_fragrances.jpg',
  'peshawari_kulla.jpg': 'handcrafted_accessories.jpg'
};

for (const [srcName, destName] of Object.entries(catMapping)) {
  const src = path.join(prodFrontDir, srcName);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(catFrontDir, destName));
    fs.copyFileSync(src, path.join(catBackDir, destName));
    console.log(`Copied category ${srcName} -> ${destName}`);
  }
}

console.log('All images deployed successfully!');
