import React from 'react';
import { features } from '../../data';

const FeaturesSecond = () => {
  return (
    <section className='py-16 bg-gray-50'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col lg:flex-row-reverse items-center gap-12'>
          {/* Features Image */}
          <div className='flex-1'>
            <img
              src={features.feature2.image}
              alt='Features'
              className='w-full h-auto rounded-lg shadow-lg'
            />
          </div>

          {/* Features Content */}
          <div className='flex-1'>
            <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
              {features.feature2.title}
            </h2>
            <p className='text-lg text-gray-600'>
              {features.feature2.subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSecond;



