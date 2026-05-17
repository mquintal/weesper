import { execSync } from 'node:child_process'
import os from 'node:os'

/**
 * Calculates the optimal number of threads for AI workloads (whisper.cpp, llama.cpp).
 * On Apple Silicon, this targets the number of Performance Cores.
 * On other platforms, it falls back to half of the logical CPU count.
 */
export function getOptimalThreadCount(): number {
  if (process.platform === 'darwin') {
    try {
      const output = execSync('sysctl -n hw.perflevel0.physicalcpu', { encoding: 'utf8' }).trim()
      const pCores = Number.parseInt(output, 10)
      if (!Number.isNaN(pCores) && pCores > 0) {
        return pCores
      }
    } catch {
      // Silently fall back to generic calculation
    }
  }

  // Fallback: Use half of logical cores, minimum of 4
  const logicalCores = os.cpus().length
  return Math.max(4, Math.floor(logicalCores / 2))
}
