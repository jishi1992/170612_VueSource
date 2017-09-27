function Observer(data) {
    // 保存data
    this.data = data;
    // 开始进行劫持
    this.walk(data);
}

Observer.prototype = {
    walk: function(data) {
        // 保存Observer实例对象
        var me = this;
        // 遍历data中所有属性
        Object.keys(data).forEach(function(key) {
            // 对指定属性进行劫持
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {
        // 为当前属性创建对应的dep对象
        var dep = new Dep();
        // 递归调用实现对所有层次属性的劫持
        var childObj = observe(val);
        // 重新定义data中指定的属性(添加getter/setter)
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function() {
                if (Dep.target) {
                    dep.depend();// 建立dep与watcher之间的关系
                }
                return val; // 返回属性值
            },
            set: function(newVal) {
                // 如果值没有变化直接结束
                if (newVal === val) {
                    return;
                }
                // 保存新值
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通过dep去通知更新
                dep.notify();
            }
        });
    }
};

function observe(value, vm) {
    // 如果value不是对象, 直接返回
    if (!value || typeof value !== 'object') {
        return;
    }
    // 创建一个Observer实例对象
    return new Observer(value);
};


var uid = 0;

function Dep() {
    // 标识id
    this.id = uid++;
    //保存相关所有watcher的数组
    this.subs = [];
}

Dep.prototype = {
    addSub: function(sub) {
        this.subs.push(sub);
    },

    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },

    notify: function() {
        // 遍历所有相关的watcher
        this.subs.forEach(function(sub) {
            // 调用watcher去更新界面
            sub.update();
        });
    }
};

Dep.target = null;