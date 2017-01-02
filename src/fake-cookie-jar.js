function FakeCookieJar(cookies) {
  var parsed = {};
  Object.keys(cookies).forEach(function(key) {
    parsed[unescape(key)] = cookies[key];
  })
  this.cookies = parsed;
}

FakeCookieJar.prototype.get = function (key) {
  return this.cookies[key];
}

FakeCookieJar.prototype.set = function (key, value, expiration) {
  this.cookies[key] = value;
  if (expiration) {
    var expires = expiration.expires;

    if (expires) {
      setTimeout(function() {
        delete this.cookies[key];
      }.bind(this), expires);
    }
  }
}

FakeCookieJar.prototype.expire = function (key) {
  delete this.cookies[key];
}

module.exports = FakeCookieJar;
