import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">{children}</main>
      <Footer />
    </>
  )
}
