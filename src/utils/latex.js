import katex from 'katex'

/**
 * 渲染包含 $...$ 和 $$...$$ 分隔符的文本
 * @param {string} text - 包含 LaTeX 的文本
 * @param {boolean} defaultDisplay - 没有分隔符时的默认 displayMode
 * @returns {string} HTML 字符串
 */
export function renderLatex(text, defaultDisplay = false) {
  if (!text) return ''

  // 如果整个字符串没有 $ 分隔符，直接按纯 LaTeX 渲染
  if (!text.includes('$')) {
    try {
      return katex.renderToString(text, {
        displayMode: defaultDisplay,
        throwOnError: false,
        trust: true,
        strict: false
      })
    } catch (e) {
      return text
    }
  }

  let result = text

  // 1. 先替换 $$...$$ 块级公式（避免与行内 $ 冲突）
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false
      })
    } catch (e) {
      return match
    }
  })

  // 2. 再替换 $...$ 行内公式
  result = result.replace(/\$([\s\S]*?)\$/g, (match, latex) => {
    try {
      return katex.renderToString(latex.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false
      })
    } catch (e) {
      return match
    }
  })

  return result
}
