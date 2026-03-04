import type { ExpenseEntry, SaveExpenseRequest } from '../types';

/**
 * Repository Pattern voor uitgaven (bonnetjes).
 * Abstractie zodat migratie naar SQL/Nextcloud later mogelijk is.
 */
export interface IExpenseRepository {
  saveExpense(userId: string, request: SaveExpenseRequest): Promise<ExpenseEntry>;
  updateExpense(userId: string, expenseId: string, request: SaveExpenseRequest): Promise<ExpenseEntry>;
  getExpensesByUser(userId: string): Promise<ExpenseEntry[]>;
  getExpensesByYear(userId: string, year: number): Promise<ExpenseEntry[]>;
  deleteExpense(userId: string, expenseId: string): Promise<void>;
}
