"use client";

import { Mail, Globe, Phone, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { sendContactEmail } from "../../app/actions/send-email";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setFormLoadedAt(Date.now());
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: -40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" as const }
  };

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setFeedback(null);

    const result = await sendContactEmail(formData);

    setIsSubmitting(false);
    if (result.success) {
      setFeedback({ type: "success", message: "Your message has been sent successfully!" });
      formRef.current?.reset();
      setFormLoadedAt(Date.now());
    } else {
      setFeedback({ type: "error", message: result.error || "Something went wrong." });
    }
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 lg:px-20 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.08)] bg-white">

        {/* Left Column: Form Card */}
        <div className="p-10 lg:p-16 lg:pr-24 flex flex-col justify-center text-center md:text-left">
          <motion.div {...fadeIn}>
            <span className="text-[10px] font-black uppercase text-[#57AD43] mb-2 block tracking-widest">Connect</span>
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-10 tracking-tight">Send a Message</h2>
          </motion.div>

          <form ref={formRef} action={handleSubmit} className="space-y-5 text-left">
            {/* Honeypot Decoy Fields: Hidden from human users, traps automated spambots */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                opacity: 0,
                height: 0,
                width: 0,
                overflow: "hidden",
                pointerEvents: "none",
              }}
            >
              <label htmlFor="hp_company">Company</label>
              <input
                id="hp_company"
                type="text"
                name="hp_company"
                tabIndex={-1}
                autoComplete="off"
              />
              <label htmlFor="website">Website</label>
              <input
                id="website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
              <input type="hidden" name="_ts" value={formLoadedAt} />
            </div>
            <motion.div {...fadeIn} transition={{ delay: 0.1 }} className="space-y-2 relative group">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Name</label>
              <input
                name="name" type="text" required
                className="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg h-12 px-5 focus:ring-2 focus:ring-[#57AD43] focus:border-transparent outline-none transition-all group-hover:bg-gray-50"
              />
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="space-y-2 relative group">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Email</label>
              <input
                name="email" type="email" required
                className="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg h-12 px-5 focus:ring-2 focus:ring-[#57AD43] focus:border-transparent outline-none transition-all group-hover:bg-gray-50"
              />
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="space-y-2 relative group">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Contact Number</label>
              <input
                name="phone" type="tel"
                className="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg h-12 px-5 focus:ring-2 focus:ring-[#57AD43] focus:border-transparent outline-none transition-all group-hover:bg-gray-50"
              />
            </motion.div>

            <motion.div {...fadeIn} transition={{ delay: 0.4 }} className="space-y-2 relative group">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">Message</label>
              <textarea
                name="message" rows={3} required
                className="w-full bg-[#F9FAFB] border border-gray-200 rounded-lg px-5 py-4 focus:ring-2 focus:ring-[#57AD43] focus:border-transparent outline-none transition-all resize-none group-hover:bg-gray-50"
              />
            </motion.div>

            {feedback && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 ${feedback.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="text-sm font-bold">{feedback.message}</span>
              </motion.div>
            )}

            <motion.button
              {...fadeIn} transition={{ delay: 0.5 }}
              type="submit" disabled={isSubmitting}
              className="contact-send-message-btn w-fit mx-auto md:mx-0 px-8 py-3 bg-black hover:bg-[#57AD43] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider !text-[11px] rounded-full transition-all shadow-lg hover:shadow-[0_8px_20px_rgba(87,173,67,0.3)] transform active:scale-95 flex items-center justify-center gap-2"
              style={{ fontSize: '11px' }}
            >
              {isSubmitting ? (
                <><Loader2 className="animate-spin" size={16} /> Sending...</>
              ) : "Send Message"}
            </motion.button>
          </form>
        </div>

        {/* Right Column: Info Section (Green Gradient) */}
        <div className="relative bg-gradient-to-br from-[#57AD43] via-[#4a9a38] to-[#2d6e20] p-10 lg:p-16 flex flex-col justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10">
            <motion.div {...fadeIn} className="text-center md:text-left">
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 tracking-tight">Contact Information</h2>
              <p className="text-sm font-medium text-white/80 mb-12 max-w-md mx-auto md:mx-0 leading-relaxed">
                Have questions, need assistance, or want to share your feedback? Our team is here to help you. Feel free to reach out anytime.
              </p>
            </motion.div>

            <div className="flex flex-col gap-8 w-full">
              <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
                <ContactInfoItem icon={<Mail size={22} />} label="Email" value="Connect@texongo.com" href="mailto:Connect@texongo.com" />
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
                <ContactInfoItem icon={<Globe size={22} />} label="Website" value="https://texongo.com/" href="https://texongo.com/" />
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
                <ContactInfoItem icon={<Phone size={22} />} label="Phone" value="+91 9910048498" href="tel:+919910048498" />
              </motion.div>
              <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
                <ContactInfoItem icon={<MapPin size={22} />} label="Location" value="D 10/1, Pocket D, Okhla Industrial Area Phase II, New Delhi, Delhi 110020" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactInfoItem({ icon, label, value, href }: { icon: React.ReactNode, label: string, value: string, href?: string }) {
  const content = (
    <div className="flex items-start gap-5 group cursor-pointer">
      <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-2xl bg-white/10 text-white group-hover:bg-white group-hover:text-[#57AD43] transition-all duration-500 shadow-sm overflow-hidden backdrop-blur-sm border border-white/5 group-hover:scale-110">
        {icon}
      </div>
      <div className="flex flex-col justify-center pt-1">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{label}</span>
        <span className="text-sm font-semibold text-white/95 max-w-[250px] leading-relaxed group-hover:text-white transition-colors">{value}</span>
      </div>
    </div>
  );

  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer">{content}</a>;
  }
  return content;
}
