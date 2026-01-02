import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PremiumContextType {
  isPremium: boolean;
  loading: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    // No need to manually pass a JWT here; the client attaches the current access token automatically.
    if (!user) {
      setIsPremium(false);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        // Don't break the app on subscription check errors
        setIsPremium(false);
      } else if (data?.error) {
        console.error('Subscription check returned error:', data.error);
        setIsPremium(false);
      } else {
        setIsPremium(data?.subscribed ?? false);
        setSubscriptionEnd(data?.subscription_end ?? null);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setIsPremium(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setIsPremium(false);
      setSubscriptionEnd(null);
      setLoading(false);
    }
  }, [user, checkSubscription]);

  // Check subscription periodically (every minute)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const openCheckout = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening checkout:', err);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
    }
  };

  return (
    <PremiumContext.Provider value={{ 
      isPremium, 
      loading, 
      subscriptionEnd, 
      checkSubscription, 
      openCheckout, 
      openCustomerPortal 
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
