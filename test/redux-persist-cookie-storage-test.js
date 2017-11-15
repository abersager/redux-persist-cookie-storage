var chai = require('chai');
var spies = require('chai-spies');
chai.use(spies)

var expect = chai.expect;

var jsdom = require('jsdom');

var CookieStorage = require('../index');
var FakeCookieJar = require('../src/fake-cookie-jar');

function withDOM (callback, options) {
  options = options || {};
  options.html = '';
  options.done = callback;

  jsdom.env(options);
}

function isSpy(cookies) {
  return cookies && typeof cookies['get'] === 'function' && '__spy' in cookies['get']
}

describe('CookieStorage', function () {
  describe('browser behaviour', function () {
    describe('setItem', function () {
      it('stores item as session cookies by default', function (done) {
        var cookieJar = jsdom.createCookieJar();

        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, expiration: { default: null} });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });
            expect(cookieJar.store.idx.blank['/'].test.expires).to.eql('Infinity')
            done();
          });
        }, { cookieJar: cookieJar });
      });

      it('stores item as session cookies by default with custom key prefix', function (done) {
        var cookieJar = jsdom.createCookieJar();

        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, keyPrefix: 'prefix', expiration: { default: null} });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('prefixtest'))).to.eql({ foo: 'bar' });
            expect(cookieJar.store.idx.blank['/'].prefixtest.expires).to.eql('Infinity')
            done();
          });
        }, { cookieJar: cookieJar });
      });

      it('stores an item as a cookie with expiration time', function (done) {
        var cookieJar = jsdom.createCookieJar();

        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, expiration: {
              'default': 1
            }
          });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });
            expect(cookieJar.store.idx.blank['/'].test.expires).not.to.eql('Infinity')

            setTimeout(function() {
              expect(storage.cookies.get('test')).to.be.undefined;
              done();
            }, 2e3);
          });
        }, { cookieJar: cookieJar });
      });

      it('stores an item as a cookie with expiration time and custom key prefix', function (done) {
        var cookieJar = jsdom.createCookieJar();

        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, keyPrefix: 'prefix', expiration: {
              'default': 1
            }
          });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('prefixtest'))).to.eql({ foo: 'bar' });
            expect(cookieJar.store.idx.blank['/'].prefixtest.expires).not.to.eql('Infinity')

            setTimeout(function() {
              expect(storage.cookies.get('test')).to.be.undefined;
              done();
            }, 2e3);
          });
        }, { cookieJar: cookieJar });
      });

      it('stores an item with custom expiration overriding default time', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, expiration: {
              'default': 3,
              'test': 1
            }
          });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });

            setTimeout(function() {
              expect(storage.cookies.get('test')).to.be.undefined;
              done();
            }, 1e3);
          });
        });
      });

      it('stores an item with custom expiration overriding default session option', function (done) {
        var cookieJar = jsdom.createCookieJar();

        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, expiration: {
              'default': null,
              'timed': 1
            }
          });

          storage.setItem('timed', JSON.stringify({ foo: 'bar' }), function () {
            storage.setItem('session', JSON.stringify({ foo: 'bar' }), function () {
              expect(JSON.parse(storage.cookies.get('session'))).to.eql({ foo: 'bar' });
              expect(cookieJar.store.idx.blank['/'].session.expires).to.eql('Infinity')

              expect(JSON.parse(storage.cookies.get('timed'))).to.eql({ foo: 'bar' });
              expect(cookieJar.store.idx.blank['/'].timed.expires).not.to.eql('Infinity')

              setTimeout(function() {
                expect(JSON.parse(storage.cookies.get('session'))).to.eql({ foo: 'bar' });
                expect(storage.cookies.get('timed')).to.be.undefined;
                done();
              }, 1e3);
            });
          });
        }, { cookieJar: cookieJar });
      });

      it('stores an item as a session cookie overriding default time', function (done) {
        var cookieJar = jsdom.createCookieJar();

        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, expiration: {
            'default': 3,
            'session': null
          }});

          storage.setItem('timed', JSON.stringify({ foo: 'bar' }), function () {
            storage.setItem('session', JSON.stringify({ foo: 'bar' }), function () {
              expect(JSON.parse(storage.cookies.get('session'))).to.eql({ foo: 'bar' });
              expect(cookieJar.store.idx.blank['/'].session.expires).to.eql('Infinity')

              expect(JSON.parse(storage.cookies.get('timed'))).to.eql({ foo: 'bar' });
              expect(cookieJar.store.idx.blank['/'].timed.expires).not.to.eql('Infinity')
              done();
            });
          });
        }, { cookieJar: cookieJar });
      });

      it('stores an item as a session cookie in specified domain', function (done) {
        var cookieJar = jsdom.createCookieJar();
        var domain = '.example.com';

        withDOM(function (err, window) {
          var storage = new CookieStorage({
            windowRef: window,
            domain: domain
          });

          storage.setItem('domain_test', 'testing1', function () {
            expect(cookieJar.store.idx[domain.substr(1)]['/'].domain_test.domain).to.eql(domain.substr(1));
            done();
          });
        }, { cookieJar: cookieJar, url: 'http://an.example.com' });
      });

      it('stores an item as a session cookie in specified path', function (done) {
        var cookieJar = jsdom.createCookieJar();
        var path = '/123';

        withDOM(function (err, window) {
          var storage = new CookieStorage({
            windowRef: window,
            path: path
          });

          storage.setItem('path_test', 'testing2', function () {
            expect(cookieJar.store.idx.blank[path].path_test.path).to.eql(path);
            done();
          });
        }, { cookieJar: cookieJar });
      });

      it('updates the list of keys', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window });

          storage.setItem('test', { foo: 'bar' }, function () {
            storage.getAllKeys(function (error, result) {
              expect(result).to.eql(['test'])
              done();
            });
          });
        });
      });

      it('stores list of keys with expiration time', function(done){
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, expiration: {
              'default': 1,
              'test': 3
            }
          });

          storage.setItem('test', { foo: 'bar' }, function () {
            storage.getAllKeys(function (error, result) {
              expect(result).to.eql(['test'])

              setTimeout(function() {
                storage.getAllKeys(function (error, result) {
                  expect(result).to.eql([])
                  done();
                });
              }, 2e3);
            });
          });
        });
      });

    });

    describe('getItem', function () {
      it('gets an item stored as cookie', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window });
          storage.cookies.set('test', JSON.stringify({ foo: 'bar' }));

          storage.getItem('test', function (error, result) {
            expect(JSON.parse(result)).to.eql({ foo: 'bar' });
            done();
          });
        });
      });

      it('returns null when the item isn\'t available', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window });

          storage.getItem('test', function (error, result) {
            expect(JSON.parse(result)).to.be.null;
            done();
          });
        });
      });
    });

    describe('removeItem', function () {
      it('removes the item\'s cookie', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window });
          storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }));

          storage.removeItem('test', function () {
            expect(storage.cookies.get('reduxPersist_test')).not.to.be.defined;
            done();
          });
        });
      });

      it('removes the item from the list of keys', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window });
          storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }));

          storage.setItem('test', { foo: 'bar' }, function () {
            storage.removeItem('test', function () {
              storage.getAllKeys(function (error, result) {
                expect(result).to.eql([]);
                done();
              });
            });
          });
        });
      });
    });

    describe('getAllKeys', function () {
      it('returns a list of persisted keys', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window });
          storage.cookies.set('reduxPersistIndex', JSON.stringify(['foo', 'bar']));

          storage.getAllKeys(function (error, result) {
            expect(result).to.eql(['foo', 'bar']);
            done();
          });
        });
      });
    });
  });

  describe('server-side behaviour', function () {
    var cookies;

    var sharedBehavior = function() {
      describe('setItem', function () {
        it('stores an item as a cookie', function (done) {
          var storage = new CookieStorage({ cookies });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });
            if (isSpy(cookies)) {
              expect(cookies.set).to.have.been.called;
              expect(cookies.get).to.have.been.called;
            }
            done();
          });
        });

        it('updates the list of keys', function (done) {
          var storage = new CookieStorage({ cookies });

          storage.setItem('test', { foo: 'bar' }, function () {
            storage.getAllKeys(function (error, result) {
              expect(result).to.eql(['test'])
              if (isSpy(cookies)) {
                expect(cookies.set).to.have.been.called;
                expect(cookies.get).to.have.been.called;
              }
              done();
            });
          });
        });

      });

      describe('getItem', function () {
        it('gets an item stored as cookie', function (done) {
          var storage = new CookieStorage({ cookies });
          storage.cookies.set('test', JSON.stringify({ foo: 'bar' }));

          storage.getItem('test', function (error, result) {
            expect(JSON.parse(result)).to.eql({ foo: 'bar' });
            if (isSpy(cookies)) {
              expect(cookies.set).to.have.been.called;
              expect(cookies.get).to.have.been.called;
            }
            done();
          });
        });

        it('returns null when the item isn\'t available', function (done) {
          var storage = new CookieStorage({ cookies });

          storage.getItem('test', function (error, result) {
            expect(JSON.parse(result)).to.be.null;
            if (isSpy(cookies)) {
              expect(cookies.get).to.have.been.called;
            }
            done();
          });
        });
      });

      describe('removeItem', function () {
        it('removes the item\'s cookie', function (done) {
          var storage = new CookieStorage({ cookies });
          storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }));

          storage.removeItem('test', function () {
            expect(storage.cookies.get('reduxPersist_test')).not.to.be.defined;
            if (isSpy(cookies)) {
              expect(cookies.set).to.have.been.called;
              expect(cookies.get).to.have.been.called;
              expect(cookies.expire).to.have.been.called;
            }

            done();
          });
        });

        it('removes the item from the list of keys', function (done) {
          var storage = new CookieStorage({ cookies });
          storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }));

          storage.setItem('test', { foo: 'bar' }, function () {
            storage.removeItem('test', function () {
              storage.getAllKeys(function (error, result) {
                expect(result).to.eql([]);
                if (isSpy(cookies)) {
                  expect(cookies.set).to.have.been.called;
                  expect(cookies.get).to.have.been.called;
                  expect(cookies.expire).to.have.been.called;
                }
                done();
              });
            });
          });
        });
      });
      describe('getAllKeys', function () {
        it('returns a list of persisted keys', function (done) {
          var storage = new CookieStorage({ cookies });
          storage.cookies.set('reduxPersistIndex', JSON.stringify(['foo', 'bar']));

          storage.getAllKeys(function (error, result) {
            expect(result).to.eql(['foo', 'bar']);
            if (isSpy(cookies)) {
              expect(cookies.set).to.have.been.called;
              expect(cookies.get).to.have.been.called;
            }

            done();
          });
        });
      });
    }

    context('with cookie object', function() {
      beforeEach(function() {
        cookies = { foo: 'bar' }
      });
      sharedBehavior()
    });

    context('with FakeCookieJar', function() {
      beforeEach(function() {
        cookies = new FakeCookieJar({ foo: 'bar' });
        chai.spy.on(cookies, 'get')
        chai.spy.on(cookies, 'set')
        chai.spy.on(cookies, 'expire')
      });
      sharedBehavior()
    });

  });
});
