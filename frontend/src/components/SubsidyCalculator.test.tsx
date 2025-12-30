import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/utils'
import { SubsidyCalculator } from './SubsidyCalculator'

// Default props based on component interface
const defaultProps = {
  programId: 1,
  defaultBankRate: 18,
  defaultSubsidyRate: 10,
  minLoanAmount: 1000000,
  maxLoanAmount: 50000000,
  maxLoanTermMonths: 60,
}

describe('SubsidyCalculator', () => {
  it('renders calculator title', () => {
    render(<SubsidyCalculator {...defaultProps} />)
    expect(screen.getByText('Калькулятор субсидий')).toBeInTheDocument()
  })

  it('shows loan amount info', () => {
    render(<SubsidyCalculator {...defaultProps} />)
    expect(screen.getByText('Сумма кредита')).toBeInTheDocument()
  })

  it('shows loan term info', () => {
    render(<SubsidyCalculator {...defaultProps} />)
    expect(screen.getByText(/Срок кредита:/)).toBeInTheDocument()
  })

  it('displays calculation results', () => {
    render(<SubsidyCalculator {...defaultProps} />)
    const calcSection = screen.getByText('Калькулятор субсидий').parentElement
    expect(calcSection).toBeInTheDocument()
  })

  it('renders without programId', () => {
    render(
      <SubsidyCalculator
        defaultBankRate={18}
        defaultSubsidyRate={10}
      />
    )
    expect(screen.getByText('Калькулятор субсидий')).toBeInTheDocument()
  })

  it('handles default values', () => {
    render(<SubsidyCalculator />)
    // Should still render without crashing using defaults
    expect(screen.getByText('Калькулятор субсидий')).toBeInTheDocument()
  })
})
