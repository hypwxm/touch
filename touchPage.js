//其他辅助工具

$ = ready = window.ready = function (fn) {
    if (document.addEventListener) {//兼容非IE
        document.addEventListener("DOMContentLoaded", function () {
            //注销事件，避免反复触发
            //多次调用会导致这个方法多次触发，所以在每次调用结束，就取消掉。
            document.removeEventListener("DOMContentLoaded", arguments.callee, false);
            fn();//调用参数函数
        }, false);
    } else if (document.attachEvent) {//兼容IE
        document.attachEvent("onreadystatechange", function () {
            if (document.readyState === "complete") {
                document.detachEvent("onreadystatechange", arguments.callee);
                fn();
            }
        });
    }
};

function makeArray(obj) {
    if (!obj || obj.length === 0) {
        return []
    }
    if (!obj.length) {
        return obj;
    }
    try {
        return [].slice.call(obj);
    } catch (e) {
        var i = 0;
        var j = obj.length;
        var a = [];
        for (; i < j; i++) {
            a.push(obj[i])
        }
        return a;
    }
}

//dom选择器

function $$(selector) {
    "use strict";
    var arg = makeArray(arguments);
    var newArr = [];
    if (!document.querySelector(selector)) {
        return false;
    } else if (document.querySelectorAll(selector).length === 1) {
        if (arg[1] != true) {
            return document.querySelector(selector);
        } else if (arg[1] == true) {
            newArr.push(document.querySelector(selector));

            return newArr;
        }
    } else {
        return Array.prototype.slice.call(document.querySelectorAll(selector));
    }
}

//后面所说的正常情况是在页面原来静止时触发的滑动事件
//在页面滑动过程中再次触发为特殊事件


//存放全局变量
var touched = {};

function touchEvent(options) {
    //options是传入的参数，用对象的方式传进去

    //options.goNextPageDistance设置在正常情况下滑动距离为多少时，触发事件，默认为1
    if (options.goNextPageDistance == undefined || options.goNextPageDistance == null) {
        options.goNextPageDistance = 80;
    }

    //options.goNextPageDistanceInSlide，触发事件，默认为
    if (options.goNextPageDistanceInSlide == undefined || options.goNextPageDistanceInSlide == null) {
        options.goNextPageDistanceInSlide = 140;
    }

    //options.goNextPageDistanceInSlide，触发事件，默认为200
    if (options.touchLonForSlideStart == undefined || options.touchLonForSlideStart == null) {
        options.touchLonForSlideStart = 40;
    }

    //options.XtoY，触发事件，默认为200
    if (options.XtoY == undefined || options.XtoY == null) {
        options.XtoY = 6;
    }

    //判断是否要执行回调
    if(options.startLoadingDate == null) {
        options.callback = {};
    }

    //这里存已经执行过的页面的方法，如果执行过了，滑动页面就不执行了。
    var loadedpage = [];

    function doneCallback(donepage) {
        //设置属性表示页面开始加载
        touched.pagecomplete = false;
        //请在页面相应的位置设置touched.pagecomplete = true用来监测页面加载完毕；

        var allDone = options.callback;
        //如果有执行过方法，some方法就会返回true；
        var havenLoad = loadedpage.some(function(ele) {
            return ele == "page" + donepage;
        });
        if(!havenLoad) {
            for(var key in allDone) {
                if(key == ("page" + donepage)) {
                    allDone[key]();
                    loadedpage.push("page" + donepage);
                }
            }
        }
    }


    var viewport = $$(options.slidePage);
    var viewbox = $$(options.viewbox);
    var viewboxWidth = viewbox.clientWidth;
    var tabbox = $$(options.tabbox);

    //页面可视区的宽度
    //var maxWidth = window.innerWidth || document.documentElement.clientWidth;
    //可视区的高度
    var viewHeight = document.documentElement.clientHeight;
    var pageview = $$(options.pageview);
    var navpage = $$(options.slideNavBar);
    var tabbar = $$(options.slideNavBarParent);
    var tabboxwidth = tabbox.clientWidth;
    var touchContainer = $$(options.touchContainer);
    touchContainer.style.height = viewHeight + "px";


    var ifFresh = 0;
    //当前页面或者将要进行到的页面的索引，初始值为0；
    var nowPage = 0;
    //总共有多少页，
    var pagelen = pageview.length;

    for (var i = 0; i < pagelen; i++) {
        pageview[i].setAttribute("page", i);
        pageview[i].setAttribute("isPage", "isPage");
        navpage[i].setAttribute("page", i);
        navpage[i].setAttribute("isNav", "isNav");
        if(navpage[i].children.length != 0) {
            for(var x = 0, lenx = navpage[i].children.length; x < lenx; x++) {
                navpage[i].children[x].setAttribute("page", i);
                navpage[i].children[x].setAttribute("isNav", "isNav");
            }
        }
    }

    //滑动页面的css样式属性在js里面设置，，
    viewport.style.cssText = "height: 100%;position:relative;left: 0;top: 0;display: -webkit-box;overflow: hidden; -webkit-transform: translate3d(0,0,0);transform: translate3d(0,0,0); -webkit-transition: all 0s; transition: all 0s;";
    viewport.style.width = viewboxWidth * pageview.length + "px";

    pageview.forEach(function (ele) {
        ele.style.height = touchContainer.clientHeight + "px";
        //设置每页的宽度为设置的滑动区域的宽度的，不一定全屏
        ele.style.width = viewboxWidth + "px";
    });

    //计算第n个导航的左边距
    function calLeftDistance(pageN) {
        if (pageN > pagelen) {
            pageN = pagelen + 1;
        }
        var pageNLeftWidth = 0;
        for (var i = 0; i < pageN - 1; i++) {
            pageNLeftWidth += navpage[i].clientWidth;
        }
        return pageNLeftWidth;
    }



    //scrollLeft动画
    function scrollLeftAnimation(element, distance, direction, duration, step) {
        //element["scrollLfet"] < distance
        //console.log(element[direction] < distance);
        var time = duration/distance;

        var scrolltimer;

        if(direction == "left") {
            scrolltimer = setInterval(function() {
                if(element.scrollLeft < distance) {
                    //console.log(element[direction],",",distance)
                    element.scrollLeft = element.scrollLeft + step;
                } else {
                    element.scrollLeft = distance;
                    clearInterval(scrolltimer)
                }

            }, time);
        } else if (direction == "right") {
            scrolltimer = setInterval(function() {
                if(element.scrollLeft > distance) {
                    console.log(element.scrollLeft,",",distance);
                    element.scrollLeft = element.scrollLeft - step;
                } else {
                    element.scrollLeft = distance;
                    clearInterval(scrolltimer)
                }

            }, time);
        }


    }

    //给导航和页面加个第几页的索引
    //顺便计算导航所有的加起来的长度
    var navpageAllWidth = calLeftDistance(pagelen + 1);

    //导航条的总宽
    tabbar.style.width = navpageAllWidth + "px";

    //获取元素的style的translate
    function getTranslate(style) {
        return parseFloat(style.split("translate3d(")[1].split(")")[0].split(",")[0]);
    }

    //设置一个导航上的滑动可视视图,原来是在页面里面自己写，这里改为如果用户没设置这个值则由js生成
    if (options.slidebar == undefined || options.slidebar == "" || options.slidebar == null) {
        var slidebarLook = document.createElement("span");
        slidebarLook.className = "slidebar";
        tabbar.appendChild(slidebarLook);
        slidebarLook.style.cssText = "position:absolute;background:#ff0000;height:2px;";
        slidebarLook.style.cssText += "bottom:0;left:0;transform:translate3d(0,0,0); -webkit-transition: all 0.3s;";
        slidebarLook.style.cssText += " -webkit-transition-timing-function: linear;";
        slidebarLook.style.cssText += "transform: translate3d(0,0,0);transition: all 0.3s;transition-timing-function: linear;";
        var slidebar = $$(".slidebar");
    } else {
        slidebar = $$(options.currentPageSign);
    }
    var slidebarlon = navpage[0].clientWidth;
    slidebar.style.width = slidebarlon + "px";

    //获取滑动范围所在的区域坐标范围，导航的整体布局位置是不能动的，
    //保存的是页面一进来所在位置的值，目的就是获取一进来的位置，后面不要重新获取
    var viewboxdis = viewbox.getBoundingClientRect();
    var viewboxTopInfirst = viewboxdis.top;
    //获取导航所在的区域坐标范围，导航的整体布局位置是不能动的，
    var slidebardis = tabbox.getBoundingClientRect();

////////************监听事件的注册************//////
//注册触摸事件
//触摸事件后，touched对象会保存四个值
// {
//      spanX:触摸的起始水平坐标（相对于body）,
//      spanY:触摸的起始垂直坐标（相对于body），
//      moveX:水平手指划过距离，
//      moveY:垂直手指划过距离，
//  }

    

//注册触摸开始事件

    function touchS(event) {

        //在手势拖动时不能有动画过度时间的设置，要在touchend事件里触发，即拖动结束zai touchstart事件里要设置为0
        viewport.style.TransitionDuration = "0s";
        viewport.style.WebkitTransitionDuration = "0s";

        //这个属性是用来每次滑动时，在touchmove里面判断是要要进行滑动的判断的判断次数，touchmove实时触发，所以在外面加个值，是哪个setTimeout只执行一次
        touched.ifmove = 0;
        ifFresh = 0;
        //获取当前点击也的索引，，后面没用到，换了种方法，
        //如果用的这个索引，在切换途中快速点击页面，切换的效果会乱，因为点击时重新计算了点击的那一夜是哪一页，而且点击的话，移动距离会很小，
        //由于判定问题会走到另一个if语句里去
        //页面进来肯定是默认的第一页，所以一进来就设置了一个  nowpage = 0； 滑动时对nowpage进行++--
        //touched.index = parseInt(pageview[nowPage].getAttribute("page"));
        //获取屏幕的触点个数
        var touches = event.targetTouches.length;

        //单点触控，多点不管了。
        if (touches == 1) {
            var mytouch = event.targetTouches[0];

            //下一次触摸事件之前，会在touched事件里面保存上一次的滑动距离，为了在其他的作用域里面可以调用这个值
            //每次触摸事件发生前，这个值都要清0，，touchend事件用完这个值之后，上一次的就没用了。
            //所以也可以在touchend事件里面清0
            touched.moveX = 0;
            touched.moveY = 0;

            touched.refreshX = 0;
            touched.refreshY = 0;

            //刷新的时候页面下滑的距离是手指滑动的y距离，减去本已存在的上边距这里将上边距保存起来
            var refreshpagetop = pageview[nowPage].querySelector(options.pagecontainer).getBoundingClientRect().top;
            if(refreshpagetop > 0 && refreshpagetop <= viewboxTopInfirst) {
                touched.refreshprevtoplon = Math.abs(viewboxTopInfirst - Math.abs(refreshpagetop));
            } else if(refreshpagetop < 0) {
                touched.refreshprevtoplon = Math.abs(viewboxTopInfirst + Math.abs(refreshpagetop));
            } else {
                touched.refreshprevtoplon = -(viewboxTopInfirst + Math.abs(refreshpagetop));
            }




            //求触摸开始的水平和垂直坐标，，这个是相对于body的，，，相对于可视区可以用clientX  ，clientY
            var spanX = mytouch.clientX;
            var spanY = mytouch.clientY;


            //这里是如果滑动的操作时绑定在document上，要判断手指所在的范围是不是在要滑动的元素的位置
            //直接绑定在元素上，就不用判断了
            viewbox.addEventListener("touchmove", touchM, false);


            //注册下拉刷新的滑动事件
            if(options.refresh == "yes") {
                var needrefreshpage = pageview[nowPage].querySelector(options.pagecontainer);
                if(touched.prevPage) {
                    pageview[touched.prevPage].querySelector(options.pagecontainer).removeEventListener("touchmove", slideDownRefresh, false);
                }

                //只有在手指滑动时候，这个页面能达到最顶部才会注册下拉刷新事件
                if(viewHeight - mytouch.clientY > -needrefreshpage.getBoundingClientRect().top && needrefreshpage.getBoundingClientRect().top <= viewboxTopInfirst) {
                    needrefreshpage.addEventListener("touchmove", slideDownRefresh, false);
                } else if (needrefreshpage.getBoundingClientRect().top > viewboxTopInfirst) {
                    needrefreshpage.removeEventListener("touchmove", slideDownRefresh, false);
                    needrefreshpage.removeEventListener("touchend", touchRefreshEnd, false);
                    needrefreshpage.addEventListener("touchmove", ifPreventDefault, false);
                } else {
                    needrefreshpage.removeEventListener("touchmove", slideDownRefresh, false);
                }
            }


            //viewbox.addEventListener("touchend", touchOver, false);
            /*if (spanX > viewboxdis.left && spanX < viewboxdis.right && spanY > viewboxdis.top && spanY < viewboxdis.bottom) {
                viewbox.addEventListener("touchmove", touchM, false);
                viewbox.addEventListener("touchend", touchOver, false);
            } else {
                viewbox.removeEventListener("touchmove", ifPreventDefault, false);
                viewbox.removeEventListener("touchmove", touchM, false);
                viewbox.removeEventListener("touchend", touchOver, false);

                //必须return
                return;
            }*/


            //将触摸的开始位置保存到对象里，在touchmove事件触发的时候可以调用，，作用域的问题，
            touched.spanX = spanX;
            touched.spanY = spanY;

            //每次触发开始前，都要获取之前元素的translate属性，要知道之前滑过多少距离，后面的滑动距离要在前面的基础上进行
            //可以用cssText获取，
            //viewportstyle   是页面的滑动属性
            //slidebarstyle   是导航的滑动属性
            var viewportstyle = viewport.getAttribute("style");
            var slidebarstyle = slidebar.getAttribute("style");

            //第一次触摸时style里面可能没有translate属性，所以加个判断
            if (viewportstyle.indexOf("translate") > -1) {

                //用的是拆分字符串获取，这里最好改成 用正则表达式获取，，，写不来。。。
                //获取了，页面和导航已经划过的距离
                touched.prevMove = getTranslate(viewportstyle);
                touched.prevslidebar = getTranslate(slidebarstyle);
            } else {

                //如果没有translate属性，也就是第一次画的时候，直接设置，之前划过的距离为0就行，这一步为了，touchmove的时候容易处理
                //必须设置这个属性
                //页面和导航的初始滑动距离
                touched.prevMove = 0;
                touched.prevslidebar = 0;
            }

            //下面这个是在touchend事件之后，页面开始滑动的过程中，手指如果触摸到了滑动区域，
            //然后获取手指触摸时，滑动的整个区域 viewport 的左边距离页面可视区左边的距离，，以防万一，用下parseFloat转成浮点数，用于数学计算
            //保存到touched对象里面
            touched.boundleft = parseFloat(viewport.getBoundingClientRect().left);

            //计算tabbar的getBoundingClientRect的left属性
            var tarbarboundleft = tabbar.getBoundingClientRect().left;

            //计算slidebar滑动块的getBoundingClientRect的left属性
            var slidebarboundleft = slidebar.getBoundingClientRect().left;


            //对滑动区域的距离左边的距离和每页的宽度进行求模，，如果是0，说明触摸是在上一次滑动已经结束，页面回复正常，下一次滑动还没开始。那么就按正常的滑动事件处理
            //如果这个模数不为0，说明触摸是在touchend事件之后，页面还在滑动，那么触摸就要定在当前位置，，这里如果读取translate属性的水平偏移量会是每页要滑动到的最后位置的值，所以没用
            //所以要获取左边距，然后赋给translate属性
            //console.log(slidebar.getBoundingClientRect().left);
            if (touched.boundleft % viewboxWidth != 0) {
                viewport.style.transform = "translate3d(" + touched.boundleft + "px, 0, 0)";
                slidebar.style.transform = "translate3d(" + (slidebarboundleft - tarbarboundleft) + "px, 0, 0)";
                console.log(slidebar.getBoundingClientRect().left);
                //如果是在页面滑动中触摸，设置一个属性判定是这个状态
                touched.touchBroken = true;
                //document.addEventListener("touchend", touchOver, false);
            }
        }
         
    }


    //下拉刷新
    function slideDownRefresh(event) {

        var self = this;
        var touches = event.targetTouches.length;
        //console.log(self)
        self.style.WebkitTransitionDuration = "0s";

        //手指触摸的是要滑动的地方，如果触摸的是导航就不会进行这步
        if (touches == 1) {
            //event.preventDefault();
            var mytouch = event.targetTouches[0];
            var goX = mytouch.clientX;
            var goY = mytouch.clientY;

            //手指划过的位移，
            touched.refreshX = goX - touched.spanX;
            touched.refreshY = goY - touched.spanY;


            //类似腾讯新闻的释放刷新更多
            function refreshMore($self, $nowPage) {
                if($self.querySelector(".loadingview")) return;
                console.log($self.innerHTML)
                var loadingview = document.createElement("div");
                loadingview.className = "loadingview loadingview" + $nowPage;
                loadingview.innerHTML = "释放加载更多数据";
                //loadingview.style.cssText = "position:absolute;width:100%;height:50px;left:0;top:0;background:#cdcdcd;"
                $self.insertBefore(loadingview, $self.firstChild);
            }


            //控制页面下拉刷新，，，这里要用到viewboxTopInFirst，这是页面一进来就保存的viewbox的上边框，只有页面到达这个位置在下拉的时候才会触发刷新页面
            //this代指当前页面pageview
            var refreshgo = function() {

                //下拉刷新的时候页面会被拉下去一部分，这个时候再下拉，不能从顶部重新开始，要从当前位置开始
                var refreshHavenTop = self.getBoundingClientRect().top - viewboxTopInfirst;
                self.style.transform = "translate3d(0px," + (touched.refreshY - touched.refreshprevtoplon) / 3 + "px,0)";
                self.style.WebkitTransform = "translate3d(0px," + (touched.refreshY - touched.refreshprevtoplon) / 3 + "px,0)";
            };
            ifFresh++;

            //只在开始滑动的时候判断滑动的距离是否满足,满足就注册事件，
            if(ifFresh == 1) {
                if(Math.abs(touched.refreshY) / Math.abs(touched.refreshX) < options.YtoX) {
                    self.removeEventListener("touchmove", slideDownRefresh, false);
                    self.removeEventListener("touchmove", ifPreventDefault, false);
                    self.removeEventListener("touchend", touchRefreshEnd, false);
                    return;
                } else {
                    if(options.iscustomLoading == "yes") {
                        //自定义加载条的开始状态
                        options.customLoading["start"](self, nowPage)
                    } else {
                        refreshMore(self, nowPage); 
                    }
                    
                }
            }
            console.log(touched.refreshX,"====",touched.refreshY);
            //self.innerHTML = self.innerHTML + self.getBoundingClientRect().top + ",<br>" + touched.refreshY;
            //console.log(self.getBoundingClientRect().top,"dadw====wdad",viewboxTopInfirst);

            //获得当前页面的顶部距离可视区顶部的距离
            var newrefreshtoplon = self.getBoundingClientRect().top;

            //如果页面在未注册滑动touchend事件的过程中，顶部的距离小于初始位置的值（未在页面初始位置），就移除或者不注册touchend
            //加第二个判断是如果页面下拉刷新过了，在回到页面顶部，往上滑的时候，无法取消ifPreventDefault的注册，导致页面无法滑动，，因为这里不会执行refreshgo函数
            if (newrefreshtoplon < viewboxTopInfirst || (touched.refreshY < touched.refreshprevtoplon && !self.querySelector(".loadingview"))) {
                //self.innerHTML = self.innerHTML + "<br>hahahahah";
                self.style.cssText = self.style.cssText.replace("transform", "");
                self.removeEventListener("touchend", touchRefreshEnd, false);
                self.removeEventListener("touchmove", ifPreventDefault, false);
                return;
            } else if (touched.refreshY >= 0) {

                //这里要满足滑动距离大于0；并且，滑动的位置是初始位置开始的才能注册下面事件，，
                // 因为上面那个判断里面加了newrefreshtoplon < viewboxTopInfirst这个判断，并且不满足会return，所以这里不用判断了。
                self.addEventListener("touchmove", ifPreventDefault, false);
                self.addEventListener("touchend", touchRefreshEnd, false);
                refreshgo();
            }

        }

    }

    //touch控制
    //触摸move事件触发

    function touchM(event) {
        var touches = event.targetTouches.length;

        //手指触摸的是要滑动的地方，如果触摸的是导航就不会进行这步
        if (touches == 1) {
            //event.preventDefault();
            var mytouch = event.targetTouches[0];
            var goX = mytouch.clientX;
            var goY = mytouch.clientY;

            //手指划过的位移，
            touched.moveX = goX - touched.spanX;
            touched.moveY = goY - touched.spanY;

            //首页和最后一页跨越边界时控制动画的而移动距离与手指移动距离成比例proportion
            function unlikeTouchControl(proportion, nextpage) {
                if(typeof proportion == "undefined") {
                    proportion = 1;
                }
                //console.log(typeof proportion);
                viewport.style.WebkitTransform = "translate3d(" + (touched.prevMove + touched.moveX/proportion) + "px, 0, 0)";

                touched.prevslidebarlon = navpage[nowPage].clientWidth;
                slidebarlon = navpage[nextpage].clientWidth;
                if (Math.abs(touched.moveX) > options.goNextPageDistance) {
                    slidebar.style.width = slidebarlon + "px";
                }
                slidebar.style.WebkitTransform = "translate3d(" + (touched.prevslidebar - (touched.moveX / viewboxWidth) * touched.prevslidebarlon/proportion) + "px, 0, 0)";
            }
            //水平位移大于垂直位移，，并且垂直位移的总距离达到规定页面才会跟着手指动
            var moveThanCanbeMove = function() {
                if (Math.abs(touched.moveX) > options.touchLonForSlideStart) {
                    //viewport.style.WebkitTransform = "translate3d(" + (touched.prevMove + touched.moveX) + "px, 0, 0)";
                    var nextpage = Number();
                    if (touched.moveX > 0) {
                        if (nowPage <= 0) {
                            nextpage = 0;
                            unlikeTouchControl(5, nextpage)
                        } else {
                            nextpage = nowPage - 1;
                            unlikeTouchControl(1, nextpage);
                        }
                    } else if (touched.moveX < 0) {
                        if (nowPage >= pagelen - 1) {
                            nextpage = pagelen - 1;
                            unlikeTouchControl(5, nextpage)
                        } else {
                            nextpage = nowPage + 1;
                            unlikeTouchControl(1, nextpage)
                        }
                    }

                    if(touched.ifmove == 4) {
                        //进行到了下一页，执行这一页的要执行的方法，比如ajax请求
                        if(options.startLoadingDate == "start" || typeof options.startLoadingDate == undefined) {
                            console.log(nextpage);
                            doneCallback(nextpage);
                        }
                    }
                }
                
            };

            touched.ifmove++;

            //touchmove多次触发，但下面的方面执行一次就够了。
            if (touched.ifmove == 1) {

                //获取总导航的左边距
                var tabbarstyle = tabbar.getAttribute("style");
                var needgopre = 0;
                if (tabbarstyle.indexOf("translate3d") > -1) {
                    needgopre = getTranslate(tabbarstyle);
                } else {
                    needgopre = 0;
                }

                //设置一个合适的比例控制能够滑动的条件
                if (Math.abs(touched.moveX) / Math.abs(touched.moveY) < options.XtoY && touched.touchBroken != true) {
                    console.log("remove");
                    viewbox.removeEventListener("touchmove", touchM, false);
                    viewbox.removeEventListener("touchmove", ifPreventDefault, false);
                    viewbox.removeEventListener("touchend", touchOver, false);
                    return;
                } else {
                    console.log(touched.touchBroken);
                    viewbox.addEventListener("touchmove", ifPreventDefault, false);
                    //viewbox.addEventListener("touchmove", moveThanCanbeMove, false);
                    viewbox.addEventListener("touchend", touchOver, false);
                    if(options.refresh == "yes") {
                        pageview[nowPage].querySelector(options.pagecontainer).removeEventListener("touchmove", slideDownRefresh, false);
                    }

                    //滑动的时候判断一下下一个页面的导航是否在规定区域内
                    //已开始滑就进行判断

                    //这里控制的是整个导航条的移动
                    if (touched.moveX < 0) {
                        if (nowPage > pagelen - 2) return;
                        if (navpage[nowPage + 1].getBoundingClientRect().right > tabboxwidth) {
                            console.log(touched.prevslidebar - navpage[nowPage - 1].clientWidth);
                            var needgowidth = navpage[nowPage + 1].getBoundingClientRect().right - tabboxwidth;
                            //tabbar.style.transform = "translate3d(" + (needgopre - needgowidth) + "px,0,0)";
                            //console.log(tabbox.scollLeft, "left")
                            scrollLeftAnimation(tabbox, tabbox.scrollLeft + needgowidth, "left", 100, 2);
                            //tabbox.scrollLeft = tabbox.scrollLeft + needgowidth;
                            tabbar.style.WebkitTransition = "all 0.3s";
                            tabbar.style.transition = "all 0.3s";
                        }

                    } else if (touched.moveX > 0) {
                        if (nowPage < 1) return;
                        if (navpage[nowPage - 1].getBoundingClientRect().left < 0) {
                            //console.log(tabbar.getBoundingClientRect().left, "*-*-*-", navpage[nowPage - 1].getBoundingClientRect().left)
                            //tabbar.style.transform = "translate3d(" + (tabbar.getBoundingClientRect().left - navpage[nowPage - 1].getBoundingClientRect().left) + "px,0,0)";
                            //console.log(tabbar.getBoundingClientRect().left - navpage[nowPage - 1].getBoundingClientRect().left)
                            //tabbox.scrollLeft = -(tabbar.getBoundingClientRect().left - navpage[nowPage - 1].getBoundingClientRect().left);
                            var needleft = -(tabbar.getBoundingClientRect().left - navpage[nowPage - 1].getBoundingClientRect().left);
                            scrollLeftAnimation(tabbox, needleft, "right", 100, 2);
                            tabbar.style.WebkitTransition = "all 0.3s";
                            tabbar.style.transition = "all 0.3s";
                        }
                    }
                }

            }

            //先判断能不能滑，能滑了再给加滑动的效果
            moveThanCanbeMove();
        }


    }

    //下拉刷新的touchend事件
    function touchRefreshEnd() {
        var nowpagecontainer = pageview[nowPage].querySelector(options.pagecontainer);

        //设置nowpagecontainer的最后所在位置
        function containerStop(positionY) {
            nowpagecontainer.style.transform = "translate3d(0px," + positionY + "px,0px)";
            nowpagecontainer.style.WebkitTransform = "translate3d(0px," + positionY + "px,0px)";
            nowpagecontainer.style.WebkitTransitionDuration = "0.3s";
            nowpagecontainer.style.WebkitTransitionTimingFunction = "linear";
        }

        if(nowpagecontainer.getBoundingClientRect().top > 50 + viewboxTopInfirst) {
            //设置加载条的样式
            if(options.iscustomLoading == "yes") {
                console.log("loding");
                options.customLoading["loading"](nowpagecontainer, nowPage)
            } else {
                nowpagecontainer.querySelector(".loadingview").innerHTML = "正在加载数据。。。";
            }

            //加载条的高度

            if(nowpagecontainer.querySelector(".loadingview")) {
                var loadingHeight = nowpagecontainer.querySelector(".loadingview").clientHeight;
                containerStop(loadingHeight);
            } else {
                containerStop(0);
            }

            loadedpage = loadedpage.filter(function(page) {
                return page.substring(4, page.length) != nowPage;
            });
            doneCallback(nowPage);
            var i = 0;

            //这里加个闭包，创建独立作用域
            ;-function(nowpagecontainer, nowPage) {
                var observation = setInterval(function() {
                    i++;
                    if(i > 400) {
                        clearInterval(observation);
                        if(options.iscustomLoading == "yes") {
                            options.customLoading["fail"](nowpagecontainer, nowPage);
                        } else {
                            nowpagecontainer.querySelector(".loadingview").innerHTML = "加载数据失败";
                            setTimeout(function() {
                                containerStop(0);
                                nowpagecontainer.removeChild($$(".loadingview" + nowPage));
                            }, 1000);
                        }

                        return;
                    }
                    console.log("loading");
                    console.log("pagecomplete", touched.pagecomplete);
                    if(touched.pagecomplete != undefined) {
                        if(touched.pagecomplete == true) {
                            clearInterval(observation);
                            if(options.iscustomLoading == "yes") {
                                options.customLoading["success"](nowpagecontainer, nowPage);
                            } else {
                                nowpagecontainer.querySelector(".loadingview").innerHTML = "加载数据成功";
                                setTimeout(function() {
                                    containerStop(0);
                                    nowpagecontainer.removeChild($$(".loadingview" + nowPage));
                                }, 1000);
                            }


                        }
                    }

                }, 50)
            }(nowpagecontainer, nowPage);

        } else {
            nowpagecontainer.style.transform = "translate3d(0px,0px,0px)";
            nowpagecontainer.style.WebkitTransform = "translate3d(0px,0px,0px)";
            nowpagecontainer.style.WebkitTransitionDuration = "0.3s";
            nowpagecontainer.style.WebkitTransitionTimingFunction = "linear";
            nowpagecontainer.removeEventListener("touchmove", ifPreventDefault, false);
        }
        
    }


    function touchOver() {
        //在手势拖动时不能有动画过度时间的设置，要在touchend事件里触发，即拖动结束zai touchstart事件里要设置为0
        viewport.style.TransitionDuration = "0.3s";
        viewport.style.WebkitTransitionDuration = "0.3s";

        //如果是最后一页，而且touchmove事件是往下一页滑的话，touchend的时候要将页面恢复到最后一页的正确位置，回弹
        if (touched.moveX < 0 && nowPage == (pagelen - 1)) {
            viewport.style.WebkitTransform = "translate3d(-" + ((nowPage) * viewboxWidth) + "px, 0, 0)";
            slidebar.style.WebkitTransform = "translate3d(" + (navpageAllWidth - touched.prevslidebarlon) + "px, 0, 0)";

            //保存这次滑动到的页面的前一页
            touched.prevPage = pagelen - 1;

        } else if (touched.moveX > 0 && nowPage == 0) {

            //这是第一页往前滑
            viewport.style.WebkitTransform = "translate3d(0, 0, 0)";
            slidebar.style.WebkitTransform = "translate3d(0, 0, 0)";

            //保存这次滑动到的页面的前一页
            touched.prevPage = 0;

        } else {
            //上述两种情况以外。
            if (touched.boundleft % viewboxWidth == 0) {
                ///这里是原来页面已经静止了，开始的滑动，正常的处理就行，
                //这是的是滑动距离大于100，才会滑到下一页

                endInnerpageControl(options.goNextPageDistance);

            } else if (touched.touchBroken == true) {
                //console.log(options.goNextPageDistanceInSlide)
                //如果是在页面滑动的过程中再次触发了触摸，前面设置一个一个属性来判断这个状态
                //这个状态为true时，，那么模数为0的状态肯定就不满足了，就会跑到这里，

                //为了防止下次正常的触摸不会跑到这个判断里，，要把这个状态赋值为false；
                touched.touchBroken = false;
                endInnerpageControl(options.goNextPageDistanceInSlide);
            }

        }
    }

    //正常和特殊情况是一样处理的，但是我想传不同的滑动距离要求进去，所以分开写
    function endInnerpageControl(distance) {
        //滑动的逻辑一样，就是要滑动到第几页的判断不同
        if (touched.moveX > distance) {
            nowPage--;
            if (nowPage <= 0) {
                nowPage = 0;
            }

            viewport.style.WebkitTransform = "translate3d(-" + (nowPage * viewboxWidth) + "px, 0, 0)";
            //导航线的位置所计算的左边其实是你要前进到的那一页的前面几页的宽度和，所以要在当前页的page上再减一页
            //前面虽然有page--，但是和这里的nowpage-1没关系

            //正常情况下  页面往前移了一页了，
            //下同
            slidebar.style.WebkitTransform = "translate3d(" + (calLeftDistance(nowPage + 1)) + "px, 0, 0)";

            touched.prevPage = nowPage + 1;
        } else if (touched.moveX < -distance) {
            nowPage++;
            if (nowPage >= pagelen - 1) {
                nowPage = pagelen - 1;
            }
            viewport.style.WebkitTransform = "translate3d(-" + (nowPage * viewboxWidth) + "px, 0, 0)";
            slidebar.style.WebkitTransform = "translate3d(" + (calLeftDistance(nowPage + 1)) + "px, 0, 0)";

            touched.prevPage = nowPage - 1;
        } else {
            viewport.style.WebkitTransform = "translate3d(-" + (nowPage * viewboxWidth) + "px, 0, 0)";
            slidebar.style.WebkitTransform = "translate3d(" + (calLeftDistance(nowPage + 1)) + "px, 0, 0)";
        }

        slidebar.style.width = navpage[nowPage].clientWidth + "px";
        //进行到了下一页，执行这一页的要执行的方法，比如ajax请求
        if(options.startLoadingDate == "end") {
            //console.log(nextpage)
            doneCallback(nowPage);
        }

    }


    //添加监听事件，监听touch事件
    //阻止和开启，touch事件的默认行为
    function ifPreventDefault(event) {
        event.preventDefault();
    }

    //导航点击切换页面事件
    document.addEventListener("click", function (event) {
        var target = event.target;
        console.log(options.slideNavBar);
        if (target.getAttribute("isNav") == "isNav") {
            nowPage = parseInt(target.getAttribute("page"));
            console.log(nowPage);
            clickNav_PagegoAndBarlineGo(nowPage);
        }
    });


    function clickNav_PagegoAndBarlineGo(nowPage) {
        var newslidebarlon = navpage[nowPage].clientWidth;
        viewport.style.WebkitTransform = "translate3d(-" + (nowPage * viewboxWidth) + "px, 0, 0)";
        viewport.style.transition = "all 0.3s";
        slidebar.style.WebkitTransform = "translate3d(" + (calLeftDistance(nowPage + 1)) + "px, 0, 0)";
        slidebar.style.width = newslidebarlon + "px";
    }

    //返回给调用者的一个监听方法，，只返回这个就行了。
    //进来默认执行第一页的方法
    doneCallback("0")
    return viewbox.addEventListener("touchstart", touchS, false);
}
