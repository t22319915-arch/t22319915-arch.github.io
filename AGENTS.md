## 網站發布（固定流程，必遵守）

完成任何內容更新（照片、公告、週報、頁面調整等）後，**一律直接發布、不需詢問使用者確認**：

```
node scripts/publish-site.mjs -m "本次更新簡短說明"
```

- 腳本會自動：對齊 GitHub 最新版 → commit → push `main` → 等待 GitHub Actions 部署完成並回報結果
- `.git` 遺失或損壞時腳本會自動重建（Synology 同步環境曾發生多次，本機檔案不受影響）
- 唯一例外：使用者明確說「先不要發布／只改本機」時才不發布
- 發布完成後回報：commit、Actions 結果、網站網址（https://t22319915-arch.github.io/）

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
