# 作品集内容后台使用说明

后台地址：`/admin`

## 首次使用

1. 登录 GitHub，打开 Fine-grained personal access token 创建页面。
2. Repository access 选择 `Only select repositories`，仅勾选 `JASON-`。
3. Repository permissions 中仅开启 `Contents: Read and write`。
4. 创建令牌后复制一次，在后台登录页粘贴并进入。

令牌不会写入代码或浏览器长期存储；关闭后台页面后需要重新输入。

## 可管理内容

- 新增、编辑和删除作品。
- 修改中英文作品名、所属项目及作品分类。
- 上传或替换图片、MP4/WebM 视频，单个文件上限 20MB。
- 按素材原始宽高比预览和展示。
- 调整作品顺序。
- 设置作品为草稿或在前台展示。
- 设置项目封面；项目封面不会重复出现在个人作品列表。

## 更新流程

点击“保存并发布更新”后，后台会把修改提交到 GitHub 的 `master` 分支。Cloudflare Pages 会自动构建，一般 1–3 分钟后更新海外站。

国内 ECS 站目前不是 GitHub 自动部署，后台保存后需要再执行国内站同步部署；后续可增加 GitHub Actions 自动同步。

## 安全建议

- 令牌只授权一个仓库，并只开启 Contents 权限。
- 建议为令牌设置过期时间。
- 不要通过微信、邮件或截图分享令牌。
- 如怀疑令牌泄露，立即在 GitHub Settings → Developer settings 中撤销。
