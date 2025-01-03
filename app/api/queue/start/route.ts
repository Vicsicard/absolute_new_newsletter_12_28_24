import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { join } from 'path';

// Configure API route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let queueProcessorPid: number | null = null;

export async function POST(req: Request) {
  try {
    // Check authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token found' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 });
    }

    // Only start if not already running
    if (queueProcessorPid !== null) {
      try {
        // Check if process is still running
        process.kill(queueProcessorPid, 0);
        console.log('Queue processor already running with PID:', queueProcessorPid);
        return NextResponse.json({ 
          status: 'already_running',
          pid: queueProcessorPid 
        });
      } catch (e) {
        // Process not running, reset PID
        queueProcessorPid = null;
      }
    }

    // Start the queue processor
    const processorPath = join(process.cwd(), 'workers', 'queue-processor.ts');
    const queueProcessor = spawn('ts-node', [
      '-r',
      'tsconfig-paths/register',
      processorPath
    ], {
      stdio: 'pipe',
      detached: true
    });

    queueProcessorPid = queueProcessor.pid!;

    // Log output
    queueProcessor.stdout.on('data', (data) => {
      console.log('Queue processor:', data.toString());
    });

    queueProcessor.stderr.on('data', (data) => {
      console.error('Queue processor error:', data.toString());
    });

    queueProcessor.on('close', (code) => {
      console.log('Queue processor exited with code:', code);
      queueProcessorPid = null;
    });

    // Unref to allow the process to run independently
    queueProcessor.unref();

    return NextResponse.json({ 
      status: 'started',
      pid: queueProcessorPid
    });

  } catch (error) {
    console.error('Failed to start queue processor:', error);
    return NextResponse.json(
      { error: 'Failed to start queue processor' },
      { status: 500 }
    );
  }
}
