import type { ReactNode } from "react";

export function Page({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-line pb-7">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-medium text-foreground sm:text-4xl">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
