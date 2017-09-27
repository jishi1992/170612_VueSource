function Watcher(vm, exp, cb) {
    this.cb = cb; // 更新节点的回调函数
    this.vm = vm; // vm
    this.exp = exp; // 对应的表达式
    this.depIds = {}; // 包含多个dep的对象
    this.value = this.get(); // 得到初始值
}

Watcher.prototype = {
    update: function() {
        this.run();
    },
    run: function() {
        var value = this.get();
        var oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.vm, value, oldVal);
        }
    },
    addDep: function(dep) {
        // 判断watcher是否已经有指定的dep(关系是否已经建立过)
        if (!this.depIds.hasOwnProperty(dep.id)) {
            // 将watcher添加到dep中
            dep.addSub(this);
            // 将dep添加到watcher中
            this.depIds[dep.id] = dep;
        }
    },
    get: function() {
        // 指定Dep所对应的target watcher为当前的watcher
        Dep.target = this;
        // 获取表达式对应的值(引起属性的get调用, 并建立dep与watcher之间的关系)
        var value = this.getVMVal();
        // 指定Dep所对应的target watcher为nulll
        Dep.target = null;
        return value;
    },

    getVMVal: function() {
        var exp = this.exp.split('.');
        var val = this.vm._data;
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    }
};