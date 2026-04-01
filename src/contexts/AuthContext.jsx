import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  // Memoized fetchProfile
  const fetchProfile = useCallback(async (userId) => {
    console.log('Fetching profile for:', userId)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Profile fetch error:', error)
      toast.error('Failed to load profile')
    } else if (data) {
      setProfile(data)
      console.log('✅ Profile loaded:', data.role, data.email)
    }
  }, [])

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth event:', event, session?.user?.email || 'no user')
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signUp = async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: fullName } }
    })
    
    if (error) {
      console.error('Signup error:', error)
      toast.error(error.message)
      return { error }
    }
    toast.success('Check your email to confirm!')
    return { data }
  }

  const signIn = async (email, password) => {
    console.log('🔑 Signin attempt:', email)
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.toLowerCase().trim(), 
      password 
    })
    
    if (error) {
      console.error('❌ Signin failed:', error.message)
      toast.error(error.message)
      return { error }
    }
    
    console.log('✅ Signin success:', data.user.email)
    toast.success('Welcome back!')
    return { data }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Sign out failed')
    } else {
      toast.success('Signed out')
    }
    return { error }
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signUp,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}