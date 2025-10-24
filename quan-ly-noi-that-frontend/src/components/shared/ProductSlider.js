import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper';
import api from '../../api';
import productHelpers from '../../utils/productHelpers';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const ProductSlider = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchTop = async () => {
      setIsLoading(true);
      try {
        // Use reports endpoint for top-selling products
        const resp = await api.get('/api/v1/bao-cao-thong-ke/san-pham-ban-chay?limit=8');
        const data = resp?.data ?? resp;
        const rows = (data && data.sanPhamBanChay) || (data && data.rows) || [];
        // rows are objects with maBienThe, tenSanPham, sku, tongSoLuongBan, tongDoanhThu
        const mapped = rows.map(r => ({
          id: r.maBienThe ?? r.id,
          name: r.tenSanPham ?? r.name ?? r.ten ?? 'Sản phẩm',
          price: r.tongDoanhThu ?? 0,
          image: null,
        }));
        if (mounted) setItems(mapped);
      } catch (e) {
        console.error('ProductSlider fetch error', e);
        if (mounted) setError(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchTop();
    return () => { mounted = false; };
  }, []);

  return (
    <section className='py-16 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            All Products
          </h2>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            The products we provide only for you as our service are selected from the best products with number 1 quality in the world
          </p>
        </div>

        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={30}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 }
          }}
          className='productSlider'
        >
          {isLoading ? (
            <SwiperSlide>
              <div className='text-center py-12'>Loading...</div>
            </SwiperSlide>
          ) : error ? (
            <SwiperSlide>
              <div className='text-center py-12 text-red-600'>Failed to load</div>
            </SwiperSlide>
          ) : (
            items.map((product) => (
              <SwiperSlide key={product.id}>
                <div className='bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300'>
                  <div className='relative overflow-hidden'>
                    {(() => {
                      const imgUrl = productHelpers.resolveImageUrl(product.image);
                      return imgUrl ? (
                        <img src={imgUrl} alt={product.name} className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300' />
                      ) : (
                        <div className='w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400'>No image</div>
                      );
                    })()}
                    <button className='absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                      {/* placeholder */}
                    </button>
                  </div>
                  <div className='p-4'>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                      {product.name}
                    </h3>
                    <div className='flex items-center gap-2'>
                      <span className='text-xl font-bold text-primary'>
                        {product.price ? `$${product.price}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))
          )}
        </Swiper>
      </div>
    </section>
  );
};

export default ProductSlider;



