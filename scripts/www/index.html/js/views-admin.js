/**
 * 颐安堂预约管理系统 - 管理端 Vue3 组件
 * 包含 20 个管理端页面组件，全部注册到 YA.views
 * 依赖：Vue / Vant / dayjs / echarts / VueRouter（全局可用）
 */
(function () {
  'use strict';

  var Vue = window.Vue;
  var Vant = window.Vant;
  var dayjs = window.dayjs;
  var echarts = window.echarts;

  var ref = Vue.ref, reactive = Vue.reactive, computed = Vue.computed,
    onMounted = Vue.onMounted, watch = Vue.watch, nextTick = Vue.nextTick;
  var onUnmounted = Vue.onUnmounted || function () {};

  var VR = window.VueRouter || {};
  var useRouter = VR.useRouter || function () { return null; };
  var useRoute = VR.useRoute || function () { return null; };

  var DS = YA.dataService;
  var U = YA.utils;

  YA.views = YA.views || {};
  var V = YA.views;

  // ========== 公共 helper ==========
  function st(group, val) {
    var m = YA.statusText[group];
    return (m && m[val]) ? m[val] : (val || '');
  }
  function tagc(group, val) {
    var m = YA.statusText[group];
    return (m && m[val]) ? m[val] : 'tag-gray';
  }
  function money(n) { try { return U.formatMoney(n); } catch (e) { return Number(n || 0).toFixed(2); } }
  function fdate(d) { try { return U.formatDate(d); } catch (e) { return d ? dayjs(d).format('YYYY-MM-DD') : ''; } }
  function ftime(d) { try { return U.formatDateTime(d); } catch (e) { return d ? dayjs(d).format('YYYY-MM-DD HH:mm') : ''; } }
  function frel(d) { try { return U.formatRelative(d); } catch (e) { return d ? dayjs(d).fromNow() : ''; } }
  function maskPhone(p) { try { return U.maskPhone(p); } catch (e) { return p || ''; } }
  function genderText(v) { return { male: '男', female: '女', unknown: '保密' }[v] || '保密'; }
  function nav(router, path) { try { if (router && router.push) router.push(path); } catch (e) {} }
  function navBack(router) { try { if (router && router.back) router.back(); else window.history.back(); } catch (e) { window.history.back(); } }
  function toast(msg, type) { try { Vant.showToast({ type: type || 'text', message: msg }); } catch (e) {} }
  function toastSuccess(msg) { toast(msg, 'success'); }
  function toastFail(msg) { toast(msg, 'fail'); }
  function confirmDialog(message, title) { try { return Vant.showConfirmDialog({ title: title || '提示', message: message }); } catch (e) { return Promise.reject(e); } }
  function infoDialog(message, title) { try { return Vant.showDialog({ title: title || '提示', message: message }); } catch (e) {} }

  var H = { st: st, tagc: tagc, money: money, fdate: fdate, ftime: ftime, frel: frel, maskPhone: maskPhone, genderText: genderText };

  // ====================================================================
  // 1. AdminLayout - 底部5个tab布局
  // ====================================================================
  V.AdminLayout = {
    template: `
    <div class="admin-layout" style="min-height:100vh;background:#f6f1ea;">
      <router-view />
      <van-tabbar route v-model="active" active-color="#d4a017" inactive-color="#7a6a55">
        <van-tabbar-item replace to="/admin/home" icon="wap-home-o">首页</van-tabbar-item>
        <van-tabbar-item replace to="/admin/members" icon="friends-o">会员</van-tabbar-item>
        <van-tabbar-item replace to="/admin/cashier" icon="balance-o">收银</van-tabbar-item>
        <van-tabbar-item replace to="/admin/projects" icon="apps-o">项目</van-tabbar-item>
        <van-tabbar-item replace to="/admin/mine" icon="manager-o">我的</van-tabbar-item>
      </van-tabbar>
    </div>`,
    setup: function () {
      var active = ref(0);
      return { active: active };
    }
  };

  // ====================================================================
  // 2. AdminLogin - 管理端登录
  // ====================================================================
  V.AdminLogin = {
    template: `
    <div class="admin-login" style="min-height:100vh;background:linear-gradient(160deg,#3a2410 0%,#6b4423 55%,#d4a017 100%);padding:48px 24px;">
      <div style="text-align:center;padding-top:56px;color:#fff;">
        <div style="width:72px;height:72px;margin:0 auto;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;">颐</div>
        <div style="font-size:26px;font-weight:bold;margin-top:16px;">颐安堂</div>
        <div style="font-size:13px;opacity:.85;margin-top:6px;">预约管理系统 · 管理端</div>
      </div>
      <div style="margin-top:44px;background:#fff;border-radius:16px;padding:24px 20px;box-shadow:0 8px 30px rgba(0,0,0,.18);">
        <van-cell-group :border="false">
          <van-field v-model="form.account" label="账号" placeholder="请输入账号" clearable left-icon="manager-o" />
          <van-field v-model="form.password" type="password" label="密码" placeholder="请输入密码" clearable left-icon="lock-o" @keyup.enter="onLogin" />
        </van-cell-group>
        <div style="color:#b08d57;font-size:12px;margin:10px 4px 0;">默认账号：admin / admin123</div>
        <div style="padding:0 4px;margin-top:16px;">
          <van-button type="primary" block round :loading="loading" color="#d4a017" @click="onLogin">登 录</van-button>
        </div>
      </div>
      <div style="text-align:center;color:rgba(255,255,255,.6);font-size:12px;margin-top:40px;">© 2026 颐安堂 · 传承中医养生文化</div>
    </div>`,
    setup: function () {
      var router = useRouter();
      var form = reactive({ account: '', password: '' });
      var loading = ref(false);
      function onLogin() {
        if (!form.account || !form.password) { toast('请输入账号和密码'); return; }
        loading.value = true;
        YA.authService.adminLogin(form.account, form.password).then(function (res) {
          if (res && res.success) { toastSuccess('登录成功'); nav(router, '/admin/home'); }
          else { toastFail((res && res.message) || '登录失败'); }
        }).catch(function () { toastFail('登录失败，请重试'); }).finally(function () { loading.value = false; });
      }
      return { form: form, loading: loading, onLogin: onLogin };
    }
  };

  // ====================================================================
  // 3. AdminHome - 管理首页
  // ====================================================================
  V.AdminHome = {
    template: `
    <div class="page" style="padding-bottom:70px;">
      <app-header title="颐安堂管理" />
      <div style="padding:12px;">
        <div style="background:linear-gradient(135deg,#d4a017,#c0532a);border-radius:14px;padding:18px;color:#fff;">
          <div style="font-size:17px;font-weight:bold;">欢迎回来，{{ adminName }}</div>
          <div style="font-size:12px;opacity:.85;margin-top:6px;">{{ ftime(nowText) }}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px;">
          <div @click="go('/admin/cashier-checkout')" style="background:#fff;border-radius:12px;padding:18px 12px;text-align:center;">
            <van-icon name="balance-o" size="30" color="#d4a017" /><div style="margin-top:8px;font-size:14px;color:#6b4423;">快速收银</div>
          </div>
          <div @click="go('/admin/member-add')" style="background:#fff;border-radius:12px;padding:18px 12px;text-align:center;">
            <van-icon name="add-o" size="30" color="#c0532a" /><div style="margin-top:8px;font-size:14px;color:#6b4423;">新增会员</div>
          </div>
          <div @click="go('/admin/appointments')" style="background:#fff;border-radius:12px;padding:18px 12px;text-align:center;">
            <van-icon name="calendar-o" size="30" color="#d4a017" /><div style="margin-top:8px;font-size:14px;color:#6b4423;">预约管理</div>
          </div>
          <div @click="go('/admin/projects')" style="background:#fff;border-radius:12px;padding:18px 12px;text-align:center;">
            <van-icon name="apps-o" size="30" color="#c0532a" /><div style="margin-top:8px;font-size:14px;color:#6b4423;">项目管理</div>
          </div>
        </div>
        <div style="margin-top:18px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:8px;">今日概览</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <stat-card label="今日营收" :value="'¥' + money(todayRevenue)" />
            <stat-card label="今日预约" :value="todayAppointments" />
            <stat-card label="新增会员" :value="todayMembers" />
            <stat-card label="待处理预约" :value="pendingCount" />
          </div>
        </div>
        <div style="margin-top:18px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-weight:bold;color:#6b4423;">最近预约</span>
            <span style="color:#d4a017;font-size:12px;" @click="go('/admin/appointments')">更多 ></span>
          </div>
          <van-cell-group inset v-if="appointments.length">
            <van-cell v-for="a in appointments" :key="a.id" @click="go('/admin/appointments')" is-link>
              <template #title>
                <div style="font-weight:600;">{{ a._memberName || '散客' }}</div>
                <div style="font-size:12px;color:#999;">{{ a._projectName || '未选项目' }} · {{ ftime(a.start_at) }}</div>
              </template>
              <template #right-icon>
                <van-tag :class="tagc('appointmentTag', a.status)" style="margin-left:8px;">{{ st('appointment', a.status) }}</van-tag>
              </template>
            </van-cell>
          </van-cell-group>
          <empty-state v-else text="暂无预约" />
        </div>
      </div>
    </div>`,
    setup: function () {
      var router = useRouter();
      var adminName = ref('管理员');
      var nowText = ref(U.now());
      var todayRevenue = ref(0);
      var todayAppointments = ref(0);
      var todayMembers = ref(0);
      var pendingCount = ref(0);
      var appointments = ref([]);
      function go(p) { nav(router, p); }
      onMounted(function () {
        try { var a = YA.authService.getAdminAuth(); if (a) adminName.value = a.name || '管理员'; } catch (e) {}
        loadData();
      });
      function loadData() {
        Promise.all([
          DS.list('orders', { page: 1, pageSize: 999999 }),
          DS.list('appointments', { page: 1, pageSize: 999999 }),
          DS.list('members', { page: 1, pageSize: 999999 }),
          DS.list('projects', { page: 1, pageSize: 999999 })
        ]).then(function (res) {
          var orders = res[0].data || [];
          var appts = res[1].data || [];
          var members = res[2].data || [];
          var projects = res[3].data || [];
          var memMap = {}; members.forEach(function (m) { memMap[m.id] = m; });
          var projMap = {}; projects.forEach(function (p) { projMap[p.id] = p; });
          appts.forEach(function (a) { a._memberName = memMap[a.member_id] ? memMap[a.member_id].name : ''; a._projectName = projMap[a.project_id] ? projMap[a.project_id].name : ''; });
          todayRevenue.value = orders.filter(function (o) { return o.status === 'paid' && o.created_at && dayjs(o.created_at).isSame(dayjs(), 'day'); }).reduce(function (s, o) { return s + Number(o.paid_amount || 0); }, 0);
          todayAppointments.value = appts.filter(function (a) { return a.start_at && dayjs(a.start_at).isSame(dayjs(), 'day'); }).length;
          pendingCount.value = appts.filter(function (a) { return a.status === 'pending'; }).length;
          todayMembers.value = members.filter(function (m) { return m.created_at && dayjs(m.created_at).isSame(dayjs(), 'day'); }).length;
          appointments.value = appts.slice(0, 5);
        }).catch(function (e) { console.error(e); });
      }
      return Object.assign({ adminName: adminName, nowText: nowText, todayRevenue: todayRevenue, todayAppointments: todayAppointments, todayMembers: todayMembers, pendingCount: pendingCount, appointments: appointments, go: go }, H);
    }
  };

  // ====================================================================
  // 4. AdminMembers - 会员列表
  // ====================================================================
  V.AdminMembers = {
    template: `
    <div class="page" style="padding-bottom:70px;">
      <app-header title="会员管理" />
      <div style="padding:12px;">
        <van-search v-model="keyword" placeholder="搜索姓名 / 手机号" shape="round" @search="onSearch" @clear="onSearch" />
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <div @click="showLevel = true" style="flex:1;background:#fff;border-radius:8px;padding:9px 12px;font-size:13px;color:#6b4423;display:flex;align-items:center;justify-content:space-between;">
            <span>{{ levelFilterText }}</span><van-icon name="arrow-down" />
          </div>
          <van-button icon="plus" type="primary" size="small" color="#d4a017" @click="goAdd">新增会员</van-button>
        </div>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list v-model:loading="loading" :finished="finished" finished-text="共 {{ list.length }} 位会员" @load="onLoad">
            <div v-for="m in list" :key="m.id" @click="goDetail(m.id)" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;display:flex;align-items:center;">
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#d4a017,#c0532a);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:bold;">{{ (m.name||'会').charAt(0) }}</div>
              <div style="flex:1;margin-left:12px;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-weight:600;color:#3a2410;">{{ m.name }}</span>
                  <van-tag :class="tagc('memberLevelTag', m.level)">{{ st('memberLevel', m.level) }}</van-tag>
                  <van-tag v-if="m.status!=='active'" type="danger" plain>已停用</van-tag>
                </div>
                <div style="font-size:12px;color:#999;margin-top:4px;">{{ maskPhone(m.phone) }}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:13px;color:#c0532a;font-weight:600;">¥{{ money(m.balance) }}</div>
                <div style="font-size:11px;color:#999;">积分 {{ m.points || 0 }}</div>
              </div>
            </div>
            <empty-state v-if="!list.length && !loading" text="暂无会员" />
          </van-list>
        </van-pull-refresh>
      </div>
      <van-action-sheet v-model:show="showLevel" :actions="levelActions" cancel-text="取消" close-on-click-action @select="pickLevel" />
    </div>`,
    setup: function () {
      var router = useRouter();
      var keyword = ref('');
      var levelFilter = ref('');
      var list = ref([]);
      var loading = ref(false);
      var finished = ref(true);
      var refreshing = ref(false);
      var showLevel = ref(false);
      var levelActions = [
        { name: '全部等级', value: '' },
        { name: '普通会员', value: 'normal' },
        { name: '银卡会员', value: 'silver' },
        { name: '金卡会员', value: 'gold' },
        { name: 'VIP会员', value: 'vip' }
      ];
      var levelFilterText = computed(function () {
        var a = levelActions.find(function (x) { return x.value === levelFilter.value; });
        return a ? a.name : '全部等级';
      });
      function loadAll() {
        refreshing.value = true;
        DS.list('members', { page: 1, pageSize: 999999 }).then(function (res) {
          var data = res.data || [];
          if (keyword.value) {
            var kw = keyword.value.toLowerCase();
            data = data.filter(function (m) { return (m.name && m.name.toLowerCase().indexOf(kw) >= 0) || (m.phone && m.phone.indexOf(kw) >= 0); });
          }
          if (levelFilter.value) data = data.filter(function (m) { return m.level === levelFilter.value; });
          list.value = data;
        }).catch(function (e) { console.error(e); }).finally(function () { refreshing.value = false; loading.value = false; finished.value = true; });
      }
      function onSearch() { loadAll(); }
      function onRefresh() { loadAll(); }
      function onLoad() { loading.value = false; finished.value = true; }
      function pickLevel(a) { levelFilter.value = a.value; loadAll(); }
      function goAdd() { nav(router, '/admin/member-add'); }
      function goDetail(id) { nav(router, '/admin/member/' + id); }
      onMounted(loadAll);
      return Object.assign({ keyword: keyword, levelFilter: levelFilter, list: list, loading: loading, finished: finished, refreshing: refreshing, showLevel: showLevel, levelActions: levelActions, levelFilterText: levelFilterText, onSearch: onSearch, onRefresh: onRefresh, onLoad: onLoad, pickLevel: pickLevel, goAdd: goAdd, goDetail: goDetail }, H);
    }
  };

  // ====================================================================
  // 5. AdminCashier - 快速收银（tab页）
  // ====================================================================
  V.AdminCashier = {
    template: `
    <div class="page" style="padding-bottom:120px;">
      <app-header title="快速收银" />
      <div style="padding:12px;">
        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">选择会员</div>
          <van-search v-model="phone" placeholder="输入姓名 / 手机号搜索" shape="round" @search="searchMember" />
          <div v-if="member" style="margin-top:8px;padding:10px;background:#faf4ea;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <span style="font-weight:600;">{{ member.name }}</span>
              <span style="color:#999;font-size:12px;margin-left:8px;">{{ maskPhone(member.phone) }}</span>
              <van-tag :class="tagc('memberLevelTag', member.level)" style="margin-left:6px;">{{ st('memberLevel', member.level) }}</van-tag>
            </div>
            <div style="text-align:right;font-size:12px;color:#c0532a;">余额 ¥{{ money(member.balance) }}</div>
          </div>
          <van-button v-else size="small" color="#d4a017" plain @click="searchMember" style="margin-top:8px;">选择会员</van-button>
        </div>

        <div style="background:#fff;border-radius:12px;padding:14px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">选择项目</div>
          <van-tabs v-model:active="activeCat" shrink color="#d4a017">
            <van-tab v-for="c in categories" :key="c" :title="c" :name="c">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 0;">
                <div v-for="p in filteredProjects" :key="p.id" @click="toggleProject(p)"
                  :style="'border-radius:8px;padding:10px;border:1px solid ' + (selected[p.id] ? '#d4a017' : '#eee') + ';background:' + (selected[p.id] ? '#faf4ea' : '#fff') + ';'">
                  <div style="font-size:13px;font-weight:600;color:#3a2410;">{{ p.name }}</div>
                  <div style="font-size:12px;color:#c0532a;margin-top:4px;">¥{{ money(p.price) }} / {{ p.duration_min }}分钟</div>
                  <div v-if="selected[p.id]" style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;">
                    <van-button size="mini" plain @click.stop="changeQty(p,-1)">-</van-button>
                    <span style="font-size:13px;">×{{ selected[p.id] }}</span>
                    <van-button size="mini" plain @click.stop="changeQty(p,1)">+</van-button>
                  </div>
                </div>
              </div>
            </van-tab>
          </van-tabs>
        </div>
      </div>

      <!-- 套餐抵扣 -->
      <div v-if="member && hasPackageAvailable" style="background:#fff;border-radius:12px;padding:14px;margin:0 12px 12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="font-weight:bold;color:#6b4423;">使用套餐抵扣</div>
          <van-switch v-model="usePackage" size="20px" active-color="#d4a017" />
        </div>
        <div v-if="usePackage" style="margin-top:8px;font-size:12px;color:#999;">{{ packageDesc }}</div>
      </div>

      <!-- 支付方式 -->
      <div style="background:#fff;border-radius:12px;padding:14px;margin:0 12px 12px;">
        <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">支付方式</div>
        <div style="display:flex;gap:8px;">
          <div v-for="a in payActions" :key="a.value" @click="pickPay(a)"
            :style="'flex:1;text-align:center;padding:8px;border-radius:8px;border:1px solid ' + (payMethod === a.value ? '#d4a017' : '#eee') + ';background:' + (payMethod === a.value ? '#faf4ea' : '#fff') + ';'">
            <div style="font-size:20px;">{{ a.icon }}</div>
            <div style="font-size:12px;margin-top:2px;" :style="payMethod === a.value ? 'color:#d4a017;font-weight:600;' : 'color:#666;'">{{ a.name }}</div>
          </div>
        </div>
      </div>

      <!-- 预计积分 -->
      <div style="background:#fff;border-radius:12px;padding:14px;margin:0 12px 12px;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:13px;color:#999;">本次消费预计积分</span>
        <span style="font-size:16px;color:#d4a017;font-weight:bold;">+{{ pointsEarned }}</span>
      </div>

      <div style="position:fixed;left:0;right:0;bottom:50px;background:#fff;border-top:1px solid #eee;padding:10px 14px;display:flex;align-items:center;gap:10px;z-index:10;">
        <div style="flex:1;">
          <div style="font-size:12px;color:#999;">服务技师</div>
          <div @click="showStaff = true" style="font-size:13px;color:#6b4423;">{{ staffName || '不指定技师' }} <van-icon name="arrow" /></div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:#999;">合计</div>
          <div style="font-size:18px;color:#c0532a;font-weight:bold;">¥{{ money(total) }}</div>
        </div>
        <van-button type="primary" round :loading="submitting" color="linear-gradient(90deg,#d4a017,#c0532a)" style="flex:0 0 auto;" @click="submit">确认开单</van-button>
      </div>

      <van-popup v-model:show="showMember" position="bottom" round style="max-height:60%;">
        <div style="padding:12px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:10px;">选择会员</div>
          <van-cell v-for="m in memberResults" :key="m.id" :title="m.name" :label="maskPhone(m.phone)" is-link @click="pickMember(m)">
            <template #value><span style="color:#c0532a;">¥{{ money(m.balance) }}</span></template>
          </van-cell>
          <empty-state v-if="!memberResults.length" text="未找到会员" />
        </div>
      </van-popup>
      <van-action-sheet v-model:show="showStaff" :actions="staffActions" cancel-text="取消" close-on-click-action @select="pickStaff" />
    </div>`,
    setup: function () {
      var router = useRouter();
      var phone = ref('');
      var member = ref(null);
      var showMember = ref(false);
      var memberResults = ref([]);
      var projects = ref([]);
      var categories = ref(['全部']);
      var activeCat = ref('全部');
      var selected = reactive({});
      var staffs = ref([]);
      var staffId = ref('');
      var showStaff = ref(false);
      var submitting = ref(false);
      var payMethod = ref('cash');
      var showPay = ref(false);
      var usePackage = ref(false);
      var memberPkgs = ref([]);

      var staffName = computed(function () { var s = staffs.value.find(function (x) { return x.id === staffId.value; }); return s ? s.name : ''; });
      var payActions = [
        { name: '现金', value: 'cash', icon: '💵' },
        { name: '余额', value: 'balance', icon: '💰' },
        { name: '微信', value: 'wechat', icon: '💚' },
        { name: '支付宝', value: 'alipay', icon: '🔵' }
      ];
      var pointsEarned = computed(function () { return Math.floor(total.value); });
      var hasPackageAvailable = computed(function () { return memberPkgs.value.length > 0; });
      var packageDesc = computed(function () {
        return memberPkgs.value.map(function (mp) {
          return mp.name + '（剩余' + mp.remain_times + '次）';
        }).join('；');
      });

      function pickPay(a) { payMethod.value = a.value; }
      var staffActions = computed(function () {
        var arr = [{ name: '不指定技师', value: '' }];
        staffs.value.forEach(function (s) { arr.push({ name: s.name + '（' + st('staffRole', s.role) + '）', value: s.id }); });
        return arr;
      });
      var selectedList = computed(function () {
        return projects.value.filter(function (p) { return selected[p.id]; }).map(function (p) { return { project: p, qty: selected[p.id] }; });
      });
      var total = computed(function () { return selectedList.value.reduce(function (s, it) { return s + Number(it.project.price || 0) * it.qty; }, 0); });
      var filteredProjects = computed(function () {
        if (activeCat.value === '全部') return projects.value;
        return projects.value.filter(function (p) { return (p.category || '其他') === activeCat.value; });
      });
      function load() {
        DS.list('projects', { where: { status: 'active' }, page: 1, pageSize: 999 }).then(function (r) {
          projects.value = r.data || [];
          var cats = ['全部'];
          projects.value.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
          categories.value = cats;
        });
        DS.list('staff', { where: { status: 'active' }, page: 1, pageSize: 999 }).then(function (r) { staffs.value = r.data || []; });
      }
      function searchMember() {
        DS.list('members', { page: 1, pageSize: 999999 }).then(function (r) {
          var data = r.data || [];
          if (phone.value) {
            var kw = phone.value.toLowerCase();
            data = data.filter(function (m) { return (m.name && m.name.toLowerCase().indexOf(kw) >= 0) || (m.phone && m.phone.indexOf(kw) >= 0); });
          }
          memberResults.value = data.slice(0, 30);
          showMember.value = true;
        });
      }
      function pickMember(m) {
        member.value = m; phone.value = m.phone; showMember.value = false;
        if (m.id) {
          DS.list('member_packages', { where: { member_id: m.id, status: 'active' }, page: 1, pageSize: 999 })
            .then(function (r) {
              var pkgs = (r.data || []).filter(function (mp) { return mp.remain_times > 0; });
              DS.list('packages', { page: 1, pageSize: 999 }).then(function (r2) {
                var pkgMap = {};
                (r2.data || []).forEach(function (p) { pkgMap[p.id] = p; });
                memberPkgs.value = pkgs.map(function (mp) {
                  var pkg = pkgMap[mp.package_id];
                  return { id: mp.id, name: (pkg && pkg.name) || '套餐', remain_times: mp.remain_times, package_id: mp.package_id };
                });
              });
            });
        }
      }
      function pickStaff(a) { staffId.value = a.value; }
      function toggleProject(p) { if (selected[p.id]) { delete selected[p.id]; } else { selected[p.id] = 1; } }
      function changeQty(p, d) { var q = (selected[p.id] || 0) + d; if (q <= 0) delete selected[p.id]; else selected[p.id] = q; }
      function submit() {
        if (!member.value) { toast('请选择会员'); return; }
        if (selectedList.value.length === 0) { toast('请选择项目'); return; }
        if (payMethod.value === 'balance' && Number(member.value.balance || 0) < total.value) { toast('会员余额不足'); return; }
        submitting.value = true;
        var items = selectedList.value.map(function (it) {
          var sub = Number(it.project.price || 0) * it.qty;
          return { project_id: it.project.id, name: it.project.name, price: Number(it.project.price || 0), qty: it.qty, subtotal: sub };
        });
        var paid = Math.round(total.value * 100) / 100;
        var m = member.value;
        var orderData = { order_no: U.genOrderNo(), member_id: m.id, staff_id: staffId.value || null, items: items, original_amount: paid, discount_amount: 0, paid_amount: paid, pay_method: payMethod.value, points_earned: Math.floor(paid), status: 'paid' };
        DS.create('orders', orderData).then(function (order) {
          var chain = Promise.resolve();
          if (orderData.points_earned > 0) { chain = chain.then(function () { return DS.update('members', m.id, { points: (m.points || 0) + orderData.points_earned }); }); }
          if (payMethod.value === 'balance' && paid > 0) { chain = chain.then(function () { return DS.update('members', m.id, { balance: Math.max(0, (m.balance || 0) - paid) }); }); }
          items.forEach(function (it) {
            if (it.member_package_id) { chain = chain.then(function () { return DS.get('member_packages', it.member_package_id); }).then(function (mp) { if (mp && mp.remain_times > 0) return DS.update('member_packages', mp.id, { remain_times: mp.remain_times - 1 }); }); }
          });
          if (m.referrer_id) {
            chain = chain.then(function () { return DS.getSetting('invite_commission_rate'); }).then(function (rv) { var rate = parseFloat(rv) || 10; return DS.create('commissions', { referrer_id: m.referrer_id, source_member_id: m.id, source_type: '消费', source_id: order.id, rate: rate, amount: Math.round(paid * rate) / 100, status: 'pending', created_at: U.now(), updated_at: U.now() }); });
          }
          return chain;
        }).then(function () {
          infoDialog('实付：¥' + money(paid) + '\\n支付：' + st('payMethod', payMethod.value) + '\\n积分：+' + Math.floor(paid), '开单成功').then(function () { reset(); });
        }).catch(function () { toastFail('开单失败'); }).finally(function () { submitting.value = false; });
      }
      function reset() { member.value = null; phone.value = ''; staffId.value = ''; payMethod.value = 'cash'; usePackage.value = false; memberPkgs.value = []; Object.keys(selected).forEach(function (k) { delete selected[k]; }); }
      onMounted(load);
      return Object.assign({ phone: phone, member: member, showMember: showMember, memberResults: memberResults, projects: projects, categories: categories, activeCat: activeCat, selected: selected, staffs: staffs, staffId: staffId, showStaff: showStaff, payMethod: payMethod, showPay: showPay, usePackage: usePackage, submitting: submitting, payActions: payActions, staffName: staffName, staffActions: staffActions, filteredProjects: filteredProjects, selectedList: selectedList, total: total, pointsEarned: pointsEarned, hasPackageAvailable: hasPackageAvailable, packageDesc: packageDesc, searchMember: searchMember, pickMember: pickMember, pickStaff: pickStaff, pickPay: pickPay, toggleProject: toggleProject, changeQty: changeQty, submit: submit }, H);
    }
  };

  // ====================================================================
  // 6. AdminProjects - 项目与套餐管理
  // ====================================================================
  V.AdminProjects = {
    template: `
    <div class="page" style="padding-bottom:70px;">
      <app-header title="项目管理" />
      <van-tabs v-model:active="activeTab" sticky color="#d4a017">
        <van-tab title="服务项目">
          <div style="padding:12px;">
            <div style="margin-bottom:10px;"><van-button icon="plus" type="primary" size="small" color="#d4a017" @click="goProjectEdit()">新增项目</van-button></div>
            <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
              <van-cell-group inset>
                <van-cell v-for="p in projects" :key="p.id" @click="goProjectEdit(p.id)" is-link>
                  <template #title>
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                      <div>
                        <div style="font-weight:600;color:#3a2410;">{{ p.name }} <van-tag plain type="primary" style="margin-left:4px;">{{ p.category }}</van-tag></div>
                        <div style="font-size:12px;color:#999;margin-top:2px;">{{ p.duration_min }}分钟 · 排序 {{ p.sort }}</div>
                      </div>
                      <div style="color:#c0532a;font-weight:600;">¥{{ money(p.price) }}</div>
                    </div>
                  </template>
                  <template #right-icon>
                    <van-tag v-if="p.status!=='active'" type="danger" plain>已停用</van-tag>
                  </template>
                </van-cell>
              </van-cell-group>
              <empty-state v-if="!projects.length" text="暂无项目" />
            </van-pull-refresh>
          </div>
        </van-tab>
        <van-tab title="套餐">
          <div style="padding:12px;">
            <div style="margin-bottom:10px;"><van-button icon="plus" type="primary" size="small" color="#d4a017" @click="goPackageEdit()">新增套餐</van-button></div>
            <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
              <div v-for="p in packages" :key="p.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                  <div @click="goPackageEdit(p.id)" style="flex:1;">
                    <div style="font-weight:600;color:#3a2410;">{{ p.name }} <van-tag v-if="p.status!=='active'" type="danger" plain>已停用</van-tag></div>
                    <div style="font-size:12px;color:#999;margin-top:4px;">有效期 {{ p.validity_days }} 天</div>
                    <div style="margin-top:8px;">
                      <van-tag v-for="it in pkgItems(p.id)" :key="it.id" plain type="warning" style="margin-right:4px;margin-bottom:4px;">{{ projName(it.project_id) }} ×{{ it.times }}</van-tag>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <div style="color:#c0532a;font-weight:600;font-size:16px;">¥{{ money(p.price) }}</div>
                    <div style="font-size:11px;color:#999;text-decoration:line-through;">¥{{ money(p.original_price) }}</div>
                    <van-button size="mini" plain type="danger" @click="delPackage(p)" style="margin-top:6px;">删除</van-button>
                  </div>
                </div>
              </div>
              <empty-state v-if="!packages.length" text="暂无套餐" />
            </van-pull-refresh>
          </div>
        </van-tab>
      </van-tabs>
    </div>`,
    setup: function () {
      var router = useRouter();
      var activeTab = ref(0);
      var projects = ref([]);
      var packages = ref([]);
      var packageItems = ref([]);
      var refreshing = ref(false);
      function load() {
        refreshing.value = true;
        Promise.all([
          DS.list('projects', { page: 1, pageSize: 999999 }),
          DS.list('packages', { page: 1, pageSize: 999999 }),
          DS.list('package_items', { page: 1, pageSize: 9999 })
        ]).then(function (res) {
          projects.value = res[0].data || [];
          packages.value = res[1].data || [];
          packageItems.value = res[2].data || [];
        }).finally(function () { refreshing.value = false; });
      }
      function onRefresh() { load(); }
      function goProjectEdit(id) { nav(router, id ? ('/admin/project-edit/' + id) : '/admin/project-edit'); }
      function goPackageEdit(id) { nav(router, id ? ('/admin/package-edit/' + id) : '/admin/package-edit'); }
      function delProject(p) { confirmDialog('确定删除项目「' + p.name + '」吗？').then(function () { return DS.remove('projects', p.id); }).then(function () { toastSuccess('已删除'); load(); }).catch(function () {}); }
      function delPackage(p) { confirmDialog('确定删除套餐「' + p.name + '」吗？将同时删除包含的项目。').then(function () {
        var items = packageItems.value.filter(function (i) { return i.package_id === p.id; });
        var chain = Promise.resolve();
        items.forEach(function (it) { chain = chain.then(function () { return DS.remove('package_items', it.id); }); });
        return chain.then(function () { return DS.remove('packages', p.id); });
      }).then(function () { toastSuccess('已删除'); load(); }).catch(function () {}); }
      function pkgItems(id) { return packageItems.value.filter(function (i) { return i.package_id === id; }); }
      function projName(id) { var p = projects.value.find(function (x) { return x.id === id; }); return p ? p.name : '未知'; }
      onMounted(load);
      return Object.assign({ activeTab: activeTab, projects: projects, packages: packages, refreshing: refreshing, onRefresh: onRefresh, goProjectEdit: goProjectEdit, goPackageEdit: goPackageEdit, delProject: delProject, delPackage: delPackage, pkgItems: pkgItems, projName: projName }, H);
    }
  };

  // ====================================================================
  // 7. AdminMine - 我的
  // ====================================================================
  V.AdminMine = {
    template: `
    <div class="page" style="padding-bottom:70px;">
      <app-header title="我的" />
      <div style="padding:12px;">
        <div style="background:linear-gradient(135deg,#d4a017,#c0532a);border-radius:14px;padding:18px;color:#fff;display:flex;align-items:center;">
          <div style="width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;">{{ (admin.name||'管').charAt(0) }}</div>
          <div style="margin-left:14px;">
            <div style="font-size:17px;font-weight:bold;">{{ admin.name || '管理员' }}</div>
            <div style="font-size:12px;opacity:.85;margin-top:4px;">{{ st('staffRole', admin.role) }} · {{ admin.login_account || '' }}</div>
          </div>
        </div>
        <van-cell-group inset style="margin-top:14px;">
          <van-cell title="预约管理" icon="calendar-o" is-link @click="go('/admin/appointments')" />
          <van-cell title="兑换订单" icon="gift-o" is-link @click="go('/admin/orders-redemption')" />
          <van-cell title="数据统计" icon="chart-trending-o" is-link @click="go('/admin/stats')" />
          <van-cell title="员工管理" icon="friends-o" is-link @click="go('/admin/staff')" />
          <van-cell title="公告管理" icon="volume-o" is-link @click="go('/admin/announcement')" />
          <van-cell title="佣金管理" icon="balance-pay" is-link @click="go('/admin/commission')" />
          <van-cell title="充值规则" icon="balance-list-o" is-link @click="go('/admin/recharge-rules')" />
        </van-cell-group>
        <van-cell-group inset style="margin-top:14px;">
          <van-cell title="系统设置" icon="setting-o" is-link @click="go('/admin/settings')" />
          <van-cell title="修改密码" icon="closed-eye" is-link @click="showPwd = true" />
          <van-cell title="同步状态" icon="replay" is-link @click="showSync = true" />
          <van-cell title="关于" icon="info-o" is-link @click="showAbout = true" />
        </van-cell-group>
        <div style="padding:20px 16px;">
          <van-button block round color="#c0532a" @click="onLogout">退出登录</van-button>
        </div>
      </div>

      <van-popup v-model:show="showPwd" round position="center" style="width:88%;max-width:360px;">
        <div style="padding:20px;">
          <div style="font-size:16px;font-weight:bold;text-align:center;margin-bottom:14px;color:#3a2410;">修改密码</div>
          <van-field v-model="pwdForm.oldPwd" type="password" label="原密码" placeholder="请输入原密码" />
          <van-field v-model="pwdForm.newPwd" type="password" label="新密码" placeholder="请输入新密码" />
          <van-field v-model="pwdForm.confirmPwd" type="password" label="确认密码" placeholder="请再次输入" />
          <div style="margin-top:16px;"><van-button block round color="#d4a017" @click="onChangePwd">确认修改</van-button></div>
        </div>
      </van-popup>
      <van-dialog v-model:show="showAbout" title="关于颐安堂" confirm-button-color="#d4a017">
        <div style="padding:16px;font-size:13px;color:#666;line-height:1.8;">
          <div>颐安堂预约管理系统</div>
          <div>版本：{{ version }}</div>
          <div>传承中医养生文化 · 呵护您的身心健康</div>
        </div>
      </van-dialog>
      <van-dialog v-model:show="showSync" title="同步状态" confirm-button-color="#d4a017">
        <div style="padding:16px;font-size:13px;color:#666;line-height:2;">
          <div>当前模式：{{ syncMode === 'local' ? '本地存储' : '云端同步' }}</div>
          <div>上次同步：{{ syncTime || '尚未同步' }}</div>
          <van-button size="small" color="#d4a017" @click="onSyncNow" style="margin-top:8px;">立即同步</van-button>
        </div>
      </van-dialog>
    </div>`,
    setup: function () {
      var router = useRouter();
      var admin = ref({});
      var version = ref('1.0.0');
      var showPwd = ref(false);
      var showAbout = ref(false);
      var showSync = ref(false);
      var syncMode = ref('local');
      var syncTime = ref('');
      var pwdForm = reactive({ oldPwd: '', newPwd: '', confirmPwd: '' });
      function go(p) { nav(router, p); }
      onMounted(function () {
        try { var a = YA.authService.getAdminAuth(); if (a) { admin.value = a; DS.get('staff', a.id).then(function (s) { if (s) admin.value = Object.assign({}, a, s); }); } } catch (e) {}
        DS.getSetting('app_version').then(function (v) { if (v) version.value = v; }).catch(function () {});
        syncMode.value = DS.mode || 'local';
        syncTime.value = localStorage.getItem('yiantang_last_sync') || '';
      });
      function onChangePwd() {
        if (!pwdForm.oldPwd || !pwdForm.newPwd) { toast('请填写完整'); return; }
        if (pwdForm.newPwd !== pwdForm.confirmPwd) { toast('两次密码不一致'); return; }
        var a = YA.authService.getAdminAuth();
        DS.get('staff', a.id).then(function (staff) {
          if (!staff) { toastFail('账号不存在'); return; }
          if (U.hashPassword(pwdForm.oldPwd) !== staff.password_hash) { toastFail('原密码错误'); return; }
          DS.update('staff', a.id, { password_hash: U.hashPassword(pwdForm.newPwd) }).then(function () {
            toastSuccess('修改成功'); showPwd.value = false; pwdForm.oldPwd = ''; pwdForm.newPwd = ''; pwdForm.confirmPwd = '';
          });
        });
      }
      function onSyncNow() {
        try { window.dispatchEvent(new CustomEvent('yiantang:sync')); var t = U.now(); localStorage.setItem('yiantang_last_sync', t); syncTime.value = t; toastSuccess('同步完成'); } catch (e) { toastFail('同步失败'); }
      }
      function onLogout() {
        confirmDialog('确定要退出登录吗？').then(function () { YA.authService.adminLogout(); nav(router, '/admin/login'); }).catch(function () {});
      }
      return Object.assign({ admin: admin, version: version, showPwd: showPwd, showAbout: showAbout, showSync: showSync, syncMode: syncMode, syncTime: syncTime, pwdForm: pwdForm, go: go, onChangePwd: onChangePwd, onSyncNow: onSyncNow, onLogout: onLogout }, H);
    }
  };

  // ====================================================================
  // 8. MemberDetail - 会员详情
  // ====================================================================
  V.MemberDetail = {
    template: `
    <div class="page">
      <app-header title="会员详情" :show-back="true" @back="onBack" />
      <div v-if="member" style="padding:12px;">
        <div style="background:linear-gradient(135deg,#d4a017,#c0532a);border-radius:14px;padding:18px;color:#fff;">
          <div style="display:flex;align-items:center;">
            <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:bold;">{{ (member.name||'会').charAt(0) }}</div>
            <div style="margin-left:14px;flex:1;">
              <div style="font-size:18px;font-weight:bold;">{{ member.name }} <van-tag :class="tagc('memberLevelTag', member.level)" style="margin-left:4px;">{{ st('memberLevel', member.level) }}</van-tag></div>
              <div style="font-size:13px;opacity:.85;margin-top:4px;">{{ maskPhone(member.phone) }} · {{ genderText(member.gender) }}</div>
            </div>
          </div>
          <div style="display:flex;margin-top:16px;text-align:center;">
            <div style="flex:1;"><div style="font-size:18px;font-weight:bold;">¥{{ money(member.balance) }}</div><div style="font-size:11px;opacity:.85;">余额</div></div>
            <div style="flex:1;"><div style="font-size:18px;font-weight:bold;">{{ member.points || 0 }}</div><div style="font-size:11px;opacity:.85;">积分</div></div>
            <div style="flex:1;"><div style="font-size:13px;">{{ member.invite_code || '-' }}</div><div style="font-size:11px;opacity:.85;">邀请码</div></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-top:12px;">
          <van-button icon="edit" size="small" color="#d4a017" @click="openEdit">编辑</van-button>
          <van-button icon="gold-coin-o" size="small" color="#c0532a" @click="showRecharge = true">充值</van-button>
          <van-button :icon="member.status==='active'?'pause':'play-circle-o'" size="small" plain :color="member.status==='active'?'#c0532a':'#52c41a'" @click="toggleStatus">{{ member.status==='active'?'停用':'启用' }}</van-button>
          <van-button icon="medal-o" size="small" plain color="#d4a017" @click="showLevel = true">等级</van-button>
        </div>

        <van-tabs v-model:active="activeTab" sticky color="#d4a017" style="margin-top:12px;">
          <van-tab title="消费">
            <van-cell-group inset>
              <van-cell v-for="o in orders" :key="o.id" :title="o.order_no" :label="ftime(o.created_at)">
                <template #value><span style="color:#c0532a;">¥{{ money(o.paid_amount) }} · {{ st('payMethod', o.pay_method) }}</span></template>
              </van-cell>
            </van-cell-group>
            <empty-state v-if="!orders.length" text="暂无消费记录" />
          </van-tab>
          <van-tab title="预约">
            <van-cell-group inset>
              <van-cell v-for="a in appts" :key="a.id">
                <template #title><div>{{ projName(a.project_id) }} · {{ staffName(a.staff_id) || '未指派' }}</div><div style="font-size:12px;color:#999;">{{ ftime(a.start_at) }}</div></template>
                <template #value><van-tag :class="tagc('appointmentTag', a.status)">{{ st('appointment', a.status) }}</van-tag></template>
              </van-cell>
            </van-cell-group>
            <empty-state v-if="!appts.length" text="暂无预约" />
          </van-tab>
          <van-tab title="充值">
            <van-cell-group inset>
              <van-cell v-for="r in recharges" :key="r.id" :title="'充值 ¥' + money(r.pay_amount)" :label="ftime(r.created_at)">
                <template #value><span style="color:#52c41a;">赠 ¥{{ money(r.gift_amount) }}+{{ r.gift_points }}积分</span></template>
              </van-cell>
            </van-cell-group>
            <empty-state v-if="!recharges.length" text="暂无充值记录" />
          </van-tab>
          <van-tab title="套餐">
            <van-cell-group inset>
              <van-cell v-for="mp in memberPkgs" :key="mp.id">
                <template #title><div>{{ pkgName(mp.package_id) }}</div><div style="font-size:12px;color:#999;">剩余 {{ mp.remain_times }} 次 · 到期 {{ fdate(mp.expire_at) }}</div></template>
                <template #value><van-tag :type="mp.status==='active'?'success':'default'">{{ mp.status==='active'?'有效':'失效' }}</van-tag></template>
              </van-cell>
            </van-cell-group>
            <empty-state v-if="!memberPkgs.length" text="暂无套餐" />
          </van-tab>
          <van-tab title="佣金">
            <van-cell-group inset>
              <van-cell v-for="c in commissions" :key="c.id">
                <template #title><div>{{ c.source_type }} · {{ c.rate }}%</div><div style="font-size:12px;color:#999;">{{ ftime(c.created_at) }}</div></template>
                <template #value><span style="color:#c0532a;">¥{{ money(c.amount) }}</span> <van-tag :class="tagc('commission', c.status)">{{ st('commission', c.status) }}</van-tag></template>
              </van-cell>
            </van-cell-group>
            <empty-state v-if="!commissions.length" text="暂无佣金记录" />
          </van-tab>
        </van-tabs>
      </div>

      <van-popup v-model:show="showEdit" round position="bottom" style="max-height:80%;">
        <div style="padding:16px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:12px;color:#3a2410;">编辑会员</div>
          <van-cell-group :border="false">
            <van-field v-model="editForm.name" label="姓名" placeholder="请输入姓名" />
            <van-field v-model="editForm.phone" label="手机号" placeholder="请输入手机号" />
            <van-field readonly clickable label="性别" :model-value="genderText(editForm.gender)" @click="showGender = true" />
            <van-field readonly clickable label="生日" :model-value="editForm.birthday" placeholder="选择生日" @click="showBirthday = true" />
            <van-field readonly clickable label="等级" :model-value="st('memberLevel', editForm.level)" @click="showLevel = true" />
            <van-field v-model="editForm.notes" type="textarea" label="备注" placeholder="备注信息" rows="2" />
          </van-cell-group>
          <div style="margin-top:14px;"><van-button block round color="#d4a017" @click="saveEdit">保存</van-button></div>
        </div>
      </van-popup>

      <van-popup v-model:show="showRecharge" round position="bottom" style="max-height:80%;">
        <div style="padding:16px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:12px;color:#3a2410;">会员充值</div>
          <div v-for="r in rechargeRules" :key="r.id" @click="doRechargeRule(r)" style="background:#faf4ea;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <div><div style="font-weight:600;color:#3a2410;">充 {{ money(r.pay_amount) }} 元</div><div style="font-size:12px;color:#c0532a;">赠 {{ money(r.gift_amount) }}元 + {{ r.gift_points }}积分{{ r.gift_package_id ? ' + 赠套餐' : '' }}</div></div>
            <van-icon name="arrow" color="#d4a017" />
          </div>
          <div style="border-top:1px dashed #eee;margin:10px 0;padding-top:10px;">
            <div style="font-size:13px;color:#6b4423;margin-bottom:8px;">自定义金额</div>
            <van-field v-model="rechargeCustom.amount" type="number" label="充值金额" placeholder="输入金额" />
            <van-field readonly clickable label="支付方式" :model-value="st('payMethod', rechargeCustom.pay_method)" @click="showPay = true" />
            <div style="margin-top:10px;"><van-button block round color="#c0532a" @click="doRechargeCustom">确认充值</van-button></div>
          </div>
        </div>
      </van-popup>

      <van-action-sheet v-model:show="showLevel" :actions="levelActions" cancel-text="取消" close-on-click-action @select="pickLevel" />
      <van-action-sheet v-model:show="showGender" :actions="genderActions" cancel-text="取消" close-on-click-action @select="pickGender" />
      <van-action-sheet v-model:show="showPay" :actions="payActions" cancel-text="取消" close-on-click-action @select="pickPay" />
      <van-popup v-model:show="showBirthday" position="bottom" round>
        <van-date-picker v-model="birthdayVal" title="选择生日" @confirm="onBirthday" @cancel="showBirthday = false" />
      </van-popup>
    </div>`,
    setup: function () {
      var router = useRouter(); var route = useRoute();
      var id = route.params.id;
      var member = ref(null);
      var activeTab = ref(0);
      var orders = ref([]); var appts = ref([]); var recharges = ref([]); var memberPkgs = ref([]); var commissions = ref([]);
      var projects = ref([]); var packages = ref([]); var staffs = ref([]); var rechargeRules = ref([]);
      var showEdit = ref(false); var editForm = reactive({ name: '', phone: '', gender: 'male', birthday: '', level: 'normal', notes: '' });
      var showLevel = ref(false); var showGender = ref(false); var showBirthday = ref(false); var birthdayVal = ref(['1990', '01', '01']);
      var showRecharge = ref(false); var rechargeCustom = reactive({ amount: 0, pay_method: 'cash' }); var showPay = ref(false);
      var levelActions = [{ name: '普通会员', value: 'normal' }, { name: '银卡会员', value: 'silver' }, { name: '金卡会员', value: 'gold' }, { name: 'VIP会员', value: 'vip' }];
      var genderActions = [{ name: '男', value: 'male' }, { name: '女', value: 'female' }, { name: '保密', value: 'unknown' }];
      var payActions = [{ name: '现金', value: 'cash' }, { name: '微信支付', value: 'wechat' }, { name: '支付宝', value: 'alipay' }, { name: '刷卡', value: 'card' }];
      function onBack() { navBack(router); }
      function load() {
        Promise.all([
          DS.get('members', id),
          DS.list('orders', { where: { member_id: id }, page: 1, pageSize: 100 }),
          DS.list('appointments', { where: { member_id: id }, page: 1, pageSize: 100 }),
          DS.list('recharge_records', { where: { member_id: id }, page: 1, pageSize: 100 }),
          DS.list('member_packages', { where: { member_id: id }, page: 1, pageSize: 100 }),
          DS.list('commissions', { page: 1, pageSize: 999999 }),
          DS.list('projects', { page: 1, pageSize: 999 }),
          DS.list('packages', { page: 1, pageSize: 999 }),
          DS.list('staff', { page: 1, pageSize: 999 }),
          DS.list('recharge_rules', { page: 1, pageSize: 999 })
        ]).then(function (res) {
          member.value = res[0];
          orders.value = res[1].data || [];
          appts.value = res[2].data || [];
          recharges.value = res[3].data || [];
          memberPkgs.value = res[4].data || [];
          commissions.value = (res[5].data || []).filter(function (c) { return c.referrer_id === id || c.source_member_id === id; });
          projects.value = res[6].data || [];
          packages.value = res[7].data || [];
          staffs.value = res[8].data || [];
          rechargeRules.value = res[9].data || [];
        });
      }
      function projName(pid) { var p = projects.value.find(function (x) { return x.id === pid; }); return p ? p.name : ''; }
      function staffName(sid) { var s = staffs.value.find(function (x) { return x.id === sid; }); return s ? s.name : ''; }
      function pkgName(pid) { var p = packages.value.find(function (x) { return x.id === pid; }); return p ? p.name : ''; }
      function openEdit() {
        var m = member.value;
        Object.assign(editForm, { name: m.name, phone: m.phone, gender: m.gender || 'male', birthday: m.birthday || '', level: m.level || 'normal', notes: m.notes || '' });
        if (m.birthday) birthdayVal.value = m.birthday.split('-');
        showEdit.value = true;
      }
      function pickLevel(a) { if (showEdit.value) { editForm.level = a.value; } else if (member.value) { DS.update('members', id, { level: a.value }).then(function () { toastSuccess('已修改等级'); load(); }); } showLevel.value = false; }
      function pickGender(a) { editForm.gender = a.value; showGender.value = false; }
      function pickPay(a) { rechargeCustom.pay_method = a.value; showPay.value = false; }
      function onBirthday() { editForm.birthday = birthdayVal.value.join('-'); showBirthday.value = false; }
      function saveEdit() { DS.update('members', id, { name: editForm.name, phone: editForm.phone, gender: editForm.gender, birthday: editForm.birthday, level: editForm.level, notes: editForm.notes }).then(function () { toastSuccess('已保存'); showEdit.value = false; load(); }); }
      function toggleStatus() { var m = member.value; var ns = m.status === 'active' ? 'inactive' : 'active'; confirmDialog(ns === 'inactive' ? '确定停用该会员吗？' : '确定启用该会员吗？').then(function () { return DS.update('members', id, { status: ns }); }).then(function () { toastSuccess('已操作'); load(); }).catch(function () {}); }
      function doRechargeRule(r) {
        var m = member.value;
        DS.update('members', id, { balance: (m.balance || 0) + Number(r.pay_amount || 0) + Number(r.gift_amount || 0), points: (m.points || 0) + Number(r.gift_points || 0) }).then(function () {
          return DS.create('recharge_records', { member_id: id, rule_id: r.id, pay_amount: r.pay_amount, gift_amount: r.gift_amount, gift_points: r.gift_points, pay_method: rechargeCustom.pay_method, status: 'success', created_at: U.now(), updated_at: U.now() });
        }).then(function () {
          if (r.gift_package_id && r.gift_times > 0) { return DS.create('member_packages', { member_id: id, package_id: r.gift_package_id, remain_times: r.gift_times, expire_at: dayjs().add(90, 'day').toISOString(), status: 'active', source: '充值赠送', created_at: U.now(), updated_at: U.now() }); }
        }).then(function () {
          if (m.referrer_id) {
            DS.getSetting('invite_commission_rate').then(function (rv) { var rt = parseFloat(rv) || 10; DS.create('commissions', { referrer_id: m.referrer_id, source_member_id: id, source_type: '充值', source_id: r.id, rate: rt, amount: Math.round(Number(r.pay_amount || 0) * rt) / 100, status: 'pending', created_at: U.now(), updated_at: U.now() }); });
          }
          toastSuccess('充值成功'); showRecharge.value = false; load();
        });
      }
      function doRechargeCustom() {
        var amt = Number(rechargeCustom.amount) || 0;
        if (amt <= 0) { toast('请输入充值金额'); return; }
        doRechargeRule({ id: '', pay_amount: amt, gift_amount: 0, gift_points: 0, gift_package_id: null, gift_times: 0 });
      }
      onMounted(load);
      return Object.assign({ member: member, activeTab: activeTab, orders: orders, appts: appts, recharges: recharges, memberPkgs: memberPkgs, commissions: commissions, showEdit: showEdit, editForm: editForm, showLevel: showLevel, showGender: showGender, showBirthday: showBirthday, birthdayVal: birthdayVal, showRecharge: showRecharge, rechargeCustom: rechargeCustom, showPay: showPay, levelActions: levelActions, genderActions: genderActions, payActions: payActions, onBack: onBack, projName: projName, staffName: staffName, pkgName: pkgName, openEdit: openEdit, pickLevel: pickLevel, pickGender: pickGender, pickPay: pickPay, onBirthday: onBirthday, saveEdit: saveEdit, toggleStatus: toggleStatus, doRechargeRule: doRechargeRule, doRechargeCustom: doRechargeCustom }, H);
    }
  };

  // ====================================================================
  // 9. MemberAdd - 新增会员
  // ====================================================================
  V.MemberAdd = {
    template: `
    <div class="page">
      <app-header title="新增会员" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <van-form @submit="save">
          <van-cell-group inset>
            <van-field v-model="form.name" label="姓名" placeholder="请输入姓名" required :rules="[{ required: true, message: '请输入姓名' }]" />
            <van-field v-model="form.phone" label="手机号" placeholder="请输入手机号" type="tel" required :rules="[{ pattern: /^1\\d{10}$/, message: '手机号格式不正确' }]" />
            <van-field readonly clickable label="性别" :model-value="genderText(form.gender)" placeholder="选择性别" @click="showGender = true" />
            <van-field readonly clickable label="生日" :model-value="form.birthday" placeholder="选择生日" @click="showBirthday = true" />
            <van-field readonly clickable label="等级" :model-value="st('memberLevel', form.level)" placeholder="选择等级" @click="showLevel = true" />
            <van-field v-model="form.balance" type="number" label="初始余额" placeholder="初始余额（元）" />
            <van-field v-model="form.notes" type="textarea" label="备注" placeholder="备注信息" rows="2" />
          </van-cell-group>
          <div style="margin:16px;"><van-button block round type="primary" color="#d4a017" native-type="submit">保存会员</van-button></div>
        </van-form>
      </div>
      <van-action-sheet v-model:show="showLevel" :actions="levelActions" cancel-text="取消" close-on-click-action @select="pickLevel" />
      <van-action-sheet v-model:show="showGender" :actions="genderActions" cancel-text="取消" close-on-click-action @select="pickGender" />
      <van-popup v-model:show="showBirthday" position="bottom" round>
        <van-date-picker v-model="birthdayVal" title="选择生日" @confirm="onBirthday" @cancel="showBirthday = false" />
      </van-popup>
    </div>`,
    setup: function () {
      var router = useRouter();
      var form = reactive({ name: '', phone: '', gender: 'male', birthday: '', level: 'normal', balance: 0, notes: '' });
      var showLevel = ref(false); var showGender = ref(false); var showBirthday = ref(false); var birthdayVal = ref(['1990', '01', '01']);
      var levelActions = [{ name: '普通会员', value: 'normal' }, { name: '银卡会员', value: 'silver' }, { name: '金卡会员', value: 'gold' }, { name: 'VIP会员', value: 'vip' }];
      var genderActions = [{ name: '男', value: 'male' }, { name: '女', value: 'female' }, { name: '保密', value: 'unknown' }];
      function onBack() { navBack(router); }
      function pickLevel(a) { form.level = a.value; showLevel.value = false; }
      function pickGender(a) { form.gender = a.value; showGender.value = false; }
      function onBirthday() { form.birthday = birthdayVal.value.join('-'); showBirthday.value = false; }
      function save() {
        DS.list('members', { where: { phone: form.phone }, page: 1, pageSize: 1 }).then(function (r) {
          if (r.data && r.data.length) { toastFail('该手机号已注册'); return; }
          DS.create('members', {
            name: form.name, phone: form.phone, password_hash: U.hashPassword('123456'), gender: form.gender, birthday: form.birthday, avatar: '',
            level: form.level, balance: Number(form.balance) || 0, points: 0, status: 'active', invite_code: U.genInviteCode(), referrer_id: null, notes: form.notes,
            created_at: U.now(), updated_at: U.now()
          }).then(function () { toastSuccess('新增成功'); navBack(router); });
        });
      }
      return Object.assign({ form: form, showLevel: showLevel, showGender: showGender, showBirthday: showBirthday, birthdayVal: birthdayVal, levelActions: levelActions, genderActions: genderActions, onBack: onBack, pickLevel: pickLevel, pickGender: pickGender, onBirthday: onBirthday, save: save }, H);
    }
  };

  // ====================================================================
  // 10. AppointmentManage - 预约管理
  // ====================================================================
  V.AppointmentManage = {
    template: `
    <div class="page">
      <app-header title="预约管理" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div @click="showStatus = true" style="background:#fff;border-radius:8px;padding:10px 12px;font-size:13px;color:#6b4423;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span>状态筛选：{{ statusFilterText }}</span><van-icon name="arrow-down" />
        </div>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
            <div v-for="a in list" :key="a.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-weight:600;color:#3a2410;">{{ a._member.name || '散客' }} <span style="font-size:12px;color:#999;font-weight:normal;">{{ maskPhone(a._member.phone) }}</span></div>
                  <div style="font-size:13px;color:#6b4423;margin-top:4px;">{{ a._project.name || '未选项目' }} · {{ a._staff.name || '未指派技师' }}</div>
                  <div style="font-size:12px;color:#999;margin-top:4px;">{{ ftime(a.start_at) }}</div>
                  <div v-if="a.notes" style="font-size:12px;color:#999;margin-top:2px;">备注：{{ a.notes }}</div>
                </div>
                <van-tag :class="tagc('appointmentTag', a.status)">{{ st('appointment', a.status) }}</van-tag>
              </div>
              <div style="display:flex;gap:8px;margin-top:10px;border-top:1px solid #f5f0ea;padding-top:10px;" v-if="a.status==='pending' || a.status==='confirmed'">
                <van-button v-if="a.status==='pending'" size="small" type="primary" color="#d4a017" @click="doConfirm(a)">确认</van-button>
                <van-button v-if="a.status==='confirmed'" size="small" type="success" color="#52c41a" @click="doComplete(a)">完成</van-button>
                <van-button size="small" plain color="#c0532a" @click="openResched(a)">改时间</van-button>
                <van-button size="small" plain type="danger" @click="doCancel(a)">取消</van-button>
              </div>
            </div>
            <empty-state v-if="!list.length && !loading" text="暂无预约" />
          </van-list>
        </van-pull-refresh>
      </div>
      <van-action-sheet v-model:show="showStatus" :actions="statusActions" cancel-text="取消" close-on-click-action @select="pickStatus" />
      <van-popup v-model:show="showResched" position="bottom" round>
        <van-date-picker v-model="reschedDate" title="选择新的预约日期" @confirm="doResched" @cancel="showResched = false" />
      </van-popup>
    </div>`,
    setup: function () {
      var router = useRouter();
      var statusFilter = ref('');
      var list = ref([]); var refreshing = ref(false); var loading = ref(false); var finished = ref(true);
      var showStatus = ref(false); var showResched = ref(false); var reschedDate = ref([]); var reschedTarget = ref(null);
      var statusActions = [{ name: '全部', value: '' }, { name: '待确认', value: 'pending' }, { name: '已确认', value: 'confirmed' }, { name: '已完成', value: 'completed' }, { name: '已取消', value: 'cancelled' }];
      var statusFilterText = computed(function () { var a = statusActions.find(function (x) { return x.value === statusFilter.value; }); return a ? a.name : '全部'; });
      function onBack() { navBack(router); }
      function load() {
        refreshing.value = true;
        Promise.all([
          DS.list('appointments', { page: 1, pageSize: 999999 }),
          DS.list('members', { page: 1, pageSize: 999999 }),
          DS.list('projects', { page: 1, pageSize: 999999 }),
          DS.list('staff', { page: 1, pageSize: 999999 })
        ]).then(function (res) {
          var appts = res[0].data || [];
          var memMap = {}; (res[1].data || []).forEach(function (m) { memMap[m.id] = m; });
          var projMap = {}; (res[2].data || []).forEach(function (p) { projMap[p.id] = p; });
          var staffMap = {}; (res[3].data || []).forEach(function (s) { staffMap[s.id] = s; });
          appts.forEach(function (a) { a._member = memMap[a.member_id] || {}; a._project = projMap[a.project_id] || {}; a._staff = staffMap[a.staff_id] || {}; });
          if (statusFilter.value) appts = appts.filter(function (a) { return a.status === statusFilter.value; });
          list.value = appts;
        }).catch(function (e) { console.error(e); }).finally(function () { refreshing.value = false; loading.value = false; finished.value = true; });
      }
      function onRefresh() { load(); }
      function onLoad() { loading.value = false; finished.value = true; }
      function pickStatus(a) { statusFilter.value = a.value; load(); }
      function doConfirm(a) { DS.update('appointments', a.id, { status: 'confirmed' }).then(function () { toastSuccess('已确认'); load(); }); }
      function doComplete(a) { DS.update('appointments', a.id, { status: 'completed' }).then(function () { toastSuccess('已完成'); load(); }); }
      function doCancel(a) { confirmDialog('确定取消该预约吗？').then(function () { return DS.update('appointments', a.id, { status: 'cancelled' }); }).then(function () { toastSuccess('已取消'); load(); }).catch(function () {}); }
      function openResched(a) {
        reschedTarget.value = a;
        var d = a.start_at ? dayjs(a.start_at) : dayjs();
        reschedDate.value = [String(d.year()), String(d.month() + 1).padStart(2, '0'), String(d.date()).padStart(2, '0')];
        showResched.value = true;
      }
      function doResched() {
        var a = reschedTarget.value; if (!a) return;
        var orig = a.start_at ? dayjs(a.start_at) : dayjs();
        var time = orig.format('HH:mm:ss');
        var newIso = dayjs(reschedDate.value.join('-') + 'T' + time).toISOString();
        DS.update('appointments', a.id, { start_at: newIso, end_at: newIso }).then(function () { toastSuccess('已改期'); showResched.value = false; load(); });
      }
      onMounted(load);
      return Object.assign({ statusFilter: statusFilter, list: list, refreshing: refreshing, loading: loading, finished: finished, showStatus: showStatus, showResched: showResched, reschedDate: reschedDate, statusActions: statusActions, statusFilterText: statusFilterText, onBack: onBack, onRefresh: onRefresh, onLoad: onLoad, pickStatus: pickStatus, doConfirm: doConfirm, doComplete: doComplete, doCancel: doCancel, openResched: openResched, doResched: doResched }, H);
    }
  };

  // ====================================================================
  // 11. OrderRedemption - 兑换订单
  // ====================================================================
  V.OrderRedemption = {
    template: `
    <div class="page">
      <app-header title="兑换订单" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div @click="showStatus = true" style="background:#fff;border-radius:8px;padding:10px 12px;font-size:13px;color:#6b4423;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <span>状态筛选：{{ statusFilterText }}</span><van-icon name="arrow-down" />
        </div>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="onLoad">
            <div v-for="o in list" :key="o.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                  <div style="font-weight:600;color:#3a2410;">{{ o._gift.name || '礼品' }}</div>
                  <div style="font-size:13px;color:#6b4423;margin-top:4px;">{{ o._member.name || '会员' }} · {{ maskPhone(o._member.phone) }}</div>
                  <div style="font-size:12px;color:#999;margin-top:4px;">{{ st('payMethod', o.cost_type==='points'?'':o.cost_type) }}{{ o.cost_type==='points'?'积分兑换':'' }} 消耗 {{ o.cost_value }} · {{ ftime(o.created_at) }}</div>
                </div>
                <van-tag :class="tagc('redemption', o.status)">{{ st('redemption', o.status) }}</van-tag>
              </div>
              <div v-if="o.status==='pending'" style="display:flex;gap:8px;margin-top:10px;border-top:1px solid #f5f0ea;padding-top:10px;">
                <van-button size="small" type="primary" color="#d4a017" @click="verify(o)">核销</van-button>
                <van-button size="small" plain type="danger" @click="cancel(o)">取消</van-button>
              </div>
            </div>
            <empty-state v-if="!list.length && !loading" text="暂无兑换订单" />
          </van-list>
        </van-pull-refresh>
      </div>
      <van-action-sheet v-model:show="showStatus" :actions="statusActions" cancel-text="取消" close-on-click-action @select="pickStatus" />
    </div>`,
    setup: function () {
      var router = useRouter();
      var list = ref([]); var refreshing = ref(false); var loading = ref(false); var finished = ref(true);
      var statusFilter = ref(''); var showStatus = ref(false);
      var statusActions = [{ name: '全部', value: '' }, { name: '待核销', value: 'pending' }, { name: '已核销', value: 'redeemed' }, { name: '已取消', value: 'cancelled' }];
      var statusFilterText = computed(function () { var a = statusActions.find(function (x) { return x.value === statusFilter.value; }); return a ? a.name : '全部'; });
      function onBack() { navBack(router); }
      function load() {
        refreshing.value = true;
        Promise.all([
          DS.list('redemption_orders', { page: 1, pageSize: 999999 }),
          DS.list('members', { page: 1, pageSize: 999999 }),
          DS.list('gifts', { page: 1, pageSize: 999999 })
        ]).then(function (res) {
          var orders = res[0].data || [];
          var memMap = {}; (res[1].data || []).forEach(function (m) { memMap[m.id] = m; });
          var giftMap = {}; (res[2].data || []).forEach(function (g) { giftMap[g.id] = g; });
          orders.forEach(function (o) { o._member = memMap[o.member_id] || {}; o._gift = giftMap[o.gift_id] || {}; });
          if (statusFilter.value) orders = orders.filter(function (o) { return o.status === statusFilter.value; });
          list.value = orders;
        }).finally(function () { refreshing.value = false; loading.value = false; finished.value = true; });
      }
      function onRefresh() { load(); }
      function onLoad() { loading.value = false; finished.value = true; }
      function pickStatus(a) { statusFilter.value = a.value; load(); }
      function verify(o) { confirmDialog('确认核销该兑换订单吗？').then(function () { return DS.update('redemption_orders', o.id, { status: 'redeemed' }); }).then(function () { toastSuccess('已核销'); load(); }).catch(function () {}); }
      function cancel(o) { confirmDialog('确定取消该订单吗？').then(function () { return DS.update('redemption_orders', o.id, { status: 'cancelled' }); }).then(function () { toastSuccess('已取消'); load(); }).catch(function () {}); }
      onMounted(load);
      return Object.assign({ list: list, refreshing: refreshing, loading: loading, finished: finished, statusFilter: statusFilter, showStatus: showStatus, statusActions: statusActions, statusFilterText: statusFilterText, onBack: onBack, onRefresh: onRefresh, onLoad: onLoad, pickStatus: pickStatus, verify: verify, cancel: cancel }, H);
    }
  };

  // ====================================================================
  // 12. AdminStats - 数据统计
  // ====================================================================
  V.AdminStats = {
    template: `
    <div class="page">
      <app-header title="数据统计" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div style="background:#fff;border-radius:12px;padding:6px 12px;margin-bottom:12px;">
          <van-tabs v-model:active="range" @change="loadData" color="#d4a017">
            <van-tab title="近7天" :name="7"></van-tab>
            <van-tab title="近30天" :name="30"></van-tab>
            <van-tab title="近90天" :name="90"></van-tab>
          </van-tabs>
        </div>
        <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:bold;margin-bottom:8px;color:#6b4423;">营收趋势</div>
          <div ref="revenueChart" style="height:260px;"></div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:bold;margin-bottom:8px;color:#6b4423;">收入构成</div>
          <div ref="pieChart" style="height:260px;"></div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:bold;margin-bottom:8px;color:#6b4423;">项目人气 TOP5</div>
          <div ref="barChart" style="height:280px;"></div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:bold;margin-bottom:8px;color:#6b4423;">新增会员趋势</div>
          <div ref="trendChart" style="height:260px;"></div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:12px;margin-bottom:12px;">
          <div style="font-weight:bold;margin-bottom:8px;color:#6b4423;">预约状态分布</div>
          <div ref="rateChart" style="height:260px;"></div>
        </div>
      </div>
    </div>`,
    setup: function () {
      var router = useRouter();
      var range = ref(7);
      var revenueChart = ref(null), pieChart = ref(null), barChart = ref(null), trendChart = ref(null), rateChart = ref(null);
      var charts = {};
      function onBack() { navBack(router); }
      function resizeAll() { Object.keys(charts).forEach(function (k) { charts[k] && charts[k].resize(); }); }
      onMounted(function () {
        nextTick().then(function () {
          try {
            charts.revenue = echarts.init(revenueChart.value);
            charts.pie = echarts.init(pieChart.value);
            charts.bar = echarts.init(barChart.value);
            charts.trend = echarts.init(trendChart.value);
            charts.rate = echarts.init(rateChart.value);
          } catch (e) { console.error(e); }
          window.addEventListener('resize', resizeAll);
          loadData();
        });
      });
      onUnmounted(function () { window.removeEventListener('resize', resizeAll); Object.keys(charts).forEach(function (k) { charts[k] && charts[k].dispose(); }); });
      function loadData() {
        Promise.all([
          DS.list('orders', { page: 1, pageSize: 999999 }),
          DS.list('appointments', { page: 1, pageSize: 999999 }),
          DS.list('members', { page: 1, pageSize: 999999 })
        ]).then(function (res) {
          var orders = (res[0].data || []).filter(function (o) { return o.status === 'paid'; });
          var appts = res[1].data || [];
          var members = res[2].data || [];
          var N = range.value;
          var labels = [], revArr = [], memArr = [];
          for (var i = N - 1; i >= 0; i--) {
            var d = dayjs().subtract(i, 'day');
            labels.push(d.format('MM-DD'));
            revArr.push(orders.filter(function (o) { return o.created_at && dayjs(o.created_at).isSame(d, 'day'); }).reduce(function (s, o) { return s + Number(o.paid_amount || 0); }, 0));
            memArr.push(members.filter(function (m) { return m.created_at && dayjs(m.created_at).isSame(d, 'day'); }).length);
          }
          if (charts.revenue) charts.revenue.setOption({
            tooltip: { trigger: 'axis' }, grid: { left: 45, right: 16, top: 30, bottom: 30 },
            xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10 } },
            yAxis: { type: 'value' },
            series: [{ name: '营收', type: 'line', smooth: true, data: revArr, itemStyle: { color: '#d4a017' }, areaStyle: { color: 'rgba(212,160,23,0.15)' } }]
          });
          var pmMap = {};
          orders.forEach(function (o) { var k = o.pay_method || 'cash'; pmMap[k] = (pmMap[k] || 0) + Number(o.paid_amount || 0); });
          var pmData = Object.keys(pmMap).map(function (k) { return { name: st('payMethod', k), value: Math.round(pmMap[k] * 100) / 100 }; });
          if (charts.pie) charts.pie.setOption({
            tooltip: { trigger: 'item' }, legend: { bottom: 0 },
            series: [{ type: 'pie', radius: ['40%', '70%'], data: pmData, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 }, color: ['#d4a017', '#c0532a', '#8a5a2b', '#e0b84a', '#b08d57'] }]
          });
          var pMap = {};
          orders.forEach(function (o) { (o.items || []).forEach(function (it) { var n = it.name || '未知'; pMap[n] = (pMap[n] || 0) + (it.qty || 1); }); });
          var top = Object.keys(pMap).map(function (n) { return { name: n, val: pMap[n] }; }).sort(function (a, b) { return b.val - a.val; }).slice(0, 5);
          if (charts.bar) charts.bar.setOption({
            tooltip: { trigger: 'axis' }, grid: { left: 90, right: 16, top: 20, bottom: 30 },
            xAxis: { type: 'value' }, yAxis: { type: 'category', data: top.map(function (t) { return t.name; }).reverse() },
            series: [{ type: 'bar', data: top.map(function (t) { return t.val; }).reverse(), itemStyle: { color: '#c0532a', borderRadius: [0, 6, 6, 0] } }]
          });
          if (charts.trend) charts.trend.setOption({
            tooltip: { trigger: 'axis' }, grid: { left: 40, right: 16, top: 30, bottom: 30 },
            xAxis: { type: 'category', data: labels, axisLabel: { fontSize: 10 } }, yAxis: { type: 'value' },
            series: [{ name: '新增会员', type: 'line', smooth: true, data: memArr, itemStyle: { color: '#c0532a' }, areaStyle: { color: 'rgba(192,83,42,0.15)' } }]
          });
          var stMap = {};
          appts.forEach(function (a) { var k = a.status || 'pending'; stMap[k] = (stMap[k] || 0) + 1; });
          var stData = Object.keys(stMap).map(function (k) { return { name: st('appointment', k), value: stMap[k] }; });
          if (charts.rate) charts.rate.setOption({
            tooltip: { trigger: 'item' }, legend: { bottom: 0 },
            series: [{ type: 'pie', radius: '60%', data: stData, color: ['#d4a017', '#e0b84a', '#52c41a', '#bfbfbf'] }]
          });
        }).catch(function (e) { console.error(e); });
      }
      return { range: range, revenueChart: revenueChart, pieChart: pieChart, barChart: barChart, trendChart: trendChart, rateChart: rateChart, onBack: onBack, loadData: loadData };
    }
  };

  // ====================================================================
  // 13. AdminStaff - 员工管理
  // ====================================================================
  V.AdminStaff = {
    template: `
    <div class="page">
      <app-header title="员工管理" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div style="margin-bottom:10px;"><van-button icon="plus" type="primary" size="small" color="#d4a017" @click="openAdd">新增员工</van-button></div>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div v-for="s in list" :key="s.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;">
              <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#d4a017,#c0532a);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;">{{ (s.name||'员').charAt(0) }}</div>
              <div style="flex:1;margin-left:12px;">
                <div style="font-weight:600;color:#3a2410;">{{ s.name }} <van-tag :class="tagc('memberLevelTag', s.role==='admin'?'vip':s.role==='cashier'?'silver':'normal')" style="margin-left:4px;">{{ st('staffRole', s.role) }}</van-tag> <van-tag v-if="s.status!=='active'" type="danger" plain>已停用</van-tag></div>
                <div style="font-size:12px;color:#999;margin-top:4px;">{{ s.login_account }} · {{ maskPhone(s.phone) }} · 提成 {{ s.commission_rate || 0 }}%</div>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <van-button size="small" plain color="#d4a017" @click="openEdit(s)">编辑</van-button>
              <van-button size="small" plain color="#c0532a" @click="resetPwd(s)">重置密码</van-button>
              <van-button size="small" plain :color="s.status==='active'?'#999':'#52c41a'" @click="toggleStatus(s)">{{ s.status==='active'?'停用':'启用' }}</van-button>
            </div>
          </div>
          <empty-state v-if="!list.length" text="暂无员工" />
        </van-pull-refresh>
      </div>
      <van-popup v-model:show="showEdit" round position="bottom" style="max-height:80%;">
        <div style="padding:16px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:12px;color:#3a2410;">{{ isEdit ? '编辑员工' : '新增员工' }}</div>
          <van-cell-group :border="false">
            <van-field v-model="form.name" label="姓名" placeholder="请输入姓名" />
            <van-field v-model="form.phone" label="手机号" placeholder="请输入手机号" />
            <van-field v-model="form.login_account" label="登录账号" placeholder="请输入登录账号" />
            <van-field readonly clickable label="角色" :model-value="st('staffRole', form.role)" @click="showRole = true" />
            <van-field v-model="form.commission_rate" type="number" label="提成比例" placeholder="百分比，如30">
              <template #button>%</template>
            </van-field>
            <van-field v-model="form.password" type="password" :label="isEdit?'重设密码':'初始密码'" :placeholder="isEdit?'留空则不修改':'请输入初始密码'" />
          </van-cell-group>
          <div style="margin-top:14px;"><van-button block round color="#d4a017" @click="save">保存</van-button></div>
        </div>
      </van-popup>
      <van-action-sheet v-model:show="showRole" :actions="roleActions" cancel-text="取消" close-on-click-action @select="pickRole" />
    </div>`,
    setup: function () {
      var router = useRouter();
      var list = ref([]); var refreshing = ref(false);
      var showEdit = ref(false); var isEdit = ref(false);
      var form = reactive({ name: '', phone: '', login_account: '', role: 'technician', commission_rate: 0, password: '', status: 'active' });
      var showRole = ref(false);
      var roleActions = [{ name: '管理员', value: 'admin' }, { name: '收银员', value: 'cashier' }, { name: '技师', value: 'technician' }];
      function onBack() { navBack(router); }
      function load() { refreshing.value = true; DS.list('staff', { page: 1, pageSize: 999999 }).then(function (r) { list.value = r.data || []; }).finally(function () { refreshing.value = false; }); }
      function onRefresh() { load(); }
      function openAdd() { isEdit.value = false; Object.assign(form, { id: '', name: '', phone: '', login_account: '', role: 'technician', commission_rate: 0, password: '', status: 'active' }); showEdit.value = true; }
      function openEdit(s) { isEdit.value = true; Object.assign(form, { id: s.id, name: s.name || '', phone: s.phone || '', login_account: s.login_account || '', role: s.role || 'technician', commission_rate: s.commission_rate || 0, password: '', status: s.status || 'active' }); showEdit.value = true; }
      function pickRole(a) { form.role = a.value; showRole.value = false; }
      function save() {
        if (!form.name || !form.login_account) { toast('请填写姓名和账号'); return; }
        if (isEdit.value) {
          var data = { name: form.name, phone: form.phone, login_account: form.login_account, role: form.role, commission_rate: Number(form.commission_rate) || 0, status: form.status };
          if (form.password) data.password_hash = U.hashPassword(form.password);
          DS.update('staff', form.id, data).then(function () { toastSuccess('已保存'); showEdit.value = false; load(); });
        } else {
          if (!form.password) { toast('请设置初始密码'); return; }
          DS.list('staff', { where: { login_account: form.login_account }, page: 1, pageSize: 1 }).then(function (r) {
            if (r.data && r.data.length) { toastFail('账号已存在'); return; }
            DS.create('staff', { name: form.name, phone: form.phone, login_account: form.login_account, role: form.role, commission_rate: Number(form.commission_rate) || 0, password_hash: U.hashPassword(form.password), status: 'active', avatar: '', created_at: U.now(), updated_at: U.now() }).then(function () { toastSuccess('已新增'); showEdit.value = false; load(); });
          });
        }
      }
      function resetPwd(s) { confirmDialog('确定重置「' + s.name + '」的密码为 123456 吗？').then(function () { return DS.update('staff', s.id, { password_hash: U.hashPassword('123456') }); }).then(function () { toastSuccess('已重置为 123456'); }).catch(function () {}); }
      function toggleStatus(s) { var ns = s.status === 'active' ? 'inactive' : 'active'; DS.update('staff', s.id, { status: ns }).then(function () { toastSuccess('已操作'); load(); }); }
      onMounted(load);
      return Object.assign({ list: list, refreshing: refreshing, showEdit: showEdit, isEdit: isEdit, form: form, showRole: showRole, roleActions: roleActions, onBack: onBack, onRefresh: onRefresh, openAdd: openAdd, openEdit: openEdit, pickRole: pickRole, save: save, resetPwd: resetPwd, toggleStatus: toggleStatus }, H);
    }
  };

  // ====================================================================
  // 14. AdminAnnouncement - 公告管理
  // ====================================================================
  V.AdminAnnouncement = {
    template: `
    <div class="page">
      <app-header title="公告管理" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div style="margin-bottom:10px;"><van-button icon="plus" type="primary" size="small" color="#d4a017" @click="openAdd">发布公告</van-button></div>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div v-for="a in list" :key="a.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div style="flex:1;">
                <div style="font-weight:600;color:#3a2410;">{{ a.title }} <van-tag v-if="a.popup" type="warning" plain>弹窗</van-tag> <van-tag v-if="a.status!=='active'" type="danger" plain>已下架</van-tag></div>
                <div style="font-size:13px;color:#666;margin-top:6px;line-height:1.6;">{{ a.content }}</div>
                <div style="font-size:12px;color:#999;margin-top:6px;">{{ fdate(a.start_at) }} ~ {{ fdate(a.end_at) }}</div>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;">
              <van-button size="small" plain color="#d4a017" @click="openEdit(a)">编辑</van-button>
              <van-button size="small" plain type="danger" @click="remove(a)">删除</van-button>
            </div>
          </div>
          <empty-state v-if="!list.length" text="暂无公告" />
        </van-pull-refresh>
      </div>
      <van-popup v-model:show="showEdit" round position="bottom" style="max-height:85%;">
        <div style="padding:16px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:12px;color:#3a2410;">{{ isEdit ? '编辑公告' : '发布公告' }}</div>
          <van-cell-group :border="false">
            <van-field v-model="form.title" label="标题" placeholder="请输入标题" />
            <van-field v-model="form.content" type="textarea" label="内容" placeholder="请输入内容" rows="4" />
            <van-field readonly clickable label="开始日期" :model-value="form.start_at" @click="pickStart" />
            <van-field readonly clickable label="结束日期" :model-value="form.end_at" @click="pickEnd" />
            <van-cell title="弹窗展示"><template #value><van-switch v-model="form.popup" /></template></van-cell>
            <van-cell title="上架状态"><template #value><van-switch v-model="form.statusOn" active-value="active" inactive-value="inactive" /></template></van-cell>
          </van-cell-group>
          <div style="margin-top:14px;"><van-button block round color="#d4a017" @click="save">保存</van-button></div>
        </div>
      </van-popup>
      <van-popup v-model:show="showStart" position="bottom" round><van-date-picker v-model="startVal" title="开始日期" @confirm="onStart" @cancel="showStart=false" /></van-popup>
      <van-popup v-model:show="showEnd" position="bottom" round><van-date-picker v-model="endVal" title="结束日期" @confirm="onEnd" @cancel="showEnd=false" /></van-popup>
    </div>`,
    setup: function () {
      var router = useRouter();
      var list = ref([]); var refreshing = ref(false);
      var showEdit = ref(false); var isEdit = ref(false);
      var form = reactive({ title: '', content: '', popup: false, statusOn: 'active', start_at: '', end_at: '' });
      var showStart = ref(false); var showEnd = ref(false); var startVal = ref([]); var endVal = ref([]);
      function onBack() { navBack(router); }
      function load() { refreshing.value = true; DS.list('announcements', { page: 1, pageSize: 999999 }).then(function (r) { list.value = r.data || []; }).finally(function () { refreshing.value = false; }); }
      function onRefresh() { load(); }
      function openAdd() { isEdit.value = false; Object.assign(form, { id: '', title: '', content: '', popup: false, statusOn: 'active', start_at: U.today(), end_at: dayjs().add(30, 'day').format('YYYY-MM-DD') }); showEdit.value = true; }
      function openEdit(a) { isEdit.value = true; Object.assign(form, { id: a.id, title: a.title || '', content: a.content || '', popup: !!a.popup, statusOn: a.status || 'active', start_at: a.start_at ? dayjs(a.start_at).format('YYYY-MM-DD') : '', end_at: a.end_at ? dayjs(a.end_at).format('YYYY-MM-DD') : '' }); showEdit.value = true; }
      function pickStart() { startVal.value = form.start_at ? form.start_at.split('-') : [String(dayjs().year()), '01', '01']; showStart.value = true; }
      function pickEnd() { endVal.value = form.end_at ? form.end_at.split('-') : [String(dayjs().year()), '12', '31']; showEnd.value = true; }
      function onStart() { form.start_at = startVal.value.join('-'); showStart.value = false; }
      function onEnd() { form.end_at = endVal.value.join('-'); showEnd.value = false; }
      function save() {
        if (!form.title || !form.content) { toast('请填写标题和内容'); return; }
        var data = { title: form.title, content: form.content, popup: form.popup, status: form.statusOn, start_at: form.start_at ? dayjs(form.start_at).toISOString() : null, end_at: form.end_at ? dayjs(form.end_at).toISOString() : null };
        if (isEdit.value) { DS.update('announcements', form.id, data).then(function () { toastSuccess('已保存'); showEdit.value = false; load(); }); }
        else { DS.create('announcements', Object.assign({}, data, { created_at: U.now(), updated_at: U.now() })).then(function () { toastSuccess('已发布'); showEdit.value = false; load(); }); }
      }
      function remove(a) { confirmDialog('确定删除该公告吗？').then(function () { return DS.remove('announcements', a.id); }).then(function () { toastSuccess('已删除'); load(); }).catch(function () {}); }
      onMounted(load);
      return Object.assign({ list: list, refreshing: refreshing, showEdit: showEdit, isEdit: isEdit, form: form, showStart: showStart, showEnd: showEnd, startVal: startVal, endVal: endVal, onBack: onBack, onRefresh: onRefresh, openAdd: openAdd, openEdit: openEdit, pickStart: pickStart, pickEnd: pickEnd, onStart: onStart, onEnd: onEnd, save: save, remove: remove }, H);
    }
  };

  // ====================================================================
  // 15. AdminCommission - 佣金管理
  // ====================================================================
  V.AdminCommission = {
    template: `
    <div class="page">
      <app-header title="佣金管理" :show-back="true" @back="onBack" />
      <van-tabs v-model:active="activeTab" sticky color="#d4a017">
        <van-tab title="佣金明细">
          <div style="padding:12px;">
            <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">
              <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">邀请佣金比例设置</div>
              <div style="display:flex;align-items:center;gap:8px;">
                <van-field v-model="rateInput" type="number" placeholder="比例" style="flex:1;" />
                <span style="color:#999;">%</span>
                <van-button size="small" color="#d4a017" @click="saveRate">保存</van-button>
              </div>
              <div style="font-size:12px;color:#999;margin-top:6px;">当前比例：{{ rate }}%（被邀请人消费/充值时，邀请人按此比例获得佣金）</div>
            </div>
            <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
              <van-cell-group inset>
                <van-cell v-for="c in list" :key="c.id">
                  <template #title>
                    <div>{{ c.source_type }} · 邀请人 {{ memberName(c.referrer_id) }} ← {{ memberName(c.source_member_id) }}</div>
                    <div style="font-size:12px;color:#999;">{{ ftime(c.created_at) }} · 比例 {{ c.rate }}%</div>
                  </template>
                  <template #value>
                    <div style="color:#c0532a;font-weight:600;">¥{{ money(c.amount) }}</div>
                    <van-tag :class="tagc('commission', c.status)" style="margin-top:4px;">{{ st('commission', c.status) }}</van-tag>
                  </template>
                  <template #right-icon>
                    <van-button v-if="c.status==='pending'" size="mini" plain color="#d4a017" @click="settle(c)" style="margin-left:8px;">结算</van-button>
                  </template>
                </van-cell>
              </van-cell-group>
              <empty-state v-if="!list.length" text="暂无佣金记录" />
            </van-pull-refresh>
          </div>
        </van-tab>
        <van-tab title="提现审核">
          <div style="padding:12px;">
            <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
              <div v-for="w in withdrawals" :key="w.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                  <div>
                    <div style="font-weight:600;color:#3a2410;">{{ memberName(w.member_id) }} 申请提现</div>
                    <div style="font-size:12px;color:#999;margin-top:4px;">{{ ftime(w.created_at) }}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="font-size:16px;color:#c0532a;font-weight:bold;">¥{{ money(w.amount) }}</div>
                    <van-tag :type="w.status==='pending'?'warning':(w.status==='approved'?'success':'danger')" style="margin-top:4px;">{{ w.status==='pending'?'待审核':(w.status==='approved'?'已通过':'已拒绝') }}</van-tag>
                  </div>
                </div>
                <div v-if="w.status==='pending'" style="display:flex;gap:8px;margin-top:10px;">
                  <van-button size="small" type="primary" color="#d4a017" @click="approve(w)">通过</van-button>
                  <van-button size="small" plain type="danger" @click="reject(w)">拒绝</van-button>
                </div>
              </div>
              <empty-state v-if="!withdrawals.length" text="暂无提现申请" />
            </van-pull-refresh>
          </div>
        </van-tab>
      </van-tabs>
    </div>`,
    setup: function () {
      var router = useRouter();
      var activeTab = ref(0);
      var rate = ref(10); var rateInput = ref('10');
      var list = ref([]); var withdrawals = ref([]); var refreshing = ref(false); var members = ref([]);
      function onBack() { navBack(router); }
      function load() {
        refreshing.value = true;
        Promise.all([
          DS.list('commissions', { page: 1, pageSize: 999999 }),
          DS.list('withdrawals', { page: 1, pageSize: 999999 }),
          DS.list('members', { page: 1, pageSize: 999999 })
        ]).then(function (res) {
          list.value = res[0].data || [];
          withdrawals.value = res[1].data || [];
          members.value = res[2].data || [];
        }).finally(function () { refreshing.value = false; });
      }
      function onRefresh() { load(); }
      function loadRate() { DS.getSetting('invite_commission_rate').then(function (v) { rate.value = parseFloat(v) || 10; rateInput.value = String(rate.value); }); }
      function saveRate() { DS.setSetting('invite_commission_rate', rateInput.value).then(function () { rate.value = parseFloat(rateInput.value) || 10; toastSuccess('已保存'); }); }
      function memberName(id) { var m = members.value.find(function (x) { return x.id === id; }); return m ? m.name : '未知'; }
      function approve(w) { confirmDialog('确认通过该提现申请吗？').then(function () { return DS.update('withdrawals', w.id, { status: 'approved' }); }).then(function () { toastSuccess('已通过'); load(); }).catch(function () {}); }
      function reject(w) { confirmDialog('确定拒绝该提现申请吗？').then(function () { return DS.update('withdrawals', w.id, { status: 'rejected' }); }).then(function () { toastSuccess('已拒绝'); load(); }).catch(function () {}); }
      function settle(c) { DS.update('commissions', c.id, { status: 'settled' }).then(function () { toastSuccess('已结算'); load(); }); }
      onMounted(function () { loadRate(); load(); });
      return Object.assign({ activeTab: activeTab, rate: rate, rateInput: rateInput, list: list, withdrawals: withdrawals, refreshing: refreshing, onBack: onBack, onRefresh: onRefresh, saveRate: saveRate, memberName: memberName, approve: approve, reject: reject, settle: settle }, H);
    }
  };

  // ====================================================================
  // 16. AdminRechargeRules - 充值规则
  // ====================================================================
  V.AdminRechargeRules = {
    template: `
    <div class="page">
      <app-header title="充值规则" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div style="margin-bottom:10px;"><van-button icon="plus" type="primary" size="small" color="#d4a017" @click="openAdd">新增规则</van-button></div>
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div v-for="r in list" :key="r.id" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
              <div>
                <div style="font-weight:600;color:#3a2410;">充 {{ money(r.pay_amount) }} 元 <van-tag v-if="r.status!=='active'" type="danger" plain>已停用</van-tag></div>
                <div style="font-size:13px;color:#c0532a;margin-top:4px;">赠 {{ money(r.gift_amount) }}元 + {{ r.gift_points }}积分{{ r.gift_package_id ? ' + 赠'+pkgName(r.gift_package_id)+'×'+r.gift_times : '' }}</div>
                <div style="font-size:12px;color:#999;margin-top:4px;">排序 {{ r.sort }}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                <van-button size="mini" plain color="#d4a017" @click="openEdit(r)">编辑</van-button>
                <van-button size="mini" plain type="danger" @click="remove(r)">删除</van-button>
              </div>
            </div>
          </div>
          <empty-state v-if="!list.length" text="暂无充值规则" />
        </van-pull-refresh>
      </div>
      <van-popup v-model:show="showEdit" round position="bottom" style="max-height:85%;">
        <div style="padding:16px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:12px;color:#3a2410;">{{ isEdit ? '编辑规则' : '新增规则' }}</div>
          <van-cell-group :border="false">
            <van-field v-model="form.pay_amount" type="number" label="充值金额" placeholder="元" />
            <van-field v-model="form.gift_amount" type="number" label="赠送金额" placeholder="元" />
            <van-field v-model="form.gift_points" type="digit" label="赠送积分" placeholder="积分" />
            <van-field readonly clickable label="赠送套餐" :model-value="form.gift_package_id ? pkgName(form.gift_package_id) : '无'" @click="showPkg = true" />
            <van-field v-if="form.gift_package_id" v-model="form.gift_times" type="digit" label="赠送次数" placeholder="次数" />
            <van-field v-model="form.sort" type="digit" label="排序" placeholder="数字越小越靠前" />
            <van-cell title="状态"><template #value><van-switch v-model="form.statusOn" active-value="active" inactive-value="inactive" /></template></van-cell>
          </van-cell-group>
          <div style="margin-top:14px;display:flex;gap:8px;">
            <van-button block round plain @click="showEdit = false">取消</van-button>
            <van-button block round color="#d4a017" @click="save">保存</van-button>
          </div>
        </div>
      </van-popup>
      <van-action-sheet v-model:show="showPkg" :actions="pkgActions" cancel-text="取消" close-on-click-action @select="pickPkg" />
    </div>`,
    setup: function () {
      var router = useRouter();
      var list = ref([]); var refreshing = ref(false);
      var showEdit = ref(false); var isEdit = ref(false);
      var form = reactive({ pay_amount: 0, gift_amount: 0, gift_points: 0, gift_package_id: '', gift_times: 0, statusOn: 'active', sort: 1 });
      var packages = ref([]); var showPkg = ref(false);
      var pkgActions = computed(function () {
        var arr = [{ name: '无', value: '' }];
        packages.value.forEach(function (p) { arr.push({ name: p.name, value: p.id }); });
        return arr;
      });
      function onBack() { navBack(router); }
      function load() { refreshing.value = true; Promise.all([DS.list('recharge_rules', { page: 1, pageSize: 999999 }), DS.list('packages', { page: 1, pageSize: 999999 })]).then(function (res) { list.value = res[0].data || []; packages.value = res[1].data || []; }).finally(function () { refreshing.value = false; }); }
      function onRefresh() { load(); }
      function openAdd() { isEdit.value = false; Object.assign(form, { id: '', pay_amount: 0, gift_amount: 0, gift_points: 0, gift_package_id: '', gift_times: 0, statusOn: 'active', sort: list.value.length + 1 }); showEdit.value = true; }
      function openEdit(r) { isEdit.value = true; Object.assign(form, { id: r.id, pay_amount: r.pay_amount || 0, gift_amount: r.gift_amount || 0, gift_points: r.gift_points || 0, gift_package_id: r.gift_package_id || '', gift_times: r.gift_times || 0, statusOn: r.status || 'active', sort: r.sort || 1 }); showEdit.value = true; }
      function pickPkg(a) { form.gift_package_id = a.value; if (!a.value) form.gift_times = 0; showPkg.value = false; }
      function pkgName(id) { var p = packages.value.find(function (x) { return x.id === id; }); return p ? p.name : ''; }
      function save() {
        var data = { pay_amount: Number(form.pay_amount) || 0, gift_amount: Number(form.gift_amount) || 0, gift_points: Number(form.gift_points) || 0, gift_package_id: form.gift_package_id || null, gift_times: Number(form.gift_times) || 0, status: form.statusOn, sort: Number(form.sort) || 1 };
        if (isEdit.value) { DS.update('recharge_rules', form.id, data).then(function () { toastSuccess('已保存'); showEdit.value = false; load(); }); }
        else { DS.create('recharge_rules', Object.assign({}, data, { created_at: U.now(), updated_at: U.now() })).then(function () { toastSuccess('已新增'); showEdit.value = false; load(); }); }
      }
      function remove(r) { confirmDialog('确定删除该规则吗？').then(function () { return DS.remove('recharge_rules', r.id); }).then(function () { toastSuccess('已删除'); load(); }).catch(function () {}); }
      onMounted(load);
      return Object.assign({ list: list, refreshing: refreshing, showEdit: showEdit, isEdit: isEdit, form: form, packages: packages, showPkg: showPkg, pkgActions: pkgActions, onBack: onBack, onRefresh: onRefresh, openAdd: openAdd, openEdit: openEdit, pickPkg: pickPkg, pkgName: pkgName, save: save, remove: remove }, H);
    }
  };

  // ====================================================================
  // 17. ProjectEdit - 项目编辑
  // ====================================================================
  V.ProjectEdit = {
    template: `
    <div class="page">
      <app-header :title="isEdit ? '编辑项目' : '新增项目'" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <van-form @submit="save">
          <van-cell-group inset>
            <van-field v-model="form.name" label="项目名称" placeholder="请输入名称" required :rules="[{ required: true, message: '请输入名称' }]" />
            <van-field readonly clickable label="分类" :model-value="form.category" @click="showCat = true" />
            <van-field v-model="form.price" type="number" label="价格" placeholder="元" required :rules="[{ required: true, message: '请输入价格' }]" />
            <van-field v-model="form.duration_min" type="digit" label="时长" placeholder="分钟">
              <template #button>分钟</template>
            </van-field>
            <van-field v-model="form.description" type="textarea" label="简介" placeholder="项目简介" rows="2" />
            <van-field v-model="form.sort" type="digit" label="排序" placeholder="数字越小越靠前" />
            <van-cell title="状态"><template #value><van-switch v-model="form.statusOn" active-value="active" inactive-value="inactive" /></template></van-cell>
          </van-cell-group>
          <div style="margin:16px;"><van-button block round type="primary" color="#d4a017" native-type="submit">保存</van-button></div>
        </van-form>
      </div>
      <van-action-sheet v-model:show="showCat" :actions="catActions" cancel-text="取消" close-on-click-action @select="pickCat" />
    </div>`,
    setup: function () {
      var router = useRouter(); var route = useRoute();
      var id = route.params.id;
      var isEdit = !!id;
      var form = reactive({ name: '', category: '推拿理疗', price: 0, duration_min: 60, description: '', sort: 1, statusOn: 'active' });
      var showCat = ref(false);
      var catActions = ['推拿理疗', '艾灸养生', '面部护理', '足浴养生', '其他'].map(function (c) { return { name: c, value: c }; });
      function onBack() { navBack(router); }
      onMounted(function () {
        if (isEdit) { DS.get('projects', id).then(function (p) { if (p) Object.assign(form, { name: p.name || '', category: p.category || '推拿理疗', price: p.price || 0, duration_min: p.duration_min || 60, description: p.description || '', sort: p.sort || 1, statusOn: p.status || 'active' }); }); }
        else { DS.list('projects', { page: 1, pageSize: 999999 }).then(function (r) { form.sort = (r.data || []).length + 1; }); }
      });
      function pickCat(a) { form.category = a.value; showCat.value = false; }
      function save() {
        var data = { name: form.name, category: form.category, price: Number(form.price) || 0, duration_min: Number(form.duration_min) || 0, description: form.description, sort: Number(form.sort) || 1, status: form.statusOn };
        if (isEdit) { DS.update('projects', id, data).then(function () { toastSuccess('已保存'); navBack(router); }); }
        else { DS.create('projects', Object.assign({}, data, { created_at: U.now(), updated_at: U.now() })).then(function () { toastSuccess('已新增'); navBack(router); }); }
      }
      return Object.assign({ isEdit: isEdit, form: form, showCat: showCat, catActions: catActions, onBack: onBack, pickCat: pickCat, save: save }, H);
    }
  };

  // ====================================================================
  // 18. PackageEdit - 套餐编辑
  // ====================================================================
  V.PackageEdit = {
    template: `
    <div class="page">
      <app-header :title="isEdit ? '编辑套餐' : '新增套餐'" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <van-form @submit="save">
          <van-cell-group inset>
            <van-field v-model="form.name" label="套餐名称" placeholder="请输入名称" required :rules="[{ required: true, message: '请输入名称' }]" />
            <van-field v-model="form.price" type="number" label="售价" placeholder="元" required :rules="[{ required: true, message: '请输入售价' }]" />
            <van-field v-model="form.original_price" type="number" label="原价" placeholder="元" />
            <van-field v-model="form.validity_days" type="digit" label="有效期" placeholder="天">
              <template #button>天</template>
            </van-field>
            <van-field v-model="form.description" type="textarea" label="说明" placeholder="套餐说明" rows="2" />
            <van-field v-model="form.sort" type="digit" label="排序" placeholder="数字" />
            <van-cell title="状态"><template #value><van-switch v-model="form.statusOn" active-value="active" inactive-value="inactive" /></template></van-cell>
          </van-cell-group>
          <div style="margin:14px 16px;font-weight:bold;color:#6b4423;">包含项目</div>
          <van-cell-group inset>
            <div v-for="p in projects" :key="p.id" style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #f5f0ea;">
              <div @click="toggleProject(p)" style="flex:1;">
                <van-checkbox :model-value="!!selected[p.id]" @click.prevent="toggleProject(p)" shape="square">{{ p.name }}（¥{{ money(p.price) }}）</van-checkbox>
              </div>
              <div v-if="selected[p.id]" style="display:flex;align-items:center;gap:6px;">
                <van-button size="mini" plain @click="changeTimes(p,-1)">-</van-button>
                <span style="min-width:24px;text-align:center;">{{ selected[p.id] }}次</span>
                <van-button size="mini" plain @click="changeTimes(p,1)">+</van-button>
              </div>
            </div>
          </van-cell-group>
          <div style="margin:16px;"><van-button block round type="primary" color="#d4a017" native-type="submit">保存套餐</van-button></div>
        </van-form>
      </div>
    </div>`,
    setup: function () {
      var router = useRouter(); var route = useRoute();
      var id = route.params.id; var isEdit = !!id;
      var form = reactive({ name: '', price: 0, original_price: 0, validity_days: 90, description: '', sort: 1, statusOn: 'active' });
      var projects = ref([]); var selected = reactive({});
      function onBack() { navBack(router); }
      onMounted(function () {
        DS.list('projects', { where: { status: 'active' }, page: 1, pageSize: 999 }).then(function (pr) {
          projects.value = pr.data || [];
          if (isEdit) {
            DS.get('packages', id).then(function (p) { if (p) Object.assign(form, { name: p.name || '', price: p.price || 0, original_price: p.original_price || 0, validity_days: p.validity_days || 90, description: p.description || '', sort: p.sort || 1, statusOn: p.status || 'active' }); });
            DS.list('package_items', { where: { package_id: id }, page: 1, pageSize: 999 }).then(function (res) { (res.data || []).forEach(function (it) { selected[it.project_id] = it.times || 1; }); });
          } else { DS.list('packages', { page: 1, pageSize: 999999 }).then(function (r) { form.sort = (r.data || []).length + 1; }); }
        });
      });
      function toggleProject(p) { if (selected[p.id]) { delete selected[p.id]; } else { selected[p.id] = 1; } }
      function changeTimes(p, d) { var q = (selected[p.id] || 0) + d; if (q <= 0) delete selected[p.id]; else selected[p.id] = q; }
      function save() {
        var data = { name: form.name, price: Number(form.price) || 0, original_price: Number(form.original_price) || 0, validity_days: Number(form.validity_days) || 0, description: form.description, sort: Number(form.sort) || 1, status: form.statusOn };
        var items = Object.keys(selected).map(function (pid) { return { project_id: pid, times: selected[pid] }; });
        if (isEdit) {
          DS.update('packages', id, data).then(function () {
            return DS.list('package_items', { where: { package_id: id }, page: 1, pageSize: 999 });
          }).then(function (old) {
            var chain = Promise.resolve();
            (old.data || []).forEach(function (o) { chain = chain.then(function () { return DS.remove('package_items', o.id); }); });
            return chain;
          }).then(function () {
            if (items.length) return DS.bulkCreate('package_items', items.map(function (i) { return Object.assign({ package_id: id }, i); }));
          }).then(function () { toastSuccess('已保存'); navBack(router); });
        } else {
          DS.create('packages', Object.assign({}, data, { created_at: U.now(), updated_at: U.now() })).then(function (pkg) {
            if (items.length) return DS.bulkCreate('package_items', items.map(function (i) { return Object.assign({ package_id: pkg.id }, i); }));
          }).then(function () { toastSuccess('已新增'); navBack(router); });
        }
      }
      return Object.assign({ isEdit: isEdit, form: form, projects: projects, selected: selected, onBack: onBack, toggleProject: toggleProject, changeTimes: changeTimes, save: save }, H);
    }
  };

  // ====================================================================
  // 19. CashierCheckout - 完整开单收银
  // ====================================================================
  V.CashierCheckout = {
    template: `
    <div class="page" style="padding-bottom:130px;">
      <app-header title="开单收银" :show-back="true" @back="onBack" />
      <div style="padding:12px;">
        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">① 选择会员</div>
          <van-search v-model="phone" placeholder="输入姓名 / 手机号搜索" shape="round" @search="searchMember" />
          <div v-if="member" style="margin-top:8px;padding:10px;background:#faf4ea;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <span style="font-weight:600;">{{ member.name }}</span>
              <span style="color:#999;font-size:12px;margin-left:8px;">{{ maskPhone(member.phone) }}</span>
              <van-tag :class="tagc('memberLevelTag', member.level)" style="margin-left:6px;">{{ st('memberLevel', member.level) }}</van-tag>
            </div>
            <div style="text-align:right;font-size:12px;">
              <div style="color:#c0532a;">余额 ¥{{ money(member.balance) }}</div>
              <div style="color:#999;">积分 {{ member.points || 0 }}</div>
            </div>
          </div>
          <van-button v-else size="small" color="#d4a017" plain @click="searchMember" style="margin-top:8px;">选择会员</van-button>
        </div>

        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">② 选择项目</div>
          <van-tabs v-model:active="activeCat" shrink color="#d4a017">
            <van-tab v-for="c in categories" :key="c" :title="c" :name="c">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 0;">
                <div v-for="p in filteredProjects" :key="p.id" @click="toggleProject(p)"
                  :style="'border-radius:8px;padding:10px;border:1px solid ' + (selected[p.id] ? '#d4a017' : '#eee') + ';background:' + (selected[p.id] ? '#faf4ea' : '#fff') + ';'">
                  <div style="font-size:13px;font-weight:600;color:#3a2410;">{{ p.name }}</div>
                  <div style="font-size:12px;color:#c0532a;margin-top:4px;">¥{{ money(p.price) }} / {{ p.duration_min }}分钟</div>
                  <div v-if="selected[p.id]" style="margin-top:6px;display:flex;align-items:center;justify-content:space-between;">
                    <van-button size="mini" plain @click.stop="changeQty(p,-1)">-</van-button>
                    <span style="font-size:13px;">×{{ selected[p.id] }}</span>
                    <van-button size="mini" plain @click.stop="changeQty(p,1)">+</van-button>
                  </div>
                </div>
              </div>
            </van-tab>
          </van-tabs>
        </div>

        <div style="background:#fff;border-radius:12px;padding:14px;margin-bottom:12px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">③ 开单选项</div>
          <van-field readonly clickable label="服务技师" :model-value="staffName || '不指定技师'" @click="showStaff = true" is-link />
          <van-field readonly clickable label="支付方式" :model-value="st('payMethod', payMethod)" @click="showPay = true" is-link />
          <van-cell v-if="hasPackageAvailable" title="套餐抵扣">
            <template #value><van-switch v-model="usePackage" /></template>
            <template #label><span style="font-size:12px;color:#999;">{{ packageDesc }}</span></template>
          </van-cell>
          <van-cell title="累计积分"><template #value><span style="color:#d4a017;">+{{ pointsEarned }} 积分</span></template></van-cell>
        </div>

        <div style="background:#fff;border-radius:12px;padding:14px;">
          <div style="font-weight:bold;color:#6b4423;margin-bottom:10px;">订单明细</div>
          <div v-for="it in selectedList" :key="it.project.id" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;">
            <span>{{ it.project.name }} ×{{ it.qty }}{{ it.deducted ? '（套餐）' : '' }}</span>
            <span :style="'color:' + (it.deducted ? '#999;text-decoration:line-through' : '#c0532a') + ';'">¥{{ money(it.subtotal) }}</span>
          </div>
          <div v-if="!selectedList.length" style="color:#999;font-size:13px;text-align:center;padding:10px 0;">尚未选择项目</div>
          <div style="border-top:1px dashed #eee;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;font-weight:bold;color:#3a2410;">
            <span>实付金额</span><span style="color:#c0532a;font-size:18px;">¥{{ money(total) }}</span>
          </div>
        </div>
      </div>

      <div style="position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #eee;padding:12px 14px;display:flex;align-items:center;gap:12px;z-index:10;">
        <div style="flex:1;">
          <div style="font-size:12px;color:#999;">合计 {{ selectedList.length }} 项</div>
          <div style="font-size:20px;color:#c0532a;font-weight:bold;">¥{{ money(total) }}</div>
        </div>
        <van-button type="primary" round :loading="submitting" color="linear-gradient(90deg,#d4a017,#c0532a)" size="large" @click="submit">确认开单</van-button>
      </div>

      <van-popup v-model:show="showMember" position="bottom" round style="max-height:60%;">
        <div style="padding:12px;">
          <div style="font-weight:bold;text-align:center;margin-bottom:10px;">选择会员</div>
          <van-cell v-for="m in memberResults" :key="m.id" :title="m.name" :label="maskPhone(m.phone)" is-link @click="pickMember(m)">
            <template #value><span style="color:#c0532a;">¥{{ money(m.balance) }}</span></template>
          </van-cell>
          <empty-state v-if="!memberResults.length" text="未找到会员" />
        </div>
      </van-popup>
      <van-action-sheet v-model:show="showStaff" :actions="staffActions" cancel-text="取消" close-on-click-action @select="pickStaff" />
      <van-action-sheet v-model:show="showPay" :actions="payActions" cancel-text="取消" close-on-click-action @select="pickPay" />
    </div>`,
    setup: function () {
      var router = useRouter();
      var phone = ref('');
      var member = ref(null);
      var showMember = ref(false); var memberResults = ref([]);
      var projects = ref([]); var categories = ref(['全部']); var activeCat = ref('全部');
      var selected = reactive({});
      var staffs = ref([]); var staffId = ref(''); var showStaff = ref(false);
      var payMethod = ref('cash'); var showPay = ref(false);
      var usePackage = ref(false);
      var memberPkgs = ref([]); var pkgItems = ref([]);
      var submitting = ref(false);
      var payActions = [{ name: '现金', value: 'cash' }, { name: '微信支付', value: 'wechat' }, { name: '支付宝', value: 'alipay' }, { name: '会员余额', value: 'balance' }, { name: '刷卡', value: 'card' }];

      var staffName = computed(function () { var s = staffs.value.find(function (x) { return x.id === staffId.value; }); return s ? s.name : ''; });
      var staffActions = computed(function () { var arr = [{ name: '不指定技师', value: '' }]; staffs.value.forEach(function (s) { arr.push({ name: s.name + '（' + st('staffRole', s.role) + '）', value: s.id }); }); return arr; });
      var filteredProjects = computed(function () { if (activeCat.value === '全部') return projects.value; return projects.value.filter(function (p) { return (p.category || '其他') === activeCat.value; }); });

      function applicablePackage(projectId) {
        if (!member.value) return null;
        for (var i = 0; i < memberPkgs.value.length; i++) {
          var mp = memberPkgs.value[i];
          if (mp.status !== 'active' || (mp.remain_times || 0) <= 0) continue;
          if (mp.expire_at && dayjs(mp.expire_at).isBefore(dayjs(), 'day')) continue;
          var has = pkgItems.value.some(function (it) { return it.package_id === mp.package_id && it.project_id === projectId; });
          if (has) return mp;
        }
        return null;
      }
      var selectedList = computed(function () {
        return projects.value.filter(function (p) { return selected[p.id]; }).map(function (p) {
          var qty = selected[p.id];
          var deducted = usePackage.value && !!applicablePackage(p.id);
          var mp = deducted ? applicablePackage(p.id) : null;
          return { project: p, qty: qty, deducted: deducted, subtotal: deducted ? 0 : Number(p.price || 0) * qty, mp: mp };
        });
      });
      var total = computed(function () { return selectedList.value.reduce(function (s, it) { return s + it.subtotal; }, 0); });
      var pointsEarned = computed(function () { return Math.floor(total.value); });
      var hasPackageAvailable = computed(function () { return selectedList.value.some(function (it) { return !!applicablePackage(it.project.id); }); });
      var packageDesc = computed(function () {
        var cnt = selectedList.value.filter(function (it) { return applicablePackage(it.project.id); }).length;
        return cnt ? '当前有 ' + cnt + ' 个项目可用套餐抵扣' : '无可用套餐';
      });
      function load() {
        DS.list('projects', { where: { status: 'active' }, page: 1, pageSize: 999 }).then(function (r) {
          projects.value = r.data || [];
          var cats = ['全部'];
          projects.value.forEach(function (p) { if (p.category && cats.indexOf(p.category) < 0) cats.push(p.category); });
          categories.value = cats;
        });
        DS.list('staff', { where: { status: 'active' }, page: 1, pageSize: 999 }).then(function (r) { staffs.value = r.data || []; });
        DS.list('package_items', { page: 1, pageSize: 9999 }).then(function (r) { pkgItems.value = r.data || []; });
      }
      function loadMemberPackages() {
        if (!member.value) { memberPkgs.value = []; return; }
        DS.list('member_packages', { where: { member_id: member.value.id }, page: 1, pageSize: 100 }).then(function (r) { memberPkgs.value = r.data || []; });
      }
      function searchMember() {
        DS.list('members', { page: 1, pageSize: 999999 }).then(function (r) {
          var data = r.data || [];
          if (phone.value) { var kw = phone.value.toLowerCase(); data = data.filter(function (m) { return (m.name && m.name.toLowerCase().indexOf(kw) >= 0) || (m.phone && m.phone.indexOf(kw) >= 0); }); }
          memberResults.value = data.slice(0, 30);
          showMember.value = true;
        });
      }
      function pickMember(m) { member.value = m; phone.value = m.phone; showMember.value = false; usePackage.value = false; loadMemberPackages(); }
      function pickStaff(a) { staffId.value = a.value; }
      function pickPay(a) { payMethod.value = a.value; }
      function toggleProject(p) { if (selected[p.id]) { delete selected[p.id]; } else { selected[p.id] = 1; } }
      function changeQty(p, d) { var q = (selected[p.id] || 0) + d; if (q <= 0) delete selected[p.id]; else selected[p.id] = q; }
      function handleCheckout() {
        if (!member.value) { showToast('请先选择会员'); return; }
        var sel = selectedList.value;
        if (sel.length === 0) { showToast('请选择服务项目'); return; }
        var items = sel.map(function (it) {
          var item = { project_id: it.project.id, name: it.project.name, price: Number(it.project.price || 0), qty: it.qty, subtotal: it.subtotal };
          if (it.mp) item.member_package_id = it.mp.id;
          return item;
        });
        var payMethodText = { balance: '余额支付', cash: '现金', wechat: '微信支付', alipay: '支付宝', card: '刷卡' };
        showConfirmDialog({
          title: '确认开单', message: '应付金额：¥' + U.formatMoney(total.value) + '\n支付方式：' + (payMethodText[payMethod.value] || '现金')
        }).then(function () {
          orderStore.create({
            member_id: member.value.id, staff_id: staffId.value || null, items: items,
            original_amount: total.value, discount_amount: 0, paid_amount: total.value,
            pay_method: payMethod.value, points_earned: pointsEarned.value, status: 'paid'
          }).then(function () {
            if (member.value.referrer_id) {
              commissionStore.calculateCommission(member.value.referrer_id, member.value.id, '消费', null, total.value);
            }
            showSuccessToast('开单成功');
            setTimeout(function () { router.push('/admin/cashier'); }, 1000);
          })['catch'](function () { showToast('开单失败'); });
        })['catch'](function () {});
      }
      onMounted(load);
      return {
        member: member, phone: phone, showMember: showMember, memberResults: memberResults,
        staffs: staffs, staffId: staffId, staffName: staffName, staffActions: staffActions,
        projects: projects, categories: categories, activeCat: activeCat, filteredProjects: filteredProjects,
        selected: selected, selectedList: selectedList, total: total, pointsEarned: pointsEarned,
        payMethod: payMethod, payActions: payActions, usePackage: usePackage,
        hasPackageAvailable: hasPackageAvailable, packageDesc: packageDesc,
        searchMember: searchMember, pickMember: pickMember, pickStaff: pickStaff, pickPay: pickPay,
        toggleProject: toggleProject, changeQty: changeQty, handleCheckout: handleCheckout,
        formatMoney: function (v) { return U.formatMoney(v); }
      };
    },
    template: [
      '<div class="page-container no-tabbar">',
      '  <van-nav-bar title="开单收银" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div class="v-acc">',
      '    <div class="section card">',
      '      <div class="section-title">选择会员</div>',
      '      <van-field v-model="phone" placeholder="输入手机号或姓名搜索" @input="searchMember" clearable>',
      '        <template #left-icon><van-icon name="search" /></template>',
      '      </van-field>',
      '      <div v-if="member" class="member-info mt-12" style="display:flex;align-items:center;gap:12px;padding:12px;background:#faf6f0;border-radius:8px;">',
      '        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#d4a017,#e0b020);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;">{{ member.name.charAt(0) }}</div>',
      '        <div><div style="font-weight:600;">{{ member.name }}</div><div class="text-sm text-gray">余额 ¥{{ formatMoney(member.balance) }} · 积分 {{ member.points }}</div></div>',
      '      </div>',
      '    </div>',
      '    <div class="section card">',
      '      <div class="section-title">选择项目</div>',
      '      <van-tabs v-model:active="activeCat" shrink>',
      '        <van-tab v-for="cat in categories" :key="cat" :title="cat" :name="cat"></van-tab>',
      '      </van-tabs>',
      '      <div class="project-list mt-12">',
      '        <div v-for="p in filteredProjects" :key="p.id" @click="toggleProject(p)" :class="[\'project-item\', { active: !!selected[p.id] }]" style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid #f0ebe5;border-radius:8px;margin-bottom:8px;">',
      '          <div><div style="font-weight:600;">{{ p.name }}</div><div class="text-sm text-gray">¥{{ formatMoney(p.price) }} · {{ p.duration_min }}分钟</div></div>',
      '          <div v-if="selected[p.id]" style="display:flex;align-items:center;gap:8px;" @click.stop>',
      '            <van-button size="mini" @click="changeQty(p, -1)">-</van-button>',
      '            <span>{{ selected[p.id] }}</span>',
      '            <van-button size="mini" @click="changeQty(p, 1)">+</van-button>',
      '          </div>',
      '          <van-icon v-else name="circle" color="#ddd" />',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="section card">',
      '      <div class="section-title">支付方式</div>',
      '      <van-action-bar><van-action-bar-icon v-for="a in payActions" :key="a.value" :text="a.name" @click="pickPay(a)" :class="{ active: payMethod === a.value }" /></van-action-bar>',
      '    </div>',
      '  </div>',
      '  <van-popup v-model:show="showMember" position="bottom" round style="max-height:60%;">',
      '    <div style="padding:16px;"><div style="font-weight:600;margin-bottom:12px;">选择会员</div>',
      '      <div v-for="m in memberResults" :key="m.id" @click="pickMember(m)" class="list-item">',
      '        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#d4a017,#e0b020);display:flex;align-items:center;justify-content:center;color:#fff;margin-right:12px;">{{ m.name.charAt(0) }}</div>',
      '        <div><div style="font-weight:600;">{{ m.name }}</div><div class="text-sm text-gray">{{ m.phone }} · 余额¥{{ formatMoney(m.balance) }}</div></div>',
      '      </div>',
      '    </div>',
      '  </van-popup>',
      '  <div style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #f0ebe5;padding:12px 16px calc(12px + var(--ya-safe-bottom));display:flex;align-items:center;justify-content:space-between;z-index:100;">',
      '    <div><div class="text-sm text-gray">应付金额</div><div style="font-size:22px;font-weight:700;color:#d4a017;">¥{{ formatMoney(total) }}</div></div>',
      '    <van-button round type="primary" @click="handleCheckout">确认开单</van-button>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /* ========== 20. AdminSettings ========== */
  V.AdminSettings = {
    setup: function () {
      var router = VueRouter.useRouter();
      var authStore = YA.stores.auth();
      var syncStore = YA.stores.sync();
      var settingsStore = YA.stores.settings();

      var mode = ref('local');
      var lastSync = ref('');
      var exporting = ref(false);
      var storeName = ref('');
      var storeSlogan = ref('');
      var apkUrl = ref('');
      var commissionRate = ref(10);

      function loadData() {
        mode.value = syncStore.getMode();
        lastSync.value = syncStore.lastSyncTime || '';
        settingsStore.fetchAll().then(function () {
          storeName.value = settingsStore.getStoreName();
          storeSlogan.value = settingsStore.getSlogan();
          apkUrl.value = settingsStore.getApkDownloadUrl();
          commissionRate.value = settingsStore.getInviteCommissionRate();
        });
      }

      function handleSync() {
        syncStore.syncNow().then(function () {
          showSuccessToast('同步完成');
          lastSync.value = syncStore.lastSyncTime;
        });
      }

      function handleExport() {
        exporting.value = true;
        syncStore.exportData().then(function (data) {
          var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url; a.download = 'yiantang_data.json'; a.click();
          URL.revokeObjectURL(url);
          showSuccessToast('导出成功');
        })['finally'](function () { exporting.value = false; });
      }

      function handleSaveSettings() {
        Promise.all([
          settingsStore.set('store_name', storeName.value),
          settingsStore.set('store_slogan', storeSlogan.value),
          settingsStore.set('apk_download_url', apkUrl.value),
          settingsStore.set('invite_commission_rate', String(commissionRate.value))
        ]).then(function () { showSuccessToast('保存成功'); });
      }

      function handleLogout() {
        showConfirmDialog({ title: '确认退出', message: '确定要退出登录吗？' }).then(function () {
          authStore.adminLogout();
          router.replace('/admin/login');
        })['catch'](function () {});
      }

      onMounted(loadData);

      return {
        mode: mode, lastSync: lastSync, exporting: exporting,
        storeName: storeName, storeSlogan: storeSlogan, apkUrl: apkUrl, commissionRate: commissionRate,
        handleSync: handleSync, handleExport: handleExport, handleSaveSettings: handleSaveSettings,
        handleLogout: handleLogout
      };
    },
    template: [
      '<div class="page-container no-tabbar">',
      '  <van-nav-bar title="系统设置" left-arrow @click-left="$router.back()" safe-area-inset-top />',
      '  <div style="padding:12px 16px;">',
      '    <div class="card mb-12">',
      '      <div style="font-weight:600;margin-bottom:12px;">数据同步</div>',
      '      <van-cell-group inset :border="false">',
      '        <van-cell title="当前模式" :value="mode === \'cloud\' ? \'云端模式\' : \'本地模式\'" />',
      '        <van-cell title="上次同步" :value="lastSync ? lastSync : \'未同步\'" />',
      '      </van-cell-group>',
      '      <div style="margin-top:12px;"><van-button round block type="primary" @click="handleSync">立即同步</van-button></div>',
      '      <div style="margin-top:8px;"><van-button round block plain @click="handleExport" :loading="exporting">导出本地数据</van-button></div>',
      '    </div>',
      '    <div class="card mb-12">',
      '      <div style="font-weight:600;margin-bottom:12px;">系统设置</div>',
      '      <van-cell-group inset :border="false">',
      '        <van-field v-model="storeName" label="门店名称" placeholder="请输入门店名称" />',
      '        <van-field v-model="storeSlogan" label="门店标语" placeholder="请输入标语" />',
      '        <van-field v-model="apkUrl" label="APK下载地址" placeholder="请输入下载地址" />',
      '        <van-field v-model="commissionRate" label="佣金比例(%)" type="number" placeholder="请输入佣金比例" />',
      '      </van-cell-group>',
      '      <div style="margin-top:12px;"><van-button round block type="primary" @click="handleSaveSettings">保存设置</van-button></div>',
      '    </div>',
      '    <div class="card" style="text-align:center;">',
      '      <van-button round block type="danger" @click="handleLogout">退出登录</van-button>',
      '      <div style="margin-top:12px;color:#999;font-size:12px;">颐安堂 v1.0.0</div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  console.log('[YA] 管理端视图组件加载完成，共20个组件');
})();