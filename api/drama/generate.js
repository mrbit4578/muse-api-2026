// API Handler: Full Vietnamese Drama Production Engine with Muse API Key
const crypto = require('crypto');

if (!global.__MUSE_ACCOUNTS) {
  global.__MUSE_ACCOUNTS = new Map();
}

function getAccountOrKey(req) {
  const authHeader = req.headers.authorization || '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim() || req.body?.apiKey || req.query?.apiKey;

  if (apiKey && global.__MUSE_ACCOUNTS.has(apiKey)) {
    return { apiKey, account: global.__MUSE_ACCOUNTS.get(apiKey) };
  }
  if (global.__MUSE_ACCOUNTS.size > 0) {
    const acc = global.__MUSE_ACCOUNTS.values().next().value;
    return { apiKey: acc.apiKey, account: acc };
  }
  return { apiKey: apiKey || 'sk-muse-guest-studio', account: null };
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, account } = getAccountOrKey(req);

    const {
      idea = 'Chàng rể lái xe ôm công nghệ bị cả dòng họ vợ sỉ nhục trong tiệc mừng thọ, thực chất là người thừa kế duy nhất của đế chế nghìn tỷ.',
      title = '',
      genre = 'Tổng tài ngầm / Bí mật thân phận / Báo thù',
      durationMinutes = 5,
      clipSeconds = 15,
      narratorAccent = 'Nam Bắc Bộ 45 tuổi (Trầm ấm, uy quyền)',
      ending = 'Nhân quả xứng đáng (Gieo gió gặt bão)',
      audioMode = 'A'
    } = req.body || {};

    const totalClips = Math.max(3, Math.min(40, Math.ceil((durationMinutes * 60) / clipSeconds)));
    console.log(`[Drama Engine] Producing "${title || idea.slice(0, 30)}..." using API Key: ${apiKey.slice(0, 10)}...`);

    const productionTitle = title || deriveTitleFromIdea(idea, genre);

    // 1. Synthesize 3-act story, prompts, scenes
    const scenes = [];
    const prompts = [];

    const storySummary = `Bộ phim "${productionTitle}" xoay quanh câu chuyện ${idea}. Trải qua bao uất ức và những lời sỉ nhục cay đắng, sự thật về thân phận cuối cùng đã được phơi bày tại thời khắc quyết định, đem lại bài học nhân quả sâu sắc.`;

    let fullStoryMarkdown = `# ${productionTitle}\n\n`;
    fullStoryMarkdown += `**Thể loại:** ${genre} | **Thời lượng:** ${durationMinutes} phút (${totalClips} phân cảnh, ${clipSeconds}s/clip)\n`;
    fullStoryMarkdown += `**Giọng dẫn chuyện:** ${narratorAccent} | **API Key khởi tạo:** \`${apiKey.slice(0, 14)}...\`\n\n`;
    fullStoryMarkdown += `## Tóm tắt cốt truyện:\n${storySummary}\n\n`;
    fullStoryMarkdown += `## Bảng phân vai giọng đọc (Voice Registry):\n`;
    fullStoryMarkdown += `- **NARRATOR_001:** Người dẫn chuyện (${narratorAccent})\n`;
    fullStoryMarkdown += `- **VOICE_001:** Nhân vật chính (Kiên nghị, trầm tĩnh, chịu nhẫn nhịn)\n`;
    fullStoryMarkdown += `- **VOICE_002:** Nhân vật phản diện (Hống hách, khinh người, gia trưởng)\n`;
    fullStoryMarkdown += `- **VOICE_003:** Người thân / Mẹ vợ (Sắc sảo, toan tính)\n\n`;
    fullStoryMarkdown += `## Phân cảnh kịch bản chi tiết & Chuỗi Prompt Muse AI:\n\n`;

    for (let i = 1; i <= totalClips; i++) {
      const numStr = String(i).padStart(3, '0');
      let act = 1;
      let sceneName = '';
      let visualEn = '';
      let narrationVi = '';
      let dialogueVi = '';
      let charName = 'MINH';
      let cameraMotion = 'cinematic slow push-in, 35mm lens';
      let lightingDesc = 'moody dramatic chiaroscuro lighting';

      if (i === 1) {
        act = 1;
        sceneName = 'Mở đầu: Đêm tiệc mừng thọ định mệnh';
        visualEn = 'A luxurious banquet hall in Hanoi with lavish decorations, close-up shot of a humble faded delivery jacket placed on a chair edge, contrast between gold luxury and humble clothing';
        narrationVi = 'Ba năm làm rể nhà họ Trần, Minh chưa từng nghĩ sự nhẫn nhịn của mình lại bị xem là thứ hèn mọn để người khác giẫm đạp.';
        dialogueVi = 'Thằng xe ôm rách nát như mày, có tư cách gì bước chân vào sảnh chính nhà họ Trần?';
        charName = 'BÀ_TRẦN';
        cameraMotion = 'slow tracking shot across the banquet table';
        lightingDesc = 'warm golden ambient light contrasting with harsh cold shadows';
      } else if (i === Math.floor(totalClips * 0.3)) {
        act = 2;
        sceneName = 'Leo thang: Sự sỉ nhục lên đến đỉnh điểm';
        visualEn = 'A luxury champagne glass dropped and shattered on glossy marble floor, liquid splashing, expensive dress shoes stepping past dismissively';
        narrationVi = 'Từng lời nhục mạ trút xuống như nhát dao, nhưng ánh mắt Minh vẫn lạnh lùng đến kỳ lạ. Cơn thịnh nộ đang âm ỉ thức giấc.';
        dialogueVi = 'Đừng nói nhiều nữa, ký vào đơn ly hôn này rồi cút khỏi đây ngay lập tức!';
        charName = 'ÔNG_QUỐC';
        cameraMotion = 'low-angle static shot focusing on shattered glass';
      } else if (i === Math.floor(totalClips * 0.5)) {
        act = 2;
        sceneName = 'Cú lật ngược tình thế: Cuộc điện thoại bí mật';
        visualEn = 'Rear view of a man stepping outside onto a rainy balcony under city neon glow, holding a sleek black smartphone, confident silhouette';
        narrationVi = 'Bước ra khỏi cánh cửa xa hoa, một cuộc gọi ngắn gọn được kết nối. Kẻ săn mồi thực sự bắt đầu giăng lưới.';
        dialogueVi = 'Chủ tịch, toàn bộ cổ phần tập đoàn đã chuyển giao xong. Chúng tôi đang chờ lệnh ngài.';
        charName = 'TRỢ_LÝ_LONG';
        cameraMotion = 'slow pull-back revealing modern city skyline at night';
      } else if (i === Math.floor(totalClips * 0.8)) {
        act = 3;
        sceneName = 'Cao trào: Sự thật chấn động phơi bày';
        visualEn = 'An official black leather folder opened on table showing billion-dollar ownership seal and stamp, trembling hands of wealthy family members';
        narrationVi = 'Khi đoàn xe đen sang trọng dừng trước sảnh và vị tổng giám đốc cúi đầu kính cẩn, cả dòng họ mới bàng hoàng nhận ra sai lầm chết người.';
        dialogueVi = 'Không... không thể nào! Làm sao nó có thể là Chủ tịch tập đoàn Thiên Ân được?';
        charName = 'BÀ_TRẦN';
        cameraMotion = 'rapid slow-motion tilt up from contract to shocked faces';
      } else if (i === totalClips) {
        act = 3;
        sceneName = 'Hồi kết: Bài học nhân quả đắt giá';
        visualEn = 'Silhouetted Vietnamese man in tailored bespoke suit walking down grand staircase of marble hall, confident stride, morning sunlight pouring in';
        narrationVi = 'Gieo nhân nào gặt quả nấy. Kẻ tham lam rốt cuộc trắng tay, còn người kiên cường đã bước lên đỉnh cao xứng đáng.';
        dialogueVi = 'Ba năm qua, ân nghĩa đã trả đủ. Từ nay họ Trần và tôi, ân đoạn nghĩa tuyệt!';
        charName = 'MINH';
        cameraMotion = 'epic slow forward track following subject into sunlight';
      } else {
        const step = i < totalClips * 0.4 ? 1 : i < totalClips * 0.75 ? 2 : 3;
        act = step;
        sceneName = `Hồi ${act}: Diễn biến phân đoạn ${i}`;
        visualEn = `Atmospheric Vietnamese cinematic scene, realistic props representing family conflict and tension, rain or moody interior`;
        narrationVi = `Sự việc ngày một căng thẳng khi những toan tính đen tối dần lộ diện dưới ánh đèn hoa lệ.`;
        dialogueVi = `Các người nhất định sẽ phải trả giá cho những việc mình đã làm!`;
        charName = i % 2 === 0 ? 'MINH' : 'BÀ_TRẦN';
      }

      // Muse AI formatted prompt
      const promptLine = `PROMPT ${numStr} | SCENE: ${sceneName} | VISUAL: ${visualEn} | ACTION: slow deliberate movement | CAMERA: ${cameraMotion} | LIGHTING: ${lightingDesc} | AUDIO MODE=${audioMode} | NARRATOR VOICE LOCK: NARRATOR_001 ${narratorAccent} | 00:00-00:08 NARRATION OWNER=NARRATOR_001 TEXT="${narrationVi}" | 00:08-00:13 CHARACTER_DIALOGUE OWNER=VOICE_001 NAME=${charName} TEXT="${dialogueVi}" | AMBIENCE: subtle dramatic strings and rain | SPEAKER FIREWALL: active | IVS: independent | NEGATIVE: no on-screen speech, no visible mouth movement, no lip-sync, no morphing, no floating objects, no extra limbs, no subtitles.`;

      prompts.push(promptLine);

      // Storyboard Image Prompt for Image Generation API
      const imagePrompt = `Cinematic still from Vietnamese drama film, ${visualEn}, 35mm anamorphic lens, shot on Arri Alexa, cinematic lighting, 8k resolution, highly detailed, photorealistic`;

      // Real Photorealistic AI Image URL (High-definition 1280x720, Arri Alexa 35mm cinematic still)
      const cleanVisual = String(visualEn).replace(/[^a-zA-Z0-9\s,.-]/g, ' ').trim();
      const realisticPrompt = encodeURIComponent(`cinematic dramatic still, ${cleanVisual}, masterpiece, highly detailed, photorealistic 8k, award winning film cinematography, 35mm photograph, shot on Arri Alexa`);
      const seed = (i * 7919 + 101) % 999999;
      const realAiUrl = `https://image.pollinations.ai/prompt/${realisticPrompt}?width=1280&height=720&nologo=true&seed=${seed}`;
      const localProxyUrl = `/api/drama/image?scene=${i}&prompt=${encodeURIComponent(visualEn)}&title=${encodeURIComponent(sceneName)}`;

      scenes.push({
        clipNumber: i,
        act: act,
        sceneName: sceneName,
        visualPrompt: visualEn,
        imagePrompt: imagePrompt,
        narration: narrationVi,
        dialogueOwner: charName,
        dialogue: dialogueVi,
        rawPrompt: promptLine,
        imageUrl: realAiUrl,
        aiImageUrl: realAiUrl,
        fallbackUrl: localProxyUrl
      });

      fullStoryMarkdown += `### Phân cảnh ${i} (${sceneName})\n`;
      fullStoryMarkdown += `- **Hình ảnh (Visual):** ${visualEn}\n`;
      fullStoryMarkdown += `- **MC Lời bình:** "${narrationVi}"\n`;
      fullStoryMarkdown += `- **Thoại [${charName}]:** "${dialogueVi}"\n`;
      fullStoryMarkdown += `- **Prompt Muse:** \`${promptLine}\`\n\n`;
    }

    // 2. Build exact SubRip .SRT format
    const srtContent = buildSrtSubtitles(scenes, clipSeconds);

    // Deduct quota if account exists
    if (account && account.quota) {
      account.quota.used += 1500;
      account.quota.remaining = Math.max(0, account.quota.total - account.quota.used);
    }

    return res.status(200).json({
      success: true,
      title: productionTitle,
      metadata: {
        genre,
        durationMinutes,
        clipSeconds,
        totalClips,
        narratorAccent,
        ending,
        apiKeyUsed: apiKey
      },
      storyMarkdown: fullStoryMarkdown,
      prompts: prompts,
      scenes: scenes,
      srtContent: srtContent,
      stats: {
        totalPrompts: prompts.length,
        totalScenes: scenes.length,
        estimatedDurationSec: totalClips * clipSeconds,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Drama Engine Error]', error);
    return res.status(500).json({
      success: false,
      error: `Lỗi trong quá trình tạo phim Drama: ${error.message}`
    });
  }
};

function deriveTitleFromIdea(idea, genre) {
  if (idea.includes('xe ôm') || idea.includes('chàng rể')) return 'Thân Phận Thật Của Chàng Rể Xe Ôm';
  if (idea.includes('mẹ chồng') || idea.includes('nàng dâu')) return 'Nước Mắt Nàng Dâu Hào Môn';
  if (idea.includes('ve chai') || idea.includes('mẹ đơn thân')) return 'Tình Mẹ Nơi Phồn Hoa';
  if (genre.includes('Tổng tài')) return 'Sự Trở Lại Của Vị Chủ Tịch Ẩn Thân';
  return 'Nợ Duyên Sau Cánh Cửa Hào Môn';
}

function buildSrtSubtitles(scenes, clipSeconds = 15) {
  let srt = '';
  let counter = 1;

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const clipStart = i * clipSeconds;

    if (scene.narration) {
      const startStr = formatTime(clipStart + 1.2);
      const endStr = formatTime(clipStart + 8.2);
      srt += `${counter++}\n${startStr} --> ${endStr}\n${scene.narration}\n\n`;
    }

    if (scene.dialogue) {
      const startStr = formatTime(clipStart + 9.0);
      const endStr = formatTime(clipStart + 14.0);
      srt += `${counter++}\n${startStr} --> ${endStr}\n[${scene.dialogueOwner}]: "${scene.dialogue}"\n\n`;
    }
  }

  return srt;
}
