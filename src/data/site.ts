export const business = {
  name: "Bits, Bytes & Nibbles",
  shortName: "BBNCS",
  tagline: "Your in-office technician",
  phone: "951-506-4755",
  phoneTel: "+19515064755",
  email: "sales@bbncs.com",
  address: {
    line1: "27780 Jefferson Ave, Suite G",
    city: "Temecula",
    state: "CA",
    zip: "92590",
    full: "27780 Jefferson Ave, Suite G, Temecula, CA 92590",
  },
  hours: [
    { days: "Monday – Friday", time: "8am – 5pm", note: "By Appointment Only" },
    { days: "Weekends", time: "EMERGENCIES ONLY" },
  ],
  temeculaSince: 2004,
  inBusinessSince: 1989,
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=27780+Jefferson+Ave+Temecula+CA+92590",
  googleReviewsUrl:
    "https://www.google.com/maps/place/Bits+Bytes+and+Nibbles+Computer+Repair/@33.511062,-117.156951,17z/data=!4m8!3m7!1s0x80db7e33eb9757a3:0xe69b493f8a7f9e6c!8m2!3d33.511062!4d-117.156951!9m1!1b1",
  mapsEmbedSrc:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13306.510826950016!2d-117.156951!3d33.511062!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80db7e33eb9757a3%3A0xe69b493f8a7f9e6c!2sBits%20Bytes%20and%20Nibbles%20Computer%20Repair!5e0!3m2!1sen!2sus!4v1679953628494!5m2!1sen!2sus",
  social: {
    facebook: "#",
    twitter: "#",
    instagram: "#",
    youtube: "#",
    linkedin: "#",
  },
} as const;

export const consultationCta = "Schedule Your Free Consultation";

export const services = [
  {
    title: "Managed IT",
    href: "/managed-it-services/",
    icon: "monitor",
    outcome: "An ongoing partnership — we monitor, maintain, and manage your systems proactively.",
    description:
      "As your business grows, managing your IT infrastructure can become complex and time-consuming. BBNCS keeps your systems running so you can focus on your business.",
  },
  {
    title: "Backup",
    href: "/managed-backup-solutions/",
    icon: "database",
    outcome: "Your data is copied, protected, and recoverable if something goes wrong.",
    description:
      "Managed backup services from BBNCS provide robust, reliable, and secure solutions to protect your critical information.",
  },
  {
    title: "IT Support",
    href: "/it-support-services/",
    icon: "headset",
    outcome: "Help when you need it — remote or on-site, including 24/7 emergencies.",
    description:
      "Experienced remote and on-site support to resolve technical issues quickly — with 24/7/365 availability when you need us.",
  },
] as const;

export const clientLogos = [
  { name: "RCS", src: "/images/clients/rcs-logo-75.png" },
  { name: "NiteRider Off Road", src: "/images/clients/niterider-off-road-logo-75.png" },
  { name: "Temecula Valley Buick GMC", src: "/images/clients/temecula-valley-buick-gmc-75.png" },
  { name: "TCP", src: "/images/clients/tqp-logo.png" },
  { name: "Certified Medical Sales", src: "/images/clients/certified-medical-sales.png" },
  { name: "Palm Desert Air Conditioning", src: "/images/clients/palm-desert-ac.png" },
  { name: "Allison Air Conditioning", src: "/images/clients/allison-air-conditioning-logo.jpg" },
] as const;

export const socialLinks = [
  { key: "facebook", label: "Facebook", href: business.social.facebook },
  { key: "twitter", label: "Twitter", href: business.social.twitter },
  { key: "instagram", label: "Instagram", href: business.social.instagram },
  { key: "youtube", label: "YouTube", href: business.social.youtube },
  { key: "linkedin", label: "LinkedIn", href: business.social.linkedin },
] as const;

export const navLinks = [
  { label: "Home", href: "/", key: "home" },
  { label: "Managed IT", href: "/managed-it-services/", key: "managed-it" },
  { label: "Backup", href: "/managed-backup-solutions/", key: "backup" },
  { label: "IT Support", href: "/it-support-services/", key: "support" },
  { label: "FAQs", href: "/faqs/", key: "faqs" },
  { label: "Office", href: "/office/", key: "office" },
  { label: "Contact", href: "/contact/", key: "contact" },
] as const;
