'use client'
import { Component, ReactNode } from 'react'

interface Props { 
  children: ReactNode
  fallback?: ReactNode
}

interface State { 
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    // In production, send to error tracking service
    console.error('[ErrorBoundary] Uncaught error:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="font-semibold text-gray-800">Something went wrong</h2>
          <p className="text-gray-400 text-sm mt-1">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm"
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
