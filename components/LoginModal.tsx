/**
 * Modal de Login com Email
 * Sistema simples: Magic Link ou Código de Verificação
 */

import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  /**
   * Enviar Magic Link ou Código
   */
  const handleSendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor, insira um email válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Opção 1: Magic Link (Supabase Auth)
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (authError) throw authError;

      setStep('code');
      setError('');

    } catch (err: any) {
      console.error('Erro ao enviar magic link:', err);
      setError('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificar código OTP
   */
  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setError('Código deve ter 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token: code,
        type: 'email'
      });

      if (verifyError) throw verifyError;

      // Login bem-sucedido
      console.log('✅ Login bem-sucedido:', data.user?.email);
      onSuccess(data.user?.email || email);
      onClose();

    } catch (err: any) {
      console.error('Erro ao verificar código:', err);
      setError('Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            {step === 'email' ? 'Fazer Login' : 'Verificar Email'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Step 1: Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              Insira seu email para acessar seu conteúdo
            </p>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMagicLink()}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-brand-500 transition-colors"
                disabled={loading}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleSendMagicLink}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Enviar Código de Acesso
                </>
              )}
            </button>

            <p className="text-xs text-zinc-500 text-center mt-4">
              Você receberá um código de 6 dígitos no seu email
            </p>
          </div>
        )}

        {/* Step 2: Código */}
        {step === 'code' && (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm">
                ✅ Código enviado para <strong>{email}</strong>
              </p>
            </div>

            <p className="text-zinc-400 text-sm">
              Digite o código de 6 dígitos que você recebeu
            </p>

            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={(e) => e.key === 'Enter' && handleVerifyCode()}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-6 py-4 text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-brand-500 transition-colors"
              disabled={loading}
              maxLength={6}
            />

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-zinc-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Confirmar e Entrar'
              )}
            </button>

            <button
              onClick={() => {
                setStep('email');
                setCode('');
                setError('');
              }}
              className="w-full text-zinc-400 hover:text-white text-sm py-2 transition-colors"
            >
              ← Voltar e usar outro email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
