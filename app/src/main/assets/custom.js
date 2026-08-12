window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// PakePlus 拦截视频保存，跳转系统浏览器兜底，解决安卓保存视频闪退
(function(){
    console.log("视频保存防闪退脚本已加载");

    // 获取真实视频url，过滤blob、空链接
    function getRealVideoUrl(target){
        // 1.点击的是video标签
        if(target.tagName === "VIDEO"){
            return target.currentSrc || target.src;
        }
        // 2.a标签下载按钮 <a download>
        if(target.tagName === "A"){
            const href = target.href;
            if(href && (href.endsWith('.mp4') || href.endsWith('.m3u8') || href.includes('.mp4'))){
                return href;
            }
        }
        // 向上冒泡找父级video/a/下载按钮
        let el = target;
        for(let i=0;i<15;i++){
            if(!el) break;
            if(el.tagName === "VIDEO"){
                return el.currentSrc || el.src;
            }
            if(el.tagName === "A"){
                const href = el.href;
                if(href && (href.endsWith('.mp4') || href.endsWith('.m3u8') || href.includes('.mp4'))){
                    return href;
                }
            }
            el = el.parentNode;
        }
        return null;
    }

    // 拦截所有点击事件
    document.addEventListener("click",function(e){
        const url = getRealVideoUrl(e.target);
        if(!url) return;

        // blob本地视频不处理
        if(url.startsWith("blob:") || url.startsWith("javascript:")){
            return;
        }

        // 阻止原本网页直接下载保存的逻辑（闪退根源）
        e.preventDefault();
        e.stopPropagation();

        console.log("拦截视频保存，跳转系统浏览器：",url);
        // _system 唤起手机外部浏览器打开视频
        window.open(url,"_system");

    },true);

})();