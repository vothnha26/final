import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper';
import api from '../../api';
import productHelpers from '../../utils/productHelpers';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const TestimonialSlider = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTestimonials = async () => {
      setIsLoading(true);
      try {
        // Try to fetch recent reviews for some products to use as testimonials
        // We'll fetch top-selling products, then fetch one review for each
        const resp = await api.get('/api/v1/bao-cao-thong-ke/san-pham-ban-chay?limit=4');
        const data = resp?.data ?? resp;
        const rows = (data && data.sanPhamBanChay) || (data && data.rows) || [];
        const result = [];
        for (const r of rows) {
          const productId = r.maBienThe ?? r.maBienThe ?? r.maSanPham ?? r.id;
          if (!productId) continue;
          try {
            const rev = await api.get(`/api/v1/reviews/product/${productId}`);
            const revData = rev?.data ?? rev;
            const first = Array.isArray(revData) ? revData[0] : (revData && Array.isArray(revData.items) ? revData.items[0] : null);
            if (first) {
              result.push({
                avatar: first.avatar ?? null,
                name: first.name ?? first.ten ?? 'Khách hàng',
                occupation: first.occupation ?? first.role ?? '',
                message: first.message ?? first.noiDung ?? first.comment ?? first.content ?? first.nd ?? ''
              });
            }
          } catch (e) {
            // ignore individual review fetch errors
          }
        }
        if (mounted && result.length > 0) setItems(result);
      } catch (e) {

      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchTestimonials();
    return () => { mounted = false; };
  }, []);

  // If we couldn't fetch dynamic testimonials, show a simple fallback message
  const hasItems = items && items.length > 0;

  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            What people are saying about us
          </h2>
        </div>

        <div className='flex flex-col lg:flex-row items-center gap-12'>
          <div className='flex-1 flex items-center justify-center'>
            <div className='w-full max-w-md h-44 bg-gray-100 rounded-lg' />
          </div>

          <div className='flex-1'>
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={30}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              className='testimonialSlider'
            >
              {isLoading ? (
                <SwiperSlide>
                  <div className='bg-gray-50 p-6 rounded-lg text-center'>Loading...</div>
                </SwiperSlide>
              ) : !hasItems ? (
                <SwiperSlide>
                  <div className='bg-gray-50 p-6 rounded-lg'>
                    <div className='flex items-center gap-4 mb-4'>
                      <div className='w-12 h-12 rounded-full bg-gray-300' />
                      <div>
                        <h4 className='font-semibold text-gray-900'>Josh Smith</h4>
                        <p className='text-gray-600 text-sm'>Manager of The New York Times</p>
                      </div>
                    </div>
                    <p className='text-gray-700 italic'>
                      “They are have a perfect touch for make something so professional ,interest and useful for a lot of people .”
                    </p>
                  </div>
                </SwiperSlide>
              ) : (
                items.map((person, idx) => (
                  <SwiperSlide key={idx}>
                    <div className='bg-gray-50 p-6 rounded-lg'>
                      <div className='flex items-center gap-4 mb-4'>
                        {(() => {
                          const a = productHelpers.resolveImageUrl(person.avatar);
                          return a ? (
                            <img src={a} alt={person.name} className='w-12 h-12 rounded-full' />
                          ) : (
                            <div className='w-12 h-12 rounded-full bg-gray-300' />
                          );
                        })()}
                        <div>
                          <h4 className='font-semibold text-gray-900'>{person.name}</h4>
                          <p className='text-gray-600 text-sm'>{person.occupation}</p>
                        </div>
                      </div>
                      <p className='text-gray-700 italic'>
                        {person.message}
                      </p>
                    </div>
                  </SwiperSlide>
                ))
              )}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSlider;



