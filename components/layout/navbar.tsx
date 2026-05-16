"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu, X, GraduationCap, User, LogOut,
  LayoutDashboard, BookOpen, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, signOut, getDefaultRoute } from "@/lib/auth"
import type { AuthUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Avatar } from "@/components/ims/ProfileSection"

const navigation = [
  { name: "Home",     href: "/" },
  { name: "Courses",  href: "/courses" },
  { name: "About",    href: "/about" },
  { name: "Contact",  href: "/contact" },
]

export function Navbar() {
  const [isOpen, setIsOpen]       = useState(false)
  const [user, setUser]           = useState<AuthUser | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router   = useRouter()

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION - no need for a separate getCurrentUser() call
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        getCurrentUser().then(u => {
          setUser(u)
          if (u) {
            supabase.from("profiles").select("avatar_url").eq("id", session.user.id).single()
              .then(({ data }) => setAvatarUrl(data?.avatar_url ?? null))
          }
        })
      } else {
        setUser(null)
        setAvatarUrl(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    router.push("/")
  }

  const NON_STUDENT_ROLES = ["admin","super_admin","academic_head","academic_officer","finance_head","finance_officer","marketing_head","marketing_officer","hr_head","hr_officer","staff","lecturer"]
  const isAdminUser = user && NON_STUDENT_ROLES.includes(user.role)
  const adminRoute = user ? getDefaultRoute(user.role) : "/admin"

  const isPortalPage = pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/my-') || pathname.startsWith('/resources')

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled
        ? "bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-white/20"
        : "bg-white/50 backdrop-blur-md border-b border-white/10"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-500 ${isScrolled ? "h-16" : "h-20"}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/cadd-logo.png" alt="CADD Centre Logo" className="h-8 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-blue-100">
                      <Avatar photoURL={avatarUrl} name={user.name ?? ""} size="sm" className="w-full h-full" />
                    </div>
                    <span className="text-sm font-medium max-w-[120px] truncate">{user.name?.split(" ")[0]}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">
                      {user.role?.replace("_", " ")}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" /> My Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-courses" className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> My Courses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdminUser && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={adminRoute} className="flex items-center gap-2 text-blue-700">
                          <LayoutDashboard className="h-4 w-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild size="sm"
                  className="text-gray-700 hover:bg-gray-100">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${pathname === item.href ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"}`}
                onClick={() => setIsOpen(false)}>
                {item.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 space-y-1">
              {user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen(false)}>My Portal</Link>
                  {isAdminUser && <Link href={adminRoute} className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Admin Panel</Link>}
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsOpen(false)}>Sign In</Link>
                  <Link href="/auth/register" className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-50" onClick={() => setIsOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
