import fs from 'fs';
import path from 'path';

const seedFilePath = path.resolve('utils/seedData.js');
let content = fs.readFileSync(seedFilePath, 'utf8');

const imageMappings = {
  'imperial-crimson-zardozi-sherwani': "['/assets/images/products/crimson_sherwani.jpg']",
  'raw-silk-kurta-set-sand-ochre': "['/assets/images/products/kurta_set.jpg']",
  'royal-emerald-jamawar-prince-coat': "['/assets/images/products/prince_coat.jpg']",
  'ivory-chanderi-silk-embroidered-angrakha': "['/assets/images/products/crimson_sherwani.jpg']",
  'midnight-navy-velvet-waistcoat-set': "['/assets/images/products/kurta_set.jpg']",
  'charcoal-textured-karandi-kurta-ensemble': "['/assets/images/products/kurta_set.jpg']",

  'cashmere-royal-pashmina-shawl': "['/assets/images/products/swati_white.jpg']",
  'antique-tilla-border-himalayan-pashmina': "['/assets/images/products/swati_white.jpg']",
  'black-diamond-kashmiri-kani-weave-shawl': "['/assets/images/products/doshala_fawn.jpg']",
  'saffron-marigold-reversible-cashmere-stole': "['/assets/images/products/swati_white.jpg']",
  'forest-green-dourukha-handloom-shawl': "['/assets/images/products/doshala_fawn.jpg']",
  'natural-shah-toosh-shade-woollen-doshala': "['/assets/images/products/doshala_fawn.jpg']",

  'signature-double-sole-kaptaan-chappal': "['/assets/images/products/kaptaan_black.jpg']",
  'classic-mustard-zalmi-peshawari-chappal': "['/assets/images/products/peshawari_mustard.jpg']",
  'hand-burnished-oxblood-shikari-sandal': "['/assets/images/products/peshawari_mustard.jpg']",
  'matte-black-norozi-tyre-sole-chappal': "['/assets/images/products/kaptaan_black.jpg']",
  'embroidered-gold-zardozi-khussa-slippers': "['/assets/images/products/peshawari_mustard.jpg']",
  'camel-leather-hand-carved-peshawari-sandal': "['/assets/images/products/peshawari_mustard.jpg']",

  'oud-al-afridi-extrait-de-parfum': "['/assets/images/products/oud_al_afridi.jpg']",
  'ruh-gulab-taif-rose-attar': "['/assets/images/products/oud_al_afridi.jpg']",
  'ambergris-royale-pure-parfum': "['/assets/images/products/oud_al_afridi.jpg']",
  'dehn-al-oud-cambodi-aged-reserve': "['/assets/images/products/oud_al_afridi.jpg']",
  'white-musk-sandalwood-elixir': "['/assets/images/products/oud_al_afridi.jpg']",
  'smoked-bakhoor-frankincense-bricks': "['/assets/images/products/brass_mabkhara.jpg']",

  'mughal-brass-jewelry-casket': "['/assets/images/products/brass_mabkhara.jpg']",
  'engraved-damascus-steel-brass-cufflinks': "['/assets/images/products/lapis_tasbih.jpg']",
  'full-grain-cowhide-heirloom-document-folio': "['/assets/images/products/leather_folio.jpg']",
  'lapis-lazuli-antique-silver-prayer-beads': "['/assets/images/products/lapis_tasbih.jpg']",
  'hand-chiseled-brass-incense-burner-mabkhara': "['/assets/images/products/brass_mabkhara.jpg']",
  'hand-embroidered-raw-silk-turban-kulla': "['/assets/images/products/peshawari_kulla.jpg']"
};

for (const [slug, imgArrayStr] of Object.entries(imageMappings)) {
  // Regex to find the product block with this slug and replace its images array
  const regex = new RegExp(`(slug:\\s*['"]${slug}['"][\\s\\S]*?images:\\s*\\[)[\\s\\S]*?(\\])`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `$1\n          ${imgArrayStr.slice(1, -1)}\n        $2`);
    console.log(`Updated images in seedData.js for ${slug}`);
  } else {
    console.log(`Could not find regex match for ${slug}`);
  }
}

fs.writeFileSync(seedFilePath, content, 'utf8');
console.log('Finished updating backend/utils/seedData.js');
