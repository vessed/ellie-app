import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
  /* bumped on retry so the child subtree is fully remounted */
  attempt: number
}

/* A failed dynamic import (usually a stale chunk after a redeploy) can only be
   fixed by fetching the fresh bundle, so we reload instead of re-rendering. */
function isChunkError(error: Error | null): boolean {
  const msg = String(error?.name ?? '') + ' ' + String(error?.message ?? '')
  return /dynamically imported module|Importing a module script failed|Loading chunk|preload|Failed to fetch/i.test(
    msg,
  )
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, attempt: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info)
  }

  handleRetry = () => {
    if (isChunkError(this.state.error)) {
      window.location.reload()
      return
    }
    this.setState((s) => ({ error: null, attempt: s.attempt + 1 }))
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid h-full w-full place-items-center p-6">
          <div className="glass max-w-md p-6 text-center">
            <p className="font-display text-2xl font-extrabold text-blush-900">
              Oops, something wobbled 💗
            </p>
            <p className="mt-2 text-sm font-semibold text-blush-600/80">
              {isChunkError(this.state.error)
                ? 'A fresh update just landed — tap to reload it.'
                : 'A little hiccup, but your data is safe. Tap below to keep going.'}
            </p>
            <button className="btn-candy mt-4" onClick={this.handleRetry}>
              {isChunkError(this.state.error) ? 'Reload' : 'Try again'}
            </button>
          </div>
        </div>
      )
    }
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>
  }
}
