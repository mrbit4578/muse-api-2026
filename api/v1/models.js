// API Handler: OpenAI Compatible Models List with Stanford CS229 & Persona Metadata
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const models = [
    // --- Foundation Models ---
    {
      id: 'muse-spark-1.1',
      object: 'model',
      created: 1718000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-spark-1.1',
      parent: null,
      context_window: 32768,
      decoding_defaults: { temperature: 0.7, top_p: 0.9, preset: 'balanced' },
      description: 'Model Muse Spark 1.1 thế hệ mới nhất, suy luận logic và hội thoại thông minh tốc độ cao'
    },
    {
      id: 'muse-chat-v2',
      object: 'model',
      created: 1715000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-chat-v2',
      parent: null,
      context_window: 16384,
      decoding_defaults: { temperature: 0.7, top_p: 0.85, preset: 'balanced' },
      description: 'Model Muse Chat tối ưu cho đa ngôn ngữ và tiếng Việt'
    },
    {
      id: 'muse-omni-flash',
      object: 'model',
      created: 1720000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-omni-flash',
      parent: null,
      context_window: 16384,
      decoding_defaults: { temperature: 0.5, top_p: 0.8, preset: 'balanced' },
      description: 'Model đa phương thức siêu nhanh, hỗ trợ xử lý text và visual context'
    },
    {
      id: 'gpt-4o-muse',
      object: 'model',
      created: 1716000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'gpt-4o-muse',
      parent: null,
      context_window: 32768,
      decoding_defaults: { temperature: 0.7, top_p: 0.95, preset: 'balanced' },
      description: 'OpenAI alias tương thích cho client tự động nhận diện gpt-4o'
    },
    {
      id: 'dall-e-3-muse',
      object: 'model',
      created: 1717000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'dall-e-3-muse',
      parent: null,
      context_window: 4096,
      decoding_defaults: {},
      description: 'Model sinh ảnh nghệ thuật độ phân giải cao'
    },

    // --- Stanford CS229 Specialized AI Personas ---
    {
      id: 'muse-coder',
      object: 'model',
      created: 1725000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-coder',
      parent: 'muse-spark-1.1',
      context_window: 32768,
      persona: 'Senior Software Architect & Code Optimizer',
      decoding_defaults: { temperature: 0.1, top_p: 0.1, preset: 'deterministic' },
      description: 'AI Persona chuyên gia lập trình: T=0.1, Top-p=0.1 triệt tiêu ảo giác, thuật toán tối ưu, code chuẩn clean architecture'
    },
    {
      id: 'muse-analyst',
      object: 'model',
      created: 1725000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-analyst',
      parent: 'muse-spark-1.1',
      context_window: 32768,
      persona: 'Senior Quantitative Data Analyst',
      decoding_defaults: { temperature: 0.2, top_p: 0.2, preset: 'deterministic' },
      description: 'AI Persona phân tích dữ liệu & logic: T=0.2, Top-p=0.2 trích xuất JSON schema, thống kê số liệu chính xác'
    },
    {
      id: 'muse-assistant',
      object: 'model',
      created: 1725000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-assistant',
      parent: 'muse-spark-1.1',
      context_window: 16384,
      persona: 'Universal AI Executive Assistant',
      decoding_defaults: { temperature: 0.7, top_p: 0.9, preset: 'balanced' },
      description: 'AI Persona trợ lý tổng hợp: T=0.7, Top-p=0.9 phản hồi tự nhiên, giải quyết vấn đề linh hoạt và hỗ trợ đa tác vụ'
    },
    {
      id: 'muse-creative',
      object: 'model',
      created: 1725000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-creative',
      parent: 'muse-spark-1.1',
      context_window: 16384,
      persona: 'Master Creative Director & Screenwriter',
      decoding_defaults: { temperature: 1.1, top_p: 0.95, preset: 'creative' },
      description: 'AI Persona sáng tạo nghệ thuật & drama: T=1.1, Top-p=0.95 tăng entropy phân phối softmax, giàu ẩn dụ, cú twist bất ngờ'
    },
    {
      id: 'muse-researcher',
      object: 'model',
      created: 1725000000,
      owned_by: 'muse.ai',
      permission: [],
      root: 'muse-researcher',
      parent: 'muse-spark-1.1',
      context_window: 32768,
      persona: 'Principal Research Scientist',
      decoding_defaults: { temperature: 0.3, top_p: 0.4, preset: 'deterministic' },
      description: 'AI Persona nghiên cứu học thuật & kiểm chứng: T=0.3, Top-p=0.4 trích dẫn tài liệu chuẩn xác, lập luận khoa học chặt chẽ'
    }
  ];

  return res.status(200).json({
    object: 'list',
    data: models
  });
};
