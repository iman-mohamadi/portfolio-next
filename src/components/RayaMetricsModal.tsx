import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart3, Layers, Box, Cpu, Check } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';

interface RayaMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RayaMetricsModal: React.FC<RayaMetricsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'tokens' | 'preview'>('metrics');
  const [activeToken, setActiveToken] = useState('obsidian');
  const [btnState, setBtnState] = useState<'default' | 'loading' | 'success'>('default');
  const dialogRef = useDialog(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Raya UI — architecture metrics"
        tabIndex={-1}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-ink/75 backdrop-blur-sm overflow-y-auto"
      >
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl bg-[#F2F0EB] border border-rule shadow-[0_24px_60px_-20px_rgba(20,17,15,0.35)]  overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-[#E9E6DF]">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#C1440E]"></span>
              <span className="text-xs uppercase tracking-[0.2em] text-ink">
                Raya UI — Foundational architecture
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-ink-faint hover:text-ink hover:bg-rule rounded transition-colors cursor-pointer"
              data-cursor="active"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-rule bg-[#E9E6DF] px-6">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`py-3 px-4 text-xs uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'metrics'
                  ? 'border-[#C1440E] text-[#C1440E]'
                  : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Performance & Bundle
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`py-3 px-4 text-xs uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'tokens'
                  ? 'border-[#C1440E] text-[#C1440E]'
                  : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Design Tokens
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-4 text-xs uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-[#C1440E] text-[#C1440E]'
                  : 'border-transparent text-ink-faint hover:text-ink'
              }`}
            >
              <Box className="w-3.5 h-3.5" /> Live Components
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-2xl text-ink mb-2">
                    Architectural Telemetry & Efficiency
                  </h3>
                  <p className="font-body text-sm text-ink-soft">
                    Engineered with zero-runtime CSS abstractions and rigorous tree-shaking rules, Raya UI achieves an unprecedented 4.2kB gzipped footprint per critical screen.
                  </p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-paper-dim border border-rule p-4">
                    <p className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">
                      Bundle (Core)
                    </p>
                    <p className="font-display text-2xl font-bold text-[#C1440E]">4.2 kB</p>
                    <span className="text-[9px] text-ink-faint">Gzipped & Tree-shaken</span>
                  </div>
                  <div className="bg-paper-dim border border-rule p-4">
                    <p className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">
                      Render Time
                    </p>
                    <p className="font-display text-2xl font-bold text-[#C1440E]">0.4 ms</p>
                    <span className="text-[9px] text-ink-faint">P99 Mount Speed</span>
                  </div>
                  <div className="bg-paper-dim border border-rule p-4">
                    <p className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">
                      Tokens Total
                    </p>
                    <p className="font-display text-2xl font-bold text-[#C1440E]">184+</p>
                    <span className="text-[9px] text-ink-faint">Strictly Typed</span>
                  </div>
                  <div className="bg-paper-dim border border-rule p-4">
                    <p className="text-[10px] text-ink-faint uppercase tracking-widest mb-1">
                      Test Coverage
                    </p>
                    <p className="font-display text-2xl font-bold text-[#C1440E]">99.4%</p>
                    <span className="text-[9px] text-ink-faint">Automated E2E</span>
                  </div>
                </div>

                {/* Architecture Highlights */}
                <div className="p-4 bg-paper-dim border border-rule space-y-3 text-xs">
                  <div className="text-[#C1440E] uppercase tracking-wider font-semibold">
                    Key architectural pillars
                  </div>
                  <ul className="space-y-2 text-ink-soft">
                    <li className="flex items-start gap-2">
                      <span className="text-[#C1440E]">&gt;</span>
                      <span>Atomic Slot Composability eliminating Prop-Drilling in complex tables and nested drawers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C1440E]">&gt;</span>
                      <span>Hardware-accelerated CSS GPU Transforms for micro-interactions and transitions.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#C1440E]">&gt;</span>
                      <span>Automated WCAG 2.1 AAA accessibility validation across screen readers and high-contrast modes.</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'tokens' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-ink mb-2">
                    Obsidian Noir Design Tokens Hierarchy
                  </h3>
                  <p className="font-body text-sm text-ink-soft">
                    Semantic color ramps and elevation scales formulated with mathematical optical precision.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'obsidian', name: 'Background Void', hex: '#F2F0EB', contrast: 'Base Canvas' },
                    { id: 'surface', name: 'Planes Level 1', hex: '#E9E6DF', contrast: 'Surface 1' },
                    { id: 'glass', name: 'Glass Panel', hex: 'rgba(255,255,255,0.03)', contrast: 'Blur 16px' },
                    { id: 'volt', name: 'Volt Blue Accent', hex: '#C1440E', contrast: 'Active Light' },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveToken(t.id)}
                      className={`p-3 border  cursor-pointer transition-all ${
                        activeToken === t.id
                          ? 'border-[#C1440E] bg-[#C1440E]/5'
                          : 'border-rule hover:border-rule'
                      }`}
                    >
                      <div
                        className="h-10 w-full mb-2 rounded-[1px] border border-rule"
                        style={{ backgroundColor: t.hex.startsWith('rgba') ? '#DDD8CE' : t.hex }}
                      ></div>
                      <p className="font-display text-xs font-semibold text-ink">{t.name}</p>
                      <p className="text-[10px] text-[#C1440E]">{t.hex}</p>
                      <p className="text-[9px] text-ink-faint">{t.contrast}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display font-bold text-xl text-ink mb-2">
                    Interactive Component Playground
                  </h3>
                  <p className="font-body text-sm text-ink-soft">
                    Interact directly with Raya UI core primitives.
                  </p>
                </div>

                <div className="p-6 bg-[#F2F0EB] border border-rule  space-y-6">
                  {/* Button state test */}
                  <div>
                    <p className="text-[10px] text-ink-faint uppercase tracking-wider mb-3">
                      Primitive: Primary Action Button
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <button
                        onClick={() => {
                          setBtnState('loading');
                          setTimeout(() => setBtnState('success'), 1000);
                          setTimeout(() => setBtnState('default'), 3000);
                        }}
                        className="text-xs uppercase tracking-[0.2em] bg-white text-black px-6 py-3 hover:bg-[#C1440E] transition-all font-bold cursor-pointer flex items-center gap-2"
                      >
                        {btnState === 'loading' && <Cpu className="w-3.5 h-3.5 animate-spin" />}
                        {btnState === 'success' && <Check className="w-3.5 h-3.5 text-ink-faint" />}
                        <span>
                          {btnState === 'loading'
                            ? 'PROCESSING...'
                            : btnState === 'success'
                            ? 'DISPATCHED'
                            : 'TRANSMIT ACTION'}
                        </span>
                      </button>

                      <button className="text-xs uppercase tracking-[0.2em] border border-rule hover:border-[#C1440E] text-ink hover:text-[#C1440E] px-6 py-3 transition-colors cursor-pointer">
                        Secondary Ghost
                      </button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="pt-4 border-t border-rule">
                    <p className="text-[10px] text-ink-faint uppercase tracking-wider mb-3">
                      Primitive: Architectural Telemetry Badges
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#C1440E]/10 border border-[#C1440E]/30 text-[#C1440E] text-[10px] uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-[#C1440E] rounded-full animate-ping"></span>
                        Edge Ingress: 2ms
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-ink-faint/10 border border-ink-faint/30 text-ink-faint text-[10px] uppercase tracking-wider">
                        Memory Leak: 0.00%
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] uppercase tracking-wider">
                        SSR Hydration: 100%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-[#E9E6DF] border-t border-rule flex items-center justify-between">
            <span className="text-[10px] text-ink-faint">
              React 19 · TypeScript · zero CSS overhead
            </span>
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-wider text-ink hover:text-[#C1440E] px-4 py-2 border border-rule hover:border-[#C1440E] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
