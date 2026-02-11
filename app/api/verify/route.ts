import { NextResponse } from 'next/server';
import { db } from '@/lib/db/service';

export async function POST(request: Request) {
    try {
        const { id, status } = await request.json();

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing ID or Status' }, { status: 400 });
        }

        const updated = await db.updateStatus(id, status);

        if (!updated) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
