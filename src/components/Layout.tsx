import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/cards', label: 'Cards', icon: '🗂️' },
  { to: '/study', label: 'Study', icon: '🎯' },
  { to: '/languages', label: 'Languages', icon: '🌐' },
  { to: '/import', label: 'Import', icon: '📥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-slate-200 md:bg-white">
        <div className="px-6 py-5 text-xl font-semibold tracking-tight">
          Quizz Card
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-slate-900' : 'text-slate-500'
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
