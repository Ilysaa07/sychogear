import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    },
    headers: {
      // Return host to help debug domain issues
    }
  };

  return NextResponse.json(data);
}
