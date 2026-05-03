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

    // Try to find user_id in various possible locations
    let userId = data.user_id || 
                 data["user_id"] || 
                 data["custom_fields[user_id]"] || 
                 data.custom_fields?.user_id;
    
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

    // 1. If no sale_id, it's likely a verification ping
    if (!saleId || data.test === "true") {
      console.log("Gumroad Ping/Test detected. Returning 200 OK.");
      return NextResponse.json({ success: true, message: "Ping received" });
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
