import type { GraphicsQuality, Settings } from '../game/types';

export interface HardwareInfo {
  cores: number;
  memory: number; // GB estimated
  gpu: string;
  dpr: number;
  tier: 'ultra' | 'high' | 'medium' | 'low';
}

export function detectHardware(): HardwareInfo {
  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
  const memory = typeof navigator !== 'undefined' && (navigator as unknown as { deviceMemory?: number }).deviceMemory ? (navigator as unknown as { deviceMemory?: number }).deviceMemory! : 4;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  let gpu = 'Standard Renderer';
  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpu = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gpu;
        }
      }
    }
  } catch {
    /* ignore canvas/webgl blocked */
  }

  const gpuLower = gpu.toLowerCase();
  const isHighEndGpu =
    gpuLower.includes('nvidia') ||
    gpuLower.includes('radeon') ||
    gpuLower.includes('apple') ||
    gpuLower.includes('adreno (tm) 7') ||
    gpuLower.includes('adreno (tm) 6') ||
    gpuLower.includes('mali-g7') ||
    gpuLower.includes('mali-g8') ||
    gpuLower.includes('angle');

  let tier: 'ultra' | 'high' | 'medium' | 'low' = 'high';

  if ((cores >= 8 || memory >= 8 || isHighEndGpu) && dpr >= 1) {
    tier = 'ultra';
  } else if (cores >= 4 || memory >= 4) {
    tier = 'high';
  } else if (cores >= 2) {
    tier = 'medium';
  } else {
    tier = 'low';
  }

  return { cores, memory, gpu, dpr, tier };
}

export function getGraphicsPreset(preset: GraphicsQuality): Partial<Settings> {
  const info = detectHardware();
  const effectiveTier = preset === 'auto' ? info.tier : preset;

  switch (effectiveTier) {
    case 'ultra':
      return {
        graphicsQuality: preset,
        fpsTarget: 'uncapped',
        dprScale: 'auto',
        particles: 'full',
        shadows: true,
        weatherEffects: true,
      };
    case 'high':
      return {
        graphicsQuality: preset,
        fpsTarget: 'uncapped',
        dprScale: 'auto',
        particles: 'full',
        shadows: true,
        weatherEffects: true,
      };
    case 'medium':
      return {
        graphicsQuality: preset,
        fpsTarget: 60,
        dprScale: 1,
        particles: 'medium',
        shadows: true,
        weatherEffects: true,
      };
    case 'low':
      return {
        graphicsQuality: preset,
        fpsTarget: 60,
        dprScale: 0.75,
        particles: 'low',
        shadows: false,
        weatherEffects: false,
      };
    default:
      return {
        graphicsQuality: preset,
        fpsTarget: 'uncapped',
        dprScale: 'auto',
        particles: 'full',
        shadows: true,
        weatherEffects: true,
      };
  }
}
