import React from 'react';
import { navigationLinks, footerData, heroData } from '../../data';

const Testimonial = () => {
  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            {testimonial.title}
          </h2>
        </div>

        <div className='flex flex-col lg:flex-row items-center gap-12'>
          {/* Testimonial Image */}
          <div className='flex-1'>
            <img
              src={testimonial.image}
              alt='Testimonial'
              className='w-full h-auto rounded-lg shadow-lg'
            />
          </div>

          {/* Testimonials */}
          <div className='flex-1'>
            <div className='space-y-8'>
              {testimonial.persons.map((person, index) => (
                <div key={index} className='bg-gray-50 p-6 rounded-lg'>
                  <div className='flex items-center gap-4 mb-4'>
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className='w-12 h-12 rounded-full'
                    />
                    <div>
                      <h4 className='font-semibold text-gray-900'>
                        {person.name}
                      </h4>
                      <p className='text-gray-600 text-sm'>
                        {person.occupation}
                      </p>
                    </div>
                  </div>
                  <p className='text-gray-700 italic'>
                    {person.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;



