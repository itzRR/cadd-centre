"use client"

import { motion } from "framer-motion"
import { Lock, Info } from "lucide-react"
import {
  PERMISSION_DEFS, ROLE_BASE_PERMISSIONS,
  type Permission
} from "@/lib/permissions"
import type { UserRole } from "@/types"

interface PermissionGridProps {
  role: UserRole
  grantedPermissions: Permission[]
  onChange: (perms: Permission[]) => void
  readOnly?: boolean
  currentUserRole: UserRole | string
}

export function PermissionGrid({ role, grantedPermissions, onChange, readOnly, currentUserRole }: PermissionGridProps) {
  const basePerms = ROLE_BASE_PERMISSIONS[role] || []
  const groups = ['IMS', 'ASMS', 'Tasks'] as const

  const togglePerm = (key: Permission) => {
    if (readOnly) return
    if (grantedPermissions.includes(key)) {
      onChange(grantedPermissions.filter(p => p !== key))
    } else {
      onChange([...grantedPermissions, key])
    }
  }

  return (
    <div className="space-y-6">
      {groups.map(group => {
        let items = PERMISSION_DEFS.filter(d => d.group === group)
        
        // Hide advanced system-wide permissions if the current user granting them is NOT an admin.
        // Even if they are editing an admin, a non-admin shouldn't be able to grant `ims_finance`, etc.
        if (!['admin', 'super_admin'].includes(currentUserRole)) {
          let hidePerms = ['ims_overview', 'ims_marketing', 'ims_academic', 'ims_finance', 'ims_hr', 'ims_control_panel', 'asms_full', 'ims_users']
          
          if (currentUserRole === 'hr_officer') hidePerms = hidePerms.filter(p => p !== 'ims_users')
            
          items = items.filter(d => !hidePerms.includes(d.key))
        }
        
        // Don't render empty groups
        if (items.length === 0) return null

        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/10" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{group}</p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-white/10" />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {items.map(def => {
                const isBase = basePerms.includes(def.key)
                const isGranted = isBase || grantedPermissions.includes(def.key)
                const isExtra = !isBase && grantedPermissions.includes(def.key)

                return (
                  <motion.label
                    key={def.key}
                    whileHover={!isBase ? { scale: 1.01, x: 4 } : {}}
                    whileTap={!isBase ? { scale: 0.99 } : {}}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-300 ${
                      isBase
                        ? 'bg-red-500/10 border-red-500/20 opacity-80 cursor-default'
                        : isExtra
                          ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                          : 'bg-gray-200 border-gray-100 hover:border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => !isBase && togglePerm(def.key)}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isBase ? (
                        <div className="w-5 h-5 rounded-lg bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                          <Lock className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-500 ${
                          isGranted
                            ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isGranted && (
                            <motion.svg initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </motion.svg>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold transition-colors ${isGranted ? 'text-gray-900' : 'text-gray-600'}`}>{def.label}</span>
                        {isBase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-600 font-bold border border-red-500/20 uppercase tracking-tighter">
                            Default
                          </span>
                        )}
                        {isExtra && (
                          <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 font-bold border border-emerald-500/20 uppercase tracking-tighter">
                            Granted
                          </motion.span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{def.description}</p>
                    </div>
                  </motion.label>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center gap-3 bg-red-50 p-4 rounded-2xl border border-red-100">
        <Info className="h-5 w-5 flex-shrink-0 text-red-500" />
        <p className="text-[11px] text-gray-600 leading-relaxed">
          <strong className="text-red-600">Red/Lock</strong> permissions are fixed for this role. 
          <br />
          <strong className="text-emerald-700">Emerald</strong> permissions are custom overrides granted to this specific user.
        </p>
      </div>
    </div>
  )
}
