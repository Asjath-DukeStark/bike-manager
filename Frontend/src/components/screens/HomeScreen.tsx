import React, { useMemo, useState } from 'react';
import { Bike, BikeStatus } from '../../types';
import { calculateTotalCost, formatCurrency, getDaysInStock, getStockStatusInfo, calculateProfit, classNames } from '../../lib/utils';
import { BikeIcon, DollarSign, Package, Search } from 'lucide-react';
import { motion } from 'motion/react';

type FilterType = "All" | "In Stock" | "Sold" | "Needs Attention";

export function HomeScreen({ bikes, onSelectBike }: { bikes: Bike[], onSelectBike: (id: string) => void }) {
  const [filter, setFilter] = useState<FilterType>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBikes = useMemo(() => {
    let result = bikes;
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = bikes.filter(b => 
        b.model.toLowerCase().includes(lowerSearch) ||
        b.bikeNumber?.toLowerCase().includes(lowerSearch) ||
        b.owner?.name.toLowerCase().includes(lowerSearch) ||
        b.owner?.nic.toLowerCase().includes(lowerSearch) ||
        b.buying.ownerName?.toLowerCase().includes(lowerSearch) ||
        b.selling?.buyer?.name.toLowerCase().includes(lowerSearch) ||
        b.selling?.buyerName?.toLowerCase().includes(lowerSearch)
      );
    }

    if (filter === "In Stock") result = result.filter(b => b.status === "In Stock");
    if (filter === "Sold") result = result.filter(b => b.status === "Sold");
    if (filter === "Needs Attention") result = result.filter(b => b.status === "In Stock" && getDaysInStock(b.buying.date) > 30);
    
    // Sort logic
    return result.sort((a, b) => {
      // If we are looking at in stock or needs attention, prioritize by days in stock (descending)
      if (filter === "In Stock" || filter === "Needs Attention") {
         return getDaysInStock(b.buying.date) - getDaysInStock(a.buying.date);
      }
      // Otherwise sort by newest buying date first
      return new Date(b.buying.date).getTime() - new Date(a.buying.date).getTime();
    });
  }, [bikes, filter, searchTerm]);

  const stats = useMemo(() => {
    const inStock = bikes.filter(b => b.status === "In Stock").length;
    const sold = bikes.filter(b => b.status === "Sold").length;
    const totalProfit = bikes.filter(b => b.status === "Sold").reduce((acc, b) => acc + calculateProfit(b), 0);
    return { inStock, sold, totalProfit };
  }, [bikes]);

  return (
    <div className="flex flex-col h-full bg-white pb-24"> {/* Space for nav */}
      
      {/* Mini Dashboard */}
      <div className="px-5 pt-5 pb-2">
        <h2 className="text-xl font-bold mb-4 text-slate-900 px-1">Overview</h2>
        <div className="grid grid-cols-3 gap-3">
          <DashboardCard title="In Stock" value={stats.inStock} color="bg-blue-50 border-blue-100 text-blue-600" />
          <DashboardCard title="Sold" value={stats.sold} color="bg-green-50 border-green-100 text-green-600" />
          <DashboardCard title="Profit" value={formatCurrency(stats.totalProfit)} color="bg-slate-50 border-slate-200 text-slate-500" />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-5 py-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10 space-y-3 pt-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 text-slate-900 placeholder-slate-400 shadow-sm"
            placeholder="Search model, owner, NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-5 px-5 snap-x">
          {(["All", "In Stock", "Sold", "Needs Attention"] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={classNames(
                "whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-colors flex items-center shadow-sm snap-center shrink-0",
                filter === f 
                  ? "bg-slate-900 text-white ring-1 ring-slate-900" 
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
               {f}
               {f === "Needs Attention" && bikes.filter(b => b.status === "In Stock" && getDaysInStock(b.buying.date) > 30).length > 0 && (
                 <span className={classNames("ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold", filter === f ? "bg-white text-slate-900" : "bg-red-500 text-white")}>
                   {bikes.filter(b => b.status === "In Stock" && getDaysInStock(b.buying.date) > 30).length}
                 </span>
               )}
            </button>
          ))}
        </div>
      </div>

      {/* Bike List */}
      <div className="px-5 pt-2 pb-24 space-y-4">
        {filteredBikes.length === 0 ? (
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 border-dashed text-center mt-4">
            <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Package size={24} />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">
              {filter === "All" ? "No bikes registered yet" : `No bikes matching "${filter}"`}
            </h3>
            <p className="text-slate-500 text-xs">
              Use the + button to add your first bike.
            </p>
          </div>
        ) : (
          filteredBikes.map((bike, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.3) }}
              key={bike.id}
            >
              <BikeCard bike={bike} onClick={() => onSelectBike(bike.id)} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function DashboardCard({ title, value, color }: { title: string, value: string | number, color: string }) {
  const [bg, border, text] = color.split(' ');
  return (
    <div className={classNames("p-3 rounded-2xl border flex flex-col justify-between", bg, border)}>
      <p className={classNames("text-[10px] font-semibold uppercase tracking-wider mb-1", text)}>{title}</p>
      <p className="text-xl font-bold truncate text-slate-900">{value}</p>
    </div>
  );
}

function BikeCard({ bike, onClick }: { bike: Bike, onClick: () => void }) {
  const totalCost = calculateTotalCost(bike);
  const profit = calculateProfit(bike);
  const daysInStock = getDaysInStock(bike.buying.date);
  const stockInfo = getStockStatusInfo(daysInStock);

  return (
    <div 
      onClick={onClick}
      className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm ring-1 ring-slate-200/50 cursor-pointer active:scale-[0.98] transition-transform flex gap-3"
    >
      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
        {bike.images && bike.images.length > 0 ? (
          <img src={bike.images[0]} alt={bike.model} className="w-full h-full object-cover" />
        ) : (
          <BikeIcon size={24} className="text-slate-300" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div className="pr-2 truncate">
            <h3 className="font-bold text-slate-900 truncate">{bike.model}</h3>
            {bike.bikeNumber && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{bike.bikeNumber}</p>
            )}
          </div>
          {bike.status === "In Stock" ? (
            <span className={classNames("px-2 py-1 rounded-md text-[10px] font-bold uppercase whitespace-nowrap shrink-0 mt-0.5", stockInfo.color)}>
              {stockInfo.label}
            </span>
          ) : (
            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-600 uppercase whitespace-nowrap shrink-0 mt-0.5">
              Sold
            </span>
          )}
        </div>
        
        {bike.status === "In Stock" ? (
          <>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="truncate pr-2">Date: {new Date(bike.buying.date).toLocaleDateString()}</span>
              <span className="font-semibold text-slate-900">{formatCurrency(totalCost)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                 <div 
                    className={classNames("h-full rounded-full transition-all", stockInfo.color.includes('red') ? 'bg-red-400' : stockInfo.color.includes('yellow') ? 'bg-yellow-400' : 'bg-blue-400')} 
                    style={{ width: `${Math.min((daysInStock / 60) * 100, 100)}%` }}
                 ></div>
              </div>
              <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{daysInStock}d</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span className="truncate pr-2">{new Date(bike.selling?.soldDate || '').toLocaleDateString()}</span>
              <span className={classNames("font-bold", profit >= 0 ? "text-green-600" : "text-red-500")}>
                {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate font-semibold">
              {bike.selling?.buyer?.name || bike.selling?.buyerName ? `To ${bike.selling?.buyer?.name || bike.selling?.buyerName}` : 'Sold'} • {formatCurrency(bike.selling?.sellingPrice || 0)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
