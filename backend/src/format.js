'use strict';
function serializeProduct(p) {
  const x = typeof p.toObject === 'function' ? p.toObject() : p;
  return {
    id: x.legacyId || String(x._id),
    databaseId: String(x._id), sku:x.sku, slug:x.slug,
    name:x.name, category:x.category, subcategory:x.subcategory,
    description:x.description, details:x.details,
    price: x.priceCents / 100,
    originalPrice: x.originalPriceCents == null ? undefined : x.originalPriceCents / 100,
    priceCents:x.priceCents, originalPriceCents:x.originalPriceCents,
    currency:'PEN', stock: x.stockQty > 0, stockQty:x.stockQty,
    image:x.image, gallery:x.gallery, fallback:x.image,
    isOffer:x.isOffer, isNew:x.isNew, isBestseller:x.isBestseller,
    rating:x.rating || 0, reviewCount:x.reviewCount || 0,
    reviews:[], active:x.active, createdAt:x.createdAt,updatedAt:x.updatedAt
  };
}
function waLink(number, message='Hola, te escribo desde Cazana Store.') {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
module.exports = { serializeProduct, waLink };
