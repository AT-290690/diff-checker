<p align="center">
<img width="64" src="./assets/images/-+.svg"/>
</p>

A data comparison tool that computes and shows the differences between the contents of two text files.

Key features:
- High contrast colors so that differences stand out
- Differences breakdown & checkpoints
- Drag and drop file content
- Vertical & horizontal layout
- Dark mode
- PWA support (works offline)

Large comparisons run in a background worker so the interface remains responsive.
Comparisons over 256 KB combined stay local and are not placed in the URL; this
sharing limit does not limit the size of files that can be compared.
