import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info)
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
              A little hiccup, but your data is safe. Tap below to keep going.
            </p>
            <button
              className="btn-candy mt-4"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
