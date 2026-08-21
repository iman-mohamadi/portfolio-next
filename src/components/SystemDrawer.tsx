import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Terminal, Cpu, Download, Check } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';
import { useSmoothScroll } from '../providers/SmoothScrollProvider';

interface SystemDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDrawer: React.FC<SystemDrawerProps> = ({ isOpen, onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [gpuInfo, setGpuInfo] = useState<string>('Detecting WebGL Hardware...');
  const dialogRef = useDialog(isOpen, onClose);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          setGpuInfo(renderer || 'Standard WebGL2 Accelerated GPU');
        } else {
          setGpuInfo('WebGL2 Hardware Accelerated');
        }
      }
    } catch {
      setGpuInfo('WebGL2 Pipeline Active');
    }
  }, []);

  const handleDownloadDossier = () => {
    setDownloaded(true);
    // Create text file dossier
    const dossierContent = `
=====================================================
IMAN MOHAMMADI // ARCHITECTURAL DOSSIER
Role: Senior Front-End Architect / WebGL Specialist
Experience: 9+ Years High-Performance Engineering
=====================================================

CORE PHILOSOPHY:
"Bridging complex structural engineering with immersive high-performance web experiences."

PRODUCTION ARCHITECTURES:
- RAYA UI: Enterprise-grade foundational design system for infinite scalability.
- HOTELYAR: Brutalist high-volume reservation engine with sub-second LCP.
- WOODCODER: Real-time 3D WebGL parametric generative geometry.

TECHNICAL TELEMETRY:
- Languages: TypeScript, JavaScript (ESNext), Python, GLSL / WGSL, Rust (WASM)
- Frameworks: React 19, Next.js, Vue 3, Nuxt 3, Three.js, WebGL2
- Performance: Edge Caching, Server-Side Rendering (SSR), Zero-Jank 60FPS WebGL

CONTACT: Im.EnzO.021@gmail.com
=====================================================
    `.trim();

    const blob = new Blob([dossierContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'IMAN_MOHAMMADI_ARCHITECT_DOSSIER.txt';
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloaded(false), 3000);
  };

  const scrollToSection = (id: string) => {
    onClose();
    // Wait for the drawer's close animation and its scroll-lock release before
    // handing the target to Lenis — scrolling while locked is a no-op.
    setTimeout(() => scrollTo(`#${id}`), 260);
  };

  return (
    <AnimatePresence>
      {isOpen && (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="System menu"
        tabIndex={-1}
        className="fixed inset-0 z-[120] flex justify-end bg-black/70 backdrop-blur-md"
      >
        {/* Backdrop click */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} aria-hidden="true" />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-paper-dim border-l border-rule h-full p-8 overflow-y-auto flex flex-col justify-between z-10"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-6 border-b border-rule mb-8">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-spot">
                <Terminal className="w-4 h-4" />
                <span>Index</span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-ink-faint hover:text-ink hover:bg-rule rounded transition-colors cursor-pointer"
                data-cursor="active"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Navigation */}
            <div className="space-y-4 mb-10">
              <p className="text-[10px] text-ink-faint uppercase tracking-[0.25em]">
                DIRECTORY INDEX
              </p>
              <nav className="space-y-3 font-display text-2xl font-bold">
                <div>
                  <button
                    onClick={() => scrollToSection('hero')}
                    className="text-ink hover:text-spot transition-colors uppercase tracking-tight flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-xs text-spot font-normal">01</span>
                    <span>ARCHITECTURE</span>
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => scrollToSection('capabilities')}
                    className="text-ink hover:text-spot transition-colors uppercase tracking-tight flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-xs text-spot font-normal">02</span>
                    <span>CAPABILITIES</span>
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => scrollToSection('work')}
                    className="text-ink hover:text-spot transition-colors uppercase tracking-tight flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-xs text-spot font-normal">03</span>
                    <span>PLATFORMS</span>
                  </button>
                </div>
                <div>
                  <button
                    onClick={() => scrollToSection('contact')}
                    className="text-ink hover:text-spot transition-colors uppercase tracking-tight flex items-center gap-3 cursor-pointer"
                  >
                    <span className="text-xs text-spot font-normal">04</span>
                    <span>CONTACT</span>
                  </button>
                </div>
              </nav>
            </div>

            {/* System Diagnostics */}
            <div className="p-4 bg-paper-dim border border-rule  space-y-3 text-xs mb-8">
              <div className="flex items-center gap-2 text-ink-soft font-semibold border-b border-rule pb-2">
                <Cpu className="w-3.5 h-3.5 text-spot" />
                <span>HARDWARE & SHADER PIPELINE</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-ink-faint">
                <div className="flex justify-between">
                  <span>GPU Acceleration:</span>
                  <span className="text-spot">ACTIVE</span>
                </div>
                <div className="flex justify-between">
                  <span>Device Pixel Ratio:</span>
                  <span className="text-ink">{window.devicePixelRatio || 1}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Color Gamut:</span>
                  <span className="text-ink">Display P3 / sRGB</span>
                </div>
                <div className="text-[10px] text-ink-faint pt-1 truncate">
                  HW: {gpuInfo}
                </div>
              </div>
            </div>

            {/* Experience Timeline */}
            <div className="space-y-3 text-xs mb-8">
              <p className="text-[10px] text-ink-faint uppercase tracking-[0.25em]">
                CAREER CHRONOLOGY
              </p>
              <div className="border-l border-rule pl-4 space-y-4">
                <div>
                  <div className="text-ink font-semibold">Senior Front-End Architect</div>
                  <div className="text-spot text-[11px]">2021 — PRESENT</div>
                  <div className="text-ink-faint text-[11px]">Directing global enterprise web infrastructure & micro-frontends.</div>
                </div>
                <div>
                  <div className="text-ink font-semibold">Lead WebGL & 3D Interactive Engineer</div>
                  <div className="text-spot text-[11px]">2018 — 2021</div>
                  <div className="text-ink-faint text-[11px]">Custom shader pipelines, visual configurators, generative canvases.</div>
                </div>
                <div>
                  <div className="text-ink font-semibold">Senior UI Systems Engineer</div>
                  <div className="text-spot text-[11px]">2015 — 2018</div>
                  <div className="text-ink-faint text-[11px]">High-speed SPA frameworks, SSR caching, reactive architectures.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dossier Download Action */}
          <div className="pt-6 border-t border-rule">
            <button
              onClick={handleDownloadDossier}
              className="w-full text-xs uppercase tracking-[0.2em] bg-ink text-paper py-4 hover:bg-spot hover:text-paper transition-all duration-300 font-bold flex items-center justify-center gap-2 cursor-pointer"
              data-cursor="active"
            >
              {downloaded ? (
                <>
                  <Check className="w-4 h-4 text-ink-faint" />
                  <span>DOSSIER EXPORTED</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Architecture Dossier</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
