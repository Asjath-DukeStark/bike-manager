import React, { useState } from 'react';
import { Bike, AdditionalCost } from '../../types';
import { ImageUpload } from '../ui/ImageUpload';
import { Plus, X, Trash2 } from 'lucide-react';
import { classNames } from '../../lib/utils';

export function AddBikeScreen({ onSave, initialBike, onCancel }: { onSave: (bike: Bike) => void, initialBike?: Bike, onCancel?: () => void }) {
  const [model, setModel] = useState(initialBike?.model || '');
  const [bikeNumber, setBikeNumber] = useState(initialBike?.bikeNumber || '');
  const [color, setColor] = useState(initialBike?.color || '');
  const [yearOfManufacture, setYearOfManufacture] = useState(initialBike?.yearOfManufacture || '');
  const [images, setImages] = useState<string[]>(initialBike?.images || []);

  const [date, setDate] = useState(initialBike?.buying.date || new Date().toISOString().split('T')[0]);
  
  const [ownerName, setOwnerName] = useState(initialBike?.owner?.name || initialBike?.buying.ownerName || '');
  const [ownerNic, setOwnerNic] = useState(initialBike?.owner?.nic || '');
  const [ownerPhotos, setOwnerPhotos] = useState<string[]>(initialBike?.owner?.photos || []);
  
  const [directCost, setDirectCost] = useState(initialBike?.buying.directCost.toString() || '');
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>(initialBike?.additionalCosts || []);
  const [isSaving, setIsSaving] = useState(false);

  const [addingCost, setAddingCost] = useState(false);
  const [costType, setCostType] = useState('Tire');
  const [costLabel, setCostLabel] = useState('');
  const [costAmount, setCostAmount] = useState('');

  const handleAddCost = () => {
    if (!costAmount) return;
    setAdditionalCosts([
      ...additionalCosts, 
      {
        id: crypto.randomUUID(),
        type: costType,
        label: costType === 'Other' ? costLabel : undefined,
        amount: parseFloat(costAmount) || 0
      }
    ]);
    setAddingCost(false);
    setCostType('Tire');
    setCostLabel('');
    setCostAmount('');
  };

  const removeCost = (id: string) => {
    setAdditionalCosts(additionalCosts.filter(c => c.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !bikeNumber || !ownerNic || !directCost || !date || isSaving) return;

    setIsSaving(true);
    
    const newBike: Bike = {
      ...initialBike,
      id: initialBike?.id || crypto.randomUUID(),
      model,
      bikeNumber,
      color,
      yearOfManufacture,
      images,
      owner: {
        name: ownerName,
        nic: ownerNic,
        photos: ownerPhotos
      },
      buying: {
        date,
        directCost: parseFloat(directCost) || 0,
        ownerName: initialBike?.buying.ownerName, // Preserve legacy data if it exists directly there
        phoneNumber: initialBike?.buying.phoneNumber,
        additionalCost: initialBike?.buying.additionalCost,
      },
      additionalCosts,
      status: initialBike?.status || "In Stock"
    } as Bike;

    try {
      await onSave(newBike);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 pb-20">
      <div className="px-5 py-8 flex-1 overflow-y-auto relative">
        {onCancel && (
          <button onClick={onCancel} className="absolute top-8 right-5 p-2 text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm">
            <X size={20} />
          </button>
        )}
        <h2 className="text-3xl font-bold tracking-tight mb-6 text-slate-900 px-1">{initialBike ? 'Edit Bike' : 'Add Bike'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Bike Details */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 ring-1 ring-slate-200/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">1. Bike Details</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bike Model <span className="text-red-500">*</span></label>
              <input type="text" required value={model} onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="e.g. Yamaha R15 V3" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Number <span className="text-red-500">*</span></label>
                <input type="text" required value={bikeNumber} onChange={(e) => setBikeNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="e.g. BAA-1234" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Year</label>
                <input type="text" value={yearOfManufacture} onChange={(e) => setYearOfManufacture(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="YYYY" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Color</label>
              <input type="text" value={color} onChange={(e) => setColor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="e.g. Matte Black" />
            </div>

            <ImageUpload images={images} onChange={setImages} maxImages={5} label="Bike Photos" className="pt-2" />
          </div>

          {/* Section: Owner Details */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 ring-1 ring-slate-200/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">2. Owner Details & Documents</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner Name</label>
              <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="John Doe" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner NIC <span className="text-red-500">*</span></label>
              <input type="text" required value={ownerNic} onChange={(e) => setOwnerNic(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="123456789v" />
            </div>

            <ImageUpload images={ownerPhotos} onChange={setOwnerPhotos} maxImages={3} label="NIC / Documents" className="pt-2" />
          </div>

          {/* Section: Buying Details */}
          <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 ring-1 ring-slate-200/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">3. Cost Breakdown</h3>
            
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Buying Date <span className="text-red-500">*</span></label>
                 <input type="date" required value={date} onChange={(e) => setDate(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900" />
               </div>
               <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Cost ($) <span className="text-red-500">*</span></label>
                 <input type="number" required min="0" step="0.01" value={directCost} onChange={(e) => setDirectCost(e.target.value)}
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-sm text-slate-900 placeholder-slate-400" placeholder="0.00" />
               </div>
            </div>

            <div className="pt-3 border-t border-slate-100/60 flex flex-col space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Costs</label>
              
              {additionalCosts.map(cost => (
                <div key={cost.id} className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{cost.type} {cost.label ? `(${cost.label})` : ''}</span>
                    <span className="text-[10px] text-slate-500 font-medium">${cost.amount.toFixed(2)}</span>
                  </div>
                  <button type="button" onClick={() => removeCost(cost.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {!addingCost ? (
                <button type="button" onClick={() => setAddingCost(true)} className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  <Plus size={16} /> Add Cost Item
                </button>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-600 uppercase">New Cost Entry</span>
                    <button type="button" onClick={() => setAddingCost(false)}><X size={14} className="text-slate-400"/></button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select value={costType} onChange={(e) => setCostType(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-slate-900 outline-none text-slate-900">
                      <option>Tire</option>
                      <option>Paint</option>
                      <option>Service</option>
                      <option>Transport</option>
                      <option>Other</option>
                    </select>
                    {costType === 'Other' && (
                      <input type="text" value={costLabel} onChange={(e) => setCostLabel(e.target.value)} placeholder="Label" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-slate-900"/>
                    )}
                    <input type="number" min="0" step="0.01" value={costAmount} onChange={(e) => setCostAmount(e.target.value)} placeholder="Cost ($)" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900"/>
                  </div>
                  <button type="button" onClick={handleAddCost} disabled={!costAmount} className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-xs disabled:opacity-50">
                    Add Entry
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="pb-12 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-slate-900 text-white font-bold rounded-xl px-4 py-4 shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : (initialBike ? "Update Bike" : "Save Bike")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
