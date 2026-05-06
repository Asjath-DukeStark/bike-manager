import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Bike } from '../../types';
import { ImageUpload } from '../ui/ImageUpload';

export function SellingFormScreen({ bike, onBack, onSave }: { bike: Bike, onBack: () => void, onSave: (b: Bike) => void }) {
  const [soldDate, setSoldDate] = useState(bike.selling?.soldDate || new Date().toISOString().split('T')[0]);
  const [sellingPrice, setSellingPrice] = useState(bike.selling?.sellingPrice.toString() || '');
  
  const [buyerName, setBuyerName] = useState(bike.selling?.buyer?.name || bike.selling?.buyerName || '');
  const [contactNumber, setContactNumber] = useState(bike.selling?.buyer?.contactNumber || '');
  const [buyerNic, setBuyerNic] = useState(bike.selling?.buyer?.nic || '');
  const [documents, setDocuments] = useState<string[]>(bike.selling?.buyer?.documents || []);
  
  const [notes, setNotes] = useState(bike.selling?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingPrice || !soldDate || !buyerNic) return;

    const updatedBike: Bike = {
      ...bike,
      status: "Sold",
      selling: {
        soldDate,
        buyer: {
          name: buyerName,
          contactNumber,
          nic: buyerNic,
          documents
        },
        sellingPrice: parseFloat(sellingPrice) || 0,
        notes
      }
    };

    onSave(updatedBike);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 pb-safe">
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 pt-safe pb-4 flex items-center z-10 sticky top-0 relative">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 ml-2 mt-2">{bike.status === 'Sold' ? 'Edit Sale:' : 'Sell:'} {bike.model}</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 font-sans pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Sale Details */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 ring-1 ring-slate-200/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">1. Sale Details</h3>
            
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sold Date <span className="text-red-500">*</span></label>
                 <input type="date" required value={soldDate} onChange={(e) => setSoldDate(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selling Price ($) <span className="text-red-500">*</span></label>
                 <input type="number" required min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-green-600 placeholder-slate-400" placeholder="0.00" />
               </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 resize-none placeholder-slate-400" placeholder="Any additional details..." />
            </div>
          </div>

          {/* Section: Buyer Details */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 ring-1 ring-slate-200/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">2. Buyer Details & Documents</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buyer Name</label>
              <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="Jane Doe" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
              <input type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="1234567890" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buyer NIC <span className="text-red-500">*</span></label>
              <input type="text" required value={buyerNic} onChange={(e) => setBuyerNic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="123456789v" />
            </div>

            <ImageUpload images={documents} onChange={setDocuments} maxImages={3} label="NIC / Documents" className="pt-2" />
          </div>

          <div className="pb-12 pt-2">
            <button type="submit" className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-4 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-colors active:scale-[0.98]">
              {bike.status === 'Sold' ? 'Save Changes' : 'Confirm Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
