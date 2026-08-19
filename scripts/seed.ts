/**
 * Convex Database Seed Script
 * ============================
 * Populates the Convex database from the static data files in lumos-logic-enchant.
 *
 * Usage:
 *   cd C:\Dev\lumos-logic-admin
 *   npx tsx scripts/seed.ts
 *
 * Run ONCE on an empty database. Each table is skipped if it already has data.
 * Safe to re-run — it won't duplicate records if a table is already populated.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { employees } from "../../lumos-logic-enchant/src/data/employees";
import { servicesData } from "../../lumos-logic-enchant/src/data/services";
import { products } from "../../lumos-logic-enchant/src/data/products";
import { caseStudies } from "../../lumos-logic-enchant/src/data/caseStudies";
import { blogPosts } from "../../lumos-logic-enchant/src/data/blogPosts";
import { COMPANY_INFO, COMPANY_STATS } from "../../lumos-logic-enchant/src/data/constants";

const CONVEX_URL = "https://gallant-basilisk-803.eu-west-1.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok(msg: string) { console.log(`  ✓ ${msg}`); }
function skip(msg: string) { console.log(`  ⟳ Skipping: ${msg}`); }
function section(msg: string) { console.log(`\n▶ ${msg}`); }

// ─── Company Info ────────────────────────────────────────────────────────────

async function seedCompanyInfo() {
  section("Company Info");
  const existing = await client.query(api.companyInfo.get, {});
  if (existing) {
    skip("Company info already exists");
    return;
  }
  await client.mutation(api.companyInfo.upsert, {
    name: COMPANY_INFO.name,
    email: COMPANY_INFO.email,
    phone: COMPANY_INFO.phone,
    address: {
      street: COMPANY_INFO.address.street,
      landmark: COMPANY_INFO.address.landmark,
      city: COMPANY_INFO.address.city,
      state: COMPANY_INFO.address.state,
      pincode: COMPANY_INFO.address.pincode,
      country: COMPANY_INFO.address.country,
    },
    social: {
      instagram: COMPANY_INFO.social.instagram,
      linkedin: COMPANY_INFO.social.linkedin,
      youtube: COMPANY_INFO.social.youtube,
    },
    stats: {
      projectsCompleted: COMPANY_STATS.projectsCompleted,
      clientSatisfaction: COMPANY_STATS.clientSatisfaction,
      yearsExperience: COMPANY_STATS.yearsExperience,
      teamMembers: COMPANY_STATS.teamMembers,
      supportAvailability: COMPANY_STATS.supportAvailability,
    },
  });
  ok("Company info seeded");
}

// ─── Employees ───────────────────────────────────────────────────────────────

const employeesSortedAZ = [...employees].sort((a, b) =>
  a.name.localeCompare(b.name)
);

async function seedEmployees() {
  section("Employees — seed missing (A-Z order)");
  const existing = await client.query(api.employees.listAll, {});
  const existingEmails = new Set(existing.map((e: any) => e.email));

  let seeded = 0;
  for (let i = 0; i < employeesSortedAZ.length; i++) {
    const emp = employeesSortedAZ[i];
    if (existingEmails.has(emp.email)) {
      skip(`${emp.name} (already exists)`);
      continue;
    }
    await client.mutation(api.employees.create, {
      name: emp.name,
      role: emp.role,
      email: emp.email,
      headline: emp.headline,
      employmentType: emp.employmentType,
      linkedinUrl: emp.linkedinUrl,
      githubUrl: emp.githubUrl,
      portfolioUrl: emp.portfolioUrl,
      experience: emp.experience,
      skills: emp.skills,
      industries: emp.industries,
      bio: emp.bio,
      projects: emp.projects,
      hobbies: emp.hobbies,
      quote: emp.quote,
      funFact: emp.funFact,
      preferredContact: emp.preferredContact,
      serviceIds: emp.services,
      isActive: true,
      order: i + 1,
    });
    ok(emp.name);
    seeded++;
  }
  if (seeded === 0) skip("All employees already exist");
}

async function reorderEmployees() {
  section("Employees — fixing A-Z order for existing records");
  const existing = await client.query(api.employees.listAll, {});
  const sorted = [...existing].sort((a: any, b: any) =>
    a.name.localeCompare(b.name)
  );

  for (let i = 0; i < sorted.length; i++) {
    const emp: any = sorted[i];
    const newOrder = i + 1;
    if (emp.order === newOrder) {
      skip(`${emp.name} (order ${newOrder} already correct)`);
      continue;
    }
    await client.mutation(api.employees.update, {
      id: emp._id,
      name: emp.name,
      role: emp.role,
      email: emp.email,
      headline: emp.headline,
      employmentType: emp.employmentType,
      profileImageId: emp.profileImageId,
      linkedinUrl: emp.linkedinUrl,
      githubUrl: emp.githubUrl,
      portfolioUrl: emp.portfolioUrl,
      experience: emp.experience,
      skills: emp.skills,
      industries: emp.industries,
      bio: emp.bio,
      projects: emp.projects,
      hobbies: emp.hobbies,
      quote: emp.quote,
      funFact: emp.funFact,
      preferredContact: emp.preferredContact,
      serviceIds: emp.serviceIds,
      isActive: emp.isActive,
      order: newOrder,
    });
    ok(`${emp.name} → order ${newOrder}`);
  }
}

// ─── Services ────────────────────────────────────────────────────────────────

async function seedServices() {
  section("Services");
  const existing = await client.query(api.services.listAll, {});
  if (existing.length > 0) {
    skip(`${existing.length} services already exist`);
    return;
  }
  const serviceList = Object.values(servicesData);
  for (let i = 0; i < serviceList.length; i++) {
    const svc = serviceList[i];
    await client.mutation(api.services.create, {
      serviceId: svc.id,
      title: svc.title,
      description: svc.description,
      heroDescription: svc.heroDescription,
      features: svc.features,
      technologies: svc.technologies,
      startingPrice: svc.startingPrice,
      deliveryTime: svc.deliveryTime,
      // imageId omitted — upload images via admin panel
      imageUrl: svc.image.startsWith("http") ? svc.image : undefined,
      benefits: svc.benefits,
      process: svc.process,
      faqs: svc.faqs,
      teamMembers: svc.teamMembers,
      isActive: true,
      order: i + 1,
    });
    ok(svc.title);
  }
}

// ─── Products ────────────────────────────────────────────────────────────────

async function seedProducts() {
  section("Products");
  const existing = await client.query(api.products.listAll, {});
  if (existing.length > 0) {
    skip(`${existing.length} products already exist`);
    return;
  }
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    await client.mutation(api.products.create, {
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      longDescription: p.longDescription,
      what_it_does: p.what_it_does,
      purpose: p.purpose,
      summary: p.summary,
      functionality: p.functionality,
      screens: p.screens,
      // heroImageId omitted — upload images via admin panel
      heroImageUrl: p.heroImage,
      siteUrl: p.siteUrl,
      features: p.features,
      benefits: p.benefits,
      useCases: p.useCases,
      techStack: p.techStack,
      faq: p.faq,
      isActive: true,
      order: i + 1,
    });
    ok(p.name);
  }
}

// ─── Case Studies ─────────────────────────────────────────────────────────────

async function seedCaseStudies() {
  section("Case Studies");
  const existing = await client.query(api.caseStudies.listAll, {});
  if (existing.length > 0) {
    skip(`${existing.length} case studies already exist`);
    return;
  }
  for (let i = 0; i < caseStudies.length; i++) {
    const cs = caseStudies[i];
    await client.mutation(api.caseStudies.create, {
      caseId: cs.id,
      title: cs.title,
      client: cs.client,
      category: cs.category,
      type: cs.type,
      description: cs.description,
      fullDescription: cs.fullDescription,
      technologies: cs.technologies,
      results: cs.results,
      year: cs.year,
      duration: cs.duration,
      link: cs.link || undefined,
      featured: cs.featured,
      imageIds: [], // Upload images via the admin panel after seeding
      isActive: true,
      order: i + 1,
    });
    ok(cs.title);
  }
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

async function seedBlogPosts() {
  section("Blog Posts");
  const existing = await client.query(api.blogPosts.listAll, {});
  if (existing.length > 0) {
    skip(`${existing.length} blog posts already exist`);
    return;
  }
  for (const post of blogPosts) {
    await client.mutation(api.blogPosts.create, {
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      author: post.author,
      authorRole: post.authorRole,
      date: post.date,
      readTime: post.readTime,
      category: post.category,
      tags: post.tags,
      // imageId omitted — image field in static data is an icon name, not a URL
      featured: post.featured,
      isActive: true,
    });
    ok(post.title);
  }
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const faqData = [
  {
    question: "What services does Lumos Logic offer?",
    answer: "We offer Web Development, Mobile App Development, AI & Data Solutions, Cloud & DevOps, Cybersecurity, UI/UX Design, SEO Services, and Automation.",
    category: "General",
  },
  {
    question: "How long does it take to complete a project?",
    answer: "Project timelines vary based on complexity. Web projects typically take 4–12 weeks, mobile apps 6–16 weeks, and AI solutions 8–20 weeks. We provide a detailed timeline during initial consultation.",
    category: "General",
  },
  {
    question: "Do you provide ongoing support after project completion?",
    answer: "Yes, we offer comprehensive maintenance and support packages to keep your applications running smoothly after launch.",
    category: "Support",
  },
  {
    question: "How do I get started with Lumos Logic?",
    answer: "Simply reach out through our Contact page or email us at hello@lumoslogic.com. We'll schedule a discovery call to understand your requirements.",
    category: "General",
  },
  {
    question: "What technologies do you specialise in?",
    answer: "Our team works with React, Next.js, Node.js, Python, Flutter, Firebase, AWS, and many more modern technologies tailored to your project needs.",
    category: "Technical",
  },
  {
    question: "Can you work with our existing codebase?",
    answer: "Absolutely. We can integrate with, extend, or improve existing projects — not just build from scratch.",
    category: "Technical",
  },
  {
    question: "Do you sign NDAs?",
    answer: "Yes, we respect your confidentiality and are happy to sign a non-disclosure agreement before discussing your project.",
    category: "Legal",
  },
  {
    question: "How do you handle project communication?",
    answer: "We maintain clear communication via your preferred channels (email, Slack, or video calls) with regular updates and milestone reviews throughout the project.",
    category: "Process",
  },
];

async function seedFaq() {
  section("FAQ");
  const existing = await client.query(api.faq.listAll, {});
  if (existing.length > 0) {
    skip(`${existing.length} FAQ entries already exist`);
    return;
  }
  for (let i = 0; i < faqData.length; i++) {
    const item = faqData[i];
    await client.mutation(api.faq.create, {
      question: item.question,
      answer: item.answer,
      category: item.category,
      isActive: true,
      order: i + 1,
    });
    ok(item.question.slice(0, 60));
  }
}

// ─── Leadership ───────────────────────────────────────────────────────────────

const leadershipData = [
  {
    name: "Chandani Patel", role: "Co-Founder & COO", initials: "CP",
    experience: "7+ years", specialization: "Strategic Operations & Business Growth",
    vision: "Building sustainable systems for global scalability.",
    message: "At Lumos Logic, we don't just build software; we build the future of our clients' businesses. Our focus is on operational excellence and delivering measurable value through every line of code.",
    profileSlug: "chandani-patel", linkedinUrl: "https://www.linkedin.com/company/lumoslogic/",
  },
  {
    name: "Sagar Shah", role: "Founder & CEO", initials: "SS",
    experience: "8+ years", specialization: "Enterprise Architecture & AI Strategy",
    vision: "Empowering businesses through technical excellence.",
    message: "Technology is the greatest lever for business growth. My mission is to ensure that Lumos Logic remains at the forefront of innovation, providing our partners with the tools they need to lead their industries.",
    profileSlug: "sagar-shah", linkedinUrl: "https://www.linkedin.com/company/lumoslogic/",
  },
  {
    name: "Shivani Suthar", role: "Technical Program Manager", initials: "SH",
    experience: "6+ years", specialization: "Program Delivery & Engineering Excellence",
    vision: "Bridging the gap between complex tech and business goals.",
    message: "Excellence in delivery is about more than meeting deadlines; it's about creating solutions that are robust, scalable, and perfectly aligned with business objectives.",
    profileSlug: "shivani-suthar", linkedinUrl: "https://www.linkedin.com/company/lumoslogic/",
  },
];

async function seedLeadership() {
  section("Leadership");
  const existing = await client.query(api.leadership.listAll, {});
  if (existing.length > 0) { skip(`${existing.length} leaders already exist`); return; }
  for (let i = 0; i < leadershipData.length; i++) {
    const l = leadershipData[i];
    await client.mutation(api.leadership.create, { ...l, isActive: true, order: i + 1 });
    ok(l.name);
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

const timelineItems = [
  { year: "2019", title: "The Genesis", description: "Lumos Logic was founded with a mission to deliver high-quality IT solutions to businesses worldwide." },
  { year: "2020", title: "Global Footprint", description: "Expanded operations to serve clients across 5 countries, establishing our presence in the international market." },
  { year: "2021", title: "Innovation Hub", description: "Launched our dedicated AI & Data Solutions division, focusing on cutting-edge technology." },
  { year: "2022", title: "Scale & Growth", description: "Grew to a team of 15+ experts and moved to our new headquarters in Ahmedabad." },
  { year: "2023", title: "Excellence Recognized", description: "Achieved ISO certification and recognized as one of the fastest-growing IT firms in the region." },
  { year: "2024", title: "Future Ready", description: "Pioneering multi-agent AI development and expanding our reach into 15+ countries." },
];

async function seedTimeline() {
  section("Timeline");
  const existing = await client.query(api.timeline.listAll, {});
  if (existing.length > 0) { skip(`${existing.length} milestones already exist`); return; }
  for (let i = 0; i < timelineItems.length; i++) {
    const t = timelineItems[i];
    await client.mutation(api.timeline.create, { ...t, isActive: true, order: i + 1 });
    ok(`${t.year} — ${t.title}`);
  }
}

// ─── Company Values ───────────────────────────────────────────────────────────

const valuesData = [
  { title: "Excellence", description: "We deliver premium quality solutions that exceed expectations.", icon: "Target" },
  { title: "Innovation", description: "We leverage cutting-edge technologies to create breakthrough solutions.", icon: "Rocket" },
  { title: "Partnership", description: "We build lasting relationships based on trust and transparency.", icon: "Handshake" },
  { title: "Agility", description: "We adapt quickly to changing requirements and deliver with precision.", icon: "Zap" },
];

async function seedCompanyValues() {
  section("Company Values");
  const existing = await client.query(api.companyValues.listAll, {});
  if (existing.length > 0) { skip(`${existing.length} values already exist`); return; }
  for (let i = 0; i < valuesData.length; i++) {
    const v = valuesData[i];
    await client.mutation(api.companyValues.create, { ...v, isActive: true, order: i + 1 });
    ok(v.title);
  }
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const testimonialsData = [
  {
    name: "Rajesh Patel", role: "CEO", company: "FinTech Solutions",
    quote: "Lumos Logic transformed our digital banking platform completely. The team delivered beyond our expectations with exceptional attention to detail and technical expertise.",
    rating: 5,
  },
  {
    name: "Priya Sharma", role: "Founder", company: "E-commerce Hub",
    quote: "Working with Lumos Logic was a game-changer. Their e-commerce solution increased our sales by 180% within three months. Truly exceptional work.",
    rating: 5,
  },
];

async function seedTestimonials() {
  section("Testimonials");
  const existing = await client.query(api.testimonials.listAll, {});
  if (existing.length > 0) { skip(`${existing.length} testimonials already exist`); return; }
  for (let i = 0; i < testimonialsData.length; i++) {
    const t = testimonialsData[i];
    await client.mutation(api.testimonials.create, { ...t, isActive: true, order: i + 1 });
    ok(t.name);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     Lumos Logic — Convex Database Seeder     ║");
  console.log("╚══════════════════════════════════════════════╝");
  console.log(`\nTarget: ${CONVEX_URL}\n`);

  try {
    await seedCompanyInfo();
    await seedEmployees();
    await reorderEmployees();
    await seedServices();
    await seedProducts();
    await seedCaseStudies();
    await seedBlogPosts();
    await seedFaq();
    await seedLeadership();
    await seedTimeline();
    await seedCompanyValues();
    await seedTestimonials();

    console.log("\n✅ All done! Your Convex database is ready.\n");
    console.log("Next steps:");
    console.log("  • Upload employee profile images via the Admin → Team panel");
    console.log("  • Upload leadership photos via the Admin → Leadership panel");
    console.log("  • Upload case study images via the Admin → Case Studies panel");
    console.log("  • Upload service images via the Admin → Services panel");
  } catch (err) {
    console.error("\n❌ Seed failed:", err);
    process.exit(1);
  }
}

main();
