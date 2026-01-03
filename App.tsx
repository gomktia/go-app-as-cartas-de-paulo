
import React, { useState, useEffect, useRef } from 'react';
import { PRODUCTS, MOCK_CHAPTERS } from './constants';
import Card from './components/Card';
import Section from './components/Section';
import UpgradeModal from './components/UpgradeModal';
import AdminPanel from './components/AdminPanel';
import LanguageSelector from './components/LanguageSelector';
import { Product, Chapter } from './types';
import { LayoutDashboard, LogOut, User, Database, Settings, ArrowLeft, Book, Library, FileText, Headphones, PlayCircle, X } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { LanguageProvider } from './i18n/LanguageContext';
import { useTranslation } from './i18n/useTranslation';
import { translationService } from './services/translationService';
import { pdfStorageService } from './services/pdfStorageService';

// View State Definition
type ViewState = 'HOME' | 'COLLECTION' | 'CHAPTERS' | 'READER';

function AppContent() {
    const { t, language } = useTranslation();

    // State for owned upsells (no plan tiers anymore - everything is accessible)
    const [ownedUpsells, setOwnedUpsells] = useState<string[]>([]);

    // App Navigation State
    const [currentView, setCurrentView] = useState<ViewState>('HOME');
    const [selectedBook, setSelectedBook] = useState<Product | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [readingDoc, setReadingDoc] = useState<{ url: string, title: string } | null>(null);

    // Dynamic Layout State
    const [mainCardConfig, setMainCardConfig] = useState<Product | null>(null);

    // Start with default products so the screen is never empty
    const [products, setProducts] = useState<Product[]>(PRODUCTS);
    const [loading, setLoading] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    const [usingDbData, setUsingDbData] = useState(false);
    const [translatingPdf, setTranslatingPdf] = useState(false);
    const [translationProgress, setTranslationProgress] = useState('');

    // Ref to track if this is the first render
    const isFirstRender = useRef(true);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'UPGRADE_PLAN' | 'BUY_UPSELL';
        product?: Product;
    }>({ isOpen: false, type: 'UPGRADE_PLAN' });

    // Function to fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            console.log('🔄 Buscando produtos do Supabase...');
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error("❌ Erro ao buscar produtos do Supabase:", error.message);
                setUsingDbData(false);
                setProducts(PRODUCTS);
            } else if (data && data.length > 0) {
                console.log(`✅ ${data.length} produtos carregados do banco de dados!`);
                console.log('📄 Primeiro produto:', data[0]);
                const mappedDbProducts: Product[] = data.map((item: any) => ({
                    id: item.id?.toString() || item.product_id,
                    title: item.title,
                    subtitle: item.subtitle,
                    category: item.category,
                    tier: item.tier,
                    isUpsell: item.is_upsell,
                    price: item.price,
                    description: item.description,
                    imageUrl: item.image_url,
                    pdfUrl: item.pdf_url,
                    audioUrl: item.audio_url
                }));
                const validProducts = mappedDbProducts.filter(p => p.category !== 'LAYOUT');
                console.log(`📦 ${validProducts.length} produtos válidos (sem LAYOUT)`);
                console.log('🔗 URLs dos PDFs:', validProducts.slice(0, 3).map(p => ({
                    title: p.title,
                    pdfUrl: p.pdfUrl?.substring(0, 60)
                })));
                setProducts(validProducts);

                // Extract Layout Config if exists (take the first one found)
                const layoutConfig = mappedDbProducts.find(p => p.category === 'LAYOUT');
                if (layoutConfig) setMainCardConfig(layoutConfig);

                console.log('✅ Usando dados do banco de dados!');
                setUsingDbData(true);
            } else {
                setProducts(PRODUCTS);
                setUsingDbData(false);
            }
        } catch (err) {
            console.error("Unexpected error fetching products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Translate products when language changes
    useEffect(() => {
        if (products.length > 0 && language !== 'pt') {
            translationService.translateProducts(products, language)
                .then(translated => setProducts(translated))
                .catch(err => console.error('Translation error:', err));
        }
    }, [language]);

    // Reset to HOME view when language changes (better UX without reload)
    useEffect(() => {
        if (!isFirstRender.current && currentView !== 'HOME') {
            console.log('🔄 Idioma mudou, voltando para HOME');
            setCurrentView('HOME');
            setSelectedBook(null);
            setChapters([]);
        }
        isFirstRender.current = false;
    }, [language]);

    // Filter products by category
    const letterProducts = products.filter(p => p.category === 'LETTER');
    const bonusProducts = products.filter(p => p.category === 'BONUS');
    const upsellProducts = products.filter(p => p.category === 'UPSELL');

    // --- Helpers ---
    const getEmbeddableUrl = (url: string) => {
        if (!url) return '';
        // If it's a google drive view link, convert to preview
        if (url.includes('drive.google.com') && url.includes('/view')) {
            return url.replace('/view', '/preview');
        }
        return url;
    };

    // --- Actions ---

    const handlePdfClick = async (product: Product | Chapter) => {
        const title = product.title;

        // Check if this is a Chapter (has pdf_url field)
        const isChapter = 'pdf_url' in product && product.pdf_url;

        let pdfUrl: string;

        if (isChapter) {
            // For chapters, use the pdf_url from database
            pdfUrl = (product as Chapter).pdf_url!;
            console.log('📖 Abrindo capítulo:', { title, pdfUrl });
        } else {
            // For products, use pdfUrl from database if available, otherwise construct it
            const prod = product as Product;
            if (prod.pdfUrl && prod.pdfUrl !== '#') {
                pdfUrl = prod.pdfUrl;
                console.log('📖 Abrindo produto (URL do DB):', { title, pdfUrl });
            } else {
                // Fallback: construct URL based on product ID and language
                const productId = product.id;
                const STORAGE_BASE = 'https://dtpydjllcreeibrrtcna.supabase.co/storage/v1/object/public/pdfs';

                if (language === 'pt') {
                    pdfUrl = `${STORAGE_BASE}/originals/${productId}.pdf`;
                } else {
                    pdfUrl = `${STORAGE_BASE}/translated/${productId}-${language}.pdf`;
                }

                console.log('📖 Abrindo produto (URL construída):', { title, language, pdfUrl, productId });
            }
        }

        // Use Mozilla PDF.js viewer for better compatibility across all devices
        const encodedPdfUrl = encodeURIComponent(pdfUrl);
        const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedPdfUrl}`;

        setReadingDoc({ url: viewerUrl, title });
    };

    const handleAudioClick = (product: Product) => {
        if (product.audioUrl && product.audioUrl !== '#') {
            window.open(product.audioUrl, '_blank');
        } else {
            alert(t('alerts.audioUnavailable', { title: product.title }));
        }
    };

    const handleFullCardClick = async (product: Product) => {
        // 1. If it's a LETTER (Book), we handle it as a folder primarily
        if (product.category === 'LETTER') {
            setSelectedBook(product);
            setLoading(true);

            const { data, error } = await supabase
                .from('chapters')
                .select('*')
                .eq('product_id', product.id)
                .eq('language', language)
                .order('order_index', { ascending: true });

            if (data && data.length > 0) {
                setChapters(data);
            } else {
                // Only use mock chapters for Portuguese (since mock data is in PT)
                if (language === 'pt') {
                    const fallback = MOCK_CHAPTERS.filter(c => c.product_id === product.id);
                    setChapters(fallback);
                } else {
                    // For other languages, show empty if no chapters exist
                    setChapters([]);
                }
            }

            setLoading(false);
            setCurrentView('CHAPTERS');
            return;
        }

        // 2. Logic for Upsells (only upsells are locked)
        if (product.category === 'UPSELL' && !ownedUpsells.includes(product.id)) {
            setModalConfig({ isOpen: true, type: 'BUY_UPSELL', product });
            return;
        }

        // 3. If unlocked, check if it has chapters to act as a folder
        setLoading(true);
        const { data: chapterData } = await supabase
            .from('chapters')
            .select('*')
            .eq('product_id', product.id)
            .eq('language', language)
            .order('order_index', { ascending: true });
        setLoading(false);

        if (chapterData && chapterData.length > 0) {
            // Treat as Folder
            setSelectedBook(product);
            setChapters(chapterData);
            setCurrentView('CHAPTERS');
        } else {
            // Treat as Single File
            const link = product.pdfUrl || product.audioUrl;
            if (link && link !== '#') {
                if (product.pdfUrl) handlePdfClick(product);
                else window.open(link, '_blank');
            } else {
                alert(t('alerts.contentNotRegistered', { title: product.title }));
            }
        }
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
    };

    const handleConfirmPurchase = () => {
        if (modalConfig.type === 'BUY_UPSELL' && modalConfig.product) {
            setOwnedUpsells(prev => [...prev, modalConfig.product!.id]);
            alert(t('alerts.upsellPurchaseSuccess', { title: modalConfig.product.title }));
        }
        closeModal();
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-brand-500/30 relative">

            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {currentView !== 'HOME' ? (
                            <button
                                onClick={() => setCurrentView('HOME')}
                                className="p-2 -ml-2 hover:bg-zinc-800 rounded-full transition-colors group"
                            >
                                <ArrowLeft className="w-5 h-5 text-zinc-400 group-hover:text-white" />
                            </button>
                        ) : (
                            <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-brand-900 rounded-lg flex items-center justify-center shadow-lg shadow-brand-900/20">
                                <LayoutDashboard className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <span className="font-bold text-lg tracking-tight hidden sm:block">{t('header.title')}</span>
                        {usingDbData && (
                            <span className="flex items-center gap-1 text-[10px] bg-green-900/30 text-green-500 px-2 py-0.5 rounded border border-green-500/20">
                                <Database className="w-3 h-3" /> {t('header.online')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSelector />

                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors">
                            <User className="w-4 h-4 text-zinc-400" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl">

                {/* --- VIEW: HOME (Main Folder + Bonuses + Upsells) --- */}
                {currentView === 'HOME' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 1. Main Module Folder Card */}
                        <Section title={t('sections.mainModule')} subtitle={t('sections.mainModuleSubtitle')}>
                            <div
                                onClick={() => setCurrentView('COLLECTION')}
                                className="group relative h-48 sm:h-56 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-6 overflow-hidden cursor-pointer hover:border-brand-500 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-900/20 flex flex-col justify-end"
                            >
                                {/* Background Decoration */}
                                <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10 group-hover:opacity-20 transition-opacity">
                                    <Library className="w-40 h-40 text-white" />
                                </div>

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-brand-600 rounded-lg flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                        <Book className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-brand-400 transition-colors">
                                        {mainCardConfig?.title || t('sections.mainCollection')}
                                    </h3>
                                    <p className="text-zinc-400 text-sm font-medium">
                                        {mainCardConfig?.subtitle || t('sections.mainCollectionDesc')}
                                    </p>
                                </div>

                                {/* Dynamic Background Image */}
                                {mainCardConfig?.imageUrl && (
                                    <div className="absolute inset-0 z-0">
                                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-900/50 mix-blend-multiply z-10" />
                                        <img src={mainCardConfig.imageUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                                    </div>
                                )}

                                {/* Hover effect overlay */}
                                <div className="absolute inset-0 bg-brand-500/0 group-hover:bg-brand-500/5 transition-colors" />
                            </div>
                        </Section>

                        {/* 2. Bonus Content */}
                        <Section
                            title={t('sections.bonusContent')}
                            subtitle={t('sections.bonusContentSubtitle')}
                        >
                            {bonusProducts.map(product => (
                                <Card
                                    key={product.id}
                                    product={product}
                                    isUpsellOwned={false}
                                    onPdfClick={() => { }}
                                    onAudioClick={() => { }}
                                    onCardClick={handleFullCardClick}
                                />
                            ))}
                        </Section>

                        {/* 3. Upsells */}
                        <Section
                            title={t('sections.upsells')}
                            subtitle={t('sections.upsellsSubtitle')}
                        >
                            {upsellProducts.map(product => (
                                <Card
                                    key={product.id}
                                    product={product}
                                    isUpsellOwned={ownedUpsells.includes(product.id)}
                                    onPdfClick={() => { }}
                                    onAudioClick={() => { }}
                                    onCardClick={handleFullCardClick}
                                />
                            ))}
                        </Section>
                    </div>
                )}

                {/* --- VIEW: COLLECTION (List of Books) --- */}
                {currentView === 'COLLECTION' && (
                    <div className="animate-in zoom-in-95 duration-300">
                        <div className="mb-8 flex flex-col gap-2">
                            <button
                                onClick={() => setCurrentView('HOME')}
                                className="text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 w-fit mb-2 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> {t('collection.backToHome')}
                            </button>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">{t('collection.letters')}</h1>
                            <p className="text-zinc-400 max-w-2xl">
                                {t('collection.lettersDescription')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {letterProducts.length > 0 ? letterProducts.map(product => (
                                <Card
                                    key={product.id}
                                    product={product}
                                    isUpsellOwned={false}
                                    onPdfClick={() => handlePdfClick(product)}
                                    onAudioClick={handleAudioClick}
                                    onCardClick={handleFullCardClick}
                                />
                            )) : (
                                <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl">
                                    <Book className="w-12 h-12 text-zinc-700 mb-4" />
                                    <p className="text-zinc-500">{t('collection.noLettersFound')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- VIEW: CHAPTERS (Inside a Book) --- */}
                {currentView === 'CHAPTERS' && selectedBook && (
                    <div className="animate-in slide-in-from-right duration-300">
                        <div className="mb-8">
                            <button
                                onClick={() => setCurrentView(selectedBook.category === 'LETTER' ? 'COLLECTION' : 'HOME')}
                                className="text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-widest flex items-center gap-2 w-fit mb-4 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> {t('chapters.back')}
                            </button>

                            {/* Book Header */}
                            <div className="flex items-start gap-6 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                                <div className="w-20 h-28 md:w-32 md:h-44 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0 shadow-xl">
                                    <img src={selectedBook.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <span className="text-brand-500 text-xs font-bold uppercase tracking-widest">
                                        {selectedBook.category === 'BONUS' ? t('chapters.bonusSelected') : t('chapters.bookSelected')}
                                    </span>
                                    <h1 className="text-3xl md:text-5xl font-bold text-white mt-1 mb-2">{selectedBook.title}</h1>
                                    <p className="text-zinc-400 text-lg">{selectedBook.subtitle}</p>
                                    <p className="text-zinc-500 text-sm mt-4 max-w-xl">{selectedBook.description}</p>

                                    {/* General Links (Whole Book) */}
                                    <div className="flex gap-3 mt-6">
                                        {selectedBook.pdfUrl && (
                                            <button onClick={() => handlePdfClick(selectedBook)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-bold flex items-center gap-2 transition-colors">
                                                <FileText className="w-4 h-4 text-blue-400" /> {t('buttons.completePdf')}
                                            </button>
                                        )}
                                        {selectedBook.audioUrl && (
                                            <button
                                                onClick={() => window.open(selectedBook.audioUrl, '_blank')}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm font-bold flex items-center gap-2 transition-colors"
                                            >
                                                <Headphones className="w-4 h-4 text-brand-500" />
                                                {t('buttons.completeAudio')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-6 pl-2 border-l-4 border-brand-500">{t('chapters.chaptersTitle')}</h3>

                        <div className="grid gap-4">
                            {chapters.length > 0 ? chapters.map((chapter) => (
                                <div key={chapter.id} className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center justify-between group transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold group-hover:bg-brand-600 group-hover:text-white transition-colors">
                                            {chapter.order_index}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold">{chapter.title}</h4>
                                            <span className="text-xs text-zinc-500">{t('chapters.individualChapter')}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {/* PDF Button */}
                                        <button
                                            onClick={() => handlePdfClick(chapter)}
                                            className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                            title={t('buttons.readPdf')}
                                        >
                                            <FileText className="w-5 h-5 text-blue-400" />
                                        </button>

                                        {/* Audio Button */}
                                        <button
                                            onClick={() => {
                                                if (chapter.audio_url && chapter.audio_url !== '#') {
                                                    window.open(chapter.audio_url, '_blank');
                                                } else {
                                                    alert(t('alerts.chapterAudioNotRegistered'));
                                                }
                                            }}
                                            className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors relative"
                                            title={t('buttons.listenAudio')}
                                        >
                                            <PlayCircle className="w-5 h-5 text-brand-500" />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-10 text-center text-zinc-500 bg-zinc-900/50 rounded-xl border border-dashed border-zinc-800">
                                    {t('chapters.noChapters')}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer info */}
                <div className="mt-12 py-8 border-t border-zinc-900 flex flex-col items-center">
                    <p className="text-zinc-600 text-sm">{t('footer.copyright')}</p>

                    <div className="flex justify-center gap-4 mt-2 text-zinc-600 text-sm">
                        <span className="hover:text-zinc-400 cursor-pointer">{t('footer.terms')}</span>
                        <span className="hover:text-zinc-400 cursor-pointer">{t('footer.privacy')}</span>
                        <span className="hover:text-zinc-400 cursor-pointer flex items-center gap-1">
                            <LogOut className="w-3 h-3" /> {t('footer.logout')}
                        </span>
                    </div>

                    {/* Admin Trigger */}
                    <button
                        onClick={() => setShowAdmin(true)}
                        className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-700 hover:text-brand-500 transition-colors bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800 hover:border-brand-900"
                    >
                        <Settings className="w-3 h-3" /> {t('footer.adminArea')}
                    </button>
                </div>
            </main>

            {/* PDF Translation Loading Overlay */}
            {translatingPdf && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-8 max-w-md flex flex-col items-center gap-4 shadow-2xl">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                            <FileText className="w-6 h-6 text-brand-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-bold text-lg mb-2">
                                {language === 'es' && 'Traduciendo PDF...'}
                                {language === 'en' && 'Translating PDF...'}
                                {language === 'fr' && 'Traduction du PDF...'}
                                {language === 'pt' && 'Carregando PDF...'}
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                {translationProgress || (language === 'pt' ? 'Aguarde...' : 'Please wait...')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* READER OVERLAY */}
            {readingDoc && (
                <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
                        <h3 className="text-white font-bold truncate max-w-md flex items-center gap-2">
                            <Book className="w-4 h-4 text-brand-500" />
                            {readingDoc.title}
                        </h3>
                        <button
                            onClick={() => setReadingDoc(null)}
                            className="p-2 bg-zinc-800 hover:bg-red-900/50 hover:text-red-500 text-zinc-400 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 bg-zinc-900/50 relative">
                        <iframe
                            src={readingDoc.url}
                            className="w-full h-full border-0"
                            title={t('reader.pdfReader')}
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {/* Upgrade/Upsell Modal */}
            <UpgradeModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                type={modalConfig.type}
                product={modalConfig.product}
                onConfirm={handleConfirmPurchase}
            />

            {/* Admin Panel */}
            {showAdmin && (
                <AdminPanel
                    onClose={() => setShowAdmin(false)}
                    onSuccess={fetchProducts}
                />
            )}
        </div>
    );
}

// Wrap App with LanguageProvider
export default function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    );
}
