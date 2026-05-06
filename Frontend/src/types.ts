export type BikeStatus = "In Stock" | "Sold";

export interface AdditionalCost {
  id: string;
  type: string;
  label?: string;
  amount: number;
}

export interface Bike {
  id: string;
  model: string;
  bikeNumber?: string;
  color?: string;
  yearOfManufacture?: string;
  images?: string[];
  owner?: {
    name: string;
    nic: string;
    photos: string[];
  };
  buying: {
    date: string;
    ownerName?: string; // Legacy
    phoneNumber?: string; // Legacy
    directCost: number;
    additionalCost?: number; // Legacy
  };
  additionalCosts?: AdditionalCost[];
  selling?: {
    soldDate: string;
    buyer?: {
      name: string;
      contactNumber: string;
      nic: string;
      documents: string[];
    };
    buyerName?: string; // Legacy
    sellingPrice: number;
    notes: string;
  };
  status: BikeStatus;
}

export type Tab = "Home" | "Add" | "Reports";
export type Screen = "Home" | "Add" | "Reports" | "Detail" | "Sell" | "Edit";
