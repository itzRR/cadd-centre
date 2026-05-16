"use client"
import { motion } from "framer-motion"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-24 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 p-8 md:p-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-4">Terms and Conditions</h1>
          <p className="text-gray-400 font-medium mb-12">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-10 text-[#475569] leading-relaxed text-lg">
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">1. Agreement to Terms</h2>
              <p>By accessing or using Scholar Sync's platform, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">2. Use License</h2>
              <p>Permission is granted to temporarily access the materials (information or software) on Scholar Sync's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">3. Course Enrollment and Refunds</h2>
              <p>Enrollment in our courses is subject to availability. Refund requests must be submitted within 14 days of purchase, provided the student has not completed more than 20% of the course material.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">4. Modifications</h2>
              <p>Scholar Sync may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
