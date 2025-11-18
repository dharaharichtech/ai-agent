import { NavLink } from 'react-router-dom'
import { 
  Bot,
  LogOut,
  X,
  ChevronLeft,
  Menu
} from 'lucide-react'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/userSlice'
import { useSidebar } from '../../context/SidebarContext'
import { navItems } from '../../config/navigation'

const Sidebar = () => {
  const dispatch = useDispatch()
  const { isOpen, isMobile, toggleSidebar, closeSidebar } = useSidebar()

  const handleLogout = () => {
    dispatch(logout())
  }

  const handleLinkClick = () => {
    if (isMobile) {
      closeSidebar()
    }
  }

  return (
    <>
      {/* Backdrop for mobile and tablets */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-all duration-300"
          onClick={closeSidebar}
        />
      )}
      
      <div
        className={`bg-white fixed left-0 top-0 z-50 h-screen transition-all duration-500 ease-in-out ${
          isOpen 
            ? 'xl:w-[280px] md:w-[260px] w-screen shadow-2xl border-r border-slate-200' 
            : isMobile 
              ? 'w-0 -translate-x-full shadow-none border-r-0'
              : 'w-[70px] shadow-lg border-r border-slate-200'
        }`}
      >
        {/* Header */}
        <div className="relative flex items-center justify-between h-18 px-4 border-b border-slate-200 bg-linear-to-br from-slate-50 to-slate-100">
          {/* Logo and Title */}
          {isOpen ? (
            <div className="flex items-center gap-3">
              <div className="bg-linear-to-br from-blue-500 to-blue-700 rounded-xl p-2 shadow-lg shadow-blue-500/30">
                <Bot className="w-6 h-6 text-white" style={{ display: 'block' }} />
              </div>
              <span className="text-xl font-bold bg-linear-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent whitespace-nowrap tracking-tight">
                AI Agent
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              {/* Show ChevronLeft when closed */}
              <button
                onClick={toggleSidebar}
                className="flex items-center justify-center p-3 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer transition-all duration-300 ease-out hover:bg-slate-200 hover:scale-110 hover:shadow-lg"
                title="Open Sidebar"
              >
                <ChevronLeft className="w-6 h-6 text-slate-600" style={{ display: 'block' }} />
              </button>
            </div>
          )}

          {/* Toggle Button (switch to Menu when open) */}
          {isOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-200 transition-all duration-300"
              title="Collapse Sidebar"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `group flex items-center ${isOpen ? 'gap-3 px-4 py-3' : 'justify-center px-3 py-3'} rounded-xl no-underline transition-all duration-300 ease-out relative ${
                      isActive
                        ? 'bg-linear-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-lg shadow-blue-500/40'
                        : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-800 hover:shadow-md'
                    }`
                  }
                  title={!isOpen ? item.name : ''}
                >
                  <item.icon 
                    size={20} 
                    className="shrink-0 transition-transform duration-200 group-hover:scale-110"
                    style={{ display: 'block', visibility: 'visible' }}
                  />
                  {isOpen && (
                    <span className="whitespace-nowrap tracking-wide">
                      {item.name}
                    </span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.name}
                      <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-3 right-3">
          <button
            onClick={handleLogout}
            className={`group flex items-center ${isOpen ? 'gap-3 px-4 py-3' : 'justify-center px-3 py-3'} w-full rounded-xl border border-transparent bg-transparent text-slate-600 cursor-pointer text-sm font-medium transition-all duration-300 ease-out relative overflow-hidden hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-lg`}
            title={!isOpen ? 'Logout' : ''}
          >
            <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" style={{ display: 'block' }} />
            {isOpen && <span>Logout</span>}
            
            {/* Tooltip for collapsed state */}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                Logout
                <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar