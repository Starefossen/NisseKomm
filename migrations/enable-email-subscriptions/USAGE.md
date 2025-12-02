# Email Subscription Migration Guide

## Quick Start

Enable email subscriptions for all existing families in your dataset.

### Development Dataset

```bash
# 1. Preview changes (dry run)
pnpm migration:run:dev enable-email-subscriptions --dry-run

# 2. Review output, then execute
pnpm migration:run:dev enable-email-subscriptions
```

### Production Dataset

```bash
# 1. Preview changes (dry run)
pnpm migration:run:prod enable-email-subscriptions --dry-run

# 2. Review output, then execute
pnpm migration:run:prod enable-email-subscriptions
```

## What This Migration Does

- Sets `emailSubscription: true` for all `familyCredentials` documents
- Skips documents that already have `emailSubscription: true`
- Enables daily mission emails (sent at 21:00 CET) for existing families

## Expected Output

### Dry Run Output

```text
✔ Migration: Enable email subscriptions for all existing families
  Documents to migrate: 5

Mutations to apply:
  - familyCredentials: Set emailSubscription=true for 5 documents

No errors detected.
```

### Execution Output

```text
✔ Migration: Enable email subscriptions for all existing families
  Migrated: 5 documents
  Skipped: 0 documents
  Errors: 0

Migration complete!
```

## After Migration

All existing families will be subscribed to daily emails. They can unsubscribe via:

1. **Nissemor Guide Settings** → Toggle "E-postvarsling" off
2. **Email unsubscribe link** → One-click unsubscribe at bottom of emails

## Verification

Check Sanity Studio to verify:

1. Go to Sanity Studio → Family Credentials
2. Select any family document
3. Verify `emailSubscription` field is `true`

Or query via API:

```bash
# Count subscribed families
curl -X POST https://<project-id>.api.sanity.io/v1/data/query/production \
  -H "Authorization: Bearer <token>" \
  -d '{"query": "*[_type == \"familyCredentials\" && emailSubscription == true] | length"}'
```

## Rollback

If you need to revert (disable all subscriptions):

```bash
# Create reverse migration or manually update via Sanity Studio
# Or use GROQ query to bulk update:
sanity documents query '*[_type == "familyCredentials"]' \
  | sanity documents mutate --patch '{ emailSubscription: false }'
```

## Troubleshooting

### "No documents to migrate"

This means all families already have `emailSubscription: true`. This is expected if:

- You've already run the migration
- All families registered after the feature was deployed

### Migration Fails

1. Check environment variables are set (`.env.local`)
2. Verify Sanity token has write permissions
3. Check internet connection to Sanity API
4. Review error message for specific issue

## Next Steps

After running the migration:

1. ✅ Verify migration completed successfully
2. ✅ Deploy updated Sanity schema to production
3. ✅ Set Vercel environment variables:
   - `RESEND_API_KEY`
   - `UNSUBSCRIBE_SECRET`
   - `CRON_SECRET`
4. ✅ Test email sending with `pnpm email:daily-dev --day 5`
5. ✅ Monitor cron job logs in Vercel dashboard

## Support

For issues:

- Check [migrations/README.md](./README.md) for detailed migration docs
- Review Sanity migration logs in Studio
- Contact Sanity support if data restoration needed
