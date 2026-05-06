import React from 'react';
import { ChevronLeft, Download, Edit } from 'lucide-react';
import { calculateProfit, calculateTotalCost, classNames, formatCurrency } from '../../lib/utils';
import { Bike } from '../../types';

export function BikeDetailScreen({ bike, onBack, onSellClick, onEditClick }: { bike: Bike, onBack: () => void, onSellClick: () => void, onEditClick: () => void }) {
  const totalCost = calculateTotalCost(bike);
  const profit = calculateProfit(bike);

  const ownerName = bike.owner?.name || bike.buying.ownerName;
  const originalAddCost = bike.buying.additionalCost || 0;

  return (
    <div className="flex flex-col h-full bg-slate-100 pb-safe">
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 pt-safe pb-4 flex items-center justify-between z-10 sticky top-0 relative">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 ml-2 mt-2">Bike Details</h1>
        </div>
        <button onClick={onEditClick} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Edit size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 pb-20">
        
        {/* Bike Title & Tag */}
        <div>
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-3xl font-bold text-slate-900 pr-2">{bike.model}</h2>
            <div className={classNames(
              "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mt-2 whitespace-nowrap",
              bike.status === "In Stock" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
            )}>
              {bike.status}
            </div>
          </div>
          {bike.bikeNumber && (
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{bike.bikeNumber}</p>
          )}
        </div>

        {/* Bike Images Gallery */}
        {bike.images && bike.images.length > 0 && (
          <div className="flex overflow-x-auto pb-2 -mx-5 px-5 space-x-3 snap-x">
            {bike.images.map((img, i) => (
              <ImageDisplay key={i} src={img} alt={`Bike ${i+1}`} containerClass="w-48 h-48 rounded-2xl shadow-sm ring-1 ring-slate-200/50 snap-center" />
            ))}
          </div>
        )}

        {/* Bike Specifications */}
        {(bike.color || bike.yearOfManufacture) && (
          <section className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 ring-1 ring-slate-200/50">
            <h3 className="font-bold text-slate-900 text-sm mb-4">Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              {bike.yearOfManufacture && <DetailRow label="Year" value={bike.yearOfManufacture} />}
              {bike.color && <DetailRow label="Color" value={bike.color} />}
            </div>
          </section>
        )}

        {/* Owner details */}
        <section className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-5 ring-1 ring-slate-200/50">
           <h3 className="font-bold text-slate-900 text-sm">Owner & Documents</h3>
           <div className="grid grid-cols-2 gap-4">
             <DetailRow label="Name" value={ownerName || '-'} />
             {bike.owner?.nic ? (
               <DetailRow label="Owner NIC" value={bike.owner.nic} />
             ) : (
               <DetailRow label="Phone (Legacy)" value={bike.buying.phoneNumber || '-'} />
             )}
           </div>

           {bike.owner?.photos && bike.owner.photos.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Documents</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {bike.owner.photos.map((doc, i) => (
                  <ImageDisplay key={i} src={doc} alt={`Owner Document ${i+1}`} containerClass="w-24 h-24 rounded-xl border border-slate-200" />
                ))}
              </div>
            </div>
           )}
        </section>

        {/* Buying Details / Financials */}
        <section className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4 ring-1 ring-slate-200/50">
          <h3 className="font-bold text-slate-900 text-sm">Cost Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailRow label="Buying Date" value={new Date(bike.buying.date).toLocaleDateString()} />
            <DetailRow label="Direct Cost" value={formatCurrency(bike.buying.directCost)} />
          </div>

          <div className="pt-4 border-t border-slate-100">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Additional Costs</p>
             {bike.additionalCosts && bike.additionalCosts.length > 0 ? (
               <div className="space-y-2">
                 {bike.additionalCosts.map(cost => (
                   <div key={cost.id} className="flex justify-between items-center text-sm">
                     <span className="text-slate-600 font-medium">{cost.type} {cost.label ? `(${cost.label})` : ''}</span>
                     <span className="text-slate-900 font-bold">{formatCurrency(cost.amount)}</span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-sm font-bold text-slate-900">
                  {formatCurrency(originalAddCost)} <span className="text-slate-400 font-normal text-xs">(Legacy)</span>
               </div>
             )}
          </div>

          <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-5 px-5 pb-4 rounded-b-[24px] mt-2">
             <div className="flex justify-between items-center font-bold text-slate-900">
                <span className="text-sm uppercase tracking-wider">Total Cost</span>
                <span className="text-xl">{formatCurrency(totalCost)}</span>
             </div>
          </div>
        </section>

        {/* Selling Details / Call to Action */}
        {bike.status === "Sold" && bike.selling ? (
          <section className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 space-y-4 ring-1 ring-slate-200/50">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Selling Information</h3>
              <button onClick={onSellClick} className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                <Edit size={12} /> Edit
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <DetailRow label="Sold Date" value={new Date(bike.selling.soldDate).toLocaleDateString()} />
              <DetailRow label="Selling Price" value={formatCurrency(bike.selling.sellingPrice)} />
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <DetailRow label="Buyer Name" value={bike.selling.buyer?.name || bike.selling.buyerName || '-'} />
              {bike.selling.buyer?.contactNumber && (
                <DetailRow label="Buyer Phone" value={bike.selling.buyer.contactNumber} />
              )}
              {bike.selling.buyer?.nic && (
                <DetailRow label="Buyer NIC" value={bike.selling.buyer.nic} />
              )}
            </div>

            {bike.selling.buyer?.documents && bike.selling.buyer.documents.length > 0 && (
            <div className="pt-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Buyer Documents</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {bike.selling.buyer.documents.map((doc, i) => (
                  <ImageDisplay key={i} src={doc} alt={`Buyer Document ${i+1}`} containerClass="w-24 h-24 rounded-xl border border-slate-200" />
                ))}
              </div>
            </div>
           )}

            {bike.selling.notes && (
              <div className="mt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded-xl border border-slate-100">{bike.selling.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 bg-green-50/50 -mx-5 px-5 pb-4 rounded-b-[24px] space-y-3">               
               <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-900 text-sm uppercase tracking-wider">Profit</span>
                  <span className={classNames(
                    "text-xl", 
                    profit >= 0 ? "text-green-600" : "text-red-500"
                  )}>
                    {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                  </span>
               </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center text-center space-y-4 ring-1 ring-slate-200/50">
             <div className="text-slate-400 mb-2">
               <p className="font-bold text-slate-600 mb-1">Not sold yet</p>
               <p className="text-sm">Record the sale details when you sell this bike.</p>
             </div>
             <button 
                onClick={onSellClick}
                className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-3.5 shadow-sm hover:bg-slate-800 transition-colors active:scale-[0.98]"
              >
                Mark as Sold
              </button>
          </section>
        )}

      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

const ImageDisplay: React.FC<{ src: string, alt: string, containerClass?: string }> = ({ src, alt, containerClass }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `${alt.replace(/\s+/g, '_').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={classNames("relative overflow-hidden group shrink-0", containerClass)}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      <button 
        onClick={handleDownload}
        className="absolute bottom-2 right-2 p-1.5 bg-white/90 text-slate-700 rounded-full shadow-sm hover:bg-white hover:text-slate-900 transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`Download ${alt}`}
      >
        <Download size={14} />
      </button>
    </div>
  );
}
