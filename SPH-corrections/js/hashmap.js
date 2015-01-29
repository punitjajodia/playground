function HashMap() {
    this.buckets = [];
}

HashMap.prototype.set = function (key, value) {
    var bucket = this.buckets[key];
//    if (!bucket) {
//        bucket = new Array();
//        this.buckets[hashCode] = bucket;
    //    }
    if (!bucket) {
        bucket = {};
        this.buckets[key] = bucket;
        bucket.key = key;
        bucket.value = new Array();
    }

    bucket.value.push(value);
//    for (var i = 0; i < bucket.length; ++i) {
//        if (bucket[i].key.equals(key)) {
//            bucket[i].value = value;
//            return;
//        }
//    }
//    bucket.push({ key: key, value: value });
}

HashMap.prototype.get = function(key) {
    var bucket = this.buckets[key];
    if (!bucket) {
        return [];
    } else {
        return bucket.value;
    }
//    for (var i = 0; i < bucket.length; ++i) {
//        if (bucket[i].key.equals(key)) {
//            return bucket[i].value;
//        }
//    }
}

HashMap.prototype.clear = function () {
    this.buckets = [];
}

HashMap.prototype.count = function () {
    return this.keys().length;
}

HashMap.prototype.keys = function () {
    var keys = new Array();
    for (var hashKey in this.buckets) {
        var bucket = this.buckets[hashKey];
        keys.push(bucket.key);
//        for (var i = 0; i < bucket.length; ++i) {
//            keys.push(bucket[i].key);
//        }

    }
    return keys;
}

HashMap.prototype.values = function () {
    var values = new Array();
    for (var hashKey in this.buckets) {
        var bucket = this.buckets[hashKey];
        values.push(bucket.value);
//        for (var i = 0; i < bucket.length; ++i) {
//            values.push(bucket[i].value);
//        }
    }
    return values;
}