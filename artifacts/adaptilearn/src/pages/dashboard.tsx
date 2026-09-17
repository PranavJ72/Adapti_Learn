import { Link } from 'wouter';
import { useGetDashboard } from '@workspace/api-client-react';
import { ArrowUpRight, BookOpen, Check, Clock3, Flame, Lightbulb, Play, Target, TrendingUp } from 'lucide-react';
import { AppShell, ErrorPanel, LoadingPanel, PageHeading, StatusPill } from '@/components/app-shell';

export default function Dashboard() {
  const query = useGetDashboard();
  const dashboard = query.data;
  if (query.isLoading) return <AppShell><LoadingPanel /></AppShell>;
  if (query.isError || !dashboard) return <AppShell><ErrorPanel onRetry={() => query.refetch()} /></AppShell>;
  const profile = dashboard.profile;
  const active = dashboard.activeConcept;
  return (
    <AppShell>
      <PageHeading eyebrow="Learner cockpit" title={`Good to see you, ${profile.name.split(' ')[0]}.`} detail="A small, focused session today will move the whole map forward." action={<Link href="/learn" data-testid="link-start-session" className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90"><Play size={15} fill="currentColor" /> Continue learning</Link>} />
      <section className="mb-6 grid gap-4 sm:grid-cols-3">
        <div data-testid="card-course-progress" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Course progress</span><Target size={18} className="text-primary" /></div>
          <div className="flex items-end gap-2"><strong data-testid="text-course-progress" className="font-display text-3xl font-bold">{Math.round(dashboard.courseProgress)}%</strong><span className="mb-1 text-xs text-muted-foreground">of foundations</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${dashboard.courseProgress}%` }} /></div>
        </div>
        <div data-testid="card-streak" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Learning rhythm</span><Flame size={18} className="text-accent" /></div>
          <div className="flex items-end gap-2"><strong data-testid="text-streak" className="font-display text-3xl font-bold">{profile.streakDays}</strong><span className="mb-1 text-xs text-muted-foreground">day streak</span></div>
          <p className="mt-4 text-xs text-muted-foreground">Consistency is doing the heavy lifting.</p>
        </div>
        <div data-testid="card-mastery" className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Mastery signal</span><TrendingUp size={18} className="text-primary" /></div>
          <div className="flex items-end gap-2"><strong data-testid="text-mastery" className="font-display text-3xl font-bold">{Math.round(profile.masteryScore * 100)}%</strong><span className="mb-1 text-xs text-muted-foreground">across concepts</span></div>
          <p className="mt-4 text-xs text-muted-foreground">{profile.minutesLearned} minutes invested so far.</p>
        </div>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-7 text-primary-foreground shadow-lg sm:p-9">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[24px] border-secondary/20" />
          <div className="absolute -bottom-24 right-20 h-44 w-44 rounded-full border-[14px] border-accent/20" />
          <div className="relative">
            <div className="mb-8 flex items-start justify-between gap-4"><div><div className="mb-2 font-mono-ui text-[10px] uppercase tracking-[0.18em] text-primary-foreground/60">Active path</div><h2 data-testid="text-active-concept" className="font-display text-3xl font-bold leading-tight sm:text-4xl">{active.title}</h2></div><StatusPill status={active.status} /></div>
            <p className="max-w-xl text-sm leading-6 text-primary-foreground/75">{active.description}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <div><div className="mb-1 font-mono-ui text-[10px] uppercase tracking-[0.14em] text-primary-foreground/55">Progress</div><div className="font-display text-2xl font-bold">{Math.round(active.progress)}%</div></div>
              <div><div className="mb-1 font-mono-ui text-[10px] uppercase tracking-[0.14em] text-primary-foreground/55">Time box</div><div className="flex items-center gap-1.5 font-display text-2xl font-bold"><Clock3 size={18} /> {active.estimatedMinutes}m</div></div>
              <Link href="/learn" data-testid="link-open-active-concept" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground transition hover:-translate-y-0.5"><span>Open concept</span><ArrowUpRight size={16} /></Link>
            </div>
          </div>
        </div>
        <div data-testid="card-insight" className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="mb-7 flex items-center gap-2 text-primary"><Lightbulb size={18} /><span className="font-mono-ui text-[10px] uppercase tracking-[0.18em]">Adaptive insight</span></div>
          {dashboard.insights.length ? <div><p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-accent">{dashboard.insights[0].eyebrow}</p><h2 data-testid="text-insight-title" className="mt-3 font-display text-2xl font-bold leading-tight">{dashboard.insights[0].title}</h2><p data-testid="text-insight-body" className="mt-4 text-sm leading-6 text-muted-foreground">{dashboard.insights[0].body}</p></div> : <div className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">Keep going. Your next useful signal will appear after another short session.</div>}
          <Link href="/learn" data-testid="link-insight-action" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all">Use this in the next lesson <ArrowUpRight size={15} /></Link>
        </div>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-testid="card-skill-snapshot" className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-primary/70">Skill snapshot</p><h2 className="mt-1 font-display text-xl font-bold">Your concept constellation</h2></div><Link href="/skill-tree" data-testid="link-view-skill-tree" className="text-muted-foreground transition hover:text-primary"><ArrowUpRight size={18} /></Link></div>
          <div className="space-y-4">{dashboard.concepts.slice(0, 4).map((concept) => <div key={concept.id} data-testid={`row-concept-${concept.id}`}><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{concept.title}</span><StatusPill status={concept.status} /></div><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary/80" style={{ width: `${concept.progress}%` }} /></div></div>)}</div>
          {!dashboard.concepts.length && <p data-testid="empty-concepts" className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">Your first concept will land here after setup.</p>}
        </div>
        <div data-testid="card-recent-activity" className="rounded-3xl border border-border bg-card p-7 shadow-sm">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-primary/70">Trail markers</p><h2 className="mt-1 font-display text-xl font-bold">Recent activity</h2></div><span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{dashboard.recentActivity.length} signals</span></div>
          {dashboard.recentActivity.length ? <div className="divide-y divide-border">{dashboard.recentActivity.slice(0, 5).map((activity) => <div key={activity.id} data-testid={`row-activity-${activity.id}`} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${activity.kind === 'milestone' ? 'bg-secondary text-secondary-foreground' : activity.kind === 'remediation' ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'}`}>{activity.kind === 'milestone' ? <Check size={16} /> : activity.kind === 'quiz' ? <Target size={16} /> : <BookOpen size={16} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{activity.label}</p><p className="truncate text-xs text-muted-foreground">{activity.detail}</p></div><time className="shrink-0 font-mono-ui text-[10px] text-muted-foreground">{activity.timestamp}</time></div>)}</div> : <div data-testid="empty-activity" className="rounded-2xl bg-muted/50 p-5 text-sm text-muted-foreground">Complete a lesson to start your trail.</div>}
        </div>
      </section>
    </AppShell>
  );
}