#!/usr/bin/env node
'use strict';

/**
 * Trailer v3: Ken Burns stills + xfade joins + weather lightning composite.
 * ~90s. Loops the 61s score.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const STILLS = path.join(ROOT, 'stills');
const CARDS = path.join(ROOT, 'cards');
const PLATES = path.join(ROOT, 'plates');
const CLIPS = path.join(ROOT, 'clips');
const MUSIC = path.join(ROOT, 'music', 'score.wav');
const MASTER = path.join(ROOT, 'america-trailer.mp4');

const FFMPEG = process.env.FFMPEG
  || '/Users/timgong/Library/Application Support/bilibili/ffmpeg/ffmpeg';

fs.mkdirSync(CLIPS, { recursive: true });

function exists(p) { return p && fs.existsSync(p); }
function pick() {
  for (const p of arguments) if (exists(p)) return p;
  return null;
}
function run(args, label) {
  const res = spawnSync(FFMPEG, args, { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error('ffmpeg failed: ' + label);
  }
}

const SHOTS = [
  { id: 'a-hero', t: 7.20, fade: 0.70, mode: 'push', src: () => path.join(STILLS, 'hero.png') },
  { id: 'a-classic', t: 0.85, fade: 0.22, mode: 'hold', src: () => path.join(STILLS, 'hero-classic.png') },
  { id: 'a-light', t: 0.85, fade: 0.22, mode: 'hold', src: () => path.join(STILLS, 'hero-light.png') },
  { id: 'a-elegant', t: 0.85, fade: 0.22, mode: 'hold', src: () => path.join(STILLS, 'hero-elegant.png') },
  { id: 'a-glass', t: 0.70, fade: 0.55, mode: 'hold', src: () => path.join(STILLS, 'hero.png') },
  { id: 'a-teaser', t: 4.60, fade: 0.55, mode: 'push-soft', src: () => path.join(STILLS, 'gallery-teaser.png') },
  { id: 'a-roads', t: 4.00, fade: 0.70, mode: 'drift-left', src: () => pick(path.join(STILLS, 'gallery-roads.png'), path.join(STILLS, 'gallery-masonry.png')) },
  { id: 'a-ca58', t: 6.40, fade: 0.85, mode: 'drive', src: () => path.join(PLATES, 'ca58baker.jpg') },
  { id: 'a-lightbox', t: 5.20, fade: 0.55, mode: 'push-soft', src: () => pick(path.join(STILLS, 'lightbox-ca58.png'), path.join(STILLS, 'gallery-lightbox.png')) },
  { id: 'b-dest', t: 5.60, fade: 0.50, mode: 'drift-right', src: () => path.join(STILLS, 'destinations.png') },
  { id: 'b-canyon', t: 3.80, fade: 0.50, mode: 'push', src: () => path.join(PLATES, 'canyon.jpg') },
  { id: 'b-regions', t: 4.00, fade: 0.45, mode: 'drift-left', src: () => path.join(STILLS, 'regions.png') },
  { id: 'b-seasons', t: 3.80, fade: 0.45, mode: 'drift-right', src: () => path.join(STILLS, 'seasons.png') },
  { id: 'b-culture', t: 4.20, fade: 0.45, mode: 'hold', src: () => path.join(STILLS, 'culture.png') },
  { id: 'b-routes', t: 4.20, fade: 0.50, mode: 'push-soft', src: () => path.join(STILLS, 'routes.png') },
  { id: 'b-essentials', t: 3.20, fade: 0.40, mode: 'hold', src: () => path.join(STILLS, 'essentials.png') },
  { id: 'b-facts-full', t: 2.10, fade: 0.25, mode: 'hold', src: () => pick(path.join(STILLS, 'funfacts-full.png'), path.join(STILLS, 'funfacts.png')) },
  { id: 'b-facts-red', t: 1.50, fade: 0.25, mode: 'hold', src: () => path.join(STILLS, 'funfacts-reduced.png') },
  { id: 'b-facts-off', t: 1.50, fade: 0.45, mode: 'hold', src: () => path.join(STILLS, 'funfacts-off.png') },
  { id: 'c-drive', t: 2.80, fade: 0.40, mode: 'hold', src: () => path.join(STILLS, 'drive.png') },
  { id: 'c-tools', t: 3.40, fade: 0.35, mode: 'push-soft', src: () => path.join(STILLS, 'tools-hub.png') },
  { id: 'c-currency', t: 2.30, fade: 0.30, mode: 'hold', src: () => path.join(STILLS, 'currency.png') },
  { id: 'c-tiptax', t: 2.10, fade: 0.30, mode: 'hold', src: () => path.join(STILLS, 'tip-tax.png') },
  { id: 'c-clock', t: 2.10, fade: 0.30, mode: 'hold', src: () => path.join(STILLS, 'clock.png') },
  { id: 'c-emergency', t: 2.10, fade: 0.45, mode: 'hold', src: () => path.join(STILLS, 'emergency.png') },
  { id: 'c-weather', t: 9.20, fade: 0.50, mode: 'weather', src: () => pick(path.join(STILLS, 'weather-detail.png'), path.join(STILLS, 'weather-list.png')) },
  { id: 'c-settings', t: 3.80, fade: 0.55, mode: 'hold', src: () => path.join(STILLS, 'settings.png') },
  { id: 'c-end', t: 3.40, fade: 0, mode: 'hold', src: () => path.join(CARDS, 'end.png') },
];

function vfKen(mode, seconds) {
  const frames = Math.max(2, Math.round(seconds * 24));
  if (mode === 'hold') {
    return 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24';
  }
  if (mode === 'drive') {
    return `scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(1.24,1+0.24*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)+40':d=${frames}:s=1920x1080:fps=24`;
  }
  if (mode === 'push') {
    return `scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(1.12,1+0.12*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`;
  }
  if (mode === 'push-soft') {
    return `scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(1.07,1+0.07*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`;
  }
  if (mode === 'drift-right') {
    return `scale=2304:1296:force_original_aspect_ratio=increase,crop=1920:1080:'(in_w-out_w)*t/${seconds}':'(in_h-out_h)*0.32',fps=24`;
  }
  if (mode === 'drift-left') {
    return `scale=2304:1296:force_original_aspect_ratio=increase,crop=1920:1080:'(in_w-out_w)*(1-t/${seconds})':'(in_h-out_h)*0.38',fps=24`;
  }
  return 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24';
}

function encode(out) {
  return ['-r', '24', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-an', out];
}

function renderWeather(src, seconds, out) {
  const sky = path.join(PLATES, 'sky-only.jpg');
  const bolt = path.join(PLATES, 'lightning.jpg');
  const hasSky = exists(sky);
  const hasBolt = exists(bolt);
  console.log('  weather composite', seconds.toFixed(2) + 's');
  const filters = [
    `[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,zoompan=z='min(1.05,1+0.05*on/${Math.round(seconds * 24)})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${Math.round(seconds * 24)}:s=1920x1080:fps=24[ui]`,
  ];
  let last = '[ui]';
  const inputs = ['-loop', '1', '-framerate', '24', '-t', String(seconds), '-i', src];
  if (hasSky) {
    inputs.push('-loop', '1', '-framerate', '24', '-t', String(seconds), '-i', sky);
    filters.push(`[1:v]scale=1920:520,crop=1920:520,format=rgba,colorchannelmixer=aa=0.42[sky]`);
    filters.push(`${last}[sky]overlay=0:0:format=auto[wx0]`);
    last = '[wx0]';
  }
  if (hasBolt) {
    const idx = hasSky ? 2 : 1;
    inputs.push('-loop', '1', '-framerate', '24', '-t', String(seconds), '-i', bolt);
    filters.push(`[${idx}:v]colorkey=0x0a0a0a:0.38:0.18,scale=520:980[bolt]`);
    filters.push(`${last}[bolt]overlay=x=1180:y=-60:enable='between(t,2.15,2.34)+between(t,5.05,5.20)'[wx1]`);
    last = '[wx1]';
  }
  filters.push(`${last}eq=brightness='if(between(t,2.15,2.32)+between(t,5.05,5.18),0.26,0)',fps=24[vout]`);
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '[vout]',
    '-t', String(seconds),
    ...encode(out),
  ], 'weather');
}

function renderShot(shot) {
  const src = shot.src();
  if (!exists(src)) throw new Error('Missing ' + shot.id + ' → ' + src);
  const out = path.join(CLIPS, `${shot.id}.mp4`);
  if (shot.mode === 'weather') {
    renderWeather(src, shot.t, out);
    return out;
  }
  console.log('  clip', shot.id, shot.t.toFixed(2) + 's', shot.mode);
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-loop', '1', '-framerate', '24', '-i', src,
    '-t', String(shot.t),
    '-vf', vfKen(shot.mode, shot.t),
    ...encode(out),
  ], shot.id);
  return out;
}

function xfadeJoin(files, fades) {
  // Sequential xfade. files[i] duration = shots[i].t
  const out = path.join(CLIPS, '_v3-silent.mp4');
  if (files.length === 1) {
    fs.copyFileSync(files[0], out);
    return out;
  }
  const inputs = [];
  files.forEach((f) => inputs.push('-i', f));
  let filter = '';
  let acc = SHOTS[0].t;
  let last = '[0:v]';
  for (let i = 1; i < files.length; i++) {
    const fade = Math.min(fades[i - 1] || 0.4, SHOTS[i - 1].t - 0.08, SHOTS[i].t - 0.08);
    const offset = acc - fade;
    const tag = i === files.length - 1 ? '[vout]' : `[x${i}]`;
    filter += `${last}[${i}:v]xfade=transition=fade:duration=${fade.toFixed(3)}:offset=${offset.toFixed(3)}${tag}`;
    if (i < files.length - 1) filter += ';';
    last = tag;
    acc = offset + SHOTS[i].t;
  }
  console.log('  xfade graph', files.length, 'clips, ~' + acc.toFixed(2) + 's');
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    ...inputs,
    '-filter_complex', filter,
    '-map', '[vout]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an',
    out,
  ], 'xfade');
  return { out, dur: acc };
}

function mux(silent, pictureDur) {
  if (!exists(MUSIC)) {
    fs.copyFileSync(silent, MASTER);
    return;
  }
  const loopAt = 50.0;
  const fadeOutAt = Math.max(2, pictureDur - 2.6);
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', silent,
    '-i', MUSIC,
    '-filter_complex',
    `[1:a]asplit=2[s1][s2];` +
    `[s1]afade=t=in:st=0:d=0.3[a1];` +
    `[s2]adelay=${Math.round(loopAt * 1000)}|${Math.round(loopAt * 1000)},afade=t=in:st=${loopAt}:d=4[a2];` +
    `[a1][a2]amix=inputs=2:duration=longest:dropout_transition=3,afade=t=out:st=${fadeOutAt.toFixed(2)}:d=2.5[a]`,
    '-map', '0:v:0', '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-t', pictureDur.toFixed(3),
    '-movflags', '+faststart',
    MASTER,
  ], 'mux');
}

function main() {
  if (!exists(FFMPEG)) throw new Error('ffmpeg not found');
  const files = [];
  const fades = [];
  for (const shot of SHOTS) {
    files.push(renderShot(shot));
    fades.push(shot.fade);
  }
  fades.pop();
  const { out, dur } = xfadeJoin(files, fades);
  const faded = path.join(CLIPS, '_v3-fade.mp4');
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', out,
    '-vf', `fade=t=in:st=0:d=0.7,fade=t=out:st=${Math.max(0, dur - 0.8).toFixed(2)}:d=0.75`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an',
    faded,
  ], 'edge-fade');
  mux(faded, dur);
  const st = fs.statSync(MASTER);
  console.log('Master', MASTER, (st.size / 1024 / 1024).toFixed(1) + ' MB', '~' + dur.toFixed(2) + 's');
}

main();
