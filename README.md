# Mama Mia Pizza demo site

Pitch website for Mama Mia Pizza, Ras El Maten ([@mamamia.pizza961](https://www.instagram.com/mamamia.pizza961/)), built by [Pixelabs](https://pixelabs.tech). Ordering goes through [jeetak](https://jeetaklb.com).

Preview: https://lightslategrey-cobra-938373.hostingersite.com

- `index.html`, `assets/`, `.htaccess`, `site.webmanifest`: the static site (no build step needed to host it)
- `assets/js/menu.js`: the menu (items, prices, sizes, photos). Edit this file to change the menu
- `assets/img/dishes/`: one photo per menu item (`NAME.webp`) plus its round thumbnail (`NAME-t.webp`)
- `assets/js/site.js`: links (the jeetak store link is at the top), scroll effects, menu tabs
- `assets/js/pizza.js`: the illustrated pizza and the signature pies
- `deploy/mama-mia-site.zip`: the same files, used for Hostinger's static archive deploy
- `source/`: the page template and the scripts that draw the neon sign and logo, cut the videos and menu photos, and build `index.html`
