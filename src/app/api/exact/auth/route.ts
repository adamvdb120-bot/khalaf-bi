import { NextResponse } from "next/server";

export async function GET() {
  const params = new URLSearchParams({
    client_id: process.env.EXACT_CLIENT_ID!,
    redirect_uri: process.env.EXACT_REDIRECT_URI!,
    response_type: "code",
    force_login: "0",
  });

  const url = `https://start.exactonline.nl/api/oauth2/auth?${params}`;
  return NextResponse.redirect(url);
}
