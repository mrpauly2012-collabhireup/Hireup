/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkerProfile, JobProfile, CompanyProfile, Match, Message, Interview } from './types';

export const INITIAL_COMPANIES: CompanyProfile[] = [
  {
    id: 'c1',
    name: 'Apex Build Group Ltd',
    logo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=100&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    description: 'Apex Build Group is an award-winning tier 1 contractor specialising in commercial developments and high-density residential towers across Greater London and the South East. We pride ourselves on site safety, top-quality finish, and supporting local certified tradesmen.',
    openVacanciesCount: 3,
    benefits: ['On-site parking provided', 'Weekly prompt payment CIS', 'All safety gear / PPE replaced', 'Long-term contract potential'],
    verified: true,
    location: 'London',
    stats: { projects: 48, workers: 140, rating: 4.8 },
    reviews: [
      { id: 'cr1', reviewer: 'Dave K. (Electrician)', role: 'Subcontractor', rating: 5, text: 'Fantastic firm to work for. Paid on time every Friday, site managers know what they are doing, clean and organised material staging areas.', date: '2026-05-12' }
    ]
  },
  {
    id: 'c2',
    name: 'Vanguard Mechanical & Plumbing',
    logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    description: 'Vanguard is a specialist mechanical, electrical, and plumbing subcontractor. We carry out high-end residential retrofits, heat pump installations, and commercial M&E contracts throughout the Midlands.',
    openVacanciesCount: 2,
    benefits: ['Company van provided for local runs', 'Advanced training on Air Source Heat Pumps', 'Paid travel time outside radius', 'CSCS card renewal support'],
    verified: true,
    location: 'Birmingham',
    stats: { projects: 32, workers: 65, rating: 4.6 },
    reviews: [
      { id: 'cr2', reviewer: 'Sarah L. (Plumber)', role: 'Lead Gas Engineer', rating: 4, text: 'Great lads on site. Good support from the commercial manager. Highly recommend for plumbers who want steady commercial sub-contracts.', date: '2026-04-18' }
    ]
  },
  {
    id: 'c3',
    name: 'Oakwood Timber & Joinery',
    logo: 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=100&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80',
    description: 'Oakwood Timber is a high-end carpentry, timber framing, and bespoke joinery contractor. We build timber frame school extensions, bespoke housing, and high-spec structural carpentry across the UK.',
    openVacanciesCount: 2,
    benefits: ['Full indoor heated workshop access', 'Festool equipment provided', 'CIS self-employed framework', 'Generous overtime multiplier'],
    verified: true,
    location: 'Manchester',
    stats: { projects: 54, workers: 45, rating: 4.9 },
    reviews: [
      { id: 'cr3', reviewer: 'Kieran M. (Carpenter)', role: 'Bench Joiner', rating: 5, text: 'Impeccable standards. They do not cut corners. Best materials, great machinery, and a highly collaborative team of master carpenters.', date: '2026-06-02' }
    ]
  }
];

export const INITIAL_JOBS: JobProfile[] = [
  {
    id: 'j1',
    companyId: 'c1',
    companyName: 'Apex Build Group Ltd',
    companyLogo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=100&auto=format&fit=crop&q=80',
    companyCover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    title: 'Lead Commercial Electrician',
    trade: 'Electrician',
    subcategory: 'Commercial Electrician',
    payRate: '£250/day',
    location: 'London (Battersea)',
    startDate: '2026-07-06',
    duration: '4 Months',
    employmentType: 'CIS Subcontractor',
    qualifications: ['CSCS Gold Card (ECS)', 'City & Guilds 18th Edition', 'AM2 Completed', 'NVQ Level 3 Electrical'],
    verified: true,
    description: 'We require a highly skilled Commercial Electrician to lead 1st and 2nd fix electrical installations on a flagship residential block in Battersea. You will be installing metal tray, conduit, trunking, sub-main wiring, and final terminations. Must be able to read and interpret schematics accurately.',
    benefits: ['Prompt CIS weekly pay via agency', 'Free secure on-site tool box storage', 'PPE supplied', 'Saturdays optional at 1.5x rate'],
    requirements: ['Minimum 5 years commercial experience', 'Own hand tools and cordless drills', 'Calibrated test equipment is a plus', 'Right to work in UK'],
    companyStats: { projects: 48, workers: 140, rating: 4.8 }
  },
  {
    id: 'j2',
    companyId: 'c2',
    companyName: 'Vanguard Mechanical & Plumbing',
    companyLogo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80',
    companyCover: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    title: 'Commercial Plumber & Pipefitter',
    trade: 'Plumber',
    subcategory: 'Plumber',
    payRate: '£240/day',
    location: 'Birmingham (City Centre)',
    startDate: '2026-07-13',
    duration: '2 Months',
    employmentType: 'CIS Contractor',
    qualifications: ['CSCS Blue Card', 'NVQ Level 2/3 Plumbing', 'Unvented G3 Ticket', 'Gas Safe is highly desirable'],
    verified: true,
    description: 'Urgent requirement for two competent commercial plumbers to fit copper crimp heating pipes, mapress lines, soil pipes, and sanitary ware on a major student accommodation refurbishment. High volume work, must work clean and fast.',
    benefits: ['CIS weekly payment', 'All mapress crimping guns provided on site', 'Free parking on local perimeter', 'Overtime shifts available'],
    requirements: ['Must have own hand tools and PPE', 'Proven experience with commercial crimp/press systems', 'Positive attitude to site health and safety'],
    companyStats: { projects: 32, workers: 65, rating: 4.6 }
  },
  {
    id: 'j3',
    companyId: 'c3',
    companyName: 'Oakwood Timber & Joinery',
    companyLogo: 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=100&auto=format&fit=crop&q=80',
    companyCover: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&auto=format&fit=crop&q=80',
    title: '1st & 2nd Fix Carpenter',
    trade: 'Carpenter & Joiner',
    subcategory: 'Carpenter / Joiner',
    payRate: '£220/day',
    location: 'Manchester (Altrincham)',
    startDate: '2026-07-02',
    duration: '6 Weeks',
    employmentType: 'Subcontractor',
    qualifications: ['CSCS Blue Card', 'City & Guilds Carpentry & Joinery', 'Asbestos Awareness'],
    verified: true,
    description: 'We are seeking an experienced 1st & 2nd Fix Carpenter for high-end residential housing refurbishments in Altrincham. Work includes cutting roof timbers, joist laying, stud walls, door hanging, skirting, and bespoke kitchen fittings. Must be proud of their craftsmanship.',
    benefits: ['Weekly pay via BACS', 'Premium materials and high-end machinery on site', 'Work with a top-rated carpentry crew'],
    requirements: ['Full set of professional 110v or cordless power tools', 'Reliable transport (Van preferred)', 'Must have 5+ years experience'],
    companyStats: { projects: 54, workers: 45, rating: 4.9 }
  },
  {
    id: 'j4',
    companyId: 'c1',
    companyName: 'Apex Build Group Ltd',
    companyLogo: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=100&auto=format&fit=crop&q=80',
    companyCover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    title: 'Bricklaying Gang (2x Brickies, 1x Hoddy)',
    trade: 'Bricklayer',
    subcategory: 'Bricklayer',
    payRate: '£650/1000 bricks',
    location: 'London (Croydon)',
    startDate: '2026-07-20',
    duration: 'Ongoing',
    employmentType: 'CIS Price Work',
    qualifications: ['CSCS Blue Card for Bricklayers', 'CSCS Green Card for Hod Carrier'],
    verified: true,
    description: 'Gang of Bricklayers and Hod Carrier required for clean facing brickwork and blockwork on a private housing estate in Croydon. High-volume, high-density brickwork. Price work based, earn what you lay! Scaffolding is managed by site.',
    benefits: ['Excellent price rates paid weekly', 'Silo mortar on site', 'Immediate start, continuous work for 12+ months'],
    requirements: ['Own mixers/profile tools and scaffold stands', 'Must have public liability insurance', 'Strictly high-quality bricklaying standard'],
    companyStats: { projects: 48, workers: 140, rating: 4.8 }
  },
  {
    id: 'j5',
    companyId: 'c2',
    companyName: 'Vanguard Mechanical & Plumbing',
    companyLogo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=80',
    companyCover: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    title: 'Domestic Heating Installer (Retrofit)',
    trade: 'Plumber',
    subcategory: 'Plumber',
    payRate: '£260/day',
    location: 'Coventry & Rugby',
    startDate: '2026-07-01',
    duration: 'Ongoing',
    employmentType: 'Contractor',
    qualifications: ['Gas Safe Registered', 'NVQ Level 3 Mechanical Services', 'Part L Energy Efficiency', 'WRAS Approved'],
    verified: true,
    description: 'Domestic heating engineer required for retrofitting modern boilers and installing Air Source Heat Pumps (ASHP) under ECO4 scheme. High-density scheduling, average 1 install every 1.5 days. Support provided from electrical team for wiring.',
    benefits: ['Fuel allowance or company card', 'Weekly CIS payouts', 'Consistent ongoing daily pipeline of projects'],
    requirements: ['Must be Gas Safe registered (Active status)', 'Own tools, analyser, and tablet for digital certificates', 'Van suitable for carrying piping/boilers'],
    companyStats: { projects: 32, workers: 65, rating: 4.6 }
  }
];

export const INITIAL_WORKERS: WorkerProfile[] = [
  {
    id: 'w1',
    name: 'Dave Knyte',
    trade: 'Electrician',
    subcategory: 'Commercial Electrician',
    experience: '12 Years',
    qualifications: ['CSCS Gold Card (ECS)', 'City & Guilds 18th Edition', 'Part P Registered', 'NVQ Level 3 Electrical Installation', 'Test & Inspection (2391)'],
    location: 'London (Wimbledon)',
    availability: 'Immediate',
    payRate: '£240/day',
    rating: 4.9,
    reviewsCount: 34,
    verified: true,
    verifiedBadges: ['Checkatrade Approved', 'CSCS Gold Verified', 'NICEIC Registered'],
    portfolio: [
      'Commercial distribution board upgrade for office block',
      'High-end LED architectural lighting track install in Chelsea penthouse',
      'New build smart home full automation wiring and containment'
    ],
    about: 'I am a highly motivated, gold-card electrician with extensive experience across domestic, commercial and industrial sectors. Clean driver with my own fully stocked transit van and calibrated tester. Always deliver neat, compliant work, tidy up after myself, and cooperate with other trades on-site to keep projects moving.',
    toolsAndTransport: ['Ford Transit Van (Ulez Compliant)', 'Fluke 1664 FC Multifunction Tester', 'Full Milwaukee Cordless Kit', 'Hole-saws, Conduit Benders, Chase cutters'],
    email: 'dave.knyte@gmail.com',
    phone: '07700 900077',
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&auto=format&fit=crop&q=80',
    workHistory: [
      { id: 'wh1', role: 'Lead Subcontract Electrician', company: 'BrightSpark Commercials', duration: 'Oct 2024 - Present', description: 'Managed first and second fix on commercial office fit-outs in Central London. Supervised two apprentices, laid massive armours, and terminated main distribution panels.' },
      { id: 'wh2', role: 'Approved Electrician', company: 'Domestic Electric Services', duration: 'Jan 2021 - Sep 2024', description: 'Carried out consumer unit upgrades, EV charger installations, rewires, and electrical condition reports (EICRs) across West London.' }
    ],
    reviews: [
      { id: 'r1', reviewer: 'Robert J. (Site Agent)', role: 'Apex Build Group', rating: 5, text: 'Dave did a fantastic job on our Chelsea development. Neat trunking, excellent attitude, and very efficient with testing. Will hire again.', date: '2026-05-10' },
      { id: 'r2', reviewer: 'Claire S.', role: 'Private Homeowner', rating: 5, text: 'Dave rewired our entire Victorian house. Clean, polite, and went the extra mile to explain the smart switches. Solid 5 stars.', date: '2026-03-14' }
    ],
    references: [
      { id: 'ref1', name: 'James O’Connor', position: 'Director, BrightSpark', contact: '07700 911044' }
    ]
  },
  {
    id: 'w2',
    name: 'Sarah Lineker',
    trade: 'Plumber',
    subcategory: 'Plumber',
    experience: '8 Years',
    qualifications: ['CSCS Blue Card', 'Gas Safe Registered', 'Unvented G3 Hot Water Systems', 'NVQ Level 3 Mechanical Engineering (Plumbing)', 'BPEC Heat Pump Certificate'],
    location: 'Birmingham (Solihull)',
    availability: 'In 1 Week',
    payRate: '£250/day',
    rating: 4.8,
    reviewsCount: 22,
    verified: true,
    verifiedBadges: ['Gas Safe Approved', 'CSCS Verified', 'CIPHE Member'],
    portfolio: [
      'Commercial copper press boiler-room headers',
      'Air Source Heat Pump installation with buffer cylinder',
      'Complete high-end luxury bathroom refurb underfloor heating loops'
    ],
    about: 'Gas Safe registered engineer specialising in commercial heating plant rooms and green energy retrofits, particularly Air Source Heat Pumps. Hardworking, punctual, and highly skilled in press-fit mapping systems and complex mechanical layout drawings. Dedicated to helping contractors deliver on time.',
    toolsAndTransport: ['Vauxhall Vivaro Van', 'Anton Sprint Pro Gas Analyser', 'Rothenberger Press Fitting Tool', 'Soldering, bending, pipe freezing kit'],
    email: 'sarah.lineker@vanguard-plumbing.com',
    phone: '07700 955088',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&auto=format&fit=crop&q=80',
    workHistory: [
      { id: 'wh3', role: 'Senior Plumbing & Heating Engineer', company: 'Midlands Mechanical Co', duration: 'Feb 2023 - Present', description: 'Lead engineer for residential boiler swaps and renewable heating installations. Configured heat pump flow calculations and ran copper press plumbing lines.' },
      { id: 'wh4', role: 'Commercial Pipefitter', company: 'UK Piping Ltd', duration: 'Jul 2018 - Jan 2023', description: 'Worked in commercial plant rooms on school and hospital expansion contracts, fitting Mapress and carbon steel pipework.' }
    ],
    reviews: [
      { id: 'r3', reviewer: 'Tony B. (Project Lead)', role: 'Midlands Mechanical', rating: 5, text: 'Sarah is an absolute professional. Clean soldering, fast with pipefitting, and Gas Safe registration is always up-to-date.', date: '2026-06-01' }
    ],
    references: [
      { id: 'ref2', name: 'Graham Vance', position: 'Hiring Manager, Midlands Mech', contact: '07700 988011' }
    ]
  },
  {
    id: 'w3',
    name: 'Marcus Brickman',
    trade: 'Bricklayer',
    subcategory: 'Bricklayer',
    experience: '15 Years',
    qualifications: ['CSCS Blue Card (Skilled Worker)', 'NVQ Level 2 Trowel Occupations', 'Working at Heights Certificate'],
    location: 'Manchester (Stockport)',
    availability: 'Immediate',
    payRate: '£220/day',
    rating: 4.7,
    reviewsCount: 41,
    verified: true,
    verifiedBadges: ['FMB Certified', 'Checkatrade Approved', 'CSCS Verified'],
    portfolio: [
      'Stunning Flemish bond decorative garden wall with brick archway',
      'Structural blockwork extension for school building',
      'Lime mortar restoration of heritage chimney stack'
    ],
    about: 'Time-served bricklayer and mason. Expert in both modern cavity walling, dense blockwork, and high-spec decorative brick bonds. I work cleanly, establish solid profiles, and can lay up to 800-1000 bricks a day depending on complexity. Reliable, with own scaffold stands and mixers.',
    toolsAndTransport: ['VW Crafter Van with tow bar', 'Belle Mortar Mixer 110v', 'Full set of Marshalltown trowels, profiles', 'Stihl Saw with diamond blades'],
    email: 'marcus.brick@yahoo.com',
    phone: '07700 900221',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
    workHistory: [
      { id: 'wh5', role: 'Contract Bricklayer', company: 'Northern Blockwork Gang', duration: 'Apr 2022 - Present', description: 'Laying blockwork and high-end brick facades for private residential estates in Cheshire. Working to strict deadlines and building inspection criteria.' },
      { id: 'wh6', role: 'Heritage Brick Mason', company: 'Stone Restoration UK', duration: 'Sep 2011 - Mar 2022', description: 'Specialist restoration, repointing, and replacement of historic masonry structures using traditional lime mortars.' }
    ],
    reviews: [
      { id: 'r4', reviewer: 'Keith W. (Build Manager)', role: 'Oakwood Build', rating: 5, text: 'Excellent speeds and very neat joints. Kept the site clean and did not waste materials. Highly recommended.', date: '2026-05-22' }
    ],
    references: [
      { id: 'ref3', name: 'Albert Trowel', position: 'Manager, Northern Gang', contact: '07700 933099' }
    ]
  },
  {
    id: 'w4',
    name: 'Kieran Miller',
    trade: 'Carpenter & Joiner',
    subcategory: 'Carpenter / Joiner',
    experience: '10 Years',
    qualifications: ['CSCS Gold Card (Supervisory)', 'City & Guilds NVQ Level 3 Carpentry & Joinery', 'Roof Framing Specialist Qualification'],
    location: 'Leeds (Headingley)',
    availability: 'In 2 Weeks',
    payRate: '£230/day',
    rating: 4.95,
    reviewsCount: 28,
    verified: true,
    verifiedBadges: ['FMB Certified', 'CSCS Gold Verified'],
    portfolio: [
      'Complex oak-timber hand-cut roof trusses',
      'Sleek modern handle-less fitted kitchen custom install',
      'Bespoke oak staircases with glass balustrades'
    ],
    about: 'High-end joiner and structural carpenter. Specialise in roof framing (1st fix) and bespoke timber joinery (2nd fix). Fully equipped with premium cordless tools and transport. I approach carpentry with absolute mathematical precision and love turning architectural plans into structural masterpieces.',
    toolsAndTransport: ['Mercedes Benz Sprinter (fully racked workshop)', 'Festool TS55 Plunge Saw', 'Dewalt Miter & Table Saw', 'First & Second Fix Nail Guns'],
    email: 'kieran.woodworks@outlook.com',
    phone: '07700 911022',
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?w=600&auto=format&fit=crop&q=80',
    workHistory: [
      { id: 'wh7', role: 'Lead Carpenter', company: 'Yorkshire Custom Carpentry', duration: 'Jan 2020 - Present', description: 'Undertook high-end structural timber framing, custom staircase manufacture, and premium fitted furniture installations across North Yorkshire.' },
      { id: 'wh8', role: 'Site Carpenter (1st Fix)', company: 'North-West Housing Group', duration: 'Mar 2016 - Dec 2019', description: 'Fast-paced site carpentry including floor joisting, roof trusses, window frames, and structural stud walls.' }
    ],
    reviews: [
      { id: 'r5', reviewer: 'Sean M. (Developer)', role: 'Yorkshire Homes', rating: 5, text: 'Kieran did custom oak trusses for our luxury barn conversion. Truly outstanding work. Impeccable jointing and clean workspace.', date: '2026-06-18' }
    ],
    references: [
      { id: 'ref4', name: 'John Timber', position: 'Director, Custom Carpentry', contact: '07700 922033' }
    ]
  },
  {
    id: 'w5',
    name: 'Tommy O’Reilly',
    trade: 'Roofer',
    subcategory: 'Roofer',
    experience: '6 Years',
    qualifications: ['CSCS Blue Card', 'IPAF Operator Ticket', 'Working at Heights Certificate', 'EPDM Rubber Roof Installer Certificate'],
    location: 'Bristol (Clifton)',
    availability: 'Immediate',
    payRate: '£210/day',
    rating: 4.65,
    reviewsCount: 18,
    verified: true,
    verifiedBadges: ['NFRC Registered', 'CSCS Verified'],
    portfolio: [
      'New natural slate tile pitched roof on barn conversion',
      'Single-ply EPDM flat garage roof installation',
      'Lead valley and flashing restoration on Edwardian terrace'
    ],
    about: 'Honest, hardworking roofer specialising in slate, concrete tiling, and high-performance flat roof EPDM applications. Fully competent in lead flashing work, gutter installations, and timber fascia replacements. Comfortable working in high-elevation sites and always respect site safety mandates.',
    toolsAndTransport: ['Ford Transit Custom with roof ladders', 'Full roof slate cutting tools and slating iron', 'Propane torches and EPDM application rollers', 'Safety harness and arrest kits'],
    email: 'tommy.roofing@gmail.com',
    phone: '07700 900551',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1605117882932-f9e32b1bfea4?w=600&auto=format&fit=crop&q=80',
    workHistory: [
      { id: 'wh9', role: 'Roofing Subcontractor', company: 'Avon Valley Roofing', duration: 'Mar 2023 - Present', description: 'Installing pitched slate roofing and leadwork repairs on residential developments across Bristol and Somerset.' },
      { id: 'wh10', role: 'Roofer Apprentice/Improver', company: 'Bristol Slating Ltd', duration: 'Sep 2020 - Feb 2023', description: 'Gained hands-on experience in tiling, slate sorting, felt-and-batten lining, and flat roof EPDM installations.' }
    ],
    reviews: [
      { id: 'r6', reviewer: 'Gary L. (Site Supervisor)', role: 'Avon Build', rating: 5, text: 'Tommy sorted our leaking valley in under 2 hours. Fast, transparent on price, and excellent slate matching. Solid lad.', date: '2026-04-30' }
    ],
    references: [
      { id: 'ref5', name: 'Luke Avon', position: 'Owner, Avon Roofing', contact: '07700 911088' }
    ]
  },
  {
    id: 'w6',
    name: 'Steve "Gaffer" Miller',
    trade: 'Builder',
    subcategory: 'Builder',
    experience: '18 Years',
    qualifications: ['CSCS Black Card (Manager)', 'SMSTS Certified', 'First Aid at Work (L3)', 'Temporary Works Coordinator', 'NEBOSH Construction Certificate'],
    location: 'Sheffield (Sutton)',
    availability: 'Immediate',
    payRate: '£350/day',
    rating: 4.9,
    reviewsCount: 15,
    verified: true,
    verifiedBadges: ['CIOB Professional', 'CSCS Black Verified'],
    portfolio: [
      'Delivered £4.5M retail park development ahead of schedule',
      'Managed residential block construction in Sheffield center with 80+ active trades',
      'Maintained perfect 5-star NHBC Health & Safety rating'
    ],
    about: 'Highly focused Construction Site Manager with over 18 years of on-site leadership. Expert at coordinating subcontractors, monitoring RAMS, and managing material pipelines to hit milestones without sacrificing safety or quality. CIOB member who believes in strict site discipline, positive motivation, and weekly clear communication.',
    toolsAndTransport: ['BMW 3 Series Touring (Clean license)', 'Site Manager kit (Laptop, Printer, Calibrated Laser Measure)', 'Full PPE (White hat, safety boots, hi-vis vest)'],
    email: 'gaffer.steve@millerbuild.co.uk',
    phone: '07700 955033',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    workHistory: [
      { id: 'wh11', role: 'Senior Site Manager', company: 'Sheffield Homes Ltd', duration: 'May 2021 - Present', description: 'Managed multiple multi-unit residential sites. Controlled program, site safety audits, material schedules, and local authority inspections.' },
      { id: 'wh12', role: 'Site Manager', company: 'Midlands Infrastructure Group', duration: 'Feb 2015 - Apr 2021', description: 'Coordinated commercial steel-frame developments. Managed groundworks, cladding contractors, and M&E first fits.' }
    ],
    reviews: [
      { id: 'r7', reviewer: 'Geoff A. (Director)', role: 'Sheffield Homes', rating: 5, text: 'Steve runs an incredibly tight, clean, safe site. Subcontractors love working under him because he organizes schedules properly. Excellent gaffer.', date: '2026-05-18' }
    ],
    references: [
      { id: 'ref6', name: 'Richard Steel', position: 'Contracts Director, Midlands Infra', contact: '07700 999022' }
    ]
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    workerId: 'w1', // Dave Knyte
    jobId: 'j1', // Lead Commercial Electrician (Apex)
    matchedAt: '2026-06-23T14:32:00Z',
    lastMessageText: 'Alright Robert, I have standard 110v testers, calibrated last month. Can start Monday.',
    lastMessageTime: '2026-06-24T10:15:00Z'
  },
  {
    id: 'm2',
    workerId: 'w2', // Sarah Lineker
    jobId: 'j2', // Commercial Plumber (Vanguard)
    matchedAt: '2026-06-24T09:12:00Z',
    lastMessageText: 'Great, let’s schedule a brief call or a site meet for the student refit.',
    lastMessageTime: '2026-06-24T16:45:00Z'
  },
  {
    id: 'm3',
    workerId: 'w3', // Marcus Brickman
    jobId: 'j4', // Bricklaying Gang (Apex)
    matchedAt: '2026-06-25T04:30:00Z',
    lastMessageText: 'Hi Marcus, your portfolio looks spot-on. What size scaffold do you need?',
    lastMessageTime: '2026-06-25T05:00:00Z'
  }
];

export const INITIAL_MESSAGES: Message[] = [
  // Match 1: Dave & Robert (Apex)
  { id: 'msg1', matchId: 'm1', sender: 'employer', text: 'Hi Dave, your profile looks great. We need someone who has experience in big commercial trunking. Have you worked with 450mm tray systems?', timestamp: '2026-06-23T15:00:00Z', isRead: true },
  { id: 'msg2', matchId: 'm1', sender: 'worker', text: 'Yes, Robert. Laid miles of heavy duty tray on the Canary Wharf retail project. Own full cordless cutters and safety harness.', timestamp: '2026-06-23T15:15:00Z', isRead: true },
  { id: 'msg3', matchId: 'm1', sender: 'employer', text: 'Perfect. We pay CIS weekly. Do you have your calibrated test meter for when we sign off?', timestamp: '2026-06-24T09:30:00Z', isRead: true },
  { id: 'msg4', matchId: 'm1', sender: 'worker', text: 'Alright Robert, I have standard 110v testers, calibrated last month. Can start Monday.', timestamp: '2026-06-24T10:15:00Z', isRead: true },

  // Match 2: Sarah & Vanguard
  { id: 'msg5', matchId: 'm2', sender: 'employer', text: 'Hello Sarah, welcome to Vanguard. Your experience with commercial plant rooms is very relevant. We are installing heavy copper mapress. Have you worked with the Rothenberger press?', timestamp: '2026-06-24T11:00:00Z', isRead: true },
  { id: 'msg6', matchId: 'm2', sender: 'worker', text: 'Hi, yes, used both Rothenberger and Geberit press tools daily. Unvented hot water cert is valid. Do you provide the press jaws on site or should I bring mine?', timestamp: '2026-06-24T12:20:00Z', isRead: true },
  { id: 'msg7', matchId: 'm2', sender: 'employer', text: 'Great, let’s schedule a brief call or a site meet for the student refit.', timestamp: '2026-06-24T16:45:00Z', isRead: true },

  // Match 3: Marcus & Apex
  { id: 'msg8', matchId: 'm3', sender: 'worker', text: 'Hi, saw your listing for the Croydon brick gang. I have a partner (skilled brickie) and an excellent hod carrier available. We are currently finishing a job in Altrincham, ready to travel.', timestamp: '2026-06-25T04:45:00Z', isRead: true },
  { id: 'msg9', matchId: 'm3', sender: 'employer', text: 'Hi Marcus, your portfolio looks spot-on. What size scaffold do you need?', timestamp: '2026-06-25T05:00:00Z', isRead: true }
];

export const INITIAL_INTERVIEWS: Interview[] = [
  {
    id: 'int1',
    workerId: 'w1',
    jobId: 'j1',
    date: '2026-06-29',
    time: '09:30',
    location: 'Battersea Site Office, London, SW11 5AL',
    status: 'confirmed',
    ppeRequired: ['Hard Hat', 'Steel Toe Boots', 'Hi-Vis Vest', 'Safety Glasses'],
    notes: 'Site induction is at 09:30 sharp. Ask at main gate for Robert (Project Manager). Bring your CSCS card and calibrated meter certificate.'
  },
  {
    id: 'int2',
    workerId: 'w2',
    jobId: 'j2',
    date: '2026-06-30',
    time: '14:00',
    location: 'Vanguard HQ, 44 Colmore Row, Birmingham, B3 2WY',
    status: 'pending',
    ppeRequired: ['None (Office interview)'],
    notes: 'Bring Gas Safe card, unvented G3 ticket, and passport for right to work check.'
  }
];
