import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import SubscriptionPlans from './SubscriptionPlans'

export default function SubscriptionGuard({ children }) {
  const { profile } = useAuth()

  const isSubscribed = profile?.subscription_status === 'active'
  
  if (!isSubscribed) {
    return <SubscriptionPlans standalone={true} />
    }

  return children
}