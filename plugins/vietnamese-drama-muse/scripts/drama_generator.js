#!/usr/bin/env node
// CLI Drama Production Generator for Vietnamese Drama Muse
const path = require('path');
const MuseApiBridge = require('./muse_api_bridge');

// Parse CLI flags
const args = process.argv.slice(2);
function getArg(flag, defaultValue) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) {
    return args[idx + 1];
  }
  return defaultValue;
}

const idea = getArg('--idea', 'Con dâu nghèo bị mẹ chồng hắt hủi hóa ra là ái nữ nhà hào môn trở về trả lời mọi câu hỏi');
const title = getArg('--title', 'Bí Mật Nàng Dâu Hào Môn');
const genre = getArg('--genre', 'Gia đình / Mẹ chồng nàng dâu / Báo thù');
const duration = parseInt(getArg('--duration', '5'), 10);
const clipSec = parseInt(getArg('--clip', '15'), 10);
const accent = getArg('--accent', 'Nam Bắc Bộ 45');
const mode = getArg('--mode', 'A');
const ending = getArg('--ending', 'Nhân quả');
const outDir = path.resolve(__dirname, '..', 'export');

console.log('====================================================');
console.log('🎬 VIETNAMESE DRAMA MUSE — PRODUCTION GENERATOR');
console.log('====================================================');
console.log(`📌 Tiêu đề:    ${title}`);
console.log(`💡 Ý tưởng:    ${idea}`);
console.log(`🎭 Thể loại:   ${genre}`);
console.log(`⏱️ Thời lượng: ${duration} phút (${clipSec}s / clip => ${Math.ceil((duration * 60) / clipSec)} clips)`);
console.log(`🎙️ Giọng MC:   ${accent}`);
console.log(`🔊 Audio Mode: ${mode}`);
console.log(`🏁 Kết thúc:   ${ending}`);
console.log('====================================================\n');

async function main() {
  const bridge = new MuseApiBridge();
  try {
    const production = await bridge.generateDramaProduction({
      title,
      idea,
      genre,
      durationMinutes: duration,
      clipSeconds: clipSec,
      narratorAccent: accent,
      audioMode: mode,
      ending
    });

    const exportResults = bridge.exportToDirectory(production, outDir);

    console.log('\n✅ XUẤT BẢN THÀNH CÔNG TRỌN GÓI SẢN XUẤT DRAMA:');
    console.log(`1. Kịch bản & Tóm tắt:  ${exportResults.storyPath}`);
    console.log(`2. Chuỗi Prompt Muse:   ${exportResults.promptsPath} (${production.prompts.length} prompts)`);
    console.log(`3. Phụ đề chuẩn SRT:    ${exportResults.subtitlesPath}`);
    console.log(`4. Hồ sơ thông số:      ${exportResults.sheetPath}`);
    console.log('\n💡 Bạn có thể dán toàn bộ prompt trong muse_prompts.txt vào Muse AI để bắt đầu sinh video!');
  } catch (error) {
    console.error('❌ Lỗi sản xuất:', error);
  }
}

main();
