import React from 'react';
import { stats } from '../../data';

const Stats = () => {
  return (
    <section className='py-16 bg-white'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          {stats.map((stat, index) => (
            <div key={index} className='text-center'>
              <div className='text-4xl md:text-5xl font-bold text-primary mb-2'>
                {stat.value}
              </div>
              <div className='text-gray-600 font-medium'>
                {stat.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;



