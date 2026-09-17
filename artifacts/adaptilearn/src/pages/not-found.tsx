import { Link } from 'wouter';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary text-secondary-foreground"><Compass size={28} /></div>
        <p className="font-mono-ui text-[11px] uppercase tracking-[0.18em] text-primary/70">Signal lost</p>
        <h1 className="mt-3 font-display text-4xl font-bold">That concept is not on this map.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">The page you reached does not exist in this workspace. Head back to your cockpit and keep the thread going.</p>
        <Link href="/" data-testid="link-not-found-home" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5"><ArrowLeft size={15} /> Return to overview</Link>
      </div>
    </div>
  );
}
