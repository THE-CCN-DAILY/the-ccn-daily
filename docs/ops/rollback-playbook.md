# Rollback Playbook

## Trigger Sources
- Automatic guardrail evaluator
- Manual SRE/product escalation

## Immediate Actions (first 15 minutes)
1. Freeze rollout progression.
2. Set feature status to `paused` or `rolled_back`.
3. Notify Eng + PM + Support.
4. Validate user-facing blast radius.

## Severity Rules
- Critical: payment failures, entitlement denial spikes, crash spikes -> rollback now
- Warning: churn/cost/margin drifts -> pause and investigate

## Recovery
1. Fix root cause.
2. Validate with canary cohort.
3. Resume rollout from previous safe stage.
