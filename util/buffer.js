if (!Buffer.prototype.toHexDebug) {

  /**
   * Converts a buffer object to a readable hex string.
   * @return {String}       The result hex string.
   * 
   * @example:
   *     (new Buffer([0x01, 0x00])).toHexDebug(); // returns '01-00'
   */
  Buffer.prototype.toHexDebug = function() {
    var str = this.toString('hex');
    var res = '';
    for (var i = 0, len = str.length; i < len; i += 2) {
      if (i > 0) {
        res += '-';
      }
      res += str[i] + str[i+ 1];
    }
    return res.toUpperCase();
  };
}

if (!Buffer.prototype.toArray) {

  /**
   * Converts a buffer object to a "byte" array.
   * @return {Array}       The result array.
   * 
   * @example:
   *     (new Buffer([0x01, 0x00])).toArray(); // returns [0x01, 0x00]
   */
  Buffer.prototype.toArray = function() {
    return Array.prototype.slice.call(this, 0);
  };
}