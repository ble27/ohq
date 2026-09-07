import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { LuMoveUpRight, LuBell, LuMapPin, LuChevronLeft, LuChevronRight, LuRotateCw } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

const AUDIENCE_WORDS = [
  { label: 'Students', color: 'text-amber-800 decoration-amber-700' },
  { label: 'TAs', color: 'text-orange-800 decoration-orange-700' },
  { label: 'Tutors', color: 'text-blue-800 decoration-blue-700' },
  { label: 'Graders', color: 'text-rose-800 decoration-rose-700' },
  { label: 'Mentors', color: 'text-emerald-800 decoration-emerald-700' },
  { label: 'Peers', color: 'text-violet-800 decoration-violet-700' },
] as const;

const TYPE_MS = 70;
const DELETE_MS = 45;
const HOLD_MS = 1600;
const GAP_MS = 280;

/** Cursor-style Mac browser chrome around a scaled UI preview */
function MiniBrowserFrame({ children, url = 'queueble.app' }: { children: ReactNode; url?: string }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-black/12 bg-[#1e1e1e] shadow-[0_24px_50px_-24px_rgba(0,0,0,0.4)]">
      <div className="relative flex shrink-0 items-center border-b border-white/8 bg-[#2a2a2a] px-3 py-2 sm:px-3.5 sm:py-2.5">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#FF5F57]" />
          <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="size-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="ml-1 hidden items-center gap-0.5 text-white/35 sm:flex" aria-hidden>
          <LuChevronLeft className="size-3.5" />
          <LuChevronRight className="size-3.5" />
          <LuRotateCw className="ml-0.5 size-3" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 flex justify-center px-3">
          <div className="flex h-7 w-full max-w-[12rem] items-center justify-center rounded-full bg-[#1a1a1a] px-2.5 sm:max-w-[16rem] md:max-w-[20rem]">
            <span className="truncate text-[11px] tracking-wide text-white/45">{url}</span>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-white">{children}</div>
    </div>
  );
}

function PreviewSelectClass() {
  return (
    <div className="flex h-full flex-col bg-white p-4 text-left sm:p-5 md:p-6" aria-hidden>
      <div className="mb-4 flex items-start justify-between gap-2">
        <p className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">Select a class</p>
        <LuBell className="mt-1 size-4 shrink-0 text-slate-700" />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex h-9 min-w-0 flex-1 items-center justify-between rounded-full border border-slate-200 bg-white px-3.5 text-xs text-slate-800 sm:text-sm">
          <span>Select a course</span>
          <span className="text-slate-400">▾</span>
        </div>
        <span className="inline-flex h-9 items-center rounded-full bg-black px-4 text-xs text-white sm:text-sm">
          Enter
        </span>
        <span className="inline-flex h-9 items-center rounded-full border border-black/70 px-4 text-xs text-black sm:text-sm">
          Clear
        </span>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-900 sm:text-sm">
        <span>Active queues</span>
        <span className="text-slate-500">1</span>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
        <div className="flex items-start justify-between">
          <span className="text-sm font-semibold text-slate-900">Office hours</span>
          <span className="text-xs font-medium text-emerald-600">Open</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-600">TA: Alice Smith</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
          <LuMapPin className="size-3 text-rose-600" />
          Building · Room
        </p>
        <p className="mt-1 text-xs text-slate-500">6:00 PM – 8:00 PM</p>
        <span className="mt-3 inline-flex rounded-full border border-black/70 px-3 py-1 text-xs text-black">
          View
        </span>
      </div>
    </div>
  );
}

function PreviewManageQueues() {
  return (
    <div className="flex h-full flex-col bg-white p-4 text-left sm:p-5 md:p-6" aria-hidden>
      <div className="mb-4 flex items-start justify-between">
        <p className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">Manage queues</p>
        <LuBell className="mt-1 size-4 shrink-0 text-slate-700" />
      </div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-3.5">
        <p className="mb-2 text-xs font-semibold text-slate-800">Create a queue</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-400">
            Course
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-400">
            Location
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-500">
            Start
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-500">
            End
          </div>
        </div>
        <span className="mt-2.5 inline-flex rounded-lg bg-sky-400/90 px-2.5 py-1.5 text-[11px] font-medium text-white">
          + Create queue
        </span>
      </div>
      <p className="mb-2 text-xs font-semibold text-slate-900 sm:text-sm">Your queues</p>
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5">
        <div className="flex justify-between">
          <span className="text-sm font-semibold text-slate-900">Office hours</span>
          <span className="text-xs font-medium text-emerald-600">Open</span>
        </div>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-600">
          <LuMapPin className="size-3 text-rose-600" />
          Building · Room
        </p>
        <p className="mt-1 text-xs text-slate-500">6:00 PM – 8:00 PM</p>
        <div className="mt-2.5 flex gap-2">
          <span className="rounded-lg border border-emerald-700/70 px-2.5 py-1 text-[11px] text-emerald-800">
            Manage
          </span>
          <span className="rounded-lg border border-rose-500/70 px-2.5 py-1 text-[11px] text-rose-700">
            Delete
          </span>
        </div>
      </div>
    </div>
  );
}

/** Landing-page preview of a student's queue ticket card. */
function PreviewMyTicket() {
  return (
    <div className="flex h-full flex-col bg-white p-4 text-left sm:p-5 md:p-6" aria-hidden>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">My Tickets</p>
        <LuBell className="size-4 text-slate-700" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Queue ticket
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Position #1</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800">
            Waiting
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:text-sm">
          <div>
            <dt className="text-slate-500">Date</dt>
            <dd className="mt-0.5 font-medium text-slate-900">Aug 21</dd>
          </div>
          <div>
            <dt className="text-slate-500">Joined</dt>
            <dd className="mt-0.5 font-medium text-slate-900">5:39 PM</dd>
          </div>
          <div>
            <dt className="text-slate-500">TA</dt>
            <dd className="mt-0.5 font-medium text-slate-900">Alice Smith</dd>
          </div>
          <div>
            <dt className="text-slate-500">Location</dt>
            <dd className="mt-0.5 flex items-center gap-1 font-medium text-slate-900">
              <LuMapPin className="size-3 text-rose-600" />
              Building · Room
            </dd>
          </div>
        </dl>

        <button
          type="button"
          tabIndex={-1}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-full border border-rose-600/80 text-sm font-medium text-rose-700"
        >
          Leave queue
        </button>
      </div>
    </div>
  );
}

function PreviewLiveQueue() {
  return (
    <div className="flex h-full flex-col bg-white p-4 text-left sm:p-5 md:p-6" aria-hidden>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">Live queue</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          Open
        </span>
      </div>
      <div className="space-y-2">
        {[
          { pos: 1, name: 'Jane Parker', status: 'Helping', tone: 'bg-amber-50 text-amber-800' },
          { pos: 2, name: 'John Smith', status: 'Waiting', tone: 'bg-slate-100 text-slate-600' },
          { pos: 3, name: 'Alice Walker', status: 'Waiting', tone: 'bg-slate-100 text-slate-600' },
        ].map((row) => (
          <div
            key={row.pos}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 items-center justify-center rounded-md bg-slate-900 text-[10px] font-semibold text-white">
                {row.pos}
              </span>
              <span className="text-sm font-medium text-slate-800">{row.name}</span>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${row.tone}`}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURE_MODULES = [
  {
    key: 'select-class',
    heading: 'Choose a course and join',
    description: 'Browse open office hours, pick a session, and enter the line in one step.',
    preview: <PreviewSelectClass />,
  },
  {
    key: 'live-sync',
    heading: 'Track your place live',
    description: 'See the queue move as students are helped — your position updates the moment it changes.',
    preview: <PreviewLiveQueue />,
  },
  {
    key: 'tickets',
    heading: 'Hold your spot',
    description: 'Keep a clear ticket with your position, time, and host — leave whenever you need to.',
    preview: <PreviewMyTicket />,
  },
  {
    key: 'manage',
    heading: 'Open and run sessions',
    description: 'Create queues, manage the line, and close sessions when office hours wrap up.',
    preview: <PreviewManageQueues />,
  },
] as const;

function AudienceWordCycle() {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState<string>(AUDIENCE_WORDS[0].label);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting' | 'gap'>('holding');
  const prefersReducedMotion = useReducedMotion();

  const current = AUDIENCE_WORDS[index];

  useEffect(() => {
    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync label when animation is off
      setText(current.label);
      return;
    }

    const full = current.label;
    let timeoutId: number;

    if (phase === 'typing') {
      if (text.length < full.length) {
        timeoutId = window.setTimeout(() => setText(full.slice(0, text.length + 1)), TYPE_MS);
      } else {
        timeoutId = window.setTimeout(() => setPhase('holding'), 0);
      }
    } else if (phase === 'holding') {
      timeoutId = window.setTimeout(() => setPhase('deleting'), HOLD_MS);
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timeoutId = window.setTimeout(() => setText((prev) => prev.slice(0, -1)), DELETE_MS);
      } else {
        timeoutId = window.setTimeout(() => setPhase('gap'), 0);
      }
    } else {
      timeoutId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % AUDIENCE_WORDS.length);
        setPhase('typing');
      }, GAP_MS);
    }

    return () => window.clearTimeout(timeoutId);
  }, [phase, text, index, current.label, prefersReducedMotion]);

  return (
    <span
      className={`${current.color} font-medium underline underline-offset-[0.18em] decoration-2`}
      aria-live="polite"
    >
      {prefersReducedMotion ? current.label : text || '\u00A0'}
      {!prefersReducedMotion && (
        <span className="animate-pulse text-black/40" aria-hidden>
          |
        </span>
      )}
    </span>
  );
}

function FeatureModule({
  module,
  index,
}: {
  module: (typeof FEATURE_MODULES)[number];
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.article
      className="grid w-full grid-cols-1 items-center gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-16 xl:gap-20"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
    >
      <div className="w-full min-w-0 lg:col-span-7">
        <div className="aspect-[16/10] w-full sm:aspect-[16/9.5]">
          <MiniBrowserFrame>{module.preview}</MiniBrowserFrame>
        </div>
      </div>

      <div className="w-full min-w-0 text-left lg:col-span-5">
        <h3 className="text-2xl font-medium leading-[1.12] tracking-tight text-black sm:text-3xl sm:leading-[1.15] md:text-[2rem] lg:text-[2.15rem]">
          {module.heading}
        </h3>
        <p className="mt-2 w-full text-base leading-snug text-black/60 sm:mt-3 sm:max-w-[34ch] sm:text-lg sm:leading-[1.55]">
          {module.description}
        </p>
      </div>
    </motion.article>
  );
}

/**
 * Mobile: Mac browser window.
 * Desktop (lg+): Apple Studio Display — black bezel, silver stand with cable pass-through.
 */
function HeroMacFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative w-full min-w-0 max-w-[960px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-yellow-300/35 via-orange-200/25 to-emerald-200/20 blur-2xl sm:-inset-8 md:-inset-10"
      />

      {/* Mobile window / Desktop Studio Display chassis */}
      <div className="overflow-hidden rounded-[1.1rem] border border-black/60 bg-[#1c1c1e] shadow-[0_28px_60px_-28px_rgba(0,0,0,0.4)] sm:rounded-[1.35rem] lg:overflow-visible lg:rounded-[1.35rem] lg:border lg:border-[#2a2a2a] lg:bg-[#0c0c0c] lg:p-[0.7rem] lg:shadow-[0_50px_90px_-36px_rgba(0,0,0,0.55)]">
        <div className="relative overflow-hidden rounded-[1.05rem] bg-yellow-50 sm:rounded-[1.3rem] lg:rounded-[0.85rem] lg:ring-1 lg:ring-black/50">
          {/* Camera in top black bezel — desktop */}
          <div
            className="absolute left-1/2 top-2 z-20 hidden h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#1f1f1f] ring-1 ring-[#3a3a3a] lg:block"
            aria-hidden
          />

          <div className="relative flex min-h-10 items-center border-b border-white/8 bg-[#2c2c2e] px-3 py-2 sm:min-h-11 sm:px-4 sm:py-3 lg:border-black/8 lg:bg-[#ebe6cf]/95 lg:pt-4">
            <div className="flex shrink-0 items-center gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-[#FF5F57] sm:size-3" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E] sm:size-3" />
              <span className="size-2.5 rounded-full bg-[#28C840] sm:size-3" />
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 flex w-[min(20rem,calc(100%-5.5rem))] -translate-x-1/2 -translate-y-1/2 justify-center">
              <span className="w-full truncate rounded-full bg-black/25 px-2.5 py-1 text-center text-[10px] tracking-wide text-white/45 sm:px-3 sm:text-xs lg:hidden">
                queueble.app
              </span>
              <span className="hidden w-full max-w-full items-center justify-center gap-1.5 truncate rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs tracking-wide text-black/45 shadow-sm lg:inline-flex">
                <span className="size-2.5 shrink-0 rounded-full bg-emerald-500/80" aria-hidden />
                queueble.app
              </span>
            </div>
          </div>

          <div className="relative bg-yellow-50">{children}</div>
        </div>
      </div>

      {/* Studio Display stand — silver neck with cable hole + rectangular foot */}
      <div className="relative z-0 mx-auto mt-0 hidden lg:block" aria-hidden>
        <div className="relative mx-auto h-[5.25rem] w-[3.6rem]">
          <div className="absolute inset-0 rounded-b-[0.35rem] bg-gradient-to-b from-[#e8e8ea] via-[#c9c9ce] to-[#b0b0b6] shadow-[inset_1px_0_0_rgba(255,255,255,0.55),inset_-1px_0_0_rgba(0,0,0,0.12)]" />
          {/* Cable pass-through */}
          <div className="absolute left-1/2 top-[42%] size-[1.35rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5f5f5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.08)]" />
          <div className="absolute left-1/2 top-[42%] size-[0.85rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fafafa]" />
        </div>
        {/* Rectangular base */}
        <div className="relative mx-auto -mt-px h-[0.55rem] w-[42%] max-w-[19rem]">
          <div className="absolute inset-0 rounded-[0.35rem] bg-gradient-to-b from-[#dedee2] via-[#c4c4ca] to-[#a8a8ae] shadow-[0_10px_18px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.55)]" />
        </div>
        <div className="absolute -bottom-2 left-1/2 h-3 w-[38%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-md" />
      </div>
    </div>
  );
}

interface BodyProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}

export const Body = ({ featuresRef }: BodyProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex w-full flex-col items-center bg-yellow-50 text-black">
      <motion.section
        className="box-border flex w-full max-w-full flex-col items-center px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 md:px-10 md:pt-24 lg:px-12 lg:pb-40 lg:pt-28"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <HeroMacFrame>
          <div className="flex flex-col px-5 py-9 sm:px-8 sm:py-12 md:px-12 md:py-14 lg:px-16 lg:py-20">
            <h1 className="max-w-[18ch] text-[1.65rem] font-medium leading-[1.18] tracking-tight text-black sm:max-w-[16ch] sm:text-4xl sm:leading-[1.12] md:text-5xl md:leading-[1.1] lg:text-[3.35rem] lg:leading-[1.08]">
              Select a class and receive live updates for office hours.
            </h1>

            <p className="mt-5 max-w-[38ch] text-[0.95rem] leading-relaxed text-black/65 sm:mt-7 sm:text-lg sm:leading-[1.7] md:mt-8 md:text-xl md:leading-[1.65]">
              Get notified the instant a TA or PT is free, so you can focus on the work that matters
              in the meantime.
            </p>

            <Link
              to="/signin"
              className="mt-7 inline-flex h-10 w-fit items-center justify-center rounded-full border border-black/80 bg-yellow-300/80 px-5 text-sm font-normal tracking-tight text-black transition-all duration-500 ease-in-out hover:opacity-90 sm:mt-9 sm:h-12 sm:px-6 sm:text-base md:mt-11"
            >
              Join Now <LuMoveUpRight className="ml-1" />
            </Link>
          </div>
        </HeroMacFrame>
      </motion.section>

      {/* Features — darker yellow band from "Built" through last module */}
      <section
        ref={featuresRef}
        className="w-full bg-yellow-50"
      >
        <div className="mx-auto box-border w-full max-w-[1180px] px-4 py-16 sm:px-6 sm:py-20 md:px-8 md:py-24 lg:px-10 lg:py-28">
          <div className="mx-auto w-full max-w-md sm:max-w-none">
            <motion.h2
              className="mb-12 text-left text-3xl font-medium tracking-tight text-black sm:mb-16 sm:text-4xl md:mb-20 md:text-5xl lg:mb-24"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              Built to...
            </motion.h2>

            <div className="flex flex-col gap-14 sm:gap-20 md:gap-24 lg:gap-28 xl:gap-32">
              {FEATURE_MODULES.map((module, index) => (
                <FeatureModule key={module.key} module={module} index={index} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="w-full px-4 py-20 sm:px-6 sm:py-28 md:py-36 lg:py-44">
        <p className="mx-auto max-w-[22ch] text-center text-xl leading-snug tracking-tight text-black sm:text-2xl md:max-w-none md:text-4xl md:leading-normal">
          Made for and trusted by <AudienceWordCycle />
        </p>
      </div>

      <footer className="w-full overflow-x-clip border-t-2 border-black/15 bg-yellow-200/70">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col px-4 pb-10 pt-14 sm:px-8 sm:pt-16 md:px-16 md:pb-12 md:pt-20 lg:px-20">
          <h2 className="text-center text-5xl font-medium tracking-tight text-black sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            Queueble
          </h2>

          <nav
            aria-label="Footer"
            className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-black md:mt-12 md:gap-x-8 md:text-base"
          >
            <button
              type="button"
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="underline-offset-4 transition-opacity hover:underline hover:opacity-80"
            >
              Features
            </button>
            <Link
              to="/privacy"
              className="underline-offset-4 transition-opacity hover:underline hover:opacity-80"
            >
              Privacy
            </Link>
          </nav>

          <div className="mt-12 flex flex-col items-center gap-2 border-t border-black/15 pt-8 text-center text-xs leading-relaxed text-black/50 sm:text-sm md:mt-14 md:pt-10">
            <span>This website is not affiliated with Texas A&amp;M University</span>
            <span>© 2026 Queueble</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
