# LeaseShield Test Lease — Answer Key

Use this to verify your model's output against known correct answers.

| Lease | Classification | Late Fee Expected | Entry Expected | Deposit Expected | Key Risk |
|-------|---------------|-------------------|----------------|------------------|----------|
| 01 | FAIR | LOW (2.2%) | LOW (24hr written) | LOW (1x, 30 days) | No high-risk clauses |
| 02 | UNFAIR | HIGH (daily, no grace) | HIGH (no notice) | HIGH (3x = illegal) | Multiple weight-10 violations |
| 03 | FAIR | LOW (2.5%) | LOW (48hr written) | LOW (1x, interest) | No high-risk clauses |
| 04 | UNFAIR | HIGH ($500+daily, no grace) | HIGH (no notice) | HIGH (1.5x at cap, 60 days) | Rights waiver, daily fee |
| 05 | MIXED | LOW (both fees <5%) | MEDIUM (absence entry) | LOW (1.5x, 30 days) | Entry during absence = medium |
| 06 | UNFAIR | HIGH (10%, no grace) | HIGH (no notice) | HIGH (2x = illegal) | Rights waiver, habitability waiver |
| 07 | FAIR | LOW (2.5%) | LOW (24hr written, hours restricted) | LOW (1x, 21 days) | Marini explicitly cited |
| 08 | UNFAIR | HIGH (15%, no grace) | HIGH (no notice) | HIGH (2x = illegal) | Habitability waiver (void) |
| 09 | FAIR | LOW (2.5%) | LOW (24hr, 9am-6pm) | LOW (1x, 30 days) | All statutory rights preserved |
| 10 | UNFAIR | HIGH (daily, no grace) | MEDIUM (12hr verbal) | HIGH (2x = illegal) | Daily fee + charge-back |
| 11 | FAIR | LOW (2.5%) | LOW (24hr written) | LOW (1x, 30 days) | No high-risk clauses |
| 12 | MIXED | LOW/MEDIUM ($150 = exactly 5%) | MEDIUM (5-day absence) | LOW (1.5x at cap) | Boundary case on late fee |
| 13 | UNFAIR | HIGH (daily + charge-back) | HIGH (no notice) | HIGH (2x = illegal) | Eviction without court (illegal) |
| 14 | FAIR | LOW (2.5%, first waived) | LOW (48hr, business hours) | LOW (1x, 21 days) | Best-drafted lease in set |
| 15 | MIXED | LOW ($50 = 0.9%) | MEDIUM (absence entry) | LOW (1x, 30 days) | Court fee HIGH, entry MEDIUM — original lease |

## Severity thresholds used

- Late fee <= 5% of monthly rent → LOW
- Late fee 5-10% of monthly rent → MEDIUM
- Late fee > 10% OR daily fee → HIGH
- No grace period + any fee → bump up one level
- Security deposit > 1.5x monthly rent → HIGH (NJ illegal)
- No-notice entry → HIGH (weight 7)
- Habitability waiver → HIGH (weight 10, void public policy)
- Rights/jury waiver → HIGH (weight 8, unenforceable)
