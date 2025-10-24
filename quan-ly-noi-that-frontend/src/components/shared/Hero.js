import React from 'react';
import { hero } from '../../data';
import HeroBg from '../../assets/img/hero-bg.png';

const Hero = () => {
  return (
    <section className='min-h-[90vh] py-12 lg:py-24 bg-gradient-to-br from-orange-50 to-orange-100'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col lg:flex-row items-center justify-between gap-8'>
          {/* Hero Content */}
          <div className='flex-1 text-center lg:text-left'>
            <h1 className='text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight'>
              {hero.title}
            </h1>
            <p className='text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0'>
              {hero.subtitle}
            </p>
            <button className='bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-lg'>
              {hero.buttonText}
            </button>
          </div>

          {/* Hero Image */}
          <div className='flex-1 flex justify-center lg:justify-end'>
            <div className='relative'>
              <img
                src={HeroBg}
                alt='Furniture'
                className='w-full max-w-lg h-auto rounded-lg shadow-2xl'
              />
              <div className='absolute -top-4 -right-4 w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg'>
                50%
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;



