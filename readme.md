# Datanolie Website (Static)

这是一个静态网站项目，推荐使用 Cloudflare Pages 的 Git 直连 CI/CD（无需在 GitHub 配置 Cloudflare Secret）。

## 已添加的配置

- Node/Cloudflare 本地文件忽略: `.gitignore`

## Cloudflare 侧准备

1. 在 Cloudflare Dashboard 进入 Pages，点击 Create a project。
2. 选择 Connect to Git，授权并选择本仓库。
3. Build settings 使用静态站配置:
   - Framework preset: None
   - Build command: 留空
   - Build output directory: .
4. Production branch 选择 `main` 或 `master`。
5. 完成后，后续每次 push 会自动部署，Pull Request 会生成预览。

## 遇到日志里这种报错时的修复

如果日志出现 `Executing user deploy command: npx wrangler deploy` 或 `Asset too large`:

1. 到 Cloudflare Pages 项目 `Settings -> Builds & deployments`。
2. 把 Build command 清空（不要用 `npx wrangler deploy`）。
3. 把 Build output directory 设为 `.`。
4. 保存后点击 `Retry deployment` 或重新 push 一次。

## 什么时候才需要 GitHub Secrets

仅当你选择 GitHub Actions 直接调用 Cloudflare API 部署时，才需要:

- CF_API_TOKEN
- CF_ACCOUNT_ID
- CF_PAGES_PROJECT

## 说明

这个项目是纯静态站点，不需要额外构建步骤，推荐让 Cloudflare Pages 直接监听 Git 仓库完成 CI/CD。