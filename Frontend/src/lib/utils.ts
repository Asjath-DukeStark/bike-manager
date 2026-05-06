import { Bike } from '../types';

export function classNames(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function calculateTotalCost(bike: Bike) {
  let addCost = 0;
  if (bike.additionalCosts && bike.additionalCosts.length > 0) {
    addCost = bike.additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  } else if (bike.buying && bike.buying.additionalCost) {
    addCost = bike.buying.additionalCost || 0;
  }
  return (bike.buying.directCost || 0) + addCost;
}

export function calculateProfit(bike: Bike) {
  if (bike.status !== "Sold" || !bike.selling) return 0;
  const totalCost = calculateTotalCost(bike);
  return (bike.selling.sellingPrice || 0) - totalCost;
}

export function exportToCSV(bikes: Bike[]) {
  // We keep exportToCSV inside if it's still imported or if needed backward compatibility.
  // Actually, I'll just change the import in ReportsScreen and add exportToExcel here.
  const headers = [
    "Bike Model",
    "Bike Number",
    "Color",
    "Year",
    "Status",
    "Buying Date",
    "Owner Name",
    "Owner NIC",
    "Direct Cost",
    "Additional Cost",
    "Total Cost",
    "Sold Date",
    "Buyer Name",
    "Buyer Number",
    "Buyer NIC",
    "Selling Price",
    "Profit"
  ];

  const rows = bikes.map(bike => {
    const totalCost = calculateTotalCost(bike);
    const profit = calculateProfit(bike);
    const ownerName = bike.owner?.name || bike.buying.ownerName || '';
    const addCost = totalCost - (bike.buying.directCost || 0);
    const buyerName = bike.selling?.buyer?.name || bike.selling?.buyerName || '';

    return [
      `"${bike.model.replace(/"/g, '""')}"`,
      `"${(bike.bikeNumber || '').replace(/"/g, '""')}"`,
      `"${(bike.color || '').replace(/"/g, '""')}"`,
      `"${(bike.yearOfManufacture || '').replace(/"/g, '""')}"`,
      bike.status,
      bike.buying.date,
      `"${ownerName.replace(/"/g, '""')}"`,
      `"${(bike.owner?.nic || '').replace(/"/g, '""')}"`,
      bike.buying.directCost,
      addCost,
      totalCost,
      bike.selling?.soldDate || "",
      `"${buyerName.replace(/"/g, '""')}"`,
      `"${(bike.selling?.buyer?.contactNumber || '').replace(/"/g, '""')}"`,
      `"${(bike.selling?.buyer?.nic || '').replace(/"/g, '""')}"`,
      bike.selling?.sellingPrice || "",
      bike.status === "Sold" ? profit : ""
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'bike-report.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportToExcel(bikes: Bike[]) {
  // Use xlsx to generate Excel file
  // Dynamic import so it's only loaded when needed
  const XLSX = await import('xlsx');

  const data = bikes.map(bike => {
    const totalCost = calculateTotalCost(bike);
    const profit = calculateProfit(bike);
    const ownerName = bike.owner?.name || bike.buying.ownerName || '';
    const addCost = totalCost - (bike.buying.directCost || 0);
    const buyerName = bike.selling?.buyer?.name || bike.selling?.buyerName || '';

    return {
      "Bike Model": bike.model,
      "Bike Number": bike.bikeNumber || '',
      "Color": bike.color || '',
      "Year": bike.yearOfManufacture || '',
      "Status": bike.status,
      "Buying Date": bike.buying.date,
      "Owner Name": ownerName,
      "Owner NIC": bike.owner?.nic || '',
      "Direct Cost": bike.buying.directCost,
      "Additional Cost": addCost,
      "Total Cost": totalCost,
      "Sold Date": bike.selling?.soldDate || "",
      "Buyer Name": buyerName,
      "Buyer Number": bike.selling?.buyer?.contactNumber || '',
      "Buyer NIC": bike.selling?.buyer?.nic || '',
      "Selling Price": bike.selling?.sellingPrice || "",
      "Profit": bike.status === "Sold" ? profit : ""
    };
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bikes");
  XLSX.writeFile(wb, "bike-report.xlsx");
}

export function getDaysInStock(dateStr: string) {
  const buyingDate = new Date(dateStr);
  const today = new Date();
  
  // Strip time for accurate day calculation
  const start = Date.UTC(buyingDate.getFullYear(), buyingDate.getMonth(), buyingDate.getDate());
  const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

export function getStockStatusInfo(days: number) {
  if (days >= 60) return { label: 'Urgent', color: 'bg-red-100 text-red-600' };
  if (days >= 30) return { label: 'Slow', color: 'bg-yellow-100 text-yellow-600' };
  return { label: 'New', color: 'bg-blue-100 text-blue-600' };
}

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Lower quality to aggressively save localStorage size
      };
      img.onerror = (e) => reject(e);
    };
    reader.onerror = (e) => reject(e);
  });
}
