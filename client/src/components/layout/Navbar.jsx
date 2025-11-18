import { useSelector } from 'react-redux'
import { Bell, Clock, Search, User } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'
import SidebarToggle from '../ui/SidebarToggle'
import { useState } from 'react'

const Navbar = () => {
  const { user } = useSelector((state) => state.user)
  const { isOpen } = useSidebar()
    const [currentTime, setCurrentTime] = useState(new Date())
  

  return (
    <header className="w-full bg-white shadow-md border-b border-slate-200 h-16 md:h-18 sticky top-0 z-30 bg-linear-to-r from-white to-slate-50">
      <div className={`flex items-center justify-between h-full px-4 md:px-8 transition-all duration-500 ease-in-out ${
        isOpen 
          ? 'xl:pl-[calc(280px+2rem)] md:pl-[calc(260px+2rem)] pl-4' 
          : 'xl:pl-[calc(70px+2rem)] md:pl-[calc(70px+2rem)] pl-4'
      }`}>
        {/* Left side */}
        <div className="flex items-center gap-3 md:gap-5 flex-1 max-w-sm md:max-w-md lg:max-w-2xl">
        {/* <SidebarToggle /> */}
        
        {/* Search Bar */}
        <div className="hidden sm:block relative w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 md:w-5.5 md:h-5.5 text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            className="block w-full pl-11 md:pl-12 pr-4 py-2.5 md:py-3 border-2 border-slate-200 rounded-xl bg-slate-50 text-sm md:text-base outline-none transition-all duration-300 ease-out font-normal focus:border-blue-500 focus:bg-white focus:shadow-lg focus:shadow-blue-500/10 focus:-translate-y-0.5"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Search Button for Mobile */}
        <button className="sm:hidden p-2.5 text-slate-500 border-none bg-transparent cursor-pointer rounded-xl transition-all duration-200 hover:text-slate-800 hover:bg-slate-100 hover:scale-105">
          <Search className="w-5.5 h-5.5" />
        </button>

         {/* <div className="flex items-center gap-4">
           <div className="p-3 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Current Time</p>
                    <p className="font-semibold text-gray-900">
                      {currentTime.toLocaleTimeString()}
                    </p>
                  </div>
                 
                </div> */}

        {/* Notifications */}
        {/* <button className="p-2.5 md:p-3 text-slate-500 border-none bg-transparent cursor-pointer relative rounded-xl transition-all duration-300 ease-out hover:text-slate-800 hover:bg-slate-100 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg">
          <Bell className="w-5.5 h-5.5 md:w-6 md:h-6" />
          <span className="pulse-notification absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-linear-to-br from-red-500 to-red-600 border-2 border-white shadow-sm shadow-red-500/40"></span>
        </button> */}

        {/* User Menu */}
        <div className="flex items-center gap-2.5 md:gap-3.5 cursor-pointer p-2 rounded-xl transition-all duration-200 hover:bg-slate-100 hover:scale-102">
          <div className="hidden md:block text-right">
            <div className="text-sm lg:text-base font-semibold text-slate-800 leading-tight">
              {user?.name || 'User'}
            </div>
            <div className="text-xs lg:text-sm text-slate-500 leading-tight">
              {user?.email || 'user@example.com'}
            </div>
          </div>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-200">
            <User className="w-4.5 h-4.5 md:w-5 md:h-5 text-white" />
          </div>
        </div>
      </div>
      </div>
    </header>
  )
}

export default Navbar