const fs = require('fs');
const path = require('path');
const { createCanvas } = require('./node_modules/@napi-rs/canvas');

const dir = path.join(__dirname, 'public/portraits');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function drawCommanderPortrait(coId, opts) {
  const w = 300, h = 300;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, opts.bgColor1);
  bgGrad.addColorStop(0.6, opts.bgColor2);
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Background tactical grid / tech pattern
  ctx.strokeStyle = opts.accentColor + '33';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Draw background emblem / halo
  ctx.fillStyle = opts.accentColor + '22';
  ctx.beginPath(); ctx.arc(w / 2, h / 2 - 20, 110, 0, Math.PI * 2); ctx.fill();

  // Draw Torso / Military Uniform
  ctx.fillStyle = opts.uniformColor;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h);
  ctx.lineTo(w * 0.25, h * 0.65);
  ctx.lineTo(w * 0.38, h * 0.58);
  ctx.lineTo(w * 0.5, h * 0.62);
  ctx.lineTo(w * 0.62, h * 0.58);
  ctx.lineTo(w * 0.75, h * 0.65);
  ctx.lineTo(w * 0.85, h);
  ctx.closePath();
  ctx.fill();

  // Uniform collar & details
  ctx.fillStyle = opts.trimColor;
  ctx.beginPath();
  ctx.moveTo(w * 0.38, h * 0.58);
  ctx.lineTo(w * 0.5, h * 0.68);
  ctx.lineTo(w * 0.62, h * 0.58);
  ctx.lineTo(w * 0.5, h * 0.78);
  ctx.closePath();
  ctx.fill();

  // Shoulder epaulets / badges
  ctx.fillStyle = opts.accentColor;
  ctx.fillRect(w * 0.2, h * 0.66, 30, 8);
  ctx.fillRect(w * 0.65, h * 0.66, 30, 8);

  // Neck
  ctx.fillStyle = opts.skinColor;
  ctx.fillRect(w * 0.42, h * 0.45, w * 0.16, h * 0.18);

  // Head shape
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.38, w * 0.18, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Headgear
  ctx.fillStyle = opts.hairColor;
  if (opts.style === 'cap') {
    // Hair under cap
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.38, w * 0.2, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // Military Cap
    ctx.fillStyle = opts.uniformColor;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.22, w * 0.22, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cap visor
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.26, w * 0.24, h * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    // Badge on cap
    ctx.fillStyle = opts.accentColor;
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.2, 10, 0, Math.PI * 2); ctx.fill();
  } else if (opts.style === 'headset') {
    // Sleek cyber hair + headset
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.32, w * 0.21, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cyber Headset band
    ctx.strokeStyle = opts.accentColor;
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.35, w * 0.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    // Glowing earpiece
    ctx.fillStyle = opts.accentColor;
    ctx.beginPath(); ctx.arc(w * 0.3, h * 0.38, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.7, h * 0.38, 12, 0, Math.PI * 2); ctx.fill();
  } else if (opts.style === 'visor') {
    // Helmet / Visor
    ctx.fillStyle = opts.uniformColor;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.32, w * 0.22, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Glowing Visor
    ctx.fillStyle = opts.accentColor;
    ctx.fillRect(w * 0.32, h * 0.32, w * 0.36, h * 0.09);
  } else {
    // Short / Styled hair
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.32, w * 0.21, h * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Face Eyes & Features
  if (opts.style !== 'visor') {
    ctx.fillStyle = opts.eyeColor || '#1e293b';
    ctx.beginPath(); ctx.arc(w * 0.42, h * 0.38, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(w * 0.58, h * 0.38, 6, 0, Math.PI * 2); ctx.fill();
    // Eyebrows
    ctx.strokeStyle = opts.hairColor; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w * 0.37, h * 0.34); ctx.lineTo(w * 0.46, h * 0.35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.63, h * 0.34); ctx.lineTo(w * 0.54, h * 0.35); ctx.stroke();
    // Mouth
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w * 0.45, h * 0.46); ctx.lineTo(w * 0.55, h * 0.46); ctx.stroke();
  }

  // Holographic Overlay / UI graphics
  ctx.strokeStyle = opts.accentColor + '88';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);
  ctx.fillStyle = opts.accentColor;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(opts.titleText, 30, 42);

  const buf = canvas.toBuffer('image/jpeg', 90);
  fs.writeFileSync(path.join(dir, `${coId}.jpg`), buf);
  console.log(`Generated public/portraits/${coId}.jpg`);
}

const CO_PROFILES = {
  seraphina: {
    bgColor1: '#064e3b', bgColor2: '#022c22', accentColor: '#34d399',
    uniformColor: '#065f46', trimColor: '#10b981', skinColor: '#fde047',
    hairColor: '#34d399', eyeColor: '#059669', style: 'cap', titleText: 'MEDIC GENERAL · SERAPHINA'
  },
  zero: {
    bgColor1: '#881337', bgColor2: '#4c0519', accentColor: '#fb7185',
    uniformColor: '#9f1239', trimColor: '#f43f5e', skinColor: '#fca5a5',
    hairColor: '#1e293b', eyeColor: '#be123c', style: 'visor', titleText: 'SIEGE DIRECTOR · ZERO'
  },
  aria: {
    bgColor1: '#4c1d95', bgColor2: '#2e1065', accentColor: '#a78bfa',
    uniformColor: '#5b21b6', trimColor: '#7c3aed', skinColor: '#fef08a',
    hairColor: '#c084fc', eyeColor: '#a855f7', style: 'headset', titleText: 'CYBER OFFICER · ARIA CHEN'
  },
  kaelen: {
    bgColor1: '#075985', bgColor2: '#0c4a6e', accentColor: '#38bdf8',
    uniformColor: '#0369a1', trimColor: '#0284c7', skinColor: '#fed7aa',
    hairColor: '#fde047', eyeColor: '#0284c7', style: 'cap', titleText: 'FLIGHT CAPTAIN · KAELEN VANCE'
  },
  architect: {
    bgColor1: '#9f1239', bgColor2: '#111827', accentColor: '#f43f5e',
    uniformColor: '#1f2937', trimColor: '#e11d48', skinColor: '#e2e8f0',
    hairColor: '#e2e8f0', eyeColor: '#ef4444', style: 'visor', titleText: 'STRATEGIST · ARCHITECT'
  }
};

for (const [id, opts] of Object.entries(CO_PROFILES)) {
  drawCommanderPortrait(id, opts);
}
