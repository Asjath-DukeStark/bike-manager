import React, { useMemo, useState } from 'react';
import { Bike } from '../../types';
import { calculateProfit, calculateTotalCost, exportToExcel, formatCurrency, classNames } from '../../lib/utils';
import { DollarSign, Download, Bike as BikeIcon, TrendingUp, Clock, CalendarDays, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';

export function ReportsScreen({ bikes }: { bikes: Bike[] }) {
  const [dateRange, setDateRange] = useState<"All" | "This Month" | "Last Month" | "This Year" | "Custom">("All");
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredBikes = useMemo(() => {
    let result = bikes;
    
    if (dateRange !== "All") {
      const now = new Date();
      let start = new Date(0);
      let end = new Date();
      end.setHours(23, 59, 59, 999);
      
      if (dateRange === "This Month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === "Last Month") {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
      } else if (dateRange === "This Year") {
        start = new Date(now.getFullYear(), 0, 1);
      } else if (dateRange === "Custom") {
        start = startDate ? new Date(startDate) : new Date(0);
        end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);
      }
      
      const startTime = start.getTime();
      const endTime = end.getTime();
      
      result = result.filter(b => {
        const dateString = b.status === "Sold" && b.selling?.soldDate ? b.selling.soldDate : b.buying.date;
        const bikeDate = new Date(dateString).getTime();
        return bikeDate >= startTime && bikeDate <= endTime;
      });
    }
    
    return result;
  }, [bikes, dateRange, startDate, endDate]);

  const soldBikes = useMemo(() => filteredBikes.filter(b => b.status === "Sold"), [filteredBikes]);

  const overview = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDaysToSell = 0;

    soldBikes.forEach(bike => {
      totalRevenue += bike.selling?.sellingPrice || 0;
      totalCost += calculateTotalCost(bike);
      totalProfit += calculateProfit(bike);
      
      if (bike.selling?.soldDate && bike.buying.date) {
        const start = new Date(bike.buying.date);
        const end = new Date(bike.selling.soldDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        totalDaysToSell += days;
      }
    });

    const averageProfit = soldBikes.length ? (totalProfit / soldBikes.length) : 0;
    const averageTime = soldBikes.length ? Math.floor(totalDaysToSell / soldBikes.length) : 0;

    return { totalRevenue, totalCost, totalProfit, averageProfit, averageTime };
  }, [soldBikes]);

  // Format YYYY-MM to readable string (e.g. Oct 2023)
  const formatMonth = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  };

  const monthlyData = useMemo(() => {
    const data: Record<string, { count: number, profit: number, revenue: number }> = {};
    soldBikes.forEach(bike => {
      if (!bike.selling?.soldDate) return;
      const date = new Date(bike.selling.soldDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!data[monthYear]) {
        data[monthYear] = { count: 0, profit: 0, revenue: 0 };
      }
      data[monthYear].count += 1;
      data[monthYear].profit += calculateProfit(bike);
      data[monthYear].revenue += bike.selling.sellingPrice || 0;
    });
    
    // Sort ascending by month for charts
    return Object.entries(data)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ 
        month, 
        formattedMonth: formatMonth(month), 
        ...data 
      }));
  }, [soldBikes]);

  const topModels = useMemo(() => {
    const data: Record<string, number> = {};
    soldBikes.forEach(bike => {
      data[bike.model] = (data[bike.model] || 0) + 1;
    });
    return Object.entries(data)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [soldBikes]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl ring-1 ring-slate-900/5">
          <p className="text-slate-900 font-bold mb-1">{payload[0].payload.formattedMonth}</p>
          {payload.map((entry: any, index: number) => (
             <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name}: {entry.name === 'Profit' || entry.name === 'Revenue' ? formatCurrency(entry.value) : entry.value}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white pb-20">
      <div className="px-6 py-6 pb-2 border-b border-slate-100 bg-white sticky top-0 z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Reports</h2>
          <button 
            onClick={() => exportToExcel(filteredBikes)}
            className="flex items-center gap-1.5 text-white bg-slate-900 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-md hover:bg-slate-800 transition-colors mt-2"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
        
        <div className="flex flex-col gap-3 pb-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(["All", "This Month", "Last Month", "This Year", "Custom"] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={classNames(
                  "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shadow-sm shrink-0",
                  dateRange === range 
                    ? "bg-slate-900 text-white" 
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          
          {dateRange === "Custom" && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="flex gap-3 items-center overflow-hidden"
            >
              <div className="flex flex-col flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 w-full"
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 w-full"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-5 py-6 space-y-8 flex-1 overflow-y-auto">
        
        {soldBikes.length === 0 ? (
          <div className="p-8 rounded-[24px] border border-slate-100 bg-slate-50 border-dashed text-center mt-4">
            <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 ring-1 ring-slate-200/50 shadow-sm">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">No sales data yet</h3>
            <p className="text-slate-500 text-sm">Sell some bikes to see your comprehensive reports and analytics here.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Key Metrics Section */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <ReportCard 
                  title="Total Sold" 
                  value={soldBikes.length.toString()} 
                  icon={<BikeIcon size={18} />} 
                  color="bg-indigo-50 text-indigo-600 border-indigo-200" 
                />
                <ReportCard 
                  title="Total Profit" 
                  value={formatCurrency(overview.totalProfit)} 
                  icon={<TrendingUp size={18} />} 
                  color="bg-green-50 text-green-600 border-green-200" 
                  valueClass={overview.totalProfit >= 0 ? "text-green-600" : "text-red-500"}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ReportCard 
                  title="Avg Profit/Bike" 
                  value={formatCurrency(overview.averageProfit)} 
                  icon={<DollarSign size={18} />} 
                  color="bg-blue-50 text-blue-600 border-blue-200" 
                />
                <ReportCard 
                  title="Avg Time to Sell" 
                  value={`${overview.averageTime} days`} 
                  icon={<Clock size={18} />} 
                  color="bg-amber-50 text-amber-600 border-amber-200" 
                />
              </div>
            </section>

            {/* Profit Trend Chart */}
            {monthlyData.length > 0 && (
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Profit Trend</h3>
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 ring-1 ring-slate-200/50">
                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="formattedMonth" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#94a3b8' }} 
                          dy={10}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="profit" 
                          name="Profit"
                          stroke="#22c55e" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorProfit)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {/* Top Models Chart */}
            {topModels.length > 0 && (
              <section>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Top Selling Models</h3>
                <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 ring-1 ring-slate-200/50">
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topModels} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                          width={90}
                        />
                        <Tooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" name="Sold" radius={[0, 4, 4, 0]} barSize={24}>
                          {topModels.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8 - (index * 0.1)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            )}

            {/* Monthly Performance Data */}
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Monthly Detail</h3>
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden ring-1 ring-slate-200/50">
                {monthlyData.slice().reverse().map((data: any) => (
                  <div key={data.month} className="px-5 py-4 border-b border-slate-100 last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{data.formattedMonth}</p>
                      <p className="text-xs text-slate-500 font-medium">{data.count} bike{data.count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Profit</p>
                      <p className={classNames(
                        "font-bold text-lg", 
                        data.profit >= 0 ? "text-green-600" : "text-red-500"
                      )}>
                        {data.profit >= 0 ? '+' : ''}{formatCurrency(data.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ReportCard({ title, value, icon, color, valueClass }: { title: string, value: string, icon: React.ReactNode, color: string, valueClass?: string }) {
  const [bg, text, border] = color.split(' ');
  return (
    <div className={classNames("bg-white border rounded-[20px] p-4 shadow-sm flex flex-col justify-between ring-1 ring-slate-200/50", border)}>
      <div className="flex justify-between items-start mb-3">
        <div className={classNames("w-8 h-8 rounded-full flex items-center justify-center border", bg, text, border)}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{title}</p>
        <p className={classNames("text-xl font-bold tracking-tight", valueClass || "text-slate-900")}>{value}</p>
      </div>
    </div>
  );
}



