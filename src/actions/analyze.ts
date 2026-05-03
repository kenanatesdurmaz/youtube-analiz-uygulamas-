"use server";
// FORCED UPDATE - CLEAN BUILD v2
import { ApifyClient } from "apify-client";
import { createClient } from "@/utils/supabase/server";

// Apify istemcisini başlatıyoruz
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

const parseDuration = (durationStr: string) => {
  if (!durationStr) return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
};

export async function analyzeVideo(url: string) {
  const supabase = await createClient();

  // Auth kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "İşlem yapabilmek için giriş yapmalısınız." };
  }

  // Kredi kontrolü
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits, total_xp')
    .eq('id', user.id)
    .single();

  if (!profile || profile.credits <= 0) {
    return { success: false, error: "Yetersiz kredi. Lütfen bakiye yükleyin." };
  }

  try {
    if (!url || !url.includes("youtube.com") && !url.includes("youtu.be")) {
      return { success: false, error: "Geçerli bir YouTube URL'si girin." };
    }

    console.log("Starting Apify task for URL:", url);

    // Apify YouTube Scraper'ı çalıştırıyoruz
    const input = {
      startUrls: [{ url }],
      maxResults: 1,
      maxResultsShorts: 0,
      maxResultsStreams: 0,
      downloadSubtitles: true,
      saveSubtitlesToKVS: false,
    };

    const run = await apifyClient.actor("streamers/youtube-scraper").call(input);
    
    // Sonuçları çekiyoruz
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      return { success: false, error: "Video bulunamadı veya verisi çekilemedi." };
    }

    const videoData = items[0];
    
    // Altyazı / Transkript kontrolü
    let transcript = "";
    if (videoData.subtitles && Array.isArray(videoData.subtitles) && videoData.subtitles.length > 0) {
      // Genelde srt formatında geliyor, en mantıklısını seçiyoruz
      const enOrAuto = videoData.subtitles.find((s: any) => s.language === "en" || s.language === "tr" || s.type === "auto_generated");
      transcript = (enOrAuto ? enOrAuto.srt : videoData.subtitles[0].srt) as string;
    } else if ((videoData as any).text) {
      // Açıklama kısmını yedek olarak kullanabiliriz
      transcript = (videoData as any).text as string;
    }

    // Thumbnail için YouTube ID fallback'i
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    const finalThumbnail = videoData.thumbnailUrl || (videoData.thumbnails && videoData.thumbnails.length > 0 ? videoData.thumbnails[0].url : null) || (videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : null);

    // Krediyi düşür ve XP ekle (+10 XP)
    await supabase
      .from('profiles')
      .update({ 
        credits: profile.credits - 1,
        total_xp: (profile.total_xp || 0) + 10
      })
      .eq('id', user.id);

    // Veritabanına kaydet (Geçmiş için)
    const { data: savedAnalysis } = await supabase
      .from('analyses')
      .insert({
        user_id: user.id,
        video_url: url,
        title: videoData.title,
        channel: videoData.channelName,
        thumbnail: finalThumbnail,
        transcript: String(transcript),
        duration: Number(parseDuration(videoData.duration as string)),
        chat_history: []
      })
      .select('id')
      .single();

    return {
      success: true,
      data: {
        id: savedAnalysis?.id,
        title: videoData.title,
        channel: videoData.channelName,
        viewCount: videoData.viewCount,
        duration: videoData.duration,
        thumbnail: finalThumbnail,
        transcript: transcript,
      }
    };
  } catch (error: any) {
    console.error("Error analyzing video:", error);
    return { success: false, error: error.message || "Video analiz edilirken bir hata oluştu." };
  }
}
