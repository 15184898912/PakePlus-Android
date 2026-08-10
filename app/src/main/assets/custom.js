window.addEventListener("DOMContentLoaded",()=>{const t=document.createElement("script");t.src="https://www.googletagmanager.com/gtag/js?id=G-W5GKHM0893",t.async=!0,document.head.appendChild(t);const n=document.createElement("script");n.textContent="window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-W5GKHM0893');",document.body.appendChild(n)});// 强制视频下载保存到系统相册，适配安卓13‑14
document.addEventListener('click',function(e){
  let target = e.target;
  // 捕获视频、下载按钮
  if(target.tagName==="BUTTON" || target.tagName==="A" || target.closest('button') || target.closest('a')){
    setTimeout(()=>{
      let videos = document.querySelectorAll("video");
      videos.forEach(vid=>{
        if(vid.src && vid.src.startsWith('http')){
          saveVideoToGallery(vid.src);
        }
      })
    },800);
  }
})

function saveVideoToGallery(url){
  try{
    const a = document.createElement('a');
    a.href = url;
    a.download = "zhuge_ai_video.mp4";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(err){
    console.log("下载触发异常",err);
  }
}

// 开启webview存储读写权限声明
if(window.Android){
  window.Android.requestStoragePermission();
}