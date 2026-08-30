# JASON 个人站国内部署包

运行 `npm run build:cn` 后，将生成 `deploy/cn-release`：

- `www/`：上传至 ECS 的 `/var/www/jason-portfolio/www`
- `oss/`：初次上传至 ECS 的 `/var/www/jason-portfolio/oss`
- `nginx-jason-portfolio.conf`：Nginx 站点配置
- `site-config.oss.example.js`：切换 OSS/CDN 时使用的配置示例

## 第一阶段：备案审核期间

可以先把 `www` 与 `oss` 两个目录上传到 ECS，但不要把未备案域名解析并开放为正式网站。Nginx 配置会通过 `/media` 提供图片和视频。

## 第二阶段：备案通过后

1. 将 `oss/` 内的全部文件上传到 OSS Bucket 根目录。
2. 给 OSS 配置 CDN 加速域名，例如 `static.example.com`。
3. 把 `www/site-config.js` 中的 `assetBase` 修改为 CDN 的 HTTPS 地址。
4. 将备案域名解析到 ECS 公网 IP，并配置 HTTPS。

示例：

```js
window.__PORTFOLIO_CONFIG__ = {
  assetBase: "https://static.example.com",
};
```

## 缓存建议

- HTML 和 `site-config.js`：不缓存
- 带哈希的 JS/CSS：长期缓存
- OSS 图片与视频：缓存 30 天
- OSS 开启 Referer 防盗链并保留空 Referer，避免作品素材被盗链

## 注意

不要把 OSS Bucket 的 AccessKey 写入网页或 `site-config.js`。浏览器访问公开作品素材不需要 AccessKey。
