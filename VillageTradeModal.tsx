import React, { useState } from 'react';
import {
  Coins,
  X,
  Check,
  ShoppingBag,
  Sparkles,
  Wheat,
  Hammer,
  Backpack,
  Shield,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Monster } from './types';
import { DungeonsGearItem, DungeonsInventoryState } from './src/dungeons/types';
import { ALL_ARMOR, ALL_MELEE_WEAPONS, ALL_ARTIFACTS } from './src/dungeons/dungeonsData';

interface TradeOffer {
  id: string;
  name: string;
  type: 'buy_item' | 'sell_material';
  icon: string;
  rarity?: 'common' | 'rare' | 'unique';
  description: string;
  costEmeralds?: number;
  costMaterial?: { name: string; key: 'wood' | 'stone' | 'iron' | 'crystals'; amount: number };
  rewardEmeralds?: number;
  rewardType: 'gear' | 'food' | 'potion' | 'arrows' | 'emeralds' | 'artifact';
  gearItem?: DungeonsGearItem;
  rewardAmount?: number;
}

interface VillageTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeVillager?: Monster | null;
  emeralds: number;
  resources: {
    wood: number;
    stone: number;
    iron: number;
    crystals: number;
  };
  onExecuteTrade: (trade: TradeOffer) => void;
}

export const VillageTradeModal: React.FC<VillageTradeModalProps> = ({
  isOpen,
  onClose,
  activeVillager,
  emeralds,
  resources,
  onExecuteTrade,
}) => {
  const [activeMerchantTab, setActiveMerchantTab] = useState<'farmer' | 'blacksmith' | 'trader'>(
    (activeVillager?.villagerRole as 'farmer' | 'blacksmith' | 'trader') || 'farmer'
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // --- MERCHANT CATALOGUES ---
  const farmerTrades: TradeOffer[] = [
    {
      id: 'farmer_bread',
      name: 'Fresh Village Bread',
      type: 'buy_item',
      icon: '🍞',
      costEmeralds: 8,
      rewardType: 'food',
      rewardAmount: 1,
      description: 'Restores +35 HP instantly during exploration.',
    },
    {
      id: 'farmer_golden_apple',
      name: 'Enchanted Golden Apple',
      type: 'buy_item',
      icon: '🍏',
      rarity: 'rare',
      costEmeralds: 35,
      rewardType: 'food',
      rewardAmount: 1,
      description: 'Grants +120 HP restoration and a protective golden aura.',
    },
    {
      id: 'farmer_swift_tonic',
      name: 'Swiftness Herbal Tonic',
      type: 'buy_item',
      icon: '🧪',
      costEmeralds: 20,
      rewardType: 'potion',
      rewardAmount: 1,
      description: 'Boosts movement speed by +40% for 30 seconds.',
    },
    {
      id: 'farmer_sell_wood',
      name: 'Sell 10 Pine Wood',
      type: 'sell_material',
      icon: '🪵',
      costMaterial: { name: 'Wood', key: 'wood', amount: 10 },
      rewardEmeralds: 6,
      rewardType: 'emeralds',
      description: 'The farmers pay emeralds to fortify their barns.',
    },
    {
      id: 'farmer_sell_stone',
      name: 'Sell 10 Cobblestone',
      type: 'sell_material',
      icon: '🪨',
      costMaterial: { name: 'Stone', key: 'stone', amount: 10 },
      rewardEmeralds: 6,
      rewardType: 'emeralds',
      description: 'The villagers need cobblestone to repair the town well.',
    },
  ];

  const blacksmithTrades: TradeOffer[] = [
    {
      id: 'smith_iron_plate',
      name: 'Hammered Iron Breastplate',
      type: 'buy_item',
      icon: '🛡️',
      rarity: 'common',
      costEmeralds: 45,
      rewardType: 'gear',
      gearItem: ALL_ARMOR.find((a) => a.id === 'iron_plate'),
      description: 'Sturdy hammered iron plate with +35 HP and 18% damage reduction.',
    },
    {
      id: 'smith_diamond_champion',
      name: "Champion's Diamond Armor",
      type: 'buy_item',
      icon: '👑',
      rarity: 'unique',
      costEmeralds: 180,
      rewardType: 'gear',
      gearItem: ALL_ARMOR.find((a) => a.id === 'champion_armor'),
      description: 'Masterwork armor: +110 Max HP, -38% Damage reduction, radiant defiance!',
    },
    {
      id: 'smith_golden_carapace',
      name: 'Golden Knight Carapace',
      type: 'buy_item',
      icon: '✨',
      rarity: 'unique',
      costEmeralds: 160,
      rewardType: 'gear',
      gearItem: ALL_ARMOR.find((a) => a.id === 'golden_knight_armor'),
      description: 'Gilded plate: +85 HP, -30% Damage reduction, emerald combat drops.',
    },
    {
      id: 'smith_wolf_armor',
      name: 'Wolf Hunter Armor',
      type: 'buy_item',
      icon: '🐺',
      rarity: 'rare',
      costEmeralds: 90,
      rewardType: 'gear',
      gearItem: ALL_ARMOR.find((a) => a.id === 'wolf_armor'),
      description: 'Agile cured hide: +35 HP, +10% Speed, and healing aura.',
    },
    {
      id: 'smith_arrows',
      name: 'Quiver of 30 Arrows',
      type: 'buy_item',
      icon: '🏹',
      costEmeralds: 15,
      rewardType: 'arrows',
      rewardAmount: 30,
      description: 'Finely fletched arrows for your bows and crossbows.',
    },
    {
      id: 'smith_sell_iron',
      name: 'Sell 8 Refined Iron',
      type: 'sell_material',
      icon: '⛓️',
      costMaterial: { name: 'Iron', key: 'iron', amount: 8 },
      rewardEmeralds: 20,
      rewardType: 'emeralds',
      description: 'Blacksmith Donald pays top emerald rates for refined metals.',
    },
  ];

  const traderTrades: TradeOffer[] = [
    {
      id: 'trader_totem',
      name: 'Totem of Undying',
      type: 'buy_item',
      icon: '🗿',
      rarity: 'unique',
      costEmeralds: 260,
      rewardType: 'artifact',
      description: 'Mystic relic: cheat death! Revives you with 50% HP upon fatal damage.',
    },
    {
      id: 'trader_mushroom',
      name: 'Death Cap Mushroom',
      type: 'buy_item',
      icon: '🍄',
      rarity: 'rare',
      costEmeralds: 120,
      rewardType: 'artifact',
      description: 'Increases attack speed and movement speed by +100% for 9 seconds.',
    },
    {
      id: 'trader_pearl',
      name: 'Ender Pearl Bundle (x3)',
      type: 'buy_item',
      icon: '🔮',
      costEmeralds: 40,
      rewardType: 'potion',
      rewardAmount: 3,
      description: 'Hurls through space, teleporting you forward across obstacles.',
    },
    {
      id: 'trader_sell_crystals',
      name: 'Trade 5 Mystic Crystals',
      type: 'sell_material',
      icon: '💎',
      costMaterial: { name: 'Crystals', key: 'crystals', amount: 5 },
      rewardEmeralds: 30,
      rewardType: 'emeralds',
      description: 'The Wandering Trader seeks pure arcane crystals from distant monuments.',
    },
  ];

  const currentTrades =
    activeMerchantTab === 'farmer'
      ? farmerTrades
      : activeMerchantTab === 'blacksmith'
      ? blacksmithTrades
      : traderTrades;

  const handleTradeClick = (trade: TradeOffer) => {
    // Check affordability
    if (trade.type === 'buy_item') {
      if (emeralds < (trade.costEmeralds || 0)) {
        return;
      }
    } else if (trade.costMaterial) {
      if (resources[trade.costMaterial.key] < trade.costMaterial.amount) {
        return;
      }
    }

    onExecuteTrade(trade);
    setSuccessMessage(`Purchased ${trade.name}!`);
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  return (
    <div
      id="village-trade-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="village-trade-modal"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col mc-panel-dark text-white overflow-hidden"
        style={{ fontFamily: "'VT323', monospace" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181818] border-b-2 border-black">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 mc-slot-dark flex items-center justify-center text-xl text-emerald-400">
              🏪
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-wider text-emerald-400 leading-tight">VILLAGE MARKETPLACE</h2>
              <p className="text-xs text-gray-400 font-mono">Trade emeralds, rare equipment & supplies with villagers</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Emerald Pouch */}
            <div className="mc-slot-dark px-2.5 py-1 flex items-center gap-1.5 text-emerald-400 text-sm font-bold">
              <span>💎</span>
              <span className="font-mono">{emeralds} Emeralds</span>
            </div>

            <button
              id="close-village-trade-btn"
              onClick={onClose}
              className="mc-btn px-2 py-1 text-sm"
              title="Close (ESC)"
            >
              <X className="w-5 h-5 inline" />
            </button>
          </div>
        </div>

        {/* Merchant Selector Tabs */}
        <div className="flex border-b-2 border-black bg-[#151515] px-3 pt-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveMerchantTab('farmer')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
              activeMerchantTab === 'farmer'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            <Wheat className="w-4 h-4" />
            <span>FARMER GILES</span>
          </button>

          <button
            onClick={() => setActiveMerchantTab('blacksmith')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
              activeMerchantTab === 'blacksmith'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            <Hammer className="w-4 h-4" />
            <span>BLACKSMITH DONALD</span>
          </button>

          <button
            onClick={() => setActiveMerchantTab('trader')}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-bold border-t-2 border-x-2 cursor-pointer transition-none ${
              activeMerchantTab === 'trader'
                ? 'mc-panel text-black border-black font-bold'
                : 'mc-btn text-gray-300'
            }`}
          >
            <Backpack className="w-4 h-4" />
            <span>WANDERING TRADER</span>
          </button>
        </div>

        {/* Resources Stock Bar */}
        <div className="px-4 py-2 bg-[#1b1b1b] border-b-2 border-black flex items-center justify-between text-xs text-gray-300 flex-wrap gap-2">
          <span className="font-bold text-gray-400 uppercase tracking-wider">Your Inventory Stock:</span>
          <div className="flex items-center gap-3 font-mono text-sm">
            <span className="flex items-center gap-1">🪵 Wood: <strong className="text-amber-400">{resources.wood}</strong></span>
            <span className="flex items-center gap-1">🪨 Stone: <strong className="text-gray-200">{resources.stone}</strong></span>
            <span className="flex items-center gap-1">⛓️ Iron: <strong className="text-sky-300">{resources.iron}</strong></span>
            <span className="flex items-center gap-1">💎 Crystals: <strong className="text-purple-400">{resources.crystals}</strong></span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mx-4 mt-3 p-2.5 mc-slot-dark border-green-500 text-green-400 text-sm font-bold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Trades Catalog List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {currentTrades.map((trade) => {
            const canAfford =
              trade.type === 'buy_item'
                ? emeralds >= (trade.costEmeralds || 0)
                : trade.costMaterial
                ? resources[trade.costMaterial.key] >= trade.costMaterial.amount
                : false;

            const rarityBadgeColor =
              trade.rarity === 'unique'
                ? 'bg-amber-500/20 text-yellow-300 border-yellow-500/60'
                : trade.rarity === 'rare'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/60'
                : 'bg-stone-700/40 text-gray-300 border-gray-600';

            return (
              <div
                key={trade.id}
                className="p-3 border-2 mc-slot-dark hover:bg-[#202020] transition-none flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-3xl p-2 bg-black border border-gray-700 flex-shrink-0">
                    {trade.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-base text-white truncate">{trade.name}</h4>
                      {trade.rarity && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${rarityBadgeColor}`}
                        >
                          {trade.rarity}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{trade.description}</p>
                  </div>
                </div>

                {/* Price and Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 flex-shrink-0">
                  {trade.type === 'buy_item' ? (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">PRICE</span>
                      <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                        <span>💎</span>
                        <span className="font-mono">{trade.costEmeralds} Emeralds</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">OFFER</span>
                      <div className="flex items-center gap-1 text-amber-300 font-bold text-sm">
                        <span className="font-mono">{trade.costMaterial?.amount} {trade.costMaterial?.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 inline" />
                        <span className="text-emerald-400 font-mono">+{trade.rewardEmeralds} Em</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleTradeClick(trade)}
                    disabled={!canAfford}
                    className={`px-4 py-1.5 text-sm font-bold uppercase tracking-wider transition-none flex items-center gap-1.5 ${
                      canAfford
                        ? 'mc-btn-green'
                        : 'mc-btn opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {trade.type === 'buy_item' ? 'PURCHASE' : 'SELL'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#181818] border-t-2 border-black text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-300">Quick Key:</span>
            <kbd className="px-1.5 py-0.5 bg-black text-emerald-300 border border-gray-700 font-mono text-xs">
              E
            </kbd>
            <span>Talk & Trade with nearby Villagers</span>
          </div>

          <button
            onClick={onClose}
            className="mc-btn px-4 py-1.5 text-sm font-bold"
          >
            Leave Market
          </button>
        </div>
      </div>
    </div>
  );
};
