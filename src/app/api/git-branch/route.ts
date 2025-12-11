import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    let branch = process.env.NEXT_PUBLIC_GIT_BRANCH || '';
    if (!branch) {
      const out = execSync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd(), encoding: 'utf8' }).trim();
      branch = out;
    }
    return NextResponse.json({ branch });
  } catch (err) {
    return NextResponse.json({ branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'unknown' });
  }
}
