function EnumItem(key, value) {
    this.key = key;
    this.value = value;
}

EnumItem.prototype.has = function(value) {
    if (value instanceof EnumItem) {
        return (this.value & value.value) !== 0;
    } else {
        return (this.value & value) !== 0;
    }
};

EnumItem.prototype.is = function(key) {
    if (key instanceof EnumItem) {
        return this.key === key.key;
    } else {
        return this.key === key;
    }
};

EnumItem.prototype.toString = function() {
    return this.key;
};

EnumItem.prototype.toJSON = function() {
    return this.key;
};

EnumItem.prototype.valueOf = function() {
    return this.key;
};


var Enum = module.exports = function(map, options) {
    this._options = options || {};
    this._options.separator = this._options.separator || ' | ';

    for (var member in map) {
        if ((this._options.name && member === 'name') || member === '_options' || member === 'get' || member === 'getKey' || member === 'getValue') {
            throw new Error('Enum key "' + member + '" is a reserved word!');
        }
        this[member] = new EnumItem(member, map[member]);
    }

    if (this._options.name) {
        this.name = this._options.name;
    }
};

Enum.prototype.getKey = function(value) {
    if (value instanceof EnumItem) {
        return value.key;
    } else {
        var item = this.get(value);
        if (item) {
            return item.key;
        } else {
            return 'Undefined';
        }
    }
};

Enum.prototype.getValue = function(key) {
    if (key instanceof EnumItem) {
        return key.value;
    } else {
        var item = this.get(key);
        if (item) {
            return item.value;
        } else {
            return null;
        }
    }
};

Enum.prototype.get = function(key) {
    if (key instanceof EnumItem) {
        return key;
    } else if (typeof(key) === 'string') {
        if (key.indexOf(this._options.separator) > 0) {
            var parts = key.split(this._options.separator);

            var value = 0;
            for(var i = 0; i < parts.length; i++) {
                var part = parts[i];

                value |= this[part].value;
            }

            return new EnumItem(key, value);
        } else {
            return this[key];
        }
    } else {
        for (var m in this) {
            if (this.hasOwnProperty(m)) {
                if (this[m].value === key) {
                    return this[m];
                }
            }
        }

        var result = null;
        for (var n in this) {
            if (this.hasOwnProperty(n)) {
                if ((key & this[n].value) !== 0) {
                    if (result) {
                        result += this._options.separator;
                    } else {
                        result = '';
                    }
                    result += n;
                }
            }
        }

        return this.get(result || 'Undefined');
    }
};

if (!global.Enum) {
    global.Enum = Enum;
}