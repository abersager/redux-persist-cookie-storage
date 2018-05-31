const chai = require('chai')
const spies = require('chai-spies')
const CookiesJS = require('cookies-js')
const Cookies = require('cookies')
const JSDOM = require('jsdom').JSDOM
const MockExpressRequest = require('mock-express-request')
const MockExpressResponse = require('mock-express-response')

const CookieStorage = require('../src/redux-persist-cookie-storage')
const NodeCookiesWrapper = require('../src/node-cookies-wrapper')

chai.use(spies)
const expect = chai.expect

function delay (milliseconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), milliseconds)
  })
}

function isSpy(cookies) {
  return cookies && typeof cookies['get'] === 'function' && '__spy' in cookies['get']
}

describe('CookieStorage', () => {
  describe('browser behaviour', () => {
    describe('setItem', () => {
      it('stores item as session cookies by default', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { expiration: { default: null } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', )
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', )
      })

      it('stores item as session cookies by default with custom key prefix', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { keyPrefix: 'prefix', expiration: { default: null } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('prefixtest', '{"foo":"bar"}', {})
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', {})
      })

      it('stores an item as a cookie with expiration time', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { expiration: { default: 1 } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', { expires: 1 })
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', { expires: 1 })
      })

      it('stores an item as a cookie with expiration time and custom key prefix', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { keyPrefix: 'prefix', expiration: { default: 1 } })
        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('prefixtest', '{"foo":"bar"}', { expires: 1 })
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', { expires: 1 })
      })

      it('stores an item with custom expiration overriding default time', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { expiration: {
          default: 3,
          test: 1
        } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))
        await storage.setItem('test2', JSON.stringify({ foo: 'bar' }))
        const keys = await storage.getAllKeys()

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', { expires: 1 })
        expect(Cookies.set).to.have.been.called.with('test2', '{"foo":"bar"}', { expires: 3 })
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test","test2"]', { expires: 3 })
      })

      it('stores an item with custom expiration overriding default session option', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { expiration: {
          default: null,
          test: 1
        } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', { expires: 1 })
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', {})
      })

      it('stores an item as a session cookie overriding default time', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { expiration: {
          default: 3,
          test: null
        } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', {})
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', { expires: 3 })
      })

      it('stores an item as a session cookie in specified domain', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, {
          setCookieOptions: { domain: 'example.com' }
        })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', { domain: 'example.com' })
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', { domain: 'example.com' })
      })

      it('stores an item as a session cookie in specified path', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, {
          setCookieOptions: { path: '/123' }
        })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(Cookies.set).to.have.been.called.with('test', '{"foo":"bar"}', { path: '/123' })
        expect(Cookies.set).to.have.been.called.with('reduxPersistIndex', '["test"]', { path: '/123' })
      })

      it('updates the list of keys', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)
        chai.spy.on(Cookies, 'set')

        const storage = new CookieStorage(Cookies, { expiration: { default: null } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))
        await storage.setItem('test2', JSON.stringify({ foo: 'bar' }))
        const keys = await storage.getAllKeys()
        expect(keys).to.eql(['test', 'test2'])
      })

      it('stores list of keys with expiration time', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies, { expiration: {
          default: 1
        } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))
        let keys = await storage.getAllKeys()
        expect(keys).to.eql(['test'])

        await delay(1000)
        keys = await storage.getAllKeys()
        expect(keys).to.eql([])
      })
    })

    describe('getItem', () => {
      it('gets an item stored as cookie', (done) => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('test', JSON.stringify({ foo: 'bar' }))

        storage.getItem('test', (error, result) => {
          expect(JSON.parse(result)).to.eql({ foo: 'bar' })
          done()
        })
      })

      it('gets an item stored as cookie and returns a promise', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('test', JSON.stringify({ foo: 'bar' }))

        const result = await storage.getItem('test')
        expect(JSON.parse(result)).to.eql({ foo: 'bar' })
      })

      it('returns null when the item isn\'t available', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        const result = await storage.getItem('test')
        expect(JSON.parse(result)).to.be.null
      })
    })

    describe('removeItem', () => {
      it('removes the item\'s cookie', function (done) {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('test', JSON.stringify({ foo: 'bar' }))

        storage.removeItem('test', (error, result) => {
          expect(storage.cookies.get('reduxPersist_test')).not.to.be.defined
          done()
        })
      })

      it('removes the item\'s cookie and returns a promise', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('test', JSON.stringify({ foo: 'bar' }))

        await storage.removeItem('test')

        expect(storage.cookies.get('reduxPersist_test')).not.to.be.defined
      })

      it('removes the item from the list of keys', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }))

        await storage.setItem('test', { foo: 'bar' })
        await storage.removeItem('test')

        let keys = await storage.getAllKeys()
        expect(keys).to.eql([])
      })
    })

    describe('getAllKeys', () => {
      it('returns a list of persisted keys', (done) => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('reduxPersistIndex', JSON.stringify(['foo', 'bar']))

        storage.getAllKeys(function (error, result) {
          expect(result).to.eql(['foo', 'bar'])
          done()
        })
      })

      it('returns a list of persisted keys and returns a promise', async () => {
        const Cookies = CookiesJS(new JSDOM(``).window)

        const storage = new CookieStorage(Cookies)

        storage.cookies.set('reduxPersistIndex', JSON.stringify(['foo', 'bar']))

        const keys = await storage.getAllKeys()
        expect(keys).to.eql(['foo', 'bar'])
      })
    })
  })

  describe('server-side behaviour', function () {
    describe('setItem', () => {
      it('stores an item as a cookie', async () => {
        const fakeCookies = {
          set: chai.spy(),
          get: chai.spy(),
        }

        const cookieJar = new NodeCookiesWrapper(fakeCookies)
        const storage = new CookieStorage(cookieJar, { expiration: { default: null } })

        await storage.setItem('test', JSON.stringify({ foo: 'bar' }))

        expect(fakeCookies.set).to.have.been.called.with('test', '{%22foo%22:%22bar%22}', {})
        expect(fakeCookies.set).to.have.been.called.with('reduxPersistIndex', '[%22test%22]', {})
      })
    })

    describe('getItem', function () {
      it('gets an item stored as cookie', async () => {
        const fakeCookies = {
          set: chai.spy(),
          get: chai.spy(returns => ('{"foo":"bar"}')),
        }

        const cookieJar = new NodeCookiesWrapper(fakeCookies)
        const storage = new CookieStorage(cookieJar, { expiration: { default: null } })

        const result = await storage.getItem('test')

        expect(JSON.parse(result)).to.eql({ foo: 'bar' })
        expect(fakeCookies.get).to.have.been.called.with('test')
      })

      it('returns null when the item isn\'t available', async () => {
        const fakeCookies = {
          set: chai.spy(),
          get: chai.spy(),
        }

        const cookieJar = new NodeCookiesWrapper(fakeCookies)
        const storage = new CookieStorage(cookieJar, { expiration: { default: null } })

        const result = await storage.getItem('test')

        expect(JSON.parse(result)).to.null
        expect(fakeCookies.get).to.have.been.called.with('test')
      })
    })

    describe('removeItem', function () {
      it('removes the item\'s cookie', async () => {
        const fakeCookies = {
          set: chai.spy(),
          get: chai.spy(),
        }

        const cookieJar = new NodeCookiesWrapper(fakeCookies)
        const storage = new CookieStorage(cookieJar, { expiration: { default: null } })

        await storage.removeItem('test')

        expect(fakeCookies.set).to.have.been.called.with('test', undefined)
      })

      it('removes the item from the list of keys', async () => {
        const fakeCookies = {
          set: chai.spy(),
          get: chai.spy(),
        }

        const cookieJar = new NodeCookiesWrapper(fakeCookies)
        const storage = new CookieStorage(cookieJar, { expiration: { default: null } })
        storage.getAllKeys = chai.spy(returns => Promise.resolve(['test', 'test2', 'test3']))

        await storage.removeItem('test2')

        expect(fakeCookies.set).to.have.been.called.with('test2', undefined)
        expect(fakeCookies.set).to.have.been.called.with('reduxPersistIndex', '[%22test%22%2C%22test3%22]')
      })
    })

    describe('getAllKeys', function () {
      it('returns a list of persisted keys', async () => {
        const fakeCookies = {
          get: chai.spy(returns => ('["test","test2"]')),
        }

        const cookieJar = new NodeCookiesWrapper(fakeCookies)
        const storage = new CookieStorage(cookieJar, { expiration: { default: null } })

        const keys = await storage.getAllKeys()

        expect(keys).to.eql(['test', 'test2'])
      })
    })
  })
})
