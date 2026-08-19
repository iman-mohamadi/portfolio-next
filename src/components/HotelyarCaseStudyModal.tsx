import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Database, ShieldCheck } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';

interface HotelyarCaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotelyarCaseStudyModal: React.FC<HotelyarCaseStudyModalProps> = ({ isOpen, onClose }) => {
  const dialogRef = useDialog(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Hotelyar — platform case study"
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
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-[#E9E6DF]">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#C1440E]"></span>
              <span className="text-xs uppercase tracking-[0.2em] text-ink">
                Hotelyar SSG/SSR RESERVATION PLATFORM
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

          {/* Content */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-1">
            {/* Title & summary */}
            <div>
              <div className="inline-block px-2.5 py-1 bg-[#C1440E]/10 text-[#C1440E] text-[10px] uppercase tracking-widest mb-3 border border-[#C1440E]/20">
                HIGH-VOLUME E-COMMERCE / TRAVEL ENGINE
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-ink mb-3 tracking-tight">
                Brutalist Reservation & Edge Routing Architecture
              </h2>
              <p className="font-body text-base text-ink-soft font-light leading-relaxed">
                Hotelyar required sub-second worldwide indexing and room inventory synchronization. We architected a hybrid Static-Site Generation (SSG) with On-Demand Incremental Regeneration (ISR) and distributed Edge Nitro workers.
              </p>
            </div>

            {/* Core Web Vitals Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-paper-dim border border-rule p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-ink-faint uppercase tracking-wider">
                    Largest Contentful Paint
                  </span>
                  <Zap className="w-4 h-4 text-[#C1440E]" />
                </div>
                <p className="font-display text-3xl font-bold text-ink">0.38s</p>
                <span className="text-[10px] text-ink-faint">99.8th percentile</span>
              </div>

              <div className="bg-paper-dim border border-rule p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-ink-faint uppercase tracking-wider">
                    Cumulative Layout Shift
                  </span>
                  <ShieldCheck className="w-4 h-4 text-[#C1440E]" />
                </div>
                <p className="font-display text-3xl font-bold text-ink">0.000</p>
                <span className="text-[10px] text-ink-faint">Zero layout jitter</span>
              </div>

              <div className="bg-paper-dim border border-rule p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-ink-faint uppercase tracking-wider">
                    Cache Hit Ratio
                  </span>
                  <Database className="w-4 h-4 text-[#C1440E]" />
                </div>
                <p className="font-display text-3xl font-bold text-ink">96.4%</p>
                <span className="text-[10px] text-ink-faint">Edge Multi-tier Cache</span>
              </div>
            </div>

            {/* Architectural Data Flow */}
            <div className="p-6 bg-paper-dim border border-rule  space-y-4">
              <h4 className="text-xs text-[#C1440E] uppercase tracking-widest font-semibold">
                // DISTRIBUTED PIPELINE TOPOLOGY
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 border border-rule bg-ink/40">
                  <p className="text-[10px] text-ink-faint mb-1">01. INGRESS</p>
                  <p className="font-display text-xs font-semibold text-ink">Cloudflare Edge Worker</p>
                  <p className="text-[9px] text-[#C1440E] mt-1">&lt; 5ms geo-dispatch</p>
                </div>
                <div className="p-3 border border-rule bg-ink/40">
                  <p className="text-[10px] text-ink-faint mb-1">02. ENGINE</p>
                  <p className="font-display text-xs font-semibold text-ink">Nuxt 3 Nitro Cluster</p>
                  <p className="text-[9px] text-[#C1440E] mt-1">SSR / Streaming HTML</p>
                </div>
                <div className="p-3 border border-rule bg-ink/40">
                  <p className="text-[10px] text-ink-faint mb-1">03. DATA LAYER</p>
                  <p className="font-display text-xs font-semibold text-ink">Redis Inventory Mesh</p>
                  <p className="text-[9px] text-[#C1440E] mt-1">Real-time lock queue</p>
                </div>
                <div className="p-3 border border-rule bg-ink/40">
                  <p className="text-[10px] text-ink-faint mb-1">04. CLIENT</p>
                  <p className="font-display text-xs font-semibold text-ink">Island Hydration</p>
                  <p className="text-[9px] text-[#C1440E] mt-1">Zero blocking JS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#E9E6DF] border-t border-rule flex items-center justify-between">
            <span className="text-[10px] text-ink-faint">
              STACK: VUE 3 / NUXT 3 / PINIA / TAILWIND / NITRO
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
