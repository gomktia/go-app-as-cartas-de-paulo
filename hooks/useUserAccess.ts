/**
 * Hook: useUserAccess
 *
 * Gerencia autenticação e acesso aos produtos baseado em compras
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

interface Purchase {
  id: string;
  product_id: string;
  product_name: string;
  status: string;
  purchase_date: string;
  unlocked_product_ids: string[];
}

interface UserAccessState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  purchases: Purchase[];
  unlockedProductIds: Set<string>;
  hasAccessToProduct: (productId: string) => boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

export function useUserAccess(): UserAccessState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [unlockedProductIds, setUnlockedProductIds] = useState<Set<string>>(new Set());

  /**
   * Carregar compras do usuário
   */
  const loadUserPurchases = async (userEmail: string) => {
    try {
      console.log('📦 Carregando compras para:', userEmail);

      const { data, error } = await supabase
        .from('user_purchases_view')
        .select('*')
        .eq('email', userEmail);

      if (error) {
        console.error('❌ Erro ao carregar compras:', error);
        return;
      }

      console.log('✅ Compras carregadas:', data);

      setPurchases(data || []);

      // Extrair todos os IDs de produtos desbloqueados
      const unlockedIds = new Set<string>();
      data?.forEach(purchase => {
        if (purchase.unlocked_product_ids) {
          purchase.unlocked_product_ids.forEach((id: string) => {
            unlockedIds.add(id);
          });
        }
      });

      setUnlockedProductIds(unlockedIds);
      console.log('🔓 Produtos desbloqueados:', Array.from(unlockedIds));

    } catch (error) {
      console.error('❌ Erro ao carregar compras:', error);
    }
  };

  /**
   * Verificar sessão inicial
   */
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setSession(session);
        await loadUserPurchases(session.user.email || '');
      }

      setIsLoading(false);
    };

    checkSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);

        if (session?.user) {
          setUser(session.user);
          setSession(session);
          await loadUserPurchases(session.user.email || '');
        } else {
          setUser(null);
          setSession(null);
          setPurchases([]);
          setUnlockedProductIds(new Set());
        }

        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Login (usado após verificação do código OTP)
   */
  const login = async (email: string) => {
    await loadUserPurchases(email);
  };

  /**
   * Logout
   */
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setPurchases([]);
    setUnlockedProductIds(new Set());
  };

  /**
   * Verificar se usuário tem acesso a um produto
   */
  const hasAccessToProduct = (productId: string): boolean => {
    // Se não estiver autenticado, não tem acesso
    if (!user) return false;

    // Verificar se o produto está na lista de desbloqueados
    return unlockedProductIds.has(productId);
  };

  return {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    purchases,
    unlockedProductIds,
    hasAccessToProduct,
    login,
    logout
  };
}
