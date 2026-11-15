// ============================================================
// projects.js — the 5 websites and 5 apps, and the steps to
// build each one. To change a project, edit it here.
//
// Each project has:
//   needs    — the big building blocks it requires
//   pages    — every page/screen to build
//   build    — the features that make it work
//   tests    — what to prove before launch
//   watch    — things that can cause trouble (not check-offs)
// The Plan, Set up, Payments and Launch steps are shared and
// are filled in automatically by phasesFor() at the bottom.
// ============================================================

export const PROJECTS = [
  // ---------------- Websites (tools sold to businesses) ----------------
  {
    id: 'haulsnap', type: 'web', name: 'HaulSnap', price: '$199/mo', time: '2–3 weeks',
    tagline: 'Instant photo quotes for junk removal companies',
    customer: 'junk removal owners',
    needs: ['Company login', 'AI reads photos', 'Booking calendar', 'Card payments', 'Texts and emails'],
    pages: [
      'Landing page that sells HaulSnap to junk removal companies',
      'Sign up and log in',
      'Company setup: truck size, price list, service area, working hours',
      'Customer quote page: upload 3–4 photos, see a price range',
      'Booking page: pick a pickup slot and pay the deposit',
      'Confirmation page',
      'Company dashboard: quotes and bookings',
      'Billing page: subscription, card, cancel',
    ],
    build: [
      'Photo upload that works straight from a phone camera',
      'Send the photos to an AI vision model and get back "fraction of the truck filled" as a number',
      'Turn that fraction into a price range using the company’s own price list',
      'Calendar that shows only open slots and never double-books',
      'Take the deposit by card and send it to the company’s account',
      'Send a confirmation text or email to the customer and the company',
      'Give each company a link, QR code and button to put on their own website',
    ],
    tests: [
      'Run 30 real junk photos through it and compare with what a real company would quote',
      'Book the same slot from two phones at once and confirm only one succeeds',
      'Pay a test deposit and refund it',
    ],
    watch: [
      'The AI gives an estimate, so show a range and say the final price is confirmed on site.',
      'Decide the deposit refund rule before taking the first payment.',
      'Photos add up in storage. Shrink them on upload.',
    ],
  },
  {
    id: 'towline', type: 'web', name: 'TowLine', price: '$399/mo', time: '4–6 weeks',
    tagline: 'A 24/7 AI dispatcher for towing companies',
    customer: 'towing company owners',
    needs: ['Company login', 'AI phone voice', 'Text messages', 'GPS location link', 'Maps and distance', 'Driver alerts'],
    pages: [
      'Landing page with a demo phone number to call',
      'Sign up and log in',
      'Company setup: rates, service area, on-call schedule, phone number',
      'Location link page: the stranded driver taps once to share GPS',
      'Dashboard: live jobs',
      'Job detail: caller, location, vehicle, quote, assigned driver',
      'Call log with recordings and transcripts',
      'Billing page: subscription, card, cancel',
    ],
    build: [
      'Get a phone number that connects callers to an AI voice agent',
      'Write the call script: are you safe, where are you, what vehicle, what happened, where is it going',
      'First question is safety: anyone in danger is told to call 911',
      'Text the caller a link that captures their GPS location',
      'Quote the tow: hook-up fee plus price per mile, using map distance',
      'Text the job to the on-call driver with an Accept button',
      'If no driver accepts in a few minutes, alert the next driver, then the owner',
      'If the AI gets stuck, transfer the call to a real person',
      'Save every call’s transcript to the job',
    ],
    tests: [
      'Make 50 test calls: noisy roadside, upset caller, bad signal, caller who doesn’t know where they are',
      'Share location from an iPhone and an Android phone',
      'Run it overnight and confirm a 3 a.m. call reaches a driver',
    ],
    watch: [
      'Many states require telling callers that the call is recorded. Say it at the start.',
      'US carriers make businesses register before sending texts in bulk. Start that early; approval can take days or weeks.',
      'AI voice is billed per minute. Work out the cost of a busy month before fixing the price.',
      'A missed call is a lost job. The "transfer to a human" backup matters more than any other feature.',
    ],
  },
  {
    id: 'inkdesk', type: 'web', name: 'InkDesk', price: '$129/mo per artist', time: '3–4 weeks',
    tagline: 'AI booking for tattoo shops, straight from Instagram DMs',
    customer: 'tattoo artists',
    needs: ['Artist login', 'Instagram connection', 'AI chat', 'Card payments', 'Signed consent forms', 'Photo uploads'],
    pages: [
      'Landing page that sells InkDesk to artists',
      'Sign up and log in',
      'Connect Instagram',
      'Artist setup: styles, hourly rate or minimum, deposit amount, availability',
      'Inbox: AI conversations, with a "take over" button',
      'Booking request: idea, size, placement, reference photos, price range',
      'Deposit payment page for the client',
      'Consent form page the client signs on their phone',
      'Calendar',
      'Billing page: subscription, card, cancel',
    ],
    build: [
      'Create the Meta developer app and apply for permission to read and reply to messages (do this on day 1)',
      'Receive new Instagram DMs on your server',
      'AI collects the idea, size, placement and reference photos, one question at a time',
      'Work out a price range from the artist’s own rates',
      'Let the artist take over any conversation',
      'Send the deposit link and mark the booking as paid',
      'Consent form with a finger signature, saved as a PDF',
      'Ask for date of birth and block bookings under the legal age',
      'A plain web booking form that works without Instagram, to use while waiting for approval',
    ],
    tests: [
      'Send 30 pretend DMs: vague ideas, cover-ups, someone asking only for the price, someone rude',
      'Complete one booking from first DM to signed consent form on a phone',
      'Have a real artist read the AI’s replies and mark the ones that sound wrong',
    ],
    watch: [
      'Instagram must approve apps that read and reply to messages, and the artist needs a professional account. Approval can add a week or more.',
      'Instagram limits how long after a customer’s message a business may reply automatically. Read the current rules before designing follow-ups.',
      'Tattoo age and consent laws differ by state. Let each artist set their own form.',
    ],
  },
  {
    id: 'pumproute', type: 'web', name: 'PumpRoute', price: '$249/mo', time: '3–4 weeks',
    tagline: 'Scheduling, reminders and logs for septic and grease-trap pumpers',
    customer: 'septic and grease-trap company owners',
    needs: ['Login for office and drivers', 'Customer database', 'Automatic reminders', 'Cleaning logs as PDF', 'Maps and routes', 'Driver phone view'],
    pages: [
      'Landing page that sells PumpRoute to pumping companies',
      'Sign up and log in',
      'Customer list',
      'Customer detail: tank size, how often, last service, history',
      'Schedule calendar',
      'Reminder settings: wording and timing',
      'Route planner: map and stop order for each truck',
      'Driver’s day: today’s stops on a phone',
      'Job completion form: gallons, photos, signature',
      'Cleaning log for each restaurant, with PDF export',
      'Billing page: subscription, card, cancel',
    ],
    build: [
      'Import customers from a spreadsheet',
      'Work out each customer’s next due date from their last service and interval',
      'A daily job that sends "you’re due" texts and emails',
      'Let customers confirm or reschedule from the reminder',
      'Save each cleaning as a log record with the fields the city requires',
      'Export a restaurant’s log as a clean PDF',
      'Turn addresses into map points',
      'Put a day’s stops in an efficient order using a routing service',
      'Driver marks a stop complete, even with weak signal',
    ],
    tests: [
      'Import a real customer spreadsheet with messy data',
      'Plan a 12-stop day and compare the route with how a real driver would do it',
      'Show a printed log to a restaurant manager or inspector and ask what is missing',
    ],
    watch: [
      'Grease-trap log rules differ by city and county. Get the real form from one target city and match it.',
      'US carriers make businesses register before sending reminder texts. Start that early.',
      'Use an existing routing service. Writing your own route optimizer is a project by itself.',
    ],
  },
  {
    id: 'drylog', type: 'web', name: 'DryLog', price: '$299/mo', time: '3–4 weeks',
    tagline: 'Job documentation for water-damage restoration crews',
    customer: 'restoration company owners',
    needs: ['Login for crews', 'Phone camera', 'Moisture readings', 'AI writes the report', 'PDF export', 'Works with weak signal'],
    pages: [
      'Landing page with a sample report',
      'Sign up and log in',
      'Jobs list',
      'New job: address, claim number, insurer, cause of loss',
      'Rooms and equipment for a job',
      'Daily log: photos and moisture readings for each room',
      'Drying progress chart',
      'Report preview',
      'Export and share PDF',
      'Team: invite techs',
      'Billing page: subscription, card, cancel',
    ],
    build: [
      'Get 2 real restoration reports and copy their layout and wording',
      'Photo capture with automatic date, time and room',
      'Enter moisture readings by room, material and day',
      'Chart each room’s readings over the days',
      'AI writes the summary from the readings, and every number comes from the data',
      'Professional PDF: cover page, daily tables, photos, chart, summary',
      'Save entries on the phone when there is no signal and upload later',
    ],
    tests: [
      'Log a pretend 4-day job on a phone, in a basement with no signal',
      'Compare every number in the report with what was typed in',
      'Show the PDF to an insurance adjuster or restoration owner and ask if they would accept it',
    ],
    watch: [
      'Adjusters expect the industry’s standard terms and layout. Copy real reports closely.',
      'The AI must never change or invent a reading. It only writes sentences around the saved numbers.',
      'Job photos add up fast. Shrink them on upload.',
    ],
  },

  // ---------------- Apps (phone apps sold to everyone) ----------------
  {
    id: 'dinkcoach', type: 'app', name: 'DinkCoach', price: '$9.99/week', time: '3–4 weeks',
    tagline: 'AI pickleball coach that scores your form from video',
    customer: 'pickleball players',
    needs: ['Sign-in', 'Video recording', 'AI watches video', 'Weekly subscription', 'Progress history'],
    pages: [
      'Onboarding: 3 screens showing what it does',
      'Paywall',
      'Record or upload a clip, with a guide for where to put the phone',
      'Analyzing screen',
      'Results: scores for serve, dinks and footwork, with what to fix',
      'Drill library',
      'Progress over time',
      'Settings: restore purchase, privacy, delete account',
    ],
    build: [
      'Record or choose a 10–20 second clip',
      'Pull still frames out of the clip',
      'Send the frames to an AI model with a fixed scoring checklist for each shot',
      'Make scoring steady: the same clip gets the same score every time',
      'Match each weakness to 2–3 drills',
      'Save each session so progress can be charted',
      'Limit clip length and clips per day to control cost',
    ],
    tests: [
      'Score the same clip 5 times and check the scores match',
      'Test 20 clips: indoor, outdoor, bad angle, two players in view',
      'Ask a good player or coach whether the feedback is right',
    ],
    watch: [
      'Video costs far more to analyze than photos. Know the cost of one clip before setting limits.',
      'Bad camera angles give bad feedback. The filming guide is part of the product.',
    ],
  },
  {
    id: 'dashlight', type: 'app', name: 'Dashlight', price: '$6.99/week', time: '2–3 weeks',
    tagline: 'Car problem translator for warning lights and weird noises',
    customer: 'drivers',
    needs: ['Sign-in', 'Camera', 'Sound recording', 'AI reads photos and audio', 'Weekly subscription'],
    pages: [
      'Onboarding: 3 screens showing what it does',
      'Paywall',
      'My car: make, model, year, mileage',
      'Scan a dashboard light',
      'Record a noise',
      'Follow-up questions',
      'Result: likely cause, how urgent, fair repair price range',
      'History',
      'Settings: restore purchase, privacy, delete account',
    ],
    build: [
      'Photo of the dashboard goes to AI, which names the warning light',
      'A fixed list of lights that always mean "stop driving now" (oil pressure, overheating, brakes), not left to the AI',
      'Three urgency levels: stop now, fix soon, can wait',
      'Record 10 seconds of engine noise and send it for analysis',
      'Ask 2–3 follow-up questions before answering',
      'Show a repair price range and what to say to the mechanic',
    ],
    tests: [
      'Test 40 dashboard photos from different car brands, day and night',
      'Check every "stop driving" light gives the stop answer',
      'Compare 10 price ranges with real repair quotes',
    ],
    watch: [
      'It is a likely cause, not a diagnosis. Say so on every result.',
      'Safety lights must never come back as "can wait".',
      'Repair prices change by area. Always show a range.',
    ],
  },
  {
    id: 'flipscan', type: 'app', name: 'FlipScan', price: '$7.99/week', time: '2–3 weeks',
    tagline: 'Thrift store profit scanner',
    customer: 'resellers and thrifters',
    needs: ['Sign-in', 'Camera', 'AI identifies items', 'Real sold prices', 'Weekly subscription'],
    pages: [
      'Onboarding: 3 screens showing what it does',
      'Paywall',
      'Camera scan',
      'Result: what it is, resale range, fees, profit',
      'Enter the store’s price',
      'Saved finds',
      'Profit tracker',
      'Settings: restore purchase, privacy, delete account',
    ],
    build: [
      'Photo goes to AI, which names the brand, item and model',
      'Apply for access to a marketplace’s sold-price data (do this in week 1)',
      'Look up real "sold for" prices for the item',
      'Subtract selling fees and shipping to show profit',
      'Label each result "based on real sales" or "AI estimate"',
      'Save a find with its photo and numbers',
      'Answer in under 5 seconds',
    ],
    tests: [
      'Scan 50 real thrift items and compare with actual sold listings',
      'Time each scan on store Wi-Fi and on phone data',
      'Try items with no label or brand',
    ],
    watch: [
      'Sold-price data usually needs approval and has usage rules. Without it, the app is only guessing.',
      'A wrong value costs the user real money. Show how confident each result is.',
    ],
  },
  {
    id: 'pawcheck', type: 'app', name: 'PawCheck', price: '$5.99/week', time: '1.5–2 weeks',
    tagline: 'Pet symptom triage: vet now, watch, or probably fine',
    customer: 'dog and cat owners',
    needs: ['Sign-in', 'Camera', 'AI reads photos and text', 'Weekly subscription', 'History for each pet'],
    pages: [
      'Onboarding: add your pet (species, age, weight)',
      'Paywall',
      'New check: photo and a description',
      'Follow-up questions',
      'Result: Vet now, Watch for 24 hours, or Probably fine, with reasons',
      'Emergency signs list',
      'History for each pet',
      'Settings: restore purchase, privacy, delete account',
    ],
    build: [
      'A fixed list of red flags that always mean "vet now" (trouble breathing, poison, seizures, bloated belly, can’t pee)',
      'AI handles everything else and leans cautious when unsure',
      'Ask 2–3 follow-up questions before answering',
      'Each result explains why, and what would change the answer',
      'A "find an emergency vet near me" link on every urgent result',
      'Save each check to the pet’s history',
    ],
    tests: [
      'Write 40 test cases with known right answers, including every red flag',
      'Confirm no red flag ever returns "probably fine"',
      'Ask a vet or vet tech to review the red-flag list and 10 results',
    ],
    watch: [
      'It is not a vet. Say so on every result.',
      'When unsure, the answer is the more cautious one.',
      'Take the list of poisonous foods and plants from a veterinary source, not from the AI.',
    ],
  },
  {
    id: 'billbuster', type: 'app', name: 'BillBuster', price: '$14.99/month', time: 'about 2 weeks',
    tagline: 'Medical bill checker that writes the dispute letter',
    customer: 'people with medical bills',
    needs: ['Sign-in', 'Camera', 'AI reads documents', 'Letter writing', 'PDF export', 'Monthly subscription'],
    pages: [
      'Onboarding: 3 screens showing what it does',
      'Paywall',
      'Scan a bill, several pages',
      'Review the line items it read, and fix mistakes',
      'Findings: possible errors, each explained',
      'Dispute letter editor',
      'Export or send as PDF',
      'My bills: status of each dispute',
      'Settings: restore purchase, privacy, delete account',
    ],
    build: [
      'Read the photographed bill into a table of line items',
      'Let the user correct anything it misread',
      'Checks: duplicate charges, totals that don’t add up, wrong dates, charges with no detail',
      'If the bill has no detail, write a request for an itemized bill first',
      'Write the dispute letter from the findings',
      'Export the letter as a PDF',
      'Delete bill photos after reading them, unless the user chooses to keep them',
    ],
    tests: [
      'Test 25 bill photos: crumpled, dark, angled, several pages',
      'Compare every amount it read with the paper bill',
      'Ask someone who works in medical billing to review 5 letters',
    ],
    watch: [
      'Medical bills are sensitive. Store as little as possible and write a clear privacy policy.',
      'Say "possible error", never "error". It is not legal or billing advice.',
      'App stores have extra rules for apps that handle health information. Read them before building.',
    ],
  },
];

// ---------- Shared steps ----------
const plan = p => [
  `Talk to 5 ${p.customer} and write down their exact words about the problem`,
  'Write the one-sentence promise: who it is for and what it does',
  'List what version 1 will NOT include',
  'Look at 3 competitors: their price and what they are missing',
  'Sketch every page on paper',
  p.type === 'app' ? 'Check the name is free on the App Store' : 'Check the name’s web address is available',
];

const setup = p => (p.type === 'app' ? [
  'Choose how to build it, and get a "hello" screen running on your own iPhone',
  'A parent signs up for the Apple Developer Program',
  'Set up the database and sign-in, so history and the subscription follow the user',
  'Create a small server to hold secret keys. Keys never go inside the app',
  'Sign up for the AI service and make one test call from the server',
] : [
  'Create the code repository and get a "hello" page live on the internet',
  'Set up the database and company sign-up and login',
  'Create a small server to hold secret keys. Keys never go in the page code',
  'Sign up for the AI service and make one test call from the server',
  'Create one pretend company with sample data to build against',
]);

const payments = p => (p.type === 'app' ? [
  `Create the subscription in the App Store at ${p.price}`,
  'Build the paywall: price, what you get, restore purchases',
  'Give one free try before the paywall',
  'Unlock features when subscribed and lock them when it ends',
  'Test buying and cancelling with a test account',
] : [
  'A parent opens the payments account',
  `Create the subscription plan at ${p.price}`,
  'Offer a free trial or a live demo',
  'Billing page works: change card, cancel',
  'Handle failed payments: email the company and pause the account',
]);

const testing = p => [
  ...p.tests,
  'Measure what one use costs in AI fees and confirm it is far below the price',
  'Watch 5 people use it without help and note where they get stuck',
  'Fix the top 5 problems they hit',
];

const launch = p => (p.type === 'app' ? [
  'Write the privacy policy and terms',
  'Make the app icon and 5 screenshots',
  'Write the App Store description',
  'Submit for review and fix anything Apple rejects',
  'Post 3 short videos showing the app working',
  'Get the first 10 users',
  'Get the first paying subscriber',
] : [
  'Write the privacy policy and terms',
  'Finish the landing page with a demo video and the price',
  'Set up a support email',
  'Get alerts when something breaks',
  'Sign one company for a free 2-week pilot',
  'Ask the pilot company to pay at the end',
  'Get the first paying customer',
]);

/** Every phase and step for a project, in build order. */
export function phasesFor(p) {
  return [
    { name: 'Plan', steps: plan(p) },
    { name: 'Set up', steps: setup(p) },
    { name: p.type === 'app' ? 'Screens' : 'Pages', steps: p.pages },
    { name: 'Core features', steps: p.build },
    { name: 'Payments', steps: payments(p) },
    { name: 'Test', steps: testing(p) },
    { name: 'Launch', steps: launch(p) },
  ];
}
