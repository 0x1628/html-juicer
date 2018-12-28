import {JSDOM} from 'jsdom'
import {grabContent, grabTitle} from './helpers'

export interface Config {
  useHeaderAsTitle: boolean
  cleanH1: boolean
  cleanAttribute: boolean,
  href: string
  url: URL | null
}

export class Juicer {
  static defaultConfig: Config = {
    useHeaderAsTitle: true,
    cleanH1: true,
    cleanAttribute: true,
    href: '',
    url: null,
  }

  win: JSDOM['window']
  config: typeof Juicer.defaultConfig
  cache: {[key: string]: string} = {}

  constructor(html: string, config?: Partial<typeof Juicer.defaultConfig>) {
    this.win = new JSDOM(html).window

    this.config = {
      ...Juicer.defaultConfig,
      ...config,
    }
    if (!this.config.url && this.config.href) {
      this.config.url = new URL(this.config.href)
    }
  }

  get content(): string {
    if (!this.cache.content) {
      this.cache.content = this.grabContent()
    }
    return this.cache.content
  }

  get title(): string {
    if (!this.cache.title) {
      this.cache.title = this.grabTitle()
    }
    return this.cache.title
  }

  grabTitle(): string {
    return grabTitle(this.win.document, this.config)
  }

  grabContent(): string {
    return grabContent(this.win.document, this.config)
  }
}

export function juice(html: string, config?: Partial<typeof Juicer.defaultConfig>): Juicer {
  const juicer = new Juicer(html, config || {})
  return juicer
}
