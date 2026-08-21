# GitHub → Cloudflare Pages 部署

## GitHub 仓库

当前项目远程仓库：`https://github.com/cgtakeshi/JASON-.git`

仓库中需要保留：

- `app/`：页面与样式
- `mobile-entry/`：静态站入口
- `public/`：优化后的图片、视频和 Pages 路由规则
- `package.json`、`package-lock.json`
- `vite.cloudflare-pages.config.ts`

不要提交 `node_modules/`、`exports/`、`.tmp/`、`dist/` 或 `deploy/cloudflare-pages/`。

## Cloudflare Pages 设置

在 Cloudflare Dashboard 中选择 Workers & Pages → Create application → Pages → Connect to Git，并连接上述 GitHub 仓库。

- Production branch：`master`
- Framework preset：`None`
- Build command：`npm run build:cloudflare`
- Build output directory：`deploy/cloudflare-pages`
- Root directory：留空
- Environment variable：`NODE_VERSION=22.13.0`

保存后触发部署。以后只要推送到 GitHub 的 `master` 分支，Cloudflare 就会自动重新构建和发布。
