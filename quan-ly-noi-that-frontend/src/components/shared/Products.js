import React from 'react';
import { navigationLinks, footerData, heroData } from '../../data';

const Products = () => {
  return (
    <section className='py-16 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            {products.title}
          </h2>
          <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
            {products.subtitle}
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {products.pages[0].productList.slice(0, 8).map((product, index) => (
            <div key={index} className='bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition-shadow duration-300'>
              <div className='relative overflow-hidden'>
                <img
                  src={product.image}
                  alt={product.name}
                  className='w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300'
                />
                <button className='absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  {product.icon}
                </button>
              </div>
              <div className='p-4'>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                  {product.name}
                </h3>
                <div className='flex items-center gap-2'>
                  <span className='text-xl font-bold text-primary'>
                    ${product.price}
                  </span>
                  <span className='text-gray-500 line-through'>
                    ${product.oldPrice}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;



