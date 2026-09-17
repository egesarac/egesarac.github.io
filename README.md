# egesarac.github.io

Personal academic website built with Astro.

## Development

Requires Node.js 22.19+ and npm 9.6.5+. Use `.nvmrc` to select Node 22.

```sh
npm ci
npm run dev       # local development
```

```sh
npm run build
npm run preview   # review the production build
```

## Editing

- Content: `src/data/*.yaml`
- Pages and shared UI: `src/pages/`, `src/components/`, `src/layouts/`
- Styles: `src/styles/global.css`
- PDFs and images: `public/` (everything here is published)

## Publishing

Add the project to the `egesarac.github.io` repository, including hidden
configuration files. Set GitHub Pages' source to **GitHub Actions** and push to
`main`. `.github/workflows/deploy.yml` builds and publishes `dist/`.
