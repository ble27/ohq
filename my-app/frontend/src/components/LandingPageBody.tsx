import { useEffect, useRef, useState, type RefObject } from 'react';
import { LuMoveUpRight } from 'react-icons/lu';
import { Link } from 'react-router-dom';
import { Handshake, RefreshCw, Move, FolderOpen } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

const AUDIENCE_WORDS = [
  { label: 'Students', color: 'text-amber-700 decoration-amber-600' },
  { label: 'TAs', color: 'text-orange-700 decoration-orange-600' },
  { label: 'Tutors', color: 'text-blue-700 decoration-blue-600' },
  { label: 'Graders', color: 'text-rose-700 decoration-rose-600' },
  { label: 'Mentors', color: 'text-emerald-700 decoration-emerald-600' },
  { label: 'Peers', color: 'text-violet-700 decoration-violet-600' },
] as const;

const TYPE_MS = 70;
const DELETE_MS = 45;
const HOLD_MS = 1600;
const GAP_MS = 280;

const FEATURE_CARDS = [
  {
    key: 'event-loops',
    className: 'flex flex-col bg-yellow-200 border-2 border-black/50 min-h-120 rounded-3xl',
    title: 'Event loops',
    icon: <RefreshCw strokeWidth={1.5} size={45} />,
    heading: 'Sync in real time',
    description: 'Courses update and notify when it is your turn',
  },
  {
    key: 'location-alert',
    className: 'flex flex-col bg-orange-200 border-2 border-black/50 min-h-120 rounded-3xl',
    title: 'Location Alert',
    icon: <Move strokeWidth={1.2} size={45} />,
    heading: 'Move conveniently',
    description: 'Track sections on your time',
  },
  {
    key: 'peer-assistance',
    className: 'flex flex-col bg-emerald-200 border-2 border-black/50 min-h-120 rounded-3xl overflow-hidden',
    title: 'Peer assistance',
    icon: <Handshake strokeWidth={1.2} size={60} />,
    heading: 'Help each other',
    description: 'Interactions aimed for better growth and learning',
  },
  {
    key: 'management-ui',
    className: 'flex flex-col bg-blue-200 border-2 border-black/50 min-h-120 rounded-3xl',
    title: 'Management UI',
    icon: <FolderOpen strokeWidth={1.2} size={50} />,
    heading: 'Manage freely',
    description: 'Modals designed to enhance TA workspace experience',
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
      // Syncing displayed text with the current word when animation is disabled, not an external system.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Inline text only — shares the sentence baseline; no absolute/overflow clipping
  return (
    <span className={current.color} aria-live="polite">
      <span className="underline underline-offset-[0.18em] decoration-2">
        {prefersReducedMotion ? current.label : text || '\u00A0'}
      </span>
      {!prefersReducedMotion && (
        <span className="animate-pulse" aria-hidden>
          |
        </span>
      )}
    </span>
  );
}

function FeatureCard({
  card,
  index,
}: {
  card: (typeof FEATURE_CARDS)[number];
  index: number;
}) {
  const prefersReducedMotion = useReducedMotion();
  // Mobile only: cascade so later cards sit a bit lower when stuck
  const stickyTop = `calc(5.5rem + ${index * 0.65}rem)`;

  return (
    <motion.div
      className={`${card.className} sticky lg:static`}
      style={{ zIndex: index + 1, top: stickyTop }}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 56 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
    >
      <div className="flex flex-col h-full pl-4">
        <div className="flex flex-2 pt-5 pl-1 pr-7 lg:text-xl font-semibold justify-between items-start">
          <span>{card.title}</span>
          {card.icon}
        </div>
        <div className="flex flex-col flex-2 text-4xl md:text-6xl lg:text-5xl lg:tracking-tight pb-6">
          {card.heading}
          <span className="text-lg lg:text-xl lg:pr-3 lg:tracking-normal md:text-base mt-3 pl-1">
            {card.description}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface BodyProps {
  featuresRef: RefObject<HTMLDivElement | null>;
}

export const Body = ({ featuresRef }: BodyProps) => {
  const prefersReducedMotion = useReducedMotion();
  const purposeHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7631/ingest/8c9affa0-91b7-414a-ade2-92f13ab89cb1',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'cba606'},body:JSON.stringify({sessionId:'cba606',runId:'post-fix',hypothesisId:'H4,H5',location:'src/components/LandingPageBody.tsx:Body',message:'Homepage purpose heading rendered',data:{heading:purposeHeadingRef.current?.textContent?.trim() ?? null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, []);

  return (
    <div className="flex flex-col items-center text-black bg-yellow-50">
      <motion.div
        className="flex flex-col pt-35 sm:pt-32 md:pt-40 lg:pt-48 text-3xl sm:text-4xl md:text-5xl
      pl-12 sm:pl-15 md:pl-20 lg:pl-30 xl:pl-35 leading-10 md:leading-14 lg:leading-16 font-sans
      w-full max-w-[900px] font-medium mb-28 mr-5"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 ref={purposeHeadingRef}>
          Queueble is an office-hours queue management app for students and teaching teams.
        </h1>
        <div className="flex flex-col mt-3 gap-1 text-3xl">
          <p
            className="font-light w-[420px] sm:w-[450px] md:w-[500px] lg:w-[600px] mt-3 mb-3 md:mt-4 md:mb-4
          leading-7 lg:leading-8 text-base md:text-lg lg:text-xl font-light"
          >
            Students join a live course queue and receive updates when a TA or peer tutor is ready,
            while teaching teams organize requests and manage office hours in one place.
          </p>
        </div>
        <Link
          to="/signin"
          className="bg-yellow-300/80 border border-black/80 w-25 h-10 md:w-30 md:h-12 flex justify-center items-center transition-all ease-in-out duration-500
          text-black tracking-tight font-normal text-sm md:text-base py-1.5 mt-5 text-lg font-normal rounded-full text-center block hover:opacity-90"
        >
          Join Now <LuMoveUpRight className="ml-1" />
        </Link>
      </motion.div>

      {/* Hero Section */}
      <div ref={featuresRef} className="w-full pt-24 md:pt-32 lg:pt-40">
        <motion.span
          className="pl-8 md:pl-16 lg:pl-18 text-3xl md:text-4xl lg:text-5xl block"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {' '}
          Built to...{' '}
        </motion.span>

        {/* Cards — sticky stack on mobile; bottom-to-top reveal only on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 p-5 md:px-15 mt-5 gap-15">
          {FEATURE_CARDS.map((card, index) => (
            <FeatureCard key={card.key} card={card} index={index} />
          ))}
        </div>
      </div>

      {/* Metrics and trusted by */}
      <div className="w-full py-30 md:py-40 lg:py-50">
        <p className="text-2xl md:text-4xl text-center px-4 leading-normal">
          Made for and trusted by <AudienceWordCycle />
        </p>
      </div>

      {/* Name section footer + privacy — background spans the full viewport (breaks out of
          the page's max-w-[1500px] body), text stays capped to the same 1500px content width */}
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-yellow-100/50">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col py-20 pl-8 pr-8">
          <span
            className="flex flex-2 text-center text-6xl md:text-7xl lg:text-8xl
              tracking-tight lg:tracking-tight justify-center mb-2"
          >
            Queueble
          </span>
          <span className="flex flex-1 text-center text-sm md:text-base lg:text-lg justify-center">
            This website is not affiliated with Texas A&M University
          </span>
          <span className="flex flex-1 text-base md:text-lg lg:text-xl text-center justify-center gap-2">
            <Link to="/privacy" className="hover:underline">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <span>© 2026 Queueble</span>
          </span>
        </div>
      </div>
    </div>
  );
};
