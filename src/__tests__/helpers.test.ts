import {_} from '../helpers'
import {Juicer, Config} from '../index'
import {JSDOM} from 'jsdom'

const {
  cleanDocument,
  cleanAttribute,
  scoreEveryP,
  getArticleRoot,
  removeUnlikelyChilds,
} = _

const config: Config = {
  ...Juicer.defaultConfig,
}

// tslint:disable-next-line:max-line-length
const longSentence = 'The Way that can be told of is not an Unvarying Way；The names that can be named are not unvarying names. It was from the Nameless that Heaven and Earth sprang'

test('removeUnlikelyChilds', () => {
  const {window: {document}} = new JSDOM(`<div class="target">
    <p>Hello world, Nice to See you</p>
    <p>${longSentence}</p>
    <p><a href="xxx">subscribe</a></p>
  </div>`)
  scoreEveryP(document)
  removeUnlikelyChilds(document, document.querySelector('.target')!, config)

  const html = document.body.innerHTML
  expect(html).toMatch(/hello world/i)
  expect(html).not.toMatch(/subscribe/i)
})

test('getArticleRoot', () => {
  const {window: {document}} = new JSDOM(`<body>
    <div class="fake">
      <p><a href="#">subscribe</a></p>
    </div>
    <div class="target">
      <p>Hello world</p>
      <p>${longSentence}</p>
      <p><a href="xxx">subscribe</a></p>
    </div>
    <div class="fake">
      <p>Copy right 2018 html-juicer</p>
    </div>
  </body>`)

  scoreEveryP(document)
  const root = getArticleRoot(document.body)
  expect(root).toBe(document.body.querySelector('.target'))
})

test('cleanDocument', () => {
  const {window: {document}} = new JSDOM(`<body>
    <div class="comment">comment</div>
    <div class="target">
      <p>Hello world</>
    </div>
    <div class="ad">ad</div>
  </body>`)

  cleanDocument(document)
  expect(document.querySelector('.target')).toBeTruthy()
  expect(document.querySelector('.ad')).toBeNull()
  expect(document.querySelector('.comment')).toBeNull()
})

test('cleanAttribute', () => {
  const html = `<body>
    <div class="target">
      <p class="remove1" data-test="remove2">${longSentence}</p>
      <p>
        <img src="remain1" />
      </p>
      <p>
        <video src="/test" class="remain2" />
      </p>
      <p>
        <iframe src="./test" class="remain3" />
      </p>
    </div>
  </body>`
  const {window: {document}} = new JSDOM(html)

  const url = 'https://whatever'
  cleanAttribute(document, document.querySelector('.target')!, {
    ...config,
    url: new URL(`${url}/folder/`),
  })
  expect(document.body.innerHTML).not.toMatch(/remove/)
  expect((document.body.innerHTML.match(/remain/g) || []).length).toBe(3)
  expect(document.querySelector('.remain2')!.getAttribute('src')).toBe(`${url}/test`)
  expect(document.querySelector('.remain3')!.getAttribute('src')).toBe(`${url}/folder/test`)

  const {window: {document: document2}} = new JSDOM(html)
  cleanAttribute(document2, document2.querySelector('.target')!, {
    ...config,
    url: new URL(`${url}/path`),
  })
  expect(document2.querySelector('.remain2')!.getAttribute('src')).toBe(`${url}/test`)
  expect(document2.querySelector('.remain3')!.getAttribute('src')).toBe(`${url}/test`)
})
