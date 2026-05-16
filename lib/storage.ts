"use client"

export function setItem<T>(key: string, value: T): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error saving to localStorage:`, error)
    }
  }
}

export function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window !== "undefined") {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage:`, error)
      return defaultValue
    }
  }
  return defaultValue
}

export function removeItem(key: string): void {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage:`, error)
    }
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
