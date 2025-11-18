import { Menu } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'

const SidebarToggle = () => {
  const { toggleSidebar, isOpen } = useSidebar()

  return (
    <button
      onClick={toggleSidebar}
      className="flex items-center justify-center p-2.5 md:p-3 rounded-xl border-2 border-transparent bg-transparent cursor-pointer transition-all duration-300 ease-out relative hover:bg-slate-100 hover:border-slate-200 hover:scale-110 hover:rotate-180 hover:shadow-lg"
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    >
      <Menu className="w-6 h-6 md:w-6.5 md:h-6.5 text-slate-500 transition-colors duration-200" />
    </button>
  )
}

export default SidebarToggle