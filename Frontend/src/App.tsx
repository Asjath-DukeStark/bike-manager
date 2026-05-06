import React, { useState, useEffect, useCallback } from 'react';
import { Bike, Screen, Tab } from './types.ts';

import { HomeScreen } from './components/screens/HomeScreen.tsx';
import { AddBikeScreen } from './components/screens/AddBikeScreen.tsx';
import { ReportsScreen } from './components/screens/ReportsScreen.tsx';
import { BikeDetailScreen } from './components/screens/BikeDetailScreen.tsx';
import { SellingFormScreen } from './components/screens/SellingFormScreen.tsx';
import { LoginScreen } from './components/screens/LoginScreen.tsx';
import { MigrationScreen } from './components/screens/MigrationScreen.tsx';

import { LayoutDashboard, PlusCircle, BarChart3, LogOut, DatabaseIcon } from 'lucide-react';
import { classNames } from './lib/utils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { bikes as bikesApi, getToken, clearToken } from './lib/api.ts';

export default function App() {
  const [token, setToken] = useState<string | null>(getToken());
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Home");
  const [activeScreen, setActiveScreen] = useState<Screen>("Home");
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);

  // ── Check if the user has old localStorage data to migrate ──────────────────
  const hasLocalData = Boolean(localStorage.getItem('bikeManager_bikes'));

  // ── Fetch all bikes from the API ─────────────────────────────────────────────
  const fetchBikes = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await bikesApi.getAll();
      setBikes(data as Bike[]);
    } catch (err) {
      console.error('Failed to fetch bikes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBikes();
  }, [fetchBikes]);

  // Sync tab with screen
  useEffect(() => {
    if (activeScreen === "Home" || activeScreen === "Add" || activeScreen === "Reports") {
      setActiveTab(activeScreen as Tab);
    }
  }, [activeScreen]);

  const handleLogout = () => {
    clearToken();
    setToken(null);
    setBikes([]);
  };

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleAddBike = async (bike: Bike) => {
    try {
      await bikesApi.create(bike);
      await fetchBikes();
      setActiveScreen("Home");
    } catch (err) {
      console.error('Failed to add bike:', err);
      alert('Failed to save bike. Please try again.');
    }
  };

  const handleUpdateBike = async (updatedBike: Bike) => {
    try {
      await bikesApi.update(updatedBike.id, updatedBike);
      await fetchBikes();
    } catch (err) {
      console.error('Failed to update bike:', err);
      alert('Failed to update bike. Please try again.');
    }
  };

  const handleDeleteBike = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bike? This cannot be undone.')) return;
    try {
      await bikesApi.delete(id);
      await fetchBikes();
      setActiveScreen("Home");
      setSelectedBikeId(null);
    } catch (err) {
      console.error('Failed to delete bike:', err);
      alert('Failed to delete bike. Please try again.');
    }
  };

  const handleSellBike = async (updatedBike: Bike) => {
    if (!updatedBike.selling) return;
    try {
      await bikesApi.sell(updatedBike.id, {
        soldDate: updatedBike.selling.soldDate,
        sellingPrice: updatedBike.selling.sellingPrice,
        notes: updatedBike.selling.notes,
        buyer: updatedBike.selling.buyer,
      });
      await fetchBikes();
      setActiveScreen("Home");
      setSelectedBikeId(null);
    } catch (err) {
      console.error('Failed to record sale:', err);
      alert('Failed to record sale. Please try again.');
    }
  };

  const navigateBack = () => {
    if (activeScreen === "Sell") {
      setActiveScreen("Detail");
    } else if (activeScreen === "Detail") {
      setActiveScreen("Home");
      setSelectedBikeId(null);
    }
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (showMigration) {
    return (
      <MigrationScreen
        onComplete={() => {
          setShowMigration(false);
          fetchBikes();
        }}
        onSkip={() => setShowMigration(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-white text-slate-900 font-sans max-w-md mx-auto relative overflow-hidden shadow-2xl xl:rounded-[40px] xl:h-[700px] xl:my-auto border-x border-slate-200 xl:border-8">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 px-6 pt-safe pb-4 flex items-center justify-between z-10 relative">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-2">Bike Manager</h1>
        <div className="flex items-center gap-2 mt-2">
          {hasLocalData && (
            <button
              onClick={() => setShowMigration(true)}
              title="Migrate old data"
              className="text-amber-500 hover:text-amber-700 transition-colors"
            >
              <DatabaseIcon size={18} />
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Loading Bar */}
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 z-50">
          <div className="h-full bg-slate-900 animate-pulse w-1/2 mx-auto" />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-white">
        <AnimatePresence mode="wait">
          {activeScreen === "Home" && (
            <motion.div
              key="Home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <HomeScreen
                bikes={bikes}
                onSelectBike={(id) => {
                  setSelectedBikeId(id);
                  setActiveScreen("Detail");
                }}
              />
            </motion.div>
          )}
          {activeScreen === "Add" && (
            <motion.div
              key="Add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <AddBikeScreen onSave={handleAddBike} />
            </motion.div>
          )}
          {activeScreen === "Reports" && (
            <motion.div
              key="Reports"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ReportsScreen bikes={bikes} />
            </motion.div>
          )}
          {activeScreen === "Detail" && selectedBikeId && (
            <motion.div
              key="Detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-20"
            >
              <BikeDetailScreen
                bike={bikes.find(b => b.id === selectedBikeId)!}
                onBack={navigateBack}
                onSellClick={() => setActiveScreen("Sell")}
                onEditClick={() => setActiveScreen("Edit")}
                onDelete={() => handleDeleteBike(selectedBikeId)}
              />
            </motion.div>
          )}
          {activeScreen === "Edit" && selectedBikeId && (
            <motion.div
              key="Edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-30"
            >
              <AddBikeScreen
                initialBike={bikes.find(b => b.id === selectedBikeId)!}
                onCancel={() => setActiveScreen("Detail")}
                onSave={async (updatedBike) => {
                  await handleUpdateBike(updatedBike);
                  setActiveScreen("Detail");
                }}
              />
            </motion.div>
          )}
          {activeScreen === "Sell" && selectedBikeId && (
            <motion.div
              key="Sell"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-30"
            >
              <SellingFormScreen
                bike={bikes.find(b => b.id === selectedBikeId)!}
                onBack={navigateBack}
                onSave={handleSellBike}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {["Home", "Add", "Reports"].includes(activeScreen) && (
        <nav className="flex-shrink-0 bg-white border-t border-slate-100 px-8 py-4 pb-safe flex justify-between items-center z-10 w-full xl:rounded-b-[32]">
          <NavButton
            icon={<LayoutDashboard size={24} />}
            label="Home"
            isActive={activeTab === "Home"}
            onClick={() => setActiveScreen("Home")}
          />
          <div className="relative -mt-6">
            <button
              onClick={() => setActiveScreen("Add")}
              className={classNames(
                "w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 border-4 border-white -mt-2",
                activeTab === "Add" ? "bg-slate-800" : "bg-slate-900 hover:bg-slate-800"
              )}
            >
              <PlusCircle size={24} />
            </button>
          </div>
          <NavButton
            icon={<BarChart3 size={24} />}
            label="Reports"
            isActive={activeTab === "Reports"}
            onClick={() => setActiveScreen("Reports")}
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "flex flex-col items-center gap-1 transition-all",
        isActive ? "opacity-100 text-slate-900" : "opacity-40 text-slate-900 hover:opacity-100"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
}
