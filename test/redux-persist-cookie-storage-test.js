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

      // tough-cookie doesn't seem to expose/support maxAge the way jsdom
      // is constructing the cookie jar, hence these tests are replicated below
      // in a different way. at some point these might work though?
      xit('stores an item as a cookie with a max age', function (done) {
        var cookieJar = jsdom.createCookieJar();
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, maxAge: {
              'default': 1
            }
          });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });
            expect(cookieJar.store.idx.blank['/'].test.maxAge).to.eql(1)
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

      // see comment at the other xit above
      xit('stores an item with custom expiration overriding default time', function (done) {
        withDOM(function (err, window) {
          var storage = new CookieStorage({ windowRef: window, maxAge: {
              'default': 3,
              'test': 1,
            }
          });

          storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
            expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });
            expect(cookieJar.store.idx.blank['/'].test.maxAge).to.eql(1)
            setTimeout(function() {
              expect(storage.cookies.get('test')).to.be.undefined;
              done();
            }, 2e3);
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
    var cookies, storage

    var sharedBehavior = function() {

      beforeEach(function() {
        storage = new CookieStorage({ cookies });
      })

      describe('setItem', function () {
        it('stores an item as a cookie', function (done) {
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

      it('stores an item as a cookie with a max age', function() {
        storage = new CookieStorage({ cookies, maxAge: { default: 60 } });
        storage.setItem('test', JSON.stringify({ foo: 'bar' }), function() {
          expect(cookies.set).to.have.been.called.with('test', JSON.stringify({ foo: 'bar' }), { maxAge: 60})
        })
      });

      it('stores an item with custom maxAge overriding default time', function() {
        storage = new CookieStorage({ cookies, maxAge: { default: 30, test: 60 } });
        storage.setItem('test', JSON.stringify({ foo: 'bar' }), function() {
          expect(cookies.set).to.have.been.called.with('test', JSON.stringify({ foo: 'bar' }), { maxAge: 60})
        })
      });
    });
  });
});
