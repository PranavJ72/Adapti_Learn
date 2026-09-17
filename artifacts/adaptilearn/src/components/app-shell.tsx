import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetProfile } from '@workspace/api-client-react';
import { BookOpen, BrainCircuit, ChevronRight, CircleUserRound, Compass, LayoutDashboard, Network, Settings2, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/learn', label: 'Current lesson', icon: BookOpen },
  { href: '/skill-tree', label: 'Skill tree', icon: Network },
  { href: '/profile', label: 'Your setup', icon: Settings2 },
];

function Monogram({ name, large = false }: { name?: string; large?: boolean }) {
  const initials = (name || 'Learner').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span data-testid="avatar-profile" className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-secondary font-display font-bold text-secondary-foreground ${large ? 'h-12 w-12 text-lg' : 'h-9 w-9 text-sm'}`}>
      {initials}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const profileQuery = useGetProfile();
  const profile = profileQuery.data;
  return (
    <div className="min-h-[100dvh] bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[252px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground md:flex">
        <Link href="/" data-testid="link-brand" className="mb-10 flex items-center gap-3 rounded-xl px-2 py-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <BrainCircuit size={20} strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">adaptilearn<span className="text-secondary">.</span></span>
        </Link>
        <div className="mb-4 px-2 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45">Workspace</div>
        <nav className="space-y-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return (
              <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-200 ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
                <Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} className="text-secondary" />}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar-accent/55 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-sidebar-foreground/50">Signal check</span>
              <span className="h-2 w-2 animate-pulse-soft rounded-full bg-secondary" />
            </div>
            <p className="text-sm leading-5 text-sidebar-foreground/80">Your learning path is tuned to keep the next step clear.</p>
          </div>
          <Link href="/profile" data-testid="link-sidebar-profile" className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-sidebar-border hover:bg-sidebar-accent">
            <Monogram name={profile?.name} />
            <span className="min-w-0 flex-1">
              <span data-testid="text-sidebar-name" className="block truncate text-sm font-semibold">{profile?.name || 'Your profile'}</span>
              <span className="block text-xs text-sidebar-foreground/50">Learner profile</span>
            </span>
            <CircleUserRound size={16} className="text-sidebar-foreground/40" />
          </Link>
        </div>
      </aside>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:hidden">
        <Link href="/" data-testid="link-mobile-brand" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><BrainCircuit size={17} /></span>
          adaptilearn<span className="text-accent">.</span>
        </Link>
        <Link href="/profile" data-testid="link-mobile-profile"><Monogram name={profile?.name} /></Link>
      </header>
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 px-2 py-2 backdrop-blur-md md:hidden">
        <nav className="mx-auto flex max-w-md items-center justify-around" aria-label="Mobile navigation">
          {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? location === '/' : location.startsWith(href);
            return <Link key={href} href={href} data-testid={`link-mobile-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex min-w-16 flex-col items-center gap-1 rounded-lg py-1 text-[10px] ${active ? 'text-primary' : 'text-muted-foreground'}`}><Icon size={18} /><span>{label === 'Current lesson' ? 'Lesson' : label === 'Your setup' ? 'Profile' : label}</span></Link>;
          })}
        </nav>
      </div>
      <main className="min-h-[100dvh] md:pl-[252px]">
        <div className="animate-rise-in mx-auto max-w-[1440px] px-5 pb-24 pt-7 sm:px-8 md:px-12 md:pb-12 md:pt-10">{children}</div>
      </main>
    </div>
  );
}

export function PageHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 font-mono-ui text-[11px] uppercase tracking-[0.18em] text-primary/70"><Compass size={13} /> {eyebrow}</div>
        <h1 data-testid="text-page-title" className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
        {detail && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingPanel({ label = 'Calibrating your workspace' }: { label?: string }) {
  return <div data-testid="status-loading" className="space-y-5" aria-live="polite">
    <div className="h-7 w-48 animate-pulse rounded-lg bg-muted" />
    <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]"><div className="h-64 animate-pulse rounded-3xl bg-muted" /><div className="h-64 animate-pulse rounded-3xl bg-muted" /></div>
    <p className="font-mono-ui text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}...</p>
  </div>;
}

export function ErrorPanel({ onRetry, message = 'We could not load this view.' }: { onRetry: () => void; message?: string }) {
  return <div data-testid="status-error" className="rounded-3xl border border-destructive/25 bg-destructive/5 p-8 text-center">
    <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"><Sparkles size={20} /></div>
    <h2 className="font-display text-xl font-bold">{message}</h2>
    <p className="mt-2 text-sm text-muted-foreground">Give it another moment, then try again.</p>
    <button type="button" onClick={onRetry} data-testid="button-retry" className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5">Try again</button>
  </div>;
}

export function StatusPill({ status }: { status: string }) {
  const label = status.replace('_', ' ');
  return <span data-testid={`status-pill-${status}`} className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono-ui text-[10px] uppercase tracking-[0.08em] ${status === 'mastered' ? 'bg-emerald-100 text-emerald-800' : status === 'locked' ? 'bg-muted text-muted-foreground' : status === 'needs_review' ? 'bg-orange-100 text-orange-800' : 'bg-secondary/45 text-secondary-foreground'}`}>{label}</span>;
}