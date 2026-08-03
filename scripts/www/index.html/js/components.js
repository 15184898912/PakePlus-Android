/**
 * 颐安堂 - 通用组件
 */
(function() {
  const { ref, reactive, computed, onMounted, watch } = Vue;

  YA.components = {};

  // AppHeader
  YA.components.AppHeader = {
    props: { title: { type: String, default: '' }, showBack: { type: Boolean, default: false } },
    emits: ['back'],
    template: `
      <div class="app-header safe-top" style="display:flex;align-items:flex-end;justify-content:center;height:calc(48px + var(--ya-safe-top));background:linear-gradient(135deg,#8a5a2b,#6b3e1a);color:#fff;font-size:17px;font-weight:600;padding:0 16px 12px;position:relative;">
        <div v-if="showBack" @click="$emit('back')" style="position:absolute;left:12px;bottom:12px;display:flex;align-items:center;cursor:pointer;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span>{{ title }}</span>
      </div>
    `
  };

  // StatCard
  YA.components.StatCard = {
    props: { label: String, value: [String, Number], type: { type: String, default: '' } },
    template: `
      <div class="stat-card" :class="type">
        <div class="sv num">{{ value }}</div>
        <div class="sl">{{ label }}</div>
      </div>
    `
  };

  // EmptyState
  YA.components.EmptyState = {
    props: { text: { type: String, default: '暂无数据' } },
    template: `
      <div class="empty-wrap">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
        <p>{{ text }}</p>
      </div>
    `
  };

  // QrModal
  YA.components.QrModal = {
    props: { show: Boolean, title: { type: String, default: '二维码' }, qrDataUrl: String, desc: String },
    emits: ['update:show'],
    template: `
      <van-popup :show="show" @update:show="$emit('update:show', $event)" round position="center" :close-on-click-overlay="true" style="width:85%;max-width:340px;">
        <div class="qr-modal-inner">
          <div class="qt">{{ title }}</div>
          <div v-if="qrDataUrl" style="display:flex;justify-content:center;margin-bottom:12px;"><img :src="qrDataUrl" class="qi" alt="二维码" /></div>
          <div v-else style="width:240px;height:240px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;background:#f5f0ea;border-radius:8px;"><van-loading size="32px" color="#d4a017">生成中...</van-loading></div>
          <div class="qd" v-if="desc">{{ desc }}</div>
          <slot></slot>
        </div>
      </van-popup>
    `
  };

  console.log('[YA] 通用组件加载完成');
})();
