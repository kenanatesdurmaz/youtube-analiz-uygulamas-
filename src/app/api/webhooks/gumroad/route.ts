import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    let data: any;
    
    // Hem JSON hem de Form Data'yı destekleyelim
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await req.json();
    } else {
      const formData = await req.formData();
      data = Object.fromEntries(formData);
    }

    console.log("Gumroad Webhook Raw Data:", JSON.stringify(data));

    // Gumroad query param veya custom field olarak user_id gönderebilir
    // Bazı durumlarda custom_fields içinde JSON string olarak gelebilir
    let userId = data.user_id || data["custom_fields[user_id]"];
    
    // Eğer custom_fields bir string ise onu parçalayalım
    if (!userId && data.custom_fields) {
      try {
        const cf = JSON.parse(data.custom_fields);
        userId = cf.user_id;
      } catch (e) {
        // Not a JSON string
      }
    }

    const saleId = data.sale_id || data.id;
    const email = data.email;
    const price = data.price; // Gumroad sends cents

    if (!userId) {
      console.error("Webhook Error: No user_id found in data", data);
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. İşlemi kaydet
    await supabaseAdmin.from('transactions').insert({
      user_id: userId,
      gumroad_sale_id: saleId,
      amount: price ? parseInt(price) / 100 : 0,
      email: email,
      status: 'completed'
    });

    // 2. Kredileri güncelle
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
    console.error("Webhook Error Details:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
