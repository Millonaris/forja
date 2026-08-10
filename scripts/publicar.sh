#!/usr/bin/env bash
#
# FORJA · Publicar la app.
#
# Compila y sube el resultado a la rama `gh-pages`, que es la que sirve
# https://millonaris.github.io/forja/. El móvil recoge la versión nueva la
# próxima vez que abras la app.
#
#   npm run publicar
#
# La rama `gh-pages` contiene SOLO el resultado compilado y se reescribe entera
# en cada publicación: no guarda historial y no hay nada que conservar en ella.

set -euo pipefail

REPO="https://github.com/Millonaris/forja.git"
RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$RAIZ"
npm run build

cd dist
# Sin esto GitHub Pages pasa la carpeta por Jekyll y se come los ficheros que
# empiezan por guion bajo.
touch .nojekyll

# Repositorio de usar y tirar: `dist` está en .gitignore, así que este .git de
# dentro no interfiere con el del proyecto.
rm -rf .git
git init -q -b gh-pages
# Con el buffer por defecto, subir las fuentes y los iconos de golpe hace que
# GitHub corte la conexión con un 400.
git config http.postBuffer 157286400
git add -A
git commit -q -m "Publicar $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REPO" gh-pages

echo
echo "Publicado en https://millonaris.github.io/forja/"
echo "Tarda hasta un minuto en refrescarse."
