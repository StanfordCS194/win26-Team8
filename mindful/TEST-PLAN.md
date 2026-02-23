# Second Thought - User Test Plan

## Table of Contents
1. [Welcome & Orientation](#1-welcome--orientation)
2. [Setup & Pre-Conditions](#2-setup--pre-conditions)
3. [Test Scenarios](#3-test-scenarios)
   - [A. Basic Functionality Testing](#a-basic-functionality-testing)
   - [B. UI/UX Comparisons (A/B Tests)](#b-uiux-comparisons-ab-tests)
   - [C. Core Feature/Benefit Evaluation](#c-core-featurebenefit-evaluation)
   - [D. Performance Testing](#d-performance-testing)
4. [Feedback Mechanism](#4-feedback-mechanism)
5. [Intervention Policy](#5-intervention-policy)
6. [Pre-Baked User Workflows](#6-pre-baked-user-workflows)
7. [Test Accounts & Data](#7-test-accounts--data)
8. [Post-Testing Debrief](#8-post-testing-debrief)

---

## 1. Welcome & Orientation

> **Read this to the tester before they begin:**

Thank you for taking the time to help us test **Second Thought**!

**What is Second Thought?**
Second Thought is a mindful consumption companion app designed to help people make more intentional purchasing decisions and reduce impulsive buying. Our target audience is environmentally and financially conscious consumers who want to pause and reflect before making purchases.

**What to expect today:**
You will be using our web application (and optionally our browser extension) to experience the full journey of a user who wants to be more mindful about their purchases. This includes signing up, adding items you're considering purchasing, answering reflection questions, and exploring different ways to view and manage those items.

**Your role:**
We want your honest, unfiltered reactions. There are no wrong answers and no wrong ways to use the app. If something confuses you, frustrates you, or delights you, that is exactly the kind of feedback we need. You are testing the software, not being tested yourself.

**Time commitment:** Plan on approximately **8-10 minutes** for the core testing experience, though you are welcome to explore longer if you wish.

---

## 2. Setup & Pre-Conditions

### Environment Requirements
- A modern web browser (Chrome, Firefox, or Safari)
- Internet connection
- The app running locally at `http://localhost:8081` or deployed URL

### Before Testers Arrive
- [ ] App is running and accessible
- [ ] Test accounts are pre-created (see [Section 7](#7-test-accounts--data))
- [ ] "Seasoned user" accounts are pre-populated with 6+ months of item data
- [ ] Feedback form link is ready to share
- [ ] A team member is designated as the observer/note-taker for each tester
- [ ] Browser extension `.zip` is available for testers who want to try it

### Tester Setup Instructions
1. Open the provided URL in your browser
2. You will land on our **Mission** page -- take a moment to read it
3. You may either **create a new account** or **use a pre-made account** (credentials provided)
4. If you are a new user, you will see a short **walkthrough** -- please go through it

---

## 3. Test Scenarios

### A. Basic Functionality Testing

These tests verify that core flows work as intended.

| # | Test Case | Steps | Expected Result | Pass/Fail | Notes |
|---|-----------|-------|-----------------|-----------|-------|
| A1 | **Sign Up** | 1. Click "Sign Up" on the mission page <br> 2. Enter first name, last name, email, password <br> 3. Submit | Account is created, user is redirected to the walkthrough | | |
| A2 | **Sign In** | 1. Click "Sign In" <br> 2. Enter existing credentials <br> 3. Submit | User is logged in and sees the Home view | | |
| A3 | **Walkthrough Completion** | 1. Sign up as a new user <br> 2. Proceed through all 3 walkthrough steps <br> 3. Click "Get Started" on the final step | Walkthrough completes, user reaches Home view, walkthrough does not reappear on next login | | |
| A4 | **Add Item via URL** | 1. Click "Add Item" <br> 2. Paste a product URL (e.g., Amazon link) <br> 3. Verify auto-populated name/image <br> 4. Answer reflection questions <br> 5. Choose a constraint type and submit | Item appears in the appropriate view with correct details | | |
| A5 | **Add Item Manually** | 1. Click "Add Item" <br> 2. Click "Skip" on URL step <br> 3. Enter product name manually <br> 4. Answer reflection questions <br> 5. Choose constraint and submit | Item is saved and appears in Home view | | |
| A6 | **Time-Based Constraint** | 1. Add an item <br> 2. Select "Time-Based" constraint <br> 3. Set a future date <br> 4. Submit | Item shows in Timeline view on the selected date | | |
| A7 | **Goals-Based Constraint** | 1. Add an item <br> 2. Select "Goals-Based" constraint <br> 3. Pick difficulty (easy/medium/hard) <br> 4. Submit | Item shows in Goals view under the correct difficulty section | | |
| A8 | **View Item Detail** | 1. Click on any item from Home view | Item detail page shows: image, name, category, consumption score, reflection answers, and mindfulness explanation | | |
| A9 | **Delete Item** | 1. Open an item's detail view <br> 2. Click delete <br> 3. Confirm deletion | Item is removed from all views | | |
| A10 | **Category Filtering** | 1. Go to Home (All Items) view <br> 2. Use the category filter dropdown <br> 3. Select a specific category | Only items in that category are displayed | | |
| A11 | **Timeline View Navigation** | 1. Navigate to the Timeline view <br> 2. Scroll through the 12-month calendar | Time-based items appear on correct dates; calendar is readable | | |
| A12 | **Profile & Stats** | 1. Navigate to Profile <br> 2. Review displayed statistics | Profile shows correct name, email, member since date, item counts, and average consumption score | | |
| A13 | **Sign Out** | 1. Navigate to Profile <br> 2. Click "Sign Out" | User is logged out and returned to the Mission page | | |
| A14 | **Browser Extension - Add Item** | 1. Install the browser extension <br> 2. Navigate to a product page <br> 3. Click the extension icon <br> 4. Add the item | Item is added and syncs with the main app | | |

---

### B. UI/UX Comparisons (A/B Tests)

We will split testers into two groups to compare different UI/UX approaches.

#### B1. Onboarding Flow: Walkthrough vs. No Walkthrough

| Group | Experience | What We Measure |
|-------|-----------|-----------------|
| **Group A** | Full 3-step walkthrough on first login | Time to first item added, number of errors, self-reported confidence |
| **Group B** | Skip walkthrough, go straight to Home view | Time to first item added, number of errors, self-reported confidence |

**Hypothesis:** Users who complete the walkthrough will add their first item faster and with fewer errors.

**How to execute:** For Group B testers, mark the walkthrough as already completed in their account before they start.

#### B2. Constraint Framing: "Wait Period" vs. "Reflection Window"

| Group | Framing | What We Measure |
|-------|---------|-----------------|
| **Group A** | Time-based constraint labeled as a "Wait Period" (current) | User sentiment, perceived value, willingness to use |
| **Group B** | Same feature reframed as a "Reflection Window" | User sentiment, perceived value, willingness to use |

**Hypothesis:** Framing the wait as a "Reflection Window" will feel more empowering and less restrictive to users.

**How to execute:** Verbally instruct Group B testers to think of the time constraint as a "reflection window" and note their reactions.

#### B3. Consumption Score Display: Numeric vs. Visual

| Group | Display | What We Measure |
|-------|---------|-----------------|
| **Group A** | Numeric score (e.g., "7/10") shown in item detail | Comprehension, perceived usefulness of the score |
| **Group B** | Visual indicator (e.g., color-coded bar/emoji scale) described verbally | Comprehension, perceived usefulness of the score |

**Hypothesis:** A visual indicator will be more immediately understandable and motivating than a raw number.

**How to execute:** Show Group B a mockup of a visual consumption score and ask for their preference after they've seen the numeric version.

---

### C. Core Feature/Benefit Evaluation

These tests evaluate whether Second Thought delivers on its core value proposition: **helping users be more mindful and intentional about their purchases**.

#### C1. "Fast Forward" Scenario - 6 Months of Usage

**Setup:** Use the pre-populated "seasoned user" test account (see [Section 7](#7-test-accounts--data)) that contains:
- 15-20 items across multiple categories (Electronics, Clothes, Home, Beauty, etc.)
- A mix of time-based and goals-based constraints
- Items with various consumption scores (2-9)
- Some items with past wait dates (simulating items the user already reflected on)
- Profile stats reflecting 6 months of usage

**Test Flow:**
1. Have the tester log in with the seasoned account
2. Ask them to browse the Home view and note the variety of items
3. Ask them to check the Timeline view to see how items are spread across months
4. Ask them to review the Profile statistics
5. Ask: *"If this were your account after 6 months, how would you feel about your purchasing habits? Does seeing this data change how you think about future purchases?"*

**What We Measure:**
- Does the accumulated data create a sense of awareness or accomplishment?
- Do users find the stats meaningful?
- What additional insights would users want from 6 months of data?

#### C2. Reflection Quality Evaluation

**Test Flow:**
1. Ask the tester to add a real item they have been considering purchasing
2. After completing the reflection questions, ask: *"Did any of these questions make you reconsider or think differently about this purchase?"*
3. Show them their consumption score and ask: *"Does this score feel accurate to you? Is it useful?"*

**What We Measure:**
- Do the AI-generated reflection questions feel relevant and thought-provoking?
- Does the consumption score resonate with the user's own assessment?
- Would this process actually change purchasing behavior?

#### C3. Value Proposition Testing - Savings & Environmental Impact

**Test Flow:**
1. Using the seasoned account, present the tester with the following scenario: *"Over the past 6 months, you added 18 items to Second Thought. Of those, you decided not to purchase 7 items after reflecting on them. That saved you approximately $430 and prevented an estimated 85 lbs of CO2 emissions."*
2. Ask: *"How does hearing that make you feel? Would seeing this kind of impact tracking motivate you to keep using the app?"*

**What We Measure:**
- Does quantified impact (money saved, environmental benefit) increase perceived value?
- Would users want this as a feature?
- Which metric is more motivating: financial savings or environmental impact?

#### C4. Browser Extension Convenience Evaluation

**Test Flow:**
1. Have the tester browse a shopping site (e.g., Amazon) without the extension and add an item via the web app
2. Then have them use the browser extension to add another item from a product page
3. Ask: *"How did the two experiences compare? Would having the extension make you more likely to use Second Thought in your daily browsing?"*

**What We Measure:**
- Does the extension meaningfully reduce friction?
- Is the extension a "must-have" or "nice-to-have"?

---

### D. Performance Testing

#### D1. Multiple Items Load Test

| Test | Action | Target | Actual | Pass/Fail |
|------|--------|--------|--------|-----------|
| D1a | Load Home view with 5 items | < 2 seconds | | |
| D1b | Load Home view with 20 items | < 3 seconds | | |
| D1c | Load Home view with 50+ items (seasoned account) | < 5 seconds | | |

#### D2. Concurrent Users

| Test | Action | Target | Actual | Pass/Fail |
|------|--------|--------|--------|-----------|
| D2a | 3 users simultaneously adding items | All saves succeed, no data loss | | |
| D2b | 3 users simultaneously loading Home view | All views render correctly | | |

**How to execute:** Have 3 testers log in to different accounts and perform the same action at a coordinated time.

#### D3. API Response Times

| Test | Action | Target | Actual | Pass/Fail |
|------|--------|--------|--------|-----------|
| D3a | URL metadata fetch (Microlink) | < 3 seconds | | |
| D3b | AI question generation (Claude API) | < 5 seconds | | |
| D3c | AI category detection (Claude API) | < 3 seconds | | |
| D3d | Item save to Supabase | < 2 seconds | | |

#### D4. Long-Term Data Accumulation

Using the seasoned user account with 50+ items:

| Test | Action | Target | Actual | Pass/Fail |
|------|--------|--------|--------|-----------|
| D4a | Timeline view renders all items correctly | All items visible, no overlap | | |
| D4b | Category filter works with many categories | Filtering is instant | | |
| D4c | Profile stats compute correctly | Accurate counts and averages | | |

---

## 4. Feedback Mechanism

### Primary Method: Google Form (Post-Session)

We will use a **Google Form** as our primary feedback mechanism. Each tester completes the form after their testing session.

**Form Structure:**

**Section 1 - Background**
1. How would you describe your relationship with online shopping? (Casual / Regular / Frequent / Compulsive)
2. Have you ever used any tools to manage spending or shopping habits? (Yes/No, if yes which ones?)

**Section 2 - First Impressions (1-5 scale: Strongly Disagree to Strongly Agree)**
3. The mission/landing page clearly communicated what the app does
4. The sign-up process was quick and easy
5. The walkthrough was helpful in understanding how to use the app

**Section 3 - Core Experience (1-5 scale)**
6. Adding an item was intuitive and straightforward
7. The reflection questions made me think more carefully about my purchase
8. The consumption score felt meaningful and accurate
9. I understood the difference between time-based and goals-based constraints
10. The Timeline view was easy to understand and navigate
11. The Goals view was easy to understand and navigate

**Section 4 - Value Proposition (1-5 scale)**
12. I can see myself using this app regularly
13. This app would help me make better purchasing decisions
14. The concept of a "waiting period" before purchasing is valuable
15. Seeing accumulated data over time would motivate me to continue using the app

**Section 5 - Open-Ended**
16. What was the most confusing or frustrating part of the experience?
17. What was your favorite feature or moment?
18. What one feature would you add to make this app more useful?
19. Any other comments or suggestions?

### Secondary Method: Observer Notes

A team member will sit near each tester and take **live notes** during the session, recording:
- Points where the user hesitates or looks confused
- Verbal reactions ("oh cool", "wait, what?", "I don't understand this")
- Navigation patterns (did they find features intuitively?)
- Time stamps for key actions (sign up, first item added, etc.)

**Observer Note Template:**

| Timestamp | Action/Observation | User Reaction | Severity (Low/Med/High) | Category (Bug/UX/Feature) |
|-----------|-------------------|---------------|------------------------|--------------------------|
| | | | | |

---

## 5. Intervention Policy

### Default Stance: Minimal Intervention

We will advise testers upfront:

> *"Please explore the app as you naturally would. If you get stuck, try your best to figure it out on your own -- watching where you struggle helps us improve. However, if you feel truly stuck or frustrated for more than 60 seconds, please let us know and we'll help."*

### When to Intervene

| Situation | Action |
|-----------|--------|
| Tester is stuck on sign-up for > 60 seconds | Provide guidance |
| Tester cannot find "Add Item" button | Let them explore for 30 seconds, then gently point it out |
| URL scraping fails or takes too long | Suggest trying "Skip" to enter manually |
| App crashes or shows error | Note the bug, help them recover, and continue |
| Tester tries to leave the app entirely | Redirect them to the next task |
| Tester has been idle for > 90 seconds | Ask if they need help or if they're done |

### Things We Will NOT Help With
- Finding navigation elements (we want to see if the UI is intuitive)
- Understanding what a feature does (we want to see if it's self-explanatory)
- Choosing between constraint types (we want to see which they gravitate toward)

---

## 6. Pre-Baked User Workflows

### Workflow 1: New User Journey (Recommended Starting Point)

> *"Start by reading the mission page, then create a new account. After completing the walkthrough, add an item you have been considering purchasing recently -- feel free to use a real product URL or enter details manually. Once you've added an item, explore the different views (All Items, Timeline, Goals) and check your profile. Plan on about 5-7 minutes."*

### Workflow 2: Seasoned User Exploration

> *"Log in with the provided 'seasoned user' credentials. This account has been in use for 6 months and has accumulated many items. Browse through the different views, check the profile statistics, and click into a few items to see their details. After exploring, add one new item of your own. Plan on about 4-5 minutes."*

### Workflow 3: Extension Quick-Add

> *"Install the Second Thought browser extension using the provided file. Then navigate to any product page on a shopping site (Amazon, Target, etc.) and use the extension to quickly add the item. Compare this experience to adding an item through the main web app. Plan on about 3-4 minutes."*

---

## 7. Test Accounts & Data

### Fresh Accounts (for new user testing)
Testers in Workflow 1 will create their own accounts during the test.

### Pre-Populated "Seasoned User" Accounts

Create **2 accounts** pre-loaded with data simulating 6 months of usage:

**Account: seasoned-tester-1@test.com**

| Item | Category | Constraint | Score | Date Added |
|------|----------|-----------|-------|------------|
| Sony WH-1000XM5 Headphones | Electronics | Time-Based (wait until March 2026) | 7 | Aug 2025 |
| Patagonia Better Sweater | Clothes | Goals-Based (Medium) | 5 | Aug 2025 |
| KitchenAid Stand Mixer | Home | Time-Based (wait until Oct 2025) | 8 | Sep 2025 |
| Nike Air Max 90 | Clothes | Goals-Based (Easy) | 4 | Sep 2025 |
| iPad Air M2 | Electronics | Time-Based (wait until Jan 2026) | 9 | Oct 2025 |
| The Ordinary Skincare Set | Beauty | Goals-Based (Easy) | 3 | Oct 2025 |
| Hydro Flask Water Bottle | Accessories | Time-Based (wait until Nov 2025) | 2 | Oct 2025 |
| Lululemon Yoga Mat | Sports | Goals-Based (Hard) | 6 | Nov 2025 |
| MacBook Pro M4 | Electronics | Time-Based (wait until Apr 2026) | 9 | Nov 2025 |
| Dyson V15 Vacuum | Home | Goals-Based (Medium) | 7 | Dec 2025 |
| Allbirds Wool Runners | Clothes | Time-Based (wait until Feb 2026) | 5 | Dec 2025 |
| AirPods Pro 3 | Electronics | Goals-Based (Hard) | 8 | Jan 2026 |
| Glossier Boy Brow | Beauty | Time-Based (wait until Mar 2026) | 2 | Jan 2026 |
| Standing Desk Converter | Home | Goals-Based (Medium) | 6 | Jan 2026 |
| Ray-Ban Meta Smart Glasses | Accessories | Time-Based (wait until May 2026) | 8 | Feb 2026 |

**Account: seasoned-tester-2@test.com** -- Same structure with different items for variety.

### Account Prep Checklist
- [ ] Create accounts in Supabase
- [ ] Insert items with backdated `created_at` timestamps
- [ ] Verify all items render correctly in all views
- [ ] Verify profile stats calculate correctly
- [ ] Test sign-in flow for each account

---

## 8. Post-Testing Debrief

After all testers have completed their sessions:

### Immediate Actions (Same Day)
1. Collect all Google Form responses
2. Compile all observer notes
3. Hold a 15-minute team debrief to discuss standout observations

### Analysis & Issue Creation (Within 48 Hours)
1. **Quantitative Analysis:** Aggregate form scores, calculate averages, identify lowest-rated areas
2. **Qualitative Analysis:** Group open-ended responses by theme
3. **Issue Triage:** Create GitHub issues for actionable findings, labeled as:
   - `bug` -- Something broken
   - `ux-improvement` -- Usability friction
   - `feature-request` -- User-requested new functionality
   - `a/b-result` -- Insight from A/B testing
4. **Priority Matrix:** Rank issues by impact (how many testers mentioned it) x effort (how hard to fix)

### Success Metrics
We will consider testing successful if we:
- [x] Complete testing with at least 5 testers
- [x] Identify at least 3 actionable UX improvements
- [x] Validate or invalidate at least 1 A/B hypothesis
- [x] Gather evidence on whether the core value proposition resonates
- [x] Create a prioritized backlog of improvements from real user feedback
