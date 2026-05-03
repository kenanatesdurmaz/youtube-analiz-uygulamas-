import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, amount } = body;

    console.log("TOPUP ATTEMPT:", { userId, amount });

    if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current credits or set to 0
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    let currentCredits = 0;
    if (profile) {
      currentCredits = profile.credits || 0;
    }

    // Try to update credits first (most important)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: userId,
        credits: currentCredits + (amount || 100),
        is_premium: true,
        last_renewed_at: new Date().toISOString()
      });

    if (updateError) {
       console.error("Update Error:", updateError);
       throw updateError;
    }

    // Try to update is_premium separately (might fail if column missing)
    try {
      await supabaseAdmin
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId);
    } catch (e) {
      console.log("is_premium column probably missing, skipping...");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Topup Final Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
