import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as THREE from 'three';
import { X, RotateCcw, Box, Sliders, Play, Pause } from 'lucide-react';
import { useDialog } from '../hooks/useDialog';

interface Woodcoder3DModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Woodcoder3DModal: React.FC<Woodcoder3DModalProps> = ({ isOpen, onClose }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  
  // Parametric state
  const [width, setWidth] = useState<number>(3.0);
  const [height, setHeight] = useState<number>(4.0);
  const [depth, setDepth] = useState<number>(1.2);
  const [shelves, setShelves] = useState<number>(4);
  const [dividers, setDividers] = useState<number>(2);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [materialType, setMaterialType] = useState<'cyber' | 'wood' | 'gold'>('cyber');
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [polyStats, setPolyStats] = useState({ vertices: 0, faces: 0 });
  const dialogRef = useDialog(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return;

    const container = canvasContainerRef.current;
    if (!container) return;

    const w = container.clientWidth || 600;
    const h = container.clientHeight || 450;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.0);
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00f0ff, 3, 10);
    pointLight.position.set(0, 0, 2);
    scene.add(pointLight);

    // Ground Grid
    const gridHelper = new THREE.GridHelper(10, 20, 0x00f0ff, 0x222222);
    gridHelper.position.y = -height / 2 - 0.1;
    scene.add(gridHelper);

    // Dynamic Shelf Mesh Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Material builder
    const getMaterial = () => {
      if (materialType === 'cyber') {
        return new THREE.MeshStandardMaterial({
          color: 0x111111,
          metalness: 0.85,
          roughness: 0.2,
          wireframe: isWireframe,
          emissive: 0x002233,
          emissiveIntensity: 0.4,
        });
      } else if (materialType === 'wood') {
        return new THREE.MeshStandardMaterial({
          color: 0x4a3728,
          metalness: 0.1,
          roughness: 0.7,
          wireframe: isWireframe,
        });
      } else {
        return new THREE.MeshStandardMaterial({
          color: 0xd4af37,
          metalness: 0.95,
          roughness: 0.15,
          wireframe: isWireframe,
        });
      }
    };

    const boardThick = 0.08;
    const mat = getMaterial();

    let totalVerts = 0;
    let totalFaces = 0;

    const addBox = (bw: number, bh: number, bd: number, px: number, py: number, pz: number) => {
      const geo = new THREE.BoxGeometry(bw, bh, bd);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      modelGroup.add(mesh);

      totalVerts += geo.attributes.position.count;
      totalFaces += geo.index ? geo.index.count / 3 : 12;
    };

    // Construct Parametric Cabinet Shelves
    // 1. Left and Right side panels
    addBox(boardThick, height, depth, -width / 2 + boardThick / 2, 0, 0);
    addBox(boardThick, height, depth, width / 2 - boardThick / 2, 0, 0);

    // 2. Top and Bottom panels
    addBox(width, boardThick, depth, 0, height / 2 - boardThick / 2, 0);
    addBox(width, boardThick, depth, 0, -height / 2 + boardThick / 2, 0);

    // 3. Back panel (thin)
    addBox(width, height, 0.02, 0, 0, -depth / 2 + 0.01);

    // 4. Horizontal Shelves
    const shelfSpacing = (height - boardThick * (shelves + 1)) / (shelves + 1);
    for (let i = 1; i <= shelves; i++) {
      const y = -height / 2 + boardThick * i + shelfSpacing * i;
      addBox(width - boardThick * 2, boardThick, depth - 0.05, 0, y, 0.02);
    }

    // 5. Vertical Dividers
    const divSpacing = (width - boardThick * (dividers + 1)) / (dividers + 1);
    for (let j = 1; j <= dividers; j++) {
      const x = -width / 2 + boardThick * j + divSpacing * j;
      addBox(boardThick, height - boardThick * 2, depth - 0.05, x, 0, 0.02);
    }

    setPolyStats({ vertices: totalVerts, faces: totalFaces });

    // Interactive mouse dragging orbit
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      modelGroup.rotation.y += deltaX * 0.01;
      modelGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (isRotating && !isDragging) {
        modelGroup.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isOpen, width, height, depth, shelves, dividers, isWireframe, materialType, isRotating]);

  return (
    <AnimatePresence>
      {isOpen && (
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Woodcoder — parametric 3D experience"
        tabIndex={-1}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
      >
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl bg-paper-dim border border-rule shadow-[0_24px_60px_-20px_rgba(20,17,15,0.35)]  overflow-hidden my-auto max-h-[95vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rule bg-paper-dim">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-spot"></span>
              <span className="text-xs uppercase tracking-[0.2em] text-ink">
                Woodcoder PARAMETRIC MESH ENGINE
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

          {/* Viewport and Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
            {/* 3D Viewport */}
            <div className="lg:col-span-2 relative min-h-[350px] lg:min-h-[480px] bg-paper flex items-center justify-center">
              <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* Viewport HUD Overlays */}
              <div className="absolute top-4 left-4 text-[10px] text-white/70 bg-black/60 backdrop-blur-md p-2.5 border border-rule  space-y-1">
                <div className="flex items-center gap-2 text-spot">
                  <Box className="w-3 h-3" />
                  <span>RENDER ENGINE: THREE.JS WEBGL2</span>
                </div>
                <div>VERTICES: {polyStats.vertices.toLocaleString()}</div>
                <div>TRIANGLES: {polyStats.faces.toLocaleString()}</div>
                <div className="text-ink-faint">FPS: 60.0 (STABLE)</div>
              </div>

              {/* Orbit instructions & rotate toggle */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className="text-[10px] uppercase tracking-wider bg-black/70 hover:bg-white/20 text-white/85 px-3 py-1.5 border border-white/20 flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-colors"
                >
                  {isRotating ? <Pause className="w-3 h-3 text-spot" /> : <Play className="w-3 h-3" />}
                  <span>{isRotating ? 'Pause Spin' : 'Auto Spin'}</span>
                </button>
              </div>
            </div>

            {/* Parametric Controls Panel */}
            <div className="p-6 bg-paper-deep border-t lg:border-t-0 lg:border-l border-rule overflow-y-auto space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg text-ink flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-spot" /> Parametric Dimensions
                </h3>
                <button
                  onClick={() => {
                    setWidth(3.0);
                    setHeight(4.0);
                    setDepth(1.2);
                    setShelves(4);
                    setDividers(2);
                    setIsWireframe(false);
                    setMaterialType('cyber');
                  }}
                  className="p-1 text-ink-faint hover:text-ink transition-colors"
                  title="Reset to default geometry"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-4 text-xs">
                {/* Width */}
                <div>
                  <div className="flex justify-between text-ink-soft mb-1">
                    <span>Width (X-Axis):</span>
                    <span className="text-spot">{width.toFixed(1)}m</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="5.0"
                    step="0.1"
                    value={width}
                    onChange={(e) => setWidth(parseFloat(e.target.value))}
                    className="w-full accent-spot bg-rule  h-1 cursor-pointer"
                  />
                </div>

                {/* Height */}
                <div>
                  <div className="flex justify-between text-ink-soft mb-1">
                    <span>Height (Y-Axis):</span>
                    <span className="text-spot">{height.toFixed(1)}m</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="6.0"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value))}
                    className="w-full accent-spot bg-rule  h-1 cursor-pointer"
                  />
                </div>

                {/* Depth */}
                <div>
                  <div className="flex justify-between text-ink-soft mb-1">
                    <span>Depth (Z-Axis):</span>
                    <span className="text-spot">{depth.toFixed(1)}m</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.5"
                    step="0.1"
                    value={depth}
                    onChange={(e) => setDepth(parseFloat(e.target.value))}
                    className="w-full accent-spot bg-rule  h-1 cursor-pointer"
                  />
                </div>

                {/* Shelves */}
                <div>
                  <div className="flex justify-between text-ink-soft mb-1">
                    <span>Horizontal Shelves:</span>
                    <span className="text-spot">{shelves} tiers</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={shelves}
                    onChange={(e) => setShelves(parseInt(e.target.value))}
                    className="w-full accent-spot bg-rule  h-1 cursor-pointer"
                  />
                </div>

                {/* Vertical Dividers */}
                <div>
                  <div className="flex justify-between text-ink-soft mb-1">
                    <span>Vertical Columns:</span>
                    <span className="text-spot">{dividers} columns</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={dividers}
                    onChange={(e) => setDividers(parseInt(e.target.value))}
                    className="w-full accent-spot bg-rule  h-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Shaders & Materials */}
              <div className="pt-4 border-t border-rule space-y-3">
                <p className="text-[10px] text-ink-faint uppercase tracking-widest">
                  Shader & Mesh Mode
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setMaterialType('cyber')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider text-center border transition-colors cursor-pointer ${
                      materialType === 'cyber'
                        ? 'border-spot bg-spot/10 text-spot'
                        : 'border-rule text-ink-faint hover:text-ink'
                    }`}
                  >
                    Cyber Noir
                  </button>
                  <button
                    onClick={() => setMaterialType('wood')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider text-center border transition-colors cursor-pointer ${
                      materialType === 'wood'
                        ? 'border-spot bg-spot/10 text-spot'
                        : 'border-rule text-ink-faint hover:text-ink'
                    }`}
                  >
                    Raw Walnut
                  </button>
                  <button
                    onClick={() => setMaterialType('gold')}
                    className={`py-2 px-2 text-[10px] uppercase tracking-wider text-center border transition-colors cursor-pointer ${
                      materialType === 'gold'
                        ? 'border-spot bg-spot/10 text-spot'
                        : 'border-rule text-ink-faint hover:text-ink'
                    }`}
                  >
                    Brass Mesh
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-soft">Wireframe Mesh</span>
                  <button
                    onClick={() => setIsWireframe(!isWireframe)}
                    className={`text-[10px] px-3 py-1 uppercase tracking-wider border  transition-colors cursor-pointer ${
                      isWireframe
                        ? 'border-spot text-spot bg-spot/10'
                        : 'border-rule text-ink-faint hover:text-ink'
                    }`}
                  >
                    {isWireframe ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-paper-dim border-t border-rule flex items-center justify-between">
            <span className="text-[10px] text-ink-faint">
              GPU PARAMETRIC ENGINE // REAL-TIME GEOMETRY COMPILATION
            </span>
            <button
              onClick={onClose}
              className="text-xs uppercase tracking-wider text-ink hover:text-spot px-4 py-2 border border-rule hover:border-spot transition-colors cursor-pointer"
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
