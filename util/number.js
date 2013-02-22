if (!Number.prototype.toArray) {

  /**
   * Converts a number to a "byte" array.
   * @param  {Number} size The size of the array . [optional]
   * @return {Array}       The result array.
   * 
   * @example:
   *     (256).toArray(); // returns [0x01, 0x00]
   */
  Number.prototype.toArray = function(size) {
    if (!size) {
      if (this > 0xffffffffffff) {
        size = 8;
      } else if (this > 0xffffffff) {
        size = 6;
      } else if (this > 0xffff) {
        size = 4;
      } else if (this > 0xff || this < 0xff) {
        size = 2;
      }
    }

    var bytes = [];

    var n = this;

    for (var i = size - 1; i >= 0; i--) {
      var b = n & 0xff;
      bytes[i] = b;
      n = (n - b) / 256 ;
    }

    return bytes;
  };

  /**
   * Converts a number to a buffer object.
   * @param  {Number} size The size of the array . [optional]
   * @return {Buffer}       The result array.
   * 
   * @example:
   *     (256).toBuffer(); // returns [0x01, 0x00]
   */
  Number.prototype.toBuffer = function(size) {
    return new Buffer(this.toArray(size));
  };
}