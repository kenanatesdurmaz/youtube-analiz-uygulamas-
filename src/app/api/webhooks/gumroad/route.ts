import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    let data: any;
    
    // Support both JSON and Form Data
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      data = Object.fromEntries(formData);
    }

    console.log("Gumroad Webhook Received Data:", JSON.stringify(data, null, 2));

    // Try to find user_id in any key (Gumroad can be unpredictable)
    for (const key of Object.keys(data)) {
      if (key.toLowerCase().includes('user_id')) {
        userId = data[key];
        console.log(`Found user_id in key: ${key}`);
        break;
      }
    }
    
    // If custom_fields is a string (JSON), parse it
    if (!userId && data.custom_fields && typeof data.custom_fields === 'string') {
      try {
        const cf = JSON.parse(data.custom_fields);
        userId = cf.user_id;
      } catch (e) {
        // Not JSON
      }
    }

    const saleId = data.sale_id || data.id;
    const email = data.email;
    const price = data.price; // cents

    // 1. If no sale_id, it's a verification ping. 
    // We only return early if there is absolutely no sale_id.
    if (!saleId) {
      console.log("Gumroad Verification Ping received. Returning 200 OK.");
      return NextResponse.json({ success: true, message: "Ping received" });
    }

    // If it's a test sale, we log it but continue
    if (data.test === "true") {
      console.log("Gumroad Test Sale detected. Proceeding with credit update for testing.");
    }

    // 2. If we have a sale but no user_id
    if (!userId) {
      console.warn("Webhook Warning: No user_id found in sale data.");
      return NextResponse.json({ error: "Missing user_id in sale data" }, { status: 200 });
    }

    console.log(`Processing sale ${saleId} for user ${userId}`);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Record transaction and check for duplicates
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('gumroad_sale_id', saleId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: "Already processed" });
    }

    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      gumroad_sale_id: saleId,
      amount: price ? parseInt(price) / 100 : 0,
      email: email,
      status: 'completed'
    });

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    await supabaseAdmin
      .from('profiles')
      .update({ 
        credits: (profile?.credits || 0) + 100,
        is_premium: true,
        last_renewed_at: new Date().toISOString()
      })
      .eq('id', userId);

    return NextResponse.json({ success: true, message: "Credits added successfully" });

  } catch (err: any) {
    console.error("Gumroad Webhook Final Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
