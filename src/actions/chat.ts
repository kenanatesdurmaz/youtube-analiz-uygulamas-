"use server";

import { GoogleGenAI } from '@google/generative-ai';
import { createClient } from "@/utils/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function askQuestion(transcript: string, question: string, analysisId?: string, cost: number = 1, label?: string) {
  const supabase = await createClient();

  // Auth kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Soru sormak için giriş yapmalısınız." };
  }

  // Kredi kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, total_xp')
    .eq('id', user.id)
    .single();

  if (!profile || profile.credits < cost) {
    return { success: false, error: "Yetersiz kredi." };
  }

  try {
    if (!transcript) {
      return { success: false, error: "Transkript bulunamadı." };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Sen uzman bir video asistanısın. Aşağıdaki video transkriptine dayanarak sorumu cevapla. Transkriptte olmayan bir şey sorarsam 'Bununla ilgili bilgi yok' de.\n\nTRANSKRİPT:\n${transcript}\n\nSORU: ${question}` }]
        }
      ]
    });

    // Krediyi düşür
    await supabase
      .from('profiles')
      .update({ 
        credits: profile.credits - cost,
        total_xp: (profile.total_xp || 0) + 5
      })
      .eq('id', user.id);

    // Eğer bir analiz kimliği verilmişse, sohbeti o analize kaydet
    if (analysisId) {
      // Önce mevcut geçmişi çek
      const { data: analysisData } = await supabase
        .from('analyses')
        .select('chat_history')
        .eq('id', analysisId)
        .single();
      
      const currentHistory = analysisData?.chat_history || [];
      const newHistory = [
        ...currentHistory,
        { role: 'user', text: question, label: label },
        { role: 'ai', text: response.text }
      ];

      await supabase
        .from('analyses')
        .update({ chat_history: newHistory })
        .eq('id', analysisId);
    }

    return {
      success: true,
      answer: response.text
    };
  } catch (error: any) {
    console.error("Error in chat:", error);
    return { success: false, error: error.message || "Soru cevaplanırken bir hata oluştu." };
  }
}
