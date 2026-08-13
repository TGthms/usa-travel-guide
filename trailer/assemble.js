#!/usr/bin/env node
'use strict';

/**
 * Cut recorded UI motion + B-roll into a 1080p24 trailer and mux the score.
 * This is a film cut, not a stills slideshow.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;
const RAW = path.join(ROOT, 'raw');
const CARDS = path.join(ROOT, 'cards');
const PLATES = path.join(ROOT, 'plates');
const CLIPS = path.join(ROOT, 'clips');
const MUSIC = path.join(ROOT, 'music', 'score.wav');
const MASTER = path.join(ROOT, 'america-trailer.mp4');
const LIST = path.join(CLIPS, 'concat.txt');

const FFMPEG = process.env.FFMPEG
  || '/Users/timgong/Library/Application Support/bilibili/ffmpeg/ffmpeg';

fs.mkdirSync(CLIPS, { recursive: true });

function exists(p) {
  return p && fs.existsSync(p);
}

function run(args, label) {
  const res = spawnSync(FFMPEG, args, { encoding: 'utf8' });
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    throw new Error('ffmpeg failed: ' + label);
  }
}

/**
 * Live takes are trimmed from Playwright webm.
 * B-roll plates get real camera energy (push + lightning), not a hold.
 * Type is a super over picture — never a black slide (except the end card).
 */
function loadMarks() {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAW, 'marks.json'), 'utf8'));
  } catch (_) {
    return {};
  }
}

const SHOTS = [
  {
    id: '01-home',
    kind: 'video',
    src: '01-home.webm',
    from: 'action',
    t: 11.70,
  },
  {
    id: '03-highway',
    kind: 'plate',
    src: path.join(PLATES, 'highway.jpg'),
    t: 4.90,
    mode: 'drive',
  },
  {
    id: '04-gallery',
    kind: 'video',
    src: '02-gallery.webm',
    from: 'action',
    t: 7.10,
  },
  {
    id: '05-dest',
    kind: 'video',
    src: '03-dest.webm',
    from: 'action',
    t: 6.40,
  },
  {
    id: '06-canyon',
    kind: 'plate',
    src: path.join(PLATES, 'canyon.jpg'),
    t: 2.90,
    mode: 'push',
  },
  {
    id: '07-regions',
    kind: 'video',
    src: '04-regions.webm',
    from: 'action',
    t: 6.50,
  },
  {
    id: '08-tools',
    kind: 'video',
    src: '05-tools.webm',
    from: 'action',
    t: 5.20,
  },
  {
    id: '09-drive',
    kind: 'video',
    src: '06-drive.webm',
    from: 'action',
    t: 2.80,
  },
  {
    id: '10-storm',
    kind: 'plate',
    src: path.join(PLATES, 'storm.jpg'),
    t: 3.50,
    mode: 'storm',
    overlay: { file: 'sky-super.png', inn: 0.15, hold: 2.2, out: 0.40 },
  },
  {
    id: '11-weather',
    kind: 'video',
    src: '07-weather.webm',
    from: 'click',
    t: 5.40,
  },
  {
    id: '12-settings',
    kind: 'video',
    src: '08-settings.webm',
    from: 'open',
    t: 2.10,
  },
  {
    id: '13-end',
    kind: 'plate',
    src: path.join(CARDS, 'end.png'),
    t: 2.50,
    mode: 'hold',
  },
];

function startTime(shot, marks) {
  if (typeof shot.ss === 'number') return shot.ss;
  const key = (shot.src || '').replace(/\.webm$/, '');
  const m = marks[key] || {};
  if (shot.from && m[shot.from] != null) return m[shot.from];
  return 0.25;
}

function overlayFilter(ov, duration) {
  if (!ov) return null;
  const fadeOutAt = Math.max(ov.inn + 0.3, duration - ov.out - 0.15);
  return `[1:v]format=rgba,fade=t=in:st=0:d=${ov.inn}:alpha=1,fade=t=out:st=${fadeOutAt.toFixed(2)}:d=${ov.out}:alpha=1[ov];[0:v][ov]overlay=0:0:format=auto`;
}

function plateVf(mode, seconds) {
  const frames = Math.max(2, Math.round(seconds * 24));
  if (mode === 'hold') {
    return 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24';
  }
  if (mode === 'drive') {
    return `scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(1.22,1+0.22*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)-${Math.round(40)}':d=${frames}:s=1920x1080:fps=24`;
  }
  if (mode === 'storm') {
    return `scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(1.12,1+0.12*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24,eq=brightness='if(between(t,1.35,1.46)+between(t,1.52,1.58),0.28,0)':saturation=1.08`;
  }
  return `scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,zoompan=z='min(1.14,1+0.14*on/${frames})':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`;
}

function encodeArgs(out) {
  return [
    '-r', '24',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p',
    '-an',
    out,
  ];
}

function renderShot(shot) {
  const out = path.join(CLIPS, `${shot.id}.mp4`);
  const ovPath = shot.overlay ? path.join(CARDS, shot.overlay.file) : null;
  const useOv = ovPath && exists(ovPath);

  if (shot.kind === 'video') {
    const src = path.join(RAW, shot.src);
    if (!exists(src)) throw new Error('Missing recording ' + shot.src);
    const vf = 'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24';
    console.log('  clip', shot.id, 'video', 'ss=' + shot._ss, shot.t.toFixed(2) + 's');
    // Decode then seek — webm keyframes make -ss-before-input snap to the wrong frame.
    if (useOv) {
      run([
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', src, '-ss', String(shot._ss), '-t', String(shot.t),
        '-loop', '1', '-i', ovPath,
        '-filter_complex', overlayFilter(shot.overlay, shot.t) + ',format=yuv420p',
        '-t', String(shot.t),
        ...encodeArgs(out),
      ], shot.id);
    } else {
      run([
        '-y', '-hide_banner', '-loglevel', 'error',
        '-i', src, '-ss', String(shot._ss), '-t', String(shot.t),
        '-vf', vf,
        ...encodeArgs(out),
      ], shot.id);
    }
    return out;
  }

  if (!exists(shot.src)) throw new Error('Missing plate ' + shot.src);
  console.log('  clip', shot.id, 'plate', shot.t.toFixed(2) + 's', shot.mode);
  const vf = plateVf(shot.mode, shot.t);
  if (useOv) {
    const tmp = path.join(CLIPS, `_${shot.id}-base.mp4`);
    run([
      '-y', '-hide_banner', '-loglevel', 'error',
      '-loop', '1', '-framerate', '24', '-i', shot.src,
      '-t', String(shot.t),
      '-vf', vf,
      ...encodeArgs(tmp),
    ], shot.id + '-base');
    run([
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', tmp,
      '-loop', '1', '-i', ovPath,
      '-filter_complex', overlayFilter(shot.overlay, shot.t) + ',format=yuv420p',
      '-t', String(shot.t),
      ...encodeArgs(out),
    ], shot.id);
  } else {
    run([
      '-y', '-hide_banner', '-loglevel', 'error',
      '-loop', '1', '-framerate', '24', '-i', shot.src,
      '-t', String(shot.t),
      '-vf', vf,
      ...encodeArgs(out),
    ], shot.id);
  }
  return out;
}

function concat(files) {
  fs.writeFileSync(LIST, files.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
  const silent = path.join(CLIPS, '_silent.mp4');
  const faded = path.join(CLIPS, '_silent-fade.mp4');
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'concat', '-safe', '0', '-i', LIST,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an',
    silent,
  ], 'concat');
  // Measure duration then fade in/out so it doesn't start like a slide deck.
  const probe = spawnSync(FFMPEG, ['-i', silent], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec((probe.stderr || '') + (probe.stdout || ''));
  const dur = m ? (+m[1] * 3600 + +m[2] * 60 + +m[3]) : 61;
  const fadeOut = Math.max(0, dur - 0.70);
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', silent,
    '-vf', `fade=t=in:st=0:d=0.55,fade=t=out:st=${fadeOut.toFixed(2)}:d=0.65`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16',
    '-pix_fmt', 'yuv420p', '-r', '24', '-an',
    faded,
  ], 'fade');
  return { faded, dur };
}

function mux(silent, pictureDur) {
  if (!exists(MUSIC)) {
    fs.copyFileSync(silent, MASTER);
    console.warn('No score.wav — wrote silent master');
    return;
  }
  run([
    '-y', '-hide_banner', '-loglevel', 'error',
    '-i', silent,
    '-i', MUSIC,
    '-filter_complex',
    '[1:a]afade=t=out:st=58.80:d=2.20,apad=pad_dur=0.4[a]',
    '-map', '0:v:0', '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    MASTER,
  ], 'mux');
}

function main() {
  if (!exists(FFMPEG)) throw new Error('ffmpeg not found: ' + FFMPEG);
  const marks = loadMarks();
  const files = [];
  let total = 0;
  for (const shot of SHOTS) {
    shot._ss = startTime(shot, marks);
    files.push(renderShot(shot));
    total += shot.t;
  }
  console.log('Concat', files.length, 'clips, ~' + total.toFixed(2) + 's');
  const { faded, dur } = concat(files);
  mux(faded, dur);
  const st = fs.statSync(MASTER);
  console.log('Master', MASTER, (st.size / 1024 / 1024).toFixed(1) + ' MB', '~' + dur.toFixed(2) + 's');
}

main();
