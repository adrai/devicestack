if (!Array.prototype.toHexDebug) {
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
        return res;
    };
}

if (!Array.prototype.toBuffer) {
    Array.prototype.toBuffer = function() {
        return new Buffer(this);
    };
}

if (!Array.prototype.toNumber) {
    Array.prototype.toNumber = function() {
        var value = 0;
        for ( var i = 0; i < this.length; i++) {
            value = (value * 256) + this[i];
        }

        return value;
    };
}