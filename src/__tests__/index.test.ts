import {readFileSync} from 'fs'
import * as path from 'path'
import {JSDOM} from 'jsdom'
import {juice} from '../index'

const simple = readFileSync(path.resolve(__dirname, './html/simple.html')).toString()
const medium = readFileSync(path.resolve(__dirname, './html/medium.html')).toString()
const zhihu = readFileSync(path.resolve(__dirname, './html/zhihu.html')).toString()

test('simple', () => {
  const result = juice(simple)

  expect(result.title).toEqual('Simple Header')
  expect(result.content).not.toContain('comment')
})

test('medium', () => {
  const result = juice(medium, {
    href: 'https://medium.com/@rrhoover/5-years-of-product-hunt-b466eece118',
  })

  expect(result.title).toContain('5 Years')

  const {window: {document}} = new JSDOM(result.content)
  expect(document.querySelector('.avatar')).toBeNull()
  expect(document.querySelector('iframe')!.src).toMatch(/^https/)
})

test('zhihu', () => {
  const result = juice(zhihu, {
    href: 'https://zhuanlan.zhihu.com/p/20184123',
  })

  const {window: {document}} = new JSDOM(result.content)
  expect(document.body.textContent).toMatch(/^1/)
  expect(document.body.textContent).toMatch(/之中。$/)
})
