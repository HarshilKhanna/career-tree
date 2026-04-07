'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import SelectionBubbles from '@/components/SelectionBubbles';
import {
  INSCHOOL_STREAMS,
  MASTERS_DEGREES,
  PROFILE_TYPES,
  SENIOR_ROLES,
  UG_DEGREES,
  WORK_DOMAINS,
  profileSpecialisations,
} from '@/lib/treeConfig';
import {
  buildTreeId,
  treeSelectionsFromForm,
  type Exp2PlusEducation,
  type TreeSelections,
} from '@/lib/treeUtils';

const EXP2PLUS_BACHELORS_ONLY = "Bachelor's only — no master's";
const EXP2PLUS_HAS_MASTERS = "Yes — I have a master's";

const PROFILE_LABEL_BY_ID = Object.fromEntries(
  PROFILE_TYPES.map((p) => [p.id, p.label])
);
const PROFILE_ID_BY_LABEL = Object.fromEntries(
  PROFILE_TYPES.map((p) => [p.label, p.id])
);

type StepKey =
  | 'profile'
  | 'stream'
  | 'ugDegree'
  | 'ugSpec'
  | 'exp2plusEdu'
  | 'mastersDegree'
  | 'mastersSpec'
  | 'domain'
  | 'role';

type BuiltStep = {
  key: StepKey;
  question: string;
  options: string[];
  selectedLabel: string | null;
  alwaysShowAllOptions?: boolean;
  onPick: (label: string) => void;
};

function degreeNeedsSpec(degree: string): boolean {
  const s = profileSpecialisations(degree);
  return Array.isArray(s) && s.length > 0;
}

export default function ProfileLandingFlow() {
  const router = useRouter();
  const [profile, setProfile] = useState<TreeSelections['profile'] | null>(null);
  const [stream, setStream] = useState<string | null>(null);
  const [ugDegree, setUgDegree] = useState<string | null>(null);
  const [ugSpec, setUgSpec] = useState<string | null>(null);
  const [mastersDegree, setMastersDegree] = useState<string | null>(null);
  const [mastersSpec, setMastersSpec] = useState<string | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [exp2plusEducation, setExp2plusEducation] = useState<Exp2PlusEducation | null>(null);

  const [exploreStatus, setExploreStatus] = useState<'idle' | 'loading' | 'not-found'>('idle');

  const clearAfterProfile = useCallback(() => {
    setStream(null);
    setUgDegree(null);
    setUgSpec(null);
    setMastersDegree(null);
    setMastersSpec(null);
    setDomain(null);
    setRole(null);
    setExp2plusEducation(null);
    setExploreStatus('idle');
  }, []);

  const clearAfterStream = useCallback(() => {
    setExploreStatus('idle');
  }, []);

  const clearAfterUgDegree = useCallback(() => {
    setUgSpec(null);
    setMastersDegree(null);
    setMastersSpec(null);
    setDomain(null);
    setRole(null);
    setExp2plusEducation(null);
    setExploreStatus('idle');
  }, []);

  const clearAfterUgSpec = useCallback(() => {
    setMastersDegree(null);
    setMastersSpec(null);
    setDomain(null);
    setRole(null);
    setExp2plusEducation(null);
    setExploreStatus('idle');
  }, []);

  const clearAfterMastersDegree = useCallback(() => {
    setMastersSpec(null);
    setDomain(null);
    setRole(null);
    setExploreStatus('idle');
  }, []);

  const clearAfterMastersSpec = useCallback(() => {
    setDomain(null);
    setRole(null);
    setExploreStatus('idle');
  }, []);

  const clearAfterDomain = useCallback(() => {
    setExploreStatus('idle');
  }, []);

  const clearFromStep = useCallback(
    (key: StepKey) => {
      setExploreStatus('idle');
      switch (key) {
        case 'profile':
          setProfile(null);
          clearAfterProfile();
          break;
        case 'stream':
          setStream(null);
          clearAfterStream();
          break;
        case 'ugDegree':
          setUgDegree(null);
          clearAfterUgDegree();
          break;
        case 'ugSpec':
          setUgSpec(null);
          clearAfterUgSpec();
          break;
        case 'exp2plusEdu':
          setExp2plusEducation(null);
          setMastersDegree(null);
          setMastersSpec(null);
          setRole(null);
          setExploreStatus('idle');
          break;
        case 'mastersDegree':
          setMastersDegree(null);
          clearAfterMastersDegree();
          break;
        case 'mastersSpec':
          setMastersSpec(null);
          clearAfterMastersSpec();
          break;
        case 'domain':
          setDomain(null);
          clearAfterDomain();
          break;
        case 'role':
          setRole(null);
          setExploreStatus('idle');
          break;
      }
    },
    [
      clearAfterProfile,
      clearAfterStream,
      clearAfterUgDegree,
      clearAfterUgSpec,
      clearAfterMastersDegree,
      clearAfterMastersSpec,
      clearAfterDomain,
    ]
  );

  const selections = useMemo(
    () =>
      treeSelectionsFromForm({
        profile,
        stream,
        ugDegree,
        ugSpec,
        mastersDegree,
        mastersSpec,
        domain,
        role,
        exp2plusEducation: profile === 'exp2plus' ? exp2plusEducation : null,
      }),
    [
      profile,
      stream,
      ugDegree,
      ugSpec,
      mastersDegree,
      mastersSpec,
      domain,
      role,
      exp2plusEducation,
    ]
  );

  const steps = useMemo((): BuiltStep[] => {
    const out: BuiltStep[] = [
      {
        key: 'profile',
        question: 'Where are you in your journey?',
        options: PROFILE_TYPES.map((p) => p.label),
        selectedLabel: profile ? PROFILE_LABEL_BY_ID[profile] : null,
        alwaysShowAllOptions: true,
        onPick: (label) => {
          const id = PROFILE_ID_BY_LABEL[label];
          if (id) {
            setProfile(id);
            clearAfterProfile();
          }
        },
      },
    ];

    if (!profile) return out;

    if (profile === 'inschool') {
      out.push({
        key: 'stream',
        question: 'What is your stream?',
        options: INSCHOOL_STREAMS,
        selectedLabel: stream,
        onPick: (v) => {
          setStream(v);
          clearAfterStream();
        },
      });
      return out;
    }

    const ugQ =
      profile === 'masters' || profile === 'masters_exp' || profile === 'exp2plus'
        ? 'What was your undergraduate degree?'
        : 'What is your degree?';

    out.push({
      key: 'ugDegree',
      question: ugQ,
      options: UG_DEGREES,
      selectedLabel: ugDegree,
      onPick: (v) => {
        setUgDegree(v);
        clearAfterUgDegree();
      },
    });

    if (ugDegree && degreeNeedsSpec(ugDegree)) {
      const ugSpecQ =
        profile === 'masters' || profile === 'masters_exp' || profile === 'exp2plus'
          ? 'What was your undergraduate specialisation?'
          : 'What is your specialisation?';
      const opts = profileSpecialisations(ugDegree)!;
      out.push({
        key: 'ugSpec',
        question: ugSpecQ,
        options: opts,
        selectedLabel: ugSpec,
        onPick: (v) => {
          setUgSpec(v);
          clearAfterUgSpec();
        },
      });
    }

    const ugReady =
      Boolean(ugDegree) &&
      (!degreeNeedsSpec(ugDegree!) || Boolean(ugSpec));

    if (profile === 'bachelors') return out;

    if (profile === 'bachelors_exp') {
      if (!ugReady) return out;
      out.push({
        key: 'domain',
        question: 'What domain are you working in?',
        options: WORK_DOMAINS,
        selectedLabel: domain,
        onPick: (v) => {
          setDomain(v);
          clearAfterDomain();
        },
      });
      return out;
    }

    if (!ugReady) return out;

    if (profile === 'exp2plus') {
      out.push({
        key: 'exp2plusEdu',
        question: "After your bachelor's, did you complete a master's degree?",
        options: [EXP2PLUS_BACHELORS_ONLY, EXP2PLUS_HAS_MASTERS],
        selectedLabel:
          exp2plusEducation === 'bachelors_only'
            ? EXP2PLUS_BACHELORS_ONLY
            : exp2plusEducation === 'masters'
              ? EXP2PLUS_HAS_MASTERS
              : null,
        alwaysShowAllOptions: true,
        onPick: (label) => {
          if (label === EXP2PLUS_BACHELORS_ONLY) {
            setExp2plusEducation('bachelors_only');
            setMastersDegree(null);
            setMastersSpec(null);
            setRole(null);
            setExploreStatus('idle');
          } else {
            setExp2plusEducation('masters');
            setMastersDegree(null);
            setMastersSpec(null);
            setRole(null);
            setExploreStatus('idle');
          }
        },
      });
      if (exp2plusEducation === null) return out;
      if (exp2plusEducation === 'bachelors_only') {
        out.push({
          key: 'role',
          question: 'What is your most recent role/domain?',
          options: SENIOR_ROLES,
          selectedLabel: role,
          onPick: (v) => {
            setRole(v);
            setExploreStatus('idle');
          },
        });
        return out;
      }
    }

    if (profile === 'masters' || profile === 'masters_exp' || profile === 'exp2plus') {
      out.push({
        key: 'mastersDegree',
        question: "What is your master's degree?",
        options: MASTERS_DEGREES,
        selectedLabel: mastersDegree,
        onPick: (v) => {
          setMastersDegree(v);
          clearAfterMastersDegree();
        },
      });
    }

    if (mastersDegree && degreeNeedsSpec(mastersDegree)) {
      const opts = profileSpecialisations(mastersDegree)!;
      out.push({
        key: 'mastersSpec',
        question: "What is your master's specialisation?",
        options: opts,
        selectedLabel: mastersSpec,
        onPick: (v) => {
          setMastersSpec(v);
          clearAfterMastersSpec();
        },
      });
    }

    const mastersReady =
      Boolean(mastersDegree) &&
      (!degreeNeedsSpec(mastersDegree!) || Boolean(mastersSpec));

    if (profile === 'masters') return out;

    if (!mastersReady) return out;

    if (profile === 'masters_exp') {
      out.push({
        key: 'domain',
        question: 'What domain are you working in?',
        options: WORK_DOMAINS,
        selectedLabel: domain,
        onPick: (v) => {
          setDomain(v);
          clearAfterDomain();
        },
      });
      return out;
    }

    if (profile === 'exp2plus') {
      out.push({
        key: 'role',
        question: 'What is your most recent role/domain?',
        options: SENIOR_ROLES,
        selectedLabel: role,
        onPick: (v) => {
          setRole(v);
          setExploreStatus('idle');
        },
      });
    }

    return out;
  }, [
    profile,
    stream,
    ugDegree,
    ugSpec,
    exp2plusEducation,
    mastersDegree,
    mastersSpec,
    domain,
    role,
    clearAfterProfile,
    clearAfterStream,
    clearAfterUgDegree,
    clearAfterUgSpec,
    clearAfterMastersDegree,
    clearAfterMastersSpec,
    clearAfterDomain,
  ]);

  const currentIndex = useMemo(
    () => steps.findIndex((s) => !s.selectedLabel),
    [steps]
  );

  const isFlowComplete = currentIndex === -1 && steps.length > 0;

  const chips = useMemo(() => {
    if (currentIndex === -1) {
      return steps.filter((s) => s.selectedLabel);
    }
    return steps.slice(0, currentIndex).filter((s) => s.selectedLabel);
  }, [steps, currentIndex]);

  const activeStep =
    !isFlowComplete && currentIndex >= 0 ? steps[currentIndex] : null;

  const handleExplore = async () => {
    if (!selections) return;
    setExploreStatus('loading');
    const id = buildTreeId(selections);
    try {
      const res = await fetch(`/api/trees/${id}`);
      if (res.ok) {
        router.push(`/tree/${id}`);
        return;
      }
      setExploreStatus('not-found');
    } catch {
      setExploreStatus('not-found');
    }
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        minHeight: 120,
      }}
    >
      {chips.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            maxWidth: 560,
          }}
        >
          {chips.map((c) => (
            <span
              key={c.key}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 6px 6px 12px',
                borderRadius: 999,
                border: '1px solid var(--color-border)',
                background: 'white',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--color-ink)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ maxWidth: 220, textAlign: 'left', lineHeight: 1.3 }}>
                {c.selectedLabel}
              </span>
              <button
                type="button"
                aria-label={`Change ${c.key} selection`}
                onClick={() => clearFromStep(c.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--color-paper)',
                  color: 'var(--color-ink-muted)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={14} strokeWidth={2.25} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div style={{ width: '100%', maxWidth: 560 }}>
        <AnimatePresence mode="wait">
          {activeStep ? (
            <motion.div
              key={activeStep.key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <SelectionBubbles
                question={activeStep.question}
                options={activeStep.options}
                selected={activeStep.selectedLabel}
                onSelect={activeStep.onPick}
                onClear={() => clearFromStep(activeStep.key)}
                alwaysShowAllOptions={activeStep.alwaysShowAllOptions}
                align="center"
              />
            </motion.div>
          ) : isFlowComplete && selections ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                paddingTop: 4,
              }}
            >
              <button
                type="button"
                className="btn-primary"
                onClick={handleExplore}
                disabled={exploreStatus === 'loading'}
                style={{
                  fontSize: 16,
                  padding: '14px 36px',
                  cursor: exploreStatus === 'loading' ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {exploreStatus === 'loading' ? 'Searching…' : 'Explore Your Paths'}
                {exploreStatus !== 'loading' ? <ArrowRight size={16} /> : null}
              </button>
              {exploreStatus === 'not-found' ? (
                <p
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--color-ink)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  This path isn&apos;t mapped yet — check back soon.
                </p>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
