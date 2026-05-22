import type { ReactNode } from 'react';

export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h1>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
