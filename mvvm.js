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
           if(node.nodeType === 3 && reg.test(text)){//node.nodeType == 3 代表元素或属性中的文本内容,且匹配到双花括号
               let arr = RegExp.$1.split('.');//匹配到第一个花括号中的值，以点进行分割为数组
               // RegExp 是javascript中的一个内置对象。为正则表达式。
               // RegExp.$1是RegExp的一个属性,指的是与正则表达式匹配的第一个 子匹配(以括号为标志)字符串，
               // 以此类推，RegExp.$2，RegExp.$3，..RegExp.$99总共可以有99个匹配
               let val = vm;
               arr.forEach(key=>{
                   val = val[key];//等于不断地翻下一层
               })
               new Watcher(vm,RegExp.$1,function(newVal){
                   node.textContent = text.replace(/\{\{(.*)\}\}/,newVal);
               })
               // 替换内容
               node.textContent = text.replace(/\{\{(.*)\}\}/,val);
           }
           if(node.nodeType === 1){//node.nodeType == 1代表是元素
                let nodeAttrs = node.attributes;//获取当前元素的所有属性，为一个对象，有索引
               // 可用Array.form来将它转换成数组
               Array.from(nodeAttrs).forEach(Attrs=>{
                   let name = Attrs.name;//取出属性名
                   let exp = Attrs.value;//值就是v-model后面绑定的数据的名字
                   if(name.indexOf('v-') == 0){//如果第一个为v-说明是vue指令
                        // 这里只有model就不再做判断了
                       let val = vm[exp];
                       if(exp.indexOf('.') != -1){
                           val = vm;
                           // val = vm[exp.split('.')[0]]
                           exp.split('.').forEach(function(item,index){
                               // if(index == exp.split('.').length - 1)return
                               val = val[item];
                           })
                       }
                       node.value = val;//将数据的值给到元素
                       // val = vm[exp];
                   }
                   // 到这已经把值赋进去了，然后还需要订阅发布
                   new Watcher(vm,exp,function(newValue){
                       node.value = newValue;//当watcher触发视，会自动将最新的值给到元素
                   })
                   //当输入框的值变动是，也要把值给更新了
                   node.addEventListener('input',function(e){
                       let newValue = e.target.value;//取出元素中的值
                       if(exp.indexOf('.') != -1){
                           function EdiObjValue(obj, target, editName) {
                               for (var prop in obj) {
                                   if (obj.hasOwnProperty(prop)) {
                                       if (obj[prop] == target) {
                                           obj[prop] = editName;
                                       }
                                       if (Object.prototype.toString.call(obj[prop]) == '[object Object]') {
                                           EdiObjValue(obj[prop], target, editName)
                                       }
                                   }
                               }
                           }
                           let oldValue = vm;
                           exp.split('.').forEach(function(item,index){
                               oldValue = oldValue[item]
                           })
                           EdiObjValue(vm,oldValue,newValue)
                       }else{
                           vm[exp] = newValue;//实例中的值给更新成元素中的值，同时触发set方法，set方法触发notify更新元素的值
                       }
                   })
               })
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
    let dep = new Dep();
    for(let key in data){//把data通过Object.defineProperty的方式定义属性
        let val = data[key];//不能直接用data[key],不然会无限调用get和set，导致报堆栈溢出的错
        observe(data[key])
        //猜想可能return data[key]相当于在浏览器中输入gs._data.a
        Object.defineProperty(data,key,{
            enumerable:true,
            // configurable:true,
            get() {//取值的时候
                // a&& b :如果执行a后返回true，则执行b并返回b的值；如果执行a后返回false，则整个表达式返回a的值，b不执行
                Dep.target && dep.addSub(Dep.target)//[watcher]
                return val;
            },
            set(newVal) {//更改值的时候
                if(val === newVal)return;
                val = newVal;
                // 如果给予新的值，也应该有get 和 set
                observe(val);
                dep.notify();//然watcher的updata方法执行
            }
        })
    }

}
//如果是对象嵌套对象，多层需要递归，写外面更方便看
function observe(data) {
    if(typeof data !=='object')return
    return new Observe(data)
}
// 订阅发布  连接数据与视图
function Dep() {//
    this.Subs = [];
}
Dep.prototype.addSub = function (Sub) {
    this.Subs.push(Sub)
}

Dep.prototype.notify = function () {
    this.Subs.forEach(sub=>{//依次遍历数组中的更新函数达到更新的目的
        sub.updata()
    })
}
// Watcher是一个类，通过这个类创建的实例都拥有updata方法
function Watcher(vm,exp,fn){//创建一个监听器，在Vue中给每个数据都提供一个监听器,Vue会做一系列预判，来尽量减少Watcher的执行
    this.fn = fn;//挂载方便调用，下面同理
    this.vm = vm;
    this.exp = exp;
    Dep.target = this;//将watcher装进去，方便取值触发get的时候使用addSub添加
    // 给每个数据加监听，如果没有下面的，那么只有最后一个数据有监听功能
    let arr = exp.split('.');
    let val = vm;
    arr.forEach(key=>{
        val = val[key];//这步操作会取值，调用get方法，然后在get方法里，添加watcher监听器
    })
    // 添加完后，置空
    Dep.target = null;
}
Watcher.prototype.updata = function () {//执行这个监听传入的东西
    let val = this.vm;
    let arr = this.exp.split('.');
    arr.forEach(key=>{
        val = val[key];//等于不断地翻下一层
    })
    //val取到最新的值
    this.fn(val);
}