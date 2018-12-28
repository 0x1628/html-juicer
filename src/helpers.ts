import {JSDOM} from 'jsdom'
import {Juicer} from './index'

type Document = JSDOM['window']['document']
type Config = typeof Juicer.defaultConfig

export function grabTitle(doc: Document, config: Config): string {
  let title = ''
  if (config.useHeaderAsTitle) {
    const h1 = doc.querySelector('h1')
    if (h1) {
      title = h1.textContent || ''
    }
  }
  if (!title) {
    title = doc.title
  }
  return title
}

/* tslint:disable:max-line-length */
const regexps = {
  unlikelyCandidates:    /combx|comment|community|disqus|extra|foot|header|menu|remark|rss|shoutbox|sidebar|sponsor|ad-break|agegate|pagination|pager|popup|tweet|twitter/i,
  okMaybeItsACandidate:  /and|article|body|column|main|shadow/i,
  positive:              /article|body|content|entry|hentry|main|page|pagination|post|text|blog|story/i,
  negative:              /combx|comment|com-|contact|foot|footer|footnote|masthead|media|meta|outbrain|promo|related|scroll|shoutbox|sidebar|sponsor|shopping|tags|tool|widget/i,
  divToPElements:        /<(blockquote|dl|div|img|ol|p|pre|table|ul)/i,
  divToPLegalParents:    /div|section|article/i,
  resourceTags:          /img|iframe|video|audio|object|frame|embed|source|track/i,
}
/* tslint:enable:max-line-length */

export function grabContent(doc: Document, config: Config): string {
  cleanDocument(doc)
  scoreEveryP(doc)
  const root = getArticleRoot(doc.body)
  removeUnlikelyChilds(doc, root, config)
  if (config.cleanAttribute) {
    cleanAttribute(doc, root, config)
  }
  return root.innerHTML
}

function cleanDocument(doc: Document) {
  const allElements = Array.from(doc.getElementsByTagName('*'))
  // tslint:disable-next-line:one-variable-per-declaration

  while (allElements.length) {
    const node = allElements.pop()
    if (!node) continue
    const unlikelyMatchString = `${node.className}${node.id}`
    if (
      node.tagName.toLowerCase() !== 'body' &&
      unlikelyMatchString.match(regexps.unlikelyCandidates) &&
      !unlikelyMatchString.match(regexps.okMaybeItsACandidate)
    ) {
      node.parentNode!.removeChild(node)
      continue
    }

    if (node.tagName.match(regexps.divToPLegalParents)) {
      if (!node.innerHTML.match(regexps.divToPElements)) {
        const newNode = doc.createElement('p')
        try {
          newNode.innerHTML = node.innerHTML
          node.parentNode!.replaceChild(newNode, node)
        } catch (e) {
          console.error('Could not alter div to p', e)
        }
      }
    }
  }
}

function scoreEveryP(doc: Document) {
  const pElements = doc.getElementsByTagName('p')
  let index = 0
  const len = pElements.length
  for (; index < len; index++) {
    const node = elementToJuicerNode(pElements[index])
    node.juicer = {contentScore: 0}

    const childs = Array.from(node.childNodes)

    childs.forEach(child => {
      if (child.nodeType === 3) { // text node
        node.juicer.contentScore += Math.min(10, Math.floor((child.textContent || '').length / 10))
      } else if (child.nodeType === 1) {
        switch ((<HTMLElement>child).tagName.toLowerCase()) {
          case 'a':
            node.juicer.contentScore -= 3
            break
          case 'button':
          case 'input':
            node.juicer.contentScore -= 10
            break
          case 'hr':
            node.juicer.contentScore += 10
            break
          default:
            node.juicer.contentScore += Math.min(10, Math.floor((child.textContent || '').length / 10))
        }
      }
    })
    let parent = elementToJuicerNode(node.parentElement)
    while (parent) {
      if (!parent.juicer) {
        parent.juicer = {contentScore: 0}
      }
      parent.juicer.contentScore += node.juicer.contentScore
      parent = elementToJuicerNode(parent.parentElement)
    }
  }
}

function getArticleRoot(target: Element): Element {
  const jTarget = elementToJuicerNode(target)

  const childs = target.children
  const [bestMatched, secondMatched] = Array.from(childs)
    .map(elementToJuicerNode)
    .filter(item => item.juicer)
    .map(item => ({node: item, score: item.juicer.contentScore}))
    .sort((a, b) => a.score >= b.score ? -1 : 1)

  if (!bestMatched) return target
  if (bestMatched.node.tagName.toLowerCase() === 'p') return target
  if (!secondMatched) return getArticleRoot(bestMatched.node)

  if (bestMatched.score / jTarget.juicer.contentScore > 0.5) {
    return getArticleRoot(bestMatched.node)
  }
  return target
}

function removeUnlikelyChilds(document: Document, root: Element, config: Config): void {
  const jRoot = elementToJuicerNode(root)
  if (config.cleanH1 && root.tagName.toLowerCase() === 'h1' && root.parentNode) {
    root.parentNode.removeChild(root)
    return
  }
  if (jRoot.juicer && jRoot.juicer.contentScore < 0) {
    root.parentNode!.removeChild(root)
    return
  }
  if (!jRoot.juicer || jRoot.juicer.contentScore === 0) {
    const noscript = root.querySelector('noscript')
    // usally noscript can been full replaced
    if (noscript) {
      const wrapper = document.createElement('div')
      wrapper.innerHTML = noscript.innerHTML
      root.parentNode!.replaceChild(wrapper, root)
      return
    }
  }
  if (root.tagName.toLowerCase() !== 'p') {
    Array.from(root.children).forEach(node => removeUnlikelyChilds(document, node, config))
  }
}

function cleanAttribute(document: Document, root: Element, config: Config) {
  const allChilds = root.getElementsByTagName('*')
  const len = allChilds.length
  for (let index = 0; index < len; index++) {
    const target = allChilds[index]
    if (!target.tagName.toLowerCase().match(regexps.resourceTags)) {
      Array.from(target.attributes).forEach(attr => target.removeAttribute(attr.name))
    }
    if (config.url) {
      ['href', 'src'].forEach(attrName => {
        const resourceData = target.getAttribute(attrName)
        if (!resourceData) return
        const cUrl = new URL(config.url!.href)
        if (resourceData.startsWith('/')) {
          target.setAttribute(attrName, `${cUrl.origin}${resourceData}`)
        } else if (resourceData.startsWith('./')) {
          const path = cUrl.pathname.split('/')
          path.pop()
          target.setAttribute(attrName, `${cUrl.origin}${path.join('/')}/${resourceData.slice(2)}`)
        }
      })
    }
  }
}

type JuicerNode = {juicer: {contentScore: number}} & Element

function elementToJuicerNode(el: Element | null): JuicerNode {
  return <JuicerNode>el
}
