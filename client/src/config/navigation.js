import { 
  LayoutDashboard, 
  FileText,
  Bot,
  Phone,
  Key,
  Users,
  Folder,
  History
} from 'lucide-react'

export const navItems = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'leads',
    name: 'Leads',
    path: '/leads',
    icon: Users,
  },
  {
    id: 'assistants',
    name: 'AI Assistants',
    path: '/assistants',
    icon: Bot,
  },
  {
    id: 'call-create',
    name: 'Make Call',
    path: '/call-create',
    icon: Phone,
  },
  {
    id: 'call-history',
    name: 'Call History',
    path: '/call-history',
    icon: History,
  },

 
]