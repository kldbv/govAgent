import { describe, it, expect } from 'vitest'
import { render } from '@/test/utils'
import {
  Skeleton,
  CardSkeleton,
  ProgramCardSkeleton,
  TableRowSkeleton,
  DashboardStatsSkeleton,
  ListSkeleton,
} from './LoadingSkeleton'

describe('LoadingSkeleton components', () => {
  describe('Skeleton', () => {
    it('renders with default class', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('animate-pulse', 'bg-gray-200', 'rounded')
    })

    it('renders with custom class', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />)
      const skeleton = container.firstChild as HTMLElement
      expect(skeleton).toHaveClass('h-10', 'w-full')
    })
  })

  describe('CardSkeleton', () => {
    it('renders card skeleton structure', () => {
      const { container } = render(<CardSkeleton />)
      expect(container.querySelector('.card')).toBeInTheDocument()
    })
  })

  describe('ProgramCardSkeleton', () => {
    it('renders program card skeleton', () => {
      const { container } = render(<ProgramCardSkeleton />)
      expect(container.querySelector('.card')).toBeInTheDocument()
    })
  })

  describe('TableRowSkeleton', () => {
    it('renders default 5 columns', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton />
          </tbody>
        </table>
      )
      const cells = container.querySelectorAll('td')
      expect(cells).toHaveLength(5)
    })

    it('renders custom number of columns', () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} />
          </tbody>
        </table>
      )
      const cells = container.querySelectorAll('td')
      expect(cells).toHaveLength(3)
    })
  })

  describe('DashboardStatsSkeleton', () => {
    it('renders 4 stat cards', () => {
      const { container } = render(<DashboardStatsSkeleton />)
      const cards = container.querySelectorAll('.card')
      expect(cards).toHaveLength(4)
    })
  })

  describe('ListSkeleton', () => {
    it('renders default 5 items', () => {
      const { container } = render(<ListSkeleton />)
      const cards = container.querySelectorAll('.card')
      expect(cards).toHaveLength(5)
    })

    it('renders custom count', () => {
      const { container } = render(<ListSkeleton count={3} />)
      const cards = container.querySelectorAll('.card')
      expect(cards).toHaveLength(3)
    })
  })
})
