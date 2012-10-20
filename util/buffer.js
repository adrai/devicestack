if (!Buffer.prototype.toHexDebug) {
    Buffer.prototype.toHexDebug = function() {
        var str = this.toString('hex');
        var res = '';
        for (var i = 0, len = str.length; i < len; i += 2) {
            if (i > 0) {
                res += '-';
            }
            res += str[i] + str[i+ 1];
        }
        return res;
    };
}

if (!Buffer.prototype.toArray) {
    Buffer.prototype.toArray = function() {
        return Array.prototype.slice.call(this, 0);
    };
}