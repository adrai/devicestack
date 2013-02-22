if (!Array.prototype.toHexDebug) {

  /**
   * Converts a "byte" array to a readable hex string.
   * @return {String}       The result string.
   * 
   * @example:
   *     [0x01, 0x00].toHexDebug(); // returns '01-00'
   */
  Array.prototype.toHexDebug = function() {
    var res = '';
    for (var i = 0, len = this.length; i < len; i++) {
      if (i > 0) {
        res += '-';
      }
      var hex = this[i].toString(16);
      hex = hex.length < 2 ? '0' + hex : hex;
      res += hex;
    }
    return res.toUpperCase();
  };
}

if (!Array.prototype.toHexString) {

  /**
   * Converts a "byte" array to a hex string.
   * @return {String}       The result array.
   * 
   * @example:
   *     [0x01, 0x00].toHexString(); // returns '0100'
   */
  Array.prototype.toHexString = function() {
    var res = '';
    for (var i = 0, len = this.length; i < len; i++) {
      var hex = this[i].toString(16);
      hex = hex.length < 2 ? '0' + hex : hex;
      res += hex;
    }
    return res.toUpperCase();
  };
}

if (!Array.prototype.toBuffer) {

  /**
   * Converts a "byte" array to a buffer object.
   * @return {Buffer}       The result buffer object.
   * 
   * @example:
   *     [0x01, 0x00].toBuffer();
   */
  Array.prototype.toBuffer = function() {
    return new Buffer(this);
  };
}

if (!Array.prototype.toNumber) {

  /**
   * Converts a "byte" array to a number.
   * @return {Number}       The result number.
   * 
   * @example:
   *     [0x01, 0x00].toNumber(); // returns 256
   */
  Array.prototype.toNumber = function() {
    var value = 0;
    for ( var i = 0; i < this.length; i++) {
      value = (value * 256) + this[i];
    }

    return value;
  };
}