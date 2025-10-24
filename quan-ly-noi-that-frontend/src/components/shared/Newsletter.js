import React from 'react';
import { newsletter } from '../../data';

const Newsletter = () => {
  return (
    <section className='py-16 bg-primary'>
      <div className='container mx-auto px-4'>
        <div className='text-center text-white'>
          <h2 className='text-3xl lg:text-4xl font-bold mb-4'>
            {newsletter.title}
          </h2>
          <p className='text-lg mb-8 opacity-90'>
            {newsletter.subtitle}
          </p>
          
          <div className='max-w-md mx-auto flex gap-4'>
            <input
              type='email'
              placeholder={newsletter.placeholder}
              className='flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white'
            />
            <button className='bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300'>
              {newsletter.buttonText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;



