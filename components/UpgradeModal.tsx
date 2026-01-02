import React from 'react';
import { Product } from '../types';
import { X, Crown, CheckCircle2, ShoppingBag, ArrowRight, Star } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'UPGRADE_PLAN' | 'BUY_UPSELL';
  product?: Product; // Only relevant for BUY_UPSELL
  onConfirm: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, type, product, onConfirm }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const isUpgrade = type === 'UPGRADE_PLAN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className={`relative w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ${isUpgrade ? 'bg-zinc-900 border border-zinc-700 rounded-2xl' : 'bg-transparent'}`}>
        
        {/* Close Button (Absolute) */}
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-105"
        >
            <X className="w-4 h-4" />
        </button>

        {isUpgrade ? (
            // --- LAYOUT UPGRADE PLANO (Existente) ---
            <>
                <div className="h-32 bg-gradient-to-r from-brand-900 to-black flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                    <Crown className="w-16 h-16 text-brand-500 opacity-90 drop-shadow-lg relative z-10" />
                </div>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">{t('modal.unlockPremium')}</h2>
                    <p className="text-zinc-400 mb-6 text-center text-sm">
                        {t('modal.premiumDescription')}
                    </p>

                    <ul className="space-y-3 mb-8 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800">
                        <li className="flex items-center gap-3 text-zinc-300 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                            <span>{t('modal.completeLibrary')}</span>
                        </li>
                        <li className="flex items-center gap-3 text-zinc-300 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                            <span>{t('modal.audioVersions')}</span>
                        </li>
                        <li className="flex items-center gap-3 text-zinc-300 text-sm">
                            <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                            <span>{t('modal.exclusiveBonuses')}</span>
                        </li>
                    </ul>

                    <button
                        onClick={onConfirm}
                        className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 transform hover:scale-[1.02]"
                    >
                        <Crown className="w-5 h-5 fill-current" />
                        {t('modal.becomePremium')}
                    </button>
                </div>
            </>
        ) : (
            // --- LAYOUT UPSELL (Novo estilo Card Visual) ---
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                
                {/* Hero Image Section */}
                <div className="relative h-64 w-full group">
                     {product?.imageUrl ? (
                        <img 
                            src={product.imageUrl} 
                            alt={product.title} 
                            onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=2070"; }}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                     ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <ShoppingBag className="w-16 h-16 text-zinc-600" />
                        </div>
                     )}
                     {/* Gradient Overlay for Text Readability */}
                     <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
                     
                     {/* Badge */}
                     <div className="absolute top-4 left-4 px-3 py-1 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg border border-brand-400/30">
                        {t('modal.specialOffer')}
                     </div>
                </div>

                {/* Content Details */}
                <div className="p-6 relative -mt-12 z-10">
                    <div className="mb-4">
                        <span className="text-brand-500 font-bold tracking-widest text-xs uppercase mb-1 block flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" />
                            {product?.subtitle || t('modal.complementaryMaterial')}
                        </span>
                        <h2 className="text-3xl font-bold text-white leading-tight drop-shadow-sm">
                            {product?.title}
                        </h2>
                    </div>

                    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 p-4 rounded-xl mb-6">
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            {product?.description || 'Adquira este material exclusivo para aprofundar seu conhecimento e transformar seus estudos.'}
                        </p>
                    </div>

                    {/* Footer Action */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-xs uppercase font-bold tracking-wider">{t('modal.uniqueValue')}</span>
                            <span className="text-2xl font-bold text-white">
                                R$ {product?.price?.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-3 bg-white text-black hover:bg-zinc-200 font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10 transform hover:translate-y-[-2px]"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            {t('buttons.buyNow')}
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default UpgradeModal;