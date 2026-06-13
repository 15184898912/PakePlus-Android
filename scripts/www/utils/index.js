// utils/index.js

// 缓存工具
export const cache = {
    // 设置缓存
    set(key, data, expire = 7 * 24 * 60 * 60 * 1000) { // 默认7天过期
        const item = {
            data: data,
            expireTime: Date.now() + expire
        }
        uni.setStorageSync(key, JSON.stringify(item))
    },
    
    // 获取缓存
    get(key) {
        const itemStr = uni.getStorageSync(key)
        if (!itemStr) return null
        
        try {
            const item = JSON.parse(itemStr)
            if (Date.now() > item.expireTime) {
                uni.removeStorageSync(key)
                return null
            }
            return item.data
        } catch(e) {
            return null
        }
    },
    
    // 删除缓存
    remove(key) {
        uni.removeStorageSync(key)
    },
    
    // 清空所有缓存
    clear() {
        uni.clearStorageSync()
    }
}

// 分享工具
export const share = {
    // 分享到微信好友
    shareToFriend(title, path, imageUrl) {
        uni.share({
            provider: 'weixin',
            type: 0,
            title: title,
            summary: '家电维修助手，专业维修资料库',
            href: path || '/pages/diagnosis/diagnosis',
            imageUrl: imageUrl || '/static/share-icon.png',
            success: () => {
                uni.showToast({ title: '分享成功', icon: 'success' })
            },
            fail: (err) => {
                console.error('分享失败', err)
                uni.showToast({ title: '分享失败', icon: 'none' })
            }
        })
    },
    
    // 复制链接分享
    copyLink(title, content) {
        uni.setClipboardData({
            data: content || '家电维修助手 - 专业维修资料库',
            success: () => {
                uni.showToast({ title: '链接已复制', icon: 'success' })
            }
        })
    }
}

// 语音播报工具
export const speech = {
    // 是否正在播放
    isPlaying: false,
    
    // 播放文字
    speak(text, rate = 0.5, pitch = 1) {
        if (!text) return
        
        // 停止当前播放
        this.stop()
        
        // 创建语音实例
        const speechInstance = plus.speech.createSpeech({
            rate: rate,      // 语速 0-1
            pitch: pitch,    // 音调 0-2
            voice: 'zh'
        })
        
        speechInstance.addEventListener('finished', () => {
            this.isPlaying = false
        })
        
        speechInstance.start(text)
        this.isPlaying = true
        
        // 保存实例以便停止
        this.currentSpeech = speechInstance
    },
    
    // 停止播放
    stop() {
        if (this.currentSpeech) {
            this.currentSpeech.stop()
            this.currentSpeech = null
        }
        this.isPlaying = false
    }
}

// 图片上传工具
export const uploadImage = {
    // 选择图片并上传
    async selectAndUpload() {
        return new Promise((resolve, reject) => {
            uni.chooseImage({
                count: 1,
                sizeType: ['compressed'],
                sourceType: ['camera', 'album'],
                success: (res) => {
                    const tempFilePath = res.tempFilePaths[0]
                    
                    uni.showLoading({ title: '识别中...' })
                    
                    // 上传到临时存储
                    uni.uploadFile({
                        url: 'https://api.example.com/upload', // 替换为你的上传接口
                        filePath: tempFilePath,
                        name: 'file',
                        success: (uploadRes) => {
                            uni.hideLoading()
                            try {
                                const data = JSON.parse(uploadRes.data)
                                resolve(data)
                            } catch(e) {
                                // 如果没有后端，直接返回本地路径
                                resolve({ path: tempFilePath, local: true })
                            }
                        },
                        fail: (err) => {
                            uni.hideLoading()
                            // 即使上传失败，也返回本地路径
                            resolve({ path: tempFilePath, local: true })
                            reject(err)
                        }
                    })
                },
                fail: (err) => {
                    reject(err)
                }
            })
        })
    }
}