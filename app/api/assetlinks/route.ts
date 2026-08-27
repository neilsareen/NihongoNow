import { NextResponse } from "next/server";

// Digital Asset Links — the statement that this domain and the Android app are
// published by the same party. Chrome fetches it when the TWA launches and only
// hides the URL bar if the certificate the installed APK was signed with
// appears below. A missing or mismatched fingerprint doesn't break the app; it
// just leaves an address bar pinned to the top, which is what a half-finished
// TWA looks like.
//
// Reached at /.well-known/assetlinks.json via the rewrite in next.config.ts.
//
// Fingerprints are public by design — they identify a signing certificate, they
// don't grant the ability to use it — but they live in an env var rather than in
// the repo because the list grows: once the app is on Play, Google re-signs it
// with its own certificate under Play App Signing, and that one has to be added
// here too or installs from the Play Store stop verifying. An env var makes that
// a dashboard change instead of a deploy.

export const dynamic = "force-dynamic";

const DEFAULT_PACKAGE_NAME = "com.neilsareen.ikou";

function certFingerprints(): string[] {
  return (process.env.ANDROID_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

export function GET() {
  const fingerprints = certFingerprints();

  // An empty statement list is valid and simply delegates to nothing, which is
  // the honest answer before a signing key exists. Returning 200 with [] keeps
  // the endpoint well-formed for Google's verifier either way.
  const statements = fingerprints.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name:
              process.env.ANDROID_PACKAGE_NAME ?? DEFAULT_PACKAGE_NAME,
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]
    : [];

  return NextResponse.json(statements, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
