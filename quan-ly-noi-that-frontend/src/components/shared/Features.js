import React from 'react';
import { features } from '../../data';

const Features = () => {
  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col lg:flex-row items-center gap-12'>
          {/* Features Image */}
          <div className='flex-1'>
            <img
              src={features.image}
              alt='Features'
              className='w-full h-auto rounded-lg shadow-lg'
            />
          </div>

          {/* Features Content */}
          <div className='flex-1'>
            <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
              {features.title}
            </h2>
            <p className='text-lg text-gray-600 mb-8'>
              {features.subtitle}
            </p>
            
            {/* Features List */}
            <div className='space-y-6 mb-8'>
              {features.items.map((item, index) => (
                <div key={index} className='flex items-start gap-4'>
                  <div className='text-primary text-2xl mt-1'>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>
                      {item.title}
                    </h3>
                    <p className='text-gray-600'>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button className='bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-lg'>
              {features.buttonText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;



