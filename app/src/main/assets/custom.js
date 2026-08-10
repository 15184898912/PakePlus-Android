window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});//安全版：仅用户手动点击下载按钮触发，避免循环扫描闪退
document.addEventListener('click', function (e) {
    const downloadBtn = e.target.closest('[type="button"],button,a');
    if (!downloadBtn) return;
    setTimeout(() => {
        console.log("用户触发下载");
    },300);
},true);
//取消自动捕获video，防止死循环崩溃