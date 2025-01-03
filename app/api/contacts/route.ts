import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase-admin';
import { APIError } from '@/utils/errors';
import type { Contact, ContactStatus } from '@/types/email';

// Configure API route
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    const { company_id, email, name } = await req.json();

    if (!company_id || !email) {
      console.error('Missing required fields');
      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    // Check if contact already exists
    const { data: existingContact, error: existingError } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('company_id', company_id)
      .eq('email', email)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing contact:', existingError);
      return NextResponse.json(
        { success: false },
        { status: 500 }
      );
    }

    if (existingContact) {
      // Update existing contact if needed
      const { error: updateError } = await supabaseAdmin
        .from('contacts')
        .update({
          name: name || existingContact.name,
          status: 'active' as ContactStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id);

      if (updateError) {
        console.error('Error updating contact:', updateError);
        return NextResponse.json(
          { success: false },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...existingContact,
          name: name || existingContact.name,
          status: 'active'
        }
      });
    }

    // Create new contact
    const { data: newContact, error: createError } = await supabaseAdmin
      .from('contacts')
      .insert({
        company_id,
        email,
        name,
        status: 'active' as ContactStatus
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating contact:', createError);
      return NextResponse.json(
        { success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newContact
    });

  } catch (error) {
    console.error('Error in contacts route:', error);
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
