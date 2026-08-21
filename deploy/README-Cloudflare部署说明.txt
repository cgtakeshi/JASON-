Cloudflare Pages 部署目录：cloudflare-pages

推荐方式：
1. 打开 Cloudflare Dashboard → Workers & Pages。
2. 进入对应的 Pages 项目，选择创建部署或上传资产。
3. 直接上传 cloudflare-pages 文件夹中的全部内容。
4. 确认 index.html 位于上传内容的根目录，而不是多套一层文件夹。

如果连接 Git：
- 构建命令：pnpm exec vite build --config vite.cloudflare-pages.config.ts
- 构建输出目录：deploy/cloudflare-pages
- Node.js 版本：22

不要上传：
- exports/jason-portfolio-mobile（这是 file:// 本地预览版本）
- node_modules
- app、scripts、public 等源码目录
