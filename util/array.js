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

if(!Array.isArray) {

  Array.isArray = function (vArg) {
    return Object.prototype.toString.call(vArg) === "[object Array]";
  };

}

if (!Array.isByteArray) {

  /**
   * Checks if the passed argument is an array that contains byte values.
   * 
   * @param  {Array} data The array to be checked.
   * @return {Boolean}    True if it's a byte array, otherwise false.
   *
   * @example:
   *     Array.isByteArray([0x01, 0x00]) // returns true
   */
  Array.isByteArray = function(data) {

    if (!data || !Array.isArray(data)) {
      return false;
    }

    for (var i = 0, len = data.length; i < len; i++) {
      if (typeof(data[i]) !== 'number' || data[i] < 0x00 || data[i] > 0xFF) {
        return false;
      }
    }

    return true;

  };

}