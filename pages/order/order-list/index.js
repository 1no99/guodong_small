import { OrderStatus } from '../config';
import { fetchOrders } from '../../../services/order/orderList';
import { cosThumb } from '../../../utils/util';
import { get,put } from '../../../utils/request';
import Toast from 'tdesign-miniprogram/toast/index';
Page({
  page: {
    size: 20,
    num: 1,
  },

  data: {
    
    tabs: [
      { key: -1, text: '全部' },
      { key: OrderStatus.PENDING_PAYMENT, text: '待付款', info: '' },
      { key: OrderStatus.PENDING_CONFIRM, text: '已确认', info: '' },
      { key: OrderStatus.PENDING_DELIVERY, text: '已发货', info: '' },
      // { key: OrderStatus.COMPLETE, text: '已完成', info: '' },
    ],
    curTab: -1,
    orderList: [],
    listLoading: 0,
    pullDownRefreshing: false,
    loading: false,
    hasLoaded: false,
    emptyImg: 'https://tdesign.gtimg.com/miniprogram/template/retail/order/empty-order-list.png',
    backRefresh: false,
    status: -1,
  },

  onLoad(query) {
    // 初始化分页对象
    this.page = {
      size: 20,
      num: 1,
    };

    // 获取系统信息，用于自定义导航栏
    const sysInfo = wx.getSystemInfoSync();
    const menuBtn = wx.getMenuButtonBoundingClientRect();
    const statusBarHeight = sysInfo.statusBarHeight;
    const navBarHeight = menuBtn.height + (menuBtn.top - statusBarHeight) * 2;
    this.setData({
      statusBarHeight,
      navigationBarHeight: navBarHeight,
      navHeight: statusBarHeight + navBarHeight,
    });

    let status = parseInt(query.status);
    status = this.data.tabs.map((t) => t.key).includes(status) ? status : -1;
    this.init(status);
    this.pullDownRefresh = this.selectComponent('#wr-pull-down-refresh');
  },

  goBack() {
    wx.switchTab({
      url: '/pages/usercenter/index',
    });
  },

  onShow() {
    if (!this.data.backRefresh) return;
    this.onRefresh();
    this.setData({ backRefresh: false });
  },

  onReachBottom() {
    if (this.data.listLoading === 0) {
      this.getOrderList(this.data.curTab);
    }
  },
  updateStatus(val){
    put('/order/update-status', {
      id:  val.currentTarget.dataset.id,
      order_status: 4,
      
    }, true)
      .then((data) => {
        console.log(data);
        if(data.code == 0){
          Toast({
            context: this,
            selector: '#t-toast',
            message: '取消成功',
            icon: '',
          });
          this.init(0);
        }else{
          Toast({
            context: this,
            selector: '#t-toast',
            message: '取消失败',
            icon: '',
          });
        }
       
      })
      .catch((err) => {
        console.error('fetchOrderDetail error:', err);
        throw err;
      });
  },
  onPageScroll(e) {
    this.pullDownRefresh && this.pullDownRefresh.onPageScroll(e);
  },

  onPullDownRefresh_() {
    this.setData({ pullDownRefreshing: true });
    this.refreshList(this.data.curTab)
      .then(() => {
        this.setData({ pullDownRefreshing: false });
      })
      .catch((err) => {
        this.setData({ pullDownRefreshing: false });
        Promise.reject(err);
      });
  },

  init(status) {
    status = status !== undefined ? status : this.data.curTab;
    this.setData({
      status,
    });
    console.log( this);
    this.refreshList(status);
  },

  getOrderList(statusCode = -1, reset = false) {
    // 确保 this.page 已初始化
    if (!this.page) {
      this.page = {
        size: 20,
        num: 1,
      };
    }

    console.log('getOrderList - this.page:', this.page);

    const params = {
      parameter: {
        pageSize: this.page.size || 20,
        pageNum: this.page.num || 1,
      },
    };
    if (statusCode !== -1) params.parameter.orderStatus = statusCode;
    this.setData({ listLoading: 1, loading: true });
    return fetchOrders(params)
      .then((res) => {
        console.log('fetchOrders 返回:', res);
        this.page.num++;
        let orderList = [];
        if (res.list) {
          orderList = res.list || [];
          console.log('订单列表:', orderList);
        }
        return new Promise((resolve) => {
          if (reset) {
            this.setData({ orderList: [] }, () => resolve());
          } else resolve();
        }).then(() => {
          this.setData({
            orderList: this.data.orderList.concat(orderList),
            listLoading: orderList.length > 0 ? 0 : 2,
            loading: false,
            hasLoaded: true,
          });
          console.log(this.data);
        });
      })
      .catch((err) => {
        console.error('getOrderList error:', err);
        this.setData({ listLoading: 3, loading: false, hasLoaded: true });
        return Promise.reject(err);
      });
  },

  onReTryLoad() {
    this.getOrderList(this.data.curTab);
  },

  onTabChange(e) {
    const { value } = e.detail;
    this.setData({
      status: value,
    });
    this.refreshList(value);
  },

  refreshList(status = -1) {
    // 确保 this.page 已正确初始化
    const pageSize = this.page ? this.page.size : 20;

    this.page = {
      size: pageSize,
      num: 1,
    };
    this.setData({ curTab: status, orderList: [], loading: true });

    return this.getOrderList(status, true);
  },

  onRefresh() {
    this.refreshList(this.data.curTab);
  },

  onOrderCardTap(e) {
    const { order } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/order-detail/index?orderNo=${order.orderId}`,
    });
  },
});
