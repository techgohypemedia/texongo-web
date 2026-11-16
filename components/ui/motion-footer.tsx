"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/social-links";

export function MotionFooter() {
  return (
    <footer className="relative z-20 w-full bg-[#111111] text-white pt-16 pb-6 px-6 md:px-12 lg:px-24 flex flex-col font-sans">

      {/* Top Section */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-12 mb-12">
        <div className="mb-6 md:mb-0 flex flex-col items-start">
          <Image 
            src="/logos/logo.png" 
            alt="Texongo Logo" 
            width={180} 
            height={60} 
            className="h-10 w-auto object-contain"
            style={{ filter: 'invert(1) hue-rotate(180deg)' }}
          />
          <p className="text-white/50 !text-[12px] mt-2 font-medium">
            Premium Fabric & 3D Visualization
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end space-y-2">
          <a href="tel:+919910048498" className="flex items-center space-x-2 text-white/80 hover:text-[#57AD43] transition-colors text-sm font-medium">
            <Phone size={16} />
            <span>+91 9910048498 / 9310598498</span>
          </a>
          <a href="mailto:Connect@texongo.com" className="flex items-center space-x-2 text-white/80 hover:text-[#57AD43] transition-colors text-sm font-medium">
            <Mail size={16} />
            <span>Connect@texongo.com</span>
          </a>
        </div>
      </div>

      {/* Middle Section (Columns) */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 lg:gap-16 pb-12 border-b border-white/10 mb-8">

        {/* Column 1: About Us */}
        <div>
          <h4 className="text-white font-bold text-sm mb-6">About us</h4>
          <ul className="space-y-3">
            {[
              { name: "Home", href: "/" },
              { name: "About Us", href: "/about-us" },
              { name: "Fabrics", href: "/fabrics" },
            ].map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-white/60 text-sm hover:text-white transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Menu */}
        <div>
          <h4 className="text-white font-bold text-sm mb-6">Menu</h4>
          <ul className="space-y-3">
            {[
              { name: "Contact Us", href: "/contact-us" },
              { name: "Terms & Conditions", href: "/terms-and-conditions" },
              { name: "Shipping & Return Policy", href: "/shipping-and-return-policy" },
            ].map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-white/60 text-sm hover:text-white transition-colors">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Address */}
        <div>
          <h4 className="text-white font-bold text-sm mb-6">Address</h4>
          <ul className="space-y-3">
            <li className="flex items-start space-x-3 text-white/60 text-sm leading-relaxed">
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span>D 10/1 Okhla Industrial Area<br />Phase II, New Delhi - 110020</span>
            </li>
          </ul>
        </div>

        {/* Column 4: Follow Us */}
        <div>
          <h4 className="text-white font-bold text-sm mb-6">Follow Us</h4>
          <ul className="space-y-3">
            {SOCIAL_LINKS.map(({ name, href, Icon }) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-white/60 text-sm hover:text-white transition-colors">
                  <Icon size={14} />
                  {name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Section (Copyright) */}
      <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-white/40 text-xs">
          © 2026 Texongo Fabrics. All rights reserved.
        </p>

      </div>

    </footer>
  );
}
