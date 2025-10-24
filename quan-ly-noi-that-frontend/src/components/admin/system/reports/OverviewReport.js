import React from 'react';
import { IoBarChart, IoPieChart, IoEye, IoWarning } from 'react-icons/io5';

const OverviewReport = ({
    salesData,
    productSales,
    customerStats,
    inventoryAlerts,
    totalRevenue,
    totalOrders,
    averageOrderValue,
    totalCustomers,
    formatCurrency,
    formatNumber,
    safeMax,
    safeMin,
    renderDayLabel,
    getStatusColor,
    getStatusText
}) => {
    return (
        <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <IoBarChart className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <IoBarChart className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <IoBarChart className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Giá trị đơn hàng TB</p>
                            <p className="text-2xl font-bold text-gray-900">{averageOrderValue ? formatCurrency(Math.round(averageOrderValue)) : '—'}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <IoBarChart className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Khách hàng mới</p>
                            <p className="text-2xl font-bold text-gray-900">{totalCustomers ?? '—'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Sales Trend Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Xu hướng doanh thu</h3>
                        <button className="text-blue-600 hover:text-blue-800">
                            <IoEye className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="h-64 flex items-end justify-between">
                        {salesData.map((day, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="bg-blue-500 rounded-t w-8 mb-2"
                                    style={{ height: `${((Number(day.revenue) || 0) / 35000000) * 200}px` }}
                                ></div>
                                <div className="text-xs text-gray-500">{renderDayLabel(day)}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Doanh thu cao nhất</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(safeMax(salesData, d => d.revenue))}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">Doanh thu thấp nhất</p>
                            <p className="font-semibold text-gray-900">{formatCurrency(safeMin(salesData, d => d.revenue))}</p>
                        </div>
                    </div>
                </div>

                {/* Product Sales List */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Bán hàng theo sản phẩm</h3>
                        <button className="text-blue-600 hover:text-blue-800">
                            <IoPieChart className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {productSales.map((product, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 mr-3"></div>
                                    <span className="text-sm text-gray-900">{product.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
                                    <p className="text-xs text-gray-500">{product.sales} đơn</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Customer Analysis and Inventory Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Phân tích khách hàng VIP</h3>
                    {customerStats.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <IoWarning className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>Chưa có dữ liệu khách hàng VIP</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {customerStats.map((stat, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{stat.level}</p>
                                        <p className="text-sm text-gray-600">{stat.count} khách hàng</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">{formatCurrency(stat.revenue)}</p>
                                        <p className="text-sm text-gray-500">
                                            {Math.round(((Number(stat.revenue) || 0) / Math.max(1, Number(totalRevenue || 0))) * 100)}% tổng doanh thu
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Cảnh báo tồn kho</h3>
                    {inventoryAlerts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <IoWarning className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                            <p>Chưa có cảnh báo tồn kho</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {inventoryAlerts.map((alert, index) => (
                                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{alert.product}</p>
                                        <p className="text-sm text-gray-600">Tồn: {alert.currentStock} | Tối thiểu: {alert.minStock}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                                            {getStatusText(alert.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default OverviewReport;
