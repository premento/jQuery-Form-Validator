# Bundled fonts

Both families are vendored here so the documentation site stays self-contained
and works offline. Neither is fetched from a CDN at runtime.

| Font | Version | License |
| ---- | ------- | ------- |
| [Inter](https://github.com/rsms/inter) Variable (latin subset) | via `@fontsource-variable/inter` | SIL Open Font License 1.1 |
| [JetBrains Mono](https://github.com/JetBrains/JetBrainsMono) Variable (latin subset) | via `@fontsource-variable/jetbrains-mono` | SIL Open Font License 1.1 |

The SIL Open Font License permits bundling and redistribution, including in
commercial work, provided the fonts are not sold on their own and the license
travels with them. Full text: <https://openfontlicense.org/>

To refresh:

```bash
npm install --no-save @fontsource-variable/inter @fontsource-variable/jetbrains-mono
cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 \
   docs/assets/fonts/inter-variable.woff2
cp node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2 \
   docs/assets/fonts/jetbrains-mono-variable.woff2
```
