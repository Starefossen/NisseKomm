# Cron Email Debugging - Quick Start Guide

## What Was Fixed

This PR fixes the issue where Vercel Cron jobs weren't sending emails and no logs were appearing. The solution adds:

1. ✅ Structured logging with timestamps
2. ✅ Health check diagnostics endpoint
3. ✅ Test script for verification
4. ✅ Comprehensive troubleshooting guide

## Quick Verification

### 1. Test Health Check

```bash
# Test production
curl https://nissekomm.no/api/cron/send-daily-emails

# Or use the test script
pnpm cron:health:prod
```

**Expected Response:**

```json
{
  "service": "Daily Mission Email Cron",
  "status": "healthy",
  "ready": true,
  "configuration": {
    "enabled": true,
    "hasCronSecret": true,
    "hasResendApiKey": true
  },
  "warnings": []
}
```

### 2. Check Required Environment Variables

Ensure these are set in Vercel Dashboard → Settings → Environment Variables:

```bash
CRON_SECRET=<your-secret>
RESEND_API_KEY=<your-key>
RESEND_FROM_EMAIL=Rampenissen <rampenissen@nissekomm.no>
NEXT_PUBLIC_STORAGE_BACKEND=sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-id>
SANITY_API_TOKEN=<your-token>
UNSUBSCRIBE_SECRET=<your-secret>
NEXT_PUBLIC_URL=https://nissekomm.no
```

### 3. View Cron Logs in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click "Deployments" → Select production deployment
3. Click "Functions" tab
4. Look for `/api/cron/send-daily-emails`
5. Click on any execution to view logs

**What You'll See Now:**

```
[2024-12-06T21:00:01.234Z] [Daily Email Cron] [INFO] === CRON JOB STARTED ===
[2024-12-06T21:00:01.235Z] [Daily Email Cron] [INFO] Environment Configuration {...}
[2024-12-06T21:00:01.236Z] [Daily Email Cron] [INFO] Authorization check {...}
...
[2024-12-06T21:00:05.123Z] [Daily Email Cron] [INFO] === CRON JOB COMPLETED === {...}
```

## Common Issues & Quick Fixes

### Issue: Health check shows `"ready": false`

**Check warnings array for specific issues:**

- **"Not in December"** → Normal outside December, cron won't send emails
- **"No more missions to send"** → Normal after Dec 24
- **"Sanity backend not configured"** → Set `NEXT_PUBLIC_STORAGE_BACKEND=sanity`
- **"Missing required secrets"** → Check `CRON_SECRET` and `RESEND_API_KEY`

### Issue: "Unauthorized" (401) in logs

**Fix:**

- Ensure `CRON_SECRET` is set in Vercel environment variables
- Vercel Cron uses this automatically

### Issue: "Email service requires Sanity backend"

**Fix:**

- Set `NEXT_PUBLIC_STORAGE_BACKEND=sanity` in environment variables
- Redeploy after changing

### Issue: No families subscribed

**Check in Sanity:**

```
*[_type == "familyCredentials" && emailSubscription == true]{
  parentEmail,
  familyName
}
```

If no results, families need to enable email subscriptions via settings.

## Testing Manually

### Trigger Cron Manually

```bash
curl -X POST https://nissekomm.no/api/cron/send-daily-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

**Note:** Only works during December (1-24).

### Test Email Sending (Dev Dataset)

```bash
pnpm email:daily-dev --day 5 --email your@email.com
```

## Documentation

- **Full troubleshooting guide:** `docs/CRON_TROUBLESHOOTING.md`
- **Required environment variables:** `README.md`
- **Health check test script:** `scripts/test-cron-health.ts`

## Support

If issues persist after:

1. ✅ Verifying all environment variables are set
2. ✅ Health check shows `"ready": true`
3. ✅ Checking Sanity for subscribed families
4. ✅ Reviewing Vercel function logs

Then collect:

- Health check response
- Recent Vercel function logs
- Number of subscribed families
- Environment variable status (NOT the values!)

And create an issue with this information.
