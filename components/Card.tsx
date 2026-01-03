
import React from 'react';
import { Product } from '../types';
import { Lock, FileText, Headphones, Play, BookOpen } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface CardProps {
  product: Product;
  isUpsellOwned: boolean;
  onPdfClick: (product: Product) => void;
  onAudioClick: (product: Product) => void;
  onCardClick: (product: Product) => void;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  product,
  isUpsellOwned,
  onPdfClick,
  onAudioClick,
  onCardClick,
  className = ''
}) => {
  const { t } = useTranslation();
  const isLetter = product.category === 'LETTER';

  // Only upsells are locked (if not owned)
  const isFullyLocked = product.category === 'UPSELL' && !isUpsellOwned;

  // --- RENDER FOR LETTERS (Open Folder) ---
  if (isLetter) {
    return (
      <div
        onClick={() => onCardClick(product)}
        className={`flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all duration-300 group cursor-pointer aspect-[4/5] ${className}`}
      >
        {/* Image */}
        <div className="flex-1 relative bg-zinc-800 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070"; }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90" />

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-bold text-xl leading-tight shadow-black drop-shadow-md mb-1">{product.title}</h3>
            {product.subtitle && <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{product.subtitle}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-zinc-950 border-t border-zinc-800">
          <button className="w-full py-2 rounded bg-zinc-900 hover:bg-brand-600 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            <BookOpen className="w-4 h-4" /> {t('buttons.openBook')}
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER FOR BONUSES & UPSELLS (Full Lock) ---
  return (
    <div
      onClick={() => onCardClick(product)}
      className={`
        relative group rounded-xl border transition-all duration-300 overflow-hidden cursor-pointer
        flex flex-col aspect-[4/5] ${className}
        ${isFullyLocked
          ? 'border-zinc-800 bg-zinc-900/30 opacity-70 hover:opacity-100 hover:border-brand-500/50 hover:bg-zinc-900'
          : 'border-zinc-700 bg-zinc-900 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-900/20'
        }
      `}
    >
      {/* Locked Overlay */}
      {isFullyLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[1px] transition-all group-hover:backdrop-blur-none group-hover:bg-black/50">
          <div className="bg-zinc-950 p-3 rounded-full border border-zinc-700 shadow-xl group-hover:scale-110 group-hover:border-brand-500/50 transition-all mb-2">
            <Lock className="w-6 h-6 text-zinc-500 group-hover:text-brand-500 transition-colors" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white">
            {product.isUpsell ? t('buttons.buyNow') : t('modal.premiumExclusive')}
          </span>
        </div>
      )}

      {/* Image Area */}
      <div className="flex-1 relative overflow-hidden bg-zinc-800">
        <img
          src={product.imageUrl}
          alt={product.title}
          onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070"; }}
          className={`w-full h-full object-cover transition-transform duration-500 ${isFullyLocked ? 'grayscale opacity-50' : 'group-hover:scale-105'}`}
        />
        {!isFullyLocked && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur-md rounded text-xs font-medium text-white border border-white/10">
            {product.category === 'BONUS' ? t('modal.bonus') : t('modal.file')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />
      </div>

      {/* Content Area */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800 relative z-10">
        <h3 className="text-lg font-bold text-white leading-tight mb-1 group-hover:text-brand-500 transition-colors line-clamp-1">
          {product.title}
        </h3>
        {product.subtitle && (
          <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-semibold line-clamp-1">
            {product.subtitle}
          </p>
        )}

        {/* Footer/Price */}
        <div className="mt-2 pt-2 border-t border-zinc-800 flex items-center justify-between">
          {product.isUpsell && isFullyLocked ? (
            <span className="text-brand-500 font-bold text-sm">R$ {product.price?.toFixed(2).replace('.', ',')}</span>
          ) : isFullyLocked ? (
            <span className="text-xs text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1">
              {t('buttons.locked')}
            </span>
          ) : (
            <span className="text-green-400 text-xs uppercase font-bold tracking-widest flex items-center gap-1">
              <Play className="w-3 h-3 fill-current" /> {t('buttons.access')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
