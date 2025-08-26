import { render, screen } from '@testing-library/react'
import { Logo } from './Logo'

describe('Logo Component', () => {
  it('renders logo with text by default', () => {
    render(<Logo />)
    expect(screen.getByAltText('NeuraOne Logo')).toBeInTheDocument()
    expect(screen.getByText('NeuraOne')).toBeInTheDocument()
  })

  it('renders logo without text when showText is false', () => {
    render(<Logo showText={false} />)
    expect(screen.getByAltText('NeuraOne Logo')).toBeInTheDocument()
    expect(screen.queryByText('NeuraOne')).not.toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<Logo size="sm" />)
    const logo = screen.getByAltText('NeuraOne Logo')
    expect(logo).toHaveClass('w-6', 'h-6')

    rerender(<Logo size="lg" />)
    expect(logo).toHaveClass('w-10', 'h-10')
  })

  it('applies correct variant classes', () => {
    const { rerender } = render(<Logo variant="dark" />)
    const text = screen.getByText('NeuraOne')
    expect(text).toHaveClass('text-gray-900', 'dark:text-white')

    rerender(<Logo variant="white" />)
    expect(text).toHaveClass('text-white')
  })

  it('applies custom className', () => {
    render(<Logo className="custom-class" />)
    const container = screen.getByAltText('NeuraOne Logo').parentElement
    expect(container).toHaveClass('custom-class')
  })
}) 