"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function checkAndRenewCreditsAction() {
  try {
    const supabaseUser = await createServerClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) return { success: false, error: "No user" };

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits, is_premium, last_renewed_at')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_premium) return { success: false };

    const lastRenewed = new Date(profile.last_renewed_at || 0);
    const now = new Date();
    
    // Check if 30 days (in milliseconds) have passed since last renewal
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const timeDiff = now.getTime() - lastRenewed.getTime();

    if (timeDiff >= thirtyDaysInMs) {
      // Renew credits!
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: (profile.credits || 0) + 100,
          last_renewed_at: now.toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      return { success: true, renewed: true, newCredits: (profile.credits || 0) + 100 };
    }

    return { success: true, renewed: false };
  } catch (err) {
    console.error("Renewal Error:", err);
    return { success: false, error: "Internal error" };
  }
}
