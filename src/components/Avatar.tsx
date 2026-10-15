import { useApp } from '../lib/store'
import { WHO_EMOJI, WHO_NAME, type Who } from '../lib/types'

export function Avatar({
  who,
  size = 32,
  className = '',
}: {
  who: Who
  size?: number
  className?: string
}) {
  const { profiles } = useApp()
  const src = profiles[who]?.src
  const style = { width: size, height: size }
  if (src) {
    return (
      <img
        src={src}
        alt={WHO_NAME[who]}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <span
      style={style}
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-lilac-200 to-blush-200 ${className}`}
    >
      <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>
        {WHO_EMOJI[who]}
      </span>
    </span>
  )
}
