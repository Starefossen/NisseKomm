# Vercel Cron Job Troubleshooting Guide

## Overview

The NisseKomm application uses Vercel Cron Jobs to send daily mission reminder emails to subscribed families at 21:00 CET each evening during December.

**Cron Job Configuration:**
- **Path:** `/api/cron/send-daily-emails`
- **Schedule:** `0 21 * 12 *` (9 PM every day in December)
- **Method:** POST
- **Authorization:** Bearer token via `CRON_SECRET`

## Required Environment Variables

The cron job requires the following environment variables to be set in your Vercel project:

### Essential Variables

```bash
# Required for cron authorization
CRON_SECRET=<your-secret-token>

# Required for email sending via Resend
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=Rampenissen <rampenissen@nissekomm.no>

# Required for Sanity backend
NEXT_PUBLIC_STORAGE_BACKEND=sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
SANITY_API_TOKEN=<your-sanity-token>

# Required for URL generation
NEXT_PUBLIC_URL=https://nissekomm.no

# Required for unsubscribe token generation
UNSUBSCRIBE_SECRET=<your-unsubscribe-secret>
```

### How to Set Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with the appropriate value
4. Make sure to set them for the **Production** environment
5. Redeploy your application after adding variables

## Checking Cron Job Status

### 1. View Cron Job Logs in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Deployments** → Select your production deployment
3. Click on **Functions** tab
4. Look for executions of `/api/cron/send-daily-emails`
5. Click on any execution to view detailed logs

### 2. Test Health Check Endpoint

You can test the cron job configuration by visiting the GET endpoint:

```bash
curl https://nissekomm.no/api/cron/send-daily-emails
```

This will return a JSON response with:
- Current configuration status
- Whether all required secrets are set
- Current date/time information
- Readiness status
- Any warnings or issues

**Example healthy response:**
```json
{
  "service": "Daily Mission Email Cron",
  "status": "healthy",
  "ready": true,
  "configuration": {
    "storageBackend": "sanity",
    "enabled": true,
    "hasCronSecret": true,
    "hasResendApiKey": true
  },
  "readiness": {
    "inDecember": true,
    "hasMoreMissions": true,
    "backendConfigured": true,
    "secretsConfigured": true
  },
  "warnings": []
}
```

### 3. Test with Family Count

To also check how many families are subscribed:

```bash
curl https://nissekomm.no/api/cron/send-daily-emails?test=true
```

This will include `subscribedFamiliesCount` in the response.

## Common Issues and Solutions

### Issue 1: No Logs Appearing in Vercel

**Symptoms:**
- Cron job runs but no logs are visible
- No success or error messages

**Possible Causes:**
1. **Logs are being filtered out** - Check Vercel's log level settings
2. **Function timeout** - The function may be timing out before logs are flushed
3. **Silent failures** - Errors are being caught but not logged

**Solutions:**
1. Check the health check endpoint to verify configuration
2. Review Vercel's function logs with different filters
3. The improved logging now includes timestamps and structured JSON for better visibility

### Issue 2: No Emails Being Sent

**Symptoms:**
- Cron job runs successfully
- Logs show no errors
- No emails received

**Possible Causes:**
1. **Missing RESEND_API_KEY** - Email service cannot authenticate
2. **Invalid FROM_EMAIL** - Sender email not verified in Resend
3. **No subscribed families** - Database has no families with `emailSubscription: true`
4. **Wrong storage backend** - Using localStorage instead of Sanity
5. **Outside December** - Cron only sends emails in December
6. **After December 24** - No more missions to send

**Solutions:**
1. Verify environment variables are set correctly
2. Check Resend dashboard for API key status and domain verification
3. Query Sanity to confirm subscribed families exist:
   ```bash
   # In Sanity Studio or API:
   *[_type == "familyCredentials" && emailSubscription == true]{
     parentEmail,
     familyName,
     emailSubscription
   }
   ```
4. Ensure `NEXT_PUBLIC_STORAGE_BACKEND=sanity`
5. Check current date - cron only runs in December

### Issue 3: Unauthorized (401) Error

**Symptoms:**
- Logs show "Unauthorized access attempt"
- Cron job returns 401 status

**Possible Causes:**
1. **Missing CRON_SECRET** - Environment variable not set
2. **Mismatched secret** - Vercel Cron secret doesn't match `CRON_SECRET`
3. **Incorrect header format** - Authorization header not in `Bearer <token>` format

**Solutions:**
1. Set `CRON_SECRET` in Vercel environment variables
2. Ensure Vercel Cron is configured to use the same secret
3. Check Vercel Cron documentation for proper setup

### Issue 4: "Email service requires Sanity backend" Error

**Symptoms:**
- Logs show this error message
- No emails are sent

**Solution:**
Set `NEXT_PUBLIC_STORAGE_BACKEND=sanity` in Vercel environment variables and redeploy.

### Issue 5: Resend API Errors

**Symptoms:**
- Logs show Resend API errors
- Emails fail to send

**Common Resend Errors:**
1. **Missing API key** - `RESEND_API_KEY` not set
2. **Invalid API key** - Key is incorrect or revoked
3. **Unverified domain** - FROM_EMAIL domain not verified in Resend
4. **Rate limiting** - Too many requests (rare with daily cron)

**Solutions:**
1. Verify API key in Resend dashboard
2. Check domain verification status
3. Review Resend logs for specific error messages

## Manual Testing

### Test the Cron Job Manually

You can trigger the cron job manually using curl:

```bash
curl -X POST https://nissekomm.no/api/cron/send-daily-emails \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"
```

Replace `YOUR_CRON_SECRET` with your actual `CRON_SECRET` value.

**Expected Response (success):**
```json
{
  "success": true,
  "day": 5,
  "missionTitle": "...",
  "totalFamilies": 10,
  "sent": 10,
  "failed": 0
}
```

### Test Email Sending Script

For testing email rendering and delivery, use the provided script:

```bash
# Test with development dataset
pnpm email:daily-dev --day 5 --email parent@example.com

# Test with production dataset (use carefully!)
pnpm email:daily-prod --day 5 --email parent@example.com --dry-run
```

## Vercel Cron Configuration

### Verify Cron Schedule in vercel.json

The `vercel.json` file should contain:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-daily-emails",
      "schedule": "0 21 * 12 *"
    }
  ]
}
```

**Schedule Format:** `minute hour day-of-month month day-of-week`
- `0 21 * 12 *` = 21:00 (9 PM) every day in December

### Enable Cron Jobs in Vercel

1. Ensure your project is on a Vercel Pro or Enterprise plan (Cron Jobs require paid plan)
2. Verify Cron Jobs are enabled in project settings
3. Check the Cron Jobs dashboard in Vercel for execution history

## Monitoring Best Practices

### 1. Regular Health Checks

Set up monitoring to regularly check the health endpoint:

```bash
curl https://nissekomm.no/api/cron/send-daily-emails
```

### 2. Review Logs Daily

During December, review Vercel function logs daily to ensure:
- Cron job is running at 21:00 CET
- Emails are being sent successfully
- No unexpected errors

### 3. Monitor Resend Dashboard

Check Resend dashboard for:
- Email delivery status
- Bounce rates
- API usage

### 4. Test Before December

Test the entire flow in November:
- Set up test families with email subscriptions
- Use the manual testing script to verify emails
- Check that unsubscribe links work correctly

## Debugging Checklist

When emails are not being sent, check these in order:

- [ ] Verify Vercel Cron Jobs are enabled (requires paid plan)
- [ ] Check `vercel.json` has correct cron configuration
- [ ] Confirm all required environment variables are set
- [ ] Test the health check endpoint (`GET /api/cron/send-daily-emails`)
- [ ] Verify current date is in December (1-24)
- [ ] Check Sanity for subscribed families
- [ ] Review Vercel function logs for errors
- [ ] Check Resend dashboard for API errors
- [ ] Test manual cron job trigger with curl
- [ ] Verify domain is verified in Resend
- [ ] Check Resend API key is valid and active

## Log Analysis

### Understanding Log Levels

The improved logging includes three levels:
- **INFO**: Normal operation, configuration, progress
- **WARN**: Non-critical issues (e.g., no subscribed families)
- **ERROR**: Critical failures (e.g., API errors, missing data)

### Key Log Messages

**Startup:**
```
[INFO] === CRON JOB STARTED ===
[INFO] Environment Configuration
```

**Authorization:**
```
[INFO] Authorization check
[WARN] Unauthorized access attempt
```

**Email Sending:**
```
[INFO] Starting email send to X families...
[INFO] Sending email 1/X
[INFO] Email sent successfully
[ERROR] Email service returned false
```

**Completion:**
```
[INFO] === CRON JOB COMPLETED ===
```

## Getting Help

If you've gone through this guide and still have issues:

1. Collect the following information:
   - Health check endpoint response
   - Recent Vercel function logs
   - Resend API logs
   - Number of subscribed families in Sanity
   - Environment variables (DO NOT share actual secrets!)

2. Create an issue with:
   - Problem description
   - What you've tried
   - Relevant logs (redact any secrets)
   - Environment details

## Related Documentation

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Resend API Documentation](https://resend.com/docs)
- [Sanity Client Documentation](https://www.sanity.io/docs/js-client)
