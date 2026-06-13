<template>
    <view class="diagnosis-container">
        <!-- 顶部搜索栏 -->
        <view class="search-header">
            <view class="search-box">
                <view class="search-icon" @click="doSearch">🔍</view>
                <input 
                    class="search-input"
                    v-model="searchKeyword"
                    placeholder="搜索电器/故障现象/品牌..."
                    @confirm="doSearch"
                />
                <view v-if="searchKeyword" class="clear-icon" @click="clearSearch">✕</view>
            </view>
            <view class="search-actions">
                <view class="action-btn" @click="showVoiceInput = true">
                    <text class="action-icon">🎤</text>
                </view>
                <view class="action-btn" @click="takePhoto">
                    <text class="action-icon">📷</text>
                </view>
            </view>
        </view>
        
        <!-- 快捷分类 -->
        <scroll-view class="category-scroll" scroll-x>
            <view 
                v-for="cat in categories" 
                :key="cat.value"
                class="category-tag"
                :class="{ active: currentCategory === cat.value }"
                @click="selectCategory(cat.value)"
            >
                {{ cat.name }}
            </view>
        </scroll-view>
        
        <!-- 热门搜索 -->
        <view class="hot-search" v-if="searchResults.length === 0 && !searching">
            <text class="hot-title">🔥 热门搜索</text>
            <view class="hot-tags">
                <text v-for="hot in hotSearches" :key="hot" class="hot-tag" @click="searchKeyword=hot; doSearch()">{{ hot }}</text>
            </view>
        </view>
        
        <!-- 搜索结果列表 -->
        <scroll-view class="result-list" scroll-y>
            <view v-if="searchResults.length === 0 && !searching && searchKeyword" class="empty-state">
                <text class="empty-icon">🔍</text>
                <text class="empty-title">没有找到相关结果</text>
                <text class="empty-hint">试试换个关键词，或点击下方热门搜索</text>
            </view>
            
            <view v-if="searching" class="loading-state">
                <text class="loading-icon">🤖</text>
                <text>智能搜索中...</text>
            </view>
            
            <view v-else class="result-items">
                <view 
                    v-for="item in searchResults" 
                    :key="item.id"
                    class="result-card"
                    @click="viewDetail(item)"
                >
                    <view class="card-header">
                        <text class="brand">{{ item.brand }}</text>
                        <text class="type">{{ item.type }}</text>
                        <text class="model">{{ item.model }}</text>
                    </view>
                    <view class="card-body">
                        <text class="symptom">📌 故障现象：{{ item.symptom }}</text>
                        <text class="description">🔍 故障原因：{{ item.description }}</text>
                    </view>
                    <view class="card-footer">
                        <text class="solution">🔧 解决方案：{{ item.solution }}</text>
                        <view class="card-actions">
                            <text class="action-small" @click.stop="collect(item)">{{ isCollected(item) ? '❤️' : '🤍' }}</text>
                            <text class="action-small" @click.stop="shareItem(item)">📤</text>
                            <text class="action-small" @click.stop="speakContent(item)">🔊</text>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>
        
        <!-- 快速搜索弹窗（替代语音识别） -->
        <view class="modal-mask" v-if="showVoiceInput" @click="showVoiceInput = false">
            <view class="modal-content" @click.stop>
                <text class="modal-title">🔍 快速搜索</text>
                
                <!-- 常用故障 -->
                <view class="voice-section">
                    <text class="section-title">📌 常用故障</text>
                    <view class="hint-tags">
                        <text v-for="hint in commonFaults" :key="hint" class="hint-tag" @click="useVoiceHint(hint)">{{ hint }}</text>
                    </view>
                </view>
                
                <!-- 常用电器 -->
                <view class="voice-section">
                    <text class="section-title">📺 常用电器</text>
                    <view class="hint-tags">
                        <text v-for="hint in commonAppliances" :key="hint" class="hint-tag" @click="useVoiceHint(hint)">{{ hint }}</text>
                    </view>
                </view>
                
                <!-- 常用品牌 -->
                <view class="voice-section">
                    <text class="section-title">🏷️ 常用品牌</text>
                    <view class="hint-tags">
                        <text v-for="hint in commonBrands" :key="hint" class="hint-tag" @click="useVoiceHint(hint)">{{ hint }}</text>
                    </view>
                </view>
                
                <!-- 手动输入 -->
                <view class="voice-section">
                    <text class="section-title">✏️ 手动输入</text>
                    <input 
                        class="manual-input" 
                        v-model="manualVoiceText" 
                        placeholder="输入品牌/型号/故障..."
                        @confirm="useManualInput"
                    />
                </view>
                
                <button class="voice-cancel" @click="showVoiceInput = false">取消</button>
            </view>
        </view>
        
        <!-- 图片识别结果弹窗 -->
        <view class="modal-mask" v-if="showImageResult" @click="closeImageResult">
            <view class="modal-content" @click.stop>
                <text class="modal-title">📷 AI识别结果</text>
                <image :src="imagePreview" mode="aspectFit" class="image-preview" v-if="imagePreview"></image>
                <text class="image-result-text">{{ imageResultText }}</text>
                <view class="modal-actions">
                    <button class="modal-btn primary" @click="searchByImage">🔍 搜索</button>
                    <button class="modal-btn" @click="closeImageResult">取消</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            searchKeyword: '',
            currentCategory: 'all',
            searchResults: [],
            searching: false,
            
            // 快速搜索
            showVoiceInput: false,
            manualVoiceText: '',
            commonFaults: ['不制冷', '不加热', '不转', '不排水', '不脱水', '不开机', '漏水', '噪音大', '不工作'],
            commonAppliances: ['空调', '冰箱', '洗衣机', '电视', '电磁炉', '微波炉', '破壁机', '热水器', '油烟机'],
            commonBrands: ['美的', '格力', '海尔', '九阳', '苏泊尔', '格兰仕', '西门子', '松下'],
            
            categories: [
                { name: '全部', value: 'all' },
                { name: '空调', value: '空调' },
                { name: '冰箱', value: '冰箱' },
                { name: '洗衣机', value: '洗衣机' },
                { name: '电视', value: '电视' },
                { name: '电磁炉', value: '电磁炉' },
                { name: '微波炉', value: '微波炉' },
                { name: '破壁机', value: '破壁机' },
                { name: '热水器', value: '热水器' },
                { name: '油烟机', value: '油烟机' }
            ],
            
            hotSearches: ['空调不制冷', '电磁炉不加热', '微波炉不工作', '破壁机不转', '洗衣机不排水', '冰箱不制冷', '电视不开机', '热水器不热'],
            
            showImageResult: false,
            imagePreview: '',
            imageResultText: '',
            
            favorites: [],
            
            // 维修数据库
            repairDatabase: [
                // 空调
                { id: 1, brand: '美的', type: '空调', model: 'KFR-35GW', symptom: '不制冷', description: '制冷剂泄漏或压缩机故障', solution: '检漏并补充制冷剂，检查压缩机电容' },
                { id: 2, brand: '格力', type: '空调', model: 'KFR-32GW', symptom: '不制冷', description: '室外机散热不良', solution: '清洗冷凝器，检查散热风扇' },
                { id: 3, brand: '海尔', type: '空调', model: 'KFR-26GW', symptom: '不启动', description: '电源板故障', solution: '检查电源板输出电压' },
                // 电磁炉
                { id: 4, brand: '美的', type: '电磁炉', model: 'C21-RT2170', symptom: '不加热', description: 'IGBT损坏', solution: '更换IGBT和桥堆' },
                { id: 5, brand: '九阳', type: '电磁炉', model: 'C22-L2', symptom: '不加热', description: '锅具检测电路故障', solution: '更换LM339' },
                { id: 6, brand: '苏泊尔', type: '电磁炉', model: 'C22-IH83', symptom: '间歇加热', description: '温度传感器故障', solution: '更换锅底温度传感器' },
                // 微波炉
                { id: 7, brand: '美的', type: '微波炉', model: 'M1-L213B', symptom: '不加热', description: '磁控管损坏', solution: '更换磁控管' },
                { id: 8, brand: '格兰仕', type: '微波炉', model: 'G80F23', symptom: '不加热', description: '高压二极管损坏', solution: '更换高压二极管' },
                // 破壁机
                { id: 9, brand: '九阳', type: '破壁机', model: 'L18-Y915S', symptom: '不转', description: '电机碳刷磨损', solution: '更换碳刷' },
                { id: 10, brand: '美的', type: '破壁机', model: 'BL1528A', symptom: '不转', description: '磁控开关故障', solution: '更换磁控开关' },
                // 洗衣机
                { id: 11, brand: '海尔', type: '洗衣机', model: 'XQB70', symptom: '不排水', description: '排水泵堵塞', solution: '清理排水泵过滤器' },
                // 冰箱
                { id: 12, brand: '海尔', type: '冰箱', model: 'BCD-216SD', symptom: '不制冷', description: '压缩机不启动', solution: '检查PTC启动器' },
                // 电视
                { id: 13, brand: '海信', type: '电视', model: 'LED55', symptom: '不开机', description: '电源板故障', solution: '检查电源板输出电压' },
                // 热水器
                { id: 14, brand: '海尔', type: '热水器', model: 'ES60H', symptom: '不加热', description: '加热管损坏', solution: '更换加热管' },
                // 油烟机
                { id: 15, brand: '方太', type: '油烟机', model: 'CXW-258', symptom: '不转', description: '电机电容损坏', solution: '更换启动电容' }
            ]
        }
    },
    
    onLoad() {
        this.loadFavorites()
        this.searchResults = this.repairDatabase
    },
    
    methods: {
        loadFavorites() {
            try {
                const favs = uni.getStorageSync('favorites')
                this.favorites = Array.isArray(favs) ? favs : []
            } catch(e) {
                this.favorites = []
            }
        },
        
        saveFavorites() {
            uni.setStorageSync('favorites', this.favorites)
        },
        
        isCollected(item) {
            return this.favorites.some(fav => fav && fav.id === item.id)
        },
        
        selectCategory(cat) {
            this.currentCategory = cat
            this.doSearch()
        },
        
        doSearch() {
            this.searching = true
            
            setTimeout(() => {
                let keyword = this.searchKeyword.trim().toLowerCase()
                let results = [...this.repairDatabase]
                
                if (this.currentCategory !== 'all') {
                    results = results.filter(item => item.type === this.currentCategory)
                }
                
                if (keyword) {
                    results = results.filter(item => {
                        return item.brand.toLowerCase().includes(keyword) ||
                               item.type.toLowerCase().includes(keyword) ||
                               item.symptom.toLowerCase().includes(keyword) ||
                               item.solution.toLowerCase().includes(keyword)
                    })
                }
                
                this.searchResults = results
                this.searching = false
            }, 100)
        },
        
        clearSearch() {
            this.searchKeyword = ''
            this.currentCategory = 'all'
            this.searchResults = this.repairDatabase
        },
        
        // 使用快速搜索
        useVoiceHint(hint) {
            this.searchKeyword = hint
            this.showVoiceInput = false
            this.doSearch()
        },
        
        useManualInput() {
            if (this.manualVoiceText) {
                this.searchKeyword = this.manualVoiceText
                this.showVoiceInput = false
                this.doSearch()
            }
        },
        
        // 拍照识别
        takePhoto() {
            uni.chooseImage({
                count: 1,
                sizeType: ['compressed'],
                sourceType: ['camera', 'album'],
                success: (res) => {
                    this.imagePreview = res.tempFilePaths[0]
                    uni.showLoading({ title: '识别中...' })
                    
                    setTimeout(() => {
                        uni.hideLoading()
                        const mockResults = ['空调不制冷', '电磁炉不加热', '微波炉不工作', '破壁机不转']
                        this.imageResultText = mockResults[Math.floor(Math.random() * mockResults.length)]
                        this.showImageResult = true
                    }, 1500)
                },
                fail: () => {
                    uni.showToast({ title: '选择图片失败', icon: 'none' })
                }
            })
        },
        
        searchByImage() {
            if (this.imageResultText) {
                this.searchKeyword = this.imageResultText
                this.closeImageResult()
                this.doSearch()
            }
        },
        
        closeImageResult() {
            this.showImageResult = false
            this.imagePreview = ''
            this.imageResultText = ''
        },
        
        collect(item) {
            const index = this.favorites.findIndex(fav => fav && fav.id === item.id)
            if (index > -1) {
                this.favorites.splice(index, 1)
                uni.showToast({ title: '已取消收藏', icon: 'none' })
            } else {
                this.favorites.unshift({ ...item, collectTime: Date.now() })
                uni.showToast({ title: '收藏成功', icon: 'success' })
            }
            this.saveFavorites()
        },
        
        shareItem(item) {
            uni.setClipboardData({
                data: `${item.brand}${item.type} ${item.symptom} - ${item.solution}`,
                success: () => {
                    uni.showToast({ title: '已复制', icon: 'success' })
                }
            })
        },
        
        speakContent(item) {
            const text = `${item.brand}${item.type}，${item.symptom}，故障原因：${item.description}，解决方案：${item.solution}`
            uni.showModal({
                title: '🔊 语音播报',
                content: text,
                showCancel: false,
                confirmText: '知道了'
            })
        },
        
        viewDetail(item) {
            let history = uni.getStorageSync('viewHistory')
            if (!Array.isArray(history)) {
                history = []
            }
            history.unshift({ ...item, viewTime: Date.now() })
            if (history.length > 50) history.pop()
            uni.setStorageSync('viewHistory', history)
            
            uni.showModal({
                title: `${item.brand} ${item.type}`,
                content: `故障现象：${item.symptom}\n\n故障原因：${item.description}\n\n解决方案：${item.solution}\n\n⚠️ 维修前请务必断电！`,
                confirmText: '收藏',
                cancelText: '关闭',
                success: (res) => {
                    if (res.confirm) {
                        this.collect(item)
                    }
                }
            })
        }
    }
}
</script>

<style scoped>
.diagnosis-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f7fb;
}

.search-header {
    background: #fff;
    padding: 20rpx 30rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.search-box {
    flex: 1;
    background: #f5f5f5;
    border-radius: 60rpx;
    padding: 20rpx 30rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
}

.search-icon {
    font-size: 36rpx;
    color: #666;
}

.search-input {
    flex: 1;
    font-size: 28rpx;
}

.clear-icon {
    font-size: 28rpx;
    color: #999;
    padding: 10rpx;
}

.search-actions {
    display: flex;
    gap: 20rpx;
}

.action-btn {
    width: 70rpx;
    height: 70rpx;
    background: #f5f5f5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-icon {
    font-size: 36rpx;
}

.category-scroll {
    background: #fff;
    padding: 20rpx 30rpx;
    white-space: nowrap;
    border-bottom: 1rpx solid #eee;
}

.category-tag {
    display: inline-block;
    padding: 12rpx 30rpx;
    margin-right: 20rpx;
    background: #f5f5f5;
    border-radius: 50rpx;
    font-size: 26rpx;
    color: #666;
}

.category-tag.active {
    background: #1565C0;
    color: #fff;
}

.hot-search {
    background: #fff;
    padding: 30rpx;
    margin: 20rpx;
    border-radius: 20rpx;
}

.hot-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 20rpx;
}

.hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
}

.hot-tag {
    font-size: 26rpx;
    color: #1565C0;
    background: #e3f2fd;
    padding: 12rpx 24rpx;
    border-radius: 30rpx;
}

.result-list {
    flex: 1;
    padding: 20rpx 30rpx;
}

.result-items {
    padding-bottom: 40rpx;
}

.result-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.card-header {
    display: flex;
    gap: 20rpx;
    margin-bottom: 20rpx;
    flex-wrap: wrap;
}

.brand {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
}

.type {
    font-size: 28rpx;
    color: #1565C0;
}

.model {
    font-size: 24rpx;
    color: #999;
}

.card-body {
    margin-bottom: 20rpx;
}

.symptom {
    font-size: 28rpx;
    color: #f44336;
    display: block;
    margin-bottom: 12rpx;
    font-weight: 500;
}

.description {
    font-size: 26rpx;
    color: #666;
    line-height: 1.5;
    display: block;
}

.card-footer {
    border-top: 1rpx solid #eee;
    padding-top: 20rpx;
}

.solution {
    font-size: 26rpx;
    color: #4caf50;
    display: block;
    margin-bottom: 16rpx;
}

.card-actions {
    display: flex;
    gap: 30rpx;
    justify-content: flex-end;
}

.action-small {
    font-size: 36rpx;
}

.empty-state, .loading-state {
    text-align: center;
    padding: 120rpx 0;
    color: #999;
}

.empty-icon, .loading-icon {
    font-size: 80rpx;
    display: block;
    margin-bottom: 30rpx;
}

.empty-title {
    font-size: 32rpx;
    color: #666;
    display: block;
    margin-bottom: 16rpx;
}

.empty-hint {
    font-size: 24rpx;
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
    padding: 50rpx;
    width: 600rpx;
    max-height: 80vh;
    overflow-y: auto;
    text-align: center;
}

.modal-title {
    font-size: 36rpx;
    font-weight: bold;
    display: block;
    margin-bottom: 30rpx;
}

.voice-section {
    margin-bottom: 30rpx;
    text-align: left;
}

.section-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    display: block;
    margin-bottom: 16rpx;
}

.hint-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;
}

.hint-tag {
    font-size: 26rpx;
    color: #1565C0;
    background: #e3f2fd;
    padding: 12rpx 24rpx;
    border-radius: 30rpx;
}

.manual-input {
    background: #f5f5f5;
    border-radius: 60rpx;
    padding: 20rpx 30rpx;
    font-size: 28rpx;
    width: 100%;
    box-sizing: border-box;
}

.image-preview {
    width: 100%;
    height: 300rpx;
    border-radius: 16rpx;
    margin-bottom: 30rpx;
}

.image-result-text {
    font-size: 32rpx;
    color: #1565C0;
    margin-bottom: 40rpx;
    display: block;
}

.modal-actions {
    display: flex;
    gap: 30rpx;
    justify-content: center;
}

.modal-btn, .voice-cancel {
    padding: 20rpx 40rpx;
    border-radius: 60rpx;
    font-size: 28rpx;
    background: #f5f5f5;
    border: none;
}

.modal-btn.primary {
    background: #1565C0;
    color: #fff;
}

.voice-cancel {
    background: #f5f5f5;
    color: #666;
    margin-top: 20rpx;
}
</style>