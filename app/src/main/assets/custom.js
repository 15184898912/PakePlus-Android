window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});(function(){
    console.log("视频下载防闪退拦截已生效");
    // 拦截所有a标签下载点击
    document.addEventListener('click', function(e){
        let target = e.target;
        // 向上查找可点击的链接/按钮
        while(target && target !== document){
            let tag = target.tagName.toLowerCase();
            // 命中下载链接、按钮、视频元素
            if(tag === 'a' || tag === 'button' || tag === 'video'){
                let url = tag==='a' ? target.href : (target.src || target.getAttribute('data-url'));
                if(url && (url.endsWith('.mp4') || url.includes('video') || url.includes('.m3u8'))){
                    // 强制阻止App内原生下载逻辑
                    e.preventDefault();
                    e.stopPropagation();
                    e.cancelBubble = true;
                    // 调用系统浏览器打开外链，脱离App沙箱
                    window.open(url, '_system');
                    return false;
                }
            }
            target = target.parentElement;
        }
    }, true);

    // 额外拦截页面原生download属性强制下载
    document.addEventListener('download',function(e){
        e.preventDefault();
        return false;
    },true);
})();