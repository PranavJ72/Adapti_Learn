import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetProfile, useSubmitDiagnostic, useUpdateProfile, getGetDashboardQueryKey, getGetProfileQueryKey, type UserProfilePreferredStyle, type UserProfileInterestLens } from '@workspace/api-client-react';
import { Check, ChevronRight, CircleUserRound, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AppShell, ErrorPanel, LoadingPanel, PageHeading } from '@/components/app-shell';

const styleOptions: { value: UserProfilePreferredStyle; label: string; detail: string }[] = [
  { value: 'text', label: 'Clear text', detail: 'I like a calm, written walkthrough.' },
  { value: 'visual', label: 'Visual structure', detail: 'I learn through diagrams and spatial cues.' },
  { value: 'code', label: 'Code first', detail: 'Show me the moving parts in practice.' },
  { value: 'audio', label: 'Conversational', detail: 'I retain ideas through spoken explanation.' },
];
const interestOptions: UserProfileInterestLens[] = ['Gaming', 'Sports', 'Finance', 'Music', 'Sci-Fi'];
const diagnosticQuestions = [
  { prompt: 'When something is unfamiliar, what helps first?', options: ['A concrete example', 'A map of the idea', 'A chance to try it', 'A story around it'] },
  { prompt: 'What keeps a technical session moving?', options: ['A clear sequence', 'A visual pattern', 'A problem to solve', 'A surprising connection'] },
  { prompt: 'How do you know a concept is yours?', options: ['I can explain it', 'I can draw the structure', 'I can use it in code', 'I can connect it elsewhere'] },
];

export default function Profile() {
  const profileQuery = useGetProfile();
  const update = useUpdateProfile();
  const diagnostic = useSubmitDiagnostic();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [style, setStyle] = useState<UserProfilePreferredStyle>('text');
  const [interest, setInterest] = useState<UserProfileInterestLens>('Gaming');
  const [answers, setAnswers] = useState<number[]>([0, 0, 0]);
  const [saved, setSaved] = useState(false);
  const [diagnosticMessage, setDiagnosticMessage] = useState('');
  const startedAt = useRef(Date.now());
  const profile = profileQuery.data;
  useEffect(() => { if (profile) { setName(profile.name); setStyle(profile.preferredStyle); setInterest(profile.interestLens); } }, [profile]);
  if (profileQuery.isLoading) return <AppShell><LoadingPanel label="Loading your learning controls" /></AppShell>;
  if (profileQuery.isError || !profile) return <AppShell><ErrorPanel onRetry={() => profileQuery.refetch()} /></AppShell>;
  const saveProfile = () => {
    setSaved(false);
    update.mutate({ data: { name: name.trim() || profile.name, preferredStyle: style, interestLens: interest } }, { onSuccess: () => { setSaved(true); queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } });
  };
  const submitDiagnostic = () => {
    diagnostic.mutate({ data: { answers, elapsedSeconds: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)) } }, { onSuccess: (result) => { setDiagnosticMessage(result.welcomeMessage); setStyle(result.preferredStyle); setInterest(result.interestLens); queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } });
  };
  return (
    <AppShell>
      <PageHeading eyebrow="Your setup" title="Make the workspace fit you." detail="These controls shape the examples, pacing, and explanations that show up in your path." action={<div data-testid="profile-signal" className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Adaptive controls on</div>} />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section data-testid="card-profile-settings" className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground"><CircleUserRound size={22} /></span><div><p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-primary/70">Profile settings</p><h2 className="font-display text-2xl font-bold">The basics</h2></div></div>
          <label className="block text-sm font-semibold" htmlFor="profile-name">What should we call you?</label>
          <input id="profile-name" data-testid="input-profile-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
          <p data-testid="text-profile-email" className="mt-2 text-xs text-muted-foreground">{profile.email}</p>
          <div className="mt-8"><label className="text-sm font-semibold">How should we explain things?</label><div className="mt-3 grid gap-2">{styleOptions.map((option) => <button type="button" key={option.value} onClick={() => setStyle(option.value)} data-testid={`button-style-${option.value}`} className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${style === option.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/35'}`}><span className={`flex h-6 w-6 items-center justify-center rounded-lg ${style === option.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{style === option.value && <Check size={14} />}</span><span><span className="block text-sm font-semibold">{option.label}</span><span className="block text-xs text-muted-foreground">{option.detail}</span></span></button>)}</div></div>
          <div className="mt-8"><label className="text-sm font-semibold" htmlFor="interest-lens">Choose an interest lens</label><select id="interest-lens" data-testid="select-interest-lens" value={interest} onChange={(event) => setInterest(event.target.value as UserProfileInterestLens)} className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15">{interestOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
          <button type="button" onClick={saveProfile} disabled={update.isPending} data-testid="button-save-profile" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:opacity-50"><Save size={15} /> {update.isPending ? 'Saving your setup...' : saved ? 'Saved to your path' : 'Save preferences'}</button>
          {update.isError && <p data-testid="status-profile-error" className="mt-3 text-center text-xs text-destructive">That update did not stick. Try once more.</p>}
        </section>
        <section data-testid="card-diagnostic" className="rounded-3xl bg-[#15343b] p-7 text-[#f5ecd7] shadow-sm sm:p-8">
          <div className="mb-7 flex items-center justify-between"><div><p className="font-mono-ui text-[10px] uppercase tracking-[0.16em] text-[#f5c95b]">Calibration room</p><h2 className="mt-2 font-display text-2xl font-bold">A three-question reset</h2></div><SlidersHorizontal size={21} className="text-[#f5c95b]" /></div>
          <p className="mb-7 max-w-lg text-sm leading-6 text-[#f5ecd7]/70">Not a test. Just a quick read on how to make the next explanation feel more natural.</p>
          <div className="space-y-7">{diagnosticQuestions.map((question, questionIndex) => <div key={question.prompt}><p className="mb-3 text-sm font-semibold">{questionIndex + 1}. {question.prompt}</p><div className="grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <button type="button" key={option} onClick={() => setAnswers((current) => current.map((value, index) => index === questionIndex ? optionIndex : value))} data-testid={`button-diagnostic-${questionIndex}-${optionIndex}`} className={`rounded-xl border px-3 py-2.5 text-left text-xs transition ${answers[questionIndex] === optionIndex ? 'border-[#f5c95b] bg-[#f5c95b]/15 text-[#f5c95b]' : 'border-white/15 text-[#f5ecd7]/65 hover:border-white/35'}`}>{option}</button>)}</div></div>)}</div>
          {diagnosticMessage && <div data-testid="status-diagnostic-success" className="mt-7 flex gap-3 rounded-2xl bg-[#f5c95b]/15 p-4 text-sm leading-6 text-[#f5ecd7]"><Sparkles className="mt-0.5 shrink-0 text-[#f5c95b]" size={17} />{diagnosticMessage}</div>}
          <button type="button" onClick={submitDiagnostic} disabled={diagnostic.isPending} data-testid="button-submit-diagnostic" className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f5c95b] px-4 py-3.5 text-sm font-bold text-[#15343b] transition hover:-translate-y-0.5 disabled:opacity-50">{diagnostic.isPending ? 'Calibrating...' : 'Update my learning signal'} <ChevronRight size={16} /></button>
          {diagnostic.isError && <p data-testid="status-diagnostic-error" className="mt-3 text-center text-xs text-[#f5c95b]">We could not save the diagnostic yet. Try again.</p>}
        </section>
      </div>
      <section className="mt-5 grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Mastery score</p><p data-testid="text-profile-mastery" className="mt-2 font-display text-2xl font-bold">{Math.round(profile.masteryScore)}%</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Days in motion</p><p data-testid="text-profile-streak" className="mt-2 font-display text-2xl font-bold">{profile.streakDays}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="text-xs text-muted-foreground">Minutes invested</p><p data-testid="text-profile-minutes" className="mt-2 font-display text-2xl font-bold">{profile.minutesLearned}</p></div>
      </section>
    </AppShell>
  );
}