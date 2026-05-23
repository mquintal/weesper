import { useAppInfo } from '@open-bisbis/hooks'
import { GearIcon, HeartIcon, LayersIcon, MagicWandIcon, PlayIcon } from '@radix-ui/react-icons'
import classNames from 'classnames'
import { NavLink, Outlet } from 'react-router'
import logo from '../assets/logo.svg'
import { UpdateBanner } from '../components'
import { Feedback } from './Feedback'

const SidebarLink = ({
  to,
  icon: Icon,
  children,
}: {
  to: string
  icon: React.ElementType
  children: React.ReactNode
}) => (
  <li>
    <NavLink
      to={to}
      className={({ isActive }) =>
        classNames('flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200', {
          'menu-active': isActive,
        })
      }
    >
      <Icon />
      {children}
    </NavLink>
  </li>
)

export const Layout = () => {
  const { data: info } = useAppInfo()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r border-base-content/10 flex flex-col p-6 bg-base-100">
        <div className="flex items-center gap-3 mb-12 px-2">
          <img
            src={logo}
            alt="Open Bisbis"
            className="w-10 h-10 rounded-xl shadow-xl shadow-primary/30 transform hover:rotate-6 transition-transform duration-300"
          />
          <span className="font-black tracking-tighter text-md">Open Bisbis</span>
        </div>

        <UpdateBanner />

        <nav className="flex-1">
          <ul className="menu w-full menu-md p-0 gap-2">
            <SidebarLink to="/dashboard/general" icon={GearIcon}>
              General
            </SidebarLink>
            <SidebarLink to="/dashboard/models" icon={LayersIcon}>
              Models
            </SidebarLink>
            <SidebarLink to="/dashboard/enhancements" icon={MagicWandIcon}>
              Enhancements
            </SidebarLink>
            <SidebarLink to="/dashboard/recordings" icon={PlayIcon}>
              Recordings
            </SidebarLink>
            <SidebarLink to="/dashboard/about" icon={HeartIcon}>
              About
            </SidebarLink>
          </ul>
        </nav>
        <div className="divider my-2" />
        <div className="flex justify-between items-center gap-1">
          <Feedback />
          <div className="tracking-widest text-center text-xs text-gray-400">v{info?.version ?? '...'}</div>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-base-200 p-6 relative z-0">
        <div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
