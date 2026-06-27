-- Seed data for private_items table
-- This creates sample data for testing purposes
-- Insert test private_items with hardcoded UUIDs simulating different users
INSERT INTO public.private_items (id, name, description, created_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Project Alpha',
    'A comprehensive project management tool for agile teams',
    NOW() - INTERVAL '5 days'
  ),
  (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Marketing Campaign Q4',
    'Strategic marketing initiatives for the fourth quarter',
    NOW() - INTERVAL '3 days'
  ),
  (
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Product Launch Checklist',
    'Complete checklist for new product launch procedures',
    NOW() - INTERVAL '1 day'
  ),
  (
    'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Team Building Activities',
    'Collection of team building exercises and activities',
    NOW() - INTERVAL '7 days'
  ),
  (
    'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    'Technical Documentation',
    'Comprehensive technical documentation for the platform',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed demo authors in auth.users before VaultZero profile rows reference them.
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'olivia@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Olivia Martin"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'liam@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Liam Patel"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'amelia@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Amelia Chen"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- VaultZero profiles
INSERT INTO public.profiles (
  id,
  email,
  username,
  display_name,
  bio,
  website_url,
  github_url,
  role
)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'olivia@example.com',
    'olivia_m',
    'Olivia Martin',
    'Operator turned founder, focused on workflow products for lean teams.',
    'https://example.com/olivia',
    'https://github.com/oliviam',
    'admin'
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'liam@example.com',
    'liam_builds',
    'Liam Patel',
    'Devtools founder exploring small wedges for technical teams.',
    'https://example.com/liam',
    'https://github.com/liambuilds',
    'user'
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'amelia@example.com',
    'ameliachen',
    'Amelia Chen',
    'Product designer who likes marketplaces, education, and creator tools.',
    'https://example.com/amelia',
    'https://github.com/ameliachen',
    'user'
  )
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  role = EXCLUDED.role;

-- VaultZero startup ideas
INSERT INTO public.ideas (
  id,
  author_id,
  title,
  slug,
  one_line_summary,
  problem,
  intended_audience,
  existing_alternatives,
  proposed_solution,
  why_now,
  expected_impact,
  monetization_potential,
  go_to_market,
  mvp_scope,
  key_risks,
  validation_questions,
  effort_estimate,
  category,
  tags,
  supporting_links,
  status,
  review_state,
  admin_feedback,
  rejection_reason,
  submitted_at,
  reviewed_at,
  reviewed_by
)
VALUES
  (
    '10101010-1111-4111-8111-101010101010',
    '22222222-2222-4222-8222-222222222222',
    'SignalDesk for founder-led sales',
    'signaldesk-founder-led-sales',
    'A focused inbox that turns scattered founder sales signals into prioritized daily outreach.',
    'Early founders lose warm buying signals across LinkedIn replies, email threads, calendar notes, and product usage alerts. The result is late follow-up and low-quality pipeline hygiene.',
    'Seed-stage B2B SaaS founders who still run sales themselves.',
    'Generic CRMs, spreadsheets, Superhuman labels, and manual Slack alerts.',
    'Connect email, calendar, CRM notes, and product events into a ranked action queue with one suggested next step per account.',
    'AI summarization and enrichment are good enough to reduce CRM admin without requiring a full revenue-ops team.',
    'Founders spend less time chasing stale leads and more time on timely, high-context conversations.',
    'Monthly subscription per founder seat, expanding into team seats as companies hire sales.',
    'Founder communities, sales newsletters, and partnerships with fractional revenue consultants.',
    'Gmail and calendar import, manual account list, signal ranking, and daily action digest.',
    'Data access permissions and false-positive prioritization could erode trust.',
    '["Will founders connect email on day one?","Which signals predict a reply?","Can a daily queue replace CRM hygiene for two weeks?"]',
    'medium',
    'SaaS',
    ARRAY['sales','founders','crm','ai'],
    '["https://example.com/signaldesk"]',
    'trending',
    'accepted',
    NULL,
    NULL,
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '16 days',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '20202020-2222-4222-8222-202020202020',
    '33333333-3333-4333-8333-333333333333',
    'TinyCampus practice labs',
    'tinycampus-practice-labs',
    'Short, scenario-based practice rooms for professionals learning new software workflows.',
    'Most online courses explain tools but do not give realistic low-stakes practice. Learners finish videos without confidence using the product at work.',
    'Career switchers, junior operators, and teams adopting complex SaaS tools.',
    'Course videos, sandbox accounts, certification quizzes, and internal enablement docs.',
    'Offer guided browser-based labs with realistic tasks, instant rubric feedback, and reusable team templates.',
    'AI can evaluate workflow attempts and generate practice scenarios cheaply.',
    'Learners gain job-ready repetition and managers see skill progress instead of course completion vanity metrics.',
    'B2B team plans plus individual paid lab bundles.',
    'Partner with tool communities and publish free labs for popular workflows.',
    'Three workflow labs for one tool, scoring rubric, team dashboard, and shareable certificates.',
    'Maintaining product-specific labs as SaaS UIs change is expensive.',
    '["Which tool category has urgent training demand?","Will teams pay for practice, not courses?","Can AI scoring be trusted by managers?"]',
    'high',
    'Education',
    ARRAY['training','saas','enablement'],
    '[]',
    'accepted',
    'accepted',
    NULL,
    NULL,
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '10 days',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '30303030-3333-4333-8333-303030303030',
    '11111111-1111-4111-8111-111111111111',
    'CommitLens release notes',
    'commitlens-release-notes',
    'A developer-first changelog tool that converts merged work into customer-ready release narratives.',
    'Teams ship continuously but struggle to translate pull requests into clear release communication for customers, sales, and support.',
    'Product-led SaaS teams with weekly or daily releases.',
    'Manual changelog docs, Linear exports, GitHub release notes, and marketing copy requests.',
    'Ingest merged PRs, tickets, and labels, then draft segmented release notes with reviewer workflows.',
    'AI code summarization is now good enough to produce accurate first drafts when paired with issue metadata.',
    'Customers understand product progress, and internal teams stop rewriting the same release summary.',
    'Per-seat pricing for product and engineering teams.',
    'Launch in GitHub Marketplace and target devrel/product ops communities.',
    'GitHub integration, Linear import, draft generation, reviewer comments, and public changelog publish.',
    'Incorrect summaries could create customer trust issues.',
    '["How much editing is needed per release?","Which metadata improves accuracy most?","Can teams approve notes inside existing workflows?"]',
    'medium',
    'Devtools',
    ARRAY['github','release-notes','product'],
    '[]',
    'shipped',
    'accepted',
    NULL,
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '28 days',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '40404040-4444-4444-8444-404040404040',
    '22222222-2222-4222-8222-222222222222',
    'Neighborhood group-buy planner',
    'neighborhood-group-buy-planner',
    'A lightweight marketplace for neighbors to coordinate bulk purchases from local suppliers.',
    'Small households cannot access bulk pricing, and neighborhood group buys are currently coordinated through messy chats and spreadsheets.',
    'Apartment buildings, parent groups, and neighborhood associations.',
    'WhatsApp groups, spreadsheets, Costco runs, and local Facebook groups.',
    'Create trusted local buying circles with order thresholds, payment holds, pickup windows, and supplier offers.',
    'Inflation keeps households looking for savings while local suppliers want predictable demand.',
    'Neighbors save money and local suppliers get larger recurring orders.',
    'Supplier transaction fees and premium organizer tools.',
    'Start with dense apartment buildings and local food suppliers.',
    'One neighborhood, three suppliers, order threshold tracking, and pickup reminders.',
    'Trust, payment disputes, and logistics may overwhelm a simple MVP.',
    '["Will organizers run the first five buys?","What categories create repeat usage?","Can pickup logistics stay lightweight?"]',
    'high',
    'Marketplaces',
    ARRAY['local','marketplace','commerce'],
    '[]',
    'new',
    'accepted',
    NULL,
    NULL,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '5 days',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '50505050-5555-4555-8555-505050505050',
    '33333333-3333-4333-8333-333333333333',
    'Creator proof vault',
    'creator-proof-vault',
    'A private workspace for creators to collect testimonials, screenshots, and wins before launches.',
    'Creators often know their work is valuable but cannot find proof quickly when writing landing pages, sponsor pitches, or launch posts.',
    'Newsletter writers, course creators, consultants, and indie app builders.',
    'Notion folders, screenshot albums, testimonials in email, and social bookmarks.',
    'Capture proof from browser, email, and social posts, tag by offer, and generate launch-ready proof sections.',
    'Solo creators increasingly sell multiple offers and need credible proof without hiring a marketer.',
    'Better launch pages and faster sponsor or sales collateral.',
    'Freemium with paid exports and advanced AI summaries.',
    'Creator communities, productized service agencies, and template marketplaces.',
    'Chrome extension, proof library, offer tags, and exportable proof blocks.',
    'Platform scraping limits and privacy expectations.',
    '["Which proof sources matter most?","Will creators install a capture extension?","Do AI summaries preserve authenticity?"]',
    'low',
    'Creator tools',
    ARRAY['creator','testimonials','launch'],
    '[]',
    'under_review',
    'pending_review',
    NULL,
    NULL,
    NOW() - INTERVAL '2 days',
    NULL,
    NULL
  ),
  (
    '60606060-6666-4666-8666-606060606060',
    '22222222-2222-4222-8222-222222222222',
    'Wellness habit escrow',
    'wellness-habit-escrow',
    'A commitment app where friends lock small stakes behind verified health routines.',
    'People want accountability for wellness routines but generic streak apps lack social consequence and coaching context.',
    'Small friend groups trying to build exercise, sleep, or nutrition habits.',
    'Streak apps, group chats, Apple Fitness sharing, and habit trackers.',
    'Let groups define habits, verification rules, pooled stakes, and weekly reflection prompts.',
    'Wearable data and payment rails make lightweight verification easier than before.',
    'Friends keep commitments through small social and financial incentives.',
    'Take a percentage of group stakes or charge for premium groups.',
    'Launch through fitness creators and workplace wellness challenges.',
    'Manual habit check-ins, group pools, reminders, and weekly recap.',
    'Could feel punitive or create disputes around verification.',
    '["Which habits are appropriate for stakes?","Will groups trust manual proof?","What stake size motivates without feeling predatory?"]',
    'medium',
    'Health and wellness',
    ARRAY['habits','wellness','accountability'],
    '[]',
    'under_review',
    'needs_edits',
    'Clarify safeguards so the product does not encourage unhealthy pressure.',
    NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '3 days',
    '11111111-1111-4111-8111-111111111111'
  ),
  (
    '70707070-7777-4777-8777-707070707070',
    '33333333-3333-4333-8333-333333333333',
    'AI inbox for every school club',
    'ai-inbox-school-clubs',
    'A shared inbox where student club officers can auto-answer repetitive member questions.',
    'Student clubs lose knowledge every semester as officers graduate, creating repeated confusion about dues, events, and onboarding.',
    'University clubs and student organizations.',
    'Discord channels, Google Docs, email aliases, and campus portals.',
    'Import club docs and messages into a shared AI inbox that drafts answers and maintains an officer-approved FAQ.',
    'Students already use AI assistants, and clubs need continuity despite high turnover.',
    'Less officer burnout and better member onboarding.',
    'Campus-wide licensing or low-cost club subscriptions.',
    'Start with business and engineering clubs at one university.',
    'Shared inbox, FAQ knowledge base, approval queue, and member question form.',
    'University procurement and data privacy may slow adoption.',
    '["Will clubs pay individually?","Can officers maintain the knowledge base?","Do members use a separate question form?"]',
    'medium',
    'Community',
    ARRAY['clubs','student','ai'],
    '[]',
    'under_review',
    'rejected',
    NULL,
    'Too close to a generic AI FAQ wrapper without a sharper wedge.',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '8 days',
    '11111111-1111-4111-8111-111111111111'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.votes (idea_id, user_id)
VALUES
  ('10101010-1111-4111-8111-101010101010', '11111111-1111-4111-8111-111111111111'),
  ('10101010-1111-4111-8111-101010101010', '33333333-3333-4333-8333-333333333333'),
  ('20202020-2222-4222-8222-202020202020', '11111111-1111-4111-8111-111111111111'),
  ('20202020-2222-4222-8222-202020202020', '22222222-2222-4222-8222-222222222222'),
  ('30303030-3333-4333-8333-303030303030', '22222222-2222-4222-8222-222222222222'),
  ('30303030-3333-4333-8333-303030303030', '33333333-3333-4333-8333-333333333333'),
  ('40404040-4444-4444-8444-404040404040', '11111111-1111-4111-8111-111111111111')
ON CONFLICT (idea_id, user_id) DO NOTHING;

INSERT INTO public.comments (idea_id, author_id, body)
VALUES
  ('10101010-1111-4111-8111-101010101010', '11111111-1111-4111-8111-111111111111', 'The wedge is strong if it stays founder-first and avoids becoming another CRM. I would test the daily queue with five founders.'),
  ('10101010-1111-4111-8111-101010101010', '33333333-3333-4333-8333-333333333333', 'The permission ask is the biggest trust hurdle. A manual import mode could help early validation.'),
  ('20202020-2222-4222-8222-202020202020', '22222222-2222-4222-8222-222222222222', 'Practice labs feel much more valuable than another video course. Pick one tool with painful onboarding.'),
  ('30303030-3333-4333-8333-303030303030', '33333333-3333-4333-8333-333333333333', 'Would love this for customer-facing changelogs, especially if support can annotate impact.')
ON CONFLICT DO NOTHING;

INSERT INTO public.bookmarks (idea_id, user_id)
VALUES
  ('10101010-1111-4111-8111-101010101010', '11111111-1111-4111-8111-111111111111'),
  ('10101010-1111-4111-8111-101010101010', '33333333-3333-4333-8333-333333333333'),
  ('20202020-2222-4222-8222-202020202020', '22222222-2222-4222-8222-222222222222'),
  ('30303030-3333-4333-8333-303030303030', '22222222-2222-4222-8222-222222222222')
ON CONFLICT (idea_id, user_id) DO NOTHING;

INSERT INTO public.follows (idea_id, user_id)
VALUES
  ('10101010-1111-4111-8111-101010101010', '11111111-1111-4111-8111-111111111111'),
  ('10101010-1111-4111-8111-101010101010', '33333333-3333-4333-8333-333333333333'),
  ('20202020-2222-4222-8222-202020202020', '11111111-1111-4111-8111-111111111111'),
  ('40404040-4444-4444-8444-404040404040', '22222222-2222-4222-8222-222222222222')
ON CONFLICT (idea_id, user_id) DO NOTHING;

INSERT INTO public.status_history (
  idea_id,
  actor_id,
  from_review_state,
  to_review_state,
  from_status,
  to_status,
  note
)
VALUES
  ('10101010-1111-4111-8111-101010101010', '11111111-1111-4111-8111-111111111111', 'pending_review', 'accepted', 'under_review', 'trending', 'Clear wedge and strong validation path.'),
  ('60606060-6666-4666-8666-606060606060', '11111111-1111-4111-8111-111111111111', 'pending_review', 'needs_edits', 'under_review', 'under_review', 'Clarify safety and dispute handling.'),
  ('70707070-7777-4777-8777-707070707070', '11111111-1111-4111-8111-111111111111', 'pending_review', 'rejected', 'under_review', 'under_review', 'Too generic without a sharper wedge.')
ON CONFLICT DO NOTHING;

INSERT INTO public.moderation_events (
  target_type,
  target_id,
  admin_id,
  action,
  reason,
  metadata
)
VALUES
  ('idea', '10101010-1111-4111-8111-101010101010', '11111111-1111-4111-8111-111111111111', 'accepted', 'Clear wedge and strong validation path.', '{"seed":true}'),
  ('idea', '60606060-6666-4666-8666-606060606060', '11111111-1111-4111-8111-111111111111', 'needs_edits', 'Clarify safeguards.', '{"seed":true}'),
  ('idea', '70707070-7777-4777-8777-707070707070', '11111111-1111-4111-8111-111111111111', 'rejected', 'Too generic.', '{"seed":true}')
ON CONFLICT DO NOTHING;

INSERT INTO public.ai_enhancement_sessions (
  id,
  user_id,
  idea_id,
  rough_idea,
  category_guess,
  status,
  final_payload,
  model
)
VALUES
  (
    '80808080-8888-4888-8888-808080808080',
    '22222222-2222-4222-8222-222222222222',
    '10101010-1111-4111-8111-101010101010',
    'Tool that watches sales signals for founders and tells them who to follow up with first.',
    'SaaS',
    'completed',
    '{"title":"SignalDesk for founder-led sales","category":"SaaS"}',
    'openai/gpt-4.1-mini'
  ),
  (
    '90909090-9999-4999-8999-909090909090',
    '33333333-3333-4333-8333-333333333333',
    '20202020-2222-4222-8222-202020202020',
    'Practice labs for people learning SaaS tools, not just videos.',
    'Education',
    'completed',
    '{"title":"TinyCampus practice labs","category":"Education"}',
    'openai/gpt-4.1-mini'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.ai_questions (session_id, question, question_type, options, sort_order)
VALUES
  ('80808080-8888-4888-8888-808080808080', 'Who feels the pain first?', 'single_choice', '["Founder sellers","Sales managers","Customer success","Investors"]', 1),
  ('80808080-8888-4888-8888-808080808080', 'What is the smallest useful MVP?', 'single_choice', '["Daily queue","Full CRM","Chrome sidebar","Slack bot"]', 2),
  ('90909090-9999-4999-8999-909090909090', 'Which buyer is most likely?', 'single_choice', '["Teams","Individuals","Schools","Tool vendors"]', 1),
  ('90909090-9999-4999-8999-909090909090', 'What proves value fastest?', 'single_choice', '["Completion rate","Manager feedback","Job outcomes","Lab repeats"]', 2)
ON CONFLICT DO NOTHING;

SELECT public.recalculate_idea_counts(id) FROM public.ideas;
SELECT public.recalculate_leaderboard_for_user(id) FROM public.profiles;

-- Seed demo authors in auth.users
INSERT INTO auth.users (id, email, raw_app_meta_data, raw_user_meta_data, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  (
    '11111111-1111-4111-8111-111111111111',
    'olivia@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Olivia Martin"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'liam@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Liam Patel"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'amelia@example.com',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Amelia Chen"}',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- Seed blog posts
INSERT INTO public.content_blog_posts (id, slug, title, excerpt, body, author_id, is_published, published_at, created_at)
VALUES
  (
    '44444444-4444-4444-9444-444444444444',
    'supabase-workflows-at-scale',
    'Supabase Workflows at Scale',
    'How we orchestrate Supabase workflows for multi-tenant platforms.',
    'Supabase workflows require robust patterns for scaling teams and data-heavy workloads. In this post we walk through connection pooling, background jobs, and schema design tactics that keep queries fast under load.',
    '11111111-1111-4111-8111-111111111111',
    true,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '12 days'
  ),
  (
    '55555555-5555-4555-9555-555555555555',
    'designing-nextjs-edge-experiences',
    'Designing Next.js Edge Experiences',
    'Blueprints for delivering personalized UX at the edge with Next.js 15.',
    'Edge rendering with Next.js 15 unlocks real-time personalization. We explore caching strategies, streaming responses, and how to pair Supabase RLS with middleware to keep sessions fast and secure.',
    '22222222-2222-4222-8222-222222222222',
    true,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '9 days'
  ),
  (
    '66666666-6666-4666-9666-666666666666',
    'tailwind-shadcn-design-systems',
    'Tailwind + shadcn/ui Design Systems',
    'Practical guide for building cohesive UI systems with Tailwind and shadcn/ui.',
    'Design systems thrive on consistency. Learn how to blend Tailwind, shadcn/ui primitives, and Radix accessibility helpers to ship interfaces that scale with your product roadmap.',
    '33333333-3333-4333-8333-333333333333',
    true,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    '77777777-7777-4777-9777-777777777777',
    'caching-strategies-for-rsc',
    'Caching Strategies for RSC',
    'Patterns for caching React Server Component data safely.',
    'React Server Components shift the caching story. We cover memoization utilities, revalidation, and how to avoid serving stale personalized content across tenants.',
    '11111111-1111-4111-8111-111111111111',
    true,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days'
  ),
  (
    '88888888-8888-4888-9888-888888888888',
    'shipping-reliable-server-actions',
    'Shipping Reliable Server Actions',
    'Lessons learned from production hardening of Next.js server actions.',
    'Server actions remove client round-trips but require great observability. In this walkthrough we explore logging, retries, and coupling actions with pgTap tests to catch regressions.',
    '22222222-2222-4222-8222-222222222222',
    true,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (slug) DO NOTHING;

-- Seed blog post comments
INSERT INTO public.content_blog_post_comments (id, blog_post_id, author_id, body, created_at)
VALUES
  (
    '99999999-9999-4999-9999-999999999999',
    '44444444-4444-4444-9444-444444444444',
    '22222222-2222-4222-8222-222222222222',
    'Loved the section on connection pooling—would enjoy a deep dive on pgBouncer with Supabase.',
    NOW() - INTERVAL '8 days'
  ),
  (
    'aaaaaaa1-aaaa-4aaa-9aaa-aaaaaaaaaaa1',
    '55555555-5555-4555-9555-555555555555',
    '33333333-3333-4333-8333-333333333333',
    'This aligns perfectly with our edge A/B testing strategy. Appreciate the checklist at the end.',
    NOW() - INTERVAL '6 days'
  ),
  (
    'aaaaaaa2-aaaa-4aaa-9aaa-aaaaaaaaaaa2',
    '66666666-6666-4666-9666-666666666666',
    '11111111-1111-4111-8111-111111111111',
    'Great reminder to document tokens for each primitive. The color recipes example is gold.',
    NOW() - INTERVAL '4 days'
  ),
  (
    'aaaaaaa3-aaaa-4aaa-9aaa-aaaaaaaaaaa3',
    '77777777-7777-4777-9777-777777777777',
    '22222222-2222-4222-8222-222222222222',
    'Could you expand on revalidation timing for incremental static regeneration?',
    NOW() - INTERVAL '2 days'
  ),
  (
    'aaaaaaa4-aaaa-4aaa-9aaa-aaaaaaaaaaa4',
    '88888888-8888-4888-9888-888888888888',
    '33333333-3333-4333-8333-333333333333',
    'The pgTap section is super actionable—thanks for the tips on arranging fixtures.',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;
