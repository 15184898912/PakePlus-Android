/**
 * 颐安堂 - 会员端视图组件
 * 包含18个会员端Vue 3组件，注册到 YA.views
 */
(function () {
  'use strict';

  var ref = Vue.ref;
  var reactive = Vue.reactive;
  var computed = Vue.computed;
  var onMounted = Vue.onMounted;
  var onActivated = Vue.onActivated;
  var watch = Vue.watch;
  var nextTick = Vue.nextTick;

  var useRouter = VueRouter.useRouter;
  var useRoute = VueRouter.useRoute;

  var showToast = Vant.showToast;
  var showConfirmDialog = Vant.showConfirmDialog;
  var showSuccessToast = Vant.showSuccessToast;
  var showLoadingToast = Vant.showLoadingToast;

  var U = YA.utils;
  var ST = YA.statusText;
  var DS = YA.dataService;
  var Auth = YA.authService;
  var QR = YA.qrService;
  var EC = YA.components.EmptyState;

  YA.views = YA.views || {};

  /* ========== 注入样式 ========== */
  var styleEl = document.createElement('style');
  styleEl.textContent = [
    /* MemberLayout */
    '.v-ml{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    /* MemberLogin */
    '.v-mlg{position:relative;width:100%;min-height:100vh;min-height:100dvh;overflow:hidden}',
    '.v-mlg .bg-gradient{position:absolute;inset:0;background:linear-gradient(180deg,#8a5a2b 0%,#6b3e1a 40%,#4a2e16 70%,#3a2412 100%);z-index:0}',
    '.v-mlg .bg-radial{position:absolute;top:0;left:50%;transform:translateX(-50%);width:120%;height:50%;background:radial-gradient(ellipse at center,rgba(212,160,23,0.12) 0%,transparent 60%);z-index:0}',
    '.v-mlg .login-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:0 32px;padding-top:calc(12vh + var(--ya-safe-top))}',
    '.v-mlg .brand-section{display:flex;flex-direction:column;align-items:center;margin-bottom:48px}',
    '.v-mlg .logo-circle{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d4a017 0%,#e0b020 50%,#c89510 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(212,160,23,0.4),inset 0 2px 8px rgba(255,255,255,0.2);margin-bottom:16px}',
    '.v-mlg .brand-name{font-size:28px;font-weight:800;color:#d4a017;letter-spacing:6px;text-indent:6px;text-shadow:0 2px 12px rgba(212,160,23,0.3);margin:0}',
    '.v-mlg .brand-slogan{font-size:14px;color:rgba(255,255,255,0.6);margin-top:8px;letter-spacing:2px}',
    '.v-mlg .form-section{width:100%;max-width:320px}',
    '.v-mlg .input-group{display:flex;align-items:center;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:12px;border:1px solid rgba(255,255,255,0.1);height:52px;margin-bottom:16px;padding:0 16px}',
    '.v-mlg .input-icon{display:flex;align-items:center;margin-right:12px;flex-shrink:0}',
    '.v-mlg .input-field{flex:1;background:transparent;color:#fff;font-size:16px;height:100%}',
    '.v-mlg .input-field::placeholder{color:rgba(255,255,255,0.4)}',
    '.v-mlg .login-btn{width:100%;height:48px;background:linear-gradient(135deg,#d4a017,#e0b020);color:#fff;border:none;border-radius:24px;font-size:17px;font-weight:600;letter-spacing:4px;cursor:pointer;transition:opacity 0.2s;margin-top:8px}',
    '.v-mlg .login-btn:active{opacity:0.85}',
    '.v-mlg .login-btn:disabled{opacity:0.6}',
    '.v-mlg .bottom-link{text-align:center;margin-top:24px;font-size:14px;color:rgba(255,255,255,0.6);cursor:pointer}',
    '.v-mlg .link-text{color:#d4a017;font-weight:600}',
    /* MemberRegister */
    '.v-mrg{position:relative;width:100%;min-height:100vh;min-height:100dvh;overflow:hidden}',
    '.v-mrg .bg-gradient{position:absolute;inset:0;background:linear-gradient(180deg,#8a5a2b 0%,#6b3e1a 40%,#4a2e16 70%,#3a2412 100%);z-index:0}',
    '.v-mrg .bg-radial{position:absolute;top:0;left:50%;transform:translateX(-50%);width:120%;height:45%;background:radial-gradient(ellipse at center,rgba(212,160,23,0.12) 0%,transparent 60%);z-index:0}',
    '.v-mrg .register-content{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;padding:0 32px;padding-top:calc(8vh + var(--ya-safe-top));padding-bottom:calc(24px + var(--ya-safe-bottom));overflow-y:auto;min-height:100vh;min-height:100dvh}',
    '.v-mrg .brand-section{display:flex;flex-direction:column;align-items:center;margin-bottom:32px}',
    '.v-mrg .logo-circle{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#d4a017 0%,#e0b020 50%,#c89510 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 40px rgba(212,160,23,0.4),inset 0 2px 8px rgba(255,255,255,0.2);margin-bottom:12px}',
    '.v-mrg .brand-name{font-size:26px;font-weight:800;color:#d4a017;letter-spacing:6px;text-indent:6px;text-shadow:0 2px 12px rgba(212,160,23,0.3);margin:0}',
    '.v-mrg .brand-slogan{font-size:14px;color:rgba(255,255,255,0.6);margin-top:6px;letter-spacing:2px}',
    '.v-mrg .form-section{width:100%;max-width:320px}',
    '.v-mrg .input-group{display:flex;align-items:center;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:12px;border:1px solid rgba(255,255,255,0.1);height:50px;margin-bottom:14px;padding:0 16px}',
    '.v-mrg .input-icon{display:flex;align-items:center;margin-right:12px;flex-shrink:0}',
    '.v-mrg .input-field{flex:1;background:transparent;color:#fff;font-size:15px;height:100%}',
    '.v-mrg .input-field::placeholder{color:rgba(255,255,255,0.4)}',
    '.v-mrg .input-group-code{padding-right:8px}',
    '.v-mrg .code-btn{flex-shrink:0;color:#d4a017;font-size:13px;font-weight:600;white-space:nowrap;padding:6px 10px;cursor:pointer}',
    '.v-mrg .register-btn{width:100%;height:48px;background:linear-gradient(135deg,#d4a017,#e0b020);color:#fff;border:none;border-radius:24px;font-size:17px;font-weight:600;letter-spacing:4px;cursor:pointer;transition:opacity 0.2s;margin-top:8px}',
    '.v-mrg .register-btn:active{opacity:0.85}',
    '.v-mrg .register-btn:disabled{opacity:0.6}',
    '.v-mrg .bottom-link{text-align:center;margin-top:20px;font-size:14px;color:rgba(255,255,255,0.6);cursor:pointer}',
    '.v-mrg .link-text{color:#d4a017;font-weight:600}',
    /* MemberHome */
    '.v-mh{background:#faf6f0}',
    '.v-mh .member-card{position:relative;background:linear-gradient(135deg,#8a5a2b 0%,#6b3e1a 50%,#4a2e16 100%);padding:calc(20px + var(--ya-safe-top)) 16px 24px;overflow:hidden}',
    '.v-mh .bg-pattern{position:absolute;top:-20px;right:-20px;width:160px;height:160px;background:radial-gradient(circle,rgba(212,160,23,0.1) 0%,transparent 70%);pointer-events:none}',
    '.v-mh .member-info{position:relative;display:flex;align-items:center;cursor:pointer}',
    '.v-mh .avatar-wrap{flex-shrink:0;margin-right:14px}',
    '.v-mh .avatar{width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(212,160,23,0.5)}',
    '.v-mh .avatar-default{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#d4a017,#e0b020);color:#fff;font-size:24px;font-weight:600}',
    '.v-mh .member-detail{flex:1}',
    '.v-mh .member-name-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}',
    '.v-mh .member-name{font-size:18px;font-weight:600;color:#fff}',
    '.v-mh .member-tag{display:inline-flex;align-items:center;padding:1px 8px;border-radius:4px;font-size:11px;line-height:1.6}',
    '.v-mh .member-stats{display:flex;align-items:center}',
    '.v-mh .stat-item{display:flex;flex-direction:column}',
    '.v-mh .stat-label{font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:2px}',
    '.v-mh .stat-value{font-size:16px;font-weight:600;color:#d4a017}',
    '.v-mh .stat-divider{width:1px;height:28px;background:rgba(255,255,255,0.15);margin:0 16px}',
    '.v-mh .arrow-icon{flex-shrink:0;padding-left:8px}',
    '.v-mh .section{padding:0 16px;margin-top:12px}',
    '.v-mh .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:0 0 2px}',
    '.v-mh .section-title{font-size:16px;font-weight:600;color:#3a2412}',
    '.v-mh .section-more{font-size:13px;color:#999}',
    '.v-mh .grid-list{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;background:#fff;border-radius:16px;padding:20px 12px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mh .grid-item{display:flex;flex-direction:column;align-items:center;cursor:pointer}',
    '.v-mh .grid-item:active{opacity:0.7}',
    '.v-mh .grid-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;box-shadow:0 4px 10px rgba(0,0,0,0.1)}',
    '.v-mh .grid-text{font-size:13px;color:#3a2412}',
    '.v-mh .notice-bar{border-radius:12px;overflow:hidden}',
    '.v-mh .apt-item{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f5f0ea}',
    '.v-mh .apt-item:last-child{border-bottom:none}',
    '.v-mh .apt-info{flex:1}',
    '.v-mh .apt-name{font-size:15px;font-weight:500;color:#3a2412;margin-bottom:4px}',
    '.v-mh .apt-time{font-size:13px;color:#999}',
    '.v-mh .apt-status{font-size:12px;padding:2px 8px;border-radius:4px}',
    '.v-mh .project-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}',
    '.v-mh .project-card{flex-shrink:0;width:140px;background:#fff;border-radius:12px;padding:16px 12px;box-shadow:0 2px 8px rgba(58,36,18,0.04);cursor:pointer}',
    '.v-mh .project-card:active{opacity:0.85}',
    '.v-mh .project-img{width:56px;height:56px;border-radius:12px;background:rgba(212,160,23,0.08);display:flex;align-items:center;justify-content:center;margin-bottom:10px}',
    '.v-mh .project-name{font-size:15px;font-weight:600;color:#3a2412;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.v-mh .project-desc{font-size:12px;color:#999;line-height:1.5;margin-bottom:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;height:36px}',
    '.v-mh .project-bottom{display:flex;align-items:center;justify-content:space-between}',
    '.v-mh .project-price{font-size:16px;font-weight:700;color:#c0532a}',
    '.v-mh .project-duration{font-size:11px;color:#999}',
    /* MemberMall */
    '.v-mm{background:#faf6f0}',
    '.v-mm .header{background:#fff;position:sticky;top:0;z-index:10;box-shadow:0 1px 4px rgba(58,36,18,0.04)}',
    '.v-mm .mall-list-wrap{padding:12px 16px}',
    '.v-mm .gift-list{display:flex;flex-direction:column;gap:12px}',
    '.v-mm .gift-card{display:flex;align-items:center;background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 8px rgba(58,36,18,0.04);cursor:pointer}',
    '.v-mm .gift-card:active{opacity:0.85}',
    '.v-mm .gift-img{width:64px;height:64px;border-radius:12px;background:rgba(212,160,23,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px}',
    '.v-mm .gift-info{flex:1;min-width:0}',
    '.v-mm .gift-name{font-size:15px;font-weight:600;color:#3a2412;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.v-mm .gift-desc{font-size:12px;color:#999;margin-bottom:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.v-mm .gift-bottom{display:flex;align-items:center;justify-content:space-between}',
    '.v-mm .gift-cost{display:flex;align-items:baseline}',
    '.v-mm .cost-value{font-size:17px;font-weight:700;color:#c0532a}',
    '.v-mm .cost-unit{font-size:12px;color:#c0532a;margin-left:2px}',
    '.v-mm .gift-stock{font-size:12px;color:#999}',
    '.v-mm .stock-low{color:#ee0a24}',
    '.v-mm .gift-arrow{flex-shrink:0;padding-left:8px}',
    /* MemberMine */
    '.v-mmi{background:#faf6f0}',
    '.v-mmi .member-header{position:relative;background:linear-gradient(135deg,#8a5a2b 0%,#6b3e1a 50%,#4a2e16 100%);padding:calc(24px + var(--ya-safe-top)) 16px 0;overflow:hidden}',
    '.v-mmi .bg-pattern{position:absolute;top:-30px;right:-30px;width:180px;height:180px;background:radial-gradient(circle,rgba(212,160,23,0.1) 0%,transparent 70%);pointer-events:none}',
    '.v-mmi .member-top{position:relative;display:flex;align-items:center;padding-bottom:20px}',
    '.v-mmi .avatar-wrap{flex-shrink:0;margin-right:16px;cursor:pointer}',
    '.v-mmi .avatar{width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(212,160,23,0.5)}',
    '.v-mmi .avatar-default{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#d4a017,#e0b020);color:#fff;font-size:28px;font-weight:600}',
    '.v-mmi .member-info{flex:1}',
    '.v-mmi .member-name-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}',
    '.v-mmi .member-name{font-size:20px;font-weight:600;color:#fff}',
    '.v-mmi .member-tag{display:inline-flex;align-items:center;padding:1px 8px;border-radius:4px;font-size:11px;line-height:1.6}',
    '.v-mmi .member-phone{font-size:14px;color:rgba(255,255,255,0.6)}',
    '.v-mmi .member-stats-bar{position:relative;display:flex;align-items:center;background:rgba(255,255,255,0.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:16px 16px 0 0;padding:16px 16px;margin:0 -16px}',
    '.v-mmi .stat-block{flex:1;text-align:center}',
    '.v-mmi .stat-block-divider{width:1px;height:32px;background:rgba(255,255,255,0.15)}',
    '.v-mmi .stat-value{font-size:20px;font-weight:700;color:#d4a017;margin-bottom:4px}',
    '.v-mmi .stat-label{font-size:12px;color:rgba(255,255,255,0.5)}',
    '.v-mmi .menu-section{background:#fff;margin:12px 16px 0;border-radius:14px;overflow:hidden;box-shadow:0 2px 8px rgba(58,36,18,0.04)}',
    '.v-mmi .menu-cell{padding:14px 16px;align-items:center}',
    '.v-mmi .menu-cell .van-cell__title{margin-left:12px;font-size:15px;color:#3a2412}',
    '.v-mmi .menu-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
    '.v-mmi .logout-section{padding:24px 16px 12px}',
    '.v-mmi .logout-btn{height:44px;font-size:16px;color:#c0532a;border:1px solid #f0ebe5;background:#fff}',
    '.v-mmi .version-text{text-align:center;font-size:12px;color:#ccc;padding-bottom:8px}',
    /* AppointmentBook */
    '.v-mab{min-height:100vh;min-height:100dvh;background:#faf6f0;display:flex;flex-direction:column}',
    '.v-mab .content{flex:1;padding-bottom:80px}',
    '.v-mab .form-section{padding:16px}',
    '.v-mab .section-title{font-size:16px;font-weight:600;color:#3a2412;margin-bottom:12px}',
    '.v-mab .section-hint{font-size:13px;color:#999;font-weight:400}',
    '.v-mab .loading-wrap{display:flex;justify-content:center;padding:20px 0}',
    '.v-mab .project-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}',
    '.v-mab .project-item{background:#fff;border:2px solid transparent;border-radius:12px;padding:14px 12px;text-align:center;cursor:pointer;transition:border-color 0.2s}',
    '.v-mab .project-item:active{opacity:0.85}',
    '.v-mab .project-item.active{border-color:#d4a017;background:rgba(212,160,23,0.04)}',
    '.v-mab .project-item-name{font-size:15px;font-weight:600;color:#3a2412;margin-bottom:6px}',
    '.v-mab .project-item-price{font-size:17px;font-weight:700;color:#c0532a;margin-bottom:2px}',
    '.v-mab .project-item-duration{font-size:12px;color:#999}',
    '.v-mab .cell-group{border-radius:12px;overflow:hidden}',
    '.v-mab .picker-cell{padding:14px 16px}',
    '.v-mab .cell-label{font-size:15px;color:#3a2412}',
    '.v-mab .picker-cell .van-cell__value{color:#6b4c2a}',
    '.v-mab .date-scroll{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}',
    '.v-mab .date-item{flex-shrink:0;width:60px;height:64px;background:#fff;border:2px solid transparent;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer}',
    '.v-mab .date-item:active{opacity:0.85}',
    '.v-mab .date-item.active{border-color:#d4a017;background:rgba(212,160,23,0.06)}',
    '.v-mab .date-weekday{font-size:12px;color:#999;margin-bottom:4px}',
    '.v-mab .date-item.active .date-weekday{color:#d4a017}',
    '.v-mab .date-day{font-size:15px;font-weight:600;color:#3a2412}',
    '.v-mab .time-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
    '.v-mab .time-item{height:40px;background:#fff;border:2px solid transparent;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#3a2412;cursor:pointer}',
    '.v-mab .time-item:active{opacity:0.85}',
    '.v-mab .time-item.active{border-color:#d4a017;background:rgba(212,160,23,0.06);color:#d4a017;font-weight:600}',
    '.v-mab .time-item.disabled{color:#ccc;background:#f5f0ea;cursor:not-allowed}',
    '.v-mab .notes-field{background:#fff;border-radius:12px;overflow:hidden}',
    '.v-mab .submit-bar{position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:#fff;box-shadow:0 -2px 8px rgba(58,36,18,0.06);z-index:100}',
    /* MyAppointments */
    '.v-mma{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mma .content{padding:12px 16px}',
    '.v-mma .apt-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(58,36,18,0.04)}',
    '.v-mma .apt-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f5f0ea}',
    '.v-mma .apt-project{font-size:17px;font-weight:600;color:#3a2412}',
    '.v-mma .apt-status{font-size:12px;padding:2px 10px;border-radius:4px}',
    '.v-mma .apt-card-body{margin-bottom:4px}',
    '.v-mma .apt-row{display:flex;align-items:flex-start;margin-bottom:8px}',
    '.v-mma .apt-label{width:70px;font-size:13px;color:#999;flex-shrink:0}',
    '.v-mma .apt-value{font-size:14px;color:#3a2412;flex:1}',
    '.v-mma .apt-card-footer{display:flex;justify-content:flex-end;padding-top:12px;border-top:1px solid #f5f0ea}',
    /* Consumption */
    '.v-mc{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mc .content{padding:12px 16px}',
    '.v-mc .order-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(58,36,18,0.04)}',
    '.v-mc .order-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f5f0ea}',
    '.v-mc .order-no{font-size:12px;color:#999}',
    '.v-mc .order-time{font-size:12px;color:#999}',
    '.v-mc .order-body{margin-bottom:12px}',
    '.v-mc .order-projects{font-size:15px;font-weight:500;color:#3a2412;line-height:1.6}',
    '.v-mc .order-footer{display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #f5f0ea}',
    '.v-mc .order-pay-info{display:flex;align-items:baseline;gap:8px}',
    '.v-mc .order-amount{font-size:18px;font-weight:700;color:#c0532a}',
    '.v-mc .order-pay-method{font-size:12px;color:#999}',
    '.v-mc .order-points{display:flex;align-items:center}',
    '.v-mc .points-tag{font-size:12px;color:#d4a017;background:rgba(212,160,23,0.1);padding:2px 8px;border-radius:4px}',
    /* MyPackages */
    '.v-mmp{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mmp .content{padding:12px 16px}',
    '.v-mmp .pkg-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(58,36,18,0.04)}',
    '.v-mmp .pkg-card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}',
    '.v-mmp .pkg-name{font-size:17px;font-weight:600;color:#3a2412}',
    '.v-mmp .pkg-status{font-size:12px;padding:2px 10px;border-radius:4px}',
    '.v-mmp .pkg-card-body{margin-bottom:4px}',
    '.v-mmp .pkg-stat-row{display:flex;align-items:center;background:#faf6f0;border-radius:10px;padding:14px 0;margin-bottom:8px}',
    '.v-mmp .pkg-stat{flex:1;text-align:center}',
    '.v-mmp .pkg-stat-divider{width:1px;height:32px;background:#e5dfd5}',
    '.v-mmp .pkg-stat-value{font-size:20px;font-weight:700;color:#3a2412;margin-bottom:4px}',
    '.v-mmp .pkg-stat-label{font-size:12px;color:#999}',
    '.v-mmp .pkg-source{font-size:12px;color:#999;padding:0 4px}',
    '.v-mmp .pkg-card-footer{display:flex;justify-content:flex-end;padding-top:12px;border-top:1px solid #f5f0ea}',
    '.v-mmp .text-danger{color:#ee0a24}',
    /* MemberRecharge */
    '.v-mr{min-height:100vh;min-height:100dvh;background:#faf6f0;display:flex;flex-direction:column}',
    '.v-mr .content{flex:1;padding:12px 16px 80px}',
    '.v-mr .balance-card{background:linear-gradient(135deg,#8a5a2b 0%,#6b3e1a 100%);border-radius:16px;padding:24px 20px;margin-bottom:20px}',
    '.v-mr .balance-label{font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:8px}',
    '.v-mr .balance-value{font-size:36px;font-weight:700;color:#d4a017;margin-bottom:8px}',
    '.v-mr .balance-points{font-size:13px;color:rgba(255,255,255,0.6)}',
    '.v-mr .section-title{font-size:16px;font-weight:600;color:#3a2412;margin-bottom:12px}',
    '.v-mr .loading-wrap{display:flex;justify-content:center;padding:20px 0}',
    '.v-mr .rule-list{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}',
    '.v-mr .rule-card{display:flex;align-items:center;background:#fff;border:2px solid transparent;border-radius:14px;padding:16px;box-shadow:0 2px 8px rgba(58,36,18,0.04);cursor:pointer}',
    '.v-mr .rule-card:active{opacity:0.85}',
    '.v-mr .rule-card.active{border-color:#d4a017;background:rgba(212,160,23,0.03)}',
    '.v-mr .rule-main{flex:1}',
    '.v-mr .rule-pay{display:flex;align-items:baseline;margin-bottom:8px}',
    '.v-mr .rule-pay-value{font-size:24px;font-weight:700;color:#c0532a}',
    '.v-mr .rule-pay-unit{font-size:14px;color:#c0532a;margin-left:2px}',
    '.v-mr .rule-gift-list{display:flex;flex-wrap:wrap;gap:8px}',
    '.v-mr .rule-gift-item{display:flex;align-items:center;gap:4px;font-size:12px;color:#6b4c2a;background:rgba(212,160,23,0.08);padding:3px 8px;border-radius:4px}',
    '.v-mr .gift-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#d4a017;color:#fff;font-size:10px;font-weight:600}',
    '.v-mr .rule-check{flex-shrink:0;padding-left:12px}',
    '.v-mr .check-circle{width:22px;height:22px;border-radius:50%;border:2px solid #ddd;display:flex;align-items:center;justify-content:center;transition:all 0.2s}',
    '.v-mr .check-circle.checked{border-color:#d4a017;background:#d4a017}',
    '.v-mr .tips-section{background:#fff;border-radius:12px;padding:16px}',
    '.v-mr .tips-title{font-size:14px;font-weight:600;color:#3a2412;margin-bottom:10px}',
    '.v-mr .tips-content{font-size:13px;color:#999;line-height:1.8}',
    '.v-mr .tips-content p{margin-bottom:4px}',
    '.v-mr .submit-bar{position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:#fff;box-shadow:0 -2px 8px rgba(58,36,18,0.06);z-index:100}',
    /* MemberInvite */
    '.v-mi{min-height:100vh;min-height:100dvh;background:#faf6f0;display:flex;flex-direction:column}',
    '.v-mi .content{flex:1;padding:12px 16px 80px}',
    '.v-mi .qr-section{background:#fff;border-radius:16px;padding:24px 20px;text-align:center;margin-bottom:16px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mi .qr-title{font-size:16px;font-weight:600;color:#3a2412;margin-bottom:16px}',
    '.v-mi .qr-wrap{display:flex;justify-content:center;margin-bottom:16px}',
    '.v-mi .qr-img{width:200px;height:200px;border-radius:12px;border:1px solid #f0ebe5}',
    '.v-mi .qr-loading{width:200px;height:200px;display:flex;align-items:center;justify-content:center;background:#faf6f0;border-radius:12px}',
    '.v-mi .invite-code-row{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px}',
    '.v-mi .invite-code-label{font-size:14px;color:#999}',
    '.v-mi .invite-code-value{font-size:20px;font-weight:700;color:#d4a017;letter-spacing:2px}',
    '.v-mi .copy-btn{font-size:12px;color:#d4a017;border:1px solid #d4a017;padding:2px 10px;border-radius:12px;cursor:pointer}',
    '.v-mi .qr-desc{font-size:13px;color:#999;line-height:1.6}',
    '.v-mi .stats-section{display:flex;align-items:center;background:#fff;border-radius:16px;padding:20px 0;margin-bottom:16px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mi .stat-block{flex:1;text-align:center}',
    '.v-mi .stat-divider{width:1px;height:36px;background:#f0ebe5}',
    '.v-mi .stat-value{font-size:20px;font-weight:700;color:#c0532a;margin-bottom:4px}',
    '.v-mi .stat-label{font-size:12px;color:#999}',
    '.v-mi .section-header{margin-bottom:12px}',
    '.v-mi .section-title{font-size:16px;font-weight:600;color:#3a2412}',
    '.v-mi .commission-list{display:flex;flex-direction:column;gap:10px}',
    '.v-mi .commission-item{display:flex;align-items:center;justify-content:space-between;background:#fff;border-radius:12px;padding:14px 16px;box-shadow:0 2px 8px rgba(58,36,18,0.04)}',
    '.v-mi .commission-info{flex:1}',
    '.v-mi .commission-type{font-size:15px;font-weight:500;color:#3a2412;margin-bottom:4px}',
    '.v-mi .commission-time{font-size:12px;color:#999}',
    '.v-mi .commission-right{text-align:right}',
    '.v-mi .commission-amount{font-size:16px;font-weight:700;color:#07c160;margin-bottom:4px}',
    '.v-mi .commission-status{font-size:11px;padding:1px 8px;border-radius:4px}',
    '.v-mi .submit-bar{position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:#fff;box-shadow:0 -2px 8px rgba(58,36,18,0.06);z-index:100}',
    '.v-mi .withdraw-popup{padding:20px 16px calc(20px + var(--ya-safe-bottom))}',
    '.v-mi .withdraw-title{font-size:18px;font-weight:600;color:#3a2412;text-align:center;margin-bottom:16px}',
    '.v-mi .withdraw-balance{font-size:14px;color:#6b4c2a;margin-bottom:16px;text-align:center}',
    '.v-mi .withdraw-input{margin-bottom:16px;border:1px solid #f0ebe5;border-radius:8px}',
    '.v-mi .withdraw-actions{display:flex;gap:12px}',
    /* DownloadQr */
    '.v-mdq{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mdq .content{padding:12px 16px}',
    '.v-mdq .qr-card{background:#fff;border-radius:16px;padding:32px 20px 24px;text-align:center;margin-bottom:16px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mdq .qr-title{font-size:18px;font-weight:600;color:#3a2412;margin-bottom:20px}',
    '.v-mdq .qr-wrap{display:flex;justify-content:center;margin-bottom:20px}',
    '.v-mdq .qr-img{width:220px;height:220px;border-radius:12px;border:1px solid #f0ebe5}',
    '.v-mdq .qr-loading{width:220px;height:220px;display:flex;align-items:center;justify-content:center;background:#faf6f0;border-radius:12px}',
    '.v-mdq .qr-tip{font-size:16px;font-weight:500;color:#3a2412;margin-bottom:8px}',
    '.v-mdq .qr-subtip{font-size:13px;color:#c0532a;line-height:1.6}',
    '.v-mdq .link-section{background:#fff;border-radius:16px;padding:16px 20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mdq .link-row{display:flex;flex-direction:column;margin-bottom:16px}',
    '.v-mdq .link-label{font-size:14px;color:#999;margin-bottom:6px}',
    '.v-mdq .link-url{font-size:13px;color:#6b4c2a;word-break:break-all;background:#faf6f0;padding:8px 12px;border-radius:8px}',
    '.v-mdq .actions{display:flex;flex-direction:column;gap:10px}',
    '.v-mdq .tips-section{background:#fff;border-radius:16px;padding:16px 20px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mdq .tips-title{font-size:14px;font-weight:600;color:#3a2412;margin-bottom:10px}',
    '.v-mdq .tips-content{font-size:13px;color:#999;line-height:1.8}',
    '.v-mdq .tips-content p{margin-bottom:4px}',
    /* ProfileEdit */
    '.v-mpe{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mpe .content{padding:12px 0}',
    '.v-mpe .avatar-section{display:flex;flex-direction:column;align-items:center;padding:20px 0 24px;cursor:pointer}',
    '.v-mpe .avatar-wrap{margin-bottom:8px}',
    '.v-mpe .avatar{width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(212,160,23,0.3)}',
    '.v-mpe .avatar-default{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#d4a017,#e0b020);color:#fff;font-size:32px;font-weight:600}',
    '.v-mpe .avatar-tip{font-size:13px;color:#999}',
    '.v-mpe .form-section{margin-top:4px}',
    '.v-mpe .form-group{border-radius:14px;overflow:hidden}',
    '.v-mpe .form-group .van-field{padding:14px 16px}',
    '.v-mpe .form-group .van-field__label{color:#3a2412;font-weight:500}',
    '.v-mpe .gender-field .van-radio-group{gap:20px}',
    '.v-mpe .gender-field .van-radio__label{color:#3a2412;font-size:14px;margin-left:4px}',
    '.v-mpe .save-section{padding:24px 16px}',
    /* GiftDetail */
    '.v-mgd{min-height:100vh;min-height:100dvh;background:#faf6f0;display:flex;flex-direction:column}',
    '.v-mgd .page-loading{display:flex;justify-content:center;padding:40px 0}',
    '.v-mgd .content{flex:1;padding:12px 16px 80px}',
    '.v-mgd .gift-img-section{background:#fff;border-radius:16px;padding:40px 20px;display:flex;justify-content:center;margin-bottom:12px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mgd .gift-img{width:120px;height:120px;border-radius:16px;background:rgba(212,160,23,0.06);display:flex;align-items:center;justify-content:center}',
    '.v-mgd .gift-info-card{background:#fff;border-radius:16px;padding:20px;margin-bottom:12px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mgd .gift-name{font-size:20px;font-weight:600;color:#3a2412;margin-bottom:12px}',
    '.v-mgd .gift-cost-row{display:flex;align-items:center;justify-content:space-between}',
    '.v-mgd .gift-cost{display:flex;align-items:baseline}',
    '.v-mgd .cost-value{font-size:24px;font-weight:700;color:#c0532a}',
    '.v-mgd .cost-unit{font-size:14px;color:#c0532a;margin-left:4px}',
    '.v-mgd .gift-stock{font-size:14px;color:#999}',
    '.v-mgd .stock-low{color:#ee0a24}',
    '.v-mgd .desc-card,.v-mgd .asset-card{background:#fff;border-radius:16px;padding:16px 20px;margin-bottom:12px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mgd .card-title{font-size:15px;font-weight:600;color:#3a2412;margin-bottom:10px}',
    '.v-mgd .card-content{font-size:14px;color:#6b4c2a;line-height:1.8}',
    '.v-mgd .asset-row{display:flex;gap:24px}',
    '.v-mgd .asset-item{display:flex;align-items:baseline;gap:6px}',
    '.v-mgd .asset-label{font-size:13px;color:#999}',
    '.v-mgd .asset-value{font-size:16px;font-weight:600;color:#3a2412}',
    '.v-mgd .asset-value.insufficient{color:#ee0a24}',
    '.v-mgd .submit-bar{position:fixed;bottom:0;left:0;right:0;padding:12px 16px;background:#fff;box-shadow:0 -2px 8px rgba(58,36,18,0.06);z-index:100}',
    /* OrderList */
    '.v-mol{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mol .content{padding:12px 16px}',
    '.v-mol .order-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(58,36,18,0.04)}',
    '.v-mol .order-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f5f0ea}',
    '.v-mol .order-gift-name{font-size:16px;font-weight:600;color:#3a2412}',
    '.v-mol .order-status{font-size:12px;padding:2px 10px;border-radius:4px}',
    '.v-mol .order-body{margin-bottom:4px}',
    '.v-mol .order-row{display:flex;align-items:center;margin-bottom:8px}',
    '.v-mol .order-label{width:70px;font-size:13px;color:#999}',
    '.v-mol .order-value{font-size:14px;color:#3a2412}',
    '.v-mol .order-footer{padding-top:12px;border-top:1px solid #f5f0ea}',
    '.v-mol .order-tip{font-size:13px;color:#c0532a}',
    /* MyQr */
    '.v-mqr{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-mqr .content{padding:16px}',
    '.v-mqr .qr-card{background:linear-gradient(135deg,#8a5a2b 0%,#6b3e1a 50%,#4a2e16 100%);border-radius:20px;padding:24px 20px;text-align:center;margin-bottom:16px;overflow:hidden;position:relative}',
    '.v-mqr .member-info-row{display:flex;align-items:center;margin-bottom:24px}',
    '.v-mqr .avatar-wrap{margin-right:14px}',
    '.v-mqr .avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(212,160,23,0.5)}',
    '.v-mqr .avatar-default{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#d4a017,#e0b020);color:#fff;font-size:22px;font-weight:600}',
    '.v-mqr .member-text{text-align:left}',
    '.v-mqr .member-name{font-size:18px;font-weight:600;color:#fff;margin-bottom:6px}',
    '.v-mqr .member-tag{display:inline-flex;align-items:center;padding:1px 8px;border-radius:4px;font-size:11px;line-height:1.6}',
    '.v-mqr .qr-wrap{display:flex;justify-content:center;margin-bottom:16px}',
    '.v-mqr .qr-img{width:220px;height:220px;border-radius:12px;background:#fff;padding:8px}',
    '.v-mqr .qr-loading{width:220px;height:220px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);border-radius:12px}',
    '.v-mqr .qr-tip{font-size:16px;font-weight:500;color:#fff;margin-bottom:8px}',
    '.v-mqr .qr-subtip{font-size:12px;color:rgba(255,255,255,0.5)}',
    '.v-mqr .info-card{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-mqr .info-card .van-cell{padding:14px 16px}',
    '.v-mqr .info-card .van-cell__title{color:#999;font-size:14px}',
    '.v-mqr .info-card .van-cell__value{color:#3a2412;font-size:15px;font-weight:500}',
    /* MemberAbout */
    '.v-ma{min-height:100vh;min-height:100dvh;background:#faf6f0}',
    '.v-ma .content{padding:16px 0}',
    '.v-ma .brand-section{display:flex;flex-direction:column;align-items:center;padding:32px 20px 28px}',
    '.v-ma .logo-circle{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#d4a017 0%,#e0b020 50%,#c89510 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(212,160,23,0.3),inset 0 2px 8px rgba(255,255,255,0.2);margin-bottom:16px}',
    '.v-ma .app-name{font-size:26px;font-weight:800;color:#3a2412;letter-spacing:4px;margin:0}',
    '.v-ma .app-slogan{font-size:13px;color:#999;margin-top:10px;text-align:center;line-height:1.6}',
    '.v-ma .app-version{font-size:13px;color:#d4a017;margin-top:12px;background:rgba(212,160,23,0.1);padding:4px 16px;border-radius:12px}',
    '.v-ma .info-section{margin-bottom:16px}',
    '.v-ma .info-group{border-radius:14px;overflow:hidden}',
    '.v-ma .info-group .van-cell{padding:14px 16px}',
    '.v-ma .info-group .van-cell__title{color:#6b4c2a;font-size:14px}',
    '.v-ma .info-group .van-cell__value{color:#3a2412;font-size:14px}',
    '.v-ma .tech-section{margin:0 16px 24px;background:#fff;border-radius:16px;padding:16px 20px;box-shadow:0 2px 12px rgba(58,36,18,0.06)}',
    '.v-ma .tech-title{font-size:15px;font-weight:600;color:#3a2412;margin-bottom:14px}',
    '.v-ma .tech-list{display:flex;flex-direction:column;gap:12px}',
    '.v-ma .tech-item{display:flex;align-items:center;justify-content:space-between}',
    '.v-ma .tech-label{font-size:14px;color:#999}',
    '.v-ma .tech-value{font-size:14px;color:#3a2412;font-weight:500}',
    '.v-ma .copyright{text-align:center;padding:20px 16px calc(24px + var(--ya-safe-bottom));font-size:13px;color:#ccc;line-height:1.8}',
    '.v-ma .copyright p{margin-bottom:4px}',
    '.v-ma .copyright-year{font-size:12px;color:#ddd}'
  ].join('\n');
  document.head.appendChild(styleEl);

  /* ========== 1. MemberLayout ========== */
  YA.views.MemberLayout = {
    setup: function () {
      return {};
    },
    template: [
      '<div class="v-ml member-layout">',
      '  <router-view v-slot="{ Component }">',
      '    <keep-alive>',
      '      <component :is="Component" />',
      '    </keep-alive>',
      '  </router-view>',
      '  <van-tabbar route active-color="#d4a017" inactive-color="#999" placeholder>',
      '    <van-tabbar-item to="/member/home" name="home">',
      '      <span>首页</span>',
      '      <template #icon="props">',
      '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="props.active ? \'#d4a017\' : \'#999\'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
      '          <polyline points="9 22 9 12 15 12 15 22"/>',
      '        </svg>',
      '      </template>',
      '    </van-tabbar-item>',
      '    <van-tabbar-item to="/member/mall" name="mall">',
      '      <span>商城</span>',
      '      <template #icon="props">',
      '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="props.active ? \'#d4a017\' : \'#999\'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>',
      '          <line x1="3" y1="6" x2="21" y2="6"/>',
      '          <path d="M16 10a4 4 0 0 1-8 0"/>',
      '        </svg>',
      '      </template>',
      '    </van-tabbar-item>',
      '    <van-tabbar-item to="/member/mine" name="mine">',
      '      <span>我的</span>',
      '      <template #icon="props">',
      '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="props.active ? \'#d4a017\' : \'#999\'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>',
      '          <circle cx="12" cy="7" r="4"/>',
      '        </svg>',
      '      </template>',
      '    </van-tabbar-item>',
      '  </van-tabbar>',
      '</div>'
    ].join('\n')
  };

  /* ========== 2. MemberLogin ========== */
  YA.views.MemberLogin = {
    setup: function () {
      var router = useRouter();
      var authStore = YA.stores.auth();

      var phone = ref('');
      var password = ref('');
      var loading = ref(false);

      function handleLogin() {
        if (!phone.value || phone.value.length !== 11) {
          showToast('请输入正确的手机号');
          return;
        }
        if (!password.value) {
          showToast('请输入密码');
          return;
        }
        loading.value = true;
        authStore.memberLogin(phone.value, password.value).then(function (result) {
          if (result.success) {
            showToast({ message: '登录成功', type: 'success' });
            setTimeout(function () { router.replace('/member/home'); }, 500);
          } else {
            showToast(result.message || '登录失败');
          }
        })['catch'](function () {
          showToast('登录失败，请重试');
        })['finally'](function () {
          loading.value = false;
        });
      }

      function goRegister() {
        router.push('/member/register');
      }

      return { phone: phone, password: password, loading: loading, handleLogin: handleLogin, goRegister: goRegister };
    },
    template: [
      '<div class="v-mlg">',
      '  <div class="bg-gradient"></div>',
      '  <div class="bg-radial"></div>',
      '  <div class="login-content">',
      '    <div class="brand-section">',
      '      <div class="logo-circle">',
      '        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M3 9l1-5h16l1 5"/><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M9 21V12h6v9"/><line x1="12" y1="12" x2="12" y2="21"/>',
      '        </svg>',
      '      </div>',
      '      <h1 class="brand-name">颐安堂</h1>',
      '      <p class="brand-slogan">会员登录</p>',
      '    </div>',
      '    <div class="form-section">',
      '      <div class="input-group">',
      '        <div class="input-icon">',
      '          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
      '          </svg>',
      '        </div>',
      '        <input v-model="phone" type="tel" maxlength="11" placeholder="请输入手机号" class="input-field" />',
      '      </div>',
      '      <div class="input-group">',
      '        <div class="input-icon">',
      '          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
      '          </svg>',
      '        </div>',
      '        <input v-model="password" type="password" placeholder="请输入密码" class="input-field" />',
      '      </div>',
      '      <button class="login-btn" :disabled="loading" @click="handleLogin">',
      '        <span v-if="!loading">登 录</span>',
      '        <span v-else>登录中...</span>',
      '      </button>',
      '      <div class="bottom-link" @click="goRegister">还没账号？<span class="link-text">去注册</span></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 16. OrderList ========== */
  YA.views.OrderList = {
    components: { EmptyState: EC },
    setup: function () {
      var authStore = YA.stores.auth();
      var mallStore = YA.stores.mall();

      var orders = ref([]);
      var gifts = ref([]);
      var refreshing = ref(false);

      function loadData() {
        return mallStore.fetchGifts().then(function () {
          gifts.value = mallStore.gifts;
          if (authStore.memberId) {
            return mallStore.getMemberOrders(authStore.memberId);
          }
          return [];
        }).then(function (list) {
          orders.value = (list || []).sort(function (a, b) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        });
      }

      function getGiftName(giftId) {
        var g = gifts.value.find(function (x) { return x.id === giftId; });
        return g ? g.name : '未知礼品';
      }

      function getStatusTagClass(status) {
        var map = { pending: 'tag-gold', redeemed: 'tag-green', cancelled: 'tag-gray' };
        return map[status] || 'tag-gray';
      }

      function onRefresh() { loadData().then(function () { refreshing.value = false; }); }

      onMounted(loadData);
      onActivated(loadData);

      return {
        orders: orders, refreshing: refreshing,
        formatMoney: U.formatMoney, formatDateTime: U.formatDateTime,
        redemptionStatusText: ST.redemption,
        getGiftName: getGiftName, getStatusTagClass: getStatusTagClass, onRefresh: onRefresh
      };
    },
    template: [
      '<div class="v-mol">',
      '  <van-nav-bar title="兑换订单" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">',
      '    <div class="content" v-if="orders.length > 0">',
      '      <div class="order-card" v-for="order in orders" :key="order.id">',
      '        <div class="order-header"><span class="order-gift-name">{{ getGiftName(order.gift_id) }}</span><span class="order-status" :class="getStatusTagClass(order.status)">{{ redemptionStatusText[order.status] }}</span></div>',
      '        <div class="order-body">',
      '          <div class="order-row"><span class="order-label">消耗</span><span class="order-value" v-if="order.cost_type === \'points\'">{{ order.cost_value }}积分</span><span class="order-value" v-else>¥{{ formatMoney(order.cost_value) }}</span></div>',
      '          <div class="order-row"><span class="order-label">兑换时间</span><span class="order-value">{{ formatDateTime(order.created_at) }}</span></div>',
      '        </div>',
      '        <div class="order-footer" v-if="order.status === \'pending\'"><span class="order-tip">请到店核销领取</span></div>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无兑换订单" />',
      '  </van-pull-refresh>',
      '</div>'
    ].join('\n')
  };

  /* ========== 17. MyQr ========== */
  YA.views.MyQr = {
    setup: function () {
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();

      var memberData = ref({});
      var qrDataUrl = ref('');

      var levelTagClass = computed(function () {
        return ST.memberLevelTag[memberData.value.level] || 'tag-gray';
      });

      function loadData() {
        if (authStore.memberId) {
          return memberStore.getById(authStore.memberId).then(function (m) {
            memberData.value = m || {};
            return QR.generateMemberQr(authStore.memberId);
          }).then(function (url) {
            qrDataUrl.value = url || '';
          });
        }
        return Promise.resolve();
      }

      onMounted(loadData);

      return {
        memberData: memberData, qrDataUrl: qrDataUrl, levelTagClass: levelTagClass,
        formatMoney: U.formatMoney, memberLevelText: ST.memberLevel
      };
    },
    template: [
      '<div class="v-mqr">',
      '  <van-nav-bar title="我的会员码" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="qr-card">',
      '      <div class="member-info-row">',
      '        <div class="avatar-wrap">',
      '          <img v-if="memberData.avatar" :src="memberData.avatar" class="avatar" alt="头像" />',
      '          <div v-else class="avatar avatar-default">{{ (memberData.name || \'会\').charAt(0) }}</div>',
      '        </div>',
      '        <div class="member-text">',
      '          <div class="member-name">{{ memberData.name || \'会员\' }}</div>',
      '          <span class="member-tag" :class="levelTagClass">{{ memberLevelText[memberData.level] || \'普通会员\' }}</span>',
      '        </div>',
      '      </div>',
      '      <div class="qr-wrap"><img v-if="qrDataUrl" :src="qrDataUrl" class="qr-img" alt="会员码" /><div v-else class="qr-loading"><van-loading size="32px" color="#d4a017">生成中...</van-loading></div></div>',
      '      <div class="qr-tip">出示此码供店员扫码识别</div>',
      '      <div class="qr-subtip">会员码每次打开会刷新，请在到店时重新生成</div>',
      '    </div>',
      '    <div class="info-card">',
      '      <van-cell-group :border="false">',
      '        <van-cell title="手机号" :value="memberData.phone || \'\'" />',
      '        <van-cell title="余额" :value="\'¥\' + formatMoney(memberData.balance)" />',
      '        <van-cell title="积分" :value="String(memberData.points || 0)" />',
      '      </van-cell-group>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 18. MemberAbout ========== */
  YA.views.MemberAbout = {
    setup: function () {
      var settingsStore = YA.stores.settings();
      var syncStore = YA.stores.sync();

      var storeName = ref('颐安堂');
      var slogan = ref('传承中医养生文化 · 呵护您的身心健康');
      var version = ref('1.0.0');
      var updateTime = ref('');

      var modeText = computed(function () {
        var mode = syncStore.getMode ? syncStore.getMode() : 'local';
        return mode === 'cloud' ? '云端模式' : '本地模式';
      });

      function loadData() {
        return settingsStore.fetchAll().then(function () {
          storeName.value = settingsStore.getStoreName ? settingsStore.getStoreName() : '颐安堂';
          slogan.value = settingsStore.getSlogan ? settingsStore.getSlogan() : '传承中医养生文化 · 呵护您的身心健康';
          version.value = settingsStore.getVersion ? settingsStore.getVersion() : '1.0.0';
          updateTime.value = dayjs().format('YYYY-MM-DD');
        })['catch'](function () {
          updateTime.value = dayjs().format('YYYY-MM-DD');
        });
      }

      onMounted(loadData);

      return {
        storeName: storeName, slogan: slogan, version: version,
        updateTime: updateTime, modeText: modeText
      };
    },
    template: [
      '<div class="v-ma">',
      '  <van-nav-bar title="关于" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="brand-section">',
      '      <div class="logo-circle"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M9 21V12h6v9"/><line x1="12" y1="12" x2="12" y2="21"/></svg></div>',
      '      <h1 class="app-name">{{ storeName }}</h1>',
      '      <p class="app-slogan">{{ slogan }}</p>',
      '      <div class="app-version">版本 v{{ version }}</div>',
      '    </div>',
      '    <div class="info-section">',
      '      <van-cell-group inset :border="false" class="info-group">',
      '        <van-cell title="应用名称" :value="storeName" />',
      '        <van-cell title="当前版本" :value="\'v\' + version" />',
      '        <van-cell title="运行模式" :value="modeText" />',
      '        <van-cell title="更新时间" :value="updateTime" />',
      '      </van-cell-group>',
      '    </div>',
      '    <div class="tech-section">',
      '      <div class="tech-title">技术信息</div>',
      '      <div class="tech-list">',
      '        <div class="tech-item"><span class="tech-label">前端框架</span><span class="tech-value">Vue 3 + Vite</span></div>',
      '        <div class="tech-item"><span class="tech-label">UI 组件</span><span class="tech-value">Vant 4</span></div>',
      '        <div class="tech-item"><span class="tech-label">状态管理</span><span class="tech-value">Pinia</span></div>',
      '        <div class="tech-item"><span class="tech-label">路由方案</span><span class="tech-value">Vue Router (Hash)</span></div>',
      '        <div class="tech-item"><span class="tech-label">二维码</span><span class="tech-value">qrcode.js</span></div>',
      '        <div class="tech-item"><span class="tech-label">数据存储</span><span class="tech-value">{{ modeText }}</span></div>',
      '      </div>',
      '    </div>',
      '    <div class="copyright">',
      '      <p>颐安堂预约管理系统</p>',
      '      <p>传承中医养生文化 · 呵护您的身心健康</p>',
      '      <p class="copyright-year">© 2024-2026 颐安堂 All Rights Reserved</p>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 3. MemberRegister ========== */
  YA.views.MemberRegister = {
    setup: function () {
      var router = useRouter();
      var route = useRoute();
      var authStore = YA.stores.auth();

      var loading = ref(false);
      var confirmPassword = ref('');
      var codeText = ref('获取验证码');
      var codeSent = ref(false);
      var countdown = ref(0);

      var form = reactive({ phone: '', name: '', password: '', code: '', invite: '' });

      onMounted(function () {
        if (route.query.invite) {
          form.invite = route.query.invite;
        }
      });

      function sendCode() {
        if (!form.phone || form.phone.length !== 11) { showToast('请输入正确的手机号'); return; }
        if (codeSent.value) return;
        codeSent.value = true;
        countdown.value = 60;
        codeText.value = countdown.value + 's';
        showToast('验证码已发送（演示：1234）');
        var timer = setInterval(function () {
          countdown.value--;
          codeText.value = countdown.value + 's';
          if (countdown.value <= 0) {
            clearInterval(timer);
            codeText.value = '获取验证码';
            codeSent.value = false;
          }
        }, 1000);
      }

      function handleRegister() {
        if (!form.phone || form.phone.length !== 11) { showToast('请输入正确的手机号'); return; }
        if (!form.name) { showToast('请输入昵称'); return; }
        if (!form.password || form.password.length < 6) { showToast('密码至少6位'); return; }
        if (form.password !== confirmPassword.value) { showToast('两次密码不一致'); return; }
        if (!form.code) { showToast('请输入验证码'); return; }
        if (!Auth.verifySmsCode(form.phone, form.code)) { showToast('验证码错误'); return; }
        loading.value = true;
        authStore.memberRegister({
          phone: form.phone, name: form.name, password: form.password,
          invite: form.invite || undefined, inviteChannel: 'link'
        }).then(function (result) {
          if (result.success) {
            showToast({ message: '注册成功', type: 'success' });
            setTimeout(function () { router.replace('/member/home'); }, 500);
          } else {
            showToast(result.message || '注册失败');
          }
        })['catch'](function () {
          showToast('注册失败，请重试');
        })['finally'](function () {
          loading.value = false;
        });
      }

      function goLogin() { router.push('/member/login'); }

      return {
        form: form, confirmPassword: confirmPassword, loading: loading,
        codeText: codeText, sendCode: sendCode, handleRegister: handleRegister, goLogin: goLogin
      };
    },
    template: [
      '<div class="v-mrg">',
      '  <div class="bg-gradient"></div>',
      '  <div class="bg-radial"></div>',
      '  <div class="register-content">',
      '    <div class="brand-section">',
      '      <div class="logo-circle">',
      '        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
      '          <path d="M3 9l1-5h16l1 5"/><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M9 21V12h6v9"/><line x1="12" y1="12" x2="12" y2="21"/>',
      '        </svg>',
      '      </div>',
      '      <h1 class="brand-name">颐安堂</h1>',
      '      <p class="brand-slogan">会员注册</p>',
      '    </div>',
      '    <div class="form-section">',
      '      <div class="input-group">',
      '        <div class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>',
      '        <input v-model="form.phone" type="tel" maxlength="11" placeholder="请输入手机号" class="input-field" />',
      '      </div>',
      '      <div class="input-group">',
      '        <div class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
      '        <input v-model="form.name" type="text" placeholder="请输入昵称" class="input-field" />',
      '      </div>',
      '      <div class="input-group">',
      '        <div class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>',
      '        <input v-model="form.password" type="password" placeholder="请设置密码" class="input-field" />',
      '      </div>',
      '      <div class="input-group">',
      '        <div class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>',
      '        <input v-model="confirmPassword" type="password" placeholder="请确认密码" class="input-field" />',
      '      </div>',
      '      <div class="input-group input-group-code">',
      '        <div class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>',
      '        <input v-model="form.code" type="text" maxlength="4" placeholder="请输入验证码" class="input-field" />',
      '        <div class="code-btn" @click="sendCode">{{ codeText }}</div>',
      '      </div>',
      '      <div class="input-group" v-if="form.invite">',
      '        <div class="input-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg></div>',
      '        <input v-model="form.invite" type="text" placeholder="邀请码（选填）" class="input-field" readonly />',
      '      </div>',
      '      <button class="register-btn" :disabled="loading" @click="handleRegister">',
      '        <span v-if="!loading">注 册</span>',
      '        <span v-else>注册中...</span>',
      '      </button>',
      '      <div class="bottom-link" @click="goLogin">已有账号？<span class="link-text">去登录</span></div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 4. MemberHome ========== */
  YA.views.MemberHome = {
    components: { EmptyState: EC },
    setup: function () {
      var router = useRouter();
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();
      var announcementStore = YA.stores.announcement();
      var appointmentStore = YA.stores.appointment();
      var projectStore = YA.stores.project();

      var memberData = ref({});
      var announcements = ref([]);
      var recentAppointments = ref([]);
      var projects = ref([]);

      var levelTagClass = computed(function () {
        return ST.memberLevelTag[memberData.value.level] || 'tag-gray';
      });

      var features = [
        { text: '预约服务', path: '/member/appointment-book', bg: 'linear-gradient(135deg, #d4a017, #e0b020)', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
        { text: '消费记录', path: '/member/consumption', bg: 'linear-gradient(135deg, #c0532a, #d9683f)', icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
        { text: '我的套餐', path: '/member/my-packages', bg: 'linear-gradient(135deg, #8a5a2b, #6b3e1a)', icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
        { text: '充值', path: '/member/recharge', bg: 'linear-gradient(135deg, #b8860b, #d4a017)', icon: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
        { text: '邀请好友', path: '/member/invite', bg: 'linear-gradient(135deg, #c0532a, #e07040)', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>' },
        { text: '扫码下载', path: '/member/download-qr', bg: 'linear-gradient(135deg, #6b4c2a, #8a5a2b)', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>' }
      ];

      function loadData() {
        if (authStore.memberId) {
          memberStore.getById(authStore.memberId).then(function (m) { memberData.value = m || {}; });
        }
        announcementStore.getActive().then(function (list) { announcements.value = list; });
        if (authStore.memberId) {
          appointmentStore.getByMember(authStore.memberId).then(function (list) {
            recentAppointments.value = list.slice(0, 2);
          });
        }
        projectStore.fetchProjects().then(function () {
          projects.value = projectStore.projects.slice(0, 8);
        });
      }

      function getProjectName(projectId) {
        var proj = projectStore.projects.find(function (p) { return p.id === projectId; });
        return proj ? proj.name : '未知项目';
      }
      function goTo(path) { router.push(path); }
      function goBook(projectId) { router.push({ path: '/member/appointment-book', query: { project: projectId } }); }
      function goProfile() { router.push('/member/profile-edit'); }

      onMounted(loadData);
      onActivated(loadData);

      return {
        memberData: memberData, announcements: announcements, recentAppointments: recentAppointments,
        projects: projects, features: features, levelTagClass: levelTagClass,
        formatMoney: U.formatMoney, formatDateTime: U.formatDateTime,
        memberLevelText: ST.memberLevel, appointmentStatusText: ST.appointment,
        appointmentStatusTag: ST.appointmentTag,
        getProjectName: getProjectName, goTo: goTo, goBook: goBook, goProfile: goProfile
      };
    },
    template: [
      '<div class="v-mh home-page page-container">',
      '  <div class="member-card">',
      '    <div class="bg-pattern"></div>',
      '    <div class="member-info" @click="goProfile">',
      '      <div class="avatar-wrap">',
      '        <img v-if="memberData.avatar" :src="memberData.avatar" class="avatar" alt="头像" />',
      '        <div v-else class="avatar avatar-default">{{ (memberData.name || \'会\').charAt(0) }}</div>',
      '      </div>',
      '      <div class="member-detail">',
      '        <div class="member-name-row">',
      '          <span class="member-name">{{ memberData.name || \'会员\' }}</span>',
      '          <span class="member-tag" :class="levelTagClass">{{ memberLevelText[memberData.level] || \'普通会员\' }}</span>',
      '        </div>',
      '        <div class="member-stats">',
      '          <div class="stat-item"><span class="stat-label">余额</span><span class="stat-value num">¥{{ formatMoney(memberData.balance) }}</span></div>',
      '          <div class="stat-divider"></div>',
      '          <div class="stat-item"><span class="stat-label">积分</span><span class="stat-value num">{{ memberData.points || 0 }}</span></div>',
      '        </div>',
      '      </div>',
      '      <div class="arrow-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>',
      '    </div>',
      '  </div>',
      '  <div class="section">',
      '    <div class="grid-list">',
      '      <div class="grid-item" v-for="item in features" :key="item.path" @click="goTo(item.path)">',
      '        <div class="grid-icon" :style="{ background: item.bg }"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg></div>',
      '        <span class="grid-text">{{ item.text }}</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="section" v-if="announcements.length > 0">',
      '    <van-notice-bar left-icon="volume-o" :scrollable="true" background="#fff" color="#6b4c2a" class="notice-bar">',
      '      <span v-for="(ann, i) in announcements" :key="ann.id">{{ ann.title }}<span v-if="i < announcements.length - 1">　|　</span></span>',
      '    </van-notice-bar>',
      '  </div>',
      '  <div class="section">',
      '    <div class="section-header"><span class="section-title">我的预约</span><span class="section-more" @click="goTo(\'/member/my-appointments\')">查看全部</span></div>',
      '    <div class="card" v-if="recentAppointments.length > 0">',
      '      <div class="apt-item" v-for="apt in recentAppointments" :key="apt.id">',
      '        <div class="apt-info"><div class="apt-name">{{ getProjectName(apt.project_id) }}</div><div class="apt-time">{{ formatDateTime(apt.start_at) }}</div></div>',
      '        <span class="apt-status" :class="appointmentStatusTag[apt.status]">{{ appointmentStatusText[apt.status] }}</span>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无预约记录" />',
      '  </div>',
      '  <div class="section">',
      '    <div class="section-header"><span class="section-title">推荐项目</span><span class="section-more" @click="goTo(\'/member/appointment-book\')">全部项目</span></div>',
      '    <div class="project-scroll">',
      '      <div class="project-card" v-for="proj in projects" :key="proj.id" @click="goBook(proj.id)">',
      '        <div class="project-img"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>',
      '        <div class="project-name">{{ proj.name }}</div>',
      '        <div class="project-desc">{{ proj.description }}</div>',
      '        <div class="project-bottom"><span class="project-price">¥{{ formatMoney(proj.price) }}</span><span class="project-duration">{{ proj.duration_min }}分钟</span></div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 5. MemberMall ========== */
  YA.views.MemberMall = {
    components: { EmptyState: EC },
    setup: function () {
      var router = useRouter();
      var mallStore = YA.stores.mall();

      var keyword = ref('');
      var activeCategory = ref(0);
      var refreshing = ref(false);

      var categories = [
        { label: '全部', value: 'all' },
        { label: '积分兑换', value: 'points' },
        { label: '余额兑换', value: 'balance' }
      ];

      var filteredGifts = computed(function () {
        var list = mallStore.gifts.filter(function (g) { return g.status === 'active'; });
        var cat = categories[activeCategory.value];
        if (cat && cat.value !== 'all') {
          list = list.filter(function (g) { return g.cost_type === cat.value; });
        }
        if (keyword.value) {
          var kw = keyword.value.toLowerCase();
          list = list.filter(function (g) {
            return g.name.toLowerCase().includes(kw) || (g.description || '').toLowerCase().includes(kw);
          });
        }
        return list;
      });

      function loadData() { return mallStore.fetchGifts(); }
      function onSearch() {}
      function onCategoryChange() {}
      function onRefresh() { loadData().then(function () { refreshing.value = false; }); }
      function goDetail(id) { router.push('/member/gift/' + id); }

      onMounted(loadData);
      onActivated(loadData);

      return {
        keyword: keyword, activeCategory: activeCategory, refreshing: refreshing,
        categories: categories, filteredGifts: filteredGifts,
        formatMoney: U.formatMoney, onSearch: onSearch, onCategoryChange: onCategoryChange,
        onRefresh: onRefresh, goDetail: goDetail
      };
    },
    template: [
      '<div class="v-mm mall-page page-container">',
      '  <div class="header">',
      '    <van-search v-model="keyword" placeholder="搜索礼品" shape="round" @search="onSearch" />',
      '    <van-tabs v-model:active="activeCategory" @change="onCategoryChange" shrink>',
      '      <van-tab v-for="cat in categories" :key="cat.value" :title="cat.label" />',
      '    </van-tabs>',
      '  </div>',
      '  <van-pull-refresh v-model="refreshing" @refresh="onRefresh" class="mall-list-wrap">',
      '    <div class="gift-list" v-if="filteredGifts.length > 0">',
      '      <div class="gift-card" v-for="gift in filteredGifts" :key="gift.id" @click="goDetail(gift.id)">',
      '        <div class="gift-img"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg></div>',
      '        <div class="gift-info">',
      '          <div class="gift-name">{{ gift.name }}</div>',
      '          <div class="gift-desc">{{ gift.description }}</div>',
      '          <div class="gift-bottom">',
      '            <span class="gift-cost" v-if="gift.cost_type === \'points\'"><span class="cost-value num">{{ gift.cost_value }}</span><span class="cost-unit">积分</span></span>',
      '            <span class="gift-cost" v-else><span class="cost-value num">¥{{ formatMoney(gift.cost_value) }}</span></span>',
      '            <span class="gift-stock" :class="{ \'stock-low\': gift.stock <= 5 }">库存{{ gift.stock }}</span>',
      '          </div>',
      '        </div>',
      '        <div class="gift-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无礼品" />',
      '  </van-pull-refresh>',
      '</div>'
    ].join('\n')
  };

  /* ========== 6. MemberMine ========== */
  YA.views.MemberMine = {
    setup: function () {
      var router = useRouter();
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();

      var memberData = ref({});

      var levelTagClass = computed(function () {
        return ST.memberLevelTag[memberData.value.level] || 'tag-gray';
      });

      var menuList = [
        { text: '会员资料编辑', path: '/member/profile-edit', bg: 'linear-gradient(135deg, #d4a017, #e0b020)', icon: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' },
        { text: '我的预约', path: '/member/my-appointments', bg: 'linear-gradient(135deg, #c0532a, #d9683f)', icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
        { text: '消费记录', path: '/member/consumption', bg: 'linear-gradient(135deg, #8a5a2b, #6b3e1a)', icon: '<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
        { text: '我的套餐', path: '/member/my-packages', bg: 'linear-gradient(135deg, #b8860b, #d4a017)', icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>' },
        { text: '兑换订单', path: '/member/orders', bg: 'linear-gradient(135deg, #c0532a, #e07040)', icon: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>' },
        { text: '我的会员码', path: '/member/my-qr', bg: 'linear-gradient(135deg, #6b4c2a, #8a5a2b)', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>' },
        { text: '邀请好友', path: '/member/invite', bg: 'linear-gradient(135deg, #d4a017, #e0b020)', icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>' },
        { text: '扫码下载', path: '/member/download-qr', bg: 'linear-gradient(135deg, #8a5a2b, #6b3e1a)', icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>' },
        { text: '充值', path: '/member/recharge', bg: 'linear-gradient(135deg, #b8860b, #d4a017)', icon: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>' },
        { text: '公告', path: '/member/about', bg: 'linear-gradient(135deg, #6b4c2a, #8a5a2b)', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>' }
      ];

      function loadData() {
        if (authStore.memberId) {
          memberStore.getById(authStore.memberId).then(function (m) { memberData.value = m || {}; });
        }
      }
      function goTo(path) { router.push(path); }
      function goProfile() { router.push('/member/profile-edit'); }
      function handleLogout() {
        showConfirmDialog({ title: '提示', message: '确定要退出登录吗？' }).then(function () {
          authStore.memberLogout();
          showToast('已退出登录');
          router.replace('/member/login');
        })['catch'](function () {});
      }

      onMounted(loadData);
      onActivated(loadData);

      return {
        memberData: memberData, levelTagClass: levelTagClass, menuList: menuList,
        formatMoney: U.formatMoney, memberLevelText: ST.memberLevel,
        goTo: goTo, goProfile: goProfile, handleLogout: handleLogout
      };
    },
    template: [
      '<div class="v-mmi mine-page page-container">',
      '  <div class="member-header">',
      '    <div class="bg-pattern"></div>',
      '    <div class="member-top">',
      '      <div class="avatar-wrap" @click="goProfile">',
      '        <img v-if="memberData.avatar" :src="memberData.avatar" class="avatar" alt="头像" />',
      '        <div v-else class="avatar avatar-default">{{ (memberData.name || \'会\').charAt(0) }}</div>',
      '      </div>',
      '      <div class="member-info">',
      '        <div class="member-name-row"><span class="member-name">{{ memberData.name || \'会员\' }}</span><span class="member-tag" :class="levelTagClass">{{ memberLevelText[memberData.level] || \'普通会员\' }}</span></div>',
      '        <div class="member-phone">{{ memberData.phone }}</div>',
      '      </div>',
      '    </div>',
      '    <div class="member-stats-bar">',
      '      <div class="stat-block" @click="goTo(\'/member/recharge\')"><div class="stat-value num">¥{{ formatMoney(memberData.balance) }}</div><div class="stat-label">余额</div></div>',
      '      <div class="stat-block-divider"></div>',
      '      <div class="stat-block"><div class="stat-value num">{{ memberData.points || 0 }}</div><div class="stat-label">积分</div></div>',
      '    </div>',
      '  </div>',
      '  <div class="menu-section">',
      '    <van-cell-group :border="false" class="menu-group">',
      '      <van-cell v-for="item in menuList" :key="item.path" :title="item.text" is-link :border="true" @click="goTo(item.path)" class="menu-cell">',
      '        <template #icon><div class="menu-icon" :style="{ background: item.bg }"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" v-html="item.icon"></svg></div></template>',
      '      </van-cell>',
      '    </van-cell-group>',
      '  </div>',
      '  <div class="logout-section"><van-button block round type="default" class="logout-btn" @click="handleLogout">退出登录</van-button></div>',
      '  <div class="version-text">颐安堂 v1.0.0</div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 7. AppointmentBook ========== */
  YA.views.AppointmentBook = {
    setup: function () {
      var router = useRouter();
      var route = useRoute();
      var authStore = YA.stores.auth();
      var appointmentStore = YA.stores.appointment();
      var projectStore = YA.stores.project();

      var projects = ref([]);
      var staffList = ref([]);
      var selectedProjectId = ref('');
      var selectedStaffId = ref('');
      var selectedStaffName = ref('');
      var selectedDate = ref('');
      var selectedTime = ref('');
      var notes = ref('');
      var submitting = ref(false);
      var showStaffPicker = ref(false);

      var timeSlots = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

      var dateList = computed(function () {
        var list = [];
        var weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
        for (var i = 0; i < 14; i++) {
          var d = dayjs().add(i, 'day');
          list.push({
            value: d.format('YYYY-MM-DD'),
            weekday: i === 0 ? '今天' : i === 1 ? '明天' : weekdays[d.day()],
            day: d.format('MM/DD')
          });
        }
        return list;
      });

      var staffColumns = computed(function () {
        var cols = [{ text: '不指定技师', value: '' }];
        staffList.value.forEach(function (s) { cols.push({ text: s.name, value: s.id }); });
        return cols;
      });

      function selectProject(proj) { selectedProjectId.value = proj.id; }
      function selectTime(t) { if (isTimePassed(t)) return; selectedTime.value = t; }
      function isTimePassed(t) {
        if (!selectedDate.value) return false;
        if (selectedDate.value !== dayjs().format('YYYY-MM-DD')) return false;
        var parts = t.split(':');
        var h = parseInt(parts[0]), m = parseInt(parts[1]);
        var now = dayjs();
        var slotTime = dayjs(selectedDate.value).hour(h).minute(m);
        return slotTime.isBefore(now);
      }
      function onStaffConfirm(data) {
        var opt = data.selectedOptions[0];
        selectedStaffId.value = opt.value;
        selectedStaffName.value = opt.value ? opt.text : '';
        showStaffPicker.value = false;
      }

      function loadData() {
        return projectStore.fetchProjects().then(function () {
          projects.value = projectStore.projects.filter(function (p) { return p.status === 'active'; });
          return DS.list('staff', { page: 1, pageSize: 100 });
        }).then(function (result) {
          staffList.value = result.data.filter(function (s) { return s.status === 'active' && s.role === 'technician'; });
          if (route.query.project) { selectedProjectId.value = route.query.project; }
          selectedDate.value = dayjs().format('YYYY-MM-DD');
        });
      }

      function handleSubmit() {
        if (!selectedProjectId.value) { showToast('请选择服务项目'); return; }
        if (!selectedDate.value) { showToast('请选择日期'); return; }
        if (!selectedTime.value) { showToast('请选择时段'); return; }
        var proj = projects.value.find(function (p) { return p.id === selectedProjectId.value; });
        if (!proj) { showToast('项目信息有误'); return; }
        var parts = selectedTime.value.split(':');
        var h = parseInt(parts[0]), m = parseInt(parts[1]);
        var startAt = dayjs(selectedDate.value).hour(h).minute(m).second(0);
        var endAt = startAt.add(proj.duration_min, 'minute');
        submitting.value = true;
        appointmentStore.create({
          member_id: authStore.memberId,
          project_id: selectedProjectId.value,
          staff_id: selectedStaffId.value || null,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          status: 'pending',
          notes: notes.value
        }).then(function () {
          showSuccessToast('预约成功，请等待确认');
          setTimeout(function () { router.back(); }, 1000);
        })['catch'](function () {
          showToast('预约失败，请重试');
        })['finally'](function () {
          submitting.value = false;
        });
      }

      onMounted(loadData);

      return {
        projects: projects, staffColumns: staffColumns, dateList: dateList, timeSlots: timeSlots,
        selectedProjectId: selectedProjectId, selectedStaffName: selectedStaffName,
        selectedDate: selectedDate, selectedTime: selectedTime, notes: notes,
        submitting: submitting, showStaffPicker: showStaffPicker,
        formatMoney: U.formatMoney, selectProject: selectProject, selectTime: selectTime,
        isTimePassed: isTimePassed, onStaffConfirm: onStaffConfirm, handleSubmit: handleSubmit
      };
    },
    template: [
      '<div class="v-mab">',
      '  <van-nav-bar title="预约服务" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="form-section">',
      '      <div class="section-title">选择项目</div>',
      '      <div class="project-grid" v-if="projects.length > 0">',
      '        <div class="project-item" :class="{ active: selectedProjectId === proj.id }" v-for="proj in projects" :key="proj.id" @click="selectProject(proj)">',
      '          <div class="project-item-name">{{ proj.name }}</div>',
      '          <div class="project-item-price">¥{{ formatMoney(proj.price) }}</div>',
      '          <div class="project-item-duration">{{ proj.duration_min }}分钟</div>',
      '        </div>',
      '      </div>',
      '      <van-loading v-else size="24px" color="#d4a017" class="loading-wrap">加载中...</van-loading>',
      '    </div>',
      '    <div class="form-section">',
      '      <div class="section-title">选择技师<span class="section-hint">（可选）</span></div>',
      '      <van-cell-group :border="false" class="cell-group">',
      '        <van-cell :value="selectedStaffName || \'不指定技师\'" is-link @click="showStaffPicker = true" class="picker-cell"><template #title><span class="cell-label">技师</span></template></van-cell>',
      '      </van-cell-group>',
      '    </div>',
      '    <div class="form-section">',
      '      <div class="section-title">选择日期</div>',
      '      <div class="date-scroll">',
      '        <div class="date-item" :class="{ active: selectedDate === d.value }" v-for="d in dateList" :key="d.value" @click="selectedDate = d.value"><div class="date-weekday">{{ d.weekday }}</div><div class="date-day">{{ d.day }}</div></div>',
      '      </div>',
      '    </div>',
      '    <div class="form-section">',
      '      <div class="section-title">选择时段</div>',
      '      <div class="time-grid">',
      '        <div class="time-item" :class="{ active: selectedTime === t, disabled: isTimePassed(t) }" v-for="t in timeSlots" :key="t" @click="selectTime(t)">{{ t }}</div>',
      '      </div>',
      '    </div>',
      '    <div class="form-section">',
      '      <div class="section-title">备注</div>',
      '      <van-field v-model="notes" type="textarea" placeholder="请输入备注信息（选填）" rows="3" autosize maxlength="200" show-word-limit class="notes-field" />',
      '    </div>',
      '  </div>',
      '  <div class="submit-bar safe-bottom"><van-button round block type="primary" :loading="submitting" @click="handleSubmit">提交预约</van-button></div>',
      '  <van-popup v-model:show="showStaffPicker" position="bottom" round>',
      '    <van-picker :columns="staffColumns" @confirm="onStaffConfirm" @cancel="showStaffPicker = false" title="选择技师" confirm-button-text="确认" cancel-button-text="取消" />',
      '  </van-popup>',
      '</div>'
    ].join('\n')
  };

  /* ========== 8. MyAppointments ========== */
  YA.views.MyAppointments = {
    components: { EmptyState: EC },
    setup: function () {
      var authStore = YA.stores.auth();
      var appointmentStore = YA.stores.appointment();
      var projectStore = YA.stores.project();

      var appointments = ref([]);
      var staffList = ref([]);
      var refreshing = ref(false);

      function loadData() {
        return projectStore.fetchProjects().then(function () {
          return DS.list('staff', { page: 1, pageSize: 100 });
        }).then(function (staffResult) {
          staffList.value = staffResult.data;
          if (authStore.memberId) {
            return appointmentStore.getByMember(authStore.memberId);
          }
          return [];
        }).then(function (list) {
          appointments.value = (list || []).sort(function (a, b) {
            return new Date(b.start_at).getTime() - new Date(a.start_at).getTime();
          });
        });
      }

      function getProjectName(projectId) {
        var proj = projectStore.projects.find(function (p) { return p.id === projectId; });
        return proj ? proj.name : '未知项目';
      }
      function getStaffName(staffId) {
        var staff = staffList.value.find(function (s) { return s.id === staffId; });
        return staff ? staff.name : '未知';
      }
      function onRefresh() { loadData().then(function () { refreshing.value = false; }); }
      function handleCancel(apt) {
        showConfirmDialog({ title: '取消预约', message: '确定要取消这条预约吗？' }).then(function () {
          appointmentStore.cancel(apt.id).then(function () {
            showSuccessToast('已取消预约');
            loadData();
          })['catch'](function () { showToast('取消失败，请重试'); });
        })['catch'](function () {});
      }

      onMounted(loadData);
      onActivated(loadData);

      return {
        appointments: appointments, refreshing: refreshing,
        formatDateTime: U.formatDateTime,
        appointmentStatusText: ST.appointment, appointmentStatusTag: ST.appointmentTag,
        getProjectName: getProjectName, getStaffName: getStaffName,
        onRefresh: onRefresh, handleCancel: handleCancel
      };
    },
    template: [
      '<div class="v-mma">',
      '  <van-nav-bar title="我的预约" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">',
      '    <div class="content" v-if="appointments.length > 0">',
      '      <div class="apt-card" v-for="apt in appointments" :key="apt.id">',
      '        <div class="apt-card-header"><span class="apt-project">{{ getProjectName(apt.project_id) }}</span><span class="apt-status" :class="appointmentStatusTag[apt.status]">{{ appointmentStatusText[apt.status] }}</span></div>',
      '        <div class="apt-card-body">',
      '          <div class="apt-row"><span class="apt-label">预约时间</span><span class="apt-value">{{ formatDateTime(apt.start_at) }}</span></div>',
      '          <div class="apt-row" v-if="apt.staff_id"><span class="apt-label">技师</span><span class="apt-value">{{ getStaffName(apt.staff_id) }}</span></div>',
      '          <div class="apt-row" v-if="apt.notes"><span class="apt-label">备注</span><span class="apt-value">{{ apt.notes }}</span></div>',
      '        </div>',
      '        <div class="apt-card-footer" v-if="apt.status === \'pending\' || apt.status === \'confirmed\'"><van-button size="small" plain type="danger" round @click="handleCancel(apt)">取消预约</van-button></div>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无预约记录" />',
      '  </van-pull-refresh>',
      '</div>'
    ].join('\n')
  };

  /* ========== 9. Consumption ========== */
  YA.views.Consumption = {
    components: { EmptyState: EC },
    setup: function () {
      var authStore = YA.stores.auth();
      var orderStore = YA.stores.order();

      var orders = ref([]);
      var refreshing = ref(false);

      function loadData() {
        if (authStore.memberId) {
          return orderStore.getByMember(authStore.memberId).then(function (list) {
            orders.value = (list || []).sort(function (a, b) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
        }
        return Promise.resolve();
      }
      function onRefresh() { loadData().then(function () { refreshing.value = false; }); }

      onMounted(loadData);
      onActivated(loadData);

      return {
        orders: orders, refreshing: refreshing,
        formatMoney: U.formatMoney, formatDateTime: U.formatDateTime,
        payMethodText: ST.payMethod, onRefresh: onRefresh
      };
    },
    template: [
      '<div class="v-mc">',
      '  <van-nav-bar title="消费记录" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">',
      '    <div class="content" v-if="orders.length > 0">',
      '      <div class="order-card" v-for="order in orders" :key="order.id">',
      '        <div class="order-header"><span class="order-no">订单号: {{ order.order_no }}</span><span class="order-time">{{ formatDateTime(order.created_at) }}</span></div>',
      '        <div class="order-body"><div class="order-projects"><span class="order-project-name" v-for="(item, i) in order.items" :key="i">{{ item.name }}<span v-if="i < order.items.length - 1">、</span></span></div></div>',
      '        <div class="order-footer">',
      '          <div class="order-pay-info"><span class="order-amount">¥{{ formatMoney(order.paid_amount) }}</span><span class="order-pay-method">{{ payMethodText[order.pay_method] || order.pay_method }}</span></div>',
      '          <div class="order-points" v-if="order.points_earned > 0"><span class="points-tag">+{{ order.points_earned }}积分</span></div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无消费记录" />',
      '  </van-pull-refresh>',
      '</div>'
    ].join('\n')
  };

  /* ========== 10. MyPackages ========== */
  YA.views.MyPackages = {
    components: { EmptyState: EC },
    setup: function () {
      var router = useRouter();
      var authStore = YA.stores.auth();
      var projectStore = YA.stores.project();

      var packages = ref([]);
      var refreshing = ref(false);

      function loadData() {
        return projectStore.fetchPackages().then(function () {
          if (authStore.memberId) {
            return projectStore.getMemberPackages(authStore.memberId);
          }
          return [];
        }).then(function (list) {
          packages.value = list || [];
        });
      }
      function getPackageName(packageId) {
        var pkg = projectStore.packages.find(function (p) { return p.id === packageId; });
        return pkg ? pkg.name : '未知套餐';
      }
      function formatExpire(expireAt) {
        if (!expireAt) return '长期有效';
        return U.formatDate(expireAt);
      }
      function onRefresh() { loadData().then(function () { refreshing.value = false; }); }
      function goBook() { router.push('/member/appointment-book'); }

      onMounted(loadData);
      onActivated(loadData);

      return {
        packages: packages, refreshing: refreshing,
        getPackageName: getPackageName, formatExpire: formatExpire,
        onRefresh: onRefresh, goBook: goBook
      };
    },
    template: [
      '<div class="v-mmp">',
      '  <van-nav-bar title="我的套餐" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <van-pull-refresh v-model="refreshing" @refresh="onRefresh">',
      '    <div class="content" v-if="packages.length > 0">',
      '      <div class="pkg-card" v-for="pkg in packages" :key="pkg.id">',
      '        <div class="pkg-card-header"><div class="pkg-name">{{ getPackageName(pkg.package_id) }}</div><span class="pkg-status" :class="pkg.status === \'active\' ? \'tag-green\' : \'tag-gray\'">{{ pkg.status === \'active\' ? \'使用中\' : \'已失效\' }}</span></div>',
      '        <div class="pkg-card-body">',
      '          <div class="pkg-stat-row">',
      '            <div class="pkg-stat"><div class="pkg-stat-value num" :class="{ \'text-danger\': pkg.remain_times <= 0 }">{{ pkg.remain_times }}</div><div class="pkg-stat-label">剩余次数</div></div>',
      '            <div class="pkg-stat-divider"></div>',
      '            <div class="pkg-stat"><div class="pkg-stat-value">{{ formatExpire(pkg.expire_at) }}</div><div class="pkg-stat-label">有效期至</div></div>',
      '          </div>',
      '          <div class="pkg-source" v-if="pkg.source">来源: {{ pkg.source }}</div>',
      '        </div>',
      '        <div class="pkg-card-footer" v-if="pkg.status === \'active\' && pkg.remain_times > 0"><van-button size="small" type="primary" round @click="goBook">预约使用</van-button></div>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无套餐" />',
      '  </van-pull-refresh>',
      '</div>'
    ].join('\n')
  };

  /* ========== 11. MemberRecharge ========== */
  YA.views.MemberRecharge = {
    setup: function () {
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();
      var projectStore = YA.stores.project();
      var commissionStore = YA.stores.commission();

      var memberData = ref({});
      var rules = ref([]);
      var selectedRuleId = ref('');
      var paying = ref(false);

      function loadData() {
        return projectStore.fetchPackages().then(function () {
          if (authStore.memberId) {
            return memberStore.getById(authStore.memberId);
          }
          return null;
        }).then(function (m) {
          memberData.value = m || {};
          return DS.list('recharge_rules', { page: 1, pageSize: 100 });
        }).then(function (result) {
          rules.value = result.data.filter(function (r) { return r.status === 'active'; }).sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
        });
      }

      function getPackageName(packageId) {
        var pkg = projectStore.packages.find(function (p) { return p.id === packageId; });
        return pkg ? pkg.name : '套餐';
      }

      function handleRecharge() {
        if (!selectedRuleId.value) { showToast('请选择充值档位'); return; }
        var rule = rules.value.find(function (r) { return r.id === selectedRuleId.value; });
        if (!rule) return;
        showConfirmDialog({
          title: '确认充值',
          message: '充值' + rule.pay_amount + '元，赠送' + rule.gift_amount + '元+' + rule.gift_points + '积分' + (rule.gift_package_id ? '+' + getPackageName(rule.gift_package_id) : '') + '，确认支付？'
        }).then(function () {
          paying.value = true;
          showLoadingToast({ message: '支付中...', forbidClick: true, duration: 0 });
          memberStore.recharge(authStore.memberId, rule.pay_amount, rule.gift_amount, rule.gift_points).then(function () {
            return DS.create('recharge_records', {
              member_id: authStore.memberId, rule_id: rule.id, pay_amount: rule.pay_amount,
              gift_amount: rule.gift_amount, gift_points: rule.gift_points,
              pay_method: 'wechat', status: 'success', created_at: U.now(), updated_at: U.now()
            });
          }).then(function (record) {
            if (rule.gift_package_id && rule.gift_times > 0) {
              var pkg = projectStore.packages.find(function (p) { return p.id === rule.gift_package_id; });
              var validityDays = pkg ? (pkg.validity_days || 30) : 30;
              var expireAt = new Date(Date.now() + validityDays * 86400000).toISOString();
              return DS.create('member_packages', {
                member_id: authStore.memberId, package_id: rule.gift_package_id,
                remain_times: rule.gift_times, expire_at: expireAt, status: 'active',
                source: '充值赠送', created_at: U.now(), updated_at: U.now()
              }).then(function () { return record; });
            }
            return record;
          }).then(function (record) {
            return memberStore.getById(authStore.memberId).then(function (member) {
              if (member && member.referrer_id) {
                return commissionStore.calculateCommission(member.referrer_id, authStore.memberId, '充值', record.id, rule.pay_amount);
              }
              return null;
            });
          }).then(function () {
            return memberStore.getById(authStore.memberId);
          }).then(function (m) {
            memberData.value = m || {};
            showToast({ message: '充值成功', type: 'success' });
          })['catch'](function (e) {
            console.error('[Recharge] 充值失败:', e);
            showToast('充值失败，请重试');
          })['finally'](function () {
            paying.value = false;
          });
        })['catch'](function () {});
      }

      onMounted(loadData);
      onActivated(loadData);

      return {
        memberData: memberData, rules: rules, selectedRuleId: selectedRuleId, paying: paying,
        formatMoney: U.formatMoney, getPackageName: getPackageName, handleRecharge: handleRecharge
      };
    },
    template: [
      '<div class="v-mr">',
      '  <van-nav-bar title="充值" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="balance-card"><div class="balance-label">当前余额</div><div class="balance-value num">¥{{ formatMoney(memberData.balance) }}</div><div class="balance-points">积分: {{ memberData.points || 0 }}</div></div>',
      '    <div class="section-title">选择充值档位</div>',
      '    <div class="rule-list" v-if="rules.length > 0">',
      '      <div class="rule-card" :class="{ active: selectedRuleId === rule.id }" v-for="rule in rules" :key="rule.id" @click="selectedRuleId = rule.id">',
      '        <div class="rule-main">',
      '          <div class="rule-pay"><span class="rule-pay-value num">{{ rule.pay_amount }}</span><span class="rule-pay-unit">元</span></div>',
      '          <div class="rule-gift-list">',
      '            <div class="rule-gift-item" v-if="rule.gift_amount > 0"><span class="gift-icon">赠</span><span>赠送¥{{ rule.gift_amount }}</span></div>',
      '            <div class="rule-gift-item" v-if="rule.gift_points > 0"><span class="gift-icon">分</span><span>送{{ rule.gift_points }}积分</span></div>',
      '            <div class="rule-gift-item" v-if="rule.gift_package_id"><span class="gift-icon">套</span><span>送{{ getPackageName(rule.gift_package_id) }}{{ rule.gift_times > 1 ? \'x\' + rule.gift_times : \'\' }}</span></div>',
      '          </div>',
      '        </div>',
      '        <div class="rule-check"><div class="check-circle" :class="{ checked: selectedRuleId === rule.id }"><svg v-if="selectedRuleId === rule.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div></div>',
      '      </div>',
      '    </div>',
      '    <van-loading v-else size="24px" color="#d4a017" class="loading-wrap">加载中...</van-loading>',
      '    <div class="tips-section"><div class="tips-title">充值说明</div><div class="tips-content"><p>1. 充值后金额将实时到账，可在消费时使用余额支付。</p><p>2. 赠送金额及积分即时生效，赠送套餐将自动添加至我的套餐。</p><p>3. 如充值遇到问题，请联系店内工作人员。</p></div></div>',
      '  </div>',
      '  <div class="submit-bar safe-bottom"><van-button round block type="primary" :disabled="!selectedRuleId || paying" :loading="paying" @click="handleRecharge">{{ paying ? \'支付中...\' : \'立即充值\' }}</van-button></div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 12. MemberInvite ========== */
  YA.views.MemberInvite = {
    components: { EmptyState: EC },
    setup: function () {
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();
      var commissionStore = YA.stores.commission();

      var memberData = ref({});
      var qrDataUrl = ref('');
      var invitedCount = ref(0);
      var commissions = ref([]);
      var commissionTotal = ref(0);
      var commissionSettled = ref(0);
      var showWithdrawPopup = ref(false);
      var withdrawAmount = ref('');

      function loadData() {
        if (authStore.memberId) {
          return memberStore.getById(authStore.memberId).then(function (m) {
            memberData.value = m || {};
            if (memberData.value.invite_code) {
              return QR.generateInviteQr(memberData.value.invite_code);
            }
            return null;
          }).then(function (url) {
            qrDataUrl.value = url || '';
            return DS.list('referrals', { where: { referrer_id: authStore.memberId }, page: 1, pageSize: 999 });
          }).then(function (refResult) {
            invitedCount.value = refResult.data.length;
            return commissionStore.getByReferrer(authStore.memberId);
          }).then(function (list) {
            commissions.value = (list || []).sort(function (a, b) {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            commissionTotal.value = commissions.value.reduce(function (sum, c) { return sum + (c.amount || 0); }, 0);
            commissionSettled.value = commissions.value.filter(function (c) { return c.status === 'settled'; }).reduce(function (sum, c) { return sum + (c.amount || 0); }, 0);
          });
        }
        return Promise.resolve();
      }

      function commissionStatusTagClass(status) {
        var map = { pending: 'tag-gold', settled: 'tag-green', withdrawn: 'tag-gray' };
        return map[status] || 'tag-gray';
      }

      function copyInviteCode() {
        var code = memberData.value.invite_code;
        if (!code) return;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(code).then(function () { showSuccessToast('邀请码已复制'); })['catch'](function () { showToast('复制失败，请手动复制'); });
        } else {
          showToast('复制失败，请手动复制');
        }
      }

      function handleWithdraw() {
        var amount = parseFloat(withdrawAmount.value);
        if (!amount || amount <= 0) { showToast('请输入正确的金额'); return; }
        if (amount > commissionSettled.value) { showToast('提现金额不能超过可提现金额'); return; }
        commissionStore.requestWithdrawal(authStore.memberId, amount).then(function () {
          showSuccessToast('提现申请已提交');
          showWithdrawPopup.value = false;
          withdrawAmount.value = '';
          loadData();
        })['catch'](function () { showToast('提现失败，请重试'); });
      }

      onMounted(loadData);
      onActivated(loadData);

      return {
        memberData: memberData, qrDataUrl: qrDataUrl, invitedCount: invitedCount,
        commissions: commissions, commissionTotal: commissionTotal, commissionSettled: commissionSettled,
        showWithdrawPopup: showWithdrawPopup, withdrawAmount: withdrawAmount,
        formatMoney: U.formatMoney, formatDateTime: U.formatDateTime,
        commissionStatusText: ST.commission, commissionStatusTagClass: commissionStatusTagClass,
        copyInviteCode: copyInviteCode, handleWithdraw: handleWithdraw
      };
    },
    template: [
      '<div class="v-mi">',
      '  <van-nav-bar title="邀请好友" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="qr-section">',
      '      <div class="qr-title">我的推广二维码</div>',
      '      <div class="qr-wrap"><img v-if="qrDataUrl" :src="qrDataUrl" class="qr-img" alt="推广二维码" /><div v-else class="qr-loading"><van-loading size="32px" color="#d4a017">生成中...</van-loading></div></div>',
      '      <div class="invite-code-row"><span class="invite-code-label">我的邀请码</span><span class="invite-code-value">{{ memberData.invite_code || \'------\' }}</span><div class="copy-btn" @click="copyInviteCode">复制</div></div>',
      '      <div class="qr-desc">分享二维码或邀请码给好友，好友注册后您可获得佣金奖励</div>',
      '    </div>',
      '    <div class="stats-section">',
      '      <div class="stat-block"><div class="stat-value num">{{ invitedCount }}</div><div class="stat-label">已邀请人数</div></div>',
      '      <div class="stat-divider"></div>',
      '      <div class="stat-block"><div class="stat-value num">¥{{ formatMoney(commissionTotal) }}</div><div class="stat-label">累计佣金</div></div>',
      '      <div class="stat-divider"></div>',
      '      <div class="stat-block"><div class="stat-value num">¥{{ formatMoney(commissionSettled) }}</div><div class="stat-label">可提现</div></div>',
      '    </div>',
      '    <div class="section-header"><span class="section-title">佣金明细</span></div>',
      '    <div class="commission-list" v-if="commissions.length > 0">',
      '      <div class="commission-item" v-for="com in commissions" :key="com.id">',
      '        <div class="commission-info"><div class="commission-type">{{ com.source_type }}</div><div class="commission-time">{{ formatDateTime(com.created_at) }}</div></div>',
      '        <div class="commission-right"><div class="commission-amount num">+¥{{ formatMoney(com.amount) }}</div><span class="commission-status" :class="commissionStatusTagClass(com.status)">{{ commissionStatusText[com.status] }}</span></div>',
      '      </div>',
      '    </div>',
      '    <EmptyState v-else text="暂无佣金记录" />',
      '  </div>',
      '  <div class="submit-bar safe-bottom"><van-button round block type="primary" @click="showWithdrawPopup = true">申请提现</van-button></div>',
      '  <van-popup v-model:show="showWithdrawPopup" position="bottom" round :style="{ minHeight: \'200px\' }">',
      '    <div class="withdraw-popup">',
      '      <div class="withdraw-title">申请提现</div>',
      '      <div class="withdraw-balance">可提现金额: ¥{{ formatMoney(commissionSettled) }}</div>',
      '      <van-field v-model="withdrawAmount" type="number" label="提现金额" placeholder="请输入提现金额" class="withdraw-input" />',
      '      <div class="withdraw-actions"><van-button block round @click="showWithdrawPopup = false">取消</van-button><van-button block round type="primary" @click="handleWithdraw">确认提现</van-button></div>',
      '    </div>',
      '  </van-popup>',
      '</div>'
    ].join('\n')
  };

  /* ========== 13. DownloadQr ========== */
  YA.views.DownloadQr = {
    setup: function () {
      var settingsStore = YA.stores.settings();

      var qrDataUrl = ref('');
      var downloadUrl = ref('');

      function loadData() {
        return settingsStore.fetchAll().then(function () {
          downloadUrl.value = settingsStore.getApkDownloadUrl();
          return QR.generateDownloadQr();
        }).then(function (url) {
          qrDataUrl.value = url || '';
        });
      }

      function copyLink() {
        if (!downloadUrl.value) return;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(downloadUrl.value).then(function () {
            showSuccessToast('链接已复制');
          })['catch'](function () { showToast('复制失败，请手动复制'); });
        } else {
          var input = document.createElement('input');
          input.value = downloadUrl.value;
          document.body.appendChild(input);
          input.select();
          try { document.execCommand('copy'); showSuccessToast('链接已复制'); }
          catch (e) { showToast('复制失败，请手动复制'); }
          document.body.removeChild(input);
        }
      }

      function openInBrowser() {
        if (downloadUrl.value) {
          window.open(downloadUrl.value, '_blank');
        } else {
          showToast('下载链接不可用');
        }
      }

      onMounted(loadData);

      return { qrDataUrl: qrDataUrl, downloadUrl: downloadUrl, copyLink: copyLink, openInBrowser: openInBrowser };
    },
    template: [
      '<div class="v-mdq">',
      '  <van-nav-bar title="扫码下载" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="qr-card">',
      '      <div class="qr-title">下载颐安堂APP</div>',
      '      <div class="qr-wrap"><img v-if="qrDataUrl" :src="qrDataUrl" class="qr-img" alt="下载二维码" /><div v-else class="qr-loading"><van-loading size="32px" color="#d4a017">生成中...</van-loading></div></div>',
      '      <div class="qr-tip">微信扫一扫，下载颐安堂APP</div>',
      '      <div class="qr-subtip">如微信无法直接安装，请点击右上角用浏览器打开</div>',
      '    </div>',
      '    <div class="link-section">',
      '      <div class="link-row"><span class="link-label">下载链接</span><span class="link-url">{{ downloadUrl }}</span></div>',
      '      <div class="actions"><van-button block round type="primary" @click="copyLink">复制下载链接</van-button><van-button block round plain @click="openInBrowser">浏览器打开</van-button></div>',
      '    </div>',
      '    <div class="tips-section"><div class="tips-title">安装说明</div><div class="tips-content"><p>1. 使用微信扫码后，若无法直接下载，请点击右上角"..."选择"在浏览器打开"。</p><p>2. 下载完成后，点击安装包进行安装。</p><p>3. 安装时如提示"未知来源"，请在手机设置中允许安装。</p><p>4. 安装完成后，打开颐安堂APP即可使用。</p></div></div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 14. ProfileEdit ========== */
  YA.views.ProfileEdit = {
    setup: function () {
      var router = useRouter();
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();

      var saving = ref(false);
      var showBirthdayPicker = ref(false);
      var birthdayPickerValue = ref([]);

      var form = reactive({ name: '', gender: 'unknown', birthday: '', phone: '', avatar: '', notes: '' });

      var minDate = new Date(1940, 0, 1);
      var maxDate = new Date();

      var birthdayText = computed(function () {
        if (!form.birthday) return '';
        return dayjs(form.birthday).format('YYYY-MM-DD');
      });

      function loadData() {
        if (authStore.memberId) {
          return memberStore.getById(authStore.memberId).then(function (member) {
            if (member) {
              form.name = member.name || '';
              form.gender = member.gender || 'unknown';
              form.birthday = member.birthday || '';
              form.phone = member.phone || '';
              form.avatar = member.avatar || '';
              form.notes = member.notes || '';
              if (form.birthday) {
                var d = dayjs(form.birthday);
                birthdayPickerValue.value = [String(d.year()), String(d.month() + 1).padStart(2, '0'), String(d.date()).padStart(2, '0')];
              } else {
                var now = dayjs();
                birthdayPickerValue.value = [String(now.year() - 20), '01', '01'];
              }
            }
          });
        }
        return Promise.resolve();
      }

      function onBirthdayConfirm(data) {
        form.birthday = data.selectedValues.join('-');
        showBirthdayPicker.value = false;
      }

      function changeAvatar() { showToast('头像上传功能开发中'); }

      function handleSave() {
        if (!form.name) { showToast('请输入昵称'); return; }
        saving.value = true;
        authStore.updateMemberProfile({
          name: form.name, gender: form.gender, birthday: form.birthday, notes: form.notes
        }).then(function () {
          showSuccessToast('保存成功');
          setTimeout(function () { router.back(); }, 800);
        })['catch'](function () {
          showToast('保存失败，请重试');
        })['finally'](function () {
          saving.value = false;
        });
      }

      onMounted(loadData);

      return {
        form: form, saving: saving, showBirthdayPicker: showBirthdayPicker,
        birthdayPickerValue: birthdayPickerValue, minDate: minDate, maxDate: maxDate,
        birthdayText: birthdayText, onBirthdayConfirm: onBirthdayConfirm,
        changeAvatar: changeAvatar, handleSave: handleSave
      };
    },
    template: [
      '<div class="v-mpe">',
      '  <van-nav-bar title="会员资料" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="content">',
      '    <div class="avatar-section" @click="changeAvatar">',
      '      <div class="avatar-wrap"><img v-if="form.avatar" :src="form.avatar" class="avatar" alt="头像" /><div v-else class="avatar avatar-default">{{ (form.name || \'会\').charAt(0) }}</div></div>',
      '      <div class="avatar-tip">点击更换头像</div>',
      '    </div>',
      '    <van-form @submit="handleSave" class="form-section">',
      '      <van-cell-group inset :border="false" class="form-group">',
      '        <van-field v-model="form.name" label="昵称" placeholder="请输入昵称" :rules="[{ required: true, message: \'请输入昵称\' }]" />',
      '        <van-field label="性别" class="gender-field"><template #input><van-radio-group v-model="form.gender" direction="horizontal"><van-radio name="male">男</van-radio><van-radio name="female">女</van-radio><van-radio name="unknown">保密</van-radio></van-radio-group></template></van-field>',
      '        <van-field v-model="birthdayText" label="生日" placeholder="请选择生日" readonly is-link @click="showBirthdayPicker = true" />',
      '        <van-field v-model="form.phone" label="手机号" placeholder="手机号" readonly />',
      '        <van-field v-model="form.notes" type="textarea" label="备注" placeholder="请输入备注信息（选填）" rows="3" autosize maxlength="200" show-word-limit />',
      '      </van-cell-group>',
      '      <div class="save-section"><van-button round block type="primary" native-type="submit" :loading="saving">保存</van-button></div>',
      '    </van-form>',
      '  </div>',
      '  <van-popup v-model:show="showBirthdayPicker" position="bottom" round>',
      '    <van-date-picker v-model="birthdayPickerValue" @confirm="onBirthdayConfirm" @cancel="showBirthdayPicker = false" title="选择生日" confirm-button-text="确认" cancel-button-text="取消" :min-date="minDate" :max-date="maxDate" />',
      '  </van-popup>',
      '</div>'
    ].join('\n')
  };

  /* ========== 15. GiftDetail ========== */
  YA.views.GiftDetail = {
    setup: function () {
      var router = useRouter();
      var route = useRoute();
      var authStore = YA.stores.auth();
      var memberStore = YA.stores.member();
      var mallStore = YA.stores.mall();

      var gift = ref(null);
      var memberPoints = ref(0);
      var memberBalance = ref(0);
      var redeeming = ref(false);

      function loadData() {
        var giftId = route.params.id;
        return DS.get('gifts', giftId).then(function (g) {
          gift.value = g;
          if (authStore.memberId) {
            return memberStore.getById(authStore.memberId);
          }
          return null;
        }).then(function (member) {
          if (member) {
            memberPoints.value = member.points || 0;
            memberBalance.value = member.balance || 0;
          }
        });
      }

      function handleRedeem() {
        if (!gift.value) return;
        if (gift.value.cost_type === 'points' && memberPoints.value < gift.value.cost_value) { showToast('积分不足'); return; }
        if (gift.value.cost_type === 'balance' && memberBalance.value < gift.value.cost_value) { showToast('余额不足'); return; }
        var costText = gift.value.cost_type === 'points' ? (gift.value.cost_value + '积分') : ('¥' + U.formatMoney(gift.value.cost_value));
        showConfirmDialog({ title: '确认兑换', message: '确定消耗' + costText + '兑换「' + gift.value.name + '」吗？' }).then(function () {
          redeeming.value = true;
          mallStore.redeem(authStore.memberId, gift.value.id).then(function (result) {
            if (result.success) {
              showSuccessToast('兑换成功');
              setTimeout(function () { router.replace('/member/orders'); }, 1000);
            } else {
              showToast(result.message || '兑换失败');
            }
          })['catch'](function () { showToast('兑换失败，请重试'); })['finally'](function () { redeeming.value = false; });
        })['catch'](function () { /* 用户取消 */ });
      }

      onMounted(loadData);

      return {
        gift: gift, memberPoints: memberPoints, memberBalance: memberBalance,
        redeeming: redeeming, handleRedeem: handleRedeem,
        formatMoney: function (v) { return U.formatMoney(v); }
      };
    },
    template: [
      '<div class="v-mgd">',
      '  <van-nav-bar title="礼品详情" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div v-if="gift" class="content">',
      '    <div class="gift-image"><div class="gift-image-placeholder">🎁</div></div>',
      '    <div class="gift-info card">',
      '      <h2 class="gift-name">{{ gift.name }}</h2>',
      '      <div class="gift-cost">',
      '        <span v-if="gift.cost_type === \'points\'" class="cost-points">{{ gift.cost_value }} 积分</span>',
      '        <span v-else class="cost-balance">¥{{ formatMoney(gift.cost_value) }}</span>',
      '        <span class="stock">库存 {{ gift.stock }} 件</span>',
      '      </div>',
      '      <div class="gift-desc">{{ gift.description }}</div>',
      '    </div>',
      '    <div class="my-assets card">',
      '      <div class="asset-item"><span class="label">我的积分</span><span class="value">{{ memberPoints }}</span></div>',
      '      <div class="asset-item"><span class="label">我的余额</span><span class="value">¥{{ formatMoney(memberBalance) }}</span></div>',
      '    </div>',
      '    <div class="redeem-section">',
      '      <van-button round block type="primary" :loading="redeeming" @click="handleRedeem" :disabled="gift.stock <= 0">立即兑换</van-button>',
      '    </div>',
      '  </div>',
      '  <div v-else style="padding:60px;text-align:center;color:#999;">加载中...</div>',
      '</div>'
    ].join('\n')
  };

  console.log('[YA] 会员端视图组件加载完成，共18个组件');
})();