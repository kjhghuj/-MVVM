 // 一定是先订阅，再发布
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
 function Watcher(fn){//创建一个监听器，在Vue中给每个数据都提供一个监听器,Vue会做一系列预判，来尽量减少Watcher的执行
    this.fn = fn
 }
 Watcher.prototype.updata = function () {//执行这个监听传入的东西
    this.fn();
 }
 let watcher = new Watcher(()=>{//随便声明一个watcher的实例，测测
     console.log(1);
 })

 let dep = new Dep();

 dep.addSub(watcher);//将watcher 放到了数组中
 dep.addSub(watcher);//将watcher 放到了数组中 +1
 dep.addSub(watcher);//将watcher 放到了数组中 +2
 //多放几个
 //然后执行发布
 dep.notify();//输出三个1
 // 逻辑：监听数据的变化，调用updata方法更新视图