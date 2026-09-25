import { describe, expect, it } from 'vitest'
import {
  aggregateCampaignMetrics,
  calculateAverageOrderValue,
  calculateBudgetUtilizationPct,
  calculateCAC,
  calculateCPA,
  calculateCPC,
  calculateCPL,
  calculateCTR,
  calculateConversionRate,
  calculateLeadToCustomerRate,
  calculatePeriodGrowthPct,
  calculateROAS,
  calculateROMI,
} from './formulas'

describe('calculateCTR', () => {
  it('computes clicks/impressions as a percentage', () => {
    expect(calculateCTR(50, 1000)).toBe(5)
  })
  it('returns null when there are no impressions', () => {
    expect(calculateCTR(0, 0)).toBeNull()
  })
})

describe('calculateCPC', () => {
  it('divides spend by clicks', () => {
    expect(calculateCPC(5000, 200)).toBe(25)
  })
  it('returns null when there are no clicks', () => {
    expect(calculateCPC(5000, 0)).toBeNull()
  })
})

describe('calculateCPL', () => {
  it('divides spend by leads', () => {
    expect(calculateCPL(10000, 40)).toBe(250)
  })
  it('returns null when there are no leads', () => {
    expect(calculateCPL(10000, 0)).toBeNull()
  })
})

describe('calculateCPA', () => {
  it('divides spend by conversions', () => {
    expect(calculateCPA(20000, 25)).toBe(800)
  })
  it('returns null when there are no conversions', () => {
    expect(calculateCPA(20000, 0)).toBeNull()
  })
})

describe('calculateCAC', () => {
  it('divides total spend by new customers', () => {
    expect(calculateCAC(150000, 30)).toBe(5000)
  })
  it('returns null when there are no new customers', () => {
    expect(calculateCAC(150000, 0)).toBeNull()
  })
})

describe('calculateROAS', () => {
  it('divides attributed revenue by spend', () => {
    expect(calculateROAS(80000, 20000)).toBe(4)
  })
  it('returns null when spend is zero', () => {
    expect(calculateROAS(80000, 0)).toBeNull()
  })
  it('can be below 1 when spend exceeds revenue', () => {
    expect(calculateROAS(5000, 20000)).toBe(0.25)
  })
})

describe('calculateROMI', () => {
  it('computes percentage return over spend', () => {
    expect(calculateROMI(80000, 20000)).toBe(300)
  })
  it('returns null when spend is zero', () => {
    expect(calculateROMI(80000, 0)).toBeNull()
  })
  it('can be negative when revenue is below spend', () => {
    expect(calculateROMI(5000, 20000)).toBe(-75)
  })
})

describe('calculateConversionRate', () => {
  it('computes conversions/clicks as a percentage', () => {
    expect(calculateConversionRate(25, 500)).toBe(5)
  })
  it('returns null when there are no clicks', () => {
    expect(calculateConversionRate(25, 0)).toBeNull()
  })
})

describe('calculateLeadToCustomerRate', () => {
  it('computes customers/leads as a percentage', () => {
    expect(calculateLeadToCustomerRate(10, 40)).toBe(25)
  })
  it('returns null when there are no leads', () => {
    expect(calculateLeadToCustomerRate(10, 0)).toBeNull()
  })
})

describe('calculateBudgetUtilizationPct', () => {
  it('computes spent/planned as a percentage', () => {
    expect(calculateBudgetUtilizationPct(45000, 50000)).toBe(90)
  })
  it('can exceed 100 on overspend', () => {
    expect(calculateBudgetUtilizationPct(60000, 50000)).toBe(120)
  })
  it('returns null when nothing was planned', () => {
    expect(calculateBudgetUtilizationPct(1000, 0)).toBeNull()
  })
})

describe('calculateAverageOrderValue', () => {
  it('divides revenue by conversions', () => {
    expect(calculateAverageOrderValue(400000, 80)).toBe(5000)
  })
  it('returns null when there are no conversions', () => {
    expect(calculateAverageOrderValue(400000, 0)).toBeNull()
  })
})

describe('calculatePeriodGrowthPct', () => {
  it('computes percentage growth between two periods', () => {
    expect(calculatePeriodGrowthPct(1200, 1000)).toBe(20)
  })
  it('computes negative growth (decline)', () => {
    expect(calculatePeriodGrowthPct(800, 1000)).toBe(-20)
  })
  it('returns null when the previous value is zero', () => {
    expect(calculatePeriodGrowthPct(500, 0)).toBeNull()
  })
})

describe('aggregateCampaignMetrics', () => {
  it('sums raw metrics across campaigns for blended KPIs', () => {
    const result = aggregateCampaignMetrics([
      { budgetSpent: 10000, revenue: 40000, impressions: 50000, clicks: 1000, leads: 100, conversions: 20 },
      { budgetSpent: 5000, revenue: 5000, impressions: 20000, clicks: 300, leads: 20, conversions: 3 },
    ])
    expect(result).toEqual({
      spend: 15000,
      revenue: 45000,
      impressions: 70000,
      clicks: 1300,
      leads: 120,
      conversions: 23,
    })
  })
  it('returns all zeros for an empty list', () => {
    expect(aggregateCampaignMetrics([])).toEqual({
      spend: 0,
      revenue: 0,
      impressions: 0,
      clicks: 0,
      leads: 0,
      conversions: 0,
    })
  })
})
