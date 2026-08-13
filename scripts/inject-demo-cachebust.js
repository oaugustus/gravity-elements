'use strict';

/**
 * Cache-busting pro demo (demo/index.html).
 *
 * Problema real (2026-08-13, reportado pelo usuário): o Vite serve
 * /dist/gravity-elements.umd.js e /dist/gravity-elements.css como arquivos
 * estáticos fora do grafo de módulos (referenciados via <script src>/<link
 * href> puro, não import). O Chrome mantém esses dois arquivos em cache de
 * disco mesmo com `cache-control: no-cache` e mesmo depois de reload normal
 * (Cmd+R) ou de abrir uma aba nova — só reload "hard" (Cmd+Shift+R) força
 * revalidação. Isso fazia o demo continuar mostrando o bundle antigo minutos
 * depois de um `npm run build:js`/`build:css` já ter atualizado o dist/ no
 * disco (confirmado via fetch(url, {cache:'no-store'}) retornando o
 * conteúdo novo enquanto o <script> já carregado na página continuava
 * executando a versão velha).
 *
 * Este script roda depois de build:js/build:css (hooks postbuild:js /
 * postbuild:css no package.json) e reescreve o `?v=<hash>` da URL do
 * <script>/<link> em demo/index.html com um hash de 8 hex do conteúdo atual
 * de cada arquivo — troca de conteúdo muda a URL, e uma URL nova nunca bate
 * com nada em cache, então o browser é obrigado a buscar de novo. `npm run
 * demo` (dev server) reflete automaticamente porque lê demo/index.html do
 * disco a cada navegação/reload normal.
 */

var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var ROOT = path.join(__dirname, '..');
var INDEX_HTML_PATH = path.join(ROOT, 'demo', 'index.html');
var TARGETS = [
  { file: path.join(ROOT, 'dist', 'gravity-elements.umd.js'), urlPath: '/dist/gravity-elements.umd.js' },
  { file: path.join(ROOT, 'dist', 'gravity-elements.css'), urlPath: '/dist/gravity-elements.css' },
];

function hashOf(filePath) {
  var contents = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(contents).digest('hex').slice(0, 8);
}

function run() {
  var html = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  var changed = false;

  TARGETS.forEach(function (target) {
    if (!fs.existsSync(target.file)) {
      return;
    }
    var hash = hashOf(target.file);
    var escapedUrlPath = target.urlPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Casa a URL com ou sem query string prévia (?v=... de uma execução anterior).
    var pattern = new RegExp(escapedUrlPath + '(\\?[^"]*)?');
    var replacement = target.urlPath + '?v=' + hash;
    var next = html.replace(pattern, replacement);
    if (next !== html) {
      html = next;
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(INDEX_HTML_PATH, html);
    console.log('demo/index.html: cache-bust atualizado (' + TARGETS.map(function (t) { return t.urlPath; }).join(', ') + ')');
  } else {
    console.log('demo/index.html: cache-bust já estava atualizado, nada mudou.');
  }
}

run();
