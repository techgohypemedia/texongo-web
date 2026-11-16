import type { IconType } from "react-icons";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

// Single source of truth for Texongo social profiles (footer, contact page, SEO).
export const SOCIAL_LINKS: { name: string; href: string; Icon: IconType }[] = [
  { name: "Instagram", href: "https://www.instagram.com/texongofabrics/", Icon: FaInstagram },
  { name: "LinkedIn", href: "https://in.linkedin.com/company/texongo-fabrics", Icon: FaLinkedinIn },
  { name: "Facebook", href: "https://www.facebook.com/texongo", Icon: FaFacebookF },
];
