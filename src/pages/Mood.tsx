import { useEffect, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { WHO_NAME, type Who } from '../lib/types'
import { relativeTime } from '../lib/media'
import { PageHeader } from '../components/PageHeader'
import { Avatar } from '../components/Avatar'
import { CheckIcon } from '../components/Icons'

function useNow(interval = 15000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(id)
  }, [interval])
  return now
}

const MOOD_OPTIONS = [
  'Adoring',
  'Alone',
  'Angry',
  'Awkward',
  'Baby',
  'Beaming',
  'Bingo',
  'Caffeinated',
  'Celebrating',
  'Cold',
  'Cozy',
  'Cuddly',
  'Cute',
  'Dirty',
  'Excited',
  'Goofy',
  'Hangry',
  'Happy',
  'Heartbroken',
  'Help :c',
  'Hot',
  'Hungry',
  'Kind',
  'Little',
  'Lonely',
  'Loved up',
  'Loving',
  'Mad',
  'Missing you',
  'Need a hug',
  'Needy',
  'Nice',
  'Overjoyed',
  'Overstimulated',
  'Overwhelmed',
  'Perfect',
  'Playful',
  'Pretty',
  'Rainy day',
  'Regressing',
  'Sad',
  'Sleepy',
  'Small',
  'Snacky',
  'Soft',
  'Stressed',
  'Sweet',
  'Thirsty',
  'Tired',
  'Upset',
]

export function Mood() {
  const { moods, updateMood, as, pushToast } = useApp()
  const [picked, setPicked] = useState<string>(
    moods.find((m) => m.who === as)?.label ?? '',
  )
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(moods.find((m) => m.who === as)?.note ?? '')
  const now = useNow()

  const prevAsRef = useRef(as)
  const hadMoodRef = useRef(!!moods.find((m) => m.who === as))
  useEffect(() => {
    const mine = moods.find((m) => m.who === as)
    const switched = prevAsRef.current !== as
    const expired = hadMoodRef.current && !mine
    prevAsRef.current = as
    hadMoodRef.current = !!mine
    if (!switched && !expired) return
    setPicked(mine?.label ?? '')
    setSaved(mine?.note ?? '')
    setNote('')
  }, [as, moods])

  const myMood = moods.find((m) => m.who === as)
  const otherName = as === 'ellie' ? 'Daddy' : 'Ellie'

  const share = () => {
    if (!picked) {
      pushToast('Pick how you feel first 💗', '🫶')
      return
    }
    updateMood('💗', picked, note)
    setSaved(note.trim())
    pushToast(
      `${WHO_NAME[as]} is feeling ${picked} now — let ${otherName} know! 💗`,
      '💗',
    )
  }

  const moodCard = (who: Who) => {
    const m = moods.find((x) => x.who === who)
    const isMe = who === as

  return (
      <div
        className={`glass rounded-3xl p-6 ${
          isMe ? 'ring-2 ring-blush-300/70' : ''
        }`}
      >
        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-3">
            <Avatar who={who} size={44} />
            <div className="min-w-0">
              <p className="font-display text-lg font-extrabold text-blush-900">
                {WHO_NAME[who]}
              </p>
              <p className="text-xs font-bold text-blush-500">
                {isMe && !m ? 'you' : ''}
              </p>
            </div>
          </div>

          {m ? (
            <div className="flex items-center gap-4">
              <div className="min-w-0">
                <p className="font-display text-xl font-extrabold text-blush-900">
                  {m.label}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-blush-700/80">
                  {m.note ? m.note : 'no note this time'}
                </p>
                <p className="mt-1 text-xs font-bold text-blush-400">
                  {isMe
                    ? `your mood · updated ${relativeTime(m.updatedAt, now)}`
                    : `updated ${relativeTime(m.updatedAt, now)}`}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-blush-500">
              {isMe
                ? who === 'ellie'
                  ? 'Set your mood below — it helps daddy understand what you\'re feeling.'
                  : 'Set your mood below — help Ellie understand what you\'re feeling.'
                : `${WHO_NAME[who]} hasn’t shared a mood yet.`}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🌈"
        title="Our moods"
        subtitle={`A little board of how we're both feeling — tap a mood and it pops up on ${otherName}'s screen.`}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        {moodCard('ellie')}
        {moodCard('you')}
      </div>

      <section className="glass p-6">
        <div className="relative z-10">
          <h3 className="font-display text-lg font-extrabold text-blush-900">
            How are you feeling, {WHO_NAME[as]}?
          </h3>
          <p className="mb-1 text-sm font-semibold text-blush-700/75">
            Pick a mood and (if you want) a little note. {otherName} gets a
            notification right away. 💌
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {MOOD_OPTIONS.map((o) => (
              <button
                key={o}
                onClick={() => setPicked(o)}
                aria-pressed={picked === o}
                className={`flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-left transition ${
                  picked === o
                    ? 'border-blush-300 bg-white shadow-[0_10px_24px_-16px_rgba(251,98,165,0.9)]'
                    : 'border-white/60 bg-white/40 hover:bg-white/60'
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-blush-800">
                  {o}
                </span>
                {picked === o && (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blush-500 text-white">
                    <CheckIcon className="h-3 w-3" />
                  </span>
                )}
              </button>
            ))}
          </div>

          <input
            className="mt-4 w-full rounded-2xl border border-blush-200/70 bg-white/70 px-4 py-3 text-sm font-semibold text-blush-800 outline-none placeholder:text-blush-300"
            placeholder="Write an extra note!"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={140}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-bold text-blush-700">
              {picked ? `Feeling ${picked}` : 'Share a mood'}
              <span className="block text-xs font-semibold text-blush-400">
                {saved && saved.length > 0
                  ? `note on this mood: “${saved}”`
                  : 'no note yet'}
                {myMood &&
                  ` · shared ${relativeTime(myMood.updatedAt, now)}`}
              </span>
            </div>
            <button onClick={share} className="btn-candy">
              Share my mood
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}