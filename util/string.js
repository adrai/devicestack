if (!String.prototype.toArray) {

    /**
     * Converts a hex string to a "byte" array.
     * @return {Array}       The result array.
     * 
     * @example:
     *     '0100'.toArray(); // returns [0x01, 0x00]
     */
    String.prototype.toArray = function() {
        var str = this + '';
        if (str.length % 2 !== 0) {
            str = '0' + str;
        }
        var result = [];
        for (var i = 0; i < str.length; i+=2) {
            var val = (str[i] + str[i+1]);
            result.push(parseInt(val, 16));
        }
        return result;
    };
}