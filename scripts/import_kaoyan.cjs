const fs = require('fs');
const path = require('path');
const { initDb, run, query, saveDb } = require('../server/db');

const PAPERS_DIR = path.join(__dirname, '../data/kaoyan-math1-papers/papers');
const SOLUTIONS_DIR = path.join(__dirname, '../data/kaoyan-math1-papers/solutions');

// 章节分类关键词（按优先级排序，先匹配的先命中）
const CHAPTER_RULES = [
  { chapter: '假设检验', keywords: ['假设检验', '拒绝域', '显著性水平', '检验统计量'] },
  { chapter: '参数估计', keywords: ['最大似然估计', '矩估计', '无偏估计', '置信区间', '估计量'] },
  { chapter: '统计推断', keywords: ['统计量', '样本均值', '样本方差', 't分布', '卡方分布', 'F分布'] },
  { chapter: '大数定律与中心极限定理', keywords: ['大数定律', '中心极限定理', '切比雪夫', '依概率收敛'] },
  { chapter: '数字特征', keywords: ['期望', '方差', '协方差', '相关系数', '矩', 'E(', 'D(', 'Cov'] },
  { chapter: '多维随机变量', keywords: ['联合分布', '边缘分布', '条件分布', '二维', '二维正态'] },
  { chapter: '随机变量', keywords: ['分布函数', '密度函数', '概率密度', '正态分布', '泊松分布', '指数分布', '均匀分布', '二项分布'] },
  { chapter: '概率基础', keywords: ['概率', '事件', '独立', '条件概率', '贝叶斯', '全概率'] },
  { chapter: '二次型', keywords: ['二次型', '惯性指数', '正交变换', '标准形', '规范形', '正定', '负定'] },
  { chapter: '特征值与特征向量', keywords: ['特征值', '特征向量', '特征方程', '相似对角化'] },
  { chapter: '向量与方程组', keywords: ['线性方程组', '基础解系', '通解', '线性无关', '线性相关', '极大线性无关组'] },
  { chapter: '矩阵与行列式', keywords: ['行列式', '矩阵', '逆矩阵', '伴随矩阵', '初等变换', '秩', 'r(', '代数余子式'] },
  { chapter: '微分方程', keywords: ['微分方程', '特解', '通解', '欧拉方程', '特征方程'] },
  { chapter: '级数', keywords: ['级数', '收敛', '发散', '幂级数', '傅里叶', '和函数', '收敛域'] },
  { chapter: '重积分', keywords: ['二重积分', '三重积分', '格林公式', '高斯公式', '斯托克斯', '曲面积分', '曲线积分'] },
  { chapter: '多元微分学', keywords: ['偏导数', '方向导数', '梯度', '全微分', '隐函数', '条件极值', '拉格朗日乘数'] },
  { chapter: '一元积分学', keywords: ['定积分', '不定积分', '反常积分', '积分中值', '面积', '体积', '弧长', '旋转体', '牛顿-莱布尼茨'] },
  { chapter: '一元微分学', keywords: ['导数', '微分', '泰勒', '中值定理', '罗尔', '拉格朗日', '单调', '极值', '凹凸', '拐点', '渐近线'] },
  { chapter: '极限与连续', keywords: ['极限', 'lim', '连续', '间断', '无穷小', '等价无穷小', '渐近线'] },
];

function classifyChapter(content) {
  const text = content.toLowerCase();
  for (const rule of CHAPTER_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return rule.chapter;
      }
    }
  }
  return '其他';
}

function parseYear(filename) {
  const match = filename.match(/(\d{4})/);
  return match ? match[1] : 'unknown';
}

function parsePaper(mdContent, year) {
  const problems = [];

  // 按题型分割
  const choiceMatch = mdContent.match(/[一二].*选择题[\s\S]*?(?=[一二].*填空题|[一二].*解答题|$)/i);
  const fillMatch = mdContent.match(/[一二].*填空题[\s\S]*?(?=[一二].*解答题|$)/i);
  const essayMatch = mdContent.match(/[一二].*解答题[\s\S]*/i);

  // 解析选择题
  if (choiceMatch) {
    const choiceText = choiceMatch[0];
    // 匹配每道选择题: （n）... (A)... (B)... (C)... (D)...
    const choiceRegex = /[（(](\d+)[)）]([\s\S]*?)(?=[（(]\d+[)）]|$)/g;
    let m;
    while ((m = choiceRegex.exec(choiceText)) !== null) {
      const num = m[1];
      const body = m[2].trim();
      if (!body || body.length < 20) continue;

      // 提取选项
      const optMatches = [];
      const optRegex = /[(（]?\s*([A-Da-d])\s*[)）]?[、.．\s]+([^\n]+)/g;
      let om;
      while ((om = optRegex.exec(body)) !== null) {
        optMatches.push({ label: om[1].toUpperCase(), text: om[2].trim() });
      }

      // 如果没匹配到选项，尝试另一种格式
      if (optMatches.length < 2) {
        const altRegex = /\n\s*[(（]?([A-D])[)）]?\s*([$一-龥][^\n]*)/g;
        let am;
        while ((am = altRegex.exec(body)) !== null) {
          optMatches.push({ label: am[1].toUpperCase(), text: am[2].trim() });
        }
      }

      if (optMatches.length >= 2) {
        // 分离题干和选项
        let lastOptIndex = 0;
        for (const opt of optMatches) {
          const idx = body.indexOf(opt.text);
          if (idx > lastOptIndex) lastOptIndex = idx + opt.text.length;
        }
        // 提取题干：从开头到第一个选项之前
        const firstOptPos = Math.min(...optMatches.map(o => body.indexOf(o.label + ')')).filter(p => p > 0));
        const content = firstOptPos > 0 ? body.substring(0, firstOptPos).trim() : body;

        problems.push({
          id: `k${year.slice(-2)}c-${num.padStart(3, '0')}`,
          year,
          num: parseInt(num),
          type: '选择题',
          content: content.replace(/\n+/g, ' ').trim(),
          options: optMatches.slice(0, 4),
          chapter: null, // 后续统一分类
        });
      }
    }
  }

  // 解析填空题
  if (fillMatch) {
    const fillText = fillMatch[0];
    const fillRegex = /[（(]?(\d+)[)）]([\s\S]*?)(?=[（(]?\d+[)）]|$)/g;
    let m;
    while ((m = fillRegex.exec(fillText)) !== null) {
      const num = m[1];
      const body = m[2].trim();
      if (!body || body.length < 10) continue;
      // 排除已在选择题中处理的题号
      if (problems.some(p => p.num === parseInt(num) && p.year === year)) continue;

      problems.push({
        id: `k${year.slice(-2)}f-${num.padStart(3, '0')}`,
        year,
        num: parseInt(num),
        type: '填空题',
        content: body.replace(/\n+/g, ' ').trim(),
        options: [],
        chapter: null,
      });
    }
  }

  // 解析解答题
  if (essayMatch) {
    const essayText = essayMatch[0];
    const essayRegex = /[（(](\d+)[)）]([\s\S]*?)(?=[（(]\d+[)）]|$)/g;
    let m;
    while ((m = essayRegex.exec(essayText)) !== null) {
      const num = m[1];
      const body = m[2].trim();
      if (!body || body.length < 20) continue;
      // 排除已处理的题号
      if (problems.some(p => p.num === parseInt(num) && p.year === year)) continue;

      problems.push({
        id: `k${year.slice(-2)}e-${num.padStart(3, '0')}`,
        year,
        num: parseInt(num),
        type: '解答题',
        content: body.replace(/\n+/g, ' ').trim(),
        options: [],
        chapter: null,
      });
    }
  }

  return problems;
}

function parseSolution(mdContent) {
  const solutions = {};
  // 匹配 （n）【答案】... 【解】...
  const regex = /[（(](\d+)[)）]\s*【答案】\s*([^\n【]*)[\s\S]*?【解】\s*([\s\S]*?)(?=[（(]\d+[)）]\s*【答案】|$)/g;
  let m;
  while ((m = regex.exec(mdContent)) !== null) {
    const num = parseInt(m[1]);
    const answer = m[2].trim();
    const explanation = m[3].trim();
    solutions[num] = { answer, explanation };
  }
  return solutions;
}

async function importAll() {
  await initDb();

  const paperFiles = fs.readdirSync(PAPERS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  let totalImported = 0;
  let totalSkipped = 0;

  for (const filename of paperFiles) {
    const year = parseYear(filename);
    const paperPath = path.join(PAPERS_DIR, filename);
    const solutionDir = path.join(SOLUTIONS_DIR, `${year}年解析`);

    let solutionContent = '';
    const solutionMd = path.join(solutionDir, `${year}年解析.md`);
    if (fs.existsSync(solutionMd)) {
      solutionContent = fs.readFileSync(solutionMd, 'utf-8');
    }

    const paperContent = fs.readFileSync(paperPath, 'utf-8');
    const problems = parsePaper(paperContent, year);
    const solutions = parseSolution(solutionContent);

    for (const p of problems) {
      // 检查是否已存在
      const existing = query('SELECT id FROM problems WHERE id = ?', [p.id]);
      if (existing.length > 0) {
        totalSkipped++;
        continue;
      }

      const sol = solutions[p.num];
      const chapter = classifyChapter(p.content);

      // 提取正确答案
      let correct = null;
      if (p.type === '选择题' && sol) {
        const ansMatch = sol.answer.match(/[（(]([A-Da-d])[)）]/);
        correct = ansMatch ? ansMatch[1].toUpperCase() : sol.answer.trim().charAt(0).toUpperCase();
        if (!/^[A-D]$/.test(correct)) correct = 'A';
      } else if (p.type === '填空题' && sol) {
        correct = sol.answer.trim();
      }

      const explanation = sol ? sol.explanation : '';

      try {
        run(
          'INSERT INTO problems (id, chapter, source, difficulty, type, content, options, correct, explanation, is_ai_generated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            p.id,
            chapter,
            `${year}年数学一真题`,
            p.type === '解答题' ? 'advanced' : 'exam',
            p.type,
            p.content,
            JSON.stringify(p.options),
            correct || '',
            explanation,
            0
          ]
        );
        totalImported++;
      } catch (err) {
        console.error(`Failed to import ${p.id}:`, err.message);
      }
    }

    console.log(`  ${year}: ${problems.length} problems parsed`);
  }

  saveDb();
  console.log(`\nImport complete: ${totalImported} imported, ${totalSkipped} skipped`);
  process.exit(0);
}

importAll().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
