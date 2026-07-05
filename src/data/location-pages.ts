export type LocationSection = {
  title: string;
  body: string;
};

export type LocationPage = {
  slug: string;
  title: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLead: string;
  intro: string;
  sections: LocationSection[];
  relatedLinks: { href: string; label: string }[];
};

export const locationPages: LocationPage[] = [
  {
    slug: "temecula-it-services",
    title: "IT Services in Temecula",
    metaDescription:
      "BBNCS provides managed IT, backup, and IT support for Temecula businesses — local team, 24/7 emergencies, in business since 1989.",
    heroEyebrow: "Temecula, CA · Riverside County",
    heroTitle: "IT services for Temecula businesses",
    heroLead:
      "A local partner for managed IT, backup, and day-to-day support — serving Temecula and the Inland Empire since 2004.",
    intro:
      "Bits, Bytes & Nibbles (BBNCS) helps Temecula companies keep technology secure, backed up, and running without the downtime surprises that cost you money. Whether you need ongoing managed IT, reliable backup, or responsive support, you get real technicians who know your setup — not a generic national call center.",
    sections: [
      {
        title: "Who we serve in Temecula",
        body: "We work with local businesses of roughly 5–100 employees — professional services, medical offices, automotive dealerships, HVAC contractors, and retail offices that need dependable IT without hiring a full in-house team.",
      },
      {
        title: "Services available locally",
        body: "Most work is handled remotely for faster response. We come on-site to our Jefferson Ave office by appointment and visit your Temecula location when hardware, networking, or hands-on setup requires it.",
      },
      {
        title: "Service area",
        body: "Temecula is our home base. We also support businesses in Murrieta, Menifee, Lake Elsinore, Wildomar, and greater Riverside County.",
      },
    ],
    relatedLinks: [
      { href: "/managed-it-services/", label: "Managed IT Services" },
      { href: "/managed-backup-solutions/", label: "Managed Backup" },
      { href: "/it-support-services/", label: "IT Support" },
      { href: "/office/", label: "Visit our Temecula office" },
    ],
  },
  {
    slug: "managed-it-services-temecula",
    title: "Managed IT Services Temecula",
    metaDescription:
      "Managed IT services in Temecula, CA — proactive monitoring, security, and help desk support from BBNCS. Local team, predictable pricing.",
    heroEyebrow: "Managed IT · Temecula, CA",
    heroTitle: "Managed IT services in Temecula",
    heroLead:
      "Proactive monitoring, security, and support from a local team — so your Temecula business stays focused on work, not IT fires.",
    intro:
      "Growing Temecula businesses need IT that scales without surprise bills or overnight outages. BBNCS managed IT covers monitoring, patching, threat detection, help desk support, and IT planning with predictable monthly pricing.",
    sections: [
      {
        title: "Why Temecula companies choose managed IT",
        body: "You get 24/7 monitoring, a dedicated local team, and one partner for the full stack — instead of patching problems reactively or relying on whoever is available that day.",
      },
      {
        title: "What's included",
        body: "Network and system monitoring, security updates, vulnerability management, help desk support, vendor coordination, and IT roadmap planning tailored to how your business actually runs.",
      },
    ],
    relatedLinks: [
      { href: "/managed-it-services/", label: "Full managed IT overview" },
      { href: "/temecula-it-services/", label: "All Temecula IT services" },
      { href: "/contact/", label: "Schedule a free consultation" },
    ],
  },
  {
    slug: "it-support-temecula",
    title: "IT Support Temecula",
    metaDescription:
      "IT support in Temecula — remote and on-site help, new employee setup, and 24/7 emergencies from BBNCS. Local technicians who know your network.",
    heroEyebrow: "IT Support · Temecula, CA",
    heroTitle: "IT support in Temecula",
    heroLead:
      "Fast remote help and on-site visits when you need them — from a Temecula team available 24/7 for emergencies.",
    intro:
      "When email stops working, a new hire starts Monday, or a printer takes down the office, you need support that responds quickly. BBNCS provides remote troubleshooting and on-site help throughout Temecula and the Inland Empire.",
    sections: [
      {
        title: "Remote and on-site support",
        body: "Most issues are resolved remotely so you get help faster. We're local and come on-site for hardware installs, network work, and situations where remote access isn't enough.",
      },
      {
        title: "Common requests we handle",
        body: "Workstation setup, Microsoft 365 and email issues, VPN and network troubleshooting, printer and peripheral support, and after-hours emergency response.",
      },
    ],
    relatedLinks: [
      { href: "/it-support-services/", label: "Full IT support overview" },
      { href: "/temecula-it-services/", label: "All Temecula IT services" },
      { href: "/contact/", label: "Get IT help" },
    ],
  },
  {
    slug: "managed-backup-temecula",
    title: "Managed Backup Temecula",
    metaDescription:
      "Managed backup solutions in Temecula — encrypted local and cloud backups, monitoring, and fast recovery from BBNCS.",
    heroEyebrow: "Managed Backup · Temecula, CA",
    heroTitle: "Managed backup in Temecula",
    heroLead:
      "Protect critical business data with monitored, encrypted backups and a local team ready to restore when it matters.",
    intro:
      "Ransomware, hardware failure, and human error can stop a Temecula business cold. BBNCS managed backup keeps encrypted copies off-site, monitors integrity, and helps you recover quickly with a disaster recovery plan built for your operation.",
    sections: [
      {
        title: "Backup built for local businesses",
        body: "We design backup strategy around your recovery time goals, compliance needs, and budget — not a one-size-fits-all cloud folder.",
      },
      {
        title: "Peace of mind",
        body: "Automated daily backups, integrity monitoring, and tested restore procedures mean you're not guessing whether your data is safe until disaster strikes.",
      },
    ],
    relatedLinks: [
      { href: "/managed-backup-solutions/", label: "Full backup overview" },
      { href: "/temecula-it-services/", label: "All Temecula IT services" },
      { href: "/contact/", label: "Discuss your backup needs" },
    ],
  },
];

export function getLocationPage(slug: string): LocationPage | undefined {
  return locationPages.find((page) => page.slug === slug);
}
