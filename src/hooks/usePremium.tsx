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
  const { user, session } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setIsPremium(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

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
  }, [session?.access_token]);

  useEffect(() => {
    // Only check subscription when we have both user and a valid session with access token
    if (user && session?.access_token) {
      checkSubscription();
    } else if (!user) {
      setIsPremium(false);
      setLoading(false);
    }
  }, [user, session?.access_token, checkSubscription]);

  // Check subscription periodically (every minute)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const openCheckout = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening checkout:', err);
    }
  };

  const openCustomerPortal = async () => {
    if (!session) return;

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

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
