import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '../hooks/hooks'
import type { Rol } from '../types'

interface Props {
  allowedRoles: Rol[]
}

export function ControlRoute({ allowedRoles }: Props) {
  const { isAuthenticated, user } = useAppSelector(s => s.auth)

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.rol)) return <Navigate to="/unauthorized" replace />

  return <Outlet />
}