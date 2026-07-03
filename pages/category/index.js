import { getCategoryList } from '../../services/good/fetchCategoryList';
Page({
  data: {
    list: [],
  },
  async init() {
    try {
      const result = await getCategoryList();
      this.setData({
        list: result,
      });
    } catch (error) {
      console.error('err:', error);
    }
  },

  onShow() {
    this.getTabBar().init();
  },
  onChange(e) {
    const { item } = e.detail;
    const categoryId = item?.groupId || item?.id || '';

    wx.navigateTo({
      url: `/pages/goods/list/index?categoryId=${categoryId}`,
    });
  },
  onLoad() {
    this.init(true);
  },
});
