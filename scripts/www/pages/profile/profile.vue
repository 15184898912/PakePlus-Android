<template>
    <view class="profile-container">
        <!-- 用户信息 -->
        <view class="user-info">
            <view class="avatar">
                <text class="avatar-text">👤</text>
            </view>
            <view class="user-detail">
                <text class="user-name">{{ userInfo.phone || '维修师傅' }}</text>
                <text class="user-desc">家电维修专家</text>
            </view>
        </view>
        
        <!-- 功能菜单 -->
        <view class="menu-list">
            <view class="menu-item" @click="goToFavorites">
                <view class="menu-left">
                    <text class="menu-icon">❤️</text>
                    <text class="menu-title">我的收藏</text>
                </view>
                <text class="menu-arrow">›</text>
            </view>
            
            <view class="menu-item" @click="goToHistory">
                <view class="menu-left">
                    <text class="menu-icon">📜</text>
                    <text class="menu-title">浏览历史</text>
                </view>
                <text class="menu-arrow">›</text>
            </view>
            
            <view class="menu-item" @click="clearHistory">
                <view class="menu-left">
                    <text class="menu-icon">🗑️</text>
                    <text class="menu-title">清空历史记录</text>
                </view>
                <text class="menu-arrow">›</text>
            </view>
            
            <view class="menu-item" @click="aboutApp">
                <view class="menu-left">
                    <text class="menu-icon">ℹ️</text>
                    <text class="menu-title">关于我们</text>
                </view>
                <text class="menu-arrow">›</text>
            </view>
            
            <view class="menu-item" @click="logout">
                <view class="menu-left">
                    <text class="menu-icon">🚪</text>
                    <text class="menu-title">退出登录</text>
                </view>
                <text class="menu-arrow">›</text>
            </view>
        </view>
        
        <!-- 收藏弹窗 -->
        <view class="modal-mask" v-if="showFavorites" @click="showFavorites = false">
            <view class="modal-content" @click.stop>
                <text class="modal-title">❤️ 我的收藏</text>
                <scroll-view class="modal-list" scroll-y>
                    <view v-if="favorites.length === 0" class="empty-list">
                        <text>暂无收藏</text>
                    </view>
                    <view v-for="item in favorites" :key="item.id" class="modal-list-item" @click="viewDetail(item)">
                        <text class="item-title">{{ item.brand }} {{ item.type }}</text>
                        <text class="item-desc">{{ item.description }}</text>
                    </view>
                </scroll-view>
                <button class="modal-close" @click="showFavorites = false">关闭</button>
            </view>
        </view>
        
        <!-- 历史记录弹窗 -->
        <view class="modal-mask" v-if="showHistory" @click="showHistory = false">
            <view class="modal-content" @click.stop>
                <text class="modal-title">📜 浏览历史</text>
                <scroll-view class="modal-list" scroll-y>
                    <view v-if="historyList.length === 0" class="empty-list">
                        <text>暂无浏览记录</text>
                    </view>
                    <view v-for="item in historyList" :key="item.id" class="modal-list-item" @click="viewDetail(item)">
                        <text class="item-title">{{ item.brand }} {{ item.type }}</text>
                        <text class="item-time">{{ formatTime(item.viewTime) }}</text>
                    </view>
                </scroll-view>
                <button class="modal-close" @click="showHistory = false">关闭</button>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            userInfo: {},
            favorites: [],
            historyList: [],
            showFavorites: false,
            showHistory: false
        }
    },
    
    onShow() {
        this.loadUserInfo()
        this.loadFavorites()
        this.loadHistory()
    },
    
    methods: {
        loadUserInfo() {
            try {
                const info = uni.getStorageSync('userInfo')
                this.userInfo = info || { phone: '138****0000' }
            } catch(e) {
                this.userInfo = { phone: '138****0000' }
            }
        },
        
        loadFavorites() {
            try {
                const favs = uni.getStorageSync('favorites')
                this.favorites = Array.isArray(favs) ? favs : []
            } catch(e) {
                this.favorites = []
            }
        },
        
        loadHistory() {
            try {
                const history = uni.getStorageSync('viewHistory')
                this.historyList = Array.isArray(history) ? history : []
            } catch(e) {
                this.historyList = []
            }
        },
        
        goToFavorites() {
            this.loadFavorites()
            this.showFavorites = true
        },
        
        goToHistory() {
            this.loadHistory()
            this.showHistory = true
        },
        
        clearHistory() {
            uni.showModal({
                title: '确认清空',
                content: '确定要清空所有浏览历史吗？',
                success: (res) => {
                    if (res.confirm) {
                        uni.setStorageSync('viewHistory', [])
                        this.historyList = []
                        uni.showToast({ title: '已清空', icon: 'success' })
                    }
                }
            })
        },
        
        viewDetail(item) {
            this.showFavorites = false
            this.showHistory = false
            uni.showModal({
                title: `${item.brand}${item.type}`,
                content: `故障码：${item.faultCode}\n\n故障现象：${item.description}\n\n解决方案：${item.solution}`,
                confirmText: '知道了',
                showCancel: false
            })
        },
        
        formatTime(timestamp) {
            if (!timestamp) return ''
            const date = new Date(timestamp)
            return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`
        },
        
        aboutApp() {
            uni.showModal({
                title: '关于我们',
                content: '家电维修助手 V1.0\n\nAI智能诊断 · 电路图纸 · 维修方案\n\n专业家电维修资料库',
                showCancel: false,
                confirmText: '知道了'
            })
        },
        
        logout() {
            uni.showModal({
                title: '确认退出',
                content: '确定要退出登录吗？',
                success: (res) => {
                    if (res.confirm) {
                        uni.setStorageSync('isLogin', false)
                        uni.setStorageSync('userInfo', null)
                        uni.reLaunch({
                            url: '/pages/login/index'
                        })
                    }
                }
            })
        }
    }
}
</script>

<style scoped>
.profile-container {
    min-height: 100vh;
    background: #f5f7fb;
    padding: 40rpx 30rpx;
}

.user-info {
    background: linear-gradient(135deg, #1565C0 0%, #0D47A1 100%);
    border-radius: 30rpx;
    padding: 50rpx 40rpx;
    display: flex;
    align-items: center;
    gap: 30rpx;
    margin-bottom: 40rpx;
}

.avatar {
    width: 120rpx;
    height: 120rpx;
    background: rgba(255,255,255,0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-text {
    font-size: 60rpx;
}

.user-detail {
    flex: 1;
}

.user-name {
    font-size: 36rpx;
    font-weight: bold;
    color: #fff;
    display: block;
    margin-bottom: 8rpx;
}

.user-desc {
    font-size: 24rpx;
    color: rgba(255,255,255,0.8);
}

.menu-list {
    background: #fff;
    border-radius: 30rpx;
    overflow: hidden;
}

.menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx 40rpx;
    border-bottom: 1rpx solid #eee;
}

.menu-left {
    display: flex;
    align-items: center;
    gap: 30rpx;
}

.menu-icon {
    font-size: 40rpx;
}

.menu-title {
    font-size: 30rpx;
    color: #333;
}

.menu-arrow {
    font-size: 40rpx;
    color: #ccc;
}

.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: #fff;
    border-radius: 40rpx;
    width: 600rpx;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.modal-title {
    font-size: 36rpx;
    font-weight: bold;
    text-align: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #eee;
}

.modal-list {
    flex: 1;
    max-height: 500rpx;
    padding: 20rpx;
}

.modal-list-item {
    padding: 20rpx;
    border-bottom: 1rpx solid #eee;
}

.item-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 8rpx;
}

.item-desc, .item-time {
    font-size: 24rpx;
    color: #999;
}

.empty-list {
    text-align: center;
    padding: 60rpx;
    color: #999;
}

.modal-close {
    margin: 20rpx;
    background: #1565C0;
    color: #fff;
    border-radius: 60rpx;
}
</style>