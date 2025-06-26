import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import * as Purchases from '@revenuecat/purchases-js'
import type { PurchasesOffering, PurchasesPackage, CustomerInfo } from '@revenuecat/purchases-js'
import { notifications } from '@mantine/notifications'
import { useAuth } from './AuthContext'

interface SubscriptionContextType {
  offerings: PurchasesOffering[]
  loading: boolean
  customerInfo: CustomerInfo | null
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
  isSubscriptionActive: boolean
  refreshCustomerInfo: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, refreshProfile } = useAuth()
  const [offerings, setOfferings] = useState<PurchasesOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [isRevenueCatInitialized, setIsRevenueCatInitialized] = useState(false)

  // Initialize RevenueCat
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        console.log('Initializing RevenueCat...')
        
        // Initialize with your public API key
        await Purchases.configure({
          apiKey: 'strp_SGJGokzuqsRhjzJKXygoUQwYteP'
        })

        // Set user ID if authenticated
        if (user?.id) {
          await Purchases.logIn(user.id)
          console.log('RevenueCat user logged in:', user.id)
        }

        console.log('RevenueCat initialized successfully')
        setIsRevenueCatInitialized(true)
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error)
        setIsRevenueCatInitialized(false)
        notifications.show({
          title: 'Subscription Service Error',
          message: 'Failed to initialize subscription service. Please try again later.',
          color: 'red'
        })
      }
    }

    initializeRevenueCat()
  }, [user?.id])

  // Fetch offerings and customer info
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !isRevenueCatInitialized) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        console.log('Fetching RevenueCat offerings and customer info...')

        // Fetch offerings
        const offeringsResponse = await Purchases.getOfferings()
        console.log('RevenueCat offerings:', offeringsResponse)
        
        if (offeringsResponse.current) {
          setOfferings([offeringsResponse.current])
        } else {
          setOfferings(Object.values(offeringsResponse.all))
        }

        // Fetch customer info
        const customerInfoResponse = await Purchases.getCustomerInfo()
        console.log('RevenueCat customer info:', customerInfoResponse)
        setCustomerInfo(customerInfoResponse)

      } catch (error) {
        console.error('Failed to fetch RevenueCat data:', error)
        notifications.show({
          title: 'Subscription Data Error',
          message: 'Failed to load subscription information. Please try again later.',
          color: 'red'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, isRevenueCatInitialized])

  const refreshCustomerInfo = useCallback(async () => {
    if (!user?.id) return

    try {
      console.log('Refreshing customer info...')
      const customerInfoResponse = await Purchases.getCustomerInfo()
      setCustomerInfo(customerInfoResponse)
      
      // Also refresh the user profile to sync subscription status
      await refreshProfile()
    } catch (error) {
      console.error('Failed to refresh customer info:', error)
    }
  }, [user?.id, refreshProfile])

  const purchasePackage = useCallback(async (packageToPurchase: PurchasesPackage): Promise<boolean> => {
    try {
      console.log('Attempting to purchase package:', packageToPurchase.identifier)
      
      const purchaseResult = await Purchases.purchasePackage(packageToPurchase)
      console.log('Purchase result:', purchaseResult)

      if (purchaseResult.customerInfo.entitlements.active['premium']) {
        notifications.show({
          title: 'Upgrade Successful!',
          message: 'Welcome to Review Fast Track! Your account has been upgraded.',
          color: 'green'
        })

        // Refresh customer info and user profile
        await refreshCustomerInfo()
        
        return true
      } else {
        notifications.show({
          title: 'Purchase Incomplete',
          message: 'Your purchase was processed but premium access is not yet active. Please contact support if this persists.',
          color: 'orange'
        })
        return false
      }
    } catch (error: any) {
      console.error('Purchase failed:', error)
      
      // Handle user cancellation gracefully
      if (error.userCancelled) {
        console.log('User cancelled the purchase')
        return false
      }

      notifications.show({
        title: 'Purchase Failed',
        message: error.message || 'Failed to process your purchase. Please try again.',
        color: 'red'
      })
      return false
    }
  }, [refreshCustomerInfo])

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Restoring purchases...')
      
      const customerInfo = await Purchases.restorePurchases()
      console.log('Restored customer info:', customerInfo)
      
      setCustomerInfo(customerInfo)
      
      if (customerInfo.entitlements.active['premium']) {
        notifications.show({
          title: 'Purchases Restored',
          message: 'Your Review Fast Track subscription has been restored successfully.',
          color: 'green'
        })
        
        // Refresh user profile to sync subscription status
        await refreshProfile()
        
        return true
      } else {
        notifications.show({
          title: 'No Active Subscriptions',
          message: 'No active Review Fast Track subscriptions were found to restore.',
          color: 'blue'
        })
        return false
      }
    } catch (error: any) {
      console.error('Failed to restore purchases:', error)
      notifications.show({
        title: 'Restore Failed',
        message: error.message || 'Failed to restore purchases. Please try again.',
        color: 'red'
      })
      return false
    }
  }, [refreshProfile])

  // Check if subscription is active based on customer info
  const isSubscriptionActive = customerInfo?.entitlements.active['premium'] !== undefined

  return (
    <SubscriptionContext.Provider
      value={{
        offerings,
        loading,
        customerInfo,
        purchasePackage,
        restorePurchases,
        isSubscriptionActive,
        refreshCustomerInfo
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}