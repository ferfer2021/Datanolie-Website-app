# Datanolie Website (Static)

这是一个静态网站项目，推荐使用 Cloudflare Pages 的 Git 直连 CI/CD（无需在 GitHub 配置 Cloudflare Secret）。

## 已添加的配置

- 本地调试和手动部署脚本: `package.json`
- Node/Cloudflare 本地文件忽略: `.gitignore`

## Cloudflare 侧准备

1. 在 Cloudflare Dashboard 进入 Pages，点击 Create a project。
2. 选择 Connect to Git，授权并选择本仓库。
3. Build settings 使用静态站配置:
	- Framework preset: None
	- Build command: 留空
	- Build output directory: /
4. Production branch 选择 `main` 或 `master`。
5. 完成后，后续每次 push 会自动部署，Pull Request 会生成预览。

## 什么时候才需要 GitHub Secrets

仅当你选择 GitHub Actions 直接调用 Cloudflare API 部署时，才需要:

- CF_API_TOKEN
- CF_ACCOUNT_ID
- CF_PAGES_PROJECT

## 本地命令

安装依赖:

```bash
npm install
```

本地预览:

```bash
npm run cf:dev
```

手动部署（可选）:

```bash
npm run cf:deploy
```

## 说明

这个项目是纯静态站点，不需要额外构建步骤，推荐让 Cloudflare Pages 直接监听 Git 仓库完成 CI/CD。