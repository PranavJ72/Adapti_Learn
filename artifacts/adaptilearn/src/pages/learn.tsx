import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useGetDashboard, useGenerateLesson, useLogFrictionEvent, useSubmitAttempt, type Lesson } from '@workspace/api-client-react';
import { ArrowLeft, Check, CircleHelp, Clock3, Code2, Lightbulb, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { AppShell, ErrorPanel, LoadingPanel, PageHeading, StatusPill } from '@/components/app-shell';
import { useQueryClient } from '@tanstack/react-query';
import { getGetDashboardQueryKey } from '@workspace/api-client-react';

export default function Learn() {
  const dashboardQuery = useGetDashboard();
  const generate = useGenerateLesson();
  const submit = useSubmitAttempt();
  const friction = useLogFrictionEvent();
  const queryClient = useQueryClient();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [attemptResult, setAttemptResult] = useState<Awaited<ReturnType<typeof submit.mutateAsync>> | null>(null);
  const [helperOpen, setHelperOpen] = useState(false);
  const [helperResult, setHelperResult] = useState<Awaited<ReturnType<typeof friction.mutateAsync>> | null>(null);
  const startedAt = useRef(Date.now());
  const generatedFor = useRef<number | null>(null);
  const generateRef = useRef(generate.mutate);
  generateRef.current = generate.mutate;
  const active = dashboardQuery.data?.activeConcept;
  const profile = dashboardQuery.data?.profile;
  const requestLesson = () => {
    if (!active || !profile) return;
    generatedFor.current = active.id;
    setLesson(null);
    setAttemptResult(null);
    setSelectedOption(null);
    startedAt.current = Date.now();
    generate.mutate({ data: { conceptId: active.id, userInterest: profile.interestLens, competencyLevel: Math.min(1, Math.max(0, active.competencyLevel)) } }, { onSuccess: setLesson });
  };

  useEffect(() => {
    if (active && profile && generatedFor.current !== active.id) {
      generatedFor.current = active.id;
      startedAt.current = Date.now();
      generateRef.current({ data: { conceptId: active.id, userInterest: profile.interestLens, competencyLevel: Math.min(1, Math.max(0, active.competencyLevel)) } }, { onSuccess: (result) => setLesson(result), onError: () => setLesson(null) });
    }
  }, [active, profile]);

  if (dashboardQuery.isLoading) return <AppShell><LoadingPanel label="Building your next explanation" /></AppShell>;
  if (dashboardQuery.isError || !active || !profile) return <AppShell><ErrorPanel onRetry={() => dashboardQuery.refetch()} message="Your lesson could not be prepared." /></AppShell>;

  const submitAnswer = () => {
    if (selectedOption === null || !lesson) return;
    submit.mutate({ data: { conceptId: lesson.conceptId, selectedOption, correctOption: lesson.question.correctOption, timeSpentSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)), switches: 0 } }, {
      onSuccess: (result) => { setAttemptResult(result); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); },
    });
  };
  const requestHelper = () => {
    friction.mutate({ data: { conceptId: active.id, kind: 'hint_requested', value: 1 } }, { onSuccess: (result) => { setHelperResult(result); setHelperOpen(true); } });
  };
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" data-testid="link-back-dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"><ArrowLeft size={16} /> Back to overview</Link>
        <div className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.15em] text-muted-foreground"><Clock3 size={14} /> focused session</div>
      </div>
      <PageHeading eyebrow={lesson?.eyebrow || 'Adaptive lesson'} title={lesson?.title || active.title} detail={lesson?.summary || 'We are shaping an explanation around the way you learn best.'} action={<button type="button" onClick={requestLesson} disabled={generate.isPending} data-testid="button-refresh-lesson" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold transition hover:border-primary/40 hover:text-primary disabled:opacity-50"><RotateCcw size={15} /> New angle</button>} />
      {!lesson && (generate.isPending || !generate.isError) && <div data-testid="status-lesson-loading" className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]"><div className="h-[420px] animate-pulse rounded-3xl bg-muted" /><div className="h-[420px] animate-pulse rounded-3xl bg-muted" /></div>}
      {!lesson && generate.isError && <ErrorPanel onRetry={() => { generatedFor.current = null; generate.mutate({ data: { conceptId: active.id, userInterest: profile.interestLens, competencyLevel: Math.min(1, Math.max(0, active.competencyLevel)) } }, { onSuccess: setLesson }); }} message="The adaptive explanation needs another pass." />}
      {lesson && <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <article data-testid="card-analogy" className="relative overflow-hidden rounded-3xl bg-card p-7 shadow-sm ring-1 ring-border/70 sm:p-9">
            <div className="absolute right-7 top-7 text-secondary"><Sparkles size={22} /></div>
            <div className="mb-5 flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[0.17em] text-primary"><Lightbulb size={15} /> The connection</div>
            <h2 className="font-display text-2xl font-bold">Think of it through {profile.interestLens.toLowerCase()}.</h2>
            <p data-testid="text-lesson-analogy" className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">{lesson.analogy}</p>
          </article>
          <article data-testid="card-key-points" className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-9">
            <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Keep these close</h2><StatusPill status={active.status} /></div>
            <div className="space-y-4">{lesson.keyPoints.map((point, index) => <div key={point} data-testid={`text-key-point-${index}`} className="flex gap-4"><span className="font-mono-ui text-xs text-accent">0{index + 1}</span><p className="text-sm leading-6 text-muted-foreground">{point}</p></div>)}</div>
          </article>
          <article data-testid="card-code-example" className="overflow-hidden rounded-3xl bg-[#15343b] shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4"><div className="flex items-center gap-2 text-sm font-semibold text-[#f5ecd7]"><Code2 size={16} className="text-secondary" /> A small trace</div><span className="font-mono-ui text-[10px] uppercase tracking-[0.14em] text-white/40">python</span></div>
            <pre className="overflow-x-auto p-6 font-mono-ui text-xs leading-7 text-[#f5ecd7]/85"><code>{lesson.codeExample}</code></pre>
          </article>
        </div>
        <aside className="h-fit lg:sticky lg:top-8">
          <div data-testid="card-assessment" className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[0.17em] text-primary">Checkpoint</span><span className="text-xs text-muted-foreground">one question</span></div>
            <h2 data-testid="text-question" className="font-display text-2xl font-bold leading-tight">{lesson.question.prompt}</h2>
            <div className="mt-6 space-y-3">{lesson.question.options.map((option, index) => <button type="button" key={option} onClick={() => !attemptResult && setSelectedOption(index)} data-testid={`button-answer-${index}`} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm transition ${selectedOption === index ? 'border-primary bg-primary/8 text-primary' : 'border-border hover:border-primary/35 hover:bg-muted/35'} ${attemptResult?.correct && index === lesson.question.correctOption ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : ''}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-mono-ui text-[11px] ${selectedOption === index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div>
            {attemptResult ? <div data-testid="card-answer-feedback" className={`mt-6 rounded-2xl p-5 ${attemptResult.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-accent/10 text-foreground'}`}><div className="flex items-center gap-2 font-semibold">{attemptResult.correct ? <Check size={17} /> : <CircleHelp size={17} />} {attemptResult.correct ? 'That landed.' : 'Useful miss.'}</div><p className="mt-2 text-sm leading-6">{attemptResult.message}</p>{attemptResult.remediation && <div data-testid="card-remediation" className="mt-4 border-t border-current/15 pt-4"><p className="font-semibold">{attemptResult.remediation.title}</p><p className="mt-1 text-sm opacity-80">{attemptResult.remediation.body}</p></div>}<button type="button" onClick={() => { setAttemptResult(null); setSelectedOption(null); startedAt.current = Date.now(); }} data-testid="button-try-again" className="mt-4 inline-flex items-center gap-2 text-sm font-bold underline-offset-4 hover:underline"><RotateCcw size={14} /> Try the checkpoint again</button></div> : <button type="button" disabled={selectedOption === null || submit.isPending} onClick={submitAnswer} data-testid="button-submit-answer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45">{submit.isPending ? 'Reading your answer...' : 'Check my answer'} <Send size={15} /></button>}
            <button type="button" onClick={requestHelper} disabled={friction.isPending} data-testid="button-request-helper" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:border-primary/35 hover:text-primary"><CircleHelp size={15} /> {friction.isPending ? 'Finding a useful nudge...' : 'I am getting stuck'}</button>
          </div>
        </aside>
      </div>}
      {helperOpen && <div role="dialog" aria-modal="true" aria-labelledby="helper-title" data-testid="modal-friction-helper" className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/35 p-4 sm:items-center"><div className="w-full max-w-md rounded-3xl bg-card p-7 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><CircleHelp size={21} /></div><button type="button" onClick={() => setHelperOpen(false)} data-testid="button-close-helper" className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-accent">Friction helper</p><h2 id="helper-title" className="mt-2 font-display text-2xl font-bold">{helperResult?.helperTitle || 'Let us reduce the load.'}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{helperResult?.helperBody || 'Read the analogy once more, then name the one part that is still moving.'}</p><button type="button" onClick={() => setHelperOpen(false)} data-testid="button-return-lesson" className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">Return to the concept</button></div></div>}
    </AppShell>
  );
}