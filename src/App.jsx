import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import SetupScreen from './components/SetupScreen';
import UnlockScreen from './components/UnlockScreen';
import Header from './components/Header';
import VaultList from './components/VaultList';
import VaultItemModal from './components/VaultItemModal';
import PasswordGeneratorModal from './components/PasswordGeneratorModal';
import SettingsModal from './components/SettingsModal';
import CategoryManagerModal from './components/CategoryManagerModal';
import PrintVaultModal from './components/PrintVaultModal';
import VaultTools from './components/VaultTools';
import { Plus } from 'lucide-react';

function UnlockedApp() {
  const { error, setError } = useVault();
  const [toolsOpen, setToolsOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('cloud');

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
        onOpenTools={() => setToolsOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenSettings={handleOpenSettings}
        onAddNew={handleAddNew}
        onOpenPrint={() => setIsPrintModalOpen(true)}
      />

      {error && <div role="alert" className="p-3 text-amber-300">{error} <button onClick={() => setError('')}>ปิด</button></div>}
      {toolsOpen && <VaultTools onClose={() => setToolsOpen(false)} onSelectItem={handleSelectItem} />}
      {/* Main Content: Vault Items & Categories */}
      <main className="flex-1">
        <VaultList
          onSelectItem={handleSelectItem}
          onAddNew={handleAddNew}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
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

      {isSettingsOpen && <SettingsModal key={settingsTab}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsTab}
        onOpenPrint={() => setIsPrintModalOpen(true)}
      />}

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />

      <PrintVaultModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
}

function VaultApp() {
  const { isSetup, isLocked } = useVault();
  if (!isSetup) return <SetupScreen />;
  if (isLocked) return <UnlockScreen />;
  return <UnlockedApp />;
}

export default function App() {
  return (
    <VaultProvider>
      <VaultApp />
    </VaultProvider>
  );
}
