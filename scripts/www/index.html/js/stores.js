/**
 * 颐安堂 - Pinia Stores
 * 使用全局 Pinia.defineStore
 */
(function() {
  const { defineStore } = Pinia;
  const DS = YA.dataService;
  const U = YA.utils;
  const Auth = YA.authService;

  YA.stores = {};

  // ===== auth store =====
  YA.stores.auth = defineStore('auth', {
    state: () => ({ admin: null, member: null }),
    getters: {
      isAdmin: s => !!s.admin,
      isMember: s => !!s.member,
      adminRole: s => s.admin?.role || '',
      memberId: s => s.member?.id || ''
    },
    actions: {
      initAuth() { this.admin = Auth.getAdminAuth(); this.member = Auth.getMemberAuth(); },
      async adminLogin(account, password) { const r = await Auth.adminLogin(account, password); if (r.success) this.admin = r.data; return r; },
      adminLogout() { Auth.adminLogout(); this.admin = null; },
      async memberLogin(phone, password) { const r = await Auth.memberLogin(phone, password); if (r.success) this.member = r.data; return r; },
      async memberRegister(data) { const r = await Auth.memberRegister(data); if (r.success) return await this.memberLogin(data.phone, data.password); return r; },
      memberLogout() { Auth.memberLogout(); this.member = null; },
      async updateMemberProfile(data) { if (!this.member) return; await DS.update('members', this.member.id, data); this.member = { ...this.member, ...data }; localStorage.setItem('member_auth', JSON.stringify(this.member)); },
      async changeAdminPassword(oldPwd, newPwd) {
        if (!this.admin) return { success: false, message: '未登录' };
        const staff = await DS.get('staff', this.admin.id);
        if (!staff) return { success: false, message: '账号不存在' };
        if (U.hashPassword(oldPwd) !== staff.password_hash) return { success: false, message: '旧密码错误' };
        await DS.update('staff', this.admin.id, { password_hash: U.hashPassword(newPwd) });
        return { success: true, message: '修改成功' };
      }
    }
  });

  // ===== member store =====
  YA.stores.member = defineStore('member', {
    state: () => ({ list: [], total: 0, currentMember: null, loading: false }),
    actions: {
      async fetchList(filters) { this.loading = true; try { const r = await DS.list('members', filters); this.list = r.data; this.total = r.total; } finally { this.loading = false; } },
      async search(keyword, page) { this.loading = true; try { const r = await DS.list('members', { search: { fields: ['name','phone'], keyword }, page: page||1, pageSize: 20 }); this.list = r.data; this.total = r.total; } finally { this.loading = false; } },
      async getById(id) { this.currentMember = await DS.get('members', id); return this.currentMember; },
      async create(data) { return await DS.create('members', data); },
      async update(id, data) { const u = await DS.update('members', id, data); if (this.currentMember?.id === id) this.currentMember = u; return u; },
      async recharge(memberId, amount, giftAmount, giftPoints) { const m = await DS.get('members', memberId); if (!m) return; await DS.update('members', memberId, { balance: (m.balance||0)+amount+(giftAmount||0), points: (m.points||0)+(giftPoints||0) }); },
      async deductBalance(memberId, amount) { const m = await DS.get('members', memberId); if (!m || (m.balance||0) < amount) return false; await DS.update('members', memberId, { balance: m.balance - amount }); return true; },
      async deductPoints(memberId, points) { const m = await DS.get('members', memberId); if (!m || (m.points||0) < points) return false; await DS.update('members', memberId, { points: m.points - points }); return true; },
      async getTodayNewCount() { const r = await DS.list('members', { page:1, pageSize:999999 }); return r.data.filter(m => m.created_at?.startsWith(U.today())).length; }
    }
  });

  // ===== appointment store =====
  YA.stores.appointment = defineStore('appointment', {
    state: () => ({ list: [], total: 0, loading: false }),
    actions: {
      async fetchList(filters) { this.loading = true; try { const r = await DS.list('appointments', filters); this.list = r.data; this.total = r.total; return r; } finally { this.loading = false; } },
      async create(data) { return await DS.create('appointments', { ...data, status: data.status||'pending', created_at: U.now(), updated_at: U.now() }); },
      async update(id, data) { return await DS.update('appointments', id, data); },
      async updateStatus(id, status) { return await DS.update('appointments', id, { status }); },
      async cancel(id) { return await DS.update('appointments', id, { status: 'cancelled' }); },
      async getByMember(memberId) { const r = await DS.list('appointments', { where: { member_id: memberId }, page:1, pageSize:100 }); return r.data; },
      async getTodayCount() { const r = await DS.list('appointments', { page:1, pageSize:999999 }); return r.data.filter(a => a.start_at?.startsWith(U.today())).length; },
      async getPendingCount() { const r = await DS.list('appointments', { where: { status: 'pending' }, page:1, pageSize:999999 }); return r.total; },
      async getRecent(limit) { const r = await DS.list('appointments', { page:1, pageSize: limit||5 }); return r.data; }
    }
  });

  // ===== project store =====
  YA.stores.project = defineStore('project', {
    state: () => ({ projects: [], packages: [], packageItems: [], loading: false }),
    actions: {
      async fetchProjects() { this.loading = true; try { const r = await DS.list('projects', { page:1, pageSize:100 }); this.projects = r.data; } finally { this.loading = false; } },
      async fetchPackages() { this.loading = true; try { const r = await DS.list('packages', { page:1, pageSize:100 }); this.packages = r.data; const ir = await DS.list('package_items', { page:1, pageSize:999 }); this.packageItems = ir.data; } finally { this.loading = false; } },
      async createProject(data) { return await DS.create('projects', data); },
      async updateProject(id, data) { return await DS.update('projects', id, data); },
      async deleteProject(id) { return await DS.remove('projects', id); },
      async createPackage(data, items) { const p = await DS.create('packages', data); if (items && items.length) await DS.bulkCreate('package_items', items.map(i => ({...i, package_id: p.id}))); await this.fetchPackages(); return p; },
      async updatePackage(id, data, items) { const p = await DS.update('packages', id, data); if (items !== null) { const old = this.packageItems.filter(i => i.package_id === id); for (const o of old) await DS.remove('package_items', o.id); if (items.length) await DS.bulkCreate('package_items', items.map(i => ({...i, package_id: id}))); } await this.fetchPackages(); return p; },
      async deletePackage(id) { const items = this.packageItems.filter(i => i.package_id === id); for (const i of items) await DS.remove('package_items', i.id); await DS.remove('packages', id); await this.fetchPackages(); },
      getPackageItems(pkgId) { return this.packageItems.filter(i => i.package_id === pkgId); },
      async getMemberPackages(memberId) { const r = await DS.list('member_packages', { where: { member_id: memberId }, page:1, pageSize:100 }); return r.data; },
      async createMemberPackage(data) { return await DS.create('member_packages', data); },
      async updateMemberPackage(id, data) { return await DS.update('member_packages', id, data); }
    }
  });

  // ===== order store =====
  YA.stores.order = defineStore('order', {
    state: () => ({ list: [], total: 0, loading: false }),
    actions: {
      async fetchList(filters) { this.loading = true; try { const r = await DS.list('orders', filters); this.list = r.data; this.total = r.total; return r; } finally { this.loading = false; } },
      async getByMember(memberId) { const r = await DS.list('orders', { where: { member_id: memberId }, page:1, pageSize:100 }); return r.data; },
      async create(orderData) {
        const order = await DS.create('orders', { ...orderData, order_no: orderData.order_no||U.genOrderNo(), status: orderData.status||'paid', created_at: U.now(), updated_at: U.now() });
        if (orderData.points_earned > 0 && orderData.member_id) { const m = await DS.get('members', orderData.member_id); if (m) await DS.update('members', m.id, { points: (m.points||0)+orderData.points_earned }); }
        if (orderData.pay_method === 'balance' && orderData.paid_amount > 0 && orderData.member_id) { const m = await DS.get('members', orderData.member_id); if (m) await DS.update('members', m.id, { balance: Math.max(0,(m.balance||0)-orderData.paid_amount) }); }
        if (orderData.items) { for (const item of orderData.items) { if (item.member_package_id) { const mp = await DS.get('member_packages', item.member_package_id); if (mp && mp.remain_times > 0) await DS.update('member_packages', mp.id, { remain_times: mp.remain_times-1 }); } } }
        return order;
      },
      async updateStatus(id, status) { return await DS.update('orders', id, { status }); },
      async getById(id) { return await DS.get('orders', id); },
      async getTodayRevenue() { const r = await DS.list('orders', { where: { status: 'paid' }, page:1, pageSize:999999 }); return r.data.filter(o => o.created_at?.startsWith(U.today())).reduce((s,o) => s+(o.paid_amount||0), 0); }
    }
  });

  // ===== mall store =====
  YA.stores.mall = defineStore('mall', {
    state: () => ({ gifts: [], redemptionOrders: [], loading: false }),
    actions: {
      async fetchGifts() { this.loading = true; try { const r = await DS.list('gifts', { page:1, pageSize:100 }); this.gifts = r.data; } finally { this.loading = false; } },
      async createGift(data) { return await DS.create('gifts', data); },
      async updateGift(id, data) { return await DS.update('gifts', id, data); },
      async deleteGift(id) { return await DS.remove('gifts', id); },
      async redeem(memberId, giftId) {
        const gift = await DS.get('gifts', giftId); if (!gift) return { success: false, message: '礼品不存在' };
        if (gift.stock <= 0) return { success: false, message: '库存不足' };
        const member = await DS.get('members', memberId); if (!member) return { success: false, message: '会员不存在' };
        if (gift.cost_type === 'points') { if ((member.points||0) < gift.cost_value) return { success: false, message: '积分不足' }; await DS.update('members', memberId, { points: member.points - gift.cost_value }); }
        else if (gift.cost_type === 'balance') { if ((member.balance||0) < gift.cost_value) return { success: false, message: '余额不足' }; await DS.update('members', memberId, { balance: member.balance - gift.cost_value }); }
        await DS.update('gifts', giftId, { stock: gift.stock - 1 });
        const order = await DS.create('redemption_orders', { member_id: memberId, gift_id: giftId, cost_type: gift.cost_type, cost_value: gift.cost_value, status: 'pending', created_at: U.now(), updated_at: U.now() });
        return { success: true, data: order };
      },
      async fetchRedemptionOrders(filters) { const r = await DS.list('redemption_orders', filters); this.redemptionOrders = r.data; return r; },
      async getMemberOrders(memberId) { const r = await DS.list('redemption_orders', { where: { member_id: memberId }, page:1, pageSize:100 }); return r.data; },
      async updateOrderStatus(id, status) { return await DS.update('redemption_orders', id, { status }); }
    }
  });

  // ===== commission store =====
  YA.stores.commission = defineStore('commission', {
    state: () => ({ list: [], withdrawals: [], loading: false }),
    actions: {
      async fetchList(filters) { this.loading = true; try { const r = await DS.list('commissions', filters); this.list = r.data; return r; } finally { this.loading = false; } },
      async getByReferrer(referrerId) { const r = await DS.list('commissions', { where: { referrer_id: referrerId }, page:1, pageSize:100 }); return r.data; },
      async calculateCommission(referrerId, sourceMemberId, sourceType, sourceId, amount) {
        const rateStr = await DS.getSetting('invite_commission_rate'); const rate = parseFloat(rateStr) || 10;
        return await DS.create('commissions', { referrer_id: referrerId, source_member_id: sourceMemberId, source_type: sourceType, source_id: sourceId, rate, amount: (amount*rate)/100, status: 'pending', created_at: U.now(), updated_at: U.now() });
      },
      async updateStatus(id, status) { return await DS.update('commissions', id, { status }); },
      async getTotalByReferrer(referrerId) {
        const list = await this.getByReferrer(referrerId);
        const total = list.reduce((s,c) => s+(c.amount||0), 0);
        const pending = list.filter(c => c.status==='pending').reduce((s,c) => s+(c.amount||0), 0);
        const settled = list.filter(c => c.status==='settled').reduce((s,c) => s+(c.amount||0), 0);
        return { total, pending, settled, count: list.length };
      },
      async requestWithdrawal(memberId, amount) { return await DS.create('withdrawals', { member_id: memberId, amount, status: 'pending', created_at: U.now(), updated_at: U.now() }); },
      async fetchWithdrawals(filters) { const r = await DS.list('withdrawals', filters); this.withdrawals = r.data; return r; },
      async updateWithdrawalStatus(id, status) { return await DS.update('withdrawals', id, { status }); }
    }
  });

  // ===== announcement store =====
  YA.stores.announcement = defineStore('announcement', {
    state: () => ({ list: [], loading: false }),
    actions: {
      async fetchList(filters) { this.loading = true; try { const r = await DS.list('announcements', filters); this.list = r.data; return r; } finally { this.loading = false; } },
      async getActive() { const nowIso = U.now(); const r = await DS.list('announcements', { where: { status: 'active' }, page:1, pageSize:100 }); return r.data.filter(a => !a.start_at || !a.end_at || (a.start_at <= nowIso && a.end_at >= nowIso)); },
      async create(data) { return await DS.create('announcements', { ...data, created_at: U.now(), updated_at: U.now() }); },
      async update(id, data) { return await DS.update('announcements', id, data); },
      async remove(id) { return await DS.remove('announcements', id); }
    }
  });

  // ===== settings store =====
  YA.stores.settings = defineStore('settings', {
    state: () => ({ settings: {}, loading: false }),
    actions: {
      async fetchAll() { this.loading = true; try { const r = await DS.list('settings', { page:1, pageSize:100 }); const m = {}; for (const i of r.data) m[i.key] = i.value; this.settings = m; } finally { this.loading = false; } },
      async get(key) { if (Object.keys(this.settings).length === 0) await this.fetchAll(); return this.settings[key] || null; },
      async set(key, value) { await DS.setSetting(key, value); this.settings[key] = value; },
      getStoreName() { return this.settings.store_name || '颐安堂'; },
      getSlogan() { return this.settings.store_slogan || '传承中医养生文化 · 呵护您的身心健康'; },
      getVersion() { return this.settings.app_version || '1.0.0'; },
      getApkDownloadUrl() { return this.settings.apk_download_url || 'https://yiantang.example.com/download.apk'; },
      getInviteCommissionRate() { return parseFloat(this.settings.invite_commission_rate) || 10; }
    }
  });

  // ===== sync store =====
  YA.stores.sync = defineStore('sync', {
    state: () => ({ mode: 'local', initialized: false, lastSyncTime: null }),
    actions: {
      async init() { if (this.initialized) return; await DS.init(); this.mode = DS.mode; this.initialized = true; },
      getMode() { return DS.mode; },
      subscribe(table, callback) { return DS.subscribe(table, callback); },
      async syncNow() { this.lastSyncTime = new Date().toISOString(); window.dispatchEvent(new CustomEvent('yiantang:sync')); return true; },
      async exportData() { return await DS.exportAll(); },
      async importData(data) { return await DS.importAll(data); }
    }
  });

  console.log('[YA] Pinia stores 加载完成');
})();
