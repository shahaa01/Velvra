const fs = require('fs');
const path = require('path');
const dataPath = path.join(__dirname, 'data.js');

// Read the file content
let fileContent = fs.readFileSync(dataPath, 'utf8');

// Extract the dummyProducts array using a robust approach
const start = fileContent.indexOf('const dummyProducts =') + 'const dummyProducts ='.length;
const end = fileContent.indexOf('module.exports = dummyProducts;');
if (start === -1 || end === -1) {
  console.error('Could not find dummyProducts array in data.js');
  process.exit(1);
}
let arrayString = fileContent.substring(start, end).trim();
if (arrayString.endsWith(';')) arrayString = arrayString.slice(0, -1);

let dummyProducts;
try {
  dummyProducts = JSON.parse(arrayString);
} catch (e) {
  console.error('Error parsing dummyProducts array:', e);
  process.exit(1);
}

// New image URLs for the first 20 products
const newImages = [
  [
    'https://www.tamaraindl.com/cdn/shop/products/tamara-ivory-chanderi-silk-kurta-set-3.jpg',
    'https://www.tamaraindl.com/cdn/shop/products/tamara-ivory-chanderi-silk-kurta-set-5.jpg',
    'https://www.tamaraindl.com/cdn/shop/products/tamara-ivory-chanderi-silk-kurta-set-4.jpg'
  ],
  [
    'https://assets.ajio.com/medias/sys_master/root/20230624/eFhJ/649666f2a9b42d15c9f131a1/-473Wx593H-465566782-green-MODEL.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20230624/3P0m/649666f2a9b42d15c9f131a9/-473Wx593H-465566782-green-OUTFIT.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20230624/5g2r/649666f4d55b7d0c638c4d57/-473Wx593H-465566782-green-DETAIL.jpg'
  ],
  [
    'https://images.meenaa.com/uploads/product/1701326442340-1.JPG',
    'https://images.meenaa.com/uploads/product/1701326442341-2.JPG',
    'https://images.meenaa.com/uploads/product/1701326442341-3.JPG'
  ],
  [
    'https://www.theloom.in/cdn/shop/products/LSTL65_1.jpg',
    'https://www.theloom.in/cdn/shop/products/LSTL65_2.jpg',
    'https://www.theloom.in/cdn/shop/products/LSTL65_3.jpg'
  ],
  [
    'https://www.libas.in/cdn/shop/products/yellow-floral-printed-cotton-top-libas-1.jpg',
    'https://www.libas.in/cdn/shop/products/yellow-floral-printed-cotton-top-libas-3.jpg',
    'https://www.libas.in/cdn/shop/products/yellow-floral-printed-cotton-top-libas-5.jpg'
  ],
  [
    'https://www.fablestreet.com/cdn/shop/products/Trousers-Olive-Green-Linen-Front-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/products/Trousers-Olive-Green-Linen-Side-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/products/Trousers-Olive-Green-Linen-Back-fablestreet.jpg'
  ],
  [
    'https://globalrepublic.in/cdn/shop/products/1_3e08f65f-7f78-43da-a2a4-b97c00e12154.jpg',
    'https://globalrepublic.in/cdn/shop/products/2_583a2d59-26d9-43c2-aa9d-ff45b98f26ab.jpg',
    'https://globalrepublic.in/cdn/shop/products/4_a9657ed9-38fc-4351-ad09-0268ec396d29.jpg'
  ],
  [
    'https://www.gulahmedshop.com/media/catalog/product/c/h/chn-23-45_1__1.jpg',
    'https://www.gulahmedshop.com/media/catalog/product/c/h/chn-23-45_2__1.jpg',
    'https://www.gulahmedshop.com/media/catalog/product/c/h/chn-23-45_4__1.jpg'
  ],
  [
    'https://www.marksandspencer.in/media/asset/T/5/T52_2738_F0_IS.jpg',
    'https://www.marksandspencer.in/media/asset/T/5/T52_2738_F0_OF_EC_0.jpg',
    'https://www.marksandspencer.in/media/asset/T/5/T52_2738_F0_FL_X.jpg'
  ],
  [
    'https://assets.ajio.com/medias/sys_master/root/20231123/R99Q/655f865fddf7791519a86842/-473Wx593H-466831037-gold-MODEL.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20231123/z9N5/655f865fddf7791519a86846/-473Wx593H-466831037-gold-OUTFIT.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20231123/PqGz/655f865fddf7791519a86847/-473Wx593H-466831037-gold-DETAIL3.jpg'
  ],
  [
    'https://www.nykaafashion.com/beauty-admin/pub/media/catalog/product/a/4/a414073MAN-SK005-2_1.jpg',
    'https://www.nykaafashion.com/beauty-admin/pub/media/catalog/product/a/4/a414073MAN-SK005-2_2.jpg',
    'https://www.nykaafashion.com/beauty-admin/pub/media/catalog/product/a/4/a414073MAN-SK005-2_3.jpg'
  ],
  [
    'https://www.marksandspencer.in/media/asset/T/4/T49_4323_E4_IS.jpg',
    'https://www.marksandspencer.in/media/asset/T/4/T49_4323_E4_OF_EC_0.jpg',
    'https://www.marksandspencer.in/media/asset/T/4/T49_4323_E4_BK_X.jpg'
  ],
  [
    'https://www.kalkifashion.com/images/Product/kurta-set-in-mustard-yellow-with-floral-print-and-gota-patti-work-in-chanderi-silk-Product-125032-1.jpg',
    'https://www.kalkifashion.com/images/Product/kurta-set-in-mustard-yellow-with-floral-print-and-gota-patti-work-in-chanderi-silk-Product-125032-3.jpg',
    'https://www.kalkifashion.com/images/Product/kurta-set-in-mustard-yellow-with-floral-print-and-gota-patti-work-in-chanderi-silk-Product-125032-2.jpg'
  ],
  [
    'https://ahujasons.com/cdn/shop/files/1_d28c2e6f-4099-4670-af25-4c0ef8542c33.jpg',
    'https://ahujasons.com/cdn/shop/files/2_88e02c61-46ab-4f24-954f-a9b74070a29a.jpg',
    'https://ahujasons.com/cdn/shop/files/4_65debf88-d64e-4f34-ac06-724490796328.jpg'
  ],
  [
    'https://www.fablestreet.com/cdn/shop/files/Jumpsuit-Khaki-Linen-Front-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/files/Jumpsuit-Khaki-Linen-Side-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/files/Jumpsuit-Khaki-Linen-Back-fablestreet.jpg'
  ],
  [
    'https://www.kalkifashion.com/images/Product/maroon-velvet-blouse-with-zardosi-embroidery-in-floral-design-Product-58253-1.jpg',
    'https://www.kalkifashion.com/images/Product/maroon-velvet-blouse-with-zardosi-embroidery-in-floral-design-Product-58253-3.jpg',
    'https://www.kalkifashion.com/images/Product/maroon-velvet-blouse-with-zardosi-embroidery-in-floral-design-Product-58253-4.jpg'
  ],
  [
    'https://www.theloom.in/cdn/shop/products/TBCS621_1.jpg',
    'https://www.theloom.in/cdn/shop/products/TBCS621_2.jpg',
    'https://www.theloom.in/cdn/shop/products/TBCS621_4.jpg'
  ],
  [
    'https://prod-img.thesouledstore.com/public/theSoul/uploads/catalog/product/1691688647_1478170.jpg',
    'https://prod-img.thesouledstore.com/public/theSoul/uploads/catalog/product/1691688647_6782800.jpg',
    'https://prod-img.thesouledstore.com/public/theSoul/uploads/catalog/product/1691688647_4576392.jpg'
  ],
  [
    'https://www.libas.in/cdn/shop/files/green-georgette-solid-wrap-dress-libas-1.jpg',
    'https://www.libas.in/cdn/shop/files/green-georgette-solid-wrap-dress-libas-3.jpg',
    'https://www.libas.in/cdn/shop/files/green-georgette-solid-wrap-dress-libas-4.jpg'
  ],
  [
    'https://www.fablestreet.com/cdn/shop/files/Sweater-Beige-Acrylic-Front-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/files/Sweater-Beige-Acrylic-Side-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/files/Sweater-Beige-Acrylic-Back-fablestreet.jpg'
  ]
];

const newColorImages = [
  [
    'https://www.tamaraindl.com/cdn/shop/products/tamara-ivory-chanderi-silk-kurta-set-3.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20230623/k12j/6495b54242f9e729d7845892/-473Wx593H-465495379-black-MODEL.jpg'
  ],
  [
    'https://assets.ajio.com/medias/sys_master/root/20230624/eFhJ/649666f2a9b42d15c9f131a1/-473Wx593H-465566782-green-MODEL.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20230526/w4Oa/6470d061d55b7d0c634c4424/-473Wx593H-466222561-purple-MODEL.jpg'
  ],
  [
    'https://images.meenaa.com/uploads/product/1701326442340-1.JPG',
    'https://images.meenaa.com/uploads/product/1701326307996-1.JPG'
  ],
  [
    'https://www.theloom.in/cdn/shop/products/LSTL65_1.jpg',
    'https://www.theloom.in/cdn/shop/products/LST-L64_1.jpg'
  ],
  [
    'https://www.libas.in/cdn/shop/products/yellow-floral-printed-cotton-top-libas-1.jpg',
    'https://www.libas.in/cdn/shop/files/blue-floral-printed-cotton-top-libas-1.jpg'
  ],
  [
    'https://www.fablestreet.com/cdn/shop/products/Trousers-Olive-Green-Linen-Front-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/products/Trouser-Wine-Poly-Viscose-Front-fablestreet.jpg'
  ],
  [
    'https://globalrepublic.in/cdn/shop/products/1_3e08f65f-7f78-43da-a2a4-b97c00e12154.jpg',
    'https://www.thehouseofrare.com/cdn/shop/files/RARE-RABBIT_2224-HDR-1323_1800x1800.jpg'
  ],
  [
    'https://www.gulahmedshop.com/media/catalog/product/c/h/chn-23-45_1__1.jpg',
    'https://www.gulahmedshop.com/media/catalog/product/s/p/spw-23-28_1__1.jpg'
  ],
  [
    'https://www.marksandspencer.in/media/asset/T/5/T52_2738_F0_IS.jpg',
    'https://www.marksandspencer.in/media/asset/T/5/T52_2738_P6_IS.jpg'
  ],
  [
    'https://assets.ajio.com/medias/sys_master/root/20231123/R99Q/655f865fddf7791519a86842/-473Wx593H-466831037-gold-MODEL.jpg',
    'https://assets.ajio.com/medias/sys_master/root/20230623/B5G5/6495b22142f9e729d783de6f/-473Wx593H-464930600-maroon-MODEL.jpg'
  ],
  [
    'https://www.nykaafashion.com/beauty-admin/pub/media/catalog/product/a/4/a414073MAN-SK005-2_1.jpg',
    'https://www.nykaafashion.com/beauty-admin/pub/media/catalog/product/d/f/dfb8b4dMAN-SK006-1_1.jpg'
  ],
  [
    'https://www.marksandspencer.in/media/asset/T/4/T49_4323_E4_IS.jpg',
    'https://www.marksandspencer.in/media/asset/T/4/T49_4323_Q8_IS.jpg'
  ],
  [
    'https://www.kalkifashion.com/images/Product/kurta-set-in-mustard-yellow-with-floral-print-and-gota-patti-work-in-chanderi-silk-Product-125032-1.jpg',
    'https://www.kalkifashion.com/images/Product/rani-pink-anarkali-suit-in-chanderi-silk-with-gota-patti-work-Product-125026-1.jpg'
  ],
  [
    'https://ahujasons.com/cdn/shop/files/1_d28c2e6f-4099-4670-af25-4c0ef8542c33.jpg',
    'https://ahujasons.com/cdn/shop/files/1_7e3cdb97-2a81-4340-8bce-d2f6233d45e4.jpg'
  ],
  [
    'https://www.fablestreet.com/cdn/shop/files/Jumpsuit-Khaki-Linen-Front-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/files/Jumpsuit-Black-Linen-Front-fablestreet.jpg'
  ],
  [
    'https://www.kalkifashion.com/images/Product/maroon-velvet-blouse-with-zardosi-embroidery-in-floral-design-Product-58253-1.jpg',
    'https://www.kalkifashion.com/images/Product/bottle-green-blouse-in-velvet-with-embroidered-V-neckline-Product-98016-1.jpg'
  ],
  [
    'https://www.theloom.in/cdn/shop/products/TBCS621_1.jpg',
    'https://www.theloom.in/cdn/shop/products/SEW372_1.jpg'
  ],
  [
    'https://prod-img.thesouledstore.com/public/theSoul/uploads/catalog/product/1691688647_1478170.jpg',
    'https://prod-img.thesouledstore.com/public/theSoul/uploads/catalog/product/1684497645_8803509.jpg'
  ],
  [
    'https://www.libas.in/cdn/shop/files/green-georgette-solid-wrap-dress-libas-1.jpg',
    'https://www.libas.in/cdn/shop/files/blue-georgette-solid-wrap-dress-libas-1.jpg'
  ],
  [
    'https://www.fablestreet.com/cdn/shop/files/Sweater-Beige-Acrylic-Front-fablestreet.jpg',
    'https://www.fablestreet.com/cdn/shop/files/Sweater-Lilac-Acrylic-Front-fablestreet.jpg'
  ]
];

// Replace images and colors.imageUrl for the first 20 products
for (let i = 0; i < 20 && i < dummyProducts.length; i++) {
  dummyProducts[i].images = newImages[i];
  if (dummyProducts[i].colors && Array.isArray(dummyProducts[i].colors)) {
    for (let j = 0; j < dummyProducts[i].colors.length && j < newColorImages[i].length; j++) {
      dummyProducts[i].colors[j].imageUrl = newColorImages[i][j];
    }
  }
}

// Write back to data.js
const output =
  "const { ObjectId } = require('mongodb');\n\n" +
  "const dummyProducts = " + JSON.stringify(dummyProducts, null, 2) + ";\n\nmodule.exports = dummyProducts;\n";
fs.writeFileSync(dataPath, output);
console.log('✅ Updated images and color imageUrls for the first 20 products in data.js'); 