import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../../../api';

// Small UI atoms
const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1 text-sm text-gray-700">
    <span className="font-medium">{label}</span>
    {children}
  </label>
);

const NumberInput = (props) => (
  <input
    type="number"
    className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
    {...props}
  />
);

const TextInput = (props) => (
  <input
    type="text"
    className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
    {...props}
  />
);

const Select = ({ options, ...rest }) => (
  <select
    className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-500"
    {...rest}
  >
    {options.map((op) => (
      <option key={op.value} value={op.value}>
        {op.label}
      </option>
    ))}
  </select>
);

// Simple horizontal bar list
const HBar = ({ items, labelKey, valueKey, valueFormat = (v) => v.toLocaleString(), maxWidth = 100, colors }) => {
  const maxVal = Math.max(1, ...items.map((x) => Number(x[valueKey]) || 0));
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, idx) => {
        const val = Number(it[valueKey]) || 0;
        const w = Math.max(1, Math.round((val / maxVal) * maxWidth));
        const color = colors && colors.length ? colors[idx % colors.length] : '#3b82f6';
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-48 truncate" title={String(it[labelKey])}>{it[labelKey]}</div>
            <div className="flex-1 bg-gray-100 rounded h-4">
              <div className="h-4 rounded" style={{ width: `${w}%`, backgroundColor: color }} />
            </div>
            <div className="w-28 text-right tabular-nums">{valueFormat(val)}</div>
          </div>
        );
      })}
    </div>
  );
};

// Donut chart (SVG)
const DonutChart = ({ items, labelKey, valueKey, size = 220, innerRatio = 0.6, colors }) => {
  const total = Math.max(1, items.reduce((s, it) => s + (Number(it[valueKey]) || 0), 0));
  const radius = size / 2;
  const innerR = radius * innerRatio;
  const palette = colors && colors.length ? colors : ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316','#a855f7','#22c55e'];
  let angle = -Math.PI / 2; // start at top
  const arcs = items.map((it, idx) => {
    const val = Number(it[valueKey]) || 0;
    const slice = (val / total) * Math.PI * 2;
    const start = angle;
    const end = angle + slice;
    angle = end;
    const largeArc = slice > Math.PI ? 1 : 0;
    const x0 = radius + Math.cos(start) * radius;
    const y0 = radius + Math.sin(start) * radius;
    const x1 = radius + Math.cos(end) * radius;
    const y1 = radius + Math.sin(end) * radius;
    const xi0 = radius + Math.cos(end) * innerR;
    const yi0 = radius + Math.sin(end) * innerR;
    const xi1 = radius + Math.cos(start) * innerR;
    const yi1 = radius + Math.sin(start) * innerR;
    const d = [
      `M ${x0} ${y0}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1}`,
      `L ${xi0} ${yi0}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
      'Z'
    ].join(' ');
    return { d, color: palette[idx % palette.length] };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => (
        <path key={i} d={a.d} fill={a.color} stroke="#fff" strokeWidth={1} />
      ))}
    </svg>
  );
};

// Line + Area chart (SVG)
const AreaLineChart = ({ data, xKey = 'ngay', yKey = 'doanh_thu', w = 900, h = 280, color = '#3b82f6' }) => {
  const padding = { left: 60, right: 40, top: 20, bottom: 50 };
  const sorted = [...data].sort((a, b) => new Date(a[xKey]) - new Date(b[xKey]));
  const xs = sorted.map((d) => new Date(d[xKey]).getTime());
  const ys = sorted.map((d) => Number(d[yKey]) || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(1, ...ys);
  
  const usableW = w - padding.left - padding.right;
  const usableH = h - padding.top - padding.bottom;
  
  const sx = (t) => padding.left + ((usableW) * (t - minX)) / Math.max(1, maxX - minX);
  const sy = (v) => padding.top + usableH - ((usableH) * v) / maxY;
  
  const line = sorted.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(new Date(d[xKey]).getTime())} ${sy(Number(d[yKey]) || 0)}`).join(' ');
  const area = `M ${sx(xs[0] || minX)} ${sy(0)} ` +
               sorted.map((d) => `L ${sx(new Date(d[xKey]).getTime())} ${sy(Number(d[yKey]) || 0)}`).join(' ') +
               ` L ${sx(xs[xs.length - 1] || maxX)} ${sy(0)} Z`;
  
  // Y-axis ticks
  const yTicks = 5;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxY / yTicks) * i);
  
  return (
    <svg width={w} height={h} className="overflow-visible border border-gray-200 rounded bg-white">
      {/* Grid lines */}
      {tickValues.map((val, i) => (
        <line key={i} x1={padding.left} y1={sy(val)} x2={w - padding.right} y2={sy(val)} stroke="#f3f4f6" strokeWidth="1" />
      ))}
      
      {/* Y-axis */}
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={h - padding.bottom} stroke="#d1d5db" strokeWidth="1" />
      
      {/* X-axis */}
      <line x1={padding.left} y1={h - padding.bottom} x2={w - padding.right} y2={h - padding.bottom} stroke="#d1d5db" strokeWidth="1" />
      
      {/* Y-axis labels */}
      {tickValues.map((val, i) => (
        <text key={i} x={padding.left - 8} y={sy(val)} textAnchor="end" dominantBaseline="middle" fontSize="11" className="fill-gray-600">
          {Math.round(val).toLocaleString('vi-VN')}
        </text>
      ))}
      
      {/* Data area and line */}
      <path d={area} fill={color} opacity={0.15} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" />
      
      {/* Data points */}
      {sorted.map((d, i) => (
        <circle 
          key={i} 
          cx={sx(new Date(d[xKey]).getTime())} 
          cy={sy(Number(d[yKey]) || 0)} 
          r="4" 
          fill={color} 
          stroke="white" 
          strokeWidth="2"
        />
      ))}
      
      {/* X-axis labels (dates) */}
      {sorted.map((d, i) => {
        if (sorted.length <= 10 || i % Math.ceil(sorted.length / 10) === 0 || i === sorted.length - 1) {
          const dateStr = new Date(d[xKey]).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' });
          return (
            <text 
              key={i} 
              x={sx(new Date(d[xKey]).getTime())} 
              y={h - padding.bottom + 20} 
              textAnchor="middle" 
              fontSize="10" 
              className="fill-gray-600"
            >
              {dateStr}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
};

// Grouped bar chart (two series per item) with optional axes and tooltips
// When fill is true, groups are evenly distributed across available width.
const GroupedBarChart = ({ items, labelKey, series, w = 800, h = 260, showAxes = false, yTicks = 4, yFormat, fill = true }) => {
  // Increase left padding so large numbers don't get clipped
  const padding = { left: showAxes ? 88 : 16, right: 16, top: 16, bottom: 48 };
  const barW = 20; // Increased bar width for better visibility
  const groupGap = 15; // Small gap between category groups
  const innerGap = 8; // Gap between bars within same group
  const maxVal = Math.max(1, ...items.flatMap((it) => series.map((s) => Number(it[s.key]) || 0)));
  const usableH = h - padding.top - padding.bottom;
  const groupW = series.length * barW + (series.length - 1) * innerGap;
  const totalW = items.length * groupW + (items.length - 1) * groupGap;
  const svgW = Math.max(w, padding.left + padding.right + totalW);
  const areaW = (fill ? w : svgW) - padding.left - padding.right;
  const step = items.length > 0 ? areaW / items.length : 0;
  const sx = (i) =>
    fill
      ? padding.left + i * step + (step - groupW) / 2
      : padding.left + i * (groupW + groupGap);
  const sh = (v) => (v / maxVal) * usableH;
  
  const [tooltip, setTooltip] = React.useState(null);
  
  return (
    <div className="relative">
      <svg width={fill ? w : svgW} height={h} className="overflow-visible">
        {showAxes && (
          <g>
            {/* Y axis */}
            <line x1={padding.left} y1={padding.top - 4} x2={padding.left} y2={h - padding.bottom} stroke="#d1d5db" />
            {/* X axis */}
            <line x1={padding.left} y1={h - padding.bottom} x2={svgW - padding.right} y2={h - padding.bottom} stroke="#d1d5db" />
            {/* Y ticks */}
            {Array.from({ length: yTicks + 1 }).map((_, i) => {
              const v = (maxVal / yTicks) * i;
              const y = h - padding.bottom - sh(v);
              const label = yFormat ? yFormat(v) : Math.round(v).toLocaleString('vi-VN');
              return (
                <g key={i}>
                  <line x1={padding.left - 4} y1={y} x2={svgW - padding.right} y2={y} stroke="#f3f4f6" />
                  <text x={padding.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize="11" className="fill-gray-600">{label}</text>
                </g>
              );
            })}
          </g>
        )}
        {items.map((it, i) => (
          <g key={i} transform={`translate(${sx(i)},0)`}>
            {series.map((s, si) => {
              const val = Number(it[s.key]) || 0;
              const bh = sh(val);
              const x = si * (barW + innerGap);
              const y = h - padding.bottom - bh;
              return (
                <rect 
                  key={si} 
                  x={x} 
                  y={y} 
                  width={barW} 
                  height={bh} 
                  fill={s.color}
                  onMouseMove={(e) => {
                    // Build tooltip with all series values for this item
                    const details = series.map(ser => ({
                      label: ser.label,
                      value: yFormat ? yFormat(Number(it[ser.key]) || 0) : (Number(it[ser.key]) || 0).toLocaleString('vi-VN')
                    }));
                    setTooltip({
                      x: e.clientX,
                      y: e.clientY,
                      itemName: String(it[labelKey]),
                      details
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
            <text x={groupW / 2} y={h - padding.bottom + 14} textAnchor="middle" fontSize="10" className="fill-gray-700">
              {String(it[labelKey]).slice(0, 10)}
            </text>
          </g>
        ))}
        {/* Legend */}
        {series.map((s, i) => (
          <g key={i} transform={`translate(${padding.left + i * 160}, ${padding.top})`}>
            <rect width="10" height="10" fill={s.color} />
            <text x="14" y="10" fontSize="14" className="fill-gray-700">{s.label}</text>
          </g>
        ))}
      </svg>
      {tooltip && (
        <div 
          className="fixed bg-gray-900 text-white text-xs rounded-lg py-2 px-3 pointer-events-none z-50 shadow-lg"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
            minWidth: '160px'
          }}
        >
          <div className="font-semibold mb-1 border-b border-gray-700 pb-1">{tooltip.itemName}</div>
          {tooltip.details.map((d, i) => (
            <div key={i} className="flex justify-between gap-3 py-0.5">
              <span className="text-gray-300">{d.label}:</span>
              <span className="font-medium">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProductsReport = () => {
  // Filters
  const [action, setAction] = useState('top-revenue');
  const [rangeMode, setRangeMode] = useState('days'); // 'days' | 'range'
  const [days, setDays] = useState(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [topN, setTopN] = useState(10);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState(''); // optional
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [brandsAvailable, setBrandsAvailable] = useState(true);

  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const q = { action, topN: Number(topN) || 10 };
    if (rangeMode === 'days') {
      q.days = Number(days) || 30;
    } else {
      if (startDate) q.startDate = startDate;
      if (endDate) q.endDate = endDate;
    }
    if (categoryId) q.categoryId = Number(categoryId);
    if (brandId) q.brandId = Number(brandId);
    return q;
  }, [action, rangeMode, days, startDate, endDate, topN, categoryId, brandId]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const resp = await api.get('/api/reports/products-analytics', { query });
      const data = resp?.data?.rows || resp?.rows || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Lỗi tải dữ liệu');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // Auto-load whenever filters change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Load categories (DanhMuc) and brands (here: NhaCungCap -> suppliers) for filters
  useEffect(() => {
    (async () => {
      try {
        const cats = await api.get('/api/categories');
        const options = (Array.isArray(cats) ? cats : []).map((c) => ({
          value: c.id ?? c.maDanhMuc ?? c.ma_danh_muc ?? c.MaDanhMuc ?? '',
          label: c.tenDanhMuc ?? c.ten_danh_muc ?? c.name ?? c.Name ?? 'Danh mục'
        }));
        setCategories(options);
      } catch (_) {
        setCategories([]);
      }
      // Load brands from suppliers API
      try {
        const suppliers = await api.get('/api/suppliers');
        const bops = (Array.isArray(suppliers) ? suppliers : []).map((b) => ({
          value: b.maNhaCungCap ?? b.id ?? '',
          label: b.tenNhaCungCap ?? b.name ?? 'Nhà cung cấp'
        }));
        setBrands(bops);
        setBrandsAvailable(true);
      } catch (e) {
        setBrands([]);
        setBrandsAvailable(false);
      }
    })();
  }, []);

  // Render helpers by action
  // Normalize common fields for flexible backend key casing
  const normalize = (r) => ({
    name: r.ten_san_pham ?? r.TenSanPham ?? r.name ?? r.tenSanPham ?? r.ten_sanpham,
    category: r.ten_danh_muc ?? r.TenDanhMuc ?? r.category ?? r.tenDanhMuc,
    revenue: Number(r.doanh_thu ?? r.DoanhThu ?? 0),
    quantity: Number(r.so_luong_ban ?? r.SoLuongBan ?? 0),
    profit: Number(r.loi_nhuan ?? r.LoiNhuan ?? 0),
    cost: (() => {
      const rev = Number(r.doanh_thu ?? r.DoanhThu ?? 0);
      const prof = Number(r.loi_nhuan ?? r.LoiNhuan ?? 0);
      return Math.max(0, rev - prof);
    })(),
    sku: r.sku ?? r.SKU ?? r.ma_bien_the ?? r.maBienThe,
    stock: Number(r.so_luong_ton_kho ?? r.SoLuongTonKho ?? 0),
    sold: Number(r.so_luong_ban ?? r.SoLuongBan ?? 0),
    date: r.ngay ?? r.Ngay,
  });

  const renderSection = () => {
    if (!rows.length) return <div className="text-gray-500">Không có dữ liệu.</div>;

    if (action === 'top-revenue') {
      const items = rows.map(normalize);
      const palette = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#84cc16','#f97316','#a855f7','#22c55e'];
      const hbarItems = items.map((i) => ({ TenSanPham: i.name, doanh_thu: i.revenue }));
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            <HBar
              items={hbarItems}
              labelKey="TenSanPham"
              valueKey="doanh_thu"
              valueFormat={(v) => v.toLocaleString('vi-VN') + ' đ'}
              colors={palette}
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <DonutChart items={items} labelKey="name" valueKey="revenue" colors={palette} />
            <div className="text-sm text-gray-600">Thị phần doanh thu (Top)</div>
            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: palette[idx % palette.length] }} />
                  <span className="truncate max-w-[200px]" title={it.name}>{it.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (action === 'top-quantity') {
      const items = rows.map(normalize);
      return (
        <HBar
          items={items.map((i) => ({ TenSanPham: i.name, so_luong_ban: i.quantity }))}
          labelKey="TenSanPham"
          valueKey="so_luong_ban"
          valueFormat={(v) => v.toLocaleString('vi-VN')}
        />
      );
    }
    if (action === 'by-category') {
      const items = rows.map(normalize);
      return (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <GroupedBarChart
              items={items.map((i) => ({ TenDanhMuc: i.category, gia_von: i.cost, loi_nhuan: i.profit }))}
              labelKey="TenDanhMuc"
              series={[
                { key: 'gia_von', label: 'Giá vốn', color: '#94a3b8' },
                { key: 'loi_nhuan', label: 'Lợi nhuận', color: '#22c55e' }
              ]}
              w={1000}
              h={360}
              showAxes={true}
              yTicks={5}
              yFormat={(v) => Math.round(v).toLocaleString('vi-VN') + ' đ'}
            />
          </div>
        </div>
      );
    }
    if (action === 'inventory-turnover') {
      const items = rows.map(normalize);
      return (
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <GroupedBarChart
              items={items.map((i) => ({ TenSanPham: i.name, ton: i.stock, ban: i.sold }))}
              labelKey="TenSanPham"
              series={[
                { key: 'ban', label: 'Bán', color: '#3b82f6' },
                { key: 'ton', label: 'Tồn', color: '#ef4444' }
              ]}
              w={1000}
              h={360}
              showAxes={true}
              yTicks={5}
              yFormat={(v) => Math.round(v).toLocaleString('vi-VN')}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Sản phẩm</th>
                  <th className="py-2 pr-4">Tồn</th>
                  <th className="py-2 pr-4">Bán</th>
                  <th className="py-2 pr-4">Giá trị tồn</th>
                  <th className="py-2 pr-4">Giá vốn bán</th>
                  <th className="py-2 pr-4">Vòng quay</th>
                  <th className="py-2 pr-4">Ngày tồn</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 pr-4">{r.TenSanPham ?? r.ten_san_pham}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.so_luong_ton_kho}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.so_luong_ban}</td>
                    <td className="py-2 pr-4 tabular-nums">{Number(r.gia_tri_ton_kho || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="py-2 pr-4 tabular-nums">{Number(r.gia_von_ban || 0).toLocaleString('vi-VN')} đ</td>
                    <td className="py-2 pr-4 tabular-nums">{r.ty_le_quay_vong}</td>
                    <td className="py-2 pr-4 tabular-nums">{r.so_ngay_ton_kho}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    if (action === 'rating') {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Sản phẩm</th>
                <th className="py-2 pr-4">Đánh giá</th>
                <th className="py-2 pr-4">Trung bình</th>
                <th className="py-2 pr-4">Hài lòng (%)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4">{r.TenSanPham}</td>
                  <td className="py-2 pr-4 tabular-nums">{r.so_luong_danh_gia}</td>
                  <td className="py-2 pr-4 tabular-nums">{Number(r.diem_danh_gia_tb || 0).toFixed(2)}</td>
                  <td className="py-2 pr-4 tabular-nums">{Number(r.ty_le_hai_long || 0).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    if (action === 'sales-trend') {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg">
            <div className="text-lg font-semibold mb-3 text-blue-900">Xu hướng doanh thu theo ngày</div>
            <AreaLineChart data={rows} xKey="ngay" yKey="doanh_thu" color="#3b82f6" />
            <div className="text-sm text-blue-700 mt-3 font-medium">
              Tổng doanh thu: {rows.reduce((s, r) => s + (Number(r.doanh_thu) || 0), 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      );
    }
    if (action === 'order-count') {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-lg">
            <div className="text-lg font-semibold mb-3 text-green-900">Số đơn hàng theo ngày</div>
            <AreaLineChart data={rows} xKey="ngay" yKey="so_don_hang" color="#10b981" />
            <div className="text-sm text-green-700 mt-3 font-medium">
              Tổng đơn hàng: {rows.reduce((s, r) => s + (Number(r.so_don_hang) || 0), 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      );
    }
    // Fallback generic table
    const cols = Object.keys(rows[0] || {});
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              {cols.map((c) => (
                <th key={c} className="py-2 pr-4">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b hover:bg-gray-50">
                {cols.map((c) => (
                  <td key={c} className="py-2 pr-4">{String(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 text-gray-800">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Báo cáo sản phẩm</h2>
        <button
          onClick={load}
          className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Tải lại
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Field label="Loại báo cáo">
          <Select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            options={[
              { value: 'top-revenue', label: 'Top doanh thu' },
              { value: 'top-quantity', label: 'Top số lượng' },
              { value: 'by-category', label: 'Theo danh mục' },
              { value: 'inventory-turnover', label: 'Vòng quay tồn kho' },
              { value: 'rating', label: 'Đánh giá' },
              { value: 'sales-trend', label: 'Xu hướng doanh thu' },
              { value: 'order-count', label: 'Số đơn hàng theo ngày' }
            ]}
          />
        </Field>

        <Field label="Chế độ thời gian">
          <Select
            value={rangeMode}
            onChange={(e) => setRangeMode(e.target.value)}
            options={[
              { value: 'days', label: 'Theo số ngày gần đây' },
              { value: 'range', label: 'Khoảng ngày' }
            ]}
          />
        </Field>

        {rangeMode === 'days' ? (
          <Field label="Số ngày">
            <NumberInput value={days} min={1} onChange={(e) => setDays(e.target.value)} />
          </Field>
        ) : (
          <>
            <Field label="Từ ngày">
              <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="Đến ngày">
              <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Top N">
          <NumberInput value={topN} min={1} onChange={(e) => setTopN(e.target.value)} />
        </Field>

        <Field label="Danh mục (tuỳ chọn)">
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={[{ value: '', label: 'Tất cả' }, ...categories]}
          />
        </Field>

        {brandsAvailable && (
          <Field label="Thương hiệu (tuỳ chọn)">
            <Select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              options={[{ value: '', label: 'Tất cả' }, ...brands]}
            />
          </Field>
        )}
      </div>

      {loading && <div className="text-gray-500">Đang tải dữ liệu…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {renderSection()}

          {/* Raw table for debugging/validation */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">Xem bảng dữ liệu</summary>
            <div className="mt-2">
              {(() => {
                if (!rows.length) return null;
                const cols = Object.keys(rows[0]);
                // Map technical column names to Vietnamese labels
                const colLabels = {
                  ma_danh_muc: 'Mã danh mục',
                  ten_danh_muc: 'Tên danh mục',
                  so_san_pham: 'Số sản phẩm',
                  so_luong_ban: 'Số lượng bán',
                  doanh_thu: 'Doanh thu',
                  loi_nhuan: 'Lợi nhuận',
                  ty_le_loi_nhuan: 'Tỷ lệ lợi nhuận',
                  ten_san_pham: 'Tên sản phẩm',
                  TenSanPham: 'Tên sản phẩm',
                  gia_von: 'Giá vốn',
                  so_luong_ton_kho: 'Số lượng tồn kho',
                  gia_tri_ton_kho: 'Giá trị tồn kho',
                  gia_von_ban: 'Giá vốn bán',
                  ty_le_quay_vong: 'Tỷ lệ quay vòng',
                  so_ngay_ton_kho: 'Số ngày tồn kho',
                  so_luong_danh_gia: 'Số lượng đánh giá',
                  diem_danh_gia_tb: 'Điểm đánh giá TB',
                  ty_le_hai_long: 'Tỷ lệ hài lòng',
                  ngay: 'Ngày',
                  ma_bien_the: 'Mã biến thể',
                  SKU: 'SKU',
                  DoanhThu: 'Doanh thu',
                  LoiNhuan: 'Lợi nhuận',
                  SoLuongBan: 'Số lượng bán',
                  SoLuongTonKho: 'Số lượng tồn kho'
                };
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          {cols.map((c) => (
                            <th key={c} className="py-2 pr-4">{colLabels[c] || c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => (
                          <tr key={i} className="border-b hover:bg-gray-50">
                            {cols.map((c) => (
                              <td key={c} className="py-2 pr-4 tabular-nums">{String(r[c])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default ProductsReport;
