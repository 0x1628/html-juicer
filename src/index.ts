import {JSDOM} from 'jsdom'
import {grabContent, grabTitle} from './helpers'

export interface Config {
  useHeaderAsTitle: boolean
  cleanH1: boolean
  cleanAttribute: boolean,
  url: URL | null
}

export type CustomConfig = Pick<Config, Exclude<keyof Config, 'url'>> & {
  url: URL | string | null,
}

export class Juicer {
  static defaultConfig: Config = {
    useHeaderAsTitle: true,
    cleanH1: true,
    cleanAttribute: true,
    url: null,
  }

  win: JSDOM['window']
  config: Config
  cache: {[key: string]: string} = {}

  constructor(html: string, config: Partial<CustomConfig> = {}) {
    this.win = new JSDOM(html).window

    this.config = {
      ...Juicer.defaultConfig,
      ...config,
      url: config.url ? (typeof config.url === 'string' ? new URL(config.url) : config.url) : null,
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

export function juice(html: string, config?: Partial<CustomConfig>): Juicer {
  const juicer = new Juicer(html, config || {})
  return juicer
}
