import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div style={{ background: 'var(--navy-950)', minHeight: '100vh' }}>
      <Outlet />
    </div>
  )
}
