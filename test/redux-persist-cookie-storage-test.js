var expect = require('chai').expect;
var jsdom = require('jsdom');

var CookieStorage = require('../index');

function withDOM (callback) {
  jsdom.env({ html: '', done: callback });
}

describe('CookieStorage', function () {
  describe('setItem', function () {
    it('stores an item as a cookie', function (done) {
      withDOM(function (err, window) {
        var storage = new CookieStorage({ windowRef: window });

        storage.setItem('test', { foo: 'bar' }, function () {
          expect(JSON.parse(storage.cookies.get('reduxPersist_test'))).to.eql({ foo: 'bar' });
          done();
        });
      });
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
  });

  describe('getItem', function () {
    it('gets an item stored as cookie', function (done) {
      withDOM(function (err, window) {
        var storage = new CookieStorage({ windowRef: window });
        storage.cookies.set('reduxPersist_test', JSON.stringify({ foo: 'bar' }));

        storage.getItem('test', function (error, result) {
          expect(result).to.eql({ foo: 'bar' });
          done();
        });
      });
    });

    it('returns nothing when the item isn\'t available', function (done) {
      withDOM(function (err, window) {
        var storage = new CookieStorage({ windowRef: window });

        storage.setItem('test', { foo: 'bar' }, function () {
          expect(JSON.parse(storage.cookies.get('reduxPersist_test'))).to.eql({ foo: 'bar' });
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
