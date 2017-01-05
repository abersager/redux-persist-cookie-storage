var expect = require('chai').expect;
var jsdom = require('jsdom');

var CookieStorage = require('../index');

function withDOM (callback, options) {
  options = options || {};
  options.html = '';
  options.done = callback;

  jsdom.env(options);
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
    describe('setItem', function () {
      it('stores an item as a cookie', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });

        storage.setItem('test', JSON.stringify({ foo: 'bar' }), function () {
          expect(JSON.parse(storage.cookies.get('test'))).to.eql({ foo: 'bar' });
          done();
        });
      });

      it('updates the list of keys', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });

        storage.setItem('test', { foo: 'bar' }, function () {
          storage.getAllKeys(function (error, result) {
            expect(result).to.eql(['test'])
            done();
          });
        });
      });

    });

    describe('getItem', function () {
      it('gets an item stored as cookie', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });
        storage.cookies.set('test', JSON.stringify({ foo: 'bar' }));

        storage.getItem('test', function (error, result) {
          expect(JSON.parse(result)).to.eql({ foo: 'bar' });
          done();
        });
      });

      it('returns null when the item isn\'t available', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });

        storage.getItem('test', function (error, result) {
          expect(JSON.parse(result)).to.be.null;
          done();
        });
      });
    });

    describe('removeItem', function () {
      it('removes the item\'s cookie', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });
        storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }));

        storage.removeItem('test', function () {
          expect(storage.cookies.get('reduxPersist_test')).not.to.be.defined;
          done();
        });
      });

      it('removes the item from the list of keys', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });
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

    describe('getAllKeys', function () {
      it('returns a list of persisted keys', function (done) {
        var storage = new CookieStorage({ cookies: { foo: 'bar' } });
        storage.cookies.set('reduxPersistIndex', JSON.stringify(['foo', 'bar']));

        storage.getAllKeys(function (error, result) {
          expect(result).to.eql(['foo', 'bar']);
          done();
        });
      });
    });
  });
});
