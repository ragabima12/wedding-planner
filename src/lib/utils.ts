import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sum<T>(rows: readonly T[], pick: (row: T) => number | null | undefined) {
  return rows.reduce((total, r) => total + (pick(r) ?? 0), 0)
}
