# 前后端API联调说明

## 项目概述

- **前端项目**：微信小程序（果冻商城）
- **后端项目**：Node.js Express API（gdexpress）
- **后端地址**：http://localhost:3000/api

## 已完成的工作

### 1. API配置和请求工具

#### 配置文件：[config/index.js](config/index.js)
```javascript
export const config = {
  useMock: false,        // 已切换为真实API
  apiBase: 'http://localhost:3000/api',
  requestTimeout: 30000,
};
```

#### 请求工具：[utils/request.js](utils/request.js)
提供了以下功能：
- `request(url, options)` - 基础请求方法
- `get(url, data, needAuth)` - GET请求
- `post(url, data, needAuth)` - POST请求
- `put(url, data, needAuth)` - PUT请求
- `del(url, data, needAuth)` - DELETE请求
- `getToken()` / `setToken()` / `clearToken()` - Token管理

### 2. 已对接的后端接口

#### 首页模块
**文件**：[services/home/home.js](services/home/home.js)
- ✅ `GET /api/banner/list` - 获取轮播图列表

#### 商品模块
**文件**：
- [services/good/fetchGoodsList.js](services/good/fetchGoodsList.js)
  - ✅ `GET /api/product/list` - 获取商品列表
- [services/good/fetchGood.js](services/good/fetchGood.js)
  - ✅ `GET /api/product/detail/:id` - 获取商品详情

#### 购物车模块
**文件**：[services/cart/cart.js](services/cart/cart.js)
- ✅ `GET /api/cart/list` - 获取购物车列表
- ✅ `POST /api/cart/add` - 添加到购物车
- ✅ `PUT /api/cart/item/:id` - 更新购物车项
- ✅ `DELETE /api/cart/item/:id` - 删除购物车项
- ✅ `DELETE /api/cart/clear` - 清空购物车
- ✅ `GET /api/cart/count` - 获取购物车数量

#### 订单模块
**文件**：
- [services/order/orderList.js](services/order/orderList.js)
  - ✅ `GET /api/order/list` - 获取订单列表
  - ✅ `GET /api/order/status/count` - 获取订单状态统计
- [services/order/orderDetail.js](services/order/orderDetail.js)
  - ✅ `GET /api/order/detail/:id` - 获取订单详情
- [services/order/orderConfirm.js](services/order/orderConfirm.js)
  - ✅ `POST /api/order/create` - 创建订单

#### 用户模块
**文件**：
- [services/usercenter/fetchUsercenter.js](services/usercenter/fetchUsercenter.js)
  - ✅ `GET /api/user/info` - 获取用户信息

#### 地址模块
**文件**：[services/address/fetchAddress.js](services/address/fetchAddress.js)
- ✅ `GET /api/user/address` - 获取地址列表
- ✅ `GET /api/user/address/:id` - 获取地址详情

## 启动指南

### 1. 启动后端服务

```bash
cd C:\Users\admin\Desktop\项目\gdexpress
npm install
npm run dev
```

后端将运行在：http://localhost:3000

### 2. 启动小程序

1. 使用微信开发者工具打开项目：`C:\Users\admin\Desktop\项目\果冻`
2. 在开发者工具中点击"编译"

### 3. 测试接口

访问以下URL测试后端是否正常运行：
- http://localhost:3000/health - 健康检查
- http://localhost:3000/api - API信息

## 后端API路由说明

### 用户相关 (/api/user)
- `POST /api/user/login/wechat` - 微信登录
- `POST /api/user/register` - 注册
- `POST /api/user/login` - 登录
- `GET /api/user/info` - 获取用户信息（需认证）
- `PUT /api/user/info` - 更新用户信息（需认证）
- `GET /api/user/address` - 获取地址列表（需认证）
- `POST /api/user/address` - 创建地址（需认证）
- `PUT /api/user/address/:id` - 更新地址（需认证）
- `DELETE /api/user/address/:id` - 删除地址（需认证）

### 商品相关 (/api/product)
- `GET /api/product/list` - 商品列表
- `GET /api/product/detail/:id` - 商品详情
- `GET /api/product/search` - 搜索商品
- `GET /api/product/category/list` - 分类列表
- `GET /api/product/favorite/list` - 收藏列表（需认证）
- `POST /api/product/favorite/add` - 添加收藏（需认证）
- `DELETE /api/product/favorite/:product_id` - 取消收藏（需认证）

### 购物车相关 (/api/cart)
- `GET /api/cart/list` - 购物车列表（需认证）
- `POST /api/cart/add` - 添加到购物车（需认证）
- `PUT /api/cart/item/:id` - 更新购物车项（需认证）
- `DELETE /api/cart/item/:id` - 删除购物车项（需认证）
- `DELETE /api/cart/clear` - 清空购物车（需认证）
- `GET /api/cart/count` - 购物车数量（需认证）

### 订单相关 (/api/order)
- `POST /api/order/create` - 创建订单（需认证）
- `GET /api/order/list` - 订单列表（需认证）
- `GET /api/order/detail/:id` - 订单详情（需认证）
- `GET /api/order/status/count` - 订单状态统计（需认证）

### 轮播图相关 (/api/banner)
- `GET /api/banner/list` - 轮播图列表

## 认证机制

所有需要认证的接口都使用JWT Token：
- Token存储在微信小程序的本地存储中
- 请求时在Header中添加：`Authorization: Bearer <token>`
- Token过期时会自动跳转到登录页

## 数据格式说明

### 后端返回格式
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### 错误处理
- 401: 未登录或Token过期
- 其他错误码：显示后端返回的错误信息

## 开发注意事项

1. **切换Mock数据**：修改 [config/index.js](config/index.js) 中的 `useMock` 配置
2. **Token管理**：确保在登录后正确保存Token
3. **错误降级**：所有API调用失败时会自动回退到Mock数据
4. **CORS配置**：后端已启用CORS，支持跨域请求

## 数据库初始化

如果需要初始化数据库：

```bash
cd C:\Users\admin\Desktop\项目\gdexpress
npm run init-db
```

## 环境配置

后端项目使用 `.env` 文件配置环境变量，确保以下配置正确：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=clothing_shop
JWT_SECRET=your_jwt_secret
```

## 测试账号

根据后端配置，可以使用以下方式登录：
- 手机号 + 密码
- 用户名 + 密码
- 微信登录（需要配置微信小程序AppID和AppSecret）

## 问题排查

### 1. 接口请求失败
- 检查后端服务是否启动
- 检查端口是否正确（默认3000）
- 查看微信开发者工具的网络请求日志

### 2. Token相关错误
- 检查是否已登录
- 检查Token是否过期
- 清除本地存储后重新登录

### 3. 数据不显示
- 检查后端数据库是否有数据
- 查看控制台错误日志
- 检查API返回数据格式是否正确
