let ctx: AudioContext | null = null
let suppress = false

export function suppressNextClick() {
  suppress = true
}

export function consumeClickSound() {
  if (suppress) {
    suppress = false
    return true
  }
  return false
}

function getCtx(): AudioContext | null {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function blip({
  f0,
  f1,
  at = 0,
  dur = 0.18,
  gain = 0.06,
  type = 'sine',
}: {
  f0: number
  f1?: number
  at?: number
  dur?: number
  gain?: number
  type?: OscillatorType
}) {
  const ac = getCtx()
  if (!ac) return
  const t0 = ac.currentTime + at
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(f0, t0)
  if (f1 && f1 !== f0) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur)
  }
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.linearRampToValueAtTime(gain, t0 + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export function softClick() {
  blip({ f0: 470, dur: 0.07, gain: 0.04 })
  blip({ f0: 988, f1: 1174, dur: 0.09, gain: 0.028, at: 0.018 })
}

export function playPing() {
  blip({ f0: 783.99, dur: 0.16, gain: 0.055 })
  blip({ f0: 1046.5, dur: 0.26, gain: 0.055, at: 0.15 })
}

export function playHeart() {
  blip({ f0: 659.25, dur: 0.1, gain: 0.05 })
  blip({ f0: 880, dur: 0.18, gain: 0.05, at: 0.09 })
}

export function playMood() {
  blip({ f0: 523.25, dur: 0.12, gain: 0.05 })
  blip({ f0: 659.25, dur: 0.14, gain: 0.05, at: 0.1 })
  blip({ f0: 783.99, dur: 0.24, gain: 0.05, at: 0.2 })
}

export function playTone(
  freq: number,
  dur = 0.22,
  gain = 0.06,
  type: OscillatorType = 'sine',
) {
  blip({ f0: freq, dur, gain, type })
}

export function playWin() {
  blip({ f0: 523.25, dur: 0.12, gain: 0.06 })
  blip({ f0: 659.25, dur: 0.12, gain: 0.06, at: 0.11 })
  blip({ f0: 783.99, dur: 0.12, gain: 0.06, at: 0.22 })
  blip({ f0: 1046.5, dur: 0.3, gain: 0.06, at: 0.33 })
}

export function playLose() {
  blip({ f0: 392, f1: 260, dur: 0.28, gain: 0.06 })
  blip({ f0: 262, f1: 175, dur: 0.38, gain: 0.065, at: 0.2 })
}

export function playCatch() {
  blip({ f0: 988, f1: 1319, dur: 0.09, gain: 0.045 })
}

export function playPop() {
  blip({ f0: 560, f1: 920, dur: 0.08, gain: 0.05, type: 'triangle' })
}

export function playWhack() {
  blip({ f0: 230, f1: 110, dur: 0.12, gain: 0.075, type: 'square' })
  blip({ f0: 660, dur: 0.08, gain: 0.04, at: 0.02 })
}