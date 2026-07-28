# 🎨 Xiliu - 有趣分享空间

> 一个朋友们的有趣分享空间，包含团队介绍、文件管理和菜谱分享。

## ✨ 功能模块

### 👥 关于我们
展示团队成员卡片，包含头像、角色、签名和技能标签。支持通过弹窗表单添加/删除成员。

### 📁 文件中心
拖拽上传文件，支持多种格式预览：
- **图片/视频/音频** — 在线播放
- **PDF** — 内嵌预览
- **Word 文档** — mammoth.js 实时渲染
- **Markdown** — marked.js 渲染
- **代码/文本** — 语法高亮

支持按类型筛选、分页浏览、下载和删除。

### 🍳 菜谱分享
创建和浏览菜谱，包含：
- 菜品分类（家常菜、烘焙、饮品、小吃、硬菜）
- 1-5 星难度评分
- 食材清单 & 步骤说明
- 关键词搜索

### 🎉 隐藏彩蛋
在 Logo 旁的秘密输入框中输入 **"Xiliu"** 解锁隐藏页面：
- 😂 表情包画廊
- 📖 每日金句
- 🔨 打地鼠小游戏
- 🎊 撒花特效
- 💬 匿名留言板

## 🚀 快速开始

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/你的用户名/Xiliu.git
cd Xiliu

# 安装依赖
npm install

# 启动服务
npm start
```

打开浏览器访问 **http://localhost:3337**

### 部署到服务器

```bash
# 上传项目到服务器
scp -r . user@server:/opt/xiliu

# SSH 登录后
cd /opt/xiliu
npm install --production

# 使用 PM2 守护进程（推荐）
npm install -g pm2
pm2 start server.js --name xiliu
pm2 save
pm2 startup

# 或直接运行
PORT=80 node server.js
```

## 🛠 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JavaScript |
| 后端 | Node.js + Express.js |
| 文件上传 | Multer（50MB 限制）|
| 文档预览 | mammoth.js（Word）、marked.js（Markdown）|
| 数据存储 | JSON 文件 + localStorage + IndexedDB |
| 样式特效 | CSS 变量主题、毛玻璃导航栏、滚动动画 |

## 📁 项目结构

```
Xiliu/
├── server.js            # Express 后端入口
├── index.html           # 单页应用主页
├── package.json
├── css/
│   ├── style.css        # 主样式（主题、布局）
│   ├── components.css   # 组件样式
│   ├── animations.css   # 滚动动画
│   └── easteregg.css    # 彩蛋样式
├── js/
│   ├── app.js           # 应用初始化、导航、主题
│   ├── storage.js       # localStorage 工具封装
│   ├── about.js         # 团队成员模块
│   ├── files.js         # 文件中心模块
│   ├── menu.js          # 菜谱分享模块
│   └── easteregg.js     # 隐藏彩蛋模块
├── data/                # 元数据存储（JSON）
└── uploads/             # 上传文件存储
```

## 📝 License

MIT
