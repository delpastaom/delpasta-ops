import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'
import type { Role } from './types'

const RoleContext = createContext<{
  role: Role
  setRole: (r: Role) => void
  userName: string
  setUserName: (n: string) => void
} | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => (localStorage.getItem('dp_role') as Role) || 'admin')
  const [userName, setUserNameState] = useState<string>(() => localStorage.getItem('dp_user') || '')

  const setRole = useCallback((r: Role) => { localStorage.setItem('dp_role', r); setRoleState(r) }, [])
  const setUserName = useCallback((n: string) => { localStorage.setItem('dp_user', n); setUserNameState(n) }, [])

  const value = useMemo(() => ({ role, setRole, userName, setUserName }), [role, setRole, userName, setUserName])
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within RoleProvider')
  return ctx
}
