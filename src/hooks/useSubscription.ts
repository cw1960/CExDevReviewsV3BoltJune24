import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { getProductByPriceId } from '../stripe-config'

interface SubscriptionData {
  customer_id: string | null
  subscription_id: string | null
  subscription_status: string | null
  price_id: string | null
  current_period_start: number | null
  current_period_end: number | null
  cancel_at_period_end: boolean | null
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export function useSubscription() {
  const { user, profile, isInitialAuthLoading, isProfileRefreshing } = useAuth()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch subscription when auth is stable and user exists
    if (isInitialAuthLoading || isProfileRefreshing) {
      console.log('⏳ Auth still loading, waiting before fetching subscription...')
      return
    }

    if (!user || !user.id) {
      console.log('👤 No user available, clearing subscription data')
      setSubscription(null)
      setLoading(false)
      return
    }

    console.log('🔍 Auth stable, fetching subscription for user:', user.id)
    fetchSubscription()
  }, [user?.id, isInitialAuthLoading, isProfileRefreshing])

  const fetchSubscription = async () => {
    // Double-check user availability before making the request
    if (!user || !user.id) {
      console.log('❌ No user or user ID available for subscription fetch')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching subscription data via Edge Function for user:', user.id)
      
      // CRITICAL FIX: Ensure user_id is properly passed in the request body
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-user-subscription', {
        body: { 
          user_id: user.id  // This is the critical fix - ensure user_id is in the body
        }
      })

      if (fetchError) {
        console.error('❌ Edge Function error:', fetchError)
        setError(fetchError.message)
        return
      }

      if (!data?.success) {
        console.error('❌ Edge Function returned error:', data?.error)
        setError(data?.error || 'Failed to fetch subscription data')
        return
      }

      console.log('✅ Subscription data fetched successfully via Edge Function')
      setSubscription(data.data) // Extract the subscription data from the response
    } catch (err: any) {
      console.error('💥 Subscription fetch error:', err)
      setError(err.message || 'Failed to fetch subscription data')
    } finally {
      setLoading(false)
    }
  }

  const refreshSubscription = () => {
    if (user && user.id && !isInitialAuthLoading && !isProfileRefreshing) {
      fetchSubscription()
    } else {
      console.log('⏳ Cannot refresh subscription - auth not ready or user missing')
    }
  }

  // Helper functions - now primarily based on profile.subscription_status
  const isPremium = profile?.subscription_status === 'premium'
  const isActive = subscription?.subscription_status === 'active'
  const product = subscription?.price_id ? getProductByPriceId(subscription.price_id) : null
  
  // Plan name based on profile subscription status (authoritative source)
  const planName = isPremium ? 'Review Fast Track' : 'Free'

  return {
    subscription,
    loading,
    error,
    refreshSubscription,
    isActive,
    isPremium,
    planName,
    product
  }
}