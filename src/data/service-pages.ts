export type ServiceSection = {
  title: string;
  body: string;
};

export type ServicePage = {
  slug: string;
  navKey: "managed-it" | "backup" | "support";
  title: string;
  metaDescription: string;
  heroTitle: string;
  heroEyebrow?: string;
  heroLead: string;
  pageHeading?: string;
  intro: string;
  fullWidthIntro?: boolean;
  included: string[];
  scenario: string;
  sections: ServiceSection[];
  closing: string;
  image?: string;
  imageAlt?: string;
  localAudience?: string;
};

export const servicePages: ServicePage[] = [
  {
    slug: "managed-it-services",
    navKey: "managed-it",
    title: "Managed IT Services",
    metaDescription:
      "BBNCS managed IT services for Temecula businesses — 24/7 support, security, scalable solutions, and predictable pricing.",
    heroTitle: "Managed IT Services",
    heroEyebrow: "Managed IT · Temecula, CA",
    heroLead:
      "A full team of IT specialists keeping your systems in excellent working order — so you can focus on your business.",
    pageHeading: "Why BBNCS is the perfect choice for managed IT",
    intro:
      "As your business grows, managing your IT infrastructure can become complex and time-consuming. BBNCS is an industry-leading managed IT provider offering comprehensive solutions tailored to your needs. Our goal is to help you stay focused on your core business while we handle the technical side.",
    included: [
      "24/7 network and system monitoring",
      "Security patches and software updates",
      "Threat detection and vulnerability management",
      "Help desk support for your team",
      "Vendor coordination and IT planning",
      "Predictable monthly pricing",
    ],
    scenario:
      "Your server shows warning signs at 6pm — we're already investigating before your team notices.",
    sections: [
      {
        title: "Proven expertise and experience",
        body: "Our certified professionals stay current with the latest technologies and industry best practices, ensuring your business has access to advanced, reliable IT solutions.",
      },
      {
        title: "24/7/365 support",
        body: "Your business never stops — and neither should your IT support. Our team is available around the clock to address issues quickly, minimize downtime, and keep operations running smoothly.",
      },
      {
        title: "Customized solutions",
        body: "Every business is unique. We work closely with you to develop an IT strategy aligned with your goals — addressing your specific requirements for performance and growth.",
      },
      {
        title: "Robust security measures",
        body: "BBNCS employs proactive monitoring, vulnerability assessments, and modern threat detection to protect your data and help maintain compliance with industry regulations.",
      },
      {
        title: "Scalable solutions for growth",
        body: "As you expand, your IT needs grow too. We scale resources, infrastructure, and technology with your company — without unnecessary cost.",
      },
      {
        title: "Cost-effective services",
        body: "Predictable monthly pricing covers your IT needs and helps you avoid surprise expenses — with better control over your technology budget.",
      },
      {
        title: "Improved operational efficiency",
        body: "We don't just maintain your infrastructure — we optimize it. Proactive monitoring and issue prevention reduce downtime and improve overall performance.",
      },
    ],
    closing:
      "Choosing BBNCS for managed IT means investing in the future of your business. With unparalleled support, robust security, and scalable solutions, your IT is in expert hands.",
    localAudience:
      "Temecula and Inland Empire businesses with 5–100 employees that want proactive IT management — offices, professional services firms, medical practices, dealerships, and contractors who need a local partner, not a distant help desk.",
    image: "/images/services/it-service-management.jpg",
    imageAlt: "IT team managing business technology",
  },
  {
    slug: "managed-backup-solutions",
    navKey: "backup",
    title: "Managed Backup Solutions",
    metaDescription:
      "Reliable managed backup from BBNCS — local and cloud protection, fast recovery, 24/7 monitoring, and compliance-ready solutions.",
    heroTitle: "Managed Backup Solutions",
    heroEyebrow: "Managed Backup · Temecula, CA",
    heroLead:
      "Comprehensive backup strategies tailored to safeguard critical data and ensure business continuity.",
    pageHeading: "Your ideal partner for managed backup",
    intro:
      "In today's digital world, ensuring the safety and availability of your business data is paramount. Managed backup services from BBNCS provide the robust, reliable, and secure solutions you need to protect critical information.",
    included: [
      "Automated daily backups (local and cloud)",
      "Encrypted off-site storage",
      "Backup integrity monitoring",
      "Disaster recovery planning",
      "Fast restore when you need it",
      "Compliance-ready data protection",
    ],
    scenario:
      "Ransomware hits — we restore from a clean backup and get you back to work with minimal downtime.",
    sections: [
      {
        title: "Comprehensive data protection",
        body: "End-to-end protection including local and offsite backups, cloud storage, and encrypted transfers — keeping your information secure wherever it resides.",
      },
      {
        title: "Customized backup strategies",
        body: "We develop tailored plans based on data sensitivity, recovery time objectives, and your industry's compliance requirements.",
      },
      {
        title: "Fast and efficient data recovery",
        body: "When data loss happens, rapid restoration is crucial. Our technicians help you recover quickly so you can return to business with minimal disruption.",
      },
      {
        title: "Cutting-edge backup technologies",
        body: "Deduplication, incremental backups, and continuous data protection optimize efficiency, reduce storage needs, and lower the risk of data loss.",
      },
      {
        title: "24/7/365 monitoring and support",
        body: "Your data is critical. Our experts are available around the clock for emergencies and technical issues — help is a call or email away.",
      },
      {
        title: "Cost-effective solutions",
        body: "Flexible pricing for businesses of all sizes — serious data protection without breaking the bank.",
      },
      {
        title: "Regulatory compliance",
        body: "Solutions designed to help meet standards including HIPAA, GDPR, and PCI DSS — protecting your data and your reputation.",
      },
    ],
    closing:
      "Don't leave your business data at risk. Choose BBNCS for backup you can trust — secure, protected, and easily recoverable.",
    localAudience:
      "Temecula-area companies that cannot afford downtime or data loss — especially healthcare, finance, and businesses with compliance requirements who need monitored, tested backups with a local team on call.",
    image: "/images/services/managed-backup.svg",
    imageAlt: "Cloud backup with encrypted data protection",
  },
  {
    slug: "it-support-services",
    navKey: "support",
    title: "IT Support Services",
    metaDescription:
      "BBNCS IT support for Temecula businesses — rapid response, proactive monitoring, remote and on-site help, transparent pricing.",
    heroTitle: "The premier choice for IT Support Services",
    heroEyebrow: "IT Support Services · Temecula, CA",
    heroLead:
      "Top-notch remote and on-site support to promptly resolve technical issues for your team.",
    intro:
      "Effective IT support is essential to keep your business running smoothly. BBNCS provides support services tailored to the unique needs of your organization — with the responsiveness and expertise you deserve. Most day-to-day issues we handle remotely so you get help faster. We're local in Temecula and come on-site when it matters — new setups, hardware, network work, or when remote isn't enough.",
    fullWidthIntro: true,
    included: [
      "Remote and on-site troubleshooting",
      "New employee workstation setup",
      "Software and hardware support",
      "Email, network, and printer help",
      "24/7 emergency response",
      "One local team that knows your setup",
    ],
    scenario:
      "A new hire starts Monday — we set up their laptop and access remotely or on-site before they walk in.",
    sections: [
      {
        title: "Skilled and experienced professionals",
        body: "Certified IT experts with years of experience stay current on technology and best practices so your organization benefits from reliable solutions.",
      },
      {
        title: "Rapid response times",
        body: "When issues arise, fast resolution matters. We prioritize responsiveness and are available 24/7/365 to minimize downtime and disruption.",
      },
      {
        title: "Personalized support",
        body: "We take time to understand your business and challenges — delivering tailored support that drives success and growth.",
      },
      {
        title: "Proactive approach",
        body: "We don't just react to problems. Proactive monitoring identifies and addresses potential issues before they escalate.",
      },
      {
        title: "Comprehensive IT support",
        body: "From software troubleshooting to hardware installations — one point of contact for your technology needs, streamlining communication.",
      },
      {
        title: "Transparent and flexible pricing",
        body: "High-quality support at fair, transparent prices. Flexible plans for businesses of all sizes — no hidden fees or surprises.",
      },
      {
        title: "Dedication to customer satisfaction",
        body: "Your satisfaction is our priority. We go the extra mile to keep your IT environment running smoothly and efficiently.",
      },
    ],
    closing:
      "Partner with a team dedicated to your success. Trust BBNCS to keep your IT environment running at peak performance.",
    localAudience:
      "Temecula businesses that need responsive help — new employee setups, email and printer issues, remote troubleshooting, and on-site visits when hardware or network work requires a technician at your office.",
  },
];

export function getServicePage(slug: string): ServicePage | undefined {
  return servicePages.find((page) => page.slug === slug);
}
