/**
 * 颐安堂预约管理系统 - 应用入口
 * 包含：启动页组件(EntryView)、路由配置、路由守卫、应用挂载
 */
(function () {
  'use strict';

  const { createApp, h } = Vue;
  const { createRouter, createWebHashHistory } = VueRouter;
  const { createPinia } = Pinia;
  const VantLib = window.Vant || window.vant;

  /* ==================== 启动页样式注入 ==================== */
  (function injectEntryStyle() {
    if (document.getElementById('ya-entry-style')) return;
    const el = document.createElement('style');
    el.id = 'ya-entry-style';
    el.textContent = `
.entry-page {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(212,160,23,0.20), transparent 55%),
    linear-gradient(180deg, #8a5a2b 0%, #3a2412 100%);
}
.entry-top {
  flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center;
  padding-top: calc(15vh + var(--ya-safe-top, 0px));
}
.entry-logo {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, #d4a017, #e0b020);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 30px rgba(212,160,23,0.45), 0 6px 20px rgba(0,0,0,0.25);
  margin-bottom: 18px;
}
.entry-name {
  color: #d4a017;
  font-size: 32px; font-weight: 800;
  letter-spacing: 8px; text-indent: 4px;
  margin-bottom: 8px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.entry-slogan {
  color: rgba(255,255,255,0.65);
  font-size: 13px; letter-spacing: 1px;
}
.entry-cards {
  flex: 1;
  display: flex; flex-direction: column; justify-content: center;
  width: 100%; max-width: 340px;
  padding: 0 20px; gap: 14px;
}
.entry-card {
  display: flex; align-items: center;
  padding: 16px;
  background: rgba(255,255,255,0.08);
  -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.entry-card:active { transform: scale(0.97); }
.entry-card-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-right: 14px;
}
.entry-card-icon.admin {
  background: linear-gradient(135deg, #d4a017, #e0b020);
  box-shadow: 0 4px 12px rgba(212,160,23,0.3);
}
.entry-card-icon.member {
  background: linear-gradient(135deg, #c0532a, #d9683f);
  box-shadow: 0 4px 12px rgba(192,83,42,0.3);
}
.entry-card-text { flex: 1; min-width: 0; }
.entry-card-title { color: #fff; font-size: 17px; font-weight: 600; margin-bottom: 4px; }
.entry-card-sub { color: rgba(255,255,255,0.55); font-size: 12px; }
.entry-card-arrow { flex-shrink: 0; opacity: 0.6; display: flex; align-items: center; }
.entry-version {
  flex-shrink: 0;
  padding-bottom: calc(24px + var(--ya-safe-bottom, 0px));
  color: rgba(255,255,255,0.35);
  font-size: 11px;
}
`;
    document.head.appendChild(el);
  })();

  /* ==================== EntryView 组件 ==================== */
  YA.views = YA.views || {};

  YA.views.EntryView = {
    name: 'EntryView',
    methods: {
      goAdmin() {
        const authed = !!localStorage.getItem('admin_auth');
        this.$router.push(authed ? '/admin/home' : '/admin/login');
      },
      goMember() {
        const authed = !!localStorage.getItem('member_auth');
        this.$router.push(authed ? '/member/home' : '/member/login');
      }
    },
    template: `
      <div class="entry-page">
        <div class="entry-top">
          <div class="entry-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l1-5h16l1 5"/>
              <path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/>
              <path d="M9 21V12h6v9"/>
            </svg>
          </div>
          <div class="entry-name">颐安堂</div>
          <div class="entry-slogan">传承中医养生文化 · 呵护您的身心健康</div>
        </div>
        <div class="entry-cards">
          <div class="entry-card" @click="goAdmin">
            <div class="entry-card-icon admin">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="entry-card-text">
              <div class="entry-card-title">管理端</div>
              <div class="entry-card-sub">收银、会员、预约、项目管理</div>
            </div>
            <div class="entry-card-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
          <div class="entry-card" @click="goMember">
            <div class="entry-card-icon member">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="entry-card-text">
              <div class="entry-card-title">会员端</div>
              <div class="entry-card-sub">预约、充值、商城、我的订单</div>
            </div>
            <div class="entry-card-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="entry-version">版本 v1.0.0</div>
      </div>
    `
  };

  /* ==================== 路由配置 ==================== */
  const V = YA.views;

  const routes = [
    // 启动页
    { path: '/', component: V.EntryView },

    // ---------- 管理端 ----------
    { path: '/admin/login', component: V.AdminLogin },
    {
      path: '/admin',
      component: V.AdminLayout,
      redirect: '/admin/home',
      children: [
        { path: 'home', component: V.AdminHome },
        { path: 'members', component: V.AdminMembers },
        { path: 'cashier', component: V.AdminCashier },
        { path: 'projects', component: V.AdminProjects },
        { path: 'mine', component: V.AdminMine }
      ]
    },
    { path: '/admin/member/:id', component: V.MemberDetail },
    { path: '/admin/member-add', component: V.MemberAdd },
    { path: '/admin/appointments', component: V.AppointmentManage },
    { path: '/admin/redemption-orders', component: V.OrderRedemption },
    { path: '/admin/stats', component: V.AdminStats },
    { path: '/admin/staff', component: V.AdminStaff },
    { path: '/admin/announcements', component: V.AdminAnnouncement },
    { path: '/admin/commission', component: V.AdminCommission },
    { path: '/admin/recharge-rules', component: V.AdminRechargeRules },
    { path: '/admin/project-edit/:id?', component: V.ProjectEdit },
    { path: '/admin/package-edit/:id?', component: V.PackageEdit },
    { path: '/admin/cashier-checkout', component: V.CashierCheckout },
    { path: '/admin/settings', component: V.AdminSettings },

    // ---------- 会员端 ----------
    { path: '/member/login', component: V.MemberLogin },
    { path: '/member/register', component: V.MemberRegister },
    {
      path: '/member',
      component: V.MemberLayout,
      redirect: '/member/home',
      children: [
        { path: 'home', component: V.MemberHome },
        { path: 'mall', component: V.MemberMall },
        { path: 'mine', component: V.MemberMine }
      ]
    },
    { path: '/member/appointment-book', component: V.AppointmentBook },
    { path: '/member/my-appointments', component: V.MyAppointments },
    { path: '/member/consumption', component: V.Consumption },
    { path: '/member/my-packages', component: V.MyPackages },
    { path: '/member/recharge', component: V.MemberRecharge },
    { path: '/member/invite', component: V.MemberInvite },
    { path: '/member/download-qr', component: V.DownloadQr },
    { path: '/member/profile-edit', component: V.ProfileEdit },
    { path: '/member/gift/:id', component: V.GiftDetail },
    { path: '/member/orders', component: V.OrderList },
    { path: '/member/my-qr', component: V.MyQr },
    { path: '/member/about', component: V.MemberAbout },

    // ---------- 兜底 ----------
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ];

  const router = createRouter({
    history: createWebHashHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) return savedPosition;
      return { top: 0 };
    }
  });

  /* ==================== 路由守卫 ==================== */
  router.beforeEach((to, from, next) => {
    // 管理端鉴权：/admin 开头且非登录页
    if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
      if (!localStorage.getItem('admin_auth')) {
        next('/admin/login');
        return;
      }
    }
    // 会员端鉴权：/member 开头且非登录/注册页
    if (to.path.startsWith('/member') && to.path !== '/member/login' && to.path !== '/member/register') {
      if (!localStorage.getItem('member_auth')) {
        next('/member/login');
        return;
      }
    }
    next();
  });

  /* ==================== 应用挂载 ==================== */
  const pinia = createPinia();

  const app = createApp({
    name: 'App',
    template: '<router-view />'
  });

  // 注册全局组件
  if (YA.components) {
    if (YA.components.AppHeader) app.component('AppHeader', YA.components.AppHeader);
    if (YA.components.StatCard) app.component('StatCard', YA.components.StatCard);
    if (YA.components.EmptyState) app.component('EmptyState', YA.components.EmptyState);
    if (YA.components.QrModal) app.component('QrModal', YA.components.QrModal);
  }

  app.use(pinia);
  app.use(router);
  if (VantLib) app.use(VantLib);

  // 初始化 auth store（同步读取 localStorage）
  const authStore = YA.stores.auth(pinia);
  authStore.initAuth();

  // 挂载应用
  app.mount('#app');

  // 移除加载器（淡出后移除）
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 300);
  }

  // 初始化数据同步（异步，不阻塞首屏渲染）
  const syncStore = YA.stores.sync(pinia);
  syncStore.init().then(() => {
    console.log('[YA] 数据同步初始化完成');
  }).catch(e => {
    console.error('[YA] 数据同步初始化失败:', e);
  });

  console.log('[YA] 应用启动完成');
})();
