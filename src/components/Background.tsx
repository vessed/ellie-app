export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="app-bg absolute inset-0" />

      <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-blush-300/50 blur-3xl animate-drift bg-blob" />
      <div
        className="absolute right-[-6rem] top-10 h-[22rem] w-[22rem] rounded-full bg-lilac-300/50 blur-3xl animate-drift bg-blob"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-mint-300/40 blur-3xl animate-drift bg-blob"
        style={{ animationDelay: '-11s' }}
      />
      <div
        className="absolute right-1/4 bottom-[-6rem] h-[18rem] w-[18rem] rounded-full bg-sky-300/40 blur-3xl animate-drift bg-blob"
        style={{ animationDelay: '-3s' }}
      />

      <Sparkles />
    </div>
  )
}

function Sparkles() {
  const sparkles = [
    { left: '8%', top: '18%', size: 18, delay: '0s', char: '✦' },
    { left: '88%', top: '26%', size: 14, delay: '-2s', char: '✧' },
    { left: '72%', top: '12%', size: 22, delay: '-4s', char: '♡' },
    { left: '18%', top: '72%', size: 16, delay: '-1s', char: '✦' },
    { left: '60%', top: '82%', size: 20, delay: '-5s', char: '♡' },
    { left: '36%', top: '10%', size: 12, delay: '-3s', char: '✧' },
  ]

  return (
    <>
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="bg-blob absolute select-none text-blush-400/70 animate-float"
          style={{
            left: s.left,
            top: s.top,
            fontSize: s.size,
            animationDelay: s.delay,
          }}
        >
          {s.char}
        </span>
      ))}
    </>
  )
}