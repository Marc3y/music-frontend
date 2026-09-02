import FFT from 'fft.js'

/**
 * Browser-seitige (grobe) Analyse einer Audiodatei: BPM + Tonart.
 * Läuft komplett clientseitig auf dem dekodierten AudioBuffer. Jeder Fehler
 * führt zu `null` – der Nutzer kann die Werte dann manuell setzen.
 */

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Krumhansl-Schmuckler Tonprofile
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
const MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]

const ANALYSIS_SECONDS = 90

export async function analyzeAudioFile(
  file: File,
): Promise<{ bpm: number | null; musicalKey: string | null }> {
  let bpm: number | null = null
  let musicalKey: string | null = null

  try {
    const arrayBuffer = await file.arrayBuffer()
    const AudioCtx: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    let audioBuffer: AudioBuffer
    try {
      audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    } finally {
      void ctx.close()
    }

    try {
      const { analyze } = await import('web-audio-beat-detector')
      const detected = await analyze(audioBuffer)
      if (Number.isFinite(detected) && detected > 0) bpm = Math.round(detected)
    } catch {
      // BPM-Erkennung fehlgeschlagen -> null
    }

    try {
      musicalKey = detectKey(audioBuffer)
    } catch {
      // Key-Erkennung fehlgeschlagen -> null
    }
  } catch {
    // Datei nicht dekodierbar -> alles null
  }

  return { bpm, musicalKey }
}

function downmixMono(buffer: AudioBuffer, maxSamples: number): Float32Array {
  const channels = buffer.numberOfChannels
  const mono = new Float32Array(maxSamples)
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < maxSamples; i++) mono[i] += data[i] / channels
  }
  return mono
}

function detectKey(buffer: AudioBuffer): string | null {
  const sr = buffer.sampleRate
  const N = 8192
  const hop = 4096
  const maxSamples = Math.min(buffer.length, Math.floor(sr * ANALYSIS_SECONDS))
  if (maxSamples < N) return null

  const mono = downmixMono(buffer, maxSamples)

  const hann = new Float32Array(N)
  for (let i = 0; i < N; i++) hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)))

  // Bin -> Pitch-Class (nur musikalisch sinnvoller Bereich)
  const half = N / 2
  const binPc = new Int8Array(half).fill(-1)
  for (let k = 1; k < half; k++) {
    const freq = (k * sr) / N
    if (freq < 55 || freq > 2000) continue
    const midi = 69 + 12 * Math.log2(freq / 440)
    binPc[k] = (((Math.round(midi) % 12) + 12) % 12) as number
  }

  const fft = new FFT(N)
  const spectrum = fft.createComplexArray()
  const windowed = new Float32Array(N)
  const chroma = new Float64Array(12)

  for (let start = 0; start + N <= maxSamples; start += hop) {
    for (let i = 0; i < N; i++) windowed[i] = mono[start + i] * hann[i]
    fft.realTransform(spectrum, windowed as unknown as number[])
    fft.completeSpectrum(spectrum)
    for (let k = 1; k < half; k++) {
      const pc = binPc[k]
      if (pc < 0) continue
      const re = spectrum[2 * k]
      const im = spectrum[2 * k + 1]
      chroma[pc] += Math.sqrt(re * re + im * im)
    }
  }

  const total = chroma.reduce((a, b) => a + b, 0)
  if (total <= 0) return null
  for (let i = 0; i < 12; i++) chroma[i] /= total

  let best = { score: -Infinity, tonic: 0, mode: 'dur' as 'dur' | 'moll' }
  for (let tonic = 0; tonic < 12; tonic++) {
    const maj = correlation(chroma, MAJOR, tonic)
    const min = correlation(chroma, MINOR, tonic)
    if (maj > best.score) best = { score: maj, tonic, mode: 'dur' }
    if (min > best.score) best = { score: min, tonic, mode: 'moll' }
  }
  return `${NOTES[best.tonic]} ${best.mode}`
}

// Pearson-Korrelation von chroma mit dem um `tonic` rotierten Profil
function correlation(chroma: Float64Array, profile: number[], tonic: number): number {
  const rotated = new Array(12)
  for (let i = 0; i < 12; i++) rotated[i] = profile[(i - tonic + 12) % 12]

  const meanC = mean(Array.from(chroma))
  const meanP = mean(rotated)
  let num = 0
  let denC = 0
  let denP = 0
  for (let i = 0; i < 12; i++) {
    const dc = chroma[i] - meanC
    const dp = rotated[i] - meanP
    num += dc * dp
    denC += dc * dc
    denP += dp * dp
  }
  const den = Math.sqrt(denC * denP)
  return den === 0 ? 0 : num / den
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}
