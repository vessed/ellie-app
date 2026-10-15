import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { WHO_NAME } from '../lib/types'
import type { Who } from '../lib/types'
import { PageHeader } from '../components/PageHeader'
import { ArrowLeftIcon } from '../components/Icons'
import { MemoryGame } from '../components/games/MemoryGame'
import { WhackAMole } from '../components/games/WhackAMole'
import { CatchHearts } from '../components/games/CatchHearts'
import { SimonSays } from '../components/games/SimonSays'
import { Hangman } from '../components/games/Hangman'
import { Snake } from '../components/games/Snake'
import { BlockDrop } from '../components/games/BlockDrop'
import { VirtualPup } from '../components/games/VirtualPup'
import { LittleGarden } from '../components/games/LittleGarden'
import { GAMES, rewardText, targetText } from '../lib/games'
import { usePlayroom } from '../lib/play'

/* Memoized wrappers: a running game must never re-render because some unrelated
   app state changed (a toast, a sync poll, presence). Each game keeps `onFinish`
   in a ref and the callbacks below are stable, so these skip every parent render
   and keep their full frame rate. */
const MemoryGameM = memo(MemoryGame)
const WhackAMoleM = memo(WhackAMole)
const CatchHeartsM = memo(CatchHearts)
const SimonSaysM = memo(SimonSays)
const HangmanM = memo(Hangman)
const SnakeM = memo(Snake)
const BlockDropM = memo(BlockDrop)
const VirtualPupM = memo(VirtualPup)
const LittleGardenM = memo(LittleGarden)

export function Playroom() {
  const playroom = usePlayroom()
  const [selected, setSelected] = useState<string | null>(null)

  const meta = GAMES.find((g) => g.key === selected) ?? null
  const scored = GAMES.filter((g) => !g.care)

  /* Stable per-game finish callbacks (identity never changes), so the memoized
     games above are never re-rendered while you play. */
  const finishRef = useRef(playroom.finishGame)
  useEffect(() => {
    finishRef.current = playroom.finishGame
  }, [playroom.finishGame])
  const finishers = useMemo(() => {
    const make = (key: string) => (score: number) =>
      finishRef.current(key, score)
    return {
      memory: make('memory'),
      whack: make('whack'),
      catch: make('catch'),
      simon: make('simon'),
      hangman: make('hangman'),
      snake: make('snake'),
      blocks: make('blocks'),
    }
  }, [])

  /* Tell the CSS to pause the drifting background while a game is open, so
     the animations don't steal frames/GPU while playing. */
  useEffect(() => {
    const active = selected !== null && !meta?.care
    if (active) document.documentElement.dataset.game = '1'
    else delete document.documentElement.dataset.game
    return () => {
      delete document.documentElement.dataset.game
    }
  }, [selected, meta])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        emoji="🧸"
        title="Playroom"
        subtitle="Little games just for fun — and high scores to beat! 🎮"
      />

      {selected === null ? (
        <div className="flex flex-col gap-6">
          <div className="glass-soft rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-blush-500">
                  🎯 Today&apos;s Challenge
                </p>
                <h2 className="font-display text-2xl font-extrabold text-blush-900">
                  {playroom.challenge.emoji} {playroom.challenge.title}
                </h2>
                <p className="text-sm font-semibold text-blush-700/80">
                  {playroom.challengeDone
                    ? 'You did it — nice work! 🎉'
                    : `Score ${targetText(playroom.challenge)} to keep your streak alive.`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill">
                  🔥 {WHO_NAME[playroom.other]}: {playroom.otherStreak}
                </span>
                <span className="pill">🔥 You: {playroom.streak}</span>
                {playroom.challengeDone ? (
                  <span className="pill">✓ Done today</span>
                ) : (
                  <button
                    onClick={() => setSelected(playroom.challenge.key)}
                    className="btn-candy !py-2"
                  >
                    Play
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES.map((g) => (
              <button
                key={g.key}
                onClick={() => setSelected(g.key)}
                className="glass-soft group flex flex-col items-start gap-3 rounded-3xl p-6 text-left transition hover:-translate-y-1 hover:shadow-glow"
              >
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-blush-300 to-lilac-300 text-3xl shadow-glow">
                  {g.emoji}
                </span>
                <h2 className="font-display text-xl font-extrabold text-blush-900">
                  {g.title}
                </h2>
                <p className="text-sm font-semibold text-blush-700/80">
                  {g.blurb}
                </p>
                <span className="pill mt-1">{rewardText(g)}</span>
                <span className="mt-auto pt-2 text-sm font-extrabold text-blush-600">
                  {g.care ? 'Visit' : 'Play'} →
                </span>
              </button>
            ))}
          </div>

          <div className="glass-soft rounded-3xl p-6">
            <h2 className="font-display text-xl font-extrabold text-blush-900">
              🏆 High Scores
            </h2>
            <div className="mt-3 flex flex-col gap-2">
              {scored.map((g) => {
                const hs = playroom.highScores[g.key] ?? {}
                return (
                  <div
                    key={g.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/50 px-4 py-3"
                  >
                    <span className="font-extrabold text-blush-800">
                      {g.emoji} {g.title}
                    </span>
                    <div className="flex gap-2">
                      {(['ellie', 'you'] as Who[]).map((w) => (
                        <span key={w} className="pill">
                          {WHO_NAME[w]}:{' '}
                          {hs[w] === undefined
                            ? '—'
                            : `${hs[w]} ${g.scoreLabel}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        meta && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelected(null)}
                className="btn-ghost !px-3.5 !py-2 !text-sm"
              >
                <ArrowLeftIcon className="h-4 w-4" /> All games
              </button>
              <h2 className="font-display text-2xl font-extrabold text-blush-900">
                {meta.emoji} {meta.title}
              </h2>
            </div>

            <div
              className={
                meta.care
                  ? ''
                  : 'game-stage glass-soft rounded-3xl p-4 sm:p-6'
              }
            >
              {!meta.care && (
                <>
                  <span className="game-decor" aria-hidden />
                  <span className="game-doodle left-5 top-6 text-3xl">🌸</span>
                  <span
                    className="game-doodle right-6 top-9 text-2xl"
                    style={{ animationDelay: '1.3s' }}
                  >
                    ⭐
                  </span>
                  <span
                    className="game-doodle bottom-7 left-8 text-2xl"
                    style={{ animationDelay: '2.2s' }}
                  >
                    🎈
                  </span>
                  <span
                    className="game-doodle bottom-9 right-10 text-3xl"
                    style={{ animationDelay: '0.7s' }}
                  >
                    💗
                  </span>
                </>
              )}
              <div className="relative z-10">
                {selected === 'memory' && (
                  <MemoryGameM onFinish={finishers.memory} />
                )}
                {selected === 'whack' && (
                  <WhackAMoleM onFinish={finishers.whack} />
                )}
                {selected === 'catch' && (
                  <CatchHeartsM onFinish={finishers.catch} />
                )}
                {selected === 'simon' && (
                  <SimonSaysM onFinish={finishers.simon} />
                )}
                {selected === 'hangman' && (
                  <HangmanM onFinish={finishers.hangman} />
                )}
                {selected === 'snake' && (
                  <SnakeM onFinish={finishers.snake} />
                )}
                {selected === 'blocks' && (
                  <BlockDropM onFinish={finishers.blocks} />
                )}
                {selected === 'pup' && <VirtualPupM />}
                {selected === 'garden' && <LittleGardenM />}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  )
}
