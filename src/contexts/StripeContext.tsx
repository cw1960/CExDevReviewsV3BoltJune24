import React, { createContext, useContext, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { useAuth } from "./AuthContext";
import { supabase } from "../lib/supabase";
import type { StripeProduct } from "../stripe-config";

interface StripeContextType {
  createCheckoutSession: (product: StripeProduct) => Promise<string | null>;
  loading: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const createCheckoutSession = useCallback(
    async (product: StripeProduct): Promise<string | null> => {
      if (!user) {
        notifications.show({
          title: "Authentication Required",
          message: "Please sign in to continue with your purchase.",
          color: "red",
        });
        return null;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "stripe-checkout",
          {
            body: {
              price_id: product.priceId,
              mode: product.mode,
              success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
              cancel_url: `${window.location.origin}/upgrade`,
            },
          },
        );

        if (error) {
          console.error("Checkout session creation error:", error);
          throw error;
        }

        if (!data?.url) {
          throw new Error("No checkout URL received");
        }

        return data.url;
      } catch (error: any) {
        console.error("Failed to create checkout session:", error);
        notifications.show({
          title: "Checkout Error",
          message:
            error.message ||
            "Failed to create checkout session. Please try again.",
          color: "red",
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  return (
    <StripeContext.Provider
      value={{
        createCheckoutSession,
        loading,
      }}
    >
      {children}
    </StripeContext.Provider>
  );
}

export function useStripe() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error("useStripe must be used within a StripeProvider");
  }
  return context;
}
