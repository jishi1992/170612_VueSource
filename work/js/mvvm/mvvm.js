function MVVM(options) {
    // 将配置对象保存到vm中
    this.$options = options;
    // 将data数据对象保存到vm和data变量中
    var data = this._data = this.$options.data;
    // 保存vm到me变量
    var me = this;

    // 遍历data中所有的属性
    Object.keys(data).forEach(function(key) {// 属性名
        // 对指定的属性实现数据代理
        me._proxy(key);
    });

    observe(data, this);

    // 创建一个编译对象
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },

    _proxy: function(key) {
        // 保存vm
        var me = this;
        // 给vm添加指定的属性(指定属性描述符)
        Object.defineProperty(me, key, {
            configurable: false, // 不可重新定义
            enumerable: true, // 可以枚举
            // 当通过vm.xxx来读取属性值时调用此方法得到属性值
            get: function proxyGetter() {
                // data中取出对应属性的值返回
                return me._data[key];
            },
            // 当通过vm.xxx = value赋新值时调用
            set: function proxySetter(newVal) {
                // 将最新的值保存data中对应的属性
                me._data[key] = newVal;
            }
        });
    }
};