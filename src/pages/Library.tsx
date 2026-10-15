import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../lib/store'
import { JOURNAL_PAGES, WHO_NAME, type Who } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { Avatar } from '../components/Avatar'
import { ArrowLeftIcon, BookIcon, BookmarkIcon, FeatherIcon } from '../components/Icons'
import { STORIES, getStory } from '../lib/stories'

const SPREADS = Math.ceil(JOURNAL_PAGES / 2)

function Journals() {
  const { as, journal, setJournalPage } = useApp()
  const [who, setWho] = useState<Who>(as)
  const [spread, setSpread] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const timers = useRef<Record<string, number>>({})

  useEffect(() => () => {
    for (const t of Object.values(timers.current)) window.clearTimeout(t)
  }, [])

  const pageCard = (page: number) => {
    const id = `journal-${who}-${page}`
    const text = drafts[id] ?? journal.find((p) => p.id === id)?.text ?? ''
    const editable = as === who
    return (
      <div className="journal-page">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[0.68rem] font-extrabold uppercase tracking-widest text-blush-500">
            {editable ? (
              <>
                <FeatherIcon className="h-3.5 w-3.5" /> Your page
              </>
            ) : (
              <>
                <BookmarkIcon className="h-3.5 w-3.5" /> {WHO_NAME[who]}&apos;s page
              </>
            )}
          </span>
          <span className="text-[0.68rem] font-extrabold uppercase tracking-widest text-blush-400/80">
            p.{page}
          </span>
        </div>
        {editable ? (
          <textarea
            value={drafts[id] ?? text}
            onChange={(e) => {
              const v = e.target.value
              setDrafts((d) => ({ ...d, [id]: v }))
              const key = `${who}-${page}`
              if (timers.current[key]) window.clearTimeout(timers.current[key])
              timers.current[key] = window.setTimeout(
                () => setJournalPage(who, page, v),
                400,
              )
            }}
            placeholder="Dear journal…"
            spellCheck={false}
            className="journal-textarea min-h-[18rem] w-full flex-1 resize-none text-lg text-blush-900 outline-none placeholder:text-blush-400/60"
          />
        ) : text ? (
          <p className="journal-hand whitespace-pre-wrap text-lg text-blush-900/90">
            {text}
          </p>
        ) : (
          <p className="journal-hand text-lg italic text-blush-400/80">
            Nothing written here yet.
          </p>
        )}
        <span className="mt-2 self-end text-[0.68rem] font-extrabold text-blush-400/70">
          {page}
        </span>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="glass-soft rounded-3xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full bg-white/50 p-1">
            {(['ellie', 'you'] as Who[]).map((w) => (
              <button
                key={w}
                onClick={() => {
                  setWho(w)
                  setSpread(0)
                }}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold transition ${
                  who === w
                    ? 'bg-gradient-to-br from-blush-300 to-lilac-300 text-white shadow'
                    : 'text-blush-700/80 hover:bg-white/60'
                }`}
              >
                <Avatar who={w} size={22} />
                {WHO_NAME[w]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpread((s) => Math.max(0, s - 1))}
              disabled={spread === 0}
              className="btn-ghost !px-3 !py-1.5 !text-sm disabled:opacity-40"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </button>
            <span className="pill whitespace-nowrap text-xs font-extrabold">
              Pages {spread * 2 + 1}–{Math.min(spread * 2 + 2, JOURNAL_PAGES)} of{' '}
              {JOURNAL_PAGES}
            </span>
            <button
              onClick={() => setSpread((s) => Math.min(SPREADS - 1, s + 1))}
              disabled={spread >= SPREADS - 1}
              className="btn-ghost !px-3.5 !py-2 !text-sm"
            >
              Next
            </button>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-2 px-1 text-xs font-bold text-blush-500">
          <Avatar who={who} size={18} />
          {as === who
            ? 'This is your journal — only you can write in it.'
            : `Reading ${WHO_NAME[who]}'s journal 💗`}
        </p>
      </div>

      <div className="journal-book">
        <div className="journal-spread">
          <span className="journal-gutter" aria-hidden />
          {pageCard(spread * 2 + 1)}
          {spread * 2 + 2 <= JOURNAL_PAGES && pageCard(spread * 2 + 2)}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: SPREADS }).map((_, i) => (
            <button
              key={i}
              onClick={() => setSpread(i)}
              aria-label={`Pages ${i * 2 + 1}–${i * 2 + 2}`}
              className={`h-2 w-2 rounded-full transition ${
                i === spread
                  ? 'scale-125 bg-blush-700 ring-2 ring-blush-300'
                  : 'bg-blush-400/70 hover:bg-blush-500'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StoryShelf() {
  const [openId, setOpenId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const story = openId ? getStory(openId) : undefined

  if (story) {
    const last = page >= story.pages.length - 1
    return (
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              setOpenId(null)
              setPage(0)
            }}
            className="btn-ghost !px-3.5 !py-2 !text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Back to the shelf
          </button>
          <span className="pill">
            {story.emoji} page {page + 1} / {story.pages.length}
          </span>
        </div>

        <article className="glass-soft mx-auto w-full max-w-2xl rounded-3xl p-7 sm:p-9">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blush-200 to-lilac-200 text-3xl shadow-glow">
              {story.emoji}
            </span>
            <div>
              <h2 className="font-display text-2xl font-extrabold text-blush-900">
                {story.title}
              </h2>
              <p className="text-xs font-bold text-blush-500">{story.author}</p>
            </div>
          </div>

          <p className="min-h-[10rem] font-display text-xl font-semibold leading-relaxed text-blush-900/90">
            {story.pages[page]}
          </p>

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn-ghost !px-4 !py-2 !text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Back
            </button>
            <div className="flex gap-1.5">
              {story.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Page ${i + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === page
                      ? 'scale-125 bg-blush-700 ring-2 ring-blush-300'
                      : 'bg-blush-400 hover:bg-blush-600'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => {
                if (last) setOpenId(null)
                else setPage((p) => p + 1)
              }}
              className="btn-candy !px-4 !py-2 !text-sm"
            >
              {last ? 'The End 💗' : 'Next'}
            </button>
          </div>
        </article>
      </section>
    )
  }

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {STORIES.map((s) => (
        <button
          key={s.id}
          onClick={() => {
            setOpenId(s.id)
            setPage(0)
          }}
          className="glass-soft flex flex-col gap-3 rounded-3xl p-6 text-left transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-blush-200 to-lilac-200 text-3xl shadow-glow">
            {s.emoji}
          </span>
          <h2 className="font-display text-xl font-extrabold text-blush-900">
            {s.title}
          </h2>
          <p className="text-xs font-bold text-blush-500">{s.author}</p>
          <p className="text-sm font-semibold text-blush-700/80">{s.blurb}</p>
          <span className="pill mt-auto w-fit">🕐 {s.minutes} min read</span>
        </button>
      ))}
    </section>
  )
}

export function Library() {
  const [tab, setTab] = useState<'journals' | 'stories'>('journals')
  const tabs = useMemo(
    () => [
      { key: 'journals' as const, label: 'Journals', icon: FeatherIcon },
      { key: 'stories' as const, label: 'Story Books', icon: BookIcon },
    ],
    [],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="📚"
        title="Library"
        subtitle="Our journals and a shelf of cozy stories to read together 📖"
      />

      <div className="flex w-fit items-center gap-1 rounded-full bg-white/50 p-1">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition ${
                active
                  ? 'bg-gradient-to-br from-blush-300 to-lilac-300 text-white shadow-glow'
                  : 'text-blush-700/80 hover:bg-white/60'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'journals' ? <Journals /> : <StoryShelf />}
    </div>
  )
}
