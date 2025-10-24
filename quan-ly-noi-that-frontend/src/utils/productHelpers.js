import api from '../api';

// Helper: pick the best main image from a product DTO with many possible shapes
const tryArrayFirst = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const first = arr.find(x => x != null);
  if (!first) return null;
  if (typeof first === 'string') return first;
  return first.duongDanHinhAnh ?? first.url ?? first.path ?? first.src ?? first;
};

const pickMainImage = (p) => {
  if (!p) return null;
  let img = null;
  try {
    img = tryArrayFirst(p.hinhAnhs) || tryArrayFirst(p.danh_sach_hinh_anh) || tryArrayFirst(p.images) || tryArrayFirst(p.photos) || img;
    img = img || p.hinhAnh || p.image || p.coverImage || p.anhDaiDien || p.thumbnail || p.avatar || null;
    if (!img && p.hinhAnh && typeof p.hinhAnh === 'object') img = p.hinhAnh.duongDanHinhAnh ?? p.hinhAnh.url ?? null;
    if (!img && p.image && typeof p.image === 'object') img = p.image.url ?? p.image.path ?? null;

    const variants = p.bienTheList ?? p.bienThe ?? p.variants ?? [];
    if (!img && Array.isArray(variants)) {
      for (const v of variants) {
        if (!v) continue;
        const vImg = tryArrayFirst(v.hinhAnhs) || v.hinhAnh || v.image || (v.images && tryArrayFirst(v.images));
        if (vImg) { img = vImg; break; }
      }
    }
  } catch (e) {
    // ignore
  }
  return img || null;
};

export const resolveImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') {
    const s = img.trim();
    if (s === '/default-product.jpg' || s === 'default-product.jpg' || s === '/logo192.png' || s === 'logo192.png') return null;
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    return api.buildUrl(s);
  }
  if (img.duongDanHinhAnh) return resolveImageUrl(img.duongDanHinhAnh);
  return null;
};

export const mapProductFromApi = (product) => {
  const rawPrice = product.giaBan ?? product.gia ?? product.price ?? product.gia_ban ?? 0;
  const rawOriginal = product.giaGoc ?? product.gia_goc ?? product.originalPrice ?? 0;
  const price = Number(rawPrice) || 0;
  const originalPrice = Number(rawOriginal) || 0;

  const rawImage = pickMainImage(product);

  const rawDiscountPercent = product.phanTramGiamGia ?? product.discountPercent ?? null;
  const explicitDiscountPercent = rawDiscountPercent != null ? Number(rawDiscountPercent) || 0 : null;
  let lowestVariantOverall = null;
  let lowestVariantDiscounted = null;
  try {
    const rawVariants = product.bienTheList ?? product.bienThe ?? product.variants ?? [];
    if (Array.isArray(rawVariants) && rawVariants.length > 0) {
      rawVariants.forEach(v => {
        const vPrice = Number(v.giaBan ?? v.gia ?? v.price ?? v.priceAfterDiscount ?? 0) || 0;
        const vOriginal = Number((v.giaGoc ?? v.gia_goc ?? v.originalPrice ?? originalPrice) || 0) || 0;
        let vDiscountPercent = v.phanTramGiamGia ?? v.discountPercent ?? null;
        vDiscountPercent = vDiscountPercent != null ? Number(vDiscountPercent) || 0 : 0;
        if ((!v.phanTramGiamGia && !v.discountPercent) && vOriginal > 0 && vPrice < vOriginal) {
          vDiscountPercent = Math.round(((vOriginal - vPrice) / vOriginal) * 100);
        }
        const vDiscountAmount = vOriginal > 0 && vPrice < vOriginal ? (vOriginal - vPrice) : 0;
        const finalPrice = vPrice;

        if (!lowestVariantOverall || finalPrice < lowestVariantOverall.finalPrice) {
          lowestVariantOverall = {
            id: v.maBienThe ?? v.id ?? v.variantId,
            name: v.tenBienThe ?? v.ten ?? v.name ?? null,
            price: vPrice,
            originalPrice: vOriginal,
            discountPercent: vDiscountPercent > 0 ? vDiscountPercent : null,
            discountAmount: vDiscountAmount,
            finalPrice
          };
        }

        const hasVariantDiscount = vDiscountAmount > 0 || (vDiscountPercent && vDiscountPercent > 0) || Boolean(v.priceAfterDiscount) || (vPrice < vOriginal && vOriginal > 0);
        if (hasVariantDiscount) {
          if (!lowestVariantDiscounted || finalPrice < lowestVariantDiscounted.finalPrice) {
            lowestVariantDiscounted = {
              id: v.maBienThe ?? v.id ?? v.variantId,
              name: v.tenBienThe ?? v.ten ?? v.name ?? null,
              price: vPrice,
              originalPrice: vOriginal,
              discountPercent: vDiscountPercent > 0 ? vDiscountPercent : null,
              discountAmount: vDiscountAmount,
              finalPrice
            };
          }
        }
      });
    }
  } catch (e) {
    lowestVariantOverall = null;
    lowestVariantDiscounted = null;
  }

  let topLevelDiscountPercent = explicitDiscountPercent;
  let topLevelDiscountAmount = 0;
  if ((topLevelDiscountPercent == null || topLevelDiscountPercent === 0) && originalPrice > 0 && price < originalPrice) {
    topLevelDiscountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);
    topLevelDiscountAmount = Math.round(originalPrice - price);
  }

  const catObj = product.category && typeof product.category === 'object' ? product.category : (product.danhMuc && typeof product.danhMuc === 'object' ? product.danhMuc : null);
  const normalizedCategoryId = catObj ? (catObj.id ?? catObj.maDanhMuc ?? catObj.maDanhMuc ?? null) : (product.maDanhMuc ?? product.danhMucId ?? null);
  const normalizedCategoryName = catObj ? (catObj.name ?? catObj.tenDanhMuc ?? '') : (product.tenDanhMuc ?? product.category ?? '');

  const supObj = product.supplier && typeof product.supplier === 'object' ? product.supplier : (product.nhaCungCap && typeof product.nhaCungCap === 'object' ? product.nhaCungCap : null);
  const normalizedSupplierId = supObj ? (supObj.id ?? supObj.maNhaCungCap ?? null) : (product.maNhaCungCap ?? product.supplierId ?? null);
  const normalizedSupplierName = supObj ? (supObj.name ?? supObj.tenNhaCungCap ?? '') : (product.tenNhaCungCap ?? product.supplier ?? null);

  return {
    id: product.maSanPham ?? product.id ?? product.productId,
    name: product.tenSanPham ?? product.ten ?? product.name ?? 'Sản phẩm',
    categoryId: normalizedCategoryId,
    category: normalizedCategoryName,
    createdAt: product.ngayTao || product.ngayTaoSanPham || product.createdAt || product.addedDate || product.created_at || null,
    supplierId: normalizedSupplierId,
    supplier: normalizedSupplierName,
    price,
    originalPrice,
    rating: Number(product.averageRating ?? product.danhGia ?? product.rating ?? product.review ?? product.reviews ?? 0) || 0,
    reviews: Number(product.reviewCount ?? product.soLuotDanhGia ?? product.soLuongDanhGia ?? product.reviews ?? product.review ?? 0) || 0,
    image: rawImage || null,
    inStock: Number(product.stockQuantity ?? product.tonKho ?? product.soLuongTonKho ?? 0) > 0,
    stockCount: Number(product.stockQuantity ?? product.tonKho ?? product.soLuongTonKho ?? 0) || 0,
    description: product.moTa ?? product.description ?? '',
    variants: (product.bienTheList || product.bienThe || []).map(variant => ({
      id: variant.maBienThe ?? variant.id,
      name: variant.tenBienThe ?? variant.ten ?? variant.name,
      price: Number(variant.giaBan ?? variant.gia ?? variant.price) || 0,
      inStock: Number(variant.tonKho ?? variant.soLuong ?? 0) > 0
    })),
    lowestVariantId: lowestVariantOverall?.id ?? null,
    lowestVariantName: lowestVariantOverall?.name ?? null,
    lowestVariantPrice: lowestVariantOverall?.price ?? null,
    lowestVariantOriginalPrice: lowestVariantOverall?.originalPrice ?? null,
    lowestVariantDiscountPercent: lowestVariantDiscounted?.discountPercent ?? null,
    lowestVariantDiscountAmount: lowestVariantDiscounted?.discountAmount ?? 0,
    lowestVariantFinalPrice: lowestVariantDiscounted?.finalPrice ?? null,
    discount: Number(topLevelDiscountPercent ?? lowestVariantDiscounted?.discountPercent ?? 0) || 0,
    discountPercent: (topLevelDiscountPercent ?? lowestVariantDiscounted?.discountPercent) > 0 ? (topLevelDiscountPercent ?? lowestVariantDiscounted?.discountPercent) : null,
    discountAmount: lowestVariantDiscounted ? (lowestVariantDiscounted.discountAmount ?? 0) : (topLevelDiscountAmount && topLevelDiscountAmount > 0 ? topLevelDiscountAmount : 0),
    isOnSale: Boolean(lowestVariantDiscounted) || ((topLevelDiscountPercent != null) && topLevelDiscountPercent > 0)
  };
};

const helperExports = {
  mapProductFromApi,
  resolveImageUrl,
};

export default helperExports;
