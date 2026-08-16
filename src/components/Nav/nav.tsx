import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Topbar } from './Topbar'

export function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-col flex-1 overflow-hidden pl-[76px] min-[769px]:pl-0">
        <Topbar />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
