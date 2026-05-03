"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";

export async function deleteAnalysisAction(id: string) {
  try {
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();

    if (!user) {
      return { success: false, error: "Oturum açmanız gerekiyor." };
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ownership first
    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('analyses')
      .select('user_id')
      .eq('id', id)
      .single();

    if (checkError || !checkData) {
      return { success: false, error: "Analiz bulunamadı." };
    }

    if (checkData.user_id !== user.id) {
      return { success: false, error: "Bu analizi silme yetkiniz yok." };
    }

    const { error } = await supabaseAdmin
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Delete action error:", err);
    return { success: false, error: err.message };
  }
}
