export const defaultSettings = {
  home: {
    heroHeadline: "Innovation Beyond Imagination.",
    heroDescription:
      "We explore ideas, develop intelligent technologies and build digital solutions designed to solve real-world problems.",
    tagline: "Moving Towards the Future",
    heroImage: "",
    aboutImage: "",
    sections: { about: true, build: true, ideas: true, projects: true, flagship: true, team: true, updates: true, contact: true },
    whatWeBuild: [
      { title: "Intelligent monitoring", description: "AI-assisted systems that watch homes and electrical devices and flag abnormal behaviour." },
      { title: "Civic technology", description: "Platforms that help citizens report problems and help local authorities act on them." },
      { title: "Intelligent automation", description: "Software that removes repetitive work and supports better decisions." },
      { title: "Prototypes and experiments", description: "Early working models that let us test ideas against real problems." }
    ]
  },
  about: {
    intro:
      "IMAGIX+ is an innovation-focused technology and startup brand. We explore ideas, build prototypes and develop intelligent software and products aimed at real-world problems.",
    story:
      "IMAGIX+ was started by four founders who share a belief: meaningful technology begins with a real problem and a willingness to build. Our work so far spans an AI-powered house monitoring prototype, a non-intrusive electrical device monitoring prototype and CivicMind AI, our flagship platform for civic complaint management, which is being fine-tuned and prepared for deployment.\n\nWe are an early-stage team, and we say so. Every project on this site is labelled with its actual development status.",
    vision: "To become a trusted technology brand that turns future-focused ideas into useful, intelligent products.",
    mission: "To research, design and build meaningful technology solutions, grounded in artificial intelligence and thoughtful product development, and to improve them through testing and honest feedback.",
    whatWeDevelop: ["AI-powered civic complaint management (CivicMind AI)", "AI-powered house monitoring", "Non-intrusive electrical device monitoring", "Prototypes and experimental concepts"],
    technicalInterests: ["Artificial Intelligence", "Machine Learning", "Smart monitoring systems", "Intelligent automation", "Software development", "Civic technology", "Emerging technologies"],
    approach:
      "We start with a real problem, build a working prototype, test it and refine it before calling it ready. We keep proposed ideas separate from built products, and we are open about the stage each project has reached.",
    futureDirection:
      "Moving Towards the Future means continuing to develop CivicMind AI toward real-world pilots, maturing our monitoring prototypes, growing the team, and exploring new technologies and product concepts.",
    companyInfo: "IMAGIX+ (ImagixPlus) is the parent brand of CivicMind AI.",
    image: ""
  },
  contact: { email: "contact@civicmindai.in", phone: "", location: "", note: "", socials: [] as { label: string; url: string }[] },
  site: {
    siteName: "IMAGIX+",
    seoTitle: "IMAGIX+ | Moving Towards the Future",
    seoDescription:
      "IMAGIX+ (ImagixPlus) is a technology and innovation company building intelligent solutions, including the CivicMind AI civic complaint platform.",
    logoUrl: "",
    faviconUrl: "",
    socialImageUrl: "",
    defaultTheme: "dark" as "dark" | "light" | "system"
  }
};
