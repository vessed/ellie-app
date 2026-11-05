import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
}

export function HeartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20s-7-4.35-9.33-8.42C1.1 8.68 2.6 5.5 5.9 5.5c2 0 3.3 1.1 4.1 2.2.8-1.1 2.1-2.2 4.1-2.2 3.3 0 4.8 3.18 3.23 6.08C19 15.65 12 20 12 20Z" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
      <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      <path d="M8.2 14.2c.6-.8 1.5-.8 2.1 0" />
    </svg>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.2l.9-1.4A1.5 1.5 0 0 1 9.9 4h4.2c.5 0 1 .3 1.3.6l.9 1.4h1.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <circle cx="12" cy="12.3" r="3.3" />
    </svg>
  )
}

export function GiftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="8.5" width="17" height="4" rx="1.4" />
      <path d="M5 12.5h14V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-6.5Z" />
      <path d="M12 8.5V20.5" />
      <path d="M12 8.5S11.4 4 9 4a2.2 2.2 0 0 0 0 4.5h3Zm0 0S12.6 4 15 4a2.2 2.2 0 0 1 0 4.5h-3Z" />
    </svg>
  )
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 3.6Z" />
    </svg>
  )
}

export function NoteIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h8.3L19 8.2V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1-1.5Z" />
      <path d="M13.8 3.7V8.5H19" />
      <path d="M8.5 12.5h7M8.5 16h4.5" />
    </svg>
  )
}

export function MusicIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 17.5V6.3l9-2v10.9" />
      <circle cx="6.6" cy="17.5" r="2.6" />
      <circle cx="15.6" cy="15.2" r="2.6" />
    </svg>
  )
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5Z" />
      <path d="M18.5 15.5c.3 1.6.8 2.2 2.4 2.5-1.6.3-2.1.9-2.4 2.5-.3-1.6-.8-2.2-2.4-2.5 1.6-.3 2.1-.9 2.4-2.5Z" />
    </svg>
  )
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 18h11c-.9-1-1.5-1.8-1.5-4.5 0-2.6-.6-4.2-2-5.1-.6-.4-1.3-.6-2-.6s-1.4.2-2 .6c-1.4.9-2 2.5-2 5.1 0 2.7-.6 3.5-1.5 4.5Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5.5v13M5.5 12h13" />
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V19a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V9.5" />
      <path d="M10 20.5v-5h4v5" />
    </svg>
  )
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.8 7.8 0 0 0 0-3l1.6-1.2-1.9-3.3-1.9.8a7.7 7.7 0 0 0-2.6-1.5L14.3 3h-3.8l-.3 2.3a7.7 7.7 0 0 0-2.6 1.5l-1.9-.8L3.8 9.3l1.6 1.2a7.8 7.8 0 0 0 0 3L3.8 14.7l1.9 3.3 1.9-.8c.75.65 1.63 1.17 2.6 1.5l.3 2.3h3.8l.3-2.3a7.7 7.7 0 0 0 2.6-1.5l1.9.8 1.9-3.3-1.6-1.2Z" />
    </svg>
  )
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5Z" />
    </svg>
  )
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="7.5" y="5.5" width="3.5" height="13" rx="1.4" />
      <rect x="13" y="5.5" width="3.5" height="13" rx="1.4" />
    </svg>
  )
}

export function SkipNextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6.5l9 5.5-9 5.5V6.5Z" />
      <rect x="16" y="5.5" width="2.5" height="13" rx="1.2" />
    </svg>
  )
}

export function SkipPrevIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 6.5l-9 5.5 9 5.5V6.5Z" />
      <rect x="5.5" y="5.5" width="2.5" height="13" rx="1.2" />
    </svg>
  )
}

export function ReplayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10.5a8 8 0 1 1 .6 5" />
      <path d="M4 5v5.5h5.5" />
    </svg>
  )
}

export function VolumeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9.5h3l4-3v11l-4-3H5v-5Z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
      <path d="M18 7.5a6.5 6.5 0 0 1 0 9" />
    </svg>
  )
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

export function RepeatOneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      <path d="M11 10h1v4" />
    </svg>
  )
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.8-1.1 2-1.7 3.3-1.7H22" />
      <path d="m18 2 4 4-4 4" />
      <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
      <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
      <path d="m18 14 4 4-4 4" />
    </svg>
  )
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 7h15M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7" />
      <path d="M6.5 7l.8 11.2A1.6 1.6 0 0 0 8.9 20h6.2a1.6 1.6 0 0 0 1.6-1.8L17.5 7" />
    </svg>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 6.5l3 3" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 12.5l4 4 9-9" />
    </svg>
  )
}

export function PhotoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4.5 16.5l4.5-4 3.5 3 3-2.5 4 3.5" />
    </svg>
  )
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.54 3.54 0 0 0-5-5l-1.2 1.2" />
      <path d="M13.5 10.5a3.5 3.5 0 0 0-5 0L6 13a3.54 3.54 0 0 0 5 5l1.2-1.2" />
    </svg>
  )
}

export function PlusCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  )
}

export function SpotifyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M7.8 9.7c2.8-.8 5.7-.5 8.4.9" />
      <path d="M8.4 12.5c2.3-.6 4.6-.4 6.8.8" />
      <path d="M9 15.2c1.7-.4 3.4-.3 5 .6" />
    </svg>
  )
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="6.5" width="17" height="11" rx="3.5" />
      <path d="M11 10.2l3.2 1.8-3.2 1.8v-3.6Z" />
    </svg>
  )
}

export function ImportIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 15.5V4.5M8.5 8l3.5-3.5L15.5 8" />
      <path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" />
    </svg>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 11.5 20 4.5l-4 15-3.5-6.5L6 10l-1.5 1.5Z" />
      <path d="M12.5 13l3.5-6.5" />
    </svg>
  )
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h10a1 1 0 0 1 1 1V20l-6-3.8L6 20V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  )
}

export function MinusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 12h13" />
    </svg>
  )
}

export function RibbonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21V9.5" />
      <path d="M12 10.5c3-3.2 5-4.1 6.6-3.4 1.2.5 1.4 1.9.7 3-1 1.4-3.7 2.6-7.3 1.1Z" />
      <path d="M12 10.5C9 7.3 7 6.4 5.4 7.1c-1.2.5-1.4 1.9-.7 3 1 1.4 3.7 2.6 7.3 1.1Z" />
      <path d="M12 21l-1.9 1 .8-1.7-2.6.3L12 17.4l3.7 3.2-2.6-.3.8 1.7-1.9-1Z" />
    </svg>
  )
}

export function BlocksIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="13.5" width="6" height="6" rx="1.8" />
      <rect x="12.5" y="13.5" width="6" height="6" rx="1.8" />
      <rect x="8.2" y="4.5" width="7.6" height="5.4" rx="1.8" />
      <circle cx="10.2" cy="7.2" r="0.7" />
      <circle cx="12.6" cy="7.2" r="0.7" />
      <circle cx="14.4" cy="9.4" r="0.7" />
      <circle cx="11.8" cy="9.4" r="0.7" />
    </svg>
  )
}

export function MoodIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.6 10.2c.3-.4 1-.4 1.3 0" />
      <path d="M14.1 10.2c.3-.4 1-.4 1.3 0" />
      <path d="M8.4 14.2c.9 1.1 2 1.6 3.6 1.6s2.7-.5 3.6-1.6" />
      <path d="M17 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6.6-1.4Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function GripIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="8" cy="6" r="1.5" />
      <circle cx="16" cy="6" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
      <circle cx="16" cy="12" r="1.5" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="16" cy="18" r="1.5" />
    </svg>
  )
}

export function TodoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
      <path d="M8.2 11.5l2.3 2.3 5-5" />
      <path d="M8.2 17.5l2.3 2.3 5-5" />
    </svg>
  )
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 7.4C10.8 6.2 9 5.5 6.6 5.5H4.6A1.1 1.1 0 0 0 3.5 6.6v10.8a1.1 1.1 0 0 0 1.1 1.1h2c2.4 0 4.2.7 5.4 1.9 1.2-1.2 3-1.9 5.4-1.9h2a1.1 1.1 0 0 0 1.1-1.1V6.6a1.1 1.1 0 0 0-1.1-1.1h-2c-2.4 0-4.2.7-5.4 1.9Z" />
      <path d="M12 7.4v13" />
    </svg>
  )
}

export function FeatherIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 4c-3 0-6.5 1.2-8.8 3.5l-4 4a2.4 2.4 0 0 0 0 3.4l1.9 1.9a2.4 2.4 0 0 0 3.4 0l4-4C18.8 10.5 20 7 20 4Z" />
      <path d="M5 19l3.6-3.6" />
      <path d="M16.5 7.5l-6 6" />
    </svg>
  )
}