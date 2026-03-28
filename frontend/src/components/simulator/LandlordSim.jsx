import React, { useState } from 'react'
import Button from '../ui/Button'

// ─────────────────────────────────────────────────────────────────────────────
// GAME DATA
// Each scenario has a pool of 8 rounds. Each game randomly picks 4 from the pool
// so replays always feel different. Options are stored best→worst; they get
// shuffled before display so the best answer is never always option A.
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'security_deposit',
    label: 'Security Deposit Dispute',
    icon: '💰',
    summary: 'Your landlord is withholding your full $1,500 deposit with vague deductions.',
    laws: [
      { title: 'N.J.S.A. 46:8-21.1 — 30-Day Return Rule', body: 'Landlord must return the deposit (or send an itemized list of deductions) within 30 days of move-out. Failure means the tenant can sue for double the deposit.' },
      { title: 'Max Deposit — 1.5× Monthly Rent', body: 'NJ caps security deposits at 1.5 months rent for most tenants. Excess amounts must be returned.' },
      { title: 'Ordinary Wear & Tear', body: 'Landlords cannot deduct for normal wear and tear — only actual damage beyond normal use. Routine repainting or cleaning after a long tenancy is typically the landlord\'s cost.' },
    ],
    rounds: [
      {
        landlord: 'I\'m keeping your entire $1,500 security deposit for cleaning and repairs.',
        hint: 'NJ law requires a written, itemized list within 30 days. Ask for that specifically — it puts the burden back on them.',
        options: [
          { text: 'Please provide an itemized written list of all deductions within 30 days as required by N.J.S.A. 46:8-21.1. I\'d like to review each charge.', points: 10, feedback: 'Perfect. You cited the exact statute and made a specific, documented request. This puts legal pressure on the landlord.' },
          { text: 'Can you send me a written breakdown of what you\'re deducting and why?', points: 7, feedback: 'Good — you asked for details in writing. Citing NJ law directly would have strengthened your position further.' },
          { text: 'That doesn\'t seem right. The apartment was in good condition when I left.', points: 4, feedback: 'Too vague. State what you want (an itemized list) and the legal basis for it.' },
          { text: 'That\'s not fair! I want my deposit back right now.', points: 1, feedback: 'Emotional responses weaken your position. Stay specific and cite the law.' },
        ],
      },
      {
        landlord: 'The cleaning alone cost $800. I had to hire a professional service.',
        hint: 'Ask for the receipt. Normal end-of-tenancy cleaning is ordinary wear and tear — not chargeable in NJ.',
        options: [
          { text: 'Please send me the cleaning receipt. Note that end-of-tenancy cleaning due to normal occupancy is considered ordinary wear and tear in NJ and is typically not deductible.', points: 10, feedback: 'Excellent. You requested documentation and applied the wear-and-tear rule — exactly the right legal frame.' },
          { text: 'Was the unit unusually dirty, or is this for routine cleaning? NJ courts distinguish between wear and tear and actual damage.', points: 7, feedback: 'Good framing. Asking for the receipt directly would have been even stronger.' },
          { text: '$800 for cleaning sounds excessive. Do you have a receipt?', points: 4, feedback: 'Reasonable, but you missed the opportunity to cite the wear-and-tear rule.' },
          { text: 'I cleaned the apartment myself before I left!', points: 1, feedback: 'A personal claim without evidence. Focus on the legal standard instead.' },
        ],
      },
      {
        landlord: 'I also need to repaint the entire unit. That\'s another $600.',
        hint: 'Courts expect landlords to repaint periodically. Ask how long you lived there — after 2-3 years, repainting is normal landlord upkeep.',
        options: [
          { text: 'NJ courts generally hold that repainting after normal occupancy is the landlord\'s responsibility. I\'ve lived here for [X] years — routine repainting is expected upkeep, not damage from my tenancy.', points: 10, feedback: 'Strong. Length of tenancy is key evidence — longer tenancy = more expected normal wear on paint.' },
          { text: 'Was the paint damaged beyond normal use? Routine repainting after a tenancy is usually the landlord\'s cost under NJ law.', points: 7, feedback: 'Correct principle. Personalizing it with your tenancy length would have been more persuasive.' },
          { text: 'I didn\'t damage the paint.', points: 4, feedback: 'True, but unverifiable. Apply the legal standard: repainting is ordinary wear and tear.' },
          { text: 'You can\'t charge me for painting!', points: 1, feedback: 'Too combative and unsupported. Cite the legal reason, not just your objection.' },
        ],
      },
      {
        landlord: 'Final decision: I\'m returning only $200 of your deposit.',
        hint: 'Paying under protest preserves your right to sue. Small claims court in NJ lets you recover double the improperly withheld amount.',
        options: [
          { text: 'I dispute these deductions. I\'m sending a certified letter today requesting full documentation. If unresolved, I\'ll file in small claims court to recover the balance — and potentially double the withheld amount under NJ law.', points: 10, feedback: 'Perfect escalation. Certified mail creates a paper trail. Mentioning double damages shows you know the law.' },
          { text: 'I\'ll accept this payment under protest and document my dispute in writing before pursuing further action.', points: 7, feedback: 'Good — "under protest" is a real legal term that preserves your rights. Strong choice.' },
          { text: 'I\'m not satisfied with $200. I think you owe me much more.', points: 4, feedback: 'States your position but gives no consequence. What will you actually do?' },
          { text: 'Keep your $200 — this isn\'t worth fighting over.', points: 1, feedback: 'Giving up entirely leaves money on the table that the law may entitle you to.' },
        ],
      },
      {
        landlord: 'I have photos from the move-out inspection showing damage throughout the unit.',
        hint: 'Ask for those photos and compare them to the move-in inspection checklist you both signed. Damage pre-existing at move-in cannot be charged to you.',
        options: [
          { text: 'I\'d like copies of those photos, please, along with the signed move-in inspection checklist. Any deductions must be compared against the unit\'s documented condition at move-in — damage that existed before my tenancy is not my liability.', points: 10, feedback: 'Excellent. The move-in checklist is the legal baseline. Requesting both creates a clear comparison the landlord must address.' },
          { text: 'Can you share those photos? I want to compare them against how the unit looked when I moved in.', points: 7, feedback: 'Good direction. Specifically requesting the move-in checklist would have made this stronger.' },
          { text: 'Photos don\'t necessarily show who caused the damage or when it happened.', points: 4, feedback: 'True point, but passive. Put the move-in checklist on the table as your counter-evidence.' },
          { text: 'Those photos could have been taken any time.', points: 1, feedback: 'Sounds evasive. Ask for both sets of documentation and let the comparison speak for itself.' },
        ],
      },
      {
        landlord: 'You didn\'t return all the keys — I had to rekey the entire building.',
        hint: 'Ask for evidence you failed to return keys. Also: do they rekey between every tenant as standard practice? If so, that\'s a normal operating cost, not your fault.',
        options: [
          { text: 'Do you have a signed move-out form documenting that keys were not returned? I have no record of that. Also, do you routinely rekey between tenants as a security practice? Standard turnover rekeying is a normal operating expense, not a deductible damage charge.', points: 10, feedback: 'Strong. You asked for documentation and applied the wear-and-tear principle to rekeying. Both are the right moves.' },
          { text: 'I returned all keys at move-out. Do you have a signed record showing otherwise?', points: 7, feedback: 'Good — shift the burden of proof back. Raising the routine rekeying point would have added another angle.' },
          { text: 'I\'m pretty sure I returned all the keys at move-out.', points: 4, feedback: '"Pretty sure" invites doubt. Assert it clearly and ask for their documentation.' },
          { text: 'I definitely gave back every key!', points: 1, feedback: 'A strong personal claim but no ask for evidence. Push them to document their assertion.' },
        ],
      },
      {
        landlord: 'Your pet caused significant carpet damage — I\'m replacing the entire unit.',
        hint: 'Carpet has a useful life. If it was already several years old, you only owe for the remaining depreciated value — not the full replacement cost of new carpet.',
        options: [
          { text: 'How old was the carpet when I moved in? NJ courts apply depreciation — if the carpet was already 4–5 years old, its remaining useful life may be minimal. The deduction should reflect the depreciated value, not full replacement cost. Please provide documentation of the carpet\'s age and the actual repair invoice.', points: 10, feedback: 'Perfect. Depreciation is the key legal principle — you applied it precisely and asked for the documentation to verify it.' },
          { text: 'Carpet has a finite useful life — if it was already worn when I moved in, the charge should reflect its depreciated value, not full new-carpet cost.', points: 7, feedback: 'Correct principle. Asking for documentation of the carpet\'s age would have made it actionable.' },
          { text: 'Replacing the entire unit of carpet for one pet seems excessive. Can you itemize the actual damage?', points: 4, feedback: 'Reasonable, but you missed the stronger depreciation argument that limits what you legally owe.' },
          { text: 'My pet never damaged the carpet!', points: 1, feedback: 'A bare denial with no legal framework. Even if true, focus on what they can legally charge — depreciated value, not full replacement.' },
        ],
      },
      {
        landlord: 'You left furniture behind — I paid $300 to have it hauled away.',
        hint: 'Check your move-out inspection paperwork. If nothing was flagged at that walkthrough, disputing the charge now is much stronger. Also ask for the disposal receipt.',
        options: [
          { text: 'Was furniture noted at our move-out inspection? If not, charging for it now is problematic. I\'d also like the receipt from the removal service — the charge must reflect actual cost and market rates for that service.', points: 10, feedback: 'Perfect two-part challenge: the inspection record is the timeline anchor, and the receipt verifies the dollar amount.' },
          { text: 'Can you provide the removal receipt? And was this flagged at the move-out walkthrough?', points: 7, feedback: 'Good — both questions are right. Framing the inspection omission as procedurally problematic would have been stronger.' },
          { text: 'I don\'t think I left anything significant behind.', points: 4, feedback: 'Your recollection matters less than the documentation. Ask for the inspection report and receipt.' },
          { text: 'That\'s not even my furniture!', points: 1, feedback: 'A claim without evidence. Focus on the documentation chain: what does the move-out inspection say?' },
        ],
      },
    ],
  },

  {
    id: 'illegal_entry',
    label: 'Landlord Entered Without Notice',
    icon: '🚪',
    summary: 'Your landlord entered your unit yesterday without giving any advance notice.',
    laws: [
      { title: 'Implied Covenant of Quiet Enjoyment', body: 'NJ courts recognize tenants\'s right to peaceful possession of their unit. Repeated unauthorized entries can constitute a breach of this covenant.' },
      { title: '24-Hour Notice Standard', body: 'While NJ statute doesn\'t specify an exact number, courts and housing authorities recognize 24 hours as reasonable notice except in genuine emergencies.' },
      { title: 'Constructive Eviction', body: 'If a landlord repeatedly violates your right to quiet enjoyment, a court may find constructive eviction — allowing you to terminate the lease without penalty.' },
    ],
    rounds: [
      {
        landlord: 'I came by yesterday to check on a maintenance issue. I have the right to enter my property.',
        hint: 'You\'re not denying their access rights — just the lack of notice. Frame it as wanting a proper process, not a confrontation.',
        options: [
          { text: 'You do have the right to enter, but NJ recognizes a tenant\'s right to reasonable advance notice — typically 24 hours — except in emergencies. Was this an emergency? If not, can we agree on a notice process going forward?', points: 10, feedback: 'Excellent. You acknowledged their rights, applied the legal standard, and proposed a solution.' },
          { text: 'I understand you need access, but I\'d appreciate 24 hours notice before entry. Can we set up a better process?', points: 7, feedback: 'Good tone and direction. Citing the legal basis explicitly would have been stronger.' },
          { text: 'You should have told me you were coming.', points: 4, feedback: 'Correct sentiment but no legal basis or proposed solution.' },
          { text: 'You can\'t just walk in whenever you want!', points: 1, feedback: 'Combative with no legal grounding. This puts you on the defensive.' },
        ],
      },
      {
        landlord: 'This is my property and I need to be able to inspect it freely.',
        hint: 'Offer to cooperate on access — make it about process, not refusing entry. This shows good faith.',
        options: [
          { text: 'Absolutely — you have inspection rights under our lease. NJ law supports entry with proper notice. I\'m happy to schedule a convenient time with 24 hours notice. Can we agree on that going forward in writing?', points: 10, feedback: 'Perfect. You agreed with their legal right, applied NJ standard, proposed a solution, and asked for it in writing.' },
          { text: 'I agree you can inspect. I just need advance notice. Let\'s schedule something.', points: 7, feedback: 'Good cooperative tone. Getting it in writing would have locked in the agreement.' },
          { text: 'I\'d appreciate being notified before you come over.', points: 4, feedback: 'Polite but passive — not specific enough to change behavior.' },
          { text: 'I don\'t want you in my apartment unannounced.', points: 1, feedback: 'Sounds like you\'re refusing access, which you can\'t legally do. Reframe around notice, not refusal.' },
        ],
      },
      {
        landlord: 'I\'ve come by three times this month. I don\'t think that\'s excessive.',
        hint: 'Three unannounced entries in one month is a pattern. Document each one — dates, times, what happened. This builds a quiet enjoyment violation record.',
        options: [
          { text: 'Three entries in one month without notice is a pattern that may constitute a violation of my right to quiet enjoyment under NJ law. I\'m documenting these incidents. I\'d prefer to resolve this informally — can we agree on a schedule?', points: 10, feedback: 'Strong. You named the legal doctrine, announced documentation (a deterrent), and still offered resolution.' },
          { text: 'That frequency is very disruptive. I\'d like us to formally agree on a schedule for necessary access.', points: 7, feedback: 'Good — frequency + formal agreement request. Naming the legal doctrine would have added leverage.' },
          { text: 'Three times in a month is a lot. It\'s making me uncomfortable.', points: 4, feedback: 'Personal discomfort is real, but legal grounds are more persuasive.' },
          { text: 'Stop coming to my apartment!', points: 1, feedback: 'Sounds like you\'re refusing legitimate access. Very counterproductive.' },
        ],
      },
      {
        landlord: 'I\'ll try to give more notice, but I can\'t make any promises.',
        hint: '"I\'ll try" is not an agreement. Get it in writing — even a text or email counts as documentation.',
        options: [
          { text: 'I\'d like a written agreement — even an email confirming that 24-hour notice will be given going forward. If unannounced entries continue, I\'ll need to formally document them as violations of my quiet enjoyment rights.', points: 10, feedback: 'Perfect escalation. Written confirmation + named consequence creates a real deterrent.' },
          { text: 'Can we put a 24-hour notice requirement in writing? Even a text message would work as confirmation.', points: 7, feedback: 'Good — getting it documented protects you. Naming the legal consequence would have been stronger.' },
          { text: '"Try" isn\'t enough. I need a real commitment here.', points: 4, feedback: 'States the problem but doesn\'t propose a solution or consequence.' },
          { text: 'If you don\'t promise, I\'ll call the police next time.', points: 1, feedback: 'Police generally don\'t intervene in civil landlord-tenant disputes. This is an empty threat that damages your relationship.' },
        ],
      },
      {
        landlord: 'I came by to show the apartment to a prospective tenant.',
        hint: 'Showing to prospective tenants still requires advance notice — you\'re still occupying the unit. Your right to quiet enjoyment doesn\'t pause for lease-end showings.',
        options: [
          { text: 'I\'m still the occupying tenant and my right to quiet enjoyment applies until my lease ends — including for prospective tenant showings. I\'m happy to accommodate viewings with 24 hours advance notice. Can we set up a schedule?', points: 10, feedback: 'Perfect. You correctly applied quiet enjoyment to showings and offered a cooperative path forward.' },
          { text: 'Showings require notice too — I\'m still living here. Let\'s schedule them in advance with at least 24 hours notice.', points: 7, feedback: 'Good framing. Citing quiet enjoyment explicitly would have grounded it in law.' },
          { text: 'I wish you had let me know first. The apartment wasn\'t ready for visitors.', points: 4, feedback: 'Personal inconvenience is real, but the legal right to notice is a stronger argument.' },
          { text: 'Don\'t bring strangers into my home without asking!', points: 1, feedback: 'Emotional and combative. State your legal right to notice and offer to cooperate instead.' },
        ],
      },
      {
        landlord: 'The building super checks all units monthly — it\'s standard building procedure.',
        hint: '"Standard practice" doesn\'t override your legal notice rights. Monthly inspections still require advance notice. Offer to agree on a regular scheduled time.',
        options: [
          { text: 'Standard building procedure doesn\'t override my right to reasonable advance notice. If monthly access is needed, I\'m happy to set up a regular scheduled time with proper notice — say, first Tuesday of each month at 10am. Would that work? I\'d like that confirmed in writing.', points: 10, feedback: 'Excellent. You rejected the "standard practice" deflection, stayed cooperative, and proposed a concrete written solution.' },
          { text: 'Monthly inspections are fine with me, but I still need advance notice. Can we set a regular scheduled time?', points: 7, feedback: 'Good cooperative approach. Pushing back on "standard practice" as a legal deflection would have been stronger.' },
          { text: 'I didn\'t know that was happening. I\'d like to know when someone will be in my unit.', points: 4, feedback: 'Reasonable, but passive. Make a specific ask: a scheduled time and written notice.' },
          { text: 'The super isn\'t allowed in my apartment without my permission!', points: 1, feedback: 'Legally wrong — the landlord does have inspection rights. You\'re entitled to notice, not refusal.' },
        ],
      },
      {
        landlord: 'There was a plumbing emergency — the plumber needed immediate access.',
        hint: 'Genuine emergencies are the legal exception to notice requirements. Acknowledge that — but ask what the emergency was, and request same-day notification going forward for any emergency entries.',
        options: [
          { text: 'Genuine emergencies are a valid exception and I completely understand that. Could you tell me what the specific emergency was? And going forward, could you send me a same-day text whenever there\'s an emergency entry — even after the fact? That keeps me informed without slowing down your response.', points: 10, feedback: 'Perfect. You accepted the exception, asked for specifics, and proposed a practical notification system — professional and cooperative.' },
          { text: 'I understand emergencies are different. Can you notify me by text immediately after any emergency entry, even if you can\'t give advance notice?', points: 7, feedback: 'Good — after-the-fact notification is a reasonable ask. Asking what the emergency was would have verified it was genuine.' },
          { text: 'Was it really an emergency? I didn\'t notice any water damage when I got home.', points: 4, feedback: 'Skepticism is reasonable, but ask directly rather than implying they\'re lying.' },
          { text: 'Emergency or not, you should have called me first!', points: 1, feedback: 'That\'s not how emergencies work. In a genuine emergency, the landlord\'s duty is to stop the damage — not reach you first.' },
        ],
      },
      {
        landlord: 'I only entered to fix the maintenance issue you reported yourself.',
        hint: 'Requesting a repair doesn\'t give open-ended or unscheduled access. Ask them to confirm a time window going forward so you can choose to be present.',
        options: [
          { text: 'I appreciate the repair, but even for requested maintenance, I\'d like a confirmed time window so I can choose whether to be present. Going forward, can we agree that repair visits include at least a same-day text with the arrival window?', points: 10, feedback: 'Excellent. You acknowledged the legitimacy of the entry while establishing a reasonable process for the future.' },
          { text: 'I did report the issue — I just would have liked to know when the repair was happening. Can we agree on advance notice for future maintenance visits?', points: 7, feedback: 'Good and cooperative. Specifying what "advance notice" means (same-day text, 24 hours) would have been more actionable.' },
          { text: 'I would have liked to be home for the repair. Please let me know next time.', points: 4, feedback: 'Polite, but doesn\'t create a real agreement. Ask for a process, not just a preference.' },
          { text: 'That still doesn\'t give you the right to just show up unannounced.', points: 1, feedback: 'Technically true, but sounds combative about a repair you asked for. Redirect to process, not grievance.' },
        ],
      },
    ],
  },

  {
    id: 'excessive_late_fee',
    label: 'Challenge an Excessive Late Fee',
    icon: '📅',
    summary: 'Your rent was 3 days late and your landlord is charging a $150 late fee.',
    laws: [
      { title: 'No Statutory Cap, But Courts Apply Reasonableness', body: 'NJ has no explicit late fee cap, but courts void fees that function as "penalties" rather than compensation for actual damages. Proportionality to rent is key.' },
      { title: 'Daily Late Fees Frequently Struck Down', body: 'NJ courts regularly void per-day late fees as penalty clauses. Flat fees are more likely to be enforced.' },
      { title: 'Grace Period Matters', body: 'A 5-day grace period + flat fee is more likely to be upheld. Fees without any grace period are more vulnerable to challenge.' },
    ],
    rounds: [
      {
        landlord: 'Your rent was 3 days late, so there\'s a $150 late fee per the lease.',
        hint: '$150 on a typical rent (say $1,500) is 10% — NJ courts look at proportionality. Ask what their actual cost was from your late payment.',
        options: [
          { text: 'I\'d like to review that clause. NJ courts have voided late fees that are disproportionate to the landlord\'s actual costs. What were your actual damages from a 3-day delay? A $150 fee may not survive a legal challenge.', points: 10, feedback: 'Excellent. "Actual damages" is the NJ legal standard — you framed this perfectly.' },
          { text: 'That seems disproportionate. What\'s the actual cost to you from a 3-day late payment?', points: 7, feedback: 'Good question — puts them on the spot. Citing the legal standard explicitly would have been stronger.' },
          { text: 'That fee is too high. I\'ve never been late before.', points: 4, feedback: 'Good-faith argument, but personal history doesn\'t change the legal analysis.' },
          { text: 'I\'m not paying that fee.', points: 1, feedback: 'Refusing to engage invites escalation. Make a legal argument instead.' },
        ],
      },
      {
        landlord: 'The lease says $150. You agreed to it when you signed.',
        hint: 'Signing a lease doesn\'t waive statutory protections. Unconscionable or penalty clauses are unenforceable in NJ even if signed.',
        options: [
          { text: 'Signing a lease doesn\'t waive legal protections. NJ courts can void lease clauses that impose penalties rather than compensate for actual losses. I\'m willing to pay a reasonable fee — but not one a court would likely find unenforceable.', points: 10, feedback: 'Strong. "Void as a penalty" is the correct legal doctrine — you named it directly.' },
          { text: 'A signed lease can still contain unenforceable clauses under NJ law. I\'d like to pay a fair late fee, but $150 seems excessive for 3 days.', points: 7, feedback: 'Correct principle. Being more specific about penalty clauses vs. actual damages would have been stronger.' },
          { text: 'The lease might say that, but it doesn\'t mean it\'s legal.', points: 4, feedback: 'True but vague. Explain why it might not be legal.' },
          { text: 'The lease is wrong then.', points: 1, feedback: 'This sounds adversarial without explanation. Provide the legal basis.' },
        ],
      },
      {
        landlord: 'Every other tenant pays this fee without complaining.',
        hint: 'What other tenants do has no bearing on your legal rights. Redirect to resolution — offer to pay a proportionate amount.',
        options: [
          { text: 'Other tenants\' choices don\'t affect my legal rights. I\'d prefer to settle this without involving housing court. Would you consider reducing the fee to reflect your actual administrative cost from the late payment?', points: 10, feedback: 'Perfect redirect. You rejected the irrelevant comparison and offered a concrete path to resolution.' },
          { text: 'I\'m willing to pay something — but I\'d like the fee to reflect a reasonable cost rather than a penalty. Can we agree on a lower amount?', points: 7, feedback: 'Good offer. Mentioning the legal risk to them would have added leverage.' },
          { text: 'That\'s not my concern. I still think the fee is too high.', points: 4, feedback: 'Holds your ground but offers no path forward.' },
          { text: 'I\'ll complain about it then.', points: 1, feedback: 'An empty threat. Be specific about what you\'ll actually do.' },
        ],
      },
      {
        landlord: 'Final answer: pay $150 or I\'ll consider you in breach of lease.',
        hint: 'Pay under protest to avoid a breach. That phrase preserves your right to sue later without accepting the fee as valid.',
        options: [
          { text: 'I\'ll pay under protest and note in writing that I dispute the enforceability of this clause. I\'m also consulting a tenant rights organization about this fee. Please provide a receipt noting the payment is made under protest.', points: 10, feedback: 'Excellent. "Under protest" is a real legal term. Consulting a tenant org and getting a receipt both protect your future options.' },
          { text: 'I\'ll pay it this time under protest, but I want to formally dispute this clause going forward.', points: 7, feedback: 'Solid — payment under protest is the right move. Following up formally matters.' },
          { text: 'Fine, I\'ll pay it — but this isn\'t over.', points: 4, feedback: 'You\'re paying but losing the "under protest" protection that preserves your rights.' },
          { text: 'Then I guess I\'m in breach!', points: 1, feedback: 'Never accept a breach finding — it can lead to eviction. Pay under protest instead.' },
        ],
      },
      {
        landlord: 'The $150 covers my administrative costs for processing a late payment.',
        hint: 'Ask them to itemize what $150 in administrative costs actually consists of. NJ courts ask whether the fee reflects real costs — not a flat penalty dressed up as "admin."',
        options: [
          { text: 'Can you itemize the specific administrative costs that make up $150? NJ courts evaluate whether late fees represent actual costs or function as penalties. A fee that far exceeds any real administrative burden is the type of clause courts have voided.', points: 10, feedback: 'Excellent. "Itemize" puts the burden on them. Naming the penalty-clause doctrine shows you know the law.' },
          { text: 'What specifically costs $150 to administer? I\'d like to understand what that fee covers.', points: 7, feedback: 'Good question — puts them on the spot. Connecting it to the NJ penalty-clause standard would have added legal weight.' },
          { text: '$150 seems like a lot for administrative work on a 3-day delay.', points: 4, feedback: 'Reasonable, but frames it as opinion. Ask for itemization to make it objective.' },
          { text: 'There are no real administrative costs — that\'s not a valid reason.', points: 1, feedback: 'May be true, but sounds combative and unsubstantiated. Ask them to prove it rather than dismissing it.' },
        ],
      },
      {
        landlord: 'This is the third time you\'ve been late this year. My patience has limits.',
        hint: 'Your payment history doesn\'t make an unenforceable fee enforceable. Keep the conversation on the legal validity of the fee amount, not your record.',
        options: [
          { text: 'I hear you, and I\'m taking steps to ensure on-time payment going forward. That said, my payment history doesn\'t change the legal question of whether a $150 fee is proportionate to actual damages. Can we settle on a more reasonable amount for this instance?', points: 10, feedback: 'Perfect. You acknowledged the pattern without accepting it as a justification for an unenforceable fee.' },
          { text: 'I understand your frustration, and I\'m addressing the pattern. But the fee amount should still reflect actual costs rather than a penalty. Can we agree on something more proportionate?', points: 7, feedback: 'Good. Mentioning the penalty-clause doctrine would have added legal backing to your request.' },
          { text: 'I know I\'ve been late a few times, and I\'m sorry. But $150 is still too much.', points: 4, feedback: 'Apologizing undermines your position. Acknowledge the pattern, but don\'t let it justify an excessive fee.' },
          { text: 'My payment history is my own business.', points: 1, feedback: 'Dismissive — and also not true. Your history is part of your lease relationship. Redirect to the fee\'s proportionality instead.' },
        ],
      },
      {
        landlord: 'The lease actually charges $25 per day after the grace period. You owe $75.',
        hint: 'Daily late fees are one of the most frequently voided clauses in NJ courts. This is a strong argument in your favor — name it directly.',
        options: [
          { text: 'Per-day late fees are among the most frequently voided clauses in NJ courts — they\'re characterized as penalty provisions with no relationship to actual administrative costs. I won\'t be paying a daily fee as written. I\'m willing to pay a flat, proportionate amount for the delay.', points: 10, feedback: 'Strong. Naming the specific clause type that NJ courts void most often is exactly the right approach.' },
          { text: 'Daily late fees have a poor track record in NJ courts — they\'re often treated as unenforceable penalties. Can we discuss a flat fee alternative?', points: 7, feedback: 'Correct principle. Offering a specific alternative amount would have moved the conversation toward resolution.' },
          { text: 'A daily fee seems really aggressive. Is that actually enforceable?', points: 4, feedback: 'Good instinct — but you already know the answer. Assert it rather than asking.' },
          { text: 'I\'m definitely not paying $25 a day!', points: 1, feedback: 'Refusal without a legal basis. State why the clause is unenforceable.' },
        ],
      },
      {
        landlord: 'I\'ll just deduct these late fees from your security deposit when you move out.',
        hint: 'If you\'re formally disputing the fee now, deducting it from your deposit later while it\'s in dispute is improper. Put your dispute in writing today.',
        options: [
          { text: 'I\'m disputing this fee in writing today. Deducting a disputed charge from my deposit while I\'ve formally challenged it would be improper under NJ deposit return rules — it could expose you to a claim for double the withheld amount. Please note my dispute in your records.', points: 10, feedback: 'Perfect. Written dispute + citing double-deposit penalty gives you real leverage against a deposit deduction later.' },
          { text: 'I\'m formally disputing this fee. Applying it to my deposit while it\'s in dispute could violate NJ security deposit rules.', points: 7, feedback: 'Correct legal point. Mentioning the double-deposit penalty would have made the consequence concrete.' },
          { text: 'I\'d rather resolve this now than fight over my deposit later.', points: 4, feedback: 'Reasonable preference but no legal argument. Put your dispute in writing now to protect your deposit.' },
          { text: 'You can\'t touch my security deposit!', points: 1, feedback: 'Actually they can — for legitimate deductions. The issue is whether this fee is legitimate. Dispute it in writing.' },
        ],
      },
    ],
  },

  {
    id: 'repairs_ignored',
    label: 'Landlord Ignoring Needed Repairs',
    icon: '🔧',
    summary: 'You reported a broken heater two weeks ago and have gotten no response.',
    laws: [
      { title: 'Implied Warranty of Habitability', body: 'NJ landlords are legally required to maintain rental units in habitable condition. Heat is explicitly a habitability requirement in NJ.' },
      { title: 'Repair-and-Deduct', body: 'After giving the landlord a reasonable opportunity to repair, NJ tenants may hire a licensed contractor and deduct the cost from rent (with documentation).' },
      { title: 'Rent Escrow (Housing Court)', body: 'Tenants can file in housing court to place rent in escrow. Funds are held until repairs are made — a powerful pressure tool.' },
    ],
    rounds: [
      {
        landlord: 'I\'m aware of the heating issue. I\'ll get to it when I can.',
        hint: 'Heat is a legal habitability requirement — not a preference. Set a firm timeline and name the legal remedies available to you.',
        options: [
          { text: 'Heating is a habitability requirement under NJ law. I need a confirmed repair date in writing. If it\'s not resolved within 7 days, I may be entitled to repair-and-deduct or apply for rent escrow through housing court.', points: 10, feedback: 'Perfect. You named the legal standard, set a deadline, and listed your actual remedies.' },
          { text: 'Heat is essential — especially now. Can you give me a specific repair date in writing?', points: 7, feedback: 'Good urgency. Mentioning your legal remedies would have added real leverage.' },
          { text: 'I\'ve been waiting two weeks. When exactly will this be fixed?', points: 4, feedback: 'Reasonable, but no legal pressure. The landlord can still delay without consequence in your framing.' },
          { text: 'This is ridiculous. Fix it now!', points: 1, feedback: 'Emotional demands are easy to dismiss. Apply the legal standard instead.' },
        ],
      },
      {
        landlord: 'My contractor is busy. It might be a few more weeks.',
        hint: 'Time to put it in writing. A formal repair request letter starts the clock on your legal remedies. Certified mail is best.',
        options: [
          { text: 'A few more weeks without heat violates the implied warranty of habitability. I\'m sending a certified formal repair request today. If not resolved within 7 days, I will file for rent escrow with housing court under NJ tenant statutes.', points: 10, feedback: 'Excellent. Certified mail + a specific deadline + naming the exact legal remedy is exactly right.' },
          { text: 'I understand contractors get busy, but this is a health and safety issue. I\'m sending a written repair request today with a 7-day deadline.', points: 7, feedback: 'Good — written request is essential. Naming the legal consequence would have added pressure.' },
          { text: 'A few more weeks is too long. Can you find a different contractor?', points: 4, feedback: 'Reasonable ask but no legal basis for urgency.' },
          { text: 'I\'m not paying rent until this is fixed!', points: 1, feedback: 'Unilaterally withholding rent without going through housing court can lead to an eviction filing against you — even if you\'re right on the merits.' },
        ],
      },
      {
        landlord: 'I told you, I\'m working on it. Stop bothering me about this.',
        hint: 'Document everything. Keep a log with dates and what was said. This becomes evidence if you go to housing court.',
        options: [
          { text: 'I\'m keeping a written record of all our communications about this repair. I\'m giving you formal written notice today: if heat is not restored within 7 days, I\'ll file for rent escrow with housing court.', points: 10, feedback: 'Perfect. Announcing documentation changes behavior. A specific deadline + named legal action makes this real.' },
          { text: 'I\'m sending a certified letter outlining the repair issue and timeline. Can you confirm when a contractor will be there?', points: 7, feedback: 'Good — documentation is key. Naming the legal consequence of non-compliance would have been stronger.' },
          { text: 'I have to follow up — this is affecting my daily life and I have a right to heat.', points: 4, feedback: 'True, but framed as personal rather than legal. The warranty of habitability is the right handle here.' },
          { text: 'I\'ll call the housing inspector on you!', points: 1, feedback: 'Actually valid — but blurting it out as a threat may escalate unnecessarily. Frame it as a neutral step you\'re taking, not a punishment.' },
        ],
      },
      {
        landlord: 'Look, I\'ll try to have someone there by next week.',
        hint: '"I\'ll try" isn\'t a commitment. Ask for a specific date and time, in writing. Lock it down.',
        options: [
          { text: 'Please confirm the specific date and time in writing. If I don\'t hear from your contractor within 48 hours to schedule, I\'ll hire a licensed HVAC contractor myself and deduct the cost from rent as permitted under NJ law.', points: 10, feedback: 'Perfect. A concrete confirmation deadline + the specific legal remedy (repair-and-deduct) shows you\'re serious.' },
          { text: 'Can you confirm the date in writing? I need to know when to be home — and I need a firm commitment.', points: 7, feedback: 'Getting it in writing is right. Naming what happens if they don\'t follow through would have been stronger.' },
          { text: 'Okay, but if it doesn\'t happen, I\'ll have to escalate.', points: 4, feedback: 'Vague — "escalate" to what? Be specific so the landlord takes the threat seriously.' },
          { text: 'About time! Make sure it actually happens.', points: 1, feedback: 'No confirmation, no documentation, no consequence — the landlord has no reason to treat this as binding.' },
        ],
      },
      {
        landlord: 'The heating system is old. Replacement parts can take weeks to source.',
        hint: 'Supply chain issues don\'t pause your habitability rights. Ask what interim solution they\'re providing — portable heaters, rent reduction, or temporary accommodation.',
        options: [
          { text: 'Parts availability doesn\'t suspend your habitability obligations. While the system is out, what interim solution are you providing — portable heaters, a rent abatement for the period without heat, or temporary accommodation? I\'m entitled to habitable conditions throughout my tenancy.', points: 10, feedback: 'Perfect. You named the legal obligation, rejected the supply chain excuse, and listed your actual entitlements.' },
          { text: 'What\'s your plan to keep the unit livable while waiting for parts? I need a habitable unit — including heat — in the meantime.', points: 7, feedback: 'Good framing. Naming a rent abatement as a specific option would have shown you know your remedies.' },
          { text: 'Weeks is too long to wait. Can you at least provide space heaters?', points: 4, feedback: 'Reasonable ask, but you\'re underselling your position. Space heaters are not adequate — ask for an abatement.' },
          { text: 'Not my problem — just get the parts and fix it!', points: 1, feedback: 'Emotional and unhelpful. The landlord needs a reason to prioritize your unit — legal consequences are that reason.' },
        ],
      },
      {
        landlord: 'I came by and looked at it — I don\'t think it\'s as serious as you\'re making it.',
        hint: 'Your assessment and the landlord\'s opinion both lack authority. A licensed contractor\'s written report is the objective standard. If the landlord won\'t schedule one, you can.',
        options: [
          { text: 'A landlord\'s informal opinion isn\'t the legal standard — a licensed HVAC technician\'s assessment is. If you won\'t schedule one, I\'ll hire one myself, get a written report, and use that as the basis for any further action I take, including repair-and-deduct.', points: 10, feedback: 'Excellent. You shifted from opinion to objective standard and named your next step clearly.' },
          { text: 'I think we need a licensed professional to assess it, not a visual inspection. Can you schedule one this week?', points: 7, feedback: 'Good — professional assessment is the right call. Naming repair-and-deduct as your alternative would have added leverage.' },
          { text: 'I think it is serious. The temperature inside has been below 60 degrees.', points: 4, feedback: 'Concrete temperature data is useful. Combine it with a request for a professional inspection.' },
          { text: 'You\'re wrong — it\'s completely broken and I\'m freezing!', points: 1, feedback: 'Emotional and hard to dispute productively. Propose a professional assessment instead.' },
        ],
      },
      {
        landlord: 'You can use electric space heaters until I get this sorted out.',
        hint: 'Space heaters are not a habitability substitute for central heat in NJ — and they\'re a fire risk. They also cost you more in electricity. Ask for a rent abatement for the period of non-functioning heat.',
        options: [
          { text: 'Space heaters are not an adequate substitute for central heat under NJ habitability standards, and they pose fire safety concerns. Given how long this has been ongoing, I\'d like to discuss a proportional rent abatement for the period the heating system has been non-functional.', points: 10, feedback: 'Strong. Rejecting the space heater workaround and naming a rent abatement is exactly the right response.' },
          { text: 'Space heaters don\'t meet NJ habitability requirements for heat, and they increase my utility costs. Can we discuss a rent reduction while this is unresolved?', points: 7, feedback: 'Good — utility costs + habitability standard. Mentioning the specific safety concern would have added weight.' },
          { text: 'Space heaters aren\'t a real solution for a whole apartment, especially in winter.', points: 4, feedback: 'True, but frames it as preference. Apply the habitability standard and ask for an abatement.' },
          { text: 'I\'m not buying space heaters — you need to fix the heat!', points: 1, feedback: 'Emotionally understandable but legally unproductive. Redirect to the abatement you\'re entitled to.' },
        ],
      },
      {
        landlord: 'This repair is going to cost $4,000. I need time to arrange financing.',
        hint: 'Your habitability rights don\'t pause for the landlord\'s cash flow problems. Rent escrow through housing court actually helps both sides — your rent is held for repairs, not withheld.',
        options: [
          { text: 'Your financing situation doesn\'t pause my habitability rights. Filing for rent escrow through housing court could actually help both of us — my rent is held by the court and released to you when repairs are complete. It secures your payment and ensures repairs happen.', points: 10, feedback: 'Perfect. Framing rent escrow as a solution for both parties — not just a tenant weapon — is sophisticated and effective.' },
          { text: 'I understand it\'s a large cost, but habitability obligations aren\'t contingent on financing. Would you like to explore a rent escrow arrangement through housing court?', points: 7, feedback: 'Good. Framing escrow as beneficial to the landlord (secures rent) would have made the offer easier to accept.' },
          { text: 'I can\'t wait indefinitely for financing to come through. There has to be a solution.', points: 4, feedback: 'Reasonable, but vague on what the solution is. Name rent escrow as the specific path forward.' },
          { text: 'That\'s not my problem — fix it now!', points: 1, feedback: 'You\'re right that it\'s not your problem, but this response doesn\'t move anything forward. Offer a mechanism.' },
        ],
      },
    ],
  },

  {
    id: 'early_termination',
    label: 'Negotiate Early Lease Termination',
    icon: '📋',
    summary: 'You need to break your lease 8 months early. The landlord is demanding a 2-month penalty.',
    laws: [
      { title: 'Duty to Mitigate Damages', body: 'NJ landlords must make reasonable efforts to re-rent a vacated unit. They cannot simply let it sit empty and collect double rent. If they fail to mitigate, you may owe nothing.' },
      { title: 'Replacement Tenant Strategy', body: 'Finding a qualified replacement tenant yourself — and presenting them to the landlord — is the strongest negotiating move. The landlord\'s actual damages drop to near zero.' },
      { title: 'Domestic Violence / Military Exceptions', body: 'NJ law provides statutory early termination rights for victims of domestic violence and active-duty military members without any penalty.' },
    ],
    rounds: [
      {
        landlord: 'Your lease runs 8 more months. Breaking it means a 2-month rent penalty.',
        hint: 'Lead with mitigation — the landlord\'s legal duty to re-rent reduces what you actually owe. Offer to find a replacement tenant yourself.',
        options: [
          { text: 'Under NJ law, you\'re required to mitigate damages by making reasonable efforts to re-rent. If I find a qualified replacement tenant, your actual damages may be minimal. Would you accept a replacement tenant I source myself?', points: 10, feedback: 'Excellent opening. Mitigation is the key legal concept — you framed it perfectly and made a concrete offer.' },
          { text: 'I understand there\'s a penalty, but NJ law requires you to try to re-rent. Can we discuss finding a replacement tenant together?', points: 7, feedback: 'Good — mitigation is the right principle. Making a more concrete offer (you do the work) would have been stronger.' },
          { text: '2 months rent is a lot. Can we negotiate that down?', points: 4, feedback: 'You\'re negotiating, which is good, but you have a stronger legal argument available — use it.' },
          { text: 'I can\'t pay that. I\'m leaving anyway.', points: 1, feedback: 'Walking out without negotiating exposes you to a lawsuit for the full remaining rent. Always negotiate.' },
        ],
      },
      {
        landlord: 'I\'m not in the business of finding new tenants mid-lease.',
        hint: 'You never asked them to find the tenant. You find and screen the tenant — they just need to approve. Make that crystal clear.',
        options: [
          { text: 'I\'m not asking you to find anyone. I will advertise, screen applicants, and present you a fully qualified candidate. All you\'d need to do is approve them. Under NJ\'s duty to mitigate, refusing a qualified applicant limits what you can collect from me.', points: 10, feedback: 'Perfect. You removed their objection, did all the work, and cited the legal consequence of refusal.' },
          { text: 'I\'ll do all the legwork — advertise, screen, and present you a qualified tenant. You\'d just need to review and approve.', points: 7, feedback: 'Good — doing the work yourself is the right offer. Mentioning the mitigation consequence of refusal would have been stronger.' },
          { text: 'I\'m willing to help find someone. Would you even consider a replacement tenant?', points: 4, feedback: 'Too tentative. Make a concrete offer — you do the work, they approve.' },
          { text: 'Then you\'ll just have an empty unit for 8 months.', points: 1, feedback: 'This sounds adversarial and also signals you don\'t plan to help. Counterproductive.' },
        ],
      },
      {
        landlord: 'Even with a new tenant, I\'d want 1 month\'s rent for my time and trouble.',
        hint: 'One month is actually reasonable if they agree to waive the rest. Get it in writing as a full settlement — "1 month, full release."',
        options: [
          { text: 'That\'s reasonable. If I find a qualified tenant who signs a full-term lease, would you agree in writing that 1 month\'s rent is the total and final early termination fee — a full release of the remaining obligation?', points: 10, feedback: 'Excellent. "Full release" language is critical — it prevents them from coming back for more later.' },
          { text: 'I can agree to 1 month if that\'s the final amount. Can we put that in writing if I produce a qualified tenant?', points: 7, feedback: 'Good — getting it in writing is key. Making sure it\'s a "full release" would close the loop.' },
          { text: 'One month sounds better than two. Can we confirm that in writing?', points: 4, feedback: 'Right direction but incomplete — what exactly are you getting in writing? Specify that it\'s the final, full amount.' },
          { text: 'Fine. One month it is.', points: 1, feedback: 'You verbally agreed without a written agreement or any terms — this could leave you exposed later.' },
        ],
      },
      {
        landlord: 'Find me a qualified tenant and we\'ll talk. But I\'m making no promises.',
        hint: '"No promises" means you could do all the work and still owe 2 months. Pin down the terms before you invest time searching.',
        options: [
          { text: 'Before I invest time searching, I\'d like to agree in writing: if I present a tenant who passes your standard screening, the early termination fee is capped at 1 month — full release. That protects both of us. Can we put that in an email today?', points: 10, feedback: 'Perfect. You correctly identified the risk of doing work without a deal and asked for written terms first.' },
          { text: 'I\'ll start searching right away. Can you send me your screening criteria so I know exactly what qualified means to you?', points: 7, feedback: 'Good — getting screening criteria is practical. But you should also lock in the 1-month fee agreement before starting.' },
          { text: 'Okay, I\'ll look for someone. How long do I have before you start the penalty clock?', points: 4, feedback: 'Useful question, but you\'re still operating without a written deal.' },
          { text: 'Deal — I\'ll find someone by next week.', points: 1, feedback: 'You committed to a deadline without getting any commitment back. And "we\'ll talk" is not a deal.' },
        ],
      },
      {
        landlord: 'My lease explicitly prohibits subletting or assigning the lease.',
        hint: 'A no-sublet clause and a replacement tenant are legally different. You\'re proposing the landlord sign a new direct lease with a new tenant — that\'s not subletting.',
        options: [
          { text: 'What I\'m proposing isn\'t a sublease — I\'m offering to help you find a new direct tenant who would sign a new lease with you. Your no-sublet clause addresses unauthorized subletting, not a landlord-approved new tenancy. These are legally distinct arrangements.', points: 10, feedback: 'Perfect distinction. Subletting vs. lease assignment vs. new tenancy are different — you named the right one.' },
          { text: 'I\'m not suggesting an unauthorized sublease. I mean finding someone who enters a new lease directly with you — that\'s not subletting.', points: 7, feedback: 'Correct framing. Citing the legal distinction explicitly would have been stronger.' },
          { text: 'I wasn\'t suggesting an illegal sublease — I meant finding someone official to take over.', points: 4, feedback: 'Right idea, but vague. Be specific: a new tenant signing a new lease directly with the landlord.' },
          { text: 'The no-sublease clause is unfair.', points: 1, feedback: 'Complaining about the clause doesn\'t advance the negotiation. Distinguish between subletting and what you\'re actually proposing.' },
        ],
      },
      {
        landlord: 'You\'ll owe rent for every remaining month until I find a replacement myself.',
        hint: 'Passive waiting doesn\'t satisfy the duty to mitigate. NJ requires active, reasonable efforts to re-rent. If they don\'t advertise or screen applicants, a court may find they failed.',
        options: [
          { text: 'NJ law requires you to make active, reasonable efforts to re-rent — not just wait. If you don\'t advertise or screen applicants, a court may find you failed to mitigate, reducing what I legally owe. What specific steps are you taking to re-rent the unit?', points: 10, feedback: 'Excellent. "Active reasonable efforts" is the exact legal standard — you named it and put them on the defensive.' },
          { text: 'Your duty to mitigate means actively marketing the unit — not passively waiting. What steps are you planning to take to find a replacement?', points: 7, feedback: 'Good principle. Asking what specific steps they plan takes it from abstract to concrete.' },
          { text: 'You\'re required to try to find a new tenant too — you can\'t just sit back.', points: 4, feedback: 'True, but vague. Name the "duty to mitigate" specifically and ask what they\'re doing about it.' },
          { text: 'I\'m not paying rent for an empty apartment — that\'s not fair.', points: 1, feedback: '"Fairness" isn\'t the legal standard. Apply the duty to mitigate — that\'s what actually limits what you owe.' },
        ],
      },
      {
        landlord: 'Even if you produce a tenant, I\'ll still need 3 months advance notice from you.',
        hint: 'Check what your lease says about notice requirements. If the lease specifies 30 or 60 days, a 90-day demand is unsupported. Negotiate from what the contract actually requires.',
        options: [
          { text: 'My lease specifies [X] days notice for termination — 3 months may exceed what the contract actually requires. I\'m happy to provide as much notice as possible, but our agreement should be based on the written lease terms, not a new condition. What does the lease say about notice?', points: 10, feedback: 'Excellent. Returning to the written contract terms is exactly right — new verbal conditions added mid-negotiation aren\'t binding.' },
          { text: 'Let\'s check what notice the lease actually requires. If it\'s less than 3 months, I\'d like to hold to that — though I\'ll give you as much lead time as I can.', points: 7, feedback: 'Good — anchoring to the written lease is right. Asking what the lease says directly keeps it objective.' },
          { text: '3 months is a long time. My lease says something different about notice.', points: 4, feedback: 'True, but imprecise. Quote the lease term and use it as your anchor.' },
          { text: '3 months? That\'s way too long!', points: 1, feedback: 'Emotional rejection without a legal basis. The lease is your authority here — use it.' },
        ],
      },
      {
        landlord: 'I\'ll need first month, last month, and security deposit from any replacement tenant.',
        hint: 'A new tenant\'s deposit and first/last requirements are between them and the landlord — separate from your termination agreement. Don\'t let them mix the two conversations.',
        options: [
          { text: 'Absolutely — that\'s entirely between you and the new tenant and has no bearing on our early termination agreement. As long as we\'ve agreed in writing that producing a qualified tenant caps my fee at one month, their deposit arrangement with you is a separate matter. Can we document our agreement today?', points: 10, feedback: 'Perfect separation of issues. The new tenant\'s deposit is irrelevant to your termination fee — you drew that line clearly.' },
          { text: 'Of course — that\'s a standard ask for a new tenant. Our agreement is just about what I owe you for the early termination. Let\'s get that in writing.', points: 7, feedback: 'Good. Making sure the written agreement is sealed before you discuss anything else would have been even stronger.' },
          { text: 'That\'s fine. But we still need to finalize what I owe first.', points: 4, feedback: 'Right instinct. Make it explicit: their deposits are separate; your termination fee is what you\'re here to settle.' },
          { text: 'Why are you charging them so much? That\'s going to make it hard to find someone.', points: 1, feedback: 'The new tenant\'s cost is not your negotiation. Inserting yourself here signals you don\'t understand the separation of issues.' },
        ],
      },
    ],
  },

  {
    id: 'rent_increase',
    label: 'Challenge a Rent Increase',
    icon: '📈',
    summary: 'Your landlord just told you rent is going up $300/month starting next month.',
    laws: [
      { title: 'Rent Control in NJ Municipalities', body: 'Many NJ cities and towns have rent control ordinances. Check your municipality — if rent control applies, increases may be capped at CPI or a fixed percentage.' },
      { title: 'Written Notice Requirement', body: 'NJ landlords must provide written notice of rent increases. Proper notice period depends on your lease — typically 30-60 days minimum.' },
      { title: 'Lease Term Protection', body: 'If you are within a fixed-term lease, your landlord generally cannot raise rent until the lease ends (unless the lease explicitly allows mid-term increases).' },
    ],
    rounds: [
      {
        landlord: 'I\'m raising your rent by $300 per month starting next month.',
        hint: 'Three things to check: Is this in writing? Is the notice period long enough per your lease? Does your city have rent control?',
        options: [
          { text: 'Thank you for letting me know. A few things: I\'ll need this in writing per our lease terms. I\'m also checking whether our municipality has rent control that applies here. What is the notice period you\'re providing?', points: 10, feedback: 'Perfect. Three precise, legal questions — written notice, notice period, and rent control — are exactly the right moves.' },
          { text: 'I\'d like that in writing, please. Also, how much notice are you providing?', points: 7, feedback: 'Good — written notice and notice period are the right questions. Asking about rent control would have covered all your bases.' },
          { text: '$300 is a big jump. Why such a large increase?', points: 4, feedback: 'Reasonable to ask, but "why" won\'t change your legal rights. Ask about notice and rent control instead.' },
          { text: 'That\'s way too much! I can\'t afford that.', points: 1, feedback: 'Affordability is real but legally irrelevant. Focus on whether the increase is procedurally valid.' },
        ],
      },
      {
        landlord: 'I haven\'t sent written notice yet, but the increase starts in 30 days.',
        hint: 'If your lease requires more than 30 days notice (e.g., 60 days), this increase is premature. Ask for the notice in writing and note the effective date may need to move.',
        options: [
          { text: 'My lease requires [X days] written notice for changes to rent. If 30 days doesn\'t meet that requirement, the increase can\'t take effect on that timeline. Please provide formal written notice today, and let\'s establish a compliant effective date.', points: 10, feedback: 'Excellent. Notice period compliance is a real legal requirement — you applied it precisely and proposed a fix.' },
          { text: 'I need written notice per our lease before this becomes effective. Can you send that today and confirm the exact effective date?', points: 7, feedback: 'Correct requirement. Flagging the potential notice-period issue would have added more leverage.' },
          { text: '30 days doesn\'t seem like enough time to prepare for a $300 increase.', points: 4, feedback: 'True, but framed as personal hardship. The legal issue is notice period compliance, not feelings.' },
          { text: 'You can\'t do that without written notice!', points: 1, feedback: 'You\'re right, but this sounds combative. State what you need and ask for it calmly.' },
        ],
      },
      {
        landlord: 'Rents are up everywhere. This is just market rate.',
        hint: '"Market rate" is not a legal justification in rent-controlled municipalities. If your city has rent control, the allowable increase is set by ordinance regardless of market.',
        options: [
          { text: 'Market conditions don\'t override lease terms or local ordinances. I\'ve looked into whether our municipality has rent control — if it does, the allowable increase may be capped regardless of market rate. Can you document the legal basis for this specific amount?', points: 10, feedback: 'Strong. You rejected a non-legal argument and redirected to the actual legal framework.' },
          { text: 'I understand market pressures. Would you be open to a smaller increase, or phasing it in over two lease renewals?', points: 7, feedback: 'Good negotiation — proposing alternatives is constructive. Adding the rent control angle would have been stronger.' },
          { text: 'Other rents going up doesn\'t mean mine has to go up by this much.', points: 4, feedback: 'True but not legally grounded. Apply the rent control question here.' },
          { text: 'Market rate is not a good enough reason.', points: 1, feedback: 'Flat rejection with no alternative or legal basis.' },
        ],
      },
      {
        landlord: 'This is the rent going forward. Take it or leave it.',
        hint: 'Don\'t make an emotional decision on the spot. Ask for time, check rent control, and respond formally in writing. That\'s your right.',
        options: [
          { text: 'I\'ll review whether this increase complies with our lease terms and any local ordinances, and respond in writing within 5 business days. In the meantime, please provide the increase notice in writing with the proposed effective date.', points: 10, feedback: 'Perfect. Taking time to review is your right. Written response + written notice request keeps everything documented.' },
          { text: 'I understand your position. I\'ll review my rights and respond formally within the week.', points: 7, feedback: 'Good — taking time is right. Requesting written notice in the meantime would have completed the move.' },
          { text: 'I\'ll need to think about this. I\'m not agreeing to anything right now.', points: 4, feedback: 'Fine to pause, but give a specific timeline and request written notice.' },
          { text: 'Then I\'ll leave!', points: 1, feedback: 'An emotional ultimatum. Take time to explore your options before making any decisions.' },
        ],
      },
      {
        landlord: 'Property taxes went up 15% this year — I need to pass those costs on.',
        hint: 'Property tax increases are a landlord\'s cost of ownership — not an automatic pass-through to tenants. In rent-controlled areas there\'s a formal hardship process. Ask for documentation.',
        options: [
          { text: 'Property taxes are a standard cost of owning rental property and aren\'t automatically passed to tenants in NJ. If our municipality has rent control, there may be a formal hardship application process for tax-based increases. Have you filed one? I\'d like to see the supporting documentation.', points: 10, feedback: 'Perfect. You rejected the automatic pass-through assumption and correctly identified the rent-control hardship process.' },
          { text: 'Can you share the tax assessment documents? In rent-controlled areas, tax-based increases often require a formal application — not just a notice.', points: 7, feedback: 'Good — documentation and process. Rejecting the automatic pass-through idea would have set the right frame first.' },
          { text: 'A 15% tax increase doesn\'t automatically justify a $300 rent increase.', points: 4, feedback: 'True, but framed as opinion. Cite the rent control process and ask for documentation instead.' },
          { text: 'Your taxes are your problem, not mine.', points: 1, feedback: 'Dismissive — and alienating. Make the same point legally: taxes aren\'t automatically your cost under NJ law.' },
        ],
      },
      {
        landlord: 'Your rent is way below market. Other units in this building rent for much more.',
        hint: 'What other tenants pay is legally irrelevant to your agreement. Your lease controls your rent until renewal. If you\'re in a fixed term, mid-term increases may not even be permissible.',
        options: [
          { text: 'What other tenants pay doesn\'t affect our lease agreement. My rent is governed by our contract and applicable local law — not market comparisons. Is my current lease term still in effect? If so, a mid-term increase may not be permissible at all under the lease.', points: 10, feedback: 'Excellent. You dismissed the irrelevant comparison and raised the critical question: is a mid-term increase even allowed?' },
          { text: 'My lease governs my rent, not comparisons to other units. Is this proposed for renewal, or mid-term? A mid-term increase may not be permitted under our lease.', points: 7, feedback: 'Good distinction between mid-term and renewal. Rejecting the market comparison more directly would have been stronger.' },
          { text: 'What other people pay has nothing to do with our agreement.', points: 4, feedback: 'True. Add the follow-up: ask whether you\'re in a fixed term that prohibits a mid-term increase.' },
          { text: 'I don\'t care what others pay — that\'s not fair to me.', points: 1, feedback: '"Fairness" isn\'t the legal standard. Your lease and any local ordinances are the standard.' },
        ],
      },
      {
        landlord: 'The increase is effective the 1st — that\'s only two weeks from now.',
        hint: 'Two weeks is almost certainly insufficient notice under any NJ lease. Even month-to-month tenants are typically owed 30 days. The increase cannot be effective on that timeline.',
        options: [
          { text: 'Two weeks is insufficient under NJ law and almost certainly under our lease — even month-to-month tenants are generally owed 30 days written notice. The increase cannot legally take effect in two weeks. Please provide formal written notice, and the effective date should start from when I receive that notice.', points: 10, feedback: 'Perfect. You named the standard (30 days), applied it to your situation, and told them exactly how to fix it.' },
          { text: 'Two weeks doesn\'t meet the standard notice requirement. I need at least 30 days formal written notice — can you reissue with a compliant effective date?', points: 7, feedback: 'Correct requirement. Explaining that the clock starts from receipt of written notice would have been a useful clarification.' },
          { text: 'Two weeks isn\'t enough time for such a large increase.', points: 4, feedback: 'True but framed as personal hardship. The legal notice period is what matters here.' },
          { text: 'That\'s way too soon — you can\'t do this!', points: 1, feedback: 'Emotional. Cite the notice standard and offer a path forward.' },
        ],
      },
      {
        landlord: 'I mentioned this increase to you verbally two months ago.',
        hint: 'Verbal notice doesn\'t satisfy NJ written notice requirements for rent increases — regardless of when it was given. Ask for written notice and let the effective date run from receipt.',
        options: [
          { text: 'Rent increases in NJ require written notice — verbal notice doesn\'t satisfy that requirement regardless of when it occurred. I have no written documentation of any prior notice. Please provide formal written notice today, and the legally compliant effective date will run from when I receive it.', points: 10, feedback: 'Excellent. Written notice requirement is non-negotiable — you stated it clearly and told them how to cure the defect.' },
          { text: 'I have no record of a verbal notice, and written notice is required in any case. Can you provide that in writing today?', points: 7, feedback: 'Correct — written notice is the requirement. Being more explicit that the effective date runs from receipt would have been complete.' },
          { text: 'I don\'t remember that conversation, and verbal isn\'t the same as written notice.', points: 4, feedback: 'True. Assert the written notice requirement more definitively — "doesn\'t remember" sounds uncertain.' },
          { text: 'You never told me anything about a rent increase!', points: 1, feedback: 'A credibility dispute is hard to win. Instead, make the argument that doesn\'t depend on your memory: written notice is required regardless.' },
        ],
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const ROUNDS_PER_GAME = 4   // how many rounds to draw from each scenario's pool

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Pick `count` rounds at random from the scenario's pool (no repeats). */
function pickRounds(rounds, count) {
  return shuffleArray(rounds).slice(0, count)
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADING
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PTS_PER_ROUND = 10  // best answer
const HINT_PENALTY = 2        // deducted if hint was used when picking the best answer

function grade(score, rounds, hintsUsed) {
  const max = rounds * MAX_PTS_PER_ROUND
  const pct = max > 0 ? score / max : 0
  if (pct >= 0.85) return { label: 'Expert Negotiator',  color: '#34c97a', stars: 5 }
  if (pct >= 0.65) return { label: 'Skilled Advocate',   color: '#c8a84b', stars: 4 }
  if (pct >= 0.45) return { label: 'Developing Skills',  color: '#f0a832', stars: 3 }
  if (pct >= 0.25) return { label: 'Needs Practice',     color: '#e05555', stars: 2 }
  return                { label: 'Beginner',              color: '#6e8fa8', stars: 1 }
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTION BUTTON
// ─────────────────────────────────────────────────────────────────────────────

const OPT_COLORS = {
  default:  { bg: 'var(--color-surface-subtle)', border: 'var(--color-border)', text: 'var(--color-text)' },
  selected: { bg: 'rgba(200,168,75,0.15)',        border: '#c8a84b',            text: 'var(--color-text-heading)' },
  best:     { bg: 'rgba(52,201,122,0.12)',         border: '#34c97a',            text: 'var(--color-text-heading)' },
  wrong:    { bg: 'rgba(224,85,85,0.08)',          border: 'rgba(224,85,85,0.3)',text: 'var(--color-text-muted)' },
}

function OptionBtn({ option, index, picked, bestIndex, revealed, onClick }) {
  let state = 'default'
  if (revealed) {
    if (index === bestIndex) state = 'best'
    else if (index === picked) state = 'wrong'
  } else if (index === picked) {
    state = 'selected'
  }
  const c = OPT_COLORS[state]
  const labels = ['A', 'B', 'C', 'D']

  return (
    <button
      onClick={() => !revealed && onClick(index)}
      disabled={revealed}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        width: '100%', textAlign: 'left',
        padding: '0.75rem 1rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--radius-md)',
        cursor: revealed ? 'default' : 'pointer',
        transition: 'all 0.15s',
        opacity: revealed && index !== bestIndex && index !== picked ? 0.5 : 1,
      }}
    >
      <span style={{
        flexShrink: 0, width: '22px', height: '22px',
        borderRadius: '50%',
        background: state === 'best' ? '#34c97a'
          : state === 'wrong' ? '#e05555'
          : state === 'selected' ? '#c8a84b'
          : 'var(--color-border)',
        color: state === 'default' ? 'var(--color-text-muted)' : '#07111f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', fontWeight: 700,
      }}>
        {revealed && index === bestIndex ? '✓'
          : revealed && index === picked && index !== bestIndex ? '✗'
          : labels[index]}
      </span>
      <span style={{ fontSize: '0.875rem', color: c.text, lineHeight: 1.55, flex: 1 }}>
        {option.text}
        {revealed && index === picked && (
          <span style={{
            display: 'block', marginTop: '0.4rem',
            fontSize: '0.78rem',
            color: index === bestIndex ? '#34c97a' : 'var(--color-text-muted)',
            fontStyle: 'italic',
          }}>
            {option.feedback}
          </span>
        )}
        {revealed && index === bestIndex && index !== picked && (
          <span style={{
            display: 'block', marginTop: '0.4rem',
            fontSize: '0.78rem', color: '#34c97a', fontStyle: 'italic',
          }}>
            {option.feedback}
          </span>
        )}
      </span>
      {revealed && (
        <span style={{
          flexShrink: 0, fontSize: '0.75rem', fontWeight: 700,
          color: index === bestIndex ? '#34c97a' : 'var(--color-text-muted)',
        }}>
          {option.points}pt{option.points !== 1 ? 's' : ''}
        </span>
      )}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LAWS PANEL
// ─────────────────────────────────────────────────────────────────────────────

function LawsPanel({ laws, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      border: '1px solid rgba(200,168,75,0.25)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.65rem 1rem',
        background: 'rgba(200,168,75,0.07)',
        border: 'none', cursor: 'pointer',
        color: '#c8a84b', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.02em',
      }}>
        <span>⚖️  RELEVANT NJ LAWS &amp; GUIDANCE</span>
        <span style={{ fontSize: '0.7rem' }}>{open ? '▲ collapse' : '▼ expand'}</span>
      </button>
      {open && (
        <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-surface-subtle)' }}>
          {laws.map((l, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#c8a84b', marginBottom: '0.2rem' }}>{l.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{l.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO PICKER
// ─────────────────────────────────────────────────────────────────────────────

function ScenarioPicker({ onSelect }) {
  const [preview, setPreview] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Choose a scenario. Each round presents a landlord statement — pick the best response from 4 options.
        Use the <strong style={{ color: '#c8a84b' }}>Hint</strong> button if stuck (costs 2 pts on that round).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.65rem' }}>
        {SCENARIOS.map(s => (
          <button key={s.id} onClick={() => setPreview(s)}
            style={{
              textAlign: 'left', padding: '0.85rem 1rem',
              background: preview?.id === s.id ? 'var(--color-surface-elevated)' : 'var(--color-surface-subtle)',
              border: `1px solid ${preview?.id === s.id ? 'rgba(200,168,75,0.5)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.15s',
            }}>
            <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-heading)', marginBottom: '0.2rem' }}>{s.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{s.summary}</div>
          </button>
        ))}
      </div>

      {preview && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <LawsPanel laws={preview.laws} defaultOpen />
          <Button variant="primary" onClick={() => onSelect(preview)}>
            Start: {preview.label} →
          </Button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

function Results({ scenario, rounds, totalScore, hintsUsed, onRestart }) {
  const g = grade(totalScore, rounds.length, hintsUsed)
  const maxPossible = rounds.length * MAX_PTS_PER_ROUND

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{
        textAlign: 'center', padding: '1.5rem 1rem',
        background: 'var(--color-surface-subtle)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
      }}>
        <div style={{ fontSize: '2.2rem', marginBottom: '0.35rem' }}>
          {'⭐'.repeat(g.stars)}{'☆'.repeat(5 - g.stars)}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: g.color, fontFamily: 'Georgia, serif' }}>
          {g.label}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          {totalScore} / {maxPossible} points
          {hintsUsed > 0 && <span style={{ color: 'var(--color-text-muted)' }}> · {hintsUsed} hint{hintsUsed > 1 ? 's' : ''} used</span>}
        </div>
      </div>

      {/* Per-round summary */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-text-heading)', marginBottom: '0.25rem' }}>Round by Round</div>
        {rounds.map((r, i) => {
          const best = Math.max(...r.options.map(o => o.points))
          const picked = r.options[r.pickedIndex]
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8rem' }}>
              <span style={{
                flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
                background: picked.points === best ? 'rgba(52,201,122,0.2)' : 'rgba(240,168,50,0.15)',
                border: `1px solid ${picked.points === best ? '#34c97a' : '#f0a832'}`,
                color: picked.points === best ? '#34c97a' : '#f0a832',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.7rem',
              }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--color-text)', marginBottom: '0.15rem', lineHeight: 1.4 }}>
                  {picked.text.length > 90 ? picked.text.slice(0, 90) + '…' : picked.text}
                </div>
                <div style={{ color: 'var(--color-text-muted)' }}>
                  {picked.points} / {best} pts
                  {r.hintUsed && <span style={{ color: '#f0a832' }}> · hint used</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <LawsPanel laws={scenario.laws} />

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={onRestart}>Play Again</Button>
        <Button variant="secondary" onClick={() => window.location.href = '/letter'}>Write a Real Letter</Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GAME
// ─────────────────────────────────────────────────────────────────────────────

export default function LandlordSim() {
  const [screen, setScreen]             = useState('pick')   // pick | game | results
  const [scenario, setScenario]         = useState(null)
  const [selectedRounds, setSelectedRounds] = useState([])   // randomly picked rounds for this game
  const [roundIdx, setRoundIdx]         = useState(0)
  const [roundOptions, setRoundOptions] = useState([])       // shuffled options for current round
  const [pickedIdx, setPickedIdx]       = useState(null)     // index into roundOptions
  const [hintOpen, setHintOpen]         = useState(false)
  const [hintUsed, setHintUsed]         = useState(false)
  const [totalScore, setTotalScore]     = useState(0)
  const [hintsUsed, setHintsUsed]       = useState(0)
  const [completedRounds, setCompletedRounds] = useState([]) // for results

  const revealed    = pickedIdx !== null
  const round       = selectedRounds[roundIdx]
  const totalRounds = selectedRounds.length
  // bestIndex derived from the shuffled roundOptions, not the original order
  const bestIndex   = roundOptions.length
    ? roundOptions.indexOf([...roundOptions].sort((a, b) => b.points - a.points)[0])
    : 0

  function startScenario(s) {
    const picked = pickRounds(s.rounds, ROUNDS_PER_GAME)
    setScenario(s)
    setSelectedRounds(picked)
    setRoundIdx(0)
    setRoundOptions(shuffleArray(picked[0].options))
    setPickedIdx(null)
    setHintOpen(false)
    setHintUsed(false)
    setTotalScore(0)
    setHintsUsed(0)
    setCompletedRounds([])
    setScreen('game')
  }

  function pickOption(idx) {
    if (revealed) return
    const pts = roundOptions[idx].points - (hintUsed && idx === bestIndex ? HINT_PENALTY : 0)
    setPickedIdx(idx)
    setTotalScore(s => s + Math.max(0, pts))
    setCompletedRounds(prev => [...prev, {
      ...round,
      options: roundOptions,   // store shuffled options so Results references correctly
      pickedIndex: idx,
      hintUsed,
    }])
  }

  function nextRound() {
    const next = roundIdx + 1
    if (next >= totalRounds) {
      setScreen('results')
    } else {
      setRoundIdx(next)
      setRoundOptions(shuffleArray(selectedRounds[next].options))
      setPickedIdx(null)
      setHintOpen(false)
      setHintUsed(false)
    }
  }

  function restart() {
    setScreen('pick')
    setScenario(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.15rem', fontFamily: 'Georgia, serif', color: 'var(--color-text-heading)' }}>
            ⚖️ Negotiation Practice
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {screen === 'pick' ? '6 real-world scenarios · 4 random rounds from a bank of 8 · NJ tenant law'
              : screen === 'game' ? `${scenario.label} · Round ${roundIdx + 1} of ${totalRounds}`
              : `${scenario.label} · Complete`}
          </p>
        </div>
        {screen !== 'pick' && (
          <button onClick={restart} style={{
            fontSize: '0.75rem', color: 'var(--color-text-muted)',
            background: 'none', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem', cursor: 'pointer',
          }}>← Scenarios</button>
        )}
      </div>

      {/* ── PICK SCREEN ── */}
      {screen === 'pick' && <ScenarioPicker onSelect={startScenario} />}

      {/* ── GAME SCREEN ── */}
      {screen === 'game' && round && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* Progress bar + score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '4px', background: 'var(--color-surface-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(roundIdx / totalRounds) * 100}%`,
                background: 'var(--color-primary)', borderRadius: '999px', transition: 'width 0.4s',
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {totalScore} pts
            </span>
          </div>

          {/* Laws panel (collapsible during game) */}
          <LawsPanel laws={scenario.laws} defaultOpen={false} />

          {/* Landlord bubble */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'var(--color-surface-elevated)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px 12px 12px 12px',
            fontSize: '0.9rem', lineHeight: 1.6,
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>🏠 Landlord says:</div>
            <div style={{ color: 'var(--color-text)' }}>"{round.landlord}"</div>
          </div>

          {/* Hint */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <button
              onClick={() => { setHintOpen(o => !o); if (!hintUsed) setHintsUsed(n => n + 1); setHintUsed(true) }}
              disabled={revealed}
              style={{
                fontSize: '0.75rem', fontWeight: 600,
                padding: '0.3rem 0.75rem',
                background: hintOpen ? 'rgba(200,168,75,0.12)' : 'transparent',
                border: '1px solid rgba(200,168,75,0.35)',
                borderRadius: '999px', cursor: revealed ? 'default' : 'pointer',
                color: '#c8a84b', whiteSpace: 'nowrap', flexShrink: 0,
                opacity: revealed ? 0.5 : 1,
              }}>
              💬 Lawyer Hint {!hintUsed && !revealed ? <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>(−{HINT_PENALTY} pts if best answer)</span> : ''}
            </button>
            {hintOpen && (
              <div style={{
                flex: 1, fontSize: '0.8rem', color: 'var(--color-text-muted)',
                background: 'rgba(200,168,75,0.06)',
                border: '1px solid rgba(200,168,75,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.45rem 0.75rem', lineHeight: 1.6,
              }}>
                <strong style={{ color: '#c8a84b' }}>Your lawyer whispers: </strong>{round.hint}
              </div>
            )}
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.1rem' }}>
              How do you respond?
            </div>
            {roundOptions.map((opt, i) => (
              <OptionBtn
                key={i}
                option={opt}
                index={i}
                picked={pickedIdx}
                bestIndex={bestIndex}
                revealed={revealed}
                onClick={pickOption}
              />
            ))}
          </div>

          {/* Points earned + next */}
          {revealed && (
            <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.85rem' }}>
                {pickedIdx === bestIndex
                  ? <span style={{ color: '#34c97a', fontWeight: 700 }}>✓ Best answer! +{roundOptions[bestIndex].points - (hintUsed ? HINT_PENALTY : 0)} pts</span>
                  : <span style={{ color: '#f0a832', fontWeight: 600 }}>+{roundOptions[pickedIdx].points} pts · Best was option {['A','B','C','D'][bestIndex]}</span>
                }
              </div>
              <Button variant="primary" onClick={nextRound}>
                {roundIdx + 1 < totalRounds ? `Next Round →` : `See Results →`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS SCREEN ── */}
      {screen === 'results' && (
        <Results
          scenario={scenario}
          rounds={completedRounds}
          totalScore={totalScore}
          hintsUsed={hintsUsed}
          onRestart={restart}
        />
      )}
    </div>
  )
}
