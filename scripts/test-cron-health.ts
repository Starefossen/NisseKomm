#!/usr/bin/env tsx
/**
 * Test Cron Job Health Check
 *
 * This script tests the cron job health check endpoint locally or remotely.
 * Useful for verifying configuration before deployment.
 *
 * Usage:
 *   # Test local development server
 *   tsx scripts/test-cron-health.ts
 *
 *   # Test specific URL
 *   tsx scripts/test-cron-health.ts https://nissekomm.no
 *
 *   # Test with family count check
 *   tsx scripts/test-cron-health.ts --test
 */

const baseUrl = process.argv[2] || "http://localhost:3000";
const testMode = process.argv.includes("--test");

async function testHealthCheck() {
  const url = `${baseUrl}/api/cron/send-daily-emails${testMode ? "?test=true" : ""}`;

  console.log("╔══════════════════════════════════════════╗");
  console.log("║  🏥 Cron Job Health Check Test          ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log("");
  console.log(`📍 Testing URL: ${url}`);
  console.log(
    `🔍 Test mode: ${testMode ? "Yes (includes family count)" : "No"}`,
  );
  console.log("");

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log("📊 Response Status:", response.status, response.statusText);
    console.log("");
    console.log("📋 Health Check Results:");
    console.log("━".repeat(50));
    console.log(JSON.stringify(data, null, 2));
    console.log("━".repeat(50));
    console.log("");

    // Analyze results
    if (data.ready) {
      console.log("✅ READY - Cron job is properly configured!");
    } else {
      console.log("❌ NOT READY - Configuration issues detected:");
      if (data.warnings && Array.isArray(data.warnings)) {
        data.warnings.forEach((warning: string) => {
          console.log(`   ⚠️  ${warning}`);
        });
      }
    }

    console.log("");

    // Specific checks
    if (data.configuration) {
      console.log("🔧 Configuration Details:");
      console.log(`   Backend: ${data.configuration.storageBackend}`);
      console.log(
        `   Cron Secret: ${data.configuration.hasCronSecret ? "✓ Set" : "✗ Missing"}`,
      );
      console.log(
        `   Resend API Key: ${data.configuration.hasResendApiKey ? "✓ Set" : "✗ Missing"}`,
      );
      console.log(`   Base URL: ${data.configuration.baseUrl}`);
      console.log("");
    }

    if (data.readiness) {
      console.log("🎯 Readiness Checks:");
      console.log(`   In December: ${data.readiness.inDecember ? "✓" : "✗"}`);
      console.log(
        `   Has More Missions: ${data.readiness.hasMoreMissions ? "✓" : "✗"}`,
      );
      console.log(
        `   Backend Configured: ${data.readiness.backendConfigured ? "✓" : "✗"}`,
      );
      console.log(
        `   Secrets Configured: ${data.readiness.secretsConfigured ? "✓" : "✗"}`,
      );
      console.log("");
    }

    if (
      testMode &&
      "subscribedFamiliesCount" in data &&
      typeof data.subscribedFamiliesCount === "number"
    ) {
      console.log("👨‍👩‍👧‍👦 Subscribed Families:");
      console.log(`   Count: ${data.subscribedFamiliesCount}`);
      console.log("");
    }

    if (data.sanityError) {
      console.log("⚠️  Sanity Connection Error:");
      console.log(`   ${data.sanityError}`);
      console.log("");
    }

    // Summary
    console.log("════════════════════════════════════════════");
    if (data.ready) {
      console.log("✅ Test passed - system is ready");
    } else {
      console.log("❌ Test failed - fix warnings above");
    }
    console.log("════════════════════════════════════════════");

    process.exit(data.ready ? 0 : 1);
  } catch (error) {
    console.error("❌ Error testing health check:");
    console.error(error);
    console.log("");
    console.log("Possible issues:");
    console.log("  • Server is not running");
    console.log("  • URL is incorrect");
    console.log("  • Network connectivity problem");
    process.exit(1);
  }
}

testHealthCheck();
