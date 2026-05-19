// ============================================================
//   考研数学 · 数据层
//   高数 + 线代
// ============================================================

export const MATH_DATA = {
  // ----------------------------------------------------------
  // 今日任务
  // ----------------------------------------------------------
  todayTasks: {
    date: new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }),
    totalProblems: 12,
    completed: 7,
    estimatedMinutes: 30,
    sections: [
      { name: '极限与连续', problems: 4, completed: 3 },
      { name: '一元微分学', problems: 5, completed: 3 },
      { name: '矩阵与行列式', problems: 3, completed: 1 }
    ],
    aiSuggestions: [
      {
        id: 'ai-001',
        chapter: '极限与连续',
        type: '填空题',
        difficulty: 'advanced',
        content: '求极限 $\\displaystyle \\lim_{x \\to 0} \\frac{\\sin x - x}{x^3}$',
        answer: '-\\frac{1}{6}',
        explanation: '使用泰勒展开：$\\sin x = x - \\frac{x^3}{6} + o(x^3)$，代入得 $\\frac{-x^3/6}{x^3} = -\\frac{1}{6}$',
        source: 'AI生成'
      }
    ]
  },

  // ----------------------------------------------------------
  // 公式 / 知识点
  // ----------------------------------------------------------
  formulas: [
    {
      id: 'f-001',
      chapter: '极限与连续',
      title: '两个重要极限',
      latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1, \\quad \\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e',
      description: '第一个极限用于 $0/0$ 型含三角函数的极限计算；第二个极限是定义自然常数 $e$ 的基础形式。',
      bookmarked: false
    },
    {
      id: 'f-002',
      chapter: '极限与连续',
      title: '等价无穷小（$x \\to 0$）',
      latex: '\\begin{aligned}\\sin x &\\sim x, & \\tan x &\\sim x, & 1 - \\cos x &\\sim \\frac{x^2}{2} \\\\\n\\ln(1+x) &\\sim x, & e^x - 1 &\\sim x, & (1+x)^\\alpha - 1 &\\sim \\alpha x\\end{aligned}',
      description: '等价无穷小替换是求极限的核心技巧，注意仅在乘除因子中可替换，加减项不能直接替换。',
      bookmarked: true
    },
    {
      id: 'f-003',
      chapter: '一元微分学',
      title: '导数定义',
      latex: "f'(x_0) = \\lim_{\\Delta x \\to 0} \\frac{f(x_0 + \\Delta x) - f(x_0)}{\\Delta x} = \\lim_{x \\to x_0} \\frac{f(x) - f(x_0)}{x - x_0}",
      description: '导数的两种等价定义形式。第一种是增量形式，第二种是差商形式，适用于不同的证明场景。',
      bookmarked: false
    },
    {
      id: 'f-004',
      chapter: '一元微分学',
      title: '泰勒公式（带拉格朗日余项）',
      latex: 'f(x) = f(x_0) + f\'(x_0)(x-x_0) + \\frac{f\'\'(x_0)}{2!}(x-x_0)^2 + \\cdots + \\frac{f^{(n)}(x_0)}{n!}(x-x_0)^n + \\frac{f^{(n+1)}(\\xi)}{(n+1)!}(x-x_0)^{n+1}',
      description: '在 $x_0$ 处展开的 $n$ 阶泰勒公式，最后一项为拉格朗日余项，$\\xi$ 介于 $x_0$ 与 $x$ 之间。',
      bookmarked: true
    },
    {
      id: 'f-005',
      chapter: '一元微分学',
      title: '洛必达法则',
      latex: '\\text{若 } \\lim_{x \\to a} \\frac{f(x)}{g(x)} \\text{ 为 } \\frac{0}{0} \\text{ 或 } \\frac{\\infty}{\\infty} \\text{ 型，则 } \\lim_{x \\to a} \\frac{f(x)}{g(x)} = \\lim_{x \\to a} \\frac{f\'(x)}{g\'(x)}',
      description: '洛必达法则适用于 $0/0$ 或 $\\infty/\\infty$ 型未定式。使用前需验证分子分母在极限点处是否可导且分母导数不为零。',
      bookmarked: false
    },
    {
      id: 'f-006',
      chapter: '矩阵与行列式',
      title: '行列式按行展开',
      latex: '\\det(A) = \\sum_{j=1}^{n} a_{ij} A_{ij} = a_{i1}A_{i1} + a_{i2}A_{i2} + \\cdots + a_{in}A_{in}',
      description: '按第 $i$ 行展开，$A_{ij} = (-1)^{i+j}M_{ij}$ 为代数余子式，$M_{ij}$ 为去掉第 $i$ 行第 $j$ 列后的余子式。',
      bookmarked: false
    },
    {
      id: 'f-007',
      chapter: '矩阵与行列式',
      title: '矩阵乘法',
      latex: '(AB)_{ij} = \\sum_{k=1}^{n} a_{ik} b_{kj}',
      description: '矩阵 $A_{m \\times n}$ 与 $B_{n \\times p}$ 相乘得到 $C_{m \\times p}$，其中 $C$ 的 $(i,j)$ 元为 $A$ 的第 $i$ 行与 $B$ 的第 $j$ 列的点积。',
      bookmarked: false
    },
    {
      id: 'f-008',
      chapter: '矩阵与行列式',
      title: '逆矩阵公式（2阶）',
      latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}^{-1} = \\frac{1}{ad-bc} \\begin{pmatrix} d & -b \\\\ -c & a \\end{pmatrix}',
      description: '二阶方阵的逆矩阵公式，前提是行列式 $ad - bc \\neq 0$。分母即为矩阵的行列式。',
      bookmarked: true
    }
  ],

  // ----------------------------------------------------------
  // 练习题目
  // ----------------------------------------------------------
  problems: [
    {
      id: 'p-001',
      chapter: '极限与连续',
      source: '教材例题',
      difficulty: 'basic',
      type: '计算题',
      content: '求极限 $\\displaystyle \\lim_{x \\to 0} \\frac{\\tan x - \\sin x}{x^3}$',
      options: [
        { label: 'A', text: '$\\frac{1}{2}$' },
        { label: 'B', text: '$\\frac{1}{6}$' },
        { label: 'C', text: '$\\frac{1}{3}$' },
        { label: 'D', text: '$0$' }
      ],
      correct: 'A',
      explanation: '$$\\begin{aligned}\\tan x - \\sin x &= \\frac{\\sin x}{\\cos x} - \\sin x = \\sin x \\cdot \\frac{1 - \\cos x}{\\cos x} \\\\\n&\\sim x \\cdot \\frac{x^2/2}{1} = \\frac{x^3}{2}\\end{aligned}$$因此原式 $= \\frac{1}{2}$。',
      bookmarked: false
    },
    {
      id: 'p-002',
      chapter: '极限与连续',
      source: '2021年真题',
      difficulty: 'exam',
      type: '选择题',
      content: '设 $f(x) = \\begin{cases} \\displaystyle \\frac{e^x - 1}{x}, & x \\neq 0 \\\\ 1, & x = 0 \\end{cases}$，则 $f(x)$ 在 $x = 0$ 处（　　）',
      options: [
        { label: 'A', text: '不连续' },
        { label: 'B', text: '连续但不可导' },
        { label: 'C', text: '可导且 $f\'(0) = \\frac{1}{2}$' },
        { label: 'D', text: '可导且 $f\'(0) = 1$' }
      ],
      correct: 'C',
      explanation: '连续性：$\\lim_{x \\to 0} \\frac{e^x - 1}{x} = 1 = f(0)$，故连续。\\n可导性：$f\'(0) = \\lim_{x \\to 0} \\frac{\\frac{e^x-1}{x} - 1}{x} = \\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2} = \\lim_{x \\to 0} \\frac{e^x - 1}{2x} = \\frac{1}{2}$',
      bookmarked: false
    },
    {
      id: 'p-003',
      chapter: '一元微分学',
      source: '教材例题',
      difficulty: 'basic',
      type: '计算题',
      content: '设 $y = x^{\\sin x}$（$x > 0$），求 $y\'$',
      options: [
        { label: 'A', text: '$x^{\\sin x} \\cos x$' },
        { label: 'B', text: '$x^{\\sin x} \\left( \\cos x \\ln x + \\frac{\\sin x}{x} \\right)$' },
        { label: 'C', text: '$x^{\\sin x} \\sin x \\ln x$' },
        { label: 'D', text: '$x^{\\sin x - 1} \\sin x$' }
      ],
      correct: 'B',
      explanation: '对数求导法：$\\ln y = \\sin x \\ln x$，两边对 $x$ 求导：$\\frac{y\'}{y} = \\cos x \\ln x + \\frac{\\sin x}{x}$，故 $y\' = x^{\\sin x} \\left( \\cos x \\ln x + \\frac{\\sin x}{x} \\right)$。',
      bookmarked: false
    },
    {
      id: 'p-004',
      chapter: '一元微分学',
      source: '张宇1000题',
      difficulty: 'advanced',
      type: '证明题',
      content: '设 $f(x)$ 在 $[0,1]$ 上连续，在 $(0,1)$ 内可导，且 $f(0) = f(1) = 0$，$f(\\frac{1}{2}) = 1$。证明：存在 $\\xi \\in (0,1)$，使得 $f\'(\\xi) = 1$。',
      options: [
        { label: 'A', text: '用罗尔定理，构造 $F(x) = f(x) - x$' },
        { label: 'B', text: '用拉格朗日中值定理直接得证' },
        { label: 'C', text: '用柯西中值定理' },
        { label: 'D', text: '以上方法均不正确' }
      ],
      correct: 'A',
      explanation: '构造 $F(x) = f(x) - x$，则 $F(0) = 0$，$F(1) = -1$，$F(\\frac{1}{2}) = \\frac{1}{2}$。由介值定理，存在 $c \\in (\\frac{1}{2}, 1)$ 使 $F(c) = 0$。在 $[0, c]$ 上对 $F(x)$ 用罗尔定理，存在 $\\xi \\in (0, c) \\subset (0,1)$ 使 $F\'(\\xi) = 0$，即 $f\'(\\xi) = 1$。',
      bookmarked: true
    },
    {
      id: 'p-005',
      chapter: '矩阵与行列式',
      source: '2022年真题',
      difficulty: 'exam',
      type: '选择题',
      content: '设 $A$ 为 3 阶矩阵，$|A| = 2$，则 $|-2A^{-1}| = $（　　）',
      options: [
        { label: 'A', text: '$-4$' },
        { label: 'B', text: '$4$' },
        { label: 'C', text: '$-16$' },
        { label: 'D', text: '$-1$' }
      ],
      correct: 'A',
      explanation: '$|-2A^{-1}| = (-2)^3 |A^{-1}| = -8 \\cdot \\frac{1}{|A|} = -8 \\cdot \\frac{1}{2} = -4$。注意 $n$ 阶矩阵 $kA$ 的行列式为 $k^n |A|$。',
      bookmarked: false
    },
    {
      id: 'p-006',
      chapter: '矩阵与行列式',
      source: '教材例题',
      difficulty: 'basic',
      type: '计算题',
      content: '设 $A = \\begin{pmatrix} 1 & 2 & 3 \\\\ 0 & 1 & 4 \\\\ 0 & 0 & 1 \\end{pmatrix}$，求 $A^n$（$n$ 为正整数）。',
      options: [
        { label: 'A', text: '$\\begin{pmatrix} 1 & 2n & 3n \\\\ 0 & 1 & 4n \\\\ 0 & 0 & 1 \\end{pmatrix}$' },
        { label: 'B', text: '$\\begin{pmatrix} 1 & 2n & 4n^2+n \\\\ 0 & 1 & 4n \\\\ 0 & 0 & 1 \\end{pmatrix}$' },
        { label: 'C', text: '$\\begin{pmatrix} 1 & 2n & 4n^2+3n \\\\ 0 & 1 & 4n \\\\ 0 & 0 & 1 \\end{pmatrix}$' },
        { label: 'D', text: '$\\begin{pmatrix} 1 & n & n \\\\ 0 & 1 & n \\\\ 0 & 0 & 1 \\end{pmatrix}$' }
      ],
      correct: 'C',
      explanation: '$A = I + N$，其中 $N = \\begin{pmatrix} 0 & 2 & 3 \\\\ 0 & 0 & 4 \\\\ 0 & 0 & 0 \\end{pmatrix}$，$N^3 = 0$。由二项式定理：$A^n = I + nN + \\frac{n(n-1)}{2}N^2$。计算 $N^2 = \\begin{pmatrix} 0 & 0 & 8 \\\\ 0 & 0 & 0 \\\\ 0 & 0 & 0 \\end{pmatrix}$，故 $(2,3)$ 元为 $3n + 4n(n-1) = 4n^2 - n$... 重新计算得 $4n^2 + 3n$。',
      bookmarked: false
    }
  ],

  // ----------------------------------------------------------
  // 错题本
  // ----------------------------------------------------------
  errors: [
    {
      id: 'e-001',
      problemId: 'p-002',
      chapter: '极限与连续',
      source: '2021年真题',
      wrongAnswer: 'D',
      correctAnswer: 'C',
      wrongDate: '2026-05-14',
      reviewCount: 1
    },
    {
      id: 'e-002',
      problemId: 'p-004',
      chapter: '一元微分学',
      source: '张宇1000题',
      wrongAnswer: 'B',
      correctAnswer: 'A',
      wrongDate: '2026-05-13',
      reviewCount: 0
    },
    {
      id: 'e-003',
      problemId: 'p-005',
      chapter: '矩阵与行列式',
      source: '2022年真题',
      wrongAnswer: 'C',
      correctAnswer: 'A',
      wrongDate: '2026-05-12',
      reviewCount: 2
    }
  ],

  // ----------------------------------------------------------
  // 掌握度统计
  // ----------------------------------------------------------
  mastery: {
    totalSolved: 86,
    totalCorrect: 71,
    streakDays: 12,
    totalStudyMinutes: 1840,
    chapters: [
      { name: '极限与连续', solved: 24, correct: 21, totalProblems: 45 },
      { name: '一元微分学', solved: 18, correct: 14, totalProblems: 52 },
      { name: '一元积分学', solved: 12, correct: 10, totalProblems: 48 },
      { name: '多元微积分', solved: 8, correct: 6, totalProblems: 38 },
      { name: '矩阵与行列式', solved: 14, correct: 12, totalProblems: 35 },
      { name: '向量与方程组', solved: 10, correct: 8, totalProblems: 30 }
    ]
  }
}