// src/data/cards.ts
import type { Card } from '../types';

// ==========================================
// TIER 2 CARDS (Upgraded Versions)
// ==========================================

export const CARD_INSTANT_TRANSFER: Omit<Card, 'id'> = {
    baseId: 'instant_transfer',
    name: 'Instant Transfer',
    type: 'ATTACK',
    description: 'Solve the problem by paying 80 PLN.',
    value: 80
};

export const CARD_TERM_DEPOSIT: Omit<Card, 'id'> = {
    baseId: 'term_deposit',
    name: 'Term Deposit',
    type: 'DEFENSE',
    description: 'Add 80 PLN to your financial cushion.',
    value: 80
};

export const CARD_FINANCIAL_PLAN: Omit<Card, 'id'> = {
    baseId: 'financial_plan',
    name: 'Financial Plan',
    type: 'SUPPORT',
    description: 'Draw 3 cards. Gain 1 Action.',
    value: 0,
    drawsCards: 3,     // Upgraded version draws 3 instead of 2
    addsActions: 1
};

// ==========================================
// TIER 1 CARDS (Base Versions)
// ==========================================

export const CARD_CASH: Omit<Card, 'id'> = {
    baseId: 'cash',
    name: 'Cash',
    type: 'ATTACK',
    description: 'Solve the problem by paying 50 PLN.',
    value: 50,
    upgradeTo: 'instant_transfer' // The Foreign Key!
};

export const CARD_SAVINGS: Omit<Card, 'id'> = {
    baseId: 'savings',
    name: 'Savings Account',
    type: 'DEFENSE',
    description: 'Add 50 PLN to your financial cushion.',
    value: 50,
    upgradeTo: 'term_deposit'
};

export const CARD_BUDGET_REVIEW: Omit<Card, 'id'> = {
    baseId: 'budget_review',
    name: 'Budget Review',
    type: 'SUPPORT',
    description: 'Draw 2 cards. Gain 1 Action.',
    value: 0,
    drawsCards: 2,
    addsActions: 1,
    upgradeTo: 'financial_plan'
};

// ==========================================
// REGISTRY & HELPERS
// ==========================================

// A dictionary to easily look up any card by its baseId
export const CardRegistry: Record<string, Omit<Card, 'id'>> = {
    [CARD_CASH.baseId]: CARD_CASH,
    [CARD_INSTANT_TRANSFER.baseId]: CARD_INSTANT_TRANSFER,
    [CARD_SAVINGS.baseId]: CARD_SAVINGS,
    [CARD_TERM_DEPOSIT.baseId]: CARD_TERM_DEPOSIT,
    [CARD_BUDGET_REVIEW.baseId]: CARD_BUDGET_REVIEW,
    [CARD_FINANCIAL_PLAN.baseId]: CARD_FINANCIAL_PLAN,
};

// Helper function to generate the starting deck
export const getInitialDeck = (): Card[] => {
    return [
        { ...CARD_CASH, id: 'cash_1' },
        { ...CARD_CASH, id: 'cash_2' },
        { ...CARD_CASH, id: 'cash_3' },
        { ...CARD_CASH, id: 'cash_4' },
        { ...CARD_SAVINGS, id: 'savings_1' },
        { ...CARD_SAVINGS, id: 'savings_2' },
        { ...CARD_SAVINGS, id: 'savings_3' },
        { ...CARD_SAVINGS, id: 'savings_4' },
        { ...CARD_BUDGET_REVIEW, id: 'review_1' }
    ];
};