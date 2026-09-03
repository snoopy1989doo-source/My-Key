import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import SetupScreen from './components/SetupScreen';
import UnlockScreen from './components/UnlockScreen';
import Header from './components/Header';
import VaultList from './components/VaultList';
import VaultItemModal from './components/VaultItemModal';
import PasswordGeneratorModal from './components/PasswordGeneratorModal';
import SettingsModal from './components/SettingsModal';
import { Plus } from 'lucide-react';

function VaultApp() {
  const { isSetup, isLocked } = useVault();

  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('cloud');

  // If vault is not yet created
  if (!isSetup) {
    return <SetupScreen />;
  }

  // If vault is locked
  if (isLocked) {
    return <UnlockScreen />;
  }

  const handleAddNew = () => {
    setSelectedItem(null);
    setIsItemModalOpen(true);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleOpenSettings = (tab = 'cloud') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans">
      {/* Header Bar */}
      <Header
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenSettings={handleOpenSettings}
        onAddNew={handleAddNew}
      />

      {/* Main Content: Vault Items & Categories */}
      <main className="flex-1">
        <VaultList
          onSelectItem={handleSelectItem}
          onAddNew={handleAddNew}
        />
      </main>

      {/* Floating Action Button (Mobile Friendly) */}
      <button
        type="button"
        onClick={handleAddNew}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-surface-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 active:scale-95 transition-transform z-20"
        title="เพิ่มรายการใหม่"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* Modals */}
      <VaultItemModal
        item={selectedItem}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <VaultApp />
    </VaultProvider>
  );
}
