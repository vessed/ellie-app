import { useCare } from '../../lib/care'
import { CareChecklist } from './CareChecklist'

export function LittleGarden() {
  const care = useCare()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200/70 via-mint-200/60 to-blush-100/70 p-6 text-center">
        <p className="font-display text-lg font-extrabold text-blush-900">
          Your little garden
        </p>
        <p className="text-xs font-semibold text-blush-700/80">
          {care.pots.length === 0
            ? 'Plant a seed to begin'
            : `${care.pots.length}/${care.maxPots} pots growing`}
        </p>
        <div className="animate-float mt-3 text-7xl">
          {care.pots.length > 0 ? '🪴' : '🟫'}
        </div>
      </div>

      {care.canPlant && (
        <div className="glass-soft flex flex-col gap-3 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-blush-800">
              Plant a seed
            </span>
            <span className="pill">
              {care.pots.length}/{care.maxPots} pots
            </span>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            {care.flowers.map((f) => (
              <button
                key={f}
                onClick={() => care.plantPot(f)}
                className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/60 text-2xl transition hover:-translate-y-0.5 hover:bg-white/85"
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {care.pots.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {care.pots.map((pot) => (
            <div
              key={pot.id}
              className="glass-soft flex flex-col gap-2 rounded-3xl p-4"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{pot.stage.emoji}</span>
                <button
                  onClick={() => care.uprootPot(pot.id)}
                  className="text-xs font-bold text-blush-400 transition hover:text-blush-600"
                >
                  remove
                </button>
              </div>
              <p className="text-xs font-semibold text-blush-700/80">
                {pot.stage.label}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/55">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-mint-300 to-sky-200 transition-all"
                  style={{
                    width: `${Math.min(100, (pot.growth / care.bloomGrowth) * 100)}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="pill">🔥 {pot.streak}</span>
                <span className="pill">🏅 {pot.bestStreak}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => care.waterPot(pot.id)}
                  disabled={pot.wateredToday}
                  className={`flex-1 rounded-xl px-2 py-2 text-xs font-extrabold transition ${
                    pot.wateredToday
                      ? 'bg-white/30 text-blush-400'
                      : 'bg-sky-200/80 text-blush-800 hover:bg-sky-200'
                  }`}
                >
                  {pot.wateredToday ? 'Watered 💧' : 'Water 💧'}
                </button>
                <button
                  onClick={() => care.fertilizePot(pot.id)}
                  disabled={pot.fertilizedToday}
                  className={`flex-1 rounded-xl px-2 py-2 text-xs font-extrabold transition ${
                    pot.fertilizedToday
                      ? 'bg-white/30 text-blush-400'
                      : 'bg-mint-200/80 text-blush-800 hover:bg-mint-200'
                  }`}
                >
                  {pot.fertilizedToday ? 'Fed 🌾' : 'Fertilize 🌾'}
                </button>
              </div>
              {pot.ready && (
                <button
                  onClick={() => care.harvestPot(pot.id)}
                  className="btn-candy"
                >
                  Harvest {pot.flower} 🎉
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="glass-soft flex flex-col gap-2 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-extrabold text-blush-800">
            💐 Bouquet
          </span>
          <span className="pill">{care.bouquet} bloomed</span>
        </div>
        {care.bouquet === 0 ? (
          <p className="text-xs font-semibold text-blush-500/80">
            Grow a pot to full bloom, then harvest it to add a flower to your
            bouquet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {Object.entries(care.blooms).map(([f, n]) => (
              <span
                key={f}
                className="rounded-full bg-white/60 px-3 py-1 text-sm font-bold text-blush-800"
              >
                {f} ×{n}
              </span>
            ))}
          </div>
        )}
      </div>

      <CareChecklist title="Today’s garden care" tasks={care.gardenTasks} />

      <p className="text-center text-xs font-semibold text-blush-500/80">
        Plant, water and fertilize daily to grow each pot. Reach full bloom and
        harvest it into your shared bouquet! 🌸
      </p>
    </div>
  )
}
