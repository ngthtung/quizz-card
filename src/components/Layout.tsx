import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Download,
  Globe,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/cards', label: 'Cards', icon: Layers },
  { to: '/study', label: 'Study', icon: Target },
  { to: '/languages', label: 'Languages', icon: Globe },
  { to: '/import', label: 'Import', icon: Download },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const SIDEBAR_KEY = 'quizz-card.sidebar.collapsed';

export function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      if (raw) setCollapsed(raw === '1');
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="bg-background flex min-h-full flex-col md:flex-row">
      <aside
        className={cn(
          'border-sidebar-border bg-sidebar text-sidebar-foreground hidden md:flex md:flex-col md:border-r md:transition-[width]',
          collapsed ? 'md:w-16' : 'md:w-56',
        )}
      >
        <div
          className={cn(
            'flex items-center px-3 py-4',
            collapsed ? 'justify-center' : 'justify-between px-4',
          )}
        >
          {!collapsed ? (
            <span className="text-lg font-semibold tracking-tight">
              Quizz Card
            </span>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={toggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>
        <nav className={cn('flex flex-col gap-1', collapsed ? 'px-2' : 'px-3')}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const link = (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md text-sm font-medium transition-colors min-h-9',
                    collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed ? item.label : null}
              </NavLink>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return link;
          })}
        </nav>
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>

      <nav className="border-border bg-background fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" />
              <span className="text-[10px] leading-none">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
