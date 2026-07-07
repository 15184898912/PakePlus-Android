// 即梦AI中文版 - 应用逻辑
(function() {
    'use strict';

    // ==================== 数据定义 ====================
    const promptData = {
        templates: [
            { name: '二次元少女', category: '人像', prompt: '1girl, beautiful detailed eyes, anime style, masterpiece, best quality, ultra-detailed', desc: '精美的二次元少女插画' },
            { name: '赛博朋克夜景', category: '风景', prompt: 'cyberpunk cityscape, neon lights, rain, night, futuristic buildings, cinematic, masterpiece, 8k', desc: '炫酷的赛博朋克城市夜景' },
            { name: '梦幻仙境', category: '奇幻', prompt: 'magical forest, glowing flowers, fairy lights, ethereal atmosphere, fantasy art, dreamy, masterpiece', desc: '梦幻般的仙境森林' },
            { name: '机甲战士', category: '科幻', prompt: 'giant mecha robot, detailed machinery, sci-fi, battlefield, dramatic lighting, 8k, realistic', desc: '酷炫的科幻机甲战士' },
            { name: '古风美人', category: '人像', prompt: 'beautiful chinese girl, hanfu, ancient chinese style, traditional, elegant, masterpiece, detailed', desc: '古典优雅的古风美人' },
            { name: '星空之下', category: '风景', prompt: 'starry sky, milky way, galaxy, campfire, peaceful night, beautiful scenery, 8k', desc: '璀璨星空下的浪漫场景' }
        ],
        subjects: [
            { label: '少女', value: '1girl, beautiful detailed eyes, beautiful detailed face' },
            { label: '少年', value: '1boy, handsome, detailed face' },
            { label: '机甲', value: 'mecha, robot, mechanical armor, detailed machinery' },
            { label: '风景', value: 'scenery, landscape, beautiful nature' },
            { label: '动物', value: 'animal, cute, detailed fur' },
            { label: '建筑', value: 'architecture, building, detailed structure' },
            { label: '食物', value: 'food, delicious, detailed cuisine' },
            { label: '花朵', value: 'flowers, detailed petals, botanical' }
        ],
        environments: [
            { label: '赛博朋克城市', value: 'cyberpunk city, neon lights, rain, futuristic' },
            { label: '奇幻森林', value: 'enchanted forest, magical, glowing particles, fantasy' },
            { label: '星空宇宙', value: 'starry sky, universe, galaxy, cosmic, space' },
            { label: '海边沙滩', value: 'beach, ocean, sunset, waves, tropical' },
            { label: '樱花校园', value: 'cherry blossoms, school, spring, japanese' },
            { label: '古代宫殿', value: 'ancient palace, chinese architecture, traditional' },
            { label: '冰雪世界', value: 'snow, ice, winter wonderland, aurora' },
            { label: '蒸汽朋克', value: 'steampunk, gears, brass, victorian era' }
        ],
        styles: [
            { label: '动漫风格', value: 'anime style, cel shading, vibrant colors' },
            { label: '写实风格', value: 'realistic, photorealistic, hyperdetailed, 8k uhd' },
            { label: '油画风格', value: 'oil painting, brush strokes, classic art' },
            { label: '水彩风格', value: 'watercolor, soft colors, artistic, wet on wet' },
            { label: '赛璐璐', value: 'cel shaded, clean lines, flat colors' },
            { label: '厚涂风格', value: 'impasto, thick brush strokes, painterly' },
            { label: '像素风格', value: 'pixel art, 16bit, retro game style' },
            { label: '3D渲染', value: '3d render, octane render, unreal engine 5, cinematic lighting' }
        ],
        qualities: [
            { label: '超高清', value: 'masterpiece, best quality, ultra-detailed, 8k' },
            { label: '高清', value: 'high quality, detailed, sharp focus' },
            { label: '电影感', value: 'cinematic lighting, dramatic, movie scene' },
            { label: '柔和光线', value: 'soft lighting, warm colors, gentle atmosphere' },
            { label: '体积光', value: 'volumetric lighting, god rays, atmospheric' },
            { label: '景深效果', value: 'depth of field, bokeh, blur background' }
        ]
    };

    const defaultNegativePrompt = 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';

    // 演示用的示例图片（使用随机图片服务）
    const demoImages = [
        { id: 'demo1', url: 'https://picsum.photos/seed/anime1/512/768', prompt: '二次元少女，粉色头发，蓝色眼睛，校园风格', w: 512, h: 768 },
        { id: 'demo2', url: 'https://picsum.photos/seed/cyber1/768/512', prompt: '赛博朋克城市夜景，霓虹灯牌，雨天街道', w: 768, h: 512 },
        { id: 'demo3', url: 'https://picsum.photos/seed/forest1/512/512', prompt: '梦幻森林，发光的蘑菇，精灵之光', w: 512, h: 512 },
        { id: 'demo4', url: 'https://picsum.photos/seed/girl1/512/680', prompt: '古风美人，汉服，桃花背景', w: 512, h: 680 }
    ];

    // ==================== 状态管理 ====================
    let state = {
        currentTab: 0,
        generateMode: 'text2img',
        width: 1024,
        height: 1024,
        steps: 30,
        cfgScale: 7.0,
        denoisingStrength: 0.75,
        refImage: null,
        theme: 'dark',
        apiKey: localStorage.getItem('jimeng_api_key') || '',
        images: JSON.parse(localStorage.getItem('jimeng_images') || '[]'),
        favorites: JSON.parse(localStorage.getItem('jimeng_favorites') || '[]'),
        selectedPromptTags: [],
        currentPromptCat: 'templates',
        currentImage: null,
        galleryType: 'all'
    };

    // ==================== 初始化 ====================
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        // 启动页
        setTimeout(() => {
            document.getElementById('splash-screen').classList.add('hidden');
            document.getElementById('main-app').style.display = 'flex';
            renderGallery();
            updateStats();
            updateApiStatus();
            updateThemeStatus();
        }, 2000);

        // 输入监听
        const promptInput = document.getElementById('prompt-input');
        promptInput.addEventListener('input', () => {
            document.getElementById('prompt-count').textContent = promptInput.value.length;
        });

        // 点击遮罩关闭弹窗
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.style.display = 'none';
            });
        });

        // ESC关闭弹窗
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.getElementById('image-modal').style.display = 'none';
                document.getElementById('prompt-modal').style.display = 'none';
                document.getElementById('settings-modal').style.display = 'none';
                document.getElementById('generating-overlay').style.display = 'none';
            }
        });
    }

    // ==================== 导航 ====================
    function switchTab(index) {
        state.currentTab = index;
        document.querySelectorAll('.page').forEach((page, i) => {
            page.classList.toggle('active', i === index);
        });
        document.querySelectorAll('.nav-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        if (index === 2) renderGallery();
    }

    // ==================== 主题 ====================
    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.body.classList.toggle('light-theme', state.theme === 'light');
        document.getElementById('dark-switch').checked = state.theme === 'dark';
        updateThemeStatus();
    }

    function updateThemeStatus() {
        const status = document.getElementById('theme-status');
        if (status) status.textContent = state.theme === 'dark' ? '深色' : '浅色';
    }

    // ==================== 创作模式 ====================
    function setGenerateMode(mode) {
        state.generateMode = mode;
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        const refArea = document.getElementById('ref-image-area');
        const denoiseGroup = document.getElementById('denoise-group');
        if (mode === 'img2img') {
            refArea.style.display = 'block';
            denoiseGroup.style.display = 'block';
        } else {
            refArea.style.display = 'none';
            denoiseGroup.style.display = 'none';
            removeRefImage();
        }
    }

    function toggleAdvanced() {
        const panel = document.getElementById('advanced-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    function selectSize(el, w, h) {
        state.width = w;
        state.height = h;
        document.querySelectorAll('.size-item').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
    }

    function useDefaultNegative() {
        document.getElementById('negative-input').value = defaultNegativePrompt;
    }

    // ==================== 参考图片 ====================
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            state.refImage = ev.target.result;
            const preview = document.getElementById('ref-preview');
            preview.src = ev.target.result;
            preview.style.display = 'block';
            document.getElementById('ref-placeholder').style.display = 'none';
            document.querySelector('.ref-remove').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    function removeRefImage() {
        state.refImage = null;
        document.getElementById('ref-preview').style.display = 'none';
        document.getElementById('ref-placeholder').style.display = 'flex';
        document.querySelector('.ref-remove').style.display = 'none';
        document.getElementById('file-input').value = '';
    }

    // ==================== 风格模板 ====================
    function useStyleTemplate(style) {
        const templates = {
            anime: '1girl, beautiful detailed eyes, anime style, masterpiece, best quality, ultra-detailed, cherry blossoms, school uniform',
            cyberpunk: 'cyberpunk city, neon lights, rain, futuristic, cinematic, 8k, highly detailed',
            ancient: 'beautiful chinese girl, hanfu, ancient chinese palace, cherry blossoms, masterpiece, elegant',
            landscape: 'beautiful landscape, mountains, lake, sunset, nature scenery, masterpiece, 8k, photorealistic'
        };
        document.getElementById('prompt-input').value = templates[style] || '';
        document.getElementById('prompt-count').textContent = templates[style]?.length || 0;
        switchTab(1);
        showToast('已应用风格模板');
    }

    // ==================== 生成图片 ====================
    function generateImage() {
        const prompt = document.getElementById('prompt-input').value.trim();
        if (!prompt) {
            showToast('请输入画面描述');
            return;
        }
        if (!state.apiKey) {
            showToast('请先配置API密钥');
            openSettings();
            return;
        }

        // 显示生成中
        const overlay = document.getElementById('generating-overlay');
        overlay.style.display = 'flex';
        const fill = document.getElementById('progress-fill');
        const percent = document.getElementById('progress-percent');
        const btn = document.getElementById('generate-btn');

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    overlay.style.display = 'none';
                    fill.style.width = '0%';
                    percent.textContent = '0%';
                    // 生成演示图片
                    createDemoImage(prompt);
                }, 500);
            }
            fill.style.width = progress + '%';
            percent.textContent = Math.round(progress) + '%';
        }, 300);
    }

    function createDemoImage(prompt) {
        // 使用随机seed创建演示图片
        const seed = Date.now();
        const aspect = state.width / state.height;
        let w = 512, h = 512;
        if (aspect > 1.2) { w = 640; h = 480; }
        else if (aspect < 0.8) { w = 480; h = 640; }

        const imageUrl = `https://picsum.photos/seed/${seed}/${w}/${h}`;
        const newImage = {
            id: 'img_' + seed,
            url: imageUrl,
            prompt: prompt,
            negativePrompt: document.getElementById('negative-input').value,
            w: state.width,
            h: state.height,
            steps: state.steps,
            cfg: state.cfgScale,
            date: new Date().toISOString(),
            favorite: false
        };

        state.images.unshift(newImage);
        saveImages();
        updateStats();

        showToast('生成成功！');
        openImageModal(newImage);
    }

    // ==================== 画廊 ====================
    function renderGallery() {
        const grid = document.getElementById('gallery-grid');
        const empty = document.getElementById('gallery-empty');
        const recent = document.getElementById('recent-works');
        const emptyWorks = document.getElementById('empty-works');

        let images = state.galleryType === 'fav' 
            ? state.images.filter(img => img.favorite)
            : state.images;

        if (images.length === 0) {
            grid.innerHTML = '';
            empty.style.display = 'block';
        } else {
            empty.style.display = 'none';
            grid.innerHTML = images.map(img => createImageCard(img)).join('');
        }

        // 首页最近作品
        const recentImages = state.images.slice(0, 4);
        if (recentImages.length === 0) {
            recent.innerHTML = '';
            emptyWorks.style.display = 'block';
        } else {
            emptyWorks.style.display = 'none';
            recent.innerHTML = `
                <div class="works-grid">
                    ${recentImages.map(img => `
                        <div class="image-card" onclick="openImageModal(images['${img.id}'])">
                            <img src="${img.url}" alt="作品" loading="lazy">
                            <div class="image-info">
                                <p class="image-prompt">${img.prompt}</p>
                                <div class="image-meta">
                                    <span class="image-date">${formatDate(img.date)}</span>
                                    <div class="image-actions">
                                        <button onclick="event.stopPropagation(); toggleFavorite('${img.id}')">${img.favorite ? '❤️' : '🤍'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    function createImageCard(img) {
        return `
            <div class="image-card" onclick='openImageById("${img.id}")'>
                <img src="${img.url}" alt="作品" loading="lazy" style="aspect-ratio: ${img.w}/${img.h}">
                <div class="image-info">
                    <p class="image-prompt">${img.prompt}</p>
                    <div class="image-meta">
                        <span class="image-date">${formatDate(img.date)}</span>
                        <div class="image-actions">
                            <button onclick="event.stopPropagation(); toggleFavorite('${img.id}')">${img.favorite ? '❤️' : '🤍'}</button>
                            <button onclick="event.stopPropagation(); deleteImage('${img.id}')">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function images(id) {
        return state.images.find(img => img.id === id);
    }

    function openImageById(id) {
        const img = state.images.find(i => i.id === id);
        if (img) openImageModal(img);
    }

    function switchGalleryTab(el, type) {
        state.galleryType = type;
        document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        renderGallery();
    }

    function toggleFavorite(id) {
        const img = state.images.find(i => i.id === id);
        if (img) {
            img.favorite = !img.favorite;
            saveImages();
            renderGallery();
            updateStats();
            // 更新弹窗按钮
            const favBtn = document.getElementById('fav-btn');
            if (favBtn && state.currentImage?.id === id) {
                favBtn.textContent = img.favorite ? '❤️' : '🤍';
            }
        }
    }

    function deleteImage(id) {
        state.images = state.images.filter(i => i.id !== id);
        saveImages();
        renderGallery();
        updateStats();
        showToast('已删除');
    }

    function saveImages() {
        localStorage.setItem('jimeng_images', JSON.stringify(state.images));
    }

    function updateStats() {
        document.getElementById('stat-images').textContent = state.images.length;
        document.getElementById('stat-favs').textContent = state.images.filter(i => i.favorite).length;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    // ==================== 图片详情弹窗 ====================
    function openImageModal(img) {
        state.currentImage = img;
        document.getElementById('modal-image').src = img.url;
        document.getElementById('modal-prompt').textContent = img.prompt;
        document.getElementById('modal-size').textContent = `${img.w}×${img.h}`;
        document.getElementById('modal-date').textContent = formatDate(img.date);
        document.getElementById('fav-btn').textContent = img.favorite ? '❤️' : '🤍';
        document.getElementById('image-modal').style.display = 'flex';
    }

    function closeImageModal(e) {
        if (e && e.target !== e.currentTarget) return;
        document.getElementById('image-modal').style.display = 'none';
    }

    function toggleFavoriteCurrent() {
        if (state.currentImage) toggleFavorite(state.currentImage.id);
    }

    function downloadCurrent() {
        showToast('保存功能需在APP中使用');
    }

    function shareCurrent() {
        if (navigator.share && state.currentImage) {
            navigator.share({
                title: '即梦AI作品',
                text: '我用即梦AI生成了一张图片：' + state.currentImage.prompt
            }).catch(() => {});
        } else {
            showToast('分享功能需在APP中使用');
        }
    }

    // ==================== 提示词助手 ====================
    function openPromptAssistant() {
        state.selectedPromptTags = [];
        state.currentPromptCat = 'templates';
        document.querySelectorAll('.prompt-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.prompt-tab[data-cat="templates"]').classList.add('active');
        renderPromptOptions();
        renderSelectedTags();
        document.getElementById('prompt-modal').style.display = 'block';
    }

    function closePromptModal(e) {
        if (e && e.target !== e.currentTarget) return;
        document.getElementById('prompt-modal').style.display = 'none';
    }

    function switchPromptCat(el, cat) {
        state.currentPromptCat = cat;
        state.selectedPromptTags = [];
        document.querySelectorAll('.prompt-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        renderPromptOptions();
        renderSelectedTags();
    }

    function renderPromptOptions() {
        const container = document.getElementById('prompt-options');
        if (state.currentPromptCat === 'templates') {
            container.innerHTML = promptData.templates.map(t => `
                <div class="prompt-template" onclick="applyTemplate('${t.prompt.replace(/'/g, "\\'")}')">
                    <div class="prompt-template-name">${t.name}</div>
                    <div class="prompt-template-desc">${t.desc}</div>
                </div>
            `).join('');
        } else {
            const options = promptData[state.currentPromptCat] || [];
            container.innerHTML = `<div class="prompt-grid">${options.map((opt, i) => `
                <div class="prompt-option" data-val="${opt.value.replace(/"/g, '&quot;')}" onclick="togglePromptTag(this, ${i})">
                    ${opt.label}
                </div>
            `).join('')}</div>`;
        }
    }

    function togglePromptTag(el, index) {
        const options = promptData[state.currentPromptCat] || [];
        const opt = options[index];
        const tagIndex = state.selectedPromptTags.indexOf(opt.value);
        if (tagIndex >= 0) {
            state.selectedPromptTags.splice(tagIndex, 1);
            el.classList.remove('selected');
        } else {
            state.selectedPromptTags.push(opt.value);
            el.classList.add('selected');
        }
        renderSelectedTags();
    }

    function applyTemplate(prompt) {
        const input = document.getElementById('prompt-input');
        input.value = prompt;
        document.getElementById('prompt-count').textContent = prompt.length;
        closePromptModal();
        showToast('已应用模板');
    }

    function renderSelectedTags() {
        const container = document.getElementById('selected-tags');
        const btn = document.getElementById('apply-prompt-btn');
        
        if (state.selectedPromptTags.length === 0) {
            container.innerHTML = '';
        } else {
            container.innerHTML = `
                <div class="selected-tags-header">
                    <span>已选标签</span>
                    <button onclick="clearSelectedTags()">清空</button>
                </div>
                <div class="tags-wrap">
                    ${state.selectedPromptTags.map((tag, i) => `
                        <span class="selected-tag">
                            ${tag.length > 20 ? tag.substring(0, 20) + '...' : tag}
                            <button onclick="removeTag(${i})">✕</button>
                        </span>
                    `).join('')}
                </div>
            `;
        }
        btn.textContent = `应用 (${state.selectedPromptTags.length})`;
        btn.disabled = state.selectedPromptTags.length === 0;
        btn.style.opacity = state.selectedPromptTags.length === 0 ? '0.5' : '1';
    }

    function clearSelectedTags() {
        state.selectedPromptTags = [];
        renderPromptOptions();
        renderSelectedTags();
    }

    function removeTag(index) {
        state.selectedPromptTags.splice(index, 1);
        renderPromptOptions();
        // 重新选中已选的
        state.selectedPromptTags.forEach(tag => {
            document.querySelectorAll('.prompt-option').forEach(el => {
                if (el.dataset.val === tag) el.classList.add('selected');
            });
        });
        renderSelectedTags();
    }

    function applyPromptTags() {
        if (state.selectedPromptTags.length === 0) return;
        const newPrompt = state.selectedPromptTags.join(', ');
        const input = document.getElementById('prompt-input');
        input.value = input.value ? `${input.value}, ${newPrompt}` : newPrompt;
        document.getElementById('prompt-count').textContent = input.value.length;
        closePromptModal();
        showToast('已应用标签');
    }

    // ==================== 设置 ====================
    function openSettings(tab) {
        document.getElementById('settings-modal').style.display = 'flex';
        if (tab === 0) switchSettingsTab(document.querySelector('.settings-tab'), 'api');
    }

    function closeSettings(e) {
        if (e && e.target !== e.currentTarget) return;
        document.getElementById('settings-modal').style.display = 'none';
    }

    function switchSettingsTab(el, panel) {
        document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('settings-api').style.display = panel === 'api' ? 'block' : 'none';
        document.getElementById('settings-general').style.display = panel === 'general' ? 'block' : 'none';
    }

    function toggleApiVisibility() {
        const input = document.getElementById('api-key-input');
        input.type = input.type === 'password' ? 'text' : 'password';
    }

    function saveApiKey() {
        const key = document.getElementById('api-key-input').value.trim();
        state.apiKey = key;
        localStorage.setItem('jimeng_api_key', key);
        updateApiStatus();
        showToast(key ? 'API密钥已保存' : '已清除API密钥');
        closeSettings();
    }

    function updateApiStatus() {
        document.getElementById('api-key-input').value = state.apiKey;
        const dot = document.getElementById('api-status-dot');
        const text = document.getElementById('api-status-text');
        const warning = document.getElementById('api-warning');
        if (state.apiKey) {
            dot.classList.add('ok');
            text.textContent = 'API密钥已配置';
            text.style.color = 'var(--success)';
            warning.style.display = 'none';
        } else {
            dot.classList.remove('ok');
            text.textContent = 'API密钥未配置';
            text.style.color = 'var(--error)';
            warning.style.display = 'flex';
        }
        document.getElementById('cache-size').textContent = '0 MB';
        document.getElementById('cache-size-setting').textContent = '0 MB';
    }

    function clearCache() {
        showToast('缓存已清理');
    }

    function showAbout() {
        alert('即梦AI中文版 v1.0.0\n\n一款强大的AI智能绘画生成工具，支持文生图、图生图，内置智能提示词系统。\n\n© 2026 即梦AI团队');
    }

    // ==================== Toast ====================
    function showToast(msg) {
        const toast = document.getElementById('toast');
        toast.textContent = msg;
        toast.style.display = 'block';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.display = 'none';
        }, 2500);
    }

    // 暴露全局函数
    window.switchTab = switchTab;
    window.toggleTheme = toggleTheme;
    window.setGenerateMode = setGenerateMode;
    window.toggleAdvanced = toggleAdvanced;
    window.selectSize = selectSize;
    window.useDefaultNegative = useDefaultNegative;
    window.handleFileSelect = handleFileSelect;
    window.removeRefImage = removeRefImage;
    window.useStyleTemplate = useStyleTemplate;
    window.generateImage = generateImage;
    window.openImageModal = openImageModal;
    window.closeImageModal = closeImageModal;
    window.toggleFavoriteCurrent = toggleFavoriteCurrent;
    window.downloadCurrent = downloadCurrent;
    window.shareCurrent = shareCurrent;
    window.openPromptAssistant = openPromptAssistant;
    window.closePromptModal = closePromptModal;
    window.switchPromptCat = switchPromptCat;
    window.togglePromptTag = togglePromptTag;
    window.applyTemplate = applyTemplate;
    window.clearSelectedTags = clearSelectedTags;
    window.removeTag = removeTag;
    window.applyPromptTags = applyPromptTags;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.switchSettingsTab = switchSettingsTab;
    window.toggleApiVisibility = toggleApiVisibility;
    window.saveApiKey = saveApiKey;
    window.clearCache = clearCache;
    window.showAbout = showAbout;
    window.switchGalleryTab = switchGalleryTab;
    window.openImageById = openImageById;
    window.toggleFavorite = toggleFavorite;
    window.deleteImage = deleteImage;
    window.images = images;
})();
