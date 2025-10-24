import React from 'react';
import { navigation } from '../../data';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NavMobile = ({ isOpen, setIsOpen }) => {
  const auth = useAuth();
  const isLoggedIn = !!auth?.isAuthenticated;
  const navigate = useNavigate();

  const onNavigate = (href) => {
    try {
      const name = String(href || '').toLowerCase();
      if (name === 'collections' || href === 'collections') {
        navigate('/shop/collections');
      } else if (href && href.startsWith('#')) {
        // anchor in page
        navigate(href.slice(1));
      } else if (href) {
        navigate(href);
      }
    } catch (e) {
      navigate('/');
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div
      aria-hidden={!isOpen}
      className={`${
        isOpen ? 'right-0 pointer-events-auto' : '-right-full pointer-events-none'
      } fixed top-0 bottom-0 w-64 bg-white shadow-2xl transition-all duration-300 z-50`}
    >
      <div className='flex flex-col h-full'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b'>
          <div className='text-xl font-bold text-primary'>FurniShop</div>
          <button
            onClick={() => setIsOpen(false)}
            className='text-gray-600 hover:text-primary'
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav className='flex-1 p-4'>
          <ul className='space-y-4'>
            {navigation.map((item, index) => (
              <li key={index}>
                <button
                  className='block py-2 text-left w-full text-gray-700 hover:text-primary transition-colors duration-300'
                  onClick={() => onNavigate(item.href)}
                >
                  {item.name}
                </button>
              </li>
            ))}

            {/* Auth links at bottom of nav */}
            <li>
              {!isLoggedIn ? (
                <div className='space-y-2'>
                  <button onClick={() => onNavigate('/login')} className='w-full text-left py-2 text-gray-700 hover:text-primary'>Đăng nhập</button>
                  <button onClick={() => onNavigate('/register')} className='w-full text-left py-2 text-gray-700 hover:text-primary'>Đăng ký</button>
                </div>
              ) : (
                <div className='space-y-2'>
                  <button onClick={() => onNavigate('/profile')} className='w-full text-left py-2 text-gray-700 hover:text-primary'>Tài khoản</button>
                  <button onClick={() => { try { auth.logout && auth.logout(); } catch(e){} onNavigate('/'); }} className='w-full text-left py-2 text-gray-700 hover:text-primary'>Đăng xuất</button>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default NavMobile;



