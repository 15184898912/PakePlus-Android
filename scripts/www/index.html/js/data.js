/**
 * 颐安堂 - 数据服务层
 * 包含：工具函数、种子数据、本地适配器、数据服务、认证服务、二维码服务
 */

// ========== 工具函数 ==========
const YA = window.YA || (window.YA = {});

YA.utils = {
  genId(prefix) {
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 8);
    return prefix ? prefix + '_' + ts + rand : ts + rand;
  },
  genOrderNo() {
    const d = dayjs().format('YYYYMMDDHHmmss');
    const r = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return 'ORD' + d + r;
  },
  genInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  },
  hashPassword(password) {
    const salt = 'yiantang_2024';
    const str = password + salt;
    let hash = 0;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); hash = ((hash << 5) - hash) + c; hash = hash & hash; }
    return 'h' + Math.abs(hash).toString(16);
  },
  verifyPassword(password, hash) { return this.hashPassword(password) === hash; },
  formatMoney(yuan) { return yuan == null ? '0.00' : Number(yuan).toFixed(2); },
  formatDateTime(date, fmt) { return date ? dayjs(date).format(fmt || 'YYYY-MM-DD HH:mm') : ''; },
  formatDate(date, fmt) { return date ? dayjs(date).format(fmt || 'YYYY-MM-DD') : ''; },
  formatRelative(date) {
    if (!date) return '';
    const d = dayjs(date); const now = dayjs(); const dm = now.diff(d, 'minute');
    if (dm < 1) return '刚刚'; if (dm < 60) return dm + '分钟前';
    const dh = now.diff(d, 'hour'); if (dh < 24) return dh + '小时前';
    const dd = now.diff(d, 'day'); if (dd < 30) return dd + '天前';
    return d.format('YYYY-MM-DD');
  },
  today() { return dayjs().format('YYYY-MM-DD'); },
  now() { return new Date().toISOString(); },
  maskPhone(phone) { return phone && phone.length >= 7 ? phone.substring(0, 3) + '****' + phone.substring(7) : phone; },
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(i => this.deepClone(i));
    if (obj instanceof Object) { const c = {}; for (const k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) c[k] = this.deepClone(obj[k]); } return c; }
  }
};

YA.statusText = {
  appointment: { pending: '待确认', confirmed: '已确认', completed: '已完成', cancelled: '已取消' },
  appointmentTag: { pending: 'tag-gold', confirmed: 'tag-orange', completed: 'tag-green', cancelled: 'tag-gray' },
  order: { pending: '待支付', paid: '已支付', refunded: '已退款', void: '已作废' },
  redemption: { pending: '待核销', redeemed: '已核销', cancelled: '已取消' },
  commission: { pending: '待结算', settled: '已结算', withdrawn: '已提现' },
  staffRole: { admin: '管理员', cashier: '收银员', technician: '技师' },
  memberLevel: { normal: '普通会员', silver: '银卡会员', gold: '金卡会员', vip: 'VIP会员' },
  memberLevelTag: { normal: 'tag-gray', silver: 'tag-gold', gold: 'tag-orange', vip: 'tag-red' },
  payMethod: { balance: '余额支付', cash: '现金', wechat: '微信支付', alipay: '支付宝', card: '刷卡' }
};

// ========== 种子数据 ==========
YA.getSeedData = function() {
  const U = YA.utils;
  const now = U.now();
  const today = now.split('T')[0];
  const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

  return {
    staff: [
      { id: 'staff-001', name: '管理员', phone: '13800000001', login_account: 'admin', password_hash: U.hashPassword('admin123'), role: 'admin', commission_rate: 0, status: 'active', avatar: '', created_at: now, updated_at: now },
      { id: 'staff-002', name: '李技师', phone: '13800000002', login_account: 'liren', password_hash: U.hashPassword('123456'), role: 'technician', commission_rate: 30, status: 'active', avatar: '', created_at: now, updated_at: now },
      { id: 'staff-003', name: '王收银', phone: '13800000003', login_account: 'wangshou', password_hash: U.hashPassword('123456'), role: 'cashier', commission_rate: 0, status: 'active', avatar: '', created_at: now, updated_at: now }
    ],
    members: [
      { id: 'member-001', name: '张伟', phone: '13900000001', password_hash: U.hashPassword('123456'), gender: 'male', birthday: '1985-03-15', avatar: '', level: 'gold', balance: 1500.00, points: 3200, status: 'active', invite_code: 'ABCDEF', referrer_id: null, notes: '老客户，偏好肩颈调理', created_at: now, updated_at: now },
      { id: 'member-002', name: '李娜', phone: '13900000002', password_hash: U.hashPassword('123456'), gender: 'female', birthday: '1990-07-22', avatar: '', level: 'silver', balance: 800.00, points: 1500, status: 'active', invite_code: 'GHIJKL', referrer_id: 'member-001', notes: '对艾灸感兴趣', created_at: now, updated_at: now },
      { id: 'member-003', name: '王芳', phone: '13900000003', password_hash: U.hashPassword('123456'), gender: 'female', birthday: '1988-11-08', avatar: '', level: 'vip', balance: 3000.00, points: 5800, status: 'active', invite_code: 'MNOPQR', referrer_id: 'member-001', notes: 'VIP客户，每月固定来店', created_at: now, updated_at: now },
      { id: 'member-004', name: '赵强', phone: '13900000004', password_hash: U.hashPassword('123456'), gender: 'male', birthday: '1982-05-30', avatar: '', level: 'normal', balance: 200.00, points: 300, status: 'active', invite_code: 'STUVWX', referrer_id: null, notes: '', created_at: now, updated_at: now },
      { id: 'member-005', name: '陈静', phone: '13900000005', password_hash: U.hashPassword('123456'), gender: 'female', birthday: '1995-09-12', avatar: '', level: 'normal', balance: 50.00, points: 80, status: 'active', invite_code: 'YZABCD', referrer_id: 'member-002', notes: '新会员', created_at: now, updated_at: now }
    ],
    referrals: [
      { id: 'ref-001', referrer_id: 'member-001', invitee_id: 'member-002', channel: 'qr_code', created_at: now, updated_at: now },
      { id: 'ref-002', referrer_id: 'member-001', invitee_id: 'member-003', channel: 'qr_code', created_at: now, updated_at: now },
      { id: 'ref-003', referrer_id: 'member-002', invitee_id: 'member-005', channel: 'link', created_at: now, updated_at: now }
    ],
    projects: [
      { id: 'proj-001', name: '肩颈调理', category: '推拿理疗', price: 198, duration_min: 60, description: '疏通肩颈经络，缓解肩颈疼痛僵硬', status: 'active', sort: 1, created_at: now, updated_at: now },
      { id: 'proj-002', name: '艾灸养生', category: '艾灸养生', price: 168, duration_min: 45, description: '温阳补气，调理脾胃，增强免疫力', status: 'active', sort: 2, created_at: now, updated_at: now },
      { id: 'proj-003', name: '全身推拿', category: '推拿理疗', price: 298, duration_min: 90, description: '全身经络疏通，放松身心，改善睡眠', status: 'active', sort: 3, created_at: now, updated_at: now },
      { id: 'proj-004', name: '面部护理', category: '面部护理', price: 228, duration_min: 60, description: '中药面膜，深层滋养，提亮肤色', status: 'active', sort: 4, created_at: now, updated_at: now },
      { id: 'proj-005', name: '足浴按摩', category: '足浴养生', price: 128, duration_min: 45, description: '中药泡足，穴位按摩，促进循环', status: 'active', sort: 5, created_at: now, updated_at: now },
      { id: 'proj-006', name: '刮痧排毒', category: '推拿理疗', price: 158, duration_min: 40, description: '疏通经络，排毒祛湿，缓解疲劳', status: 'active', sort: 6, created_at: now, updated_at: now },
      { id: 'proj-007', name: '拔罐理疗', category: '推拿理疗', price: 138, duration_min: 30, description: '行气活血，祛风散寒，舒筋活络', status: 'active', sort: 7, created_at: now, updated_at: now },
      { id: 'proj-008', name: '头部SPA', category: '面部护理', price: 188, duration_min: 50, description: '头部经络按摩，缓解头痛，改善发质', status: 'active', sort: 8, created_at: now, updated_at: now }
    ],
    packages: [
      { id: 'pkg-001', name: '肩颈调理季卡', price: 1500, original_price: 1782, validity_days: 90, description: '肩颈调理10次，每次60分钟，有效期90天', status: 'active', sort: 1, created_at: now, updated_at: now },
      { id: 'pkg-002', name: '艾灸养生月卡', price: 800, original_price: 1008, validity_days: 30, description: '艾灸养生6次，每次45分钟，有效期30天', status: 'active', sort: 2, created_at: now, updated_at: now },
      { id: 'pkg-003', name: '全身养护尊享卡', price: 3000, original_price: 4200, validity_days: 180, description: '全身推拿4次+艾灸4次+面部护理2次+足浴4次', status: 'active', sort: 3, created_at: now, updated_at: now }
    ],
    package_items: [
      { id: 'pi-001', package_id: 'pkg-001', project_id: 'proj-001', times: 10, created_at: now, updated_at: now },
      { id: 'pi-002', package_id: 'pkg-002', project_id: 'proj-002', times: 6, created_at: now, updated_at: now },
      { id: 'pi-003', package_id: 'pkg-003', project_id: 'proj-003', times: 4, created_at: now, updated_at: now },
      { id: 'pi-004', package_id: 'pkg-003', project_id: 'proj-002', times: 4, created_at: now, updated_at: now },
      { id: 'pi-005', package_id: 'pkg-003', project_id: 'proj-004', times: 2, created_at: now, updated_at: now },
      { id: 'pi-006', package_id: 'pkg-003', project_id: 'proj-005', times: 4, created_at: now, updated_at: now }
    ],
    member_packages: [
      { id: 'mp-001', member_id: 'member-001', package_id: 'pkg-001', remain_times: 6, expire_at: future(60), status: 'active', source: '购买', created_at: now, updated_at: now },
      { id: 'mp-002', member_id: 'member-003', package_id: 'pkg-003', remain_times: 10, expire_at: future(150), status: 'active', source: '购买', created_at: now, updated_at: now }
    ],
    appointments: [
      { id: 'apt-001', member_id: 'member-001', project_id: 'proj-001', staff_id: 'staff-002', start_at: today + 'T10:00:00.000Z', end_at: today + 'T11:00:00.000Z', status: 'confirmed', notes: '老客户，肩颈不舒服', created_at: now, updated_at: now },
      { id: 'apt-002', member_id: 'member-002', project_id: 'proj-002', staff_id: 'staff-002', start_at: today + 'T14:00:00.000Z', end_at: today + 'T14:45:00.000Z', status: 'pending', notes: '', created_at: now, updated_at: now },
      { id: 'apt-003', member_id: 'member-003', project_id: 'proj-003', staff_id: null, start_at: today + 'T15:30:00.000Z', end_at: today + 'T17:00:00.000Z', status: 'pending', notes: '希望安排资深技师', created_at: now, updated_at: now }
    ],
    orders: [
      { id: 'ord-001', order_no: 'ORD20260701100001', member_id: 'member-001', staff_id: 'staff-003', items: [{ project_id: 'proj-001', name: '肩颈调理', price: 198, qty: 1, subtotal: 198 }], original_amount: 198, discount_amount: 0, paid_amount: 198, pay_method: 'balance', points_earned: 19, status: 'paid', created_at: now, updated_at: now },
      { id: 'ord-002', order_no: 'ORD20260702140002', member_id: 'member-003', staff_id: 'staff-003', items: [{ project_id: 'proj-004', name: '面部护理', price: 228, qty: 1, subtotal: 228 }], original_amount: 228, discount_amount: 0, paid_amount: 228, pay_method: 'wechat', points_earned: 22, status: 'paid', created_at: now, updated_at: now }
    ],
    recharge_rules: [
      { id: 'rr-001', pay_amount: 500, gift_amount: 50, gift_points: 50, gift_package_id: null, gift_times: 0, status: 'active', sort: 1, created_at: now, updated_at: now },
      { id: 'rr-002', pay_amount: 1000, gift_amount: 200, gift_points: 200, gift_package_id: 'pkg-002', gift_times: 1, status: 'active', sort: 2, created_at: now, updated_at: now },
      { id: 'rr-003', pay_amount: 3000, gift_amount: 800, gift_points: 800, gift_package_id: 'pkg-001', gift_times: 1, status: 'active', sort: 3, created_at: now, updated_at: now }
    ],
    recharge_records: [
      { id: 'rcr-001', member_id: 'member-001', rule_id: 'rr-002', pay_amount: 1000, gift_amount: 200, gift_points: 200, pay_method: 'wechat', status: 'success', created_at: now, updated_at: now },
      { id: 'rcr-002', member_id: 'member-003', rule_id: 'rr-003', pay_amount: 3000, gift_amount: 800, gift_points: 800, pay_method: 'alipay', status: 'success', created_at: now, updated_at: now }
    ],
    commissions: [
      { id: 'com-001', referrer_id: 'member-001', source_member_id: 'member-002', source_type: '充值', source_id: 'rcr-001', rate: 10, amount: 100, status: 'settled', created_at: now, updated_at: now },
      { id: 'com-002', referrer_id: 'member-001', source_member_id: 'member-003', source_type: '充值', source_id: 'rcr-002', rate: 10, amount: 300, status: 'pending', created_at: now, updated_at: now }
    ],
    withdrawals: [],
    announcements: [
      { id: 'ann-001', title: '夏季养生优惠活动', content: '炎炎夏日，颐安堂推出艾灸养生特惠！7月-8月期间，艾灸项目享8折优惠，充值1000元送200元再赠艾灸月卡一张！', popup: true, status: 'active', start_at: now, end_at: future(30), created_at: now, updated_at: now },
      { id: 'ann-002', title: '新品上市：头部SPA', content: '颐安堂全新推出头部SPA项目，结合中药精华与经络按摩，有效缓解头痛、改善睡眠。首次体验享会员价！', popup: false, status: 'active', start_at: now, end_at: future(60), created_at: now, updated_at: now }
    ],
    gifts: [
      { id: 'gift-001', name: '中药足浴包', image: '', cost_type: 'points', cost_value: 500, stock: 50, description: '纯中药泡足包，温经散寒，促进睡眠', status: 'active', sort: 1, created_at: now, updated_at: now },
      { id: 'gift-002', name: '艾灸条礼盒装', image: '', cost_type: 'points', cost_value: 1200, stock: 20, description: '精品艾灸条10根装，居家艾灸好帮手', status: 'active', sort: 2, created_at: now, updated_at: now },
      { id: 'gift-003', name: '肩颈调理体验券', image: '', cost_type: 'points', cost_value: 2000, stock: 10, description: '免费体验肩颈调理一次，有效期30天', status: 'active', sort: 3, created_at: now, updated_at: now },
      { id: 'gift-004', name: '面部护理体验券', image: '', cost_type: 'points', cost_value: 2500, stock: 8, description: '免费体验面部护理一次，有效期30天', status: 'active', sort: 4, created_at: now, updated_at: now },
      { id: 'gift-005', name: '50元充值代金券', image: '', cost_type: 'points', cost_value: 800, stock: 30, description: '充值时抵扣50元，不找零', status: 'active', sort: 5, created_at: now, updated_at: now },
      { id: 'gift-006', name: '养生茶礼盒', image: '', cost_type: 'balance', cost_value: 68, stock: 15, description: '枸杞菊花养生茶礼盒装', status: 'active', sort: 6, created_at: now, updated_at: now }
    ],
    redemption_orders: [
      { id: 'ro-001', member_id: 'member-001', gift_id: 'gift-001', cost_type: 'points', cost_value: 500, status: 'redeemed', created_at: now, updated_at: now },
      { id: 'ro-002', member_id: 'member-003', gift_id: 'gift-003', cost_type: 'points', cost_value: 2000, status: 'pending', created_at: now, updated_at: now }
    ],
    settings: [
      { id: 'set-001', key: 'store_name', value: '颐安堂', created_at: now, updated_at: now },
      { id: 'set-002', key: 'store_slogan', value: '传承中医养生文化 · 呵护您的身心健康', created_at: now, updated_at: now },
      { id: 'set-003', key: 'apk_download_url', value: 'https://yiantang.example.com/download.apk', created_at: now, updated_at: now },
      { id: 'set-004', key: 'invite_base_url', value: 'https://yiantang.example.com', created_at: now, updated_at: now },
      { id: 'set-005', key: 'invite_commission_rate', value: '10', created_at: now, updated_at: now },
      { id: 'set-006', key: 'app_version', value: '1.0.0', created_at: now, updated_at: now }
    ]
  };
};

// ========== 本地适配器 ==========
YA.localAdapter = {
  DB_PREFIX: 'yiantang_db_',
  getTableKey(table) { return this.DB_PREFIX + table; },
  readTable(table) {
    try { const raw = localStorage.getItem(this.getTableKey(table)); return raw ? JSON.parse(raw) : []; }
    catch (e) { console.error('[LocalAdapter] 读取 ' + table + ' 失败:', e); return []; }
  },
  writeTable(table, data) {
    try { localStorage.setItem(this.getTableKey(table), JSON.stringify(data)); return true; }
    catch (e) { console.error('[LocalAdapter] 写入 ' + table + ' 失败:', e); return false; }
  },
  uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random()*16)|0; const v = c==='x'?r:(r&0x3)|0x8; return v.toString(16); }); },

  async list(table, filters) {
    filters = filters || {};
    let data = this.readTable(table);
    if (filters.where) {
      data = data.filter(row => Object.entries(filters.where).every(([k,v]) => v===undefined||v===null||row[k]===v));
    }
    if (filters.search) {
      const { fields, keyword } = filters.search;
      const kw = String(keyword).toLowerCase();
      data = data.filter(row => fields.some(f => row[f] && String(row[f]).toLowerCase().includes(kw)));
    }
    if (filters.order) {
      const { column, ascending } = filters.order;
      data = [...data].sort((a,b) => { const av=a[column]||''; const bv=b[column]||''; return ascending ? (av<bv?-1:av>bv?1:0) : (av>bv?-1:av<bv?1:0); });
    } else {
      data = [...data].sort((a,b) => { const av=a.created_at||''; const bv=b.created_at||''; return bv.localeCompare(av); });
    }
    const page = filters.page || 1, pageSize = filters.pageSize || 50;
    const items = data.slice((page-1)*pageSize, page*pageSize);
    return { data: items, total: data.length, page, pageSize };
  },
  async get(table, id) { return this.readTable(table).find(r => r.id === id) || null; },
  async create(table, payload) {
    const data = this.readTable(table);
    const now = new Date().toISOString();
    const record = { id: payload.id || this.uuid(), ...payload, created_at: payload.created_at || now, updated_at: now };
    data.push(record); this.writeTable(table, data);
    this.notifyChange(table, { eventType: 'INSERT', new: record });
    return record;
  },
  async update(table, id, payload) {
    const data = this.readTable(table);
    const idx = data.findIndex(r => r.id === id);
    if (idx === -1) return null;
    data[idx] = { ...data[idx], ...payload, updated_at: new Date().toISOString() };
    this.writeTable(table, data);
    this.notifyChange(table, { eventType: 'UPDATE', new: data[idx] });
    return data[idx];
  },
  async remove(table, id) {
    const data = this.readTable(table);
    this.writeTable(table, data.filter(r => r.id !== id));
    this.notifyChange(table, { eventType: 'DELETE', old: { id } });
    return true;
  },
  async bulkCreate(table, records) {
    const data = this.readTable(table);
    const now = new Date().toISOString();
    const newRecords = records.map(r => ({ id: r.id || this.uuid(), ...r, created_at: r.created_at || now, updated_at: now }));
    this.writeTable(table, [...data, ...newRecords]);
    return newRecords;
  },
  async count(table, filters) { return (await this.list(table, { ...filters, page: 1, pageSize: 999999 })).total; },
  async isEmpty(table) { return this.readTable(table).length === 0; },
  subscribe(table, callback) {
    const eventName = 'yiantang:' + table + ':change';
    const handler = (e) => callback(e.detail);
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  },
  notifyChange(table, payload) { window.dispatchEvent(new CustomEvent('yiantang:' + table + ':change', { detail: payload })); },
  isInitialized() { return localStorage.getItem('yiantang_initialized') === 'true'; },
  markInitialized() { localStorage.setItem('yiantang_initialized', 'true'); },
  async exportAll() {
    const tables = ['staff','members','referrals','projects','packages','package_items','member_packages','appointments','orders','recharge_rules','recharge_records','commissions','withdrawals','announcements','gifts','redemption_orders','settings'];
    const result = {}; for (const t of tables) result[t] = this.readTable(t); return result;
  },
  async importAll(data) { for (const [t, r] of Object.entries(data)) { if (Array.isArray(r)) this.writeTable(t, r); } return true; }
};

// ========== 数据服务 ==========
YA.dataService = {
  adapter: null,
  initialized: false,
  mode: 'local',
  subscriptions: new Map(),

  getAdapter() { if (!this.adapter) this.adapter = YA.localAdapter; return this.adapter; },

  async init() {
    if (this.initialized) return;
    const adapter = this.getAdapter();
    this.mode = adapter.mode || 'local';
    if (!adapter.isInitialized()) {
      console.log('[DataService] 首次启动，写入种子数据...');
      const seed = YA.getSeedData();
      for (const [table, records] of Object.entries(seed)) { await adapter.bulkCreate(table, records); }
      adapter.markInitialized();
    }
    this.initialized = true;
    console.log('[DataService] 初始化完成，模式: ' + this.mode);
  },

  async list(table, filters) { await this.init(); return this.getAdapter().list(table, filters); },
  async get(table, id) { await this.init(); return this.getAdapter().get(table, id); },
  async create(table, payload) { await this.init(); return this.getAdapter().create(table, payload); },
  async update(table, id, payload) { await this.init(); return this.getAdapter().update(table, id, payload); },
  async remove(table, id) { await this.init(); return this.getAdapter().remove(table, id); },
  async bulkCreate(table, records) { await this.init(); return this.getAdapter().bulkCreate(table, records); },
  async count(table, filters) { await this.init(); return this.getAdapter().count(table, filters); },

  subscribe(table, callback) {
    this.init().then(() => {
      const adapter = this.getAdapter();
      adapter.subscribe(table, (payload) => {
        const cbs = this.subscriptions.get(table);
        if (cbs) cbs.forEach(cb => { try { cb(payload); } catch(e) { console.error(e); } });
      });
    });
    if (!this.subscriptions.has(table)) this.subscriptions.set(table, new Set());
    this.subscriptions.get(table).add(callback);
    return () => { const cbs = this.subscriptions.get(table); if (cbs) cbs.delete(callback); };
  },

  async getSetting(key) {
    const result = await this.list('settings', { where: { key }, page: 1, pageSize: 1 });
    return result.data && result.data.length > 0 ? result.data[0].value : null;
  },
  async setSetting(key, value) {
    const existing = await this.list('settings', { where: { key }, page: 1, pageSize: 1 });
    if (existing.data && existing.data.length > 0) return this.update('settings', existing.data[0].id, { value });
    return this.create('settings', { key, value });
  },
  async exportAll() { await this.init(); return this.getAdapter().exportAll(); },
  async importAll(data) { await this.init(); return this.getAdapter().importAll(data); }
};

// ========== 认证服务 ==========
YA.authService = {
  async adminLogin(account, password) {
    const result = await YA.dataService.list('staff', { where: { login_account: account, status: 'active' }, page: 1, pageSize: 1 });
    if (!result.data || result.data.length === 0) return { success: false, message: '账号不存在或已停用' };
    const staff = result.data[0];
    if (!YA.utils.verifyPassword(password, staff.password_hash)) return { success: false, message: '密码错误' };
    const authData = { id: staff.id, name: staff.name, role: staff.role, login_account: staff.login_account, loginTime: new Date().toISOString() };
    localStorage.setItem('admin_auth', JSON.stringify(authData));
    return { success: true, data: authData };
  },
  adminLogout() { localStorage.removeItem('admin_auth'); },
  getAdminAuth() { return JSON.parse(localStorage.getItem('admin_auth') || 'null'); },

  async memberRegister(data) {
    const existing = await YA.dataService.list('members', { where: { phone: data.phone }, page: 1, pageSize: 1 });
    if (existing.data && existing.data.length > 0) return { success: false, message: '该手机号已注册' };
    const inviteCode = YA.utils.genInviteCode();
    const now = YA.utils.now();
    const member = await YA.dataService.create('members', {
      name: data.name || '会员' + data.phone.slice(-4), phone: data.phone, password_hash: YA.utils.hashPassword(data.password),
      gender: data.gender || 'unknown', birthday: data.birthday || '', avatar: '', level: 'normal', balance: 0, points: 0,
      status: 'active', invite_code: inviteCode, referrer_id: null, notes: '', created_at: now, updated_at: now
    });
    if (data.invite) {
      const referrer = await YA.dataService.list('members', { where: { invite_code: data.invite }, page: 1, pageSize: 1 });
      if (referrer.data && referrer.data.length > 0) {
        const r = referrer.data[0];
        await YA.dataService.update('members', member.id, { referrer_id: r.id });
        await YA.dataService.create('referrals', { referrer_id: r.id, invitee_id: member.id, channel: data.inviteChannel || 'link', created_at: now, updated_at: now });
      }
    }
    return { success: true, data: member };
  },

  async memberLogin(phone, password) {
    const result = await YA.dataService.list('members', { where: { phone, status: 'active' }, page: 1, pageSize: 1 });
    if (!result.data || result.data.length === 0) return { success: false, message: '手机号未注册或已停用' };
    const member = result.data[0];
    if (!YA.utils.verifyPassword(password, member.password_hash || YA.utils.hashPassword(''))) return { success: false, message: '密码错误' };
    const authData = { id: member.id, name: member.name, phone: member.phone, level: member.level, avatar: member.avatar, loginTime: new Date().toISOString() };
    localStorage.setItem('member_auth', JSON.stringify(authData));
    return { success: true, data: authData };
  },
  memberLogout() { localStorage.removeItem('member_auth'); },
  getMemberAuth() { return JSON.parse(localStorage.getItem('member_auth') || 'null'); },
  getSmsCode(phone) { return '1234'; },
  verifySmsCode(phone, code) { return code === '1234'; }
};

// ========== 二维码服务 ==========
YA.qrService = {
  async generate(text, options) {
    options = options || {};
    try {
      var w = options.width || 280;
      var tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);
      new QRCode(tempDiv, {
        text: text,
        width: w,
        height: w,
        colorDark: (options.color && options.color.dark) || '#3a2412',
        colorLight: (options.color && options.color.light) || '#ffffff'
      });
      var canvas = tempDiv.querySelector('canvas');
      var dataUrl = canvas ? canvas.toDataURL('image/png') : (tempDiv.querySelector('img') ? tempDiv.querySelector('img').src : '');
      document.body.removeChild(tempDiv);
      return dataUrl || null;
    } catch (e) { console.error('[QR] 生成失败:', e); return null; }
  },
  async generateDownloadQr() {
    let url = 'https://yiantang.example.com/download.apk';
    const setting = await YA.dataService.getSetting('apk_download_url');
    if (setting) url = setting;
    return this.generate(url);
  },
  async generateInviteQr(inviteCode) {
    let baseUrl = window.location.origin + window.location.pathname;
    const setting = await YA.dataService.getSetting('invite_base_url');
    if (setting) baseUrl = setting;
    return this.generate(baseUrl + '#/member/register?invite=' + inviteCode);
  },
  async generateMemberQr(memberId) {
    return this.generate(JSON.stringify({ type: 'member', id: memberId, ts: Date.now() }));
  }
};

// 设置 dayjs 中文
dayjs.locale('zh-cn');
console.log('[YA] 数据服务层加载完成');
