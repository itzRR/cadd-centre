import Link from "next/link"
import { GraduationCap, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <img src="/cadd-logo.png" alt="CADD Centre Logo" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-5">
              Sri Lanka&apos;s premier education platform, empowering learners with world-class courses and events.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white text-gray-400 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-5">Quick Links</h3>
            <ul className="space-y-3">
              {[["Home", "/"], ["Courses", "/courses"], ["Events", "/events"], ["About", "/about"], ["Contact", "/contact"]].map(([name, href]) => (
                <li key={name}>
                  <Link href={href} className="text-gray-500 hover:text-blue-600 text-sm transition-colors hover:translate-x-1 inline-block">{name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-5">Categories</h3>
            <ul className="space-y-3">
              {["Web Development", "Data Science", "UI/UX Design", "Mobile Development", "Cybersecurity"].map((cat) => (
                <li key={cat}>
                  <Link href={`/courses?category=${cat}`} className="text-gray-500 hover:text-blue-600 text-sm transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-5">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <Mail className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                info@scholarsync.lk
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <Phone className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                +94 11 234 5678
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-500">
                <MapPin className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                123 Education Lane, Colombo 03, Sri Lanka
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} CADD Centre Lanka. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-400 hover:text-blue-600 text-sm transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-blue-600 text-sm transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
