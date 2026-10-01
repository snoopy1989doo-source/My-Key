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
import BankAccounts from './components/BankAccounts';
import BankAccountModal from './components/BankAccountModal';
import HomeDashboard from './components/HomeDashboard';
import { Plus, House, KeyRound, Building2 } from 'lucide-react';

function UnlockedApp() {
  const { error, setError, setSearchQuery } = useVault();
  const [toolsOpen, setToolsOpen] = useState(false);
  const [tab, setTab] = useState('home');
  const [selectedBank, setSelectedBank] = useState(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

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
  const handleAddBank = () => { setSelectedBank(null); setIsBankModalOpen(true); };
  const handleSelectBank = item => { setSelectedBank(item); setIsBankModalOpen(true); };
  const navigate = next => { setSearchQuery(''); setTab(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setIsItemModalOpen(true);
  };

  const handleOpenSettings = (tab = 'cloud') => {
    setSettingsTab(tab);
    setIsSettingsOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface-950 text-slate-100 flex flex-col font-sans mykey-app">
      {/* Header Bar */}
      <Header
        onOpenTools={() => setToolsOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        onOpenSettings={handleOpenSettings}
        onAddNew={handleAddNew}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        tab={tab}
      />

      {error && <div role="alert" className="p-3 text-amber-300">{error} <button onClick={() => setError('')}>ปิด</button></div>}
      {toolsOpen && <VaultTools onClose={() => setToolsOpen(false)} onSelectItem={handleSelectItem} />}
      {/* Main Content: Vault Items & Categories */}
      <div className="flex-1">
        {tab === 'home' && <HomeDashboard onNavigate={navigate} onAddPassword={handleAddNew} onAddBank={handleAddBank} onSelectPassword={handleSelectItem} onSelectBank={handleSelectBank} />}
        {tab === 'passwords' && <VaultList
          onSelectItem={handleSelectItem}
          onAddNew={handleAddNew}
          onOpenCategoryManager={() => setIsCategoryManagerOpen(true)}
        />}
        {tab === 'banks' && <BankAccounts onAdd={handleAddBank} onSelect={handleSelectBank} />}
      </div>

      <nav className="mykey-bottom-nav no-print" aria-label="เมนูหลัก">
        {[['home', House, 'หน้าหลัก'], ['passwords', KeyRound, 'รหัสผ่าน'], ['banks', Building2, 'ธนาคาร']].map(([id, Icon, label]) => <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => navigate(id)} className={tab === id ? 'active' : ''}><Icon size={21}/><span>{label}</span></button>)}
      </nav>

      {/* Floating Action Button (Mobile Friendly) */}
      <button
        type="button"
        onClick={tab === 'banks' ? handleAddBank : handleAddNew}
        className="mykey-fab no-print"
        title={tab === 'banks' ? 'เพิ่มบัญชีธนาคาร' : 'เพิ่มรหัสผ่าน'}
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
      <BankAccountModal item={selectedBank} isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />

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
