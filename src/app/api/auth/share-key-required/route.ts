/**
 * Share Key Configuration API
 *
 * Returns whether share key is required for registration.
 * This is a server-side check to avoid exposing REGISTRATION_SHARE_KEY to client.
 *
 * GET /api/auth/share-key-required
 * Returns: { required: boolean }
 */

import { successResponse } from "@/lib/api-utils";

interface ShareKeyConfigResponse {
  required: boolean;
}

export async function GET() {
  const required = Boolean(process.env.REGISTRATION_SHARE_KEY);

  const response: ShareKeyConfigResponse = {
    required,
  };

  return successResponse(response);
}
