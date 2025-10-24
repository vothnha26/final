import React from 'react';
import { IoCart, IoTrash, IoAdd, IoRemove, IoArrowForward } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';

const CustomerCart = () => {
  const { items: cartItems, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCart();

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <IoCart className="mx-auto h-24 w-24 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng trống</h2>
          <p className="text-gray-600 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <Link
            to="/shop"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
          <p className="text-gray-600 mt-2">{getTotalItems()} sản phẩm</p>
        </div>

        {/* no local error state - errors handled by CartContext/provider or global UI */}

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Cart Items */}
          <div className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <div key={item.variantId ?? item.id} className="p-6 flex items-center">
                <img
                  src={item.image || '/placeholder-product.jpg'}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-lg mr-4"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{item.displayName || item.name}</h3>
                  <p className="text-gray-600">{item.price?.toLocaleString('vi-VN')}₫</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.variantId ?? item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-50"
                    >
                      <IoRemove className="h-4 w-4" />
                    </button>
                    <span className="px-4 py-2 text-center min-w-[3rem]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId ?? item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-50"
                    >
                      <IoAdd className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId ?? item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <IoTrash className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-900">Tổng cộng:</span>
              <span className="text-2xl font-bold text-primary">
                {getTotalPrice().toLocaleString('vi-VN')}₫
              </span>
            </div>
            <Link
              to="/checkout"
              className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Tiến hành thanh toán</span>
              <IoArrowForward className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCart;