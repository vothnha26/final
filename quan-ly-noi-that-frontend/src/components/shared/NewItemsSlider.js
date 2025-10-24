import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper';
import api from '../../api';
import productHelpers from '../../utils/productHelpers';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const NewItemsSlider = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchNew = async () => {
      setIsLoading(true);
      try {
        const resp = await api.get('/api/products/shop?size=8');
        const data = resp?.data ?? resp;
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.content)) arr = data.content;
        else if (Array.isArray(data.items)) arr = data.items;

        const mapped = arr.map(p => productHelpers.mapProductFromApi(p));
        if (mounted) setItems(mapped);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchNew();
    return () => { mounted = false; };
  }, []);

  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            New In Store Now
          </h2>
          <p className='text-lg text-gray-600 mb-8'>
            Get the latest items immediately with promo prices
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
          className='newItemsSlider'
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
                <div className='text-center group cursor-pointer'>
                  <div className='bg-gray-100 rounded-lg p-6 mb-4 group-hover:bg-primary/10 transition-colors duration-300'>
                    {(() => {
                      const imgUrl = productHelpers.resolveImageUrl(product.image);
                      return imgUrl ? (
                        <img src={imgUrl} alt={product.name} className='w-full h-32 object-contain mx-auto' />
                      ) : (
                        <div className='w-full h-32 flex items-center justify-center text-gray-400'>No image</div>
                      );
                    })()}
                  </div>
                  <h3 className='text-lg font-semibold text-gray-900 capitalize'>
                    {product.name}
                  </h3>
                </div>
              </SwiperSlide>
            ))
          )}
        </Swiper>

        <div className='text-center mt-8'>
          <a
            href='/shop'
            className='inline-flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors duration-300'
          >
            Check all
          </a>
        </div>
      </div>
    </section>
  );
};

export default NewItemsSlider;



