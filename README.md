# 🚗 混动车能源成本分析看板

一个交互式的 Web 应用，帮助混动车车主智能分析加油与充电的最优选择。

![Dashboard Preview](https://img.shields.io/badge/Platform-Web-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Deploy](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-orange)

## ✨ 功能特点

- 📊 实时计算充电 vs 加油成本
- 🎯 智能临界电价分析
- 📈 多维度图表可视化
- 📋 敏感性分析矩阵
- 📱 响应式设计，支持移动端

## 🚀 部署方式

### 方式一：Cloudflare Pages（推荐）

1. **Fork 或克隆仓库到你的 GitHub 账户**

2. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 进入 **Workers & Pages** 菜单

3. **创建新项目**
   - 点击 **Create application** → **Pages** → **Connect to Git**
   - 授权 Cloudflare 访问你的 GitHub 账户
   - 选择这个仓库

4. **配置构建设置**
   ```
   项目名称: car-analysis (或你喜欢的名称)
   生产分支: main
   构建命令: (留空，这是纯静态网站)
   构建输出目录: /
   ```

5. **点击部署**
   - Cloudflare 会自动部署你的网站
   - 完成后会获得一个 `*.pages.dev` 的域名

6. **（可选）绑定自定义域名**
   - 在项目设置中添加自定义域名
   - 按照指引配置 DNS

### 方式二：Docker 部署

```bash
# 构建镜像
docker build -t car-analysis .

# 运行容器
docker run -d -p 8080:80 --name car-analysis car-analysis

# 访问 http://localhost:8080
```

### 方式三：Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  car-analysis:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

运行:
```bash
docker-compose up -d
```

## 📁 项目结构

```
car-analysis/
├── index.html      # 主页面（包含所有 HTML、CSS、JS）
├── Dockerfile      # Docker 构建配置
├── nginx.conf      # Nginx 服务器配置
├── .gitignore      # Git 忽略文件
└── README.md       # 项目说明
```

## 🔧 本地开发

由于这是一个纯静态的 HTML 文件，你可以直接用浏览器打开 `index.html`：

```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

或者使用任意 HTTP 服务器：

```bash
# Python 3
python -m http.server 8000

# Node.js (需要安装 http-server)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

## 📊 使用说明

1. 调整电费价格滑块（元/度）
2. 调整油价滑块（元/升）
3. 查看实时计算的成本对比
4. 参考决策面板的建议
5. 分析敏感性矩阵了解不同场景

## 🛠 技术栈

- **HTML5** - 页面结构
- **CSS3** - 样式设计（渐变、动画、响应式）
- **JavaScript** - 交互逻辑
- **Chart.js** - 图表可视化
- **Nginx** - 静态文件服务（Docker 部署）

## 📝 License

MIT License - 自由使用和修改

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
