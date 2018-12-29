# html-juicer

[![CircleCI](https://circleci.com/gh/fragment0/html-juicer.svg?style=svg)](https://circleci.com/gh/fragment0/html-juicer)

A more simple way to clean 3rd webpage. Similar to arc90 readability.

## Why

arc90 readability is been used widely for getting a clean view of a webpage. But it's algorithm has some shortcoming then some page got a wrong result.

In the algorithm of arc90 readability, it first calculate all paragraph's score, add the paragraph, its parentNode and parentNode's parentNode to a candidate list, then pick the topCandidate which has the highest score. With a existing candidate, arc90 then walk through its siblings for other possible content. So under this algorithm, the traverser will search max to 4th depth to a top candidate. 

But in reality, many famous blog site use very deep nest structure for its content. Like [this article](https://medium.com/@rrhoover/5-years-of-product-hunt-b466eece118) in medium, a arc90 readability only get the first section of the whole article. The bottom-up traverse process can't do any thing about it.

## How we implements

So html-juicer has a top-down traverse process. 

We first calculate all paragraph's score like arc90, but we also score every parentNode until we reach the root. Then we traverse down the dom tree, find out the most possible root for the article. This is the final target. Simple right? 🤓

## More things

With the article root, we will do more stuff based on caller's config. For default config, we remove h1 tag, clean all useless attribute, and replace resouce' src to a correct result. All helper methods is well tested in [helpers.test.ts](https://github.com/fragment0/html-juicer/blob/master/src/__tests__/helpers.test.ts).

## Usage

Currently html-juicer only work in node.js.

```bash
npm i html-juicer
```

```typescript
import {Juicer} from 'html-juicer'

new Juicer(
  html: string, 
  config?: {
      useHeaderAsTitle?: boolean
      cleanH1?: boolean
      cleanAttribute?: boolean
      url?: URL | string | null
  },
): {
  content: string
  title: string
}
```

## Config

|name|description|default|
|-|-|-|
|useHeaderAsTitle|use h1 as result title or document.title|true|
|cleanH1|remove h1 tag in article root|true|
|cleanAttribute|clean useless attribute|true|
|url|the url of html|null|

## Dependencies

html-juicer only depend on jsdom.