import React from 'react';
import { Link } from 'react-router-dom';

const CollectionsSidebar = ({ collections = [], activeId }) => {
  return (
    <aside className="w-64 hidden lg:block">
      <div className="sticky top-20">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="text-lg font-semibold mb-3">Bộ sưu tập</h4>
          <ul className="space-y-2">
            {collections.map(col => (
              <li key={col.maBoSuuTap ?? col.id}>
                <Link
                  to={`/shop/collections/${col.maBoSuuTap ?? col.id}`}
                  className={`block px-3 py-2 rounded-md ${String(col.maBoSuuTap ?? col.id) === String(activeId) ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {col.tenBoSuuTap || col.name}
                </Link>
              </li>
            ))}
            {collections.length === 0 && (
              <li className="text-sm text-gray-500">Không có bộ sưu tập nào.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default CollectionsSidebar;
