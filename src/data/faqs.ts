export type FaqItem = {
  question: string;
  answer: string;
  relatedHref?: string;
  relatedLabel?: string;
};

export const faqs: FaqItem[] = [
  {
    question: "How quickly will you respond when I reach out?",
    answer:
      "During business hours (Monday–Friday, 8am–5pm), we aim to reply the same business day — often within a few hours. For urgent issues, call anytime; emergency support is available 24/7/365. Weekend requests are handled for emergencies only.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Plans are based on your users, devices, and the services you need — not a one-size-fits-all package. We start with a free consultation to understand your setup, then provide a clear quote with no surprise fees. Many clients combine managed IT, backup, and support.",
  },
  {
    question: "Which BBNCS service is right for my business?",
    answer:
      "It depends on what you need most. Managed IT is an ongoing partnership — we proactively monitor and manage your systems. Managed backup protects and recovers your data if something goes wrong. IT support is help when you need it, remote or on-site. Many businesses use all three. Contact us for a free consultation and we'll recommend the right mix for your setup.",
    relatedHref: "/managed-it-services/",
    relatedLabel: "Managed IT Services",
  },
  {
    question: "What are managed IT services?",
    answer:
      "Managed IT services involve outsourcing your company's IT needs to a third-party provider. This includes ongoing maintenance, monitoring, and management of your IT infrastructure, allowing your business to focus on core functions while your technology stays up-to-date, secure, and efficient.",
  },
  {
    question: "What is remote IT support, and how can it benefit my business?",
    answer:
      "Remote IT support allows professionals to provide technical assistance and resolve issues without being on-site. Benefits include faster response times, reduced downtime, cost savings on on-site visits, and access to a wider range of expertise.",
  },
  {
    question: "How do you ensure the security of my business data during remote support sessions?",
    answer:
      "We use industry-standard encryption, secure remote access tools, and strict authentication. Our technicians follow best practices for data protection and privacy on every session.",
  },
  {
    question: "Do you offer a Service Level Agreement (SLA) for managed IT services?",
    answer:
      "Yes. Our SLA outlines expectations, responsibilities, and performance metrics for managed IT services — so you receive reliable, high-quality support with a clear framework for resolving issues.",
  },
  {
    question: "How can I get started with managed IT, backup, or IT support?",
    answer:
      "Contact us to schedule a consultation. We'll assess your IT needs, discuss your goals, and develop a customized plan. Once you're ready, we implement the services and provide ongoing support.",
  },
  {
    question: "How do managed backup services work?",
    answer:
      "Managed backup creates regular, secure copies of your data, stores them off-site, and monitors their integrity. If data loss occurs, we can restore quickly to minimize downtime and damage.",
  },
  {
    question: "How can managed IT services save my business money?",
    answer:
      "Predictable monthly costs, reduced downtime, and fewer expensive emergencies help control spending. Outsourcing IT also frees your staff to focus on core business functions.",
  },
  {
    question: "Can you help my business stay compliant with industry regulations?",
    answer:
      "Yes. We provide guidance on best practices, implement required security measures, and monitor your IT environment for vulnerabilities — helping you work toward compliance goals.",
  },
  {
    question: "How do you handle data backup and recovery in the event of a disaster?",
    answer:
      "Our managed backup services include disaster recovery planning. We maintain regular off-site backups and can restore data quickly after a disaster to minimize downtime and data loss.",
    relatedHref: "/managed-backup-solutions/",
    relatedLabel: "Managed Backup Solutions",
  },
  {
    question: "Do you support businesses outside Temecula?",
    answer:
      "Yes. We're based in Temecula and serve businesses throughout the Inland Empire — Murrieta, Menifee, Lake Elsinore, and greater Riverside County. Most support is remote; we come on-site when your issue requires it.",
    relatedHref: "/temecula-it-services/",
    relatedLabel: "IT services in Temecula",
  },
  {
    question: "Can you help with Microsoft 365 or email migration?",
    answer:
      "Yes. We help Temecula businesses set up, migrate, and support Microsoft 365, Google Workspace, and on-premise email. That includes new-user onboarding, security settings, and troubleshooting day-to-day issues.",
    relatedHref: "/it-support-services/",
    relatedLabel: "IT Support Services",
  },
  {
    question: "What size businesses do you typically work with?",
    answer:
      "Most of our clients have between 5 and 100 employees — large enough to need reliable IT, small enough to want a personal relationship with their provider. If you're growing or unsure where you fit, start with a free consultation.",
    relatedHref: "/about-us/",
    relatedLabel: "About BBNCS",
  },
  {
    question: "How is BBNCS different from a national IT call center?",
    answer:
      "You work with a local Temecula team that learns your network and your people. The same technicians handle monitoring, backup, and support — so you're not repeating your story to a new agent every time.",
    relatedHref: "/about-us/",
    relatedLabel: "About BBNCS",
  },
];
