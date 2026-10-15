import { useRef } from 'react'
import { todayKey, useApp } from './store'
import type { Who } from './types'
import { challengeGameForDay, gameByKey, meetsTarget, targetText } from './games'

function shiftDay(day: string, delta: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

export function usePlayroom() {
  const { as, play, setPlay, pushToast } = useApp()
  const today = todayKey()
  const other: Who = as === 'you' ? 'ellie' : 'you'

  const challenge = challengeGameForDay(today)
  const mine = play.streaks?.[as]
  /* fall back to the legacy shared streak until per-person streaks exist */
  const streak = mine?.count ?? (play.streaks ? 0 : play.streak)
  const otherStreak = play.streaks?.[other]?.count ?? 0
  const challengeDone = play.dailyDone?.[as] === today

  const playRef = useRef(play)
  playRef.current = play

  const recordScore = (key: string, score: number) => {
    const info = gameByKey(key)
    if (!info) return
    setPlay((prev) => {
      const cur = prev.highScores?.[key]?.[as]
      const better =
        cur === undefined || (info.higherIsBetter ? score > cur : score < cur)
      if (!better) return prev
      const forGame = { ...(prev.highScores?.[key] ?? {}), [as]: score }
      return { ...prev, highScores: { ...prev.highScores, [key]: forGame } }
    })
  }

  const finishGame = (key: string, score: number) => {
    const info = gameByKey(key)
    if (!info) return
    recordScore(key, score)
    if (key !== challenge.key) return
    if (playRef.current.dailyDone?.[as] === today) return
    if (!meetsTarget(info, score)) {
      pushToast(
        `Get ${targetText(info)} to finish today's challenge. Try again! 💪`,
        '🎯',
      )
      return
    }
    const yesterday = shiftDay(today, -1)
    const prevStreak = playRef.current.streaks?.[as]
    const nextCount = prevStreak?.lastDay === yesterday ? prevStreak.count + 1 : 1
    setPlay((prev) => ({
      ...prev,
      lastChallengeDay: today,
      streaks: {
        ...(prev.streaks ?? {}),
        [as]: { count: nextCount, lastDay: today, best: score },
      },
      dailyDone: { ...(prev.dailyDone ?? {}), [as]: today },
    }))
    pushToast(
      nextCount > 1
        ? `Daily challenge — ${nextCount}-day streak! 🔥`
        : 'Daily challenge complete! 🎯',
      '🎯',
    )
  }

  return {
    challenge,
    challengeDone,
    streak,
    other,
    otherStreak,
    highScores: play.highScores,
    recordScore,
    finishGame,
  }
}
