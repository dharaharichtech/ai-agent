import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { SidebarProvider, useSidebar } from '../../context/SidebarContext'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

const LayoutContent = () => {
  const { isOpen, setIsMobile } = useSidebar()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setIsMobile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 transition-all duration-300">
      <Sidebar />
      <Navbar />
      <div className={`transition-all duration-500 ease-in-out ${
        isOpen 
          ? 'xl:ml-[280px] lg:ml-[260px] md:ml-60 ml-0' 
          : 'lg:ml-[70px] ml-0'
      }`}>
        <main className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-4.5rem)] w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-8rem)] md:min-h-[calc(100vh-9rem)] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

const Layout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}

export default Layout