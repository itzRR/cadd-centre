"use client"
import { motion } from "framer-motion"

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-32 pb-24 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 p-8 md:p-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-4">Privacy Policy</h1>
          <p className="text-gray-400 font-medium mb-12">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-10 text-[#475569] leading-relaxed text-lg">
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">1. Information We Collect</h2>
              <p>We collect information you provide directly to us when you register for an account, enroll in a course, or contact our support team. This may include your name, email address, phone number, and payment information.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">2. How We Use Your Information</h2>
              <p>We use the information we collect to provide, maintain, and improve our services, process transactions, send administrative messages, and respond to your comments and questions.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">3. Data Security</h2>
              <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.</p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-[#0F172A] mb-4">4. Contact Us</h2>
              <p>If you have questions or comments about this policy, you may email us at <strong>info@scholarsync.lk</strong> or contact us via our Contact Page.</p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
