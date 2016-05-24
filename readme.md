# 介绍

> 本插件需要引入touchpage.css和touchpage.js两个文件，确保加载的样式能够正确
> 有左右切页功能，每一页可以看做不同的网页，需要放到各自的容器里
> 有下拉刷新功能，通过设置refresh = yes注册下拉刷新事件，

# 使用
> 设置XtoY,设置手指在一开始滑动的瞬间划过的水平距离比上垂直距离  小于这个要求页面才能动
> 设置YtoX,下拉刷新可开始滑动的水平垂直滑动比例  越小越灵活
> currentPageSign是页面导航条下面的红线，传值的话类似其他传dom元素方法，

# 回调函数注意
> startLoadingDate有三个值，start的时候，则是在滑动一开始的时候就会执行下个页面的方法（如ajax请求）；
> end的时候， 则是在滑动结束的时候就会执行下个页面的方法（如ajax请求）；
> null将不会执行callback里面的方法

>>callback里面的值的方法名字必须是page0，page1和页面的索引一一对应，顺序可以乱

# 必须
> 本插件不会监听数据（ajax）请求什么时候完毕。所以如果注册了下拉刷新事件，请在完成的地方加上touched.pagecomplete = true；

# 自定义下拉刷新加载样式条
> customLoading是一个对象，里面包含四个内置对象方法， 
> （所有的方法里都有两个参数，需要加进度条的当前页所对应的dom结构$self, 当前页索引$nowPage，这两个参数都是假定是实际值,,最后将样式条$self.insertBefore(loadingview, $self.firstChild);加在当前页内容的第一个子元素之前） 
>> start，加载条起始状态
>> loading，加载条正在加载状态
>> success， 数据请求成功执行方法  里面可以设置个touched.status来判断请求返回的状态码，设置相应的提示，成功还是失败
>> fail，数据请求失败执行方法