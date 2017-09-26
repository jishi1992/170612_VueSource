function Compile(el, vm) {
    // 保存vm
    this.$vm = vm;
    // 保存el元素对象
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);

    if (this.$el) {
        // 1. 取出el中所有的子节点保存到一个fragment中, 并保存fragment
        this.$fragment = this.node2Fragment(this.$el);
        // 2. 编译fragment中所有层次的子节点
        this.init();
        // 3. 将编译好的fragment添加到el中
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    node2Fragment: function(el) {
        var fragment = document.createDocumentFragment(),
            child;

        // 将原生节点拷贝到fragment
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }

        return fragment;
    },

    init: function() {
        // 编译fragment
        this.compileElement(this.$fragment);
    },

    /*
        编译指定元素的所有层次的子节点(利用递归)
     */
    compileElement: function(el) {
        // 得到所有子节点(最外层的)
        var childNodes = el.childNodes,
          // 保存当前compile实例对象
            me = this;
        // 遍历所有子节点
        [].slice.call(childNodes).forEach(function(node) {
            // 得到节点的文本内容
            var text = node.textContent;
            // 创建匹配大括号表达式正则对象
            var reg = /\{\{(.*)\}\}/;
            // 如果是元素节点
            if (me.isElementNode(node)) {
                // 编译元素节点的所有指令属性
                me.compile(node);
            // 如果是大括号表达式格式的文本节点
            } else if (me.isTextNode(node) && reg.test(text)) {
                // 编译此表达式文本节点
                me.compileText(node, RegExp.$1); // RegExp.$1: 表达式: name
            }
            // 如果此节点还有子节点, 递归调用当前编译方法实现对所有层次节点的编译
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },

    compile: function(node) {
        var nodeAttrs = node.attributes,
            me = this;

        [].slice.call(nodeAttrs).forEach(function(attr) {
            var attrName = attr.name;
            if (me.isDirective(attrName)) {
                var exp = attr.value;
                var dir = attrName.substring(2);
                // 事件指令
                if (me.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                    // 普通指令
                } else {
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        });
    },

    compileText: function(node, exp) {
        // 调用编译工具对象进行编译工作
        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function(attr) {
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function(dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function(node) {
        return node.nodeType == 1;
    },

    isTextNode: function(node) {
        return node.nodeType == 3;
    }
};

/*
包信多个编译指令/表达式方法的工具对象
 */
var compileUtil = {
    // 解析 v-text/{{}}
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text'); // 'text': 指令名
    },

    // 解析 v-html
    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    // 解析 v-model
    model: function(node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function(e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    // 解析 v-class
    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    /*
    真正解析指令/表达式的方法
     */
    bind: function(node, vm, exp, dir) {
        // 得到对应的更新的函数
        var updaterFn = updater[dir + 'Updater'];

        // 调用更新的函数, 更新节点
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        new Watcher(vm, exp, function(value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    eventHandler: function(node, vm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    // 得到表达式在vm中对应的value
    _getVMVal: function(vm, exp) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function(vm, exp, value) {
        var val = vm._data;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

/*
包含多个更新节点的方法的对象
 */
var updater = {
    // 更新节点的textContent属性
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    // 更新节点的innerHTML属性
    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    // 更新节点的className属性
    classUpdater: function(node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    // 更新节点的value属性
    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};