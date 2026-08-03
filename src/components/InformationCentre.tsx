/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Cookie,
  FileText,
  Handshake,
  HelpCircle,
  Info,
  LifeBuoy,
  Lock,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

type InformationPage =
  | 'centre'
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'acceptable-use'
  | 'community'
  | 'about'
  | 'faq'
  | 'contact'
  | 'help';

interface InformationCentreProps {
  onBack?: () => void;
}

interface InformationCard {
  id: InformationPage;
  title: string;
  description: string;
  category: 'Legal' | 'Company' | 'Support';
  icon: React.ReactNode;
}

const LAST_UPDATED = '3 August 2026';

// Replace these before public launch with your real legal entity and contact details.
const LEGAL_ENTITY_NAME = 'HireUp';
const LEGAL_CONTACT_EMAIL = 'REPLACE-WITH-YOUR-EMAIL';
const LEGAL_ADDRESS = 'REPLACE-WITH-YOUR-BUSINESS-ADDRESS';

const cards: InformationCard[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'How HireUp collects, uses, stores and protects personal information.',
    category: 'Legal',
    icon: <Lock className="w-5 h-5" />,
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    description: 'The rules that apply when workers and contractors use HireUp.',
    category: 'Legal',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    description: 'What cookies and similar technologies are used and why.',
    category: 'Legal',
    icon: <Cookie className="w-5 h-5" />,
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use Policy',
    description: 'Activities and content that are not permitted on the platform.',
    category: 'Legal',
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    description: 'Plain-English standards for a safe and professional community.',
    category: 'Legal',
    icon: <Handshake className="w-5 h-5" />,
  },
  {
    id: 'about',
    title: 'About HireUp',
    description: 'Our mission to connect Sussex tradespeople with local contractors.',
    category: 'Company',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: 'faq',
    title: 'Frequently Asked Questions',
    description: 'Answers about accounts, matching, verification and hiring.',
    category: 'Support',
    icon: <CircleHelp className="w-5 h-5" />,
  },
  {
    id: 'contact',
    title: 'Contact Us',
    description: 'How to contact HireUp about support, privacy or platform concerns.',
    category: 'Support',
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: 'help',
    title: 'Help Centre',
    description: 'Practical guidance for using the main HireUp features.',
    category: 'Support',
    icon: <LifeBuoy className="w-5 h-5" />,
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-black text-zinc-950">{title}</h3>
      <div className="text-sm text-zinc-800 leading-7 space-y-3">{children}</div>
    </section>
  );
}

function BulletList({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2">{children}</ul>;
}

function DocumentLayout({
  title,
  subtitle,
  icon,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6 animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-950 text-xs font-mono font-black uppercase hover:bg-zinc-50"
      >
        <ArrowLeft className="w-4 h-4" />
        Information Centre
      </button>

      <header className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#10B981] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#10B981]">
              HireUp Information Centre
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-zinc-950 mt-2">{title}</h1>
            <p className="text-sm text-zinc-700 mt-2 max-w-3xl">{subtitle}</p>
            <p className="text-[10px] font-mono font-bold uppercase text-zinc-500 mt-4">
              Last updated: {LAST_UPDATED}
            </p>
          </div>
        </div>
      </header>

      <article className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        {children}
      </article>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-zinc-900">
        <strong>Launch reminder:</strong> replace the legal entity name, email address and business address in this file before public launch, and obtain professional legal review for your exact business model.
      </div>
    </div>
  );
}

function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="Privacy Policy"
      subtitle="This policy explains how HireUp handles personal information belonging to workers, contractors and other platform users."
      icon={<Lock className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="1. Who we are">
        <p>{LEGAL_ENTITY_NAME} operates a UK trades recruitment platform connecting workers and contractors.</p>
        <p>Data protection contact: {LEGAL_CONTACT_EMAIL}</p>
        <p>Business address: {LEGAL_ADDRESS}</p>
      </Section>

      <Section title="2. Information we collect">
        <BulletList>
          <li>Account details, including name, email address, phone number, date of birth and account type.</li>
          <li>Worker details, including trade, skills, work history, qualifications, licences, availability, rates, travel preferences, portfolio images and references.</li>
          <li>Contractor details, including company information, contact details, vacancies, insurance, verification records and hiring activity.</li>
          <li>Identity and verification documents, including qualification evidence, CSCS or trade cards, company records and insurance documents.</li>
          <li>Platform activity, including saved items, matches, applications, messages, interviews, reviews, reports and notification preferences.</li>
          <li>Technical information, including session identifiers, browser information, device information, security logs and approximate location derived from account selections.</li>
        </BulletList>
      </Section>

      <Section title="3. How we use information">
        <BulletList>
          <li>Create, operate and secure user accounts.</li>
          <li>Display worker profiles, contractor profiles and job adverts to relevant users.</li>
          <li>Calculate compatibility scores and provide job or candidate recommendations.</li>
          <li>Support matching, messaging, interview scheduling, reviews and verification.</li>
          <li>Prevent fraud, investigate reports, enforce platform rules and protect users.</li>
          <li>Provide service communications and, where permitted, optional marketing communications.</li>
          <li>Understand platform performance and improve the service.</li>
        </BulletList>
      </Section>

      <Section title="4. Legal bases">
        <p>Depending on the activity, we process information because it is necessary to perform our contract with you, because we have a legitimate interest in operating and securing HireUp, because we must comply with law, or because you have given consent.</p>
        <p>Where consent is used, you may withdraw it at any time. Withdrawal does not affect processing already carried out lawfully.</p>
      </Section>

      <Section title="5. AI matching and profiling">
        <p>HireUp may use profile and vacancy information to calculate match scores, profile-strength scores and recommendations. These tools are intended to support discovery and do not make the final hiring decision.</p>
        <p>Contractors remain responsible for reviewing candidates and making hiring decisions. Users may correct inaccurate profile information and contact HireUp to question or challenge how a score was produced.</p>
      </Section>

      <Section title="6. Sharing information">
        <BulletList>
          <li>With workers and contractors where necessary to provide profiles, jobs, matching and communication features.</li>
          <li>With service providers supporting hosting, authentication, database storage, file storage, email, analytics, security and support.</li>
          <li>With professional advisers, regulators, law enforcement or courts where legally required or reasonably necessary.</li>
          <li>With a buyer or successor if the business or platform is sold, reorganised or transferred.</li>
        </BulletList>
        <p>HireUp does not sell personal information.</p>
      </Section>

      <Section title="7. Storage and international transfers">
        <p>HireUp currently uses Supabase for authentication, database services and file storage, and Netlify for website hosting and deployment. Information may be processed in countries outside the UK where service providers operate.</p>
        <p>Where required, appropriate safeguards will be used for international transfers.</p>
      </Section>

      <Section title="8. Retention">
        <p>Information is kept only for as long as reasonably necessary for the purposes described in this policy, including account operation, dispute handling, fraud prevention and legal obligations. Retention periods may differ depending on the information and reason for processing.</p>
      </Section>

      <Section title="9. Your rights">
        <p>Subject to applicable law, you may have rights to access, correct, erase, restrict or transfer your personal information, object to certain processing and complain to the Information Commissioner’s Office.</p>
        <p>You may also object to direct marketing and ask for an explanation or human review where automated processing has a significant effect.</p>
      </Section>

      <Section title="10. Security">
        <p>HireUp uses technical and organisational measures intended to protect information, including authentication, access controls, database security rules and secure file storage. No online service can guarantee absolute security.</p>
      </Section>

      <Section title="11. Changes">
        <p>We may update this policy as the platform, law or service providers change. The latest version and update date will be shown in the Information Centre.</p>
      </Section>
    </DocumentLayout>
  );
}

function TermsConditions({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="Terms & Conditions"
      subtitle="These terms govern access to and use of the HireUp platform."
      icon={<FileText className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="1. Agreement">
        <p>By creating an account or using HireUp, you agree to these terms and the other policies available in the Information Centre. Do not use the platform if you do not agree.</p>
      </Section>
      <Section title="2. Eligibility">
        <p>You must be at least 18 years old and legally capable of entering into a contract. You must provide accurate information and use only an account you are authorised to control.</p>
      </Section>
      <Section title="3. What HireUp provides">
        <p>HireUp provides technology that helps workers and contractors discover one another, advertise vacancies, match, communicate, schedule interviews and exchange professional information.</p>
        <p>HireUp is not the employer, worker, agency, payroll provider, tax adviser, site controller or party to any employment or subcontracting agreement formed between users unless expressly stated otherwise.</p>
      </Section>
      <Section title="4. Worker responsibilities">
        <BulletList>
          <li>Keep profile, availability, qualifications, licences and experience accurate and current.</li>
          <li>Do not claim skills, certification, identity or work history you do not possess.</li>
          <li>Check job details, site requirements, pay arrangements and contractual terms before accepting work.</li>
          <li>Comply with site safety requirements, law and any agreement made with a contractor.</li>
        </BulletList>
      </Section>
      <Section title="5. Contractor responsibilities">
        <BulletList>
          <li>Post genuine, lawful and accurate vacancies.</li>
          <li>State material details such as location, pay, duration, start date, required qualifications and employment status.</li>
          <li>Carry out appropriate right-to-work, qualification, reference, insurance and suitability checks.</li>
          <li>Comply with employment, agency, equality, health and safety, tax and payment obligations.</li>
          <li>Do not discriminate unlawfully or request prohibited information.</li>
        </BulletList>
      </Section>
      <Section title="6. Verification">
        <p>Verification badges show that certain information or documents have been reviewed under HireUp’s current process. Verification is not a guarantee of identity, competence, safety, solvency, legal compliance or future conduct.</p>
      </Section>
      <Section title="7. AI scores and recommendations">
        <p>Match scores, recommendations and profile scores are estimates based on available information. They are not guarantees of employment, suitability, performance or hiring success and should not replace human judgement or proper checks.</p>
      </Section>
      <Section title="8. User content">
        <p>You retain ownership of content you upload. You grant HireUp a non-exclusive licence to host, copy, display, process and distribute that content as necessary to operate, secure and promote the platform.</p>
        <p>You must have the right to upload all content and must not infringe privacy, confidentiality, intellectual property or other rights.</p>
      </Section>
      <Section title="9. Fees and subscriptions">
        <p>Any paid features, subscriptions, promoted vacancies or premium services will be presented with their price and material terms before purchase. Additional subscription and cancellation terms may apply when paid services launch.</p>
      </Section>
      <Section title="10. Suspension and termination">
        <p>HireUp may restrict, suspend or remove accounts or content where reasonably necessary to investigate suspected fraud, protect users, enforce policies, comply with law or prevent platform harm.</p>
      </Section>
      <Section title="11. Disclaimers and liability">
        <p>HireUp does not guarantee continuous availability, a minimum number of opportunities, a successful match, the accuracy of user-provided content or the performance of another user.</p>
        <p>Nothing in these terms excludes liability that cannot legally be excluded, including liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence where applicable.</p>
      </Section>
      <Section title="12. Governing law">
        <p>These terms are governed by the laws of England and Wales. Courts with lawful jurisdiction may hear disputes, subject to any mandatory consumer rights.</p>
      </Section>
      <Section title="13. Contact">
        <p>Questions about these terms may be sent to {LEGAL_CONTACT_EMAIL}.</p>
      </Section>
    </DocumentLayout>
  );
}

function CookiePolicy({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="Cookie Policy"
      subtitle="This policy explains how HireUp uses cookies, local storage and similar browser technologies."
      icon={<Cookie className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="1. What these technologies are">
        <p>Cookies are small files stored on a device. Similar technologies, including browser local storage and authentication tokens, can remember information or support website functions.</p>
      </Section>
      <Section title="2. Essential technologies">
        <p>HireUp may use essential technologies for login sessions, account security, fraud prevention, navigation, saved preferences and core platform operation. These are necessary to provide features requested by the user.</p>
      </Section>
      <Section title="3. Preference technologies">
        <p>Preference storage may remember settings such as notification choices, theme, date format, location preferences and interface choices.</p>
      </Section>
      <Section title="4. Analytics and optional technologies">
        <p>If HireUp introduces analytics, advertising or other non-essential technologies, users will be provided with clear information and an appropriate choice before those technologies are activated where consent is legally required.</p>
      </Section>
      <Section title="5. Managing cookies">
        <p>You can control cookies through browser settings. Blocking essential technologies may prevent login or other platform features from working correctly.</p>
      </Section>
      <Section title="6. Current platform position">
        <p>The current HireUp application primarily relies on authentication and preference storage needed to operate the service. This policy must be updated whenever new analytics, advertising or third-party tracking tools are introduced.</p>
      </Section>
    </DocumentLayout>
  );
}

function AcceptableUse({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="Acceptable Use Policy"
      subtitle="This policy sets out prohibited conduct and content on HireUp."
      icon={<ShieldCheck className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="You must not">
        <BulletList>
          <li>Create a fake identity, impersonate another person or misrepresent a business.</li>
          <li>Post fake, misleading, discriminatory, unlawful or non-existent jobs.</li>
          <li>Misrepresent qualifications, licences, insurance, experience, references or verification documents.</li>
          <li>Harass, threaten, intimidate, exploit or discriminate against another user.</li>
          <li>Send spam, unsolicited promotions, scams, phishing messages or malicious links.</li>
          <li>Upload illegal, harmful, sexually explicit, hateful, defamatory or infringing material.</li>
          <li>Request payment, deposits or sensitive information through deceptive means.</li>
          <li>Scrape, copy, harvest or commercially exploit platform data without permission.</li>
          <li>Probe, attack, bypass or interfere with security, authentication, rate limits or technical systems.</li>
          <li>Use automated tools to create accounts, manipulate matches, send mass messages or distort platform activity.</li>
          <li>Use HireUp in connection with unlawful employment, tax evasion, trafficking, forced labour or unsafe work.</li>
        </BulletList>
      </Section>
      <Section title="Enforcement">
        <p>HireUp may remove content, restrict functionality, preserve evidence, suspend or close accounts, and report matters to relevant authorities where appropriate.</p>
      </Section>
      <Section title="Reporting concerns">
        <p>Users should report suspicious jobs, accounts, messages, documents or reviews through available reporting tools or by contacting {LEGAL_CONTACT_EMAIL}.</p>
      </Section>
    </DocumentLayout>
  );
}

function CommunityGuidelines({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="Community Guidelines"
      subtitle="These plain-English standards help keep HireUp professional, useful and safe."
      icon={<Handshake className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="Be honest">
        <p>Use your real identity or authorised business identity. Keep qualifications, rates, vacancies, experience and availability accurate.</p>
      </Section>
      <Section title="Be professional">
        <p>Communicate clearly, attend agreed interviews, respond to messages when reasonably possible and give fair notice when plans change.</p>
      </Section>
      <Section title="Be respectful">
        <p>Do not bully, threaten, harass or discriminate. Disagreements must remain civil and focused on the work or hiring process.</p>
      </Section>
      <Section title="Protect safety">
        <p>Do not pressure anyone to carry out work they are not qualified, equipped or legally permitted to perform. Contractors must communicate relevant site and PPE requirements.</p>
      </Section>
      <Section title="Pay and advertise fairly">
        <p>Contractors should state pay and key conditions accurately. Workers should discuss and understand payment, tax status and contractual arrangements before starting.</p>
      </Section>
      <Section title="Use reviews responsibly">
        <p>Reviews should reflect genuine platform interactions, remain factual and avoid personal attacks, confidential information or retaliation.</p>
      </Section>
      <Section title="Look out for one another">
        <p>Report scams, unsafe opportunities, fake credentials and abusive behaviour. Do not attempt to investigate dangerous situations yourself.</p>
      </Section>
    </DocumentLayout>
  );
}

function AboutHireUp({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="About HireUp"
      subtitle="A local-first recruitment platform built for tradespeople and contractors."
      icon={<Building2 className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="Our mission">
        <p>HireUp aims to make construction recruitment faster, clearer and more local by helping verified workers and contractors discover relevant opportunities across East Sussex and West Sussex.</p>
      </Section>
      <Section title="How it works">
        <BulletList>
          <li>Workers create detailed trade profiles and discover suitable vacancies.</li>
          <li>Contractors advertise jobs and search for workers with relevant experience and credentials.</li>
          <li>AI-assisted scoring highlights possible compatibility but leaves decisions to people.</li>
          <li>Matches unlock communication and interview scheduling.</li>
          <li>Verification and reviews help users make more informed decisions.</li>
        </BulletList>
      </Section>
      <Section title="Local focus">
        <p>HireUp is currently focused on East Sussex and West Sussex. This allows location choices, travel distances and recommendations to remain relevant to the communities the platform serves.</p>
      </Section>
    </DocumentLayout>
  );
}

function FAQ({ onBack }: { onBack: () => void }) {
  const questions = [
    ['Is HireUp an employment agency?', 'HireUp currently provides a technology platform connecting workers and contractors. Unless expressly stated, it is not the employer or contracting party.'],
    ['How are match scores calculated?', 'Scores compare information such as trade, skills, qualifications, experience, location, availability, pay and profile completeness. They are recommendations, not hiring decisions.'],
    ['Does verification guarantee a user?', 'No. Verification indicates that selected information or documents have been reviewed under the current process. Users must still perform appropriate checks.'],
    ['Who can use HireUp?', 'Accounts are intended for users aged 18 or over who are legally able to work, hire or act for the relevant business.'],
    ['Where is HireUp available?', 'The current location system focuses on East Sussex and West Sussex.'],
    ['How do I update my details?', 'Open Settings or My Profile, edit the relevant information and save your changes.'],
    ['How do I report a problem?', 'Use available reporting options or open Contact Us in the Information Centre.'],
    ['Can HireUp guarantee work or candidates?', 'No. Availability, suitability and hiring outcomes depend on users, vacancies and market conditions.'],
  ];

  return (
    <DocumentLayout
      title="Frequently Asked Questions"
      subtitle="Common questions about accounts, matching, verification and using HireUp."
      icon={<CircleHelp className="w-6 h-6" />}
      onBack={onBack}
    >
      <div className="space-y-3">
        {questions.map(([question, answer]) => (
          <div key={question} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="font-black text-zinc-950">{question}</h3>
            <p className="text-sm text-zinc-800 leading-6 mt-2">{answer}</p>
          </div>
        ))}
      </div>
    </DocumentLayout>
  );
}

function ContactUs({ onBack }: { onBack: () => void }) {
  return (
    <DocumentLayout
      title="Contact Us"
      subtitle="Contact the appropriate HireUp team for support, privacy or safety concerns."
      icon={<Mail className="w-6 h-6" />}
      onBack={onBack}
    >
      <Section title="General and account support">
        <p>Email: {LEGAL_CONTACT_EMAIL}</p>
        <p>Include the email address connected to your account and a clear description of the problem. Do not send passwords.</p>
      </Section>
      <Section title="Privacy requests">
        <p>Use the subject line “Privacy Request” and explain whether you want access, correction, deletion, restriction, transfer or information about automated processing.</p>
      </Section>
      <Section title="Safety and abuse reports">
        <p>For suspected fraud, harassment, fake jobs, unsafe work or misuse, include relevant account names, job details, dates and screenshots where safe and lawful to do so.</p>
      </Section>
      <Section title="Emergency situations">
        <p>HireUp is not an emergency service. Contact the appropriate emergency service if anyone is in immediate danger.</p>
      </Section>
    </DocumentLayout>
  );
}

function HelpCentre({ onBack }: { onBack: () => void }) {
  const guides = [
    ['Complete your profile', 'Add accurate trade, experience, qualifications, rates, availability and verification information.'],
    ['Find jobs or workers', 'Use swipe discovery, search filters and location tools to find relevant profiles or vacancies.'],
    ['Create a match', 'Shortlist or express interest. Communication becomes available when the platform creates a match.'],
    ['Use messaging', 'Keep work discussions professional and avoid sending passwords or unnecessary sensitive information.'],
    ['Schedule interviews', 'Use the Interviews area to propose, confirm, decline or complete a walkthrough or interview.'],
    ['Manage settings', 'Update account information, location, notification choices, privacy preferences and verification files.'],
    ['Report content', 'Use report options for suspicious reviews, jobs, accounts or communications.'],
  ];

  return (
    <DocumentLayout
      title="Help Centre"
      subtitle="Practical guidance for completing common tasks on HireUp."
      icon={<LifeBuoy className="w-6 h-6" />}
      onBack={onBack}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guides.map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-zinc-200 p-5">
            <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            <h3 className="font-black text-zinc-950 mt-3">{title}</h3>
            <p className="text-sm text-zinc-800 leading-6 mt-2">{description}</p>
          </div>
        ))}
      </div>
    </DocumentLayout>
  );
}

export default function InformationCentre({ onBack }: InformationCentreProps) {
  const [page, setPage] = useState<InformationPage>('centre');

  const groupedCards = useMemo(
    () => ({
      Legal: cards.filter(card => card.category === 'Legal'),
      Company: cards.filter(card => card.category === 'Company'),
      Support: cards.filter(card => card.category === 'Support'),
    }),
    []
  );

  if (page === 'privacy') return <PrivacyPolicy onBack={() => setPage('centre')} />;
  if (page === 'terms') return <TermsConditions onBack={() => setPage('centre')} />;
  if (page === 'cookies') return <CookiePolicy onBack={() => setPage('centre')} />;
  if (page === 'acceptable-use') return <AcceptableUse onBack={() => setPage('centre')} />;
  if (page === 'community') return <CommunityGuidelines onBack={() => setPage('centre')} />;
  if (page === 'about') return <AboutHireUp onBack={() => setPage('centre')} />;
  if (page === 'faq') return <FAQ onBack={() => setPage('centre')} />;
  if (page === 'contact') return <ContactUs onBack={() => setPage('centre')} />;
  if (page === 'help') return <HelpCentre onBack={() => setPage('centre')} />;

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-8 animate-fade-in">
      <header className="relative overflow-hidden bg-zinc-950 rounded-3xl p-6 md:p-10 text-white">
        <div className="absolute right-0 top-0 w-72 h-72 bg-[#34D399]/10 rounded-full blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#34D399]" />
            <p className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-[#34D399]">
              Trust, support and company information
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-black mt-4">HireUp Information Centre</h1>
          <p className="text-sm md:text-base text-zinc-300 leading-7 mt-3">
            Everything workers and contractors need to understand the platform, their rights and the standards expected on HireUp.
          </p>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-mono font-black uppercase"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to dashboard
            </button>
          )}
        </div>
      </header>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-black text-zinc-950">Legal documents are in launch-draft status</p>
          <p className="text-xs text-zinc-800 mt-1 leading-5">
            The content is tailored to the current HireUp platform, but your final business name, address and contact email still need to be inserted and the documents should receive professional legal review before public launch.
          </p>
        </div>
      </div>

      {(Object.keys(groupedCards) as Array<keyof typeof groupedCards>).map(category => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            {category === 'Legal' ? (
              <Scale className="w-5 h-5 text-[#10B981]" />
            ) : category === 'Company' ? (
              <Building2 className="w-5 h-5 text-[#10B981]" />
            ) : (
              <HelpCircle className="w-5 h-5 text-[#10B981]" />
            )}
            <h2 className="text-lg font-black text-zinc-950">{category}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedCards[category].map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => setPage(card.id)}
                className="group text-left bg-white border border-zinc-200 rounded-2xl p-5 hover:border-[#34D399] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-[#10B981] flex items-center justify-center">
                    {card.icon}
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[#10B981]" />
                </div>
                <h3 className="font-black text-zinc-950 mt-4">{card.title}</h3>
                <p className="text-xs text-zinc-700 leading-5 mt-2">{card.description}</p>
              </button>
            ))}
          </div>
        </section>
      ))}

      <footer className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-black text-zinc-950">HireUp</p>
          <p className="text-xs text-zinc-600 mt-1">Trades recruitment for East Sussex and West Sussex.</p>
        </div>
        <p className="text-[10px] font-mono font-bold uppercase text-zinc-500">
          © 2026 HireUp. All rights reserved.
        </p>
      </footer>
    </div>
  );
}