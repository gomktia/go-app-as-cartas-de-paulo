
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Upload, Save, Loader2, Image as ImageIcon, FileText, Headphones, HelpCircle, Copy, Check, AlertTriangle, Database, Edit, Trash2, Plus, RefreshCw, LayoutList, Wand2, Link as LinkIcon, FolderOpen, ChevronDown, ChevronRight, Book, Star, ShoppingBag, FileStack, Files, ArrowRight } from 'lucide-react';
import { PlanTier, ProductCategory, Product, Chapter } from '../types';
import { PRODUCTS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import { Image, Layout } from 'lucide-react';
import MigrationPanel from './MigrationPanel';

interface AdminPanelProps {
    onClose: () => void;
    onSuccess: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<'EDITOR' | 'LIST'>('LIST');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [productList, setProductList] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Setup & Connection State
    const [showSetup, setShowSetup] = useState(false);
    const [copied, setCopied] = useState(false);
    const [connStatus, setConnStatus] = useState<{
        checked: boolean;
        db: boolean;
        storage: boolean;
    }>({ checked: false, db: false, storage: false });

    // Form Data
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        category: 'LETTER' as ProductCategory,
        tier: PlanTier.BASIC,
        price: '',
        isUpsell: false
    });

    // Files & Links State
    const [coverMode, setCoverMode] = useState<'FILE' | 'LINK'>('FILE');
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverLink, setCoverLink] = useState('');

    const [pdfMode, setPdfMode] = useState<'FILE' | 'LINK'>('FILE');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfLink, setPdfLink] = useState('');

    const [audioMode, setAudioMode] = useState<'FILE' | 'LINK'>('FILE');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioLink, setAudioLink] = useState('');

    // Initial Load
    useEffect(() => {
        checkConnections();
        fetchProducts();
    }, []);

    const checkConnections = async () => {
        const { error: dbError } = await supabase.from('products').select('id').limit(1);
        const dbOk = !dbError || (dbError && dbError.code !== '42P01');

        const { data: storageData, error: storageError } = await supabase.storage.from('files').list();
        const storageOk = !storageError && storageData !== null;

        setConnStatus({ checked: true, db: !dbError, storage: storageOk });
    };

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: false });

        if (!error && data) {
            setProductList(data);
            if (data.length === 0) setActiveTab('LIST');
        }
        setLoading(false);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            title: '',
            subtitle: '',
            description: '',
            category: 'LETTER',
            tier: PlanTier.BASIC,
            price: '',
            isUpsell: false
        });
        setCoverFile(null); setCoverLink(''); setCoverMode('FILE');
        setPdfFile(null); setPdfLink(''); setPdfMode('FILE');
        setAudioFile(null); setAudioLink(''); setAudioMode('FILE');
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setFormData({
            title: product.title,
            subtitle: product.subtitle || '',
            description: product.description || '',
            category: product.category,
            tier: product.tier,
            price: product.price ? product.price.toString() : '',
            isUpsell: product.is_upsell
        });

        setCoverMode('LINK'); setCoverLink(product.image_url || '');
        setPdfMode('LINK'); setPdfLink(product.pdf_url || '');
        setAudioMode('LINK'); setAudioLink(product.audio_url || '');

        setActiveTab('EDITOR');
    };

    const handleEditMainCard = () => {
        // Try to find the existing main card config by CATEGORY only
        const mainCard = productList.find(p => p.category === 'LAYOUT');

        if (mainCard) {
            setEditingId(mainCard.id); // Use the REAL database ID (number/bigint)
            setFormData({
                title: mainCard.title,
                subtitle: mainCard.subtitle || '',
                description: mainCard.description || '',
                category: 'LAYOUT',
                tier: PlanTier.BASIC,
                price: '',
                isUpsell: false
            });
            setCoverMode('LINK'); setCoverLink(mainCard.image_url || '');
        } else {
            // New entry - no ID yet
            setEditingId(null);
            setFormData({
                title: 'As Cartas de Paulo',
                subtitle: '13 Cartas • Estudos Profundos • Áudios',
                description: '',
                category: 'LAYOUT',
                tier: PlanTier.BASIC,
                price: '',
                isUpsell: false
            });
            setCoverLink('');
        }
        setActiveTab('EDITOR');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir este produto?')) return;
        setLoading(true);
        const { error } = await supabase.from('products').delete().eq('id', id);
        setLoading(false);
        if (error) {
            alert('Erro ao excluir: ' + error.message);
        } else {
            fetchProducts();
            onSuccess();
        }
    };

    const handleImportDefaults = async () => {
        if (!confirm('Isso copiará todos os produtos padrão para o seu banco de dados. Deseja continuar?')) return;
        setLoading(true);

        try {
            const payload = PRODUCTS.map(p => ({
                title: p.title,
                subtitle: p.subtitle,
                description: p.description,
                category: p.category,
                tier: p.tier,
                price: p.price || null,
                is_upsell: !!p.isUpsell,
                image_url: p.imageUrl,
                pdf_url: p.pdfUrl === '#' ? '' : p.pdfUrl,
                audio_url: p.audioUrl === '#' ? '' : p.audioUrl
            }));

            const { error } = await supabase.from('products').insert(payload);
            if (error) throw error;

            alert('Produtos importados com sucesso!');
            await fetchProducts();
            onSuccess();
        } catch (e: any) {
            alert('Erro na importação: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- AI IMAGE GENERATION ---
    const generateCoverWithAI = async () => {
        if (!formData.title) {
            alert("Digite pelo menos um Título para a IA gerar a capa.");
            return;
        }

        setAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

            const prompt = `Crie uma capa de livro vertical (aspecto 4:5), altamente detalhada e realista, estilo cinematográfico épico e bíblico. 
        Título do livro: "${formData.title}". 
        Subtítulo/Tema: "${formData.subtitle || formData.description}". 
        Estilo: Iluminação dramática, texturas antigas, solene, sagrado, poster de filme. 
        NÃO inclua textos na imagem. Apenas a arte.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{ text: prompt }]
                },
                config: {
                    imageConfig: {
                        aspectRatio: "3:4"
                    }
                }
            });

            let base64String = null;
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    base64String = part.inlineData.data;
                    break;
                }
            }

            if (base64String) {
                const res = await fetch(`data:image/png;base64,${base64String}`);
                const blob = await res.blob();
                const file = new File([blob], `ai_cover_${Date.now()}.png`, { type: "image/png" });

                setCoverMode('FILE');
                setCoverFile(file);
            } else {
                alert("A IA gerou uma resposta de texto em vez de imagem. Tente novamente.");
            }

        } catch (error: any) {
            console.error("AI Gen Error:", error);
            alert("Erro ao gerar imagem: " + (error.message || "Erro desconhecido"));
        } finally {
            setAiLoading(false);
        }
    };


    const uploadFile = async (file: File, folderName: string) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${folderName}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('files').upload(filePath, file);

        if (uploadError) {
            if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('row-level security')) {
                throw new Error(`STORAGE_CONFIG_ERROR: ${uploadError.message}`);
            }
            throw uploadError;
        }

        const { data } = supabase.storage.from('files').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let finalImageUrl = coverLink;
            if (coverMode === 'FILE' && coverFile) {
                finalImageUrl = await uploadFile(coverFile, 'images');
            }

            let finalPdfUrl = pdfLink;
            if (pdfMode === 'FILE' && pdfFile) {
                finalPdfUrl = await uploadFile(pdfFile, 'pdfs');
            }

            let finalAudioUrl = audioLink;
            if (audioMode === 'FILE' && audioFile) {
                finalAudioUrl = await uploadFile(audioFile, 'audios');
            }

            const payload: any = {
                title: formData.title,
                subtitle: formData.subtitle,
                description: formData.description,
                category: formData.category,
                tier: formData.tier,
                price: formData.price ? parseFloat(formData.price) : null,
                is_upsell: formData.category === 'UPSELL',
                image_url: finalImageUrl,
                pdf_url: finalPdfUrl,
                audio_url: finalAudioUrl
            };

            if (editingId) {
                const { error } = await supabase.from('products').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('products').insert([payload]);
                if (error) throw error;
            }

            alert(editingId ? 'Produto atualizado!' : 'Produto criado!');
            if (!editingId) resetForm();
            setActiveTab('LIST');
            fetchProducts();
            onSuccess();

        } catch (error: any) {
            if (error.message?.includes('STORAGE_CONFIG_ERROR') || error.message?.includes('row-level security')) {
                setShowSetup(true);
            } else {
                alert('Erro ao salvar: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const sqlCode = `
-- ATUALIZAÇÃO: CRIAR TABELA DE CAPÍTULOS E CONFIGURAR PERMISSÕES --

-- 1. Tabela de Produtos
create table if not exists products (
  id bigint generated by default as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  subtitle text,
  description text,
  category text not null,
  tier text not null,
  price numeric,
  is_upsell boolean default false,
  image_url text,
  pdf_url text,
  audio_url text
);

-- 2. Tabela de Capítulos (IMPORTANTE: Rode isso para habilitar subpastas)
create table if not exists chapters (
  id bigint generated by default as identity primary key,
  product_id bigint references products(id) on delete cascade not null,
  title text not null,
  order_index integer default 0,
  pdf_url text,
  audio_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Habilitar Segurança (RLS)
alter table products enable row level security;
alter table chapters enable row level security;

-- 4. Permissões de Leitura e Escrita (Totalmente Liberado para o App)
drop policy if exists "Public Read Products" on products;
drop policy if exists "Public Write Products" on products;
create policy "Public Read Products" on products for select using (true);
create policy "Public Write Products" on products for all using (true) with check (true);

drop policy if exists "Public Read Chapters" on chapters;
drop policy if exists "Public Write Chapters" on chapters;
create policy "Public Read Chapters" on chapters for select using (true);
create policy "Public Write Chapters" on chapters for all using (true) with check (true);

-- 5. Configuração do Storage
insert into storage.buckets (id, name, public) values ('files', 'files', true) on conflict (id) do nothing;
drop policy if exists "Public Access Files" on storage.objects;
drop policy if exists "Public Upload Files" on storage.objects;

create policy "Public Access Files" on storage.objects for select using ( bucket_id = 'files' );
create policy "Public Upload Files" on storage.objects for insert with check ( bucket_id = 'files' );
`.trim();

    const handleCopy = () => {
        navigator.clipboard.writeText(sqlCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const ProductListGroup = ({ title, icon: Icon, items }: { title: string, icon: any, items: any[] }) => {
        if (!items || items.length === 0) return null;
        return (
            <div className="mb-10 last:mb-0">
                <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
                    <Icon className="w-5 h-5 text-brand-500" />
                    <h4 className="text-zinc-300 font-bold uppercase text-xs tracking-widest">{title}</h4>
                    <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="grid gap-3">
                    {items.map((product) => (
                        <div key={product.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:border-zinc-600 transition-colors group">
                            <div className="w-12 h-12 bg-zinc-800 rounded overflow-hidden flex-shrink-0">
                                {product.image_url ? (
                                    <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-zinc-600" /></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate">{product.title}</h4>
                                <p className="text-zinc-500 text-xs truncate">{product.subtitle}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 bg-zinc-800 hover:bg-brand-600 text-zinc-400 hover:text-white rounded transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="p-2 bg-zinc-800 hover:bg-red-600 text-zinc-400 hover:text-white rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="h-16 border-b border-zinc-800 bg-zinc-900 px-4 md:px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-brand-500" />
                        Gestão de Conteúdo
                    </h2>

                    <div className="hidden md:flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => { setActiveTab('LIST'); resetForm(); }}
                            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'LIST' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <LayoutList className="w-4 h-4" /> Gerenciar Produtos
                        </button>
                        <button
                            onClick={() => { setActiveTab('EDITOR'); resetForm(); }}
                            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-2 ${activeTab === 'EDITOR' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Plus className="w-4 h-4" /> Criar Novo
                        </button>
                        <button
                            onClick={() => { handleEditMainCard(); }}
                            className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors flex items-center gap-2 ${formData.category === 'LAYOUT' && activeTab === 'EDITOR' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <Layout className="w-4 h-4" /> Editar Capa Principal
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSetup(true)}
                        className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" /> Ajuda SQL
                    </button>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Diagnostics */}
            {connStatus.checked && (!connStatus.db || !connStatus.storage) && (
                <div className="bg-red-900/20 border-b border-red-900/50 px-6 py-2 flex items-center gap-3 shrink-0">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-red-400 text-xs font-bold uppercase">Conexão Instável: Verifique a configuração na Ajuda.</span>
                </div>
            )}

            {/* Mobile Tabs */}
            <div className="md:hidden flex border-b border-zinc-800 shrink-0">
                <button
                    onClick={() => setActiveTab('LIST')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'LIST' ? 'border-brand-500 text-white' : 'border-transparent text-zinc-500'}`}
                >
                    Lista
                </button>
                <button
                    onClick={() => setActiveTab('EDITOR')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'EDITOR' ? 'border-brand-500 text-white' : 'border-transparent text-zinc-500'}`}
                >
                    Editor
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">

                {/* VIEW: LIST */}
                {activeTab === 'LIST' && (
                    <div className="absolute inset-0 overflow-y-auto p-6">
                        <div className="max-w-5xl mx-auto">
                            {/* Migration Panel */}
                            <div className="mb-8">
                                <MigrationPanel />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Produtos Cadastrados ({productList.length})</h3>
                                <button onClick={fetchProducts} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400"><RefreshCw className="w-4 h-4" /></button>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
                            ) : productList.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
                                    <Database className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                    <h4 className="text-zinc-400 font-medium mb-2">Banco de Dados Vazio</h4>
                                    <div className="flex gap-4 justify-center">
                                        <button
                                            onClick={handleImportDefaults}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Copy className="w-4 h-4" /> Importar Produtos Padrão
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('EDITOR')}
                                            className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
                                        >
                                            Criar do Zero
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <ProductListGroup
                                        title="Livros e Cartas"
                                        icon={Book}
                                        items={productList.filter(p => p.category === 'LETTER')}
                                    />

                                    <ProductListGroup
                                        title="Bônus e Materiais Complementares"
                                        icon={Star}
                                        items={productList.filter(p => p.category === 'BONUS')}
                                    />

                                    <ProductListGroup
                                        title="Upsells e Ofertas"
                                        icon={ShoppingBag}
                                        items={productList.filter(p => p.category === 'UPSELL')}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: EDITOR */}
                {activeTab === 'EDITOR' && (
                    <div className="absolute inset-0 overflow-y-auto p-6">
                        <div className="max-w-3xl mx-auto pb-20">
                            <form onSubmit={handleSubmit} className="space-y-8 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                                        <h3 className="text-lg font-semibold text-zinc-300">
                                            {editingId ? 'Editar Produto' : 'Novo Produto'}
                                        </h3>
                                        {editingId && <span className="text-xs bg-brand-900/30 text-brand-500 px-2 py-1 rounded">ID: {editingId}</span>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Título</label>
                                            <input required name="title" value={formData.title} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500" placeholder="Ex: Romanos" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Subtítulo</label>
                                            <input name="subtitle" value={formData.subtitle} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Descrição</label>
                                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500 resize-none" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Categoria</label>
                                            <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500">
                                                <option value="LETTER">Livro / Módulo (Com Capítulos)</option>
                                                <option value="BONUS">Material Complementar (Arquivo Único)</option>
                                                <option value="UPSELL">Upsell / Oferta Extra</option>
                                                <option value="LAYOUT">Configuração de Layout (Sistema)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Plano / Acesso</label>
                                            {formData.category === 'UPSELL' || formData.category === 'LAYOUT' ? (
                                                <div className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-400 text-sm flex items-center gap-2 cursor-not-allowed">
                                                    <ShoppingBag className="w-4 h-4" />
                                                    <span>Venda Avulsa (Independente)</span>
                                                </div>
                                            ) : (
                                                <select name="tier" value={formData.tier} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500">
                                                    <option value={PlanTier.BASIC}>Básico (Liberado p/ Todos)</option>
                                                    <option value={PlanTier.PREMIUM}>Premium (Cadeado)</option>
                                                </select>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">Preço (R$)</label>
                                            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} disabled={formData.category !== 'UPSELL'} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-white outline-none focus:border-brand-500 disabled:opacity-50" placeholder="0.00" />
                                        </div>
                                    </div>

                                    {/* LAYOUT Alert */}
                                    {formData.category === 'LAYOUT' && (
                                        <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg flex items-center gap-3">
                                            <Layout className="w-5 h-5 text-blue-500" />
                                            <p className="text-blue-200 text-sm">Você está editando a <strong>Capa Principal do App</strong>. A imagem que salvar aqui aparecerá como destaque na tela inicial.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-zinc-300 border-b border-zinc-800 pb-2">Arquivos e Links</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                        <div className="space-y-2">
                                            <MediaInput
                                                label="Capa do Produto"
                                                icon={ImageIcon}
                                                mode={coverMode} setMode={setCoverMode}
                                                file={coverFile} setFile={setCoverFile}
                                                link={coverLink} setLink={setCoverLink}
                                                accept="image/*"
                                            />
                                            <button
                                                type="button"
                                                onClick={generateCoverWithAI}
                                                disabled={aiLoading}
                                                className="w-full py-2 bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 border border-purple-500/30 text-white text-xs font-bold uppercase rounded flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-900/20"
                                            >
                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 text-purple-200" />}
                                                {aiLoading ? "Gerando..." : "Gerar Capa com IA"}
                                            </button>
                                        </div>

                                        <MediaInput
                                            label="Arquivo PDF (Geral)"
                                            icon={FileText}
                                            mode={pdfMode} setMode={setPdfMode}
                                            file={pdfFile} setFile={setPdfFile}
                                            link={pdfLink} setLink={setPdfLink}
                                            accept="application/pdf"
                                        />
                                        <MediaInput
                                            label="Áudio/Podcast (Geral)"
                                            icon={Headphones}
                                            mode={audioMode} setMode={setAudioMode}
                                            file={audioFile} setFile={setAudioFile}
                                            link={audioLink} setLink={setAudioLink}
                                            accept="audio/*"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button type="submit" disabled={loading} className="px-8 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 w-full md:w-auto justify-center">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {editingId ? 'Salvar Alterações' : 'Criar Produto'}
                                    </button>
                                </div>
                            </form>

                            {/* CHAPTER MANAGER */}
                            {(formData.category === 'LETTER' || formData.category === 'BONUS' || formData.category === 'UPSELL') && (
                                <div className="mt-8">
                                    {editingId ? (
                                        <ChapterManager productId={editingId} uploadFile={uploadFile} />
                                    ) : (
                                        <div className="p-6 bg-zinc-900/30 border border-dashed border-zinc-700 rounded-xl text-center">
                                            <div className="flex justify-center mb-3">
                                                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                                                    <FolderOpen className="w-6 h-6 text-zinc-500" />
                                                </div>
                                            </div>
                                            <h4 className="text-zinc-300 font-bold mb-1">Gerenciamento de Capítulos</h4>
                                            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-4">
                                                Salve este produto pela primeira vez para desbloquear a adição de capítulos e upload em massa de PDFs.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={handleSubmit}
                                                className="text-brand-500 font-bold text-sm hover:underline flex items-center justify-center gap-1"
                                            >
                                                Salvar agora <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* SETUP MODAL */}
            {showSetup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="p-4 border-b border-zinc-800 bg-zinc-950 rounded-t-xl flex justify-between">
                            <h3 className="font-bold text-white flex gap-2"><AlertTriangle className="text-yellow-500" /> Configuração Supabase</h3>
                            <button onClick={() => setShowSetup(false)}><X className="text-zinc-500" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            <p className="text-zinc-400 text-sm">Rode este SQL no Supabase para criar as tabelas de Capítulos e corrigir permissões:</p>
                            <div className="relative">
                                <pre className="bg-black p-4 rounded text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">{sqlCode}</pre>
                                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-zinc-800 rounded">{copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// --- SUB-COMPONENTS ---

const MediaInput = ({ label, icon: Icon, mode, setMode, file, setFile, link, setLink, accept }: any) => {
    return (
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl overflow-hidden flex flex-col h-full">
            <div className="bg-zinc-950 px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                    <Icon className="w-3 h-3" /> {label}
                </span>
                <div className="flex bg-zinc-900 rounded border border-zinc-800 p-0.5">
                    <button
                        type="button"
                        onClick={() => setMode('FILE')}
                        className={`p-1 rounded ${mode === 'FILE' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Upload de Arquivo"
                    >
                        <Upload className="w-3 h-3" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('LINK')}
                        className={`p-1 rounded ${mode === 'LINK' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                        title="Link Externo (Drive, etc)"
                    >
                        <LinkIcon className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-center">
                {mode === 'FILE' ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center gap-2 border border-dashed border-zinc-700 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                        <Upload className="w-6 h-6 text-zinc-500" />
                        <span className="text-xs text-brand-500 font-bold">Escolher Arquivo</span>
                        <input type="file" accept={accept} onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
                        <span className="text-[10px] text-zinc-500 text-center break-all">{file ? file.name : 'Nenhum selecionado'}</span>
                    </label>
                ) : (
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:border-brand-500 outline-none"
                        />
                        <span className="text-[10px] text-zinc-500">Cole o link compartilhado do Google Drive ou outro local.</span>
                    </div>
                )}
            </div>
        </div>
    )
}

const ChapterManager = ({ productId, uploadFile }: { productId: string, uploadFile: Function }) => {
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Bulk Upload State
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [bulkProgress, setBulkProgress] = useState('');

    // Bulk Link State
    const [isBulkLinking, setIsBulkLinking] = useState(false);
    const [bulkLinkText, setBulkLinkText] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // New Chapter State
    const [title, setTitle] = useState('');
    const [pdfMode, setPdfMode] = useState<'FILE' | 'LINK'>('FILE');
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfLink, setPdfLink] = useState('');
    const [audioMode, setAudioMode] = useState<'FILE' | 'LINK'>('FILE');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioLink, setAudioLink] = useState('');

    useEffect(() => {
        fetchChapters();
    }, [productId]);

    const fetchChapters = async () => {
        const { data } = await supabase.from('chapters').select('*').eq('product_id', productId).order('order_index', { ascending: true });
        if (data) setChapters(data);
    };

    const handleBulkLinks = async () => {
        if (!bulkLinkText.trim()) return;
        if (!confirm('Deseja processar estes links?')) return;
        setLoading(true);

        const lines = bulkLinkText.split('\n').filter(line => line.trim() !== '');
        let successCount = 0;
        let failCount = 0;
        const currentCount = chapters.length;

        try {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                let chapterTitle = `Capítulo ${currentCount + i + 1}`;
                let url = line;

                // Robust URL matching: Find any http/https link in the line
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);

                if (urlMatch) {
                    url = urlMatch[0];
                    // Use the part before the URL as title if it exists and has substance
                    const textBeforeUrl = line.split(url)[0].trim().replace(/[-:]$/, '').trim();
                    if (textBeforeUrl.length > 2) {
                        chapterTitle = textBeforeUrl;
                    }
                } else {
                    // No URL found in this line
                    failCount++;
                    continue;
                }

                await supabase.from('chapters').insert({
                    product_id: parseInt(productId),
                    title: chapterTitle,
                    pdf_url: url,
                    order_index: currentCount + i + 1
                });
                successCount++;
            }
            alert(`Processamento concluído!\nSucesso: ${successCount}\nIgnorados (sem link): ${failCount}`);
            fetchChapters();
            setIsBulkLinking(false);
            setBulkLinkText('');
        } catch (err: any) {
            alert('Erro ao processar links: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!confirm(`Deseja importar ${files.length} arquivos PDF como capítulos?`)) return;

        setIsBulkUploading(true);
        setLoading(true);

        let successCount = 0;
        let failCount = 0;

        try {
            const currentCount = chapters.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setBulkProgress(`Enviando ${i + 1} de ${files.length}: ${file.name}...`);

                try {
                    // 1. Upload File
                    const url = await uploadFile(file, 'chapter_pdfs');

                    // 2. Create Title from Filename (remove .pdf)
                    const chapterTitle = file.name.replace(/\.pdf$/i, '').replace(/_/g, ' ');

                    // 3. Save to DB
                    await supabase.from('chapters').insert({
                        product_id: parseInt(productId),
                        title: chapterTitle,
                        pdf_url: url,
                        order_index: currentCount + i + 1
                    });
                    successCount++;

                } catch (err) {
                    console.error("Erro no arquivo " + file.name, err);
                    failCount++;
                }
            }

            alert(`Importação concluída!\nSucesso: ${successCount}\nFalhas: ${failCount}`);
            fetchChapters();

        } catch (err: any) {
            alert("Erro crítico na importação: " + err.message);
        } finally {
            setLoading(false);
            setIsBulkUploading(false);
            setBulkProgress('');
            // Reset input safely
            if (e.target) e.target.value = '';
        }
    };

    const handleAddChapter = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalPdfUrl = pdfLink;
            if (pdfMode === 'FILE' && pdfFile) finalPdfUrl = await uploadFile(pdfFile, 'chapter_pdfs');

            let finalAudioUrl = audioLink;
            if (audioMode === 'FILE' && audioFile) finalAudioUrl = await uploadFile(audioFile, 'chapter_audios');

            const { error } = await supabase.from('chapters').insert({
                product_id: parseInt(productId), // Safe integer parsing for backend
                title,
                pdf_url: finalPdfUrl,
                audio_url: finalAudioUrl,
                order_index: (chapters?.length || 0) + 1
            });

            if (error) {
                if (error.code === '42P01') {
                    throw new Error("A tabela 'chapters' não foi encontrada. Por favor, vá em 'Ajuda SQL' e rode o código no Supabase.");
                }
                throw error;
            }

            setTitle('');
            setPdfFile(null); setPdfLink('');
            setAudioFile(null); setAudioLink('');
            setIsAdding(false);
            fetchChapters();
        } catch (err: any) {
            alert('ERRO: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChapter = async (id: string) => {
        if (!confirm('Excluir capítulo?')) return;
        const { error } = await supabase.from('chapters').delete().eq('id', id);
        if (error) alert('Erro ao excluir: ' + error.message);
        else fetchChapters();
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-brand-500" />
                    Gerenciar Capítulos
                </h3>

                <div className="flex gap-2">
                    {/* Bulk Link Import Button */}
                    <button
                        type="button"
                        onClick={() => setIsBulkLinking(!isBulkLinking)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wide rounded shadow-lg shadow-blue-900/40 flex items-center gap-2 transition-all transform active:scale-95"
                    >
                        <LinkIcon className="w-4 h-4" />
                        🔗 Importar Links (Drive)
                    </button>

                    {/* Bulk Upload Button */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className={`
                        cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wide rounded shadow-lg shadow-purple-900/40 flex items-center gap-2 transition-all transform active:scale-95
                        ${loading ? 'opacity-50 pointer-events-none' : ''}
                    `}>
                        {isBulkUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {bulkProgress ? 'Enviando...' : 'Carregando'}
                            </>
                        ) : (
                            <>
                                <Files className="w-4 h-4" />
                                📁 Importar PDFs (Bulk)
                            </>
                        )}
                    </button>
                    {/* Hidden input moved outside label to prevent event bubbling issues */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="application/pdf"
                        onChange={handleBulkUpload}
                        onClick={(e) => (e.target as any).value = null}
                        className="hidden"
                    />
                </div>
            </div>

            {/* Bulk Link Input Area */}
            {isBulkLinking && (
                <div className="bg-zinc-950 p-4 rounded-lg border border-blue-900/50 mb-6 animate-in slide-in-from-top-2">
                    <h4 className="text-blue-400 text-sm font-bold mb-2">Colar Lista de Links</h4>
                    <p className="text-zinc-500 text-xs mb-3">
                        Cole uma lista de links do Google Drive ou Vimeo. Um por linha.<br />
                        Formato recomendado: <code>Nome da Aula - https://link...</code> ou apenas o link.
                    </p>
                    <textarea
                        className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded p-2 text-xs text-white outline-none focus:border-blue-500"
                        placeholder={`Aula 01 - https://drive.google.com/...\nAula 02 - https://drive.google.com/...\nhttps://drive.google.com/...`}
                        value={bulkLinkText}
                        onChange={(e) => setBulkLinkText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setIsBulkLinking(false)} className="px-3 py-1.5 text-xs text-zinc-400">Cancelar</button>
                        <button onClick={handleBulkLinks} disabled={loading || !bulkLinkText.trim()} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded">
                            {loading ? 'Processando...' : 'Processar Lista'}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-3 mb-6">
                {chapters.map((chapter) => (
                    <div key={chapter.id} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">{chapter.order_index}</div>
                            <span className="text-white font-medium">{chapter.title}</span>
                            <div className="flex gap-1">
                                {chapter.pdf_url && <FileText className="w-3 h-3 text-blue-400" />}
                                {chapter.audio_url && <Headphones className="w-3 h-3 text-pink-400" />}
                            </div>
                        </div>
                        <button onClick={() => handleDeleteChapter(chapter.id)} className="text-zinc-600 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))}
                {chapters.length === 0 && <p className="text-zinc-600 text-sm italic py-4 text-center border border-dashed border-zinc-800 rounded">Nenhum capítulo cadastrado.</p>}
            </div>

            {/* Manual Add Form */}
            {isAdding ? (
                <form onSubmit={handleAddChapter} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                    <input
                        placeholder="Título do Capítulo (ex: Aula 01)"
                        value={title} onChange={e => setTitle(e.target.value)} required
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-white text-sm outline-none focus:border-brand-500"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <MediaInput label="PDF do Capítulo" icon={FileText} mode={pdfMode} setMode={setPdfMode} file={pdfFile} setFile={setPdfFile} link={pdfLink} setLink={setPdfLink} accept="application/pdf" />
                        <MediaInput label="Áudio do Capítulo" icon={Headphones} mode={audioMode} setMode={setAudioMode} file={audioFile} setFile={setAudioFile} link={audioLink} setLink={setAudioLink} accept="audio/*" />
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-zinc-400">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-3 py-1.5 bg-brand-600 text-white text-sm font-bold rounded hover:bg-brand-500">
                            {loading ? 'Salvando...' : 'Adicionar Capítulo'}
                        </button>
                    </div>
                </form>
            ) : (
                <button onClick={() => setIsAdding(true)} className="w-full py-3 border border-dashed border-zinc-700 text-zinc-500 hover:text-white hover:border-brand-500 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Adicionar Capítulo Manualmente
                </button>
            )}

            {isBulkUploading && (
                <div className="mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400 text-center">
                    {bulkProgress}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
