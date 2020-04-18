// vue的特点不能新增不存在的属性 因为不存在的属性没有get和set
// 深度监听  因为每次赋予一个新对象会给这个新对象增加数据劫持
function GS(options = {}) {
    this.$options = options;//将所有属性挂载到了$options上
    var data = this._data = this.$options.data;
    //拿到数据以后，开始观察data，每一个数据都劫持
    observe(data)
    // 把data的值挂到this上去,就可以直接通过this.xx调用数据了
    //this代理了_data,即为  数据代理
    for(let key in data){
        Object.defineProperty(this,key,{
            enumerable:true,
            // configurable:true,
            get() {
                return this._data[key];//相当于this.a = this._data.a
                },
            set(newVal) {
                this._data[key] = newVal;
                //this[key]没法直接更改，所以通过this._data[key]，调用Oberve，相当于修改this.data.a
            }
        })
    }
    // 传递dom元素过来，然后在传递当前的实例
    new compile(options.el,this)
}
// 编译
function compile(el,vm) {
    //将dom元素挂载到实例的$el上面
   vm.$el = document.querySelector(el);
   let fragment = document.createDocumentFragment();
    // DocumentFragments 是DOM节点。它们不是主DOM树的一部分。
    // 通常的用例是创建文档片段，将元素附加到文档片段，然后将文档片段附加到DOM树。
    // 在DOM树中，文档片段被其所有的子元素所代替。
    // 因为文档片段存在于内存中，并不在DOM树中，
    // 所以将子元素插入到文档片段时不会引起页面回流（对元素位置和几何上的计算）。因此，使用文档片段通常会带来更好的性能
   while (child = vm.$el.firstChild){//将app中的内容挨个全部添加到内存中
       fragment.appendChild(child)
   }
   replace(fragment)
   function replace(fragment) {
       Array.from(fragment.childNodes).forEach(node=>{//匹配dom中的双花括号，然后做内容替换，暂时不做数组的

           let text = node.textContent;//节点的内容
           let reg = /\{\{(.*)\}\}/;//匹配的正则
           if(node.nodeType == 3 && reg.test(text)){//代表元素或属性中的文本内容,且匹配到双花括号
               let arr = RegExp.$1.split('.');//匹配到第一个花括号中的值，以点进行分割为数组
               // RegExp 是javascript中的一个内置对象。为正则表达式。
               // RegExp.$1是RegExp的一个属性,指的是与正则表达式匹配的第一个 子匹配(以括号为标志)字符串，
               // 以此类推，RegExp.$2，RegExp.$3，..RegExp.$99总共可以有99个匹配
               let val = vm;
               arr.forEach(key=>{
                   val = val[key];//等于不断地翻下一层
               })
               // 替换内容
               node.textContent = text.replace(/\{\{(.*)\}\}/,val);
           }
           if(node.childNodes){//如果还有层级，再走一遍，递归
               replace(node);
           }
       })
   }
   // 把做好的文档切片重新添加进去
    vm.$el.appendChild(fragment);
}
function Observe(data) {//写主要逻辑
    for(let key in data){//把data通过Object.defineProperty的方式定义属性
        let val = data[key];//不能直接用data[key],不然会无限调用get和set，导致报堆栈溢出的错
        observe(data[key])
        //猜想可能return data[key]相当于在浏览器中输入gs._data.a
        Object.defineProperty(data,key,{
            enumerable:true,
            // configurable:true,
            get() {
                return val;
            },
            set(newVal) {
                if(val === newVal)return;
                val = newVal;
                // 如果给予新的值，也应该有get 和 set
                observe(val)
            }
        })
    }

}
//如果是对象嵌套对象，多层需要递归，写外面更方便看
function observe(data) {
    if(typeof data !=='object')return
    return new Observe(data)
}