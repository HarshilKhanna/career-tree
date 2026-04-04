'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES, formatLevelLabel } from '@/lib/treeConfig';
import { Book, GraduationCap, Building2, ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';

const EXTRA_COUNTRIES = [
  "France", "Japan", "Brazil", "China", "South Africa", "New Zealand", "Netherlands", "Ireland", "Italy"
];

function CustomSelect({
  value,
  options,
  onChange,
  placeholder,
  formatDisplay,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder: string;
  /** Optional display transform (values stay canonical). */
  formatDisplay?: (v: string) => string;
}) {
  const label = formatDisplay ?? ((s: string) => s);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <div 
        className="ct-input" 
        style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', alignItems: 'center', userSelect: 'none' }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: value ? 'inherit' : 'var(--color-ink-muted)' }}>
          {value ? label(value) : placeholder}
        </span>
        <ChevronDown size={14} className="chevron" style={{ position: 'static', transform: 'none' }} />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'white', border: '1px solid var(--color-border)', borderRadius: '6px', boxShadow: 'var(--shadow-dropdown)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}
          >
            {options.map(opt => (
              <div 
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '14px', background: opt === value ? 'var(--color-paper)' : 'transparent', color: 'var(--color-ink)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-paper)'}
                onMouseLeave={(e) => e.currentTarget.style.background = opt === value ? 'var(--color-paper)' : 'transparent'}
              >
                {label(opt)}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SteppedSelectorProps {
  country: string;
  level: string | '';
  degree: string;
  stream: string | null | undefined;
  treeData: import('@/lib/types').TreeMetadata[];
  onCountryChange: (v: string) => void;
  onLevelChange: (v: any) => void;
  onDegreeChange: (v: string) => void;
  onStreamChange: (v: string | null | undefined) => void;
}

export default function SteppedSelector({
  country, level, degree, stream, treeData = [],
  onCountryChange, onLevelChange, onDegreeChange, onStreamChange
}: SteppedSelectorProps) {
  
  const [activeStep, setActiveStep] = useState(1);
  const [showOtherCountry, setShowOtherCountry] = useState(false);
  const [showOtherLevel, setShowOtherLevel] = useState(false);
  const [showOtherDegree, setShowOtherDegree] = useState(false);
  const [showOtherStream, setShowOtherStream] = useState(false);

  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
  };

  const computeVisibility = (standard: string[], dynamic: string[], selected: string | null | undefined, limit: number = 5) => {
    let visible = [...standard];
    let hidden = dynamic.filter(d => !standard.includes(d));
    
    // Promote hidden to visible until we hit the limit
    while (visible.length < limit && hidden.length > 0) {
      visible.push(hidden.shift()!);
    }
    
    // Force selected item to be visible
    if (selected && hidden.includes(selected)) {
      hidden = hidden.filter(x => x !== selected);
      visible.push(selected);
    }
    
    return { visible, hidden };
  };

  const validCountries = Array.from(new Set(treeData.map(t => t.country)));
  const countryVis = computeVisibility([], validCountries, country, 5);

  const treesForCountry = treeData.filter(t => t.country === country);
  const validLevels = Array.from(new Set(treesForCountry.map(t => t.level)));
  const levelVis = computeVisibility([], validLevels, level, 5);

  const treesForLevel = treesForCountry.filter(t => t.level === level);
  const validDegrees = Array.from(new Set(treesForLevel.map(t => t.degree)));
  const degreeVis = computeVisibility([], validDegrees, degree, 5);

  const treesForDegree = treesForLevel.filter(t => t.degree === degree);
  const validStreams = Array.from(new Set(treesForDegree.map(t => t.stream).filter(Boolean))) as string[];
  const streamVis = computeVisibility([], validStreams, stream || '', 5);

  const handleCountry = (c: string) => {
    if (c === 'Other') {
      setShowOtherCountry(true);
      return;
    }
    setShowOtherCountry(false);
    onCountryChange(c);
    setActiveStep(2);
  };

  const handleLevel = (l: string) => {
    if (l === 'Other') { /* We likely won't hit this if limit=5 is enough for levels */ return; }
    onLevelChange(l);
    onDegreeChange('');
    onStreamChange(undefined);
    setShowOtherDegree(false);
    setShowOtherStream(false);
    setActiveStep(3);
  };

  const handleDegree = (d: string) => {
    if (d === 'Other') {
      setShowOtherDegree(true);
      return;
    }
    setShowOtherDegree(false);
    // Use treesForLevel + d — not treesForDegree (still keyed by previous `degree` state until parent re-renders).
    onDegreeChange(d);
    const treeNodesForDegree = treesForLevel.filter((t) => t.degree === d);
    // If no trees have a stream mapped for this degree, we skip step 4
    const hasStreams = treeNodesForDegree.some((t) => t.stream !== null);
    
    if (!hasStreams) {
      onStreamChange(null);
      setActiveStep(5); // completion
    } else {
      onStreamChange(undefined);
      setActiveStep(4);
    }
  };

  const handleStream = (s: string) => {
    if (s === 'Other') {
      setShowOtherStream(true);
      return;
    }
    setShowOtherStream(false);
    onStreamChange(s);
    setActiveStep(5);
  };

  const getLevelIcon = (l: string) => {
    switch (l) {
      case 'school': return <Book size={20} />;
      case 'undergraduate': return <GraduationCap size={20} />;
      case 'masters': return <Building2 size={20} />;
      default: return null;
    }
  };

  const getLevelDesc = (l: string) => {
    switch (l) {
      case 'school': return 'Class 10 or 12';
      case 'undergraduate': return 'Bachelors degree';
      case 'masters': return 'Post-graduate studies';
      default: return '';
    }
  };

  const renderBreadcrumbs = () => {
    if (activeStep === 1) return null;
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
        {country && (
          <button onClick={() => setActiveStep(1)} className="btn-chip active" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '100px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Check size={12} /> {country}
          </button>
        )}
        {level && activeStep > 2 && (
          <button onClick={() => setActiveStep(2)} className="btn-chip active" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '100px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Check size={12} /> {formatLevelLabel(level)}
          </button>
        )}
        {degree && activeStep > 3 && (
          <button onClick={() => setActiveStep(3)} className="btn-chip active" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '100px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Check size={12} /> {degree}
          </button>
        )}
        {stream && activeStep > 4 && (
          <button onClick={() => setActiveStep(4)} className="btn-chip active" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '100px', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Check size={12} /> {stream}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '640px', marginTop: '24px', position: 'relative' }}>
      
      {renderBreadcrumbs()}

      <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          
          {/* STEP 1: COUNTRY */}
          {activeStep === 1 && (
            <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
              <label className="ct-label" style={{ textAlign: 'center', display: 'block', marginBottom: '16px', fontSize: '18px' }}>Where are you planning to study/work?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {countryVis.visible.map(c => (
                  <button
                    key={c}
                    onClick={() => handleCountry(c)}
                    className={country === c && !showOtherCountry ? 'btn-chip active' : 'btn-chip'}
                    style={{ padding: '8px 16px', borderRadius: '100px' }}
                  >
                    {c}
                  </button>
                ))}
                
                {countryVis.hidden.length > 0 && (
                  <button
                    onClick={() => handleCountry('Other')}
                    className={showOtherCountry ? 'btn-chip active' : 'btn-chip'}
                    style={{ padding: '8px 16px', borderRadius: '100px' }}
                  >
                    Other
                  </button>
                )}
              </div>

              {showOtherCountry && countryVis.hidden.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CustomSelect
                    value={countryVis.hidden.includes(country) ? country : ''}
                    options={countryVis.hidden}
                    onChange={handleCountry}
                    placeholder="Select a country..."
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 2: EDUCATION LEVEL */}
          {activeStep === 2 && (
            <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
              <label className="ct-label" style={{ textAlign: 'center', display: 'block', marginBottom: '16px', fontSize: '18px' }}>What is your current or target education level?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {levelVis.visible.map(l => (
                  <button
                    key={l}
                    onClick={() => handleLevel(l)}
                    className={level === l && !showOtherLevel ? 'ct-card active' : 'ct-card'}
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ color: level === l ? 'var(--color-accent)' : 'var(--color-ink-muted)' }}>
                      {getLevelIcon(l)}
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, color: level === l ? 'black' : 'var(--color-ink)' }}>
                        {formatLevelLabel(l)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                        {getLevelDesc(l)}
                      </div>
                    </div>
                  </button>
                ))}
                {levelVis.hidden.length > 0 && (
                  <button
                    onClick={() => setShowOtherLevel(!showOtherLevel)}
                    className={showOtherLevel ? 'ct-card active' : 'ct-card'}
                    style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', textAlign: 'center', justifyContent: 'center' }}
                  >
                    <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, color: 'var(--color-ink)', textTransform: 'capitalize' }}>
                      Other Levels
                    </div>
                  </button>
                )}
              </div>

              {showOtherLevel && levelVis.hidden.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CustomSelect
                    value={levelVis.hidden.includes(level) ? level : ''}
                    options={levelVis.hidden}
                    onChange={(v) => handleLevel(v)}
                    placeholder="Select level..."
                    formatDisplay={formatLevelLabel}
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 3: DEGREE */}
          {activeStep === 3 && level && (
            <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
              <label className="ct-label" style={{ textAlign: 'center', display: 'block', marginBottom: '16px', fontSize: '18px' }}>Select your degree</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {degreeVis.visible.map(d => (
                  <button
                    key={d}
                    onClick={() => handleDegree(d)}
                    className={degree === d && !showOtherDegree ? 'btn-chip active' : 'btn-chip'}
                    style={{ padding: '8px 16px', borderRadius: '100px' }}
                  >
                    {d}
                  </button>
                ))}
                
                {degreeVis.hidden.length > 0 && (
                  <button
                    onClick={() => handleDegree('Other')}
                    className={showOtherDegree ? 'btn-chip active' : 'btn-chip'}
                    style={{ padding: '8px 16px', borderRadius: '100px' }}
                  >
                    Other
                  </button>
                )}
              </div>

              {showOtherDegree && degreeVis.hidden.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CustomSelect
                    value=""
                    options={degreeVis.hidden}
                    onChange={handleDegree}
                    placeholder="Select a degree from database..."
                  />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* STEP 4: STREAM */}
          {activeStep === 4 && degree && (
            <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%' }}>
              <label className="ct-label" style={{ textAlign: 'center', display: 'block', marginBottom: '16px', fontSize: '18px' }}>Select your stream/specialization</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {streamVis.visible.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStream(s)}
                    className={stream === s && !showOtherStream ? 'btn-chip active' : 'btn-chip'}
                    style={{ padding: '8px 16px', borderRadius: '100px' }}
                  >
                    {s}
                  </button>
                ))}
                
                {streamVis.hidden.length > 0 && (
                  <button
                    onClick={() => handleStream('Other')}
                    className={showOtherStream ? 'btn-chip active' : 'btn-chip'}
                    style={{ padding: '8px 16px', borderRadius: '100px' }}
                  >
                    Other
                  </button>
                )}
              </div>

              {showOtherStream && streamVis.hidden.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '16px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <CustomSelect
                    value=""
                    options={streamVis.hidden}
                    onChange={handleStream}
                    placeholder="Select a stream from database..."
                  />
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* STEP 5: DONE */}
          {activeStep === 5 && (
            <motion.div key="step5" variants={stepVariants} initial="hidden" animate="visible" exit="exit" style={{ width: '100%', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', color: 'var(--color-ink-muted)' }}>
                All set. You can edit your choices above or click Explore Paths.
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
}
