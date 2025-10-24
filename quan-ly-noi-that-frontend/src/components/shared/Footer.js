import React from 'react';
import { footer } from '../../data';

const Footer = () => {
  return (
    <footer className='bg-gray-900 text-white py-12'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col md:flex-row justify-between items-center gap-8'>
          {/* Logo */}
          <div className='text-2xl font-bold'>
            FurniShop
          </div>

          {/* Social Links */}
          <div className='flex items-center gap-4'>
            {footer.social.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className='text-2xl hover:text-primary transition-colors duration-300'
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className='border-t border-gray-700 mt-8 pt-8 text-center text-gray-400'>
          <p>{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



