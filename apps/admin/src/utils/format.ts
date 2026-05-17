export const formatDuration = (ms: number) => {
  const seconds = ms / 1000
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)

  if (mins === 0) {
    return `${secs}s`
  }

  return `${mins}m ${secs}s`
}

export const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}
