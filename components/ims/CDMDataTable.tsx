"use client"

import React, { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, ChevronDown, ChevronUp, ChevronsUpDown,
  ChevronLeft, ChevronRight, Download, Columns3,
  Filter, X, MoreHorizontal
} from "lucide-react"
import * as XLSX from "xlsx"

// ── Types ──────────────────────────────────────────────────────
export interface CDMColumn<T = any> {
  key: string
  label: string
  sortable?: boolean
  visible?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
  exportKey?: string  // key to use when exporting, defaults to `key`
  exportTransform?: (value: any, row: T) => string | number
  width?: string
}

export interface CDMAction<T = any> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: T) => void
  variant?: "default" | "danger" | "success" | "warning"
  show?: (row: T) => boolean
}

export interface CDMDataTableProps<T = any> {
  data: T[]
  columns: CDMColumn<T>[]
  actions?: CDMAction<T>[]
  title?: string
  icon?: React.ComponentType<{ className?: string }>
  searchPlaceholder?: string
  exportFileName?: string
  enableExport?: boolean
  enableSearch?: boolean
  enableColumnToggle?: boolean
  enablePagination?: boolean
  enableSelection?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  onSelectionChange?: (selected: T[]) => void
  emptyMessage?: string
  emptyIcon?: React.ComponentType<{ className?: string }>
  headerActions?: React.ReactNode
  rowClassName?: (row: T, index: number) => string
  stickyHeader?: boolean
  compact?: boolean
  loading?: boolean
  idKey?: string
}

// ── Component ──────────────────────────────────────────────────
export default function CDMDataTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  title,
  icon: TitleIcon,
  searchPlaceholder = "Search...",
  exportFileName = "export",
  enableExport = true,
  enableSearch = true,
  enableColumnToggle = true,
  enablePagination = true,
  enableSelection = false,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onSelectionChange,
  emptyMessage = "No data found",
  emptyIcon: EmptyIcon,
  headerActions,
  rowClassName,
  stickyHeader = false,
  compact = false,
  loading = false,
  idKey = "id",
}: CDMDataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.filter(c => c.visible !== false).map(c => c.key))
  )
  const [openActionRow, setOpenActionRow] = useState<string | null>(null)

  // ── Search ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      columns.some(col => {
        const val = row[col.key]
        if (val == null) return false
        return String(val).toLowerCase().includes(q)
      })
    )
  }, [data, search, columns])

  // ── Sort ───────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av
      }
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // ── Paginate ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const paginated = enablePagination ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted

  // Reset page on search/data change
  React.useEffect(() => { setPage(0) }, [search, data.length])

  // ── Selection ──────────────────────────────────────────────
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginated.map(r => String(r[idKey]))))
    }
  }, [paginated, selectedIds.size, idKey])

  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(data.filter(r => selectedIds.has(String(r[idKey]))))
    }
  }, [selectedIds]) // eslint-disable-line

  // ── Sort handler ───────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  // ── Export ─────────────────────────────────────────────────
  const handleExport = () => {
    const exportData = sorted.map(row => {
      const obj: Record<string, any> = {}
      columns.forEach(col => {
        if (!visibleColumns.has(col.key)) return
        const key = col.exportKey || col.label
        obj[key] = col.exportTransform ? col.exportTransform(row[col.key], row) : (row[col.key] ?? "")
      })
      return obj
    })
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Data")
    XLSX.writeFile(wb, `${exportFileName}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Column toggle ──────────────────────────────────────────
  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const activeColumns = columns.filter(c => visibleColumns.has(c.key))
  const py = compact ? "py-2" : "py-3"
  const px = compact ? "px-3" : "px-4"

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {TitleIcon && (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
              <TitleIcon className="w-4.5 h-4.5" />
            </div>
          )}
          {title && (
            <div>
              <h3 className="text-base font-bold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-400 font-medium">{sorted.length} record{sorted.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          {enableSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9 pr-3 py-2 w-52 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Column Toggle */}
          {enableColumnToggle && (
            <div className="relative">
              <button
                onClick={() => setShowColumnMenu(p => !p)}
                className={`p-2 rounded-xl border transition-all ${showColumnMenu ? "bg-blue-50 border-blue-200 text-blue-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                title="Toggle columns"
              >
                <Columns3 className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showColumnMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-11 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-2 min-w-[180px]"
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">Columns</p>
                    {columns.map(col => (
                      <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 font-medium">{col.label}</span>
                      </label>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Export */}
          {enableExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}

          {/* Header Actions (custom buttons) */}
          {headerActions}
        </div>
      </div>

      {/* Click outside to close column menu */}
      {showColumnMenu && <div className="fixed inset-0 z-10" onClick={() => setShowColumnMenu(false)} />}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`bg-gray-50/80 ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            <tr>
              {enableSelection && (
                <th className={`${px} ${py} w-10`}>
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selectedIds.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {activeColumns.map(col => (
                <th
                  key={col.key}
                  className={`${px} ${py} text-left text-xs font-bold text-gray-500 uppercase tracking-wider select-none ${col.sortable !== false ? "cursor-pointer hover:text-gray-700" : ""} ${col.headerClassName || ""}`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      <span className="text-gray-300">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <ChevronsUpDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className={`${px} ${py} text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-20`}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={activeColumns.length + (enableSelection ? 1 : 0) + (actions ? 1 : 0)} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + (enableSelection ? 1 : 0) + (actions ? 1 : 0)} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    {EmptyIcon && <EmptyIcon className="w-10 h-10 text-gray-300" />}
                    <span className="text-gray-400 text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => {
                const rowId = String(row[idKey] ?? i)
                const isSelected = selectedIds.has(rowId)
                return (
                  <tr
                    key={rowId}
                    className={`hover:bg-blue-50/30 transition-colors ${isSelected ? "bg-blue-50/50" : ""} ${rowClassName ? rowClassName(row, i) : ""}`}
                  >
                    {enableSelection && (
                      <td className={`${px} ${py}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(rowId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {activeColumns.map(col => (
                      <td key={col.key} className={`${px} ${py} ${col.className || ""}`}>
                        {col.render ? col.render(row[col.key], row, i) : (
                          <span className="text-gray-700">{row[col.key] != null ? String(row[col.key]) : "—"}</span>
                        )}
                      </td>
                    ))}
                    {actions && actions.length > 0 && (
                      <td className={`${px} ${py} text-right relative`}>
                        {actions.length <= 2 ? (
                          <div className="flex items-center justify-end gap-1">
                            {actions.filter(a => !a.show || a.show(row)).map((action, ai) => {
                              const Icon = action.icon
                              const colors = {
                                default: "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                                danger: "text-red-500 hover:text-red-700 hover:bg-red-50",
                                success: "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50",
                                warning: "text-amber-500 hover:text-amber-700 hover:bg-amber-50",
                              }
                              return (
                                <button
                                  key={ai}
                                  onClick={() => action.onClick(row)}
                                  className={`p-1.5 rounded-lg transition-all ${colors[action.variant || "default"]}`}
                                  title={action.label}
                                >
                                  {Icon ? <Icon className="w-4 h-4" /> : <span className="text-xs font-medium">{action.label}</span>}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() => setOpenActionRow(openActionRow === rowId ? null : rowId)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                              {openActionRow === rowId && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setOpenActionRow(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]"
                                  >
                                    {actions.filter(a => !a.show || a.show(row)).map((action, ai) => {
                                      const Icon = action.icon
                                      const colors = {
                                        default: "text-gray-700 hover:bg-gray-50",
                                        danger: "text-red-600 hover:bg-red-50",
                                        success: "text-emerald-600 hover:bg-emerald-50",
                                        warning: "text-amber-600 hover:bg-amber-50",
                                      }
                                      return (
                                        <button
                                          key={ai}
                                          onClick={() => { action.onClick(row); setOpenActionRow(null) }}
                                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all ${colors[action.variant || "default"]}`}
                                        >
                                          {Icon && <Icon className="w-4 h-4" />}
                                          {action.label}
                                        </button>
                                      )
                                    })}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {enablePagination && sorted.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-blue-400"
            >
              {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span className="text-gray-400">
              {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(0)}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="First page"
              >
                <ChevronLeft className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 -ml-2.5" />
              </button>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-gray-600 px-2">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Last page"
              >
                <ChevronRight className="w-4 h-4" />
                <ChevronRight className="w-4 h-4 -ml-2.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
