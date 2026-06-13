<script>
export default {
    onLaunch: function() {
        console.log('App Launch')
        // 清除登录状态，确保每次都显示登录页
        try {
            uni.removeStorageSync('isLogin')
            uni.removeStorageSync('userInfo')
        } catch(e) {
            console.log(e)
        }
    },
    onShow: function() {
        console.log('App Show')
    },
    onHide: function() {
        console.log('App Hide')
    }
}
</script>

<style>
/* 全局样式 */
page {
    background-color: #f5f7fb;
}
</style>