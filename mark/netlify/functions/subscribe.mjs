import { createSign } from "node:crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DEFAULT_SPREADSHEET_ID = "15CPNwma6Ejzy0J44SFGtVpgp6vEg2f916tFQIZcM8NI";
const DEFAULT_SHEET_NAME = "Sheet1";
const RATE_LIMIT_WINDOW_MS = Number(
  process.env.SUBSCRIBE_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000,
);
const RATE_LIMIT_MAX = Number(process.env.SUBSCRIBE_RATE_LIMIT_MAX ?? 5);

const requestLog = new Map();

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});

const getHeaders = (event) =>
  Object.fromEntries(
    Object.entries(event.headers ?? {}).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ]),
  );

const base64UrlEncode = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const signJwt = ({ clientEmail, privateKey }) => {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  const payload = {
    iss: clientEmail,
    scope: GOOGLE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: issuedAt + 3600,
    iat: issuedAt,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signer = createSign("RSA-SHA256");

  signer.update(unsignedToken);
  signer.end();

  const signature = signer
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${unsignedToken}.${signature}`;
};

const fetchAccessToken = async ({ clientEmail, privateKey }) => {
  const assertion = signJwt({ clientEmail, privateKey });
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google token request failed: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
};

const appendRow = async ({ accessToken, spreadsheetId, sheetName, values }) => {
  const range = encodeURIComponent(`${sheetName}!A:C`);
  const endpoint =
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append` +
    "?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      majorDimension: "ROWS",
      values: [values],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets append failed: ${errorText}`);
  }
};

const getExpectedOrigin = (headers) => {
  if (process.env.SUBSCRIBE_ALLOWED_ORIGIN) {
    return process.env.SUBSCRIBE_ALLOWED_ORIGIN;
  }

  const protocol = headers["x-forwarded-proto"] ?? "https";
  const host = headers["x-forwarded-host"] ?? headers.host;

  return host ? `${protocol}://${host}` : "";
};

const hasTrustedOrigin = (headers, expectedOrigin) => {
  const origin = headers.origin;
  const referer = headers.referer;
  const fetchSite = headers["sec-fetch-site"];

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }

  if (origin) {
    return origin === expectedOrigin;
  }

  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return true;
};

const getClientIp = (headers) => {
  const forwardedFor = headers["x-forwarded-for"];

  return (
    headers["x-nf-client-connection-ip"] ||
    headers["client-ip"] ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : "") ||
    "unknown"
  );
};

const isRateLimited = (ipAddress) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recentRequests = (requestLog.get(ipAddress) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );

  recentRequests.push(now);
  requestLog.set(ipAddress, recentRequests);

  for (const [key, timestamps] of requestLog.entries()) {
    const filtered = timestamps.filter((timestamp) => timestamp > windowStart);
    if (filtered.length === 0) {
      requestLog.delete(key);
      continue;
    }
    requestLog.set(key, filtered);
  }

  return recentRequests.length > RATE_LIMIT_MAX;
};

const readPayload = (event) => {
  if (!event.body || event.body.length > 2048) {
    throw new Error("Invalid request body.");
  }

  return JSON.parse(event.body);
};

export async function handler(event) {
  const headers = getHeaders(event);

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        Allow: "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  if (!headers["content-type"]?.includes("application/json")) {
    return json(415, { error: "Expected a JSON request." });
  }

  const expectedOrigin = getExpectedOrigin(headers);
  if (expectedOrigin && !hasTrustedOrigin(headers, expectedOrigin)) {
    return json(403, { error: "Origin not allowed." });
  }

  const clientIp = getClientIp(headers);
  if (isRateLimited(clientIp)) {
    return json(429, { error: "Too many requests. Please try again later." });
  }

  let payload;
  try {
    payload = readPayload(event);
  } catch {
    return json(400, { error: "Invalid request body." });
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  const company = String(payload.company ?? "").trim();

  if (company) {
    return json(200, { ok: true });
  }

  if (!EMAIL_REGEX.test(email) || email.length > 320) {
    return json(400, { error: "Please enter a valid email address." });
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  const spreadsheetId =
    process.env.GOOGLE_SHEET_ID ?? DEFAULT_SPREADSHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_TAB ?? DEFAULT_SHEET_NAME;
  const sourceLabel = process.env.SUBSCRIBE_SOURCE_LABEL ?? "hana-waitlist";

  if (!clientEmail || !privateKey) {
    console.error("Missing Google Sheets credentials.");
    return json(500, { error: "Waitlist is not configured yet." });
  }

  try {
    const accessToken = await fetchAccessToken({ clientEmail, privateKey });

    await appendRow({
      accessToken,
      spreadsheetId,
      sheetName,
      values: [new Date().toISOString(), email, sourceLabel],
    });

    return json(200, { ok: true });
  } catch (error) {
    console.error("Failed to append waitlist row:", error);
    return json(502, { error: "Unable to save your email right now." });
  }
}
