/**
 * Seedance 2.0 vocabulary and scene configuration used by the frontend.
 */

export const cameraVocabulary = {
  shotSize: ['大远景', '远景', '全景', '中景', '近景', '特写', '大特写'],
  cameraMovement: ['推进镜头', '拉远镜头', '摇镜头', '移镜头', '跟拍', '环绕拍摄', '航拍', '手持跟拍', '变焦转场'],
  angle: ['平视', '俯拍', '仰拍', '低角度', '鸟瞰视角', '鱼眼镜头', '第一人称视角', '主观视角'],
  rhythm: ['慢动作', '快切', '延时摄影', '一镜到底', '升格拍摄', '硬切', '卡点'],
  focus: ['浅景深', '深景深', '焦点转移', '背景虚化', '选择性对焦'],
  special: ['遮挡转场', '无缝变形转场', '环绕甩镜快切', '定格慢放']
} as const

export const styleVocabulary = {
  quality: ['电影感', '胶片质感', '高动态范围', '8K 细节', 'HDR', 'RAW 质感', '高精度 CGI'],
  filmStyle: ['院线电影', '独立电影', '纪录片', 'MV 风格', '广告大片', 'Vlog 风格', '宽银幕构图'],
  colorTone: ['暖色调', '冷色调', '高对比', '低饱和', '莫兰迪色系', '霓虹赛博', '红金高饱和'],
  artStyle: ['写实主义', '超现实主义', '极简主义', '蒸汽波', '赛博朋克', '国风奇幻', '3D 国漫 CGI'],
  lighting: ['自然光', '侧逆光', '伦勃朗光', '霓虹灯光', '月光', '黄金时刻', '体积光'],
  animationStyle: ['国风奇幻动画', '超精细 CGI 动画', '日漫风格', '3D 渲染写实']
} as const

export type SceneType =
  | 'auto'
  | 'commercial'
  | 'fantasy'
  | 'drama'
  | 'education'
  | 'mv'
  | 'general'

export const sceneTypeConfig: Record<
  SceneType,
  {
    label: string
    description: string
    keywords: string[]
    defaultStyle: string[]
    defaultCamera: string[]
    defaultTone: string[]
    template: string
  }
> = {
  auto: {
    label: '自动识别',
    description: '根据输入内容自动判断最适合的场景类型与表达方式。',
    keywords: [],
    defaultStyle: [],
    defaultCamera: [],
    defaultTone: [],
    template: ''
  },
  commercial: {
    label: '电商 / 广告',
    description: '适合产品展示、品牌广告、商业短片。',
    keywords: ['产品', '广告', '品牌', '商业', '展示', '电商', '开箱', '质感', '转场'],
    defaultStyle: ['广告大片', '高精度 CGI', '高动态范围'],
    defaultCamera: ['环绕拍摄', '推进镜头', '特写'],
    defaultTone: ['高对比', '暖色调'],
    template: '突出产品卖点、镜头质感与品牌记忆点，适合直接用于商业视频生成。'
  },
  fantasy: {
    label: '仙侠 / 奇幻',
    description: '适合法术、战斗、变身、异世界等高视觉张力场景。',
    keywords: ['仙侠', '奇幻', '法术', '战斗', '异世界', '古风', '怪物', '神话', '变身'],
    defaultStyle: ['国风奇幻动画', '超精细 CGI 动画', '电影感'],
    defaultCamera: ['环绕甩镜快切', '仰拍', '慢动作', '定格慢放'],
    defaultTone: ['红金高饱和', '暖色调'],
    template: '强调世界观、能量表现、角色造型和打斗节奏，画面要有史诗感。'
  },
  drama: {
    label: '短剧 / 对白',
    description: '适合人物关系、情绪冲突、对白推进的剧情片段。',
    keywords: ['短剧', '对白', '台词', '人物', '情绪', '冲突', '反转', '总裁', '恋爱'],
    defaultStyle: ['院线电影', '电影感'],
    defaultCamera: ['特写', '推进镜头', '跟拍'],
    defaultTone: ['暖色调'],
    template: '强调人物关系、情绪递进和台词张力，适合短剧情绪爆点。'
  },
  education: {
    label: '科普教学',
    description: '适合知识演示、结构解析、概念可视化。',
    keywords: ['科普', '教学', '医学', '结构', '讲解', '知识', '原理', '实验', '科学'],
    defaultStyle: ['高精度 CGI', '高动态范围', '写实主义'],
    defaultCamera: ['推进镜头', '环绕拍摄'],
    defaultTone: ['冷色调', '高对比'],
    template: '强调逻辑清晰、结构可视化和信息传达效率。'
  },
  mv: {
    label: 'MV / 卡点',
    description: '适合音乐视频、舞蹈、节奏型蒙太奇。',
    keywords: ['MV', '音乐', '卡点', '节奏', '舞蹈', '舞台', '灯光', '演出', '表演'],
    defaultStyle: ['MV 风格', '宽银幕构图', '电影感'],
    defaultCamera: ['快切', '卡点', '环绕拍摄', '跟拍'],
    defaultTone: ['霓虹赛博', '高对比'],
    template: '强调节奏、镜头切换和舞台氛围，适合音乐类视频提示词。'
  },
  general: {
    label: '通用 / 自由创作',
    description: '适合未限定风格的自由创意表达。',
    keywords: ['创意', '自由', '叙事', '氛围', '镜头', '视觉'],
    defaultStyle: ['电影感', '高动态范围'],
    defaultCamera: ['推进镜头', '跟拍'],
    defaultTone: ['暖色调'],
    template: '在不改变原意的前提下，补齐场景、动作、镜头和氛围细节。'
  }
}

export type DurationType = 'short' | 'medium' | 'long' | 'extra' | 'custom'

export const durationOptions: Record<
  DurationType,
  {
    label: string
    range: string
    seconds: number
    useStoryboard: boolean
  }
> = {
  short: { label: '短片 4-8 秒', range: '4-8', seconds: 6, useStoryboard: false },
  medium: { label: '中等 9-12 秒', range: '9-12', seconds: 10, useStoryboard: false },
  long: { label: '长片 13-15 秒', range: '13-15', seconds: 15, useStoryboard: true },
  extra: { label: '超长 30 秒+', range: '30+', seconds: 30, useStoryboard: true },
  custom: { label: '自定义时长', range: 'custom', seconds: 60, useStoryboard: true }
}

export type AspectRatioType = 'auto' | '16:9' | '9:16' | '1:1'

export const aspectRatioOptions: Record<
  AspectRatioType,
  {
    label: string
    description: string
  }
> = {
  auto: { label: '自动', description: '交给模型自动判断最合适的出图比例。' },
  '16:9': { label: '横屏 16:9', description: '适合电影感场景、广告片与风光叙事。' },
  '9:16': { label: '竖屏 9:16', description: '适合短视频平台、人物演绎与手机观看。' },
  '1:1': { label: '方形 1:1', description: '适合社交媒体封面与信息流分发。' }
}
