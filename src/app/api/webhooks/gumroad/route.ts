import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Gumroad Webhook Handler
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData);
    
    // Gumroad custom fields or URL params
    const userId = data.user_id as string;
    const saleId = data.sale_id as string;
    const email = data.email as string;
    const price = data.price as string;

    console.log("Gumroad Webhook Received:", { userId, saleId, email, price });

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    // Admin client to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Log the transaction (optional)
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      gumroad_sale_id: saleId,
      amount: parseInt(price) / 100, // Gumroad sends cents
      email: email,
      status: 'completed'
    });

    // 2. Increment user credits (Premium plan: 100 credits)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        credits: (profile.credits || 0) + 100,
        is_premium: true,
        last_renewed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, message: "Credits added" });
  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
