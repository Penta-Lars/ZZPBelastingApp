import type { GageEntry, SaveGageEntryRequest } from '../types';

/**
 * Repository Pattern: Abstraheren van storage-implementatie
 * Mogelijk om later naar SQL/Nextcloud te migreren zonder code-changes
 */
export interface IGageRepository {
  saveEntry(userId: string, entry: SaveGageEntryRequest): Promise<GageEntry>;
  getEntriesByQuarter(userId: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', year: number): Promise<GageEntry[]>;
  getEntriesByUser(userId: string): Promise<GageEntry[]>;
  deleteEntry(userId: string, entryId: string): Promise<void>;
}
