/*!
 * TF Widgets — Photo Gallery v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json
 * Галерея фото: сетка плиток, альбомы вкладками, подписи, ссылка с фото,
 * просмотр на весь экран (лайтбокс) с листанием стрелками, клавишами и свайпом.
 * Виджет встаёт на место тега <script>. Все стили ограничены классами .bhw-gl / .bhw-gl-lb.
 */
(function () {
    'use strict';
    var VERSION = '1.0.0';
    var LOG = '[TFW Gallery]';
    // Где работает живое превью BHWGallery.render() (конфигуратор на сайте)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];
    var MAX_PHOTOS = 40, MAX_ALBUMS = 10;
    var RATIOS = { '1:1': '1 / 1', '4:3': '4 / 3', '3:2': '3 / 2', '16:9': '16 / 9', '4:5': '4 / 5', '2:3': '2 / 3' };

    var ICON_X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/></svg>';
    var ICON_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M15.4 4.6 16.8 6l-6 6 6 6-1.4 1.4L8 12z"/></svg>';
    var ICON_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8.6 4.6 7.2 6l6 6-6 6 1.4 1.4L16 12z"/></svg>';
    var ICON_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-9.3 9.3-1.4-1.4L17.6 5H14V3zM5 5h6v2H5v12h12v-6h2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></svg>';
    var ICON_ZOOM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 3a7 7 0 0 1 5.6 11.2l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 1 1 10 3zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm-1 2h2v2h2v2h-2v2H9v-2H7V9h2z"/></svg>';

    var inlineCSS = `
        .bhw-gl { font-family: var(--bhw-font, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif); -webkit-font-smoothing: antialiased;
            display: block; position: relative; width: 100%; max-width: var(--bhw-max, 1100px); margin: 0 auto; padding: var(--bhw-pad, 0px);
            background: var(--bhw-bg, transparent); color: var(--bhw-text, #1f2937); border-radius: var(--bhw-r, 14px);
            line-height: 1.45; font-size: 15px; text-align: left; box-sizing: border-box; }
        .bhw-gl *, .bhw-gl *::before, .bhw-gl *::after { box-sizing: border-box; }
        .bhw-gl .bhw-gl-head { margin: 0 0 18px; text-align: center; }
        .bhw-gl .bhw-gl-h { margin: 0; padding: 0; font-size: 28px; font-weight: 800; line-height: 1.2; letter-spacing: -.01em; color: inherit; }
        .bhw-gl .bhw-gl-sub { margin: 6px 0 0; font-size: 15px; opacity: .7; color: inherit; }

        /* вкладки альбомов */
        .bhw-gl .bhw-gl-tabs { display: flex; gap: 8px; margin: 0 0 16px; padding: 2px 2px 6px; overflow-x: auto; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
        .bhw-gl .bhw-gl-tabs.bhw-center { justify-content: center; }
        .bhw-gl .bhw-gl-tab { flex: none; margin: 0; padding: 9px 16px; border: 1px solid var(--bhw-line, rgba(0,0,0,.12)); border-radius: 999px; background: transparent;
            color: inherit; font: inherit; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; box-shadow: none; min-height: 0; transition: background .2s, color .2s, border-color .2s; }
        .bhw-gl .bhw-gl-tab:hover { border-color: var(--bhw-accent, #111827); }
        .bhw-gl .bhw-gl-tab.bhw-on { background: var(--bhw-accent, #111827); border-color: var(--bhw-accent, #111827); color: var(--bhw-accent-text, #fff); }
        .bhw-gl .bhw-gl-tab:focus-visible { outline: 3px solid var(--bhw-accent, #111827); outline-offset: 2px; }

        /* сетка */
        .bhw-gl .bhw-gl-grid { display: grid; grid-template-columns: repeat(var(--bhw-cols, 3), minmax(0, 1fr)); gap: var(--bhw-gap, 10px); align-items: start; }
        .bhw-gl .bhw-gl-it { position: relative; display: block; min-width: 0; margin: 0; padding: 0; border: 0; background: none; box-shadow: none; text-align: left;
            color: inherit; font: inherit; text-decoration: none; cursor: pointer; border-radius: var(--bhw-r, 14px); }
        .bhw-gl .bhw-gl-it[hidden] { display: none; }
        .bhw-gl span.bhw-gl-it { cursor: default; }
        .bhw-gl .bhw-gl-ph { position: relative; display: block; width: 100%; aspect-ratio: var(--bhw-ratio, 1 / 1); overflow: hidden; border-radius: var(--bhw-r, 14px);
            background: var(--bhw-line, rgba(0,0,0,.08)); }
        .bhw-gl .bhw-gl-ph img { position: absolute; inset: 0; width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important;
            border: 0 !important; border-radius: 0 !important; object-fit: cover; display: block; transition: transform .45s ease, opacity .3s; }
        .bhw-gl .bhw-gl-it:hover .bhw-gl-ph img { transform: scale(1.04); }
        .bhw-gl .bhw-gl-it:focus-visible { outline: 3px solid var(--bhw-accent, #111827); outline-offset: 3px; }
        .bhw-gl .bhw-gl-ic { position: absolute; right: 10px; top: 10px; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%;
            background: rgba(0,0,0,.45); color: #fff; opacity: 0; transform: scale(.85); transition: opacity .2s, transform .2s; pointer-events: none; }
        .bhw-gl .bhw-gl-ic svg { width: 18px; height: 18px; }
        .bhw-gl .bhw-gl-it:hover .bhw-gl-ic, .bhw-gl .bhw-gl-it:focus-visible .bhw-gl-ic { opacity: 1; transform: none; }
        .bhw-gl .bhw-gl-cap { display: block; margin: 8px 2px 0; font-size: 14px; font-weight: 600; line-height: 1.35; color: inherit; overflow-wrap: anywhere; }
        .bhw-gl.bhw-gl-overlay .bhw-gl-cap { position: absolute; left: 0; right: 0; bottom: 0; margin: 0; padding: 28px 12px 10px; border-radius: 0 0 var(--bhw-r, 14px) var(--bhw-r, 14px);
            background: linear-gradient(to top, rgba(0,0,0,.66), rgba(0,0,0,0)); color: #fff; font-size: 13.5px; pointer-events: none; }
        .bhw-gl .bhw-gl-empty { margin: 24px 0; text-align: center; opacity: .65; font-size: 15px; }
        .bhw-gl .bhw-gl-ph.bhw-broken::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, rgba(0,0,0,.04) 0 10px, rgba(0,0,0,.08) 10px 20px); }

        @media (max-width: 560px) {
            .bhw-gl { padding: var(--bhw-pad-m, 0px); }
            .bhw-gl .bhw-gl-h { font-size: 23px; }
            .bhw-gl .bhw-gl-cap { font-size: 13px; }
        }

        /* лайтбокс */
        .bhw-gl-lb { position: fixed; inset: 0; z-index: 2147483000; display: flex; flex-direction: column; background: #0d0d10; color: #fff;
            font-family: var(--bhw-font, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif); -webkit-font-smoothing: antialiased; opacity: 0; transition: opacity .2s; touch-action: none; }
        .bhw-gl-lb.bhw-open { opacity: 1; }
        .bhw-gl-lb *, .bhw-gl-lb *::before, .bhw-gl-lb *::after { box-sizing: border-box; }
        .bhw-gl-lb .bhw-gl-lb-top { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; }
        .bhw-gl-lb .bhw-gl-lb-n { font-size: 14px; font-weight: 600; opacity: .8; color: #fff; }
        .bhw-gl-lb .bhw-gl-lb-stage { position: relative; flex: 1 1 auto; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 64px; }
        .bhw-gl-lb .bhw-gl-lb-img { display: block; max-width: 100% !important; max-height: 100% !important; width: auto !important; height: auto !important; margin: 0 !important;
            border: 0 !important; border-radius: 6px !important; object-fit: contain; user-select: none; -webkit-user-drag: none; transition: opacity .2s, transform .2s; }
        .bhw-gl-lb .bhw-gl-lb-img.bhw-loading { opacity: .25; }
        .bhw-gl-lb button.bhw-gl-lb-b { display: grid; place-items: center; width: 44px; height: 44px; min-height: 0; margin: 0; padding: 0; border: 0 !important; border-radius: 50%;
            background: rgba(255,255,255,.12) !important; color: #fff !important; cursor: pointer; box-shadow: none; transition: background .2s; }
        .bhw-gl-lb button.bhw-gl-lb-b:hover { background: rgba(255,255,255,.24) !important; }
        .bhw-gl-lb button.bhw-gl-lb-b:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
        .bhw-gl-lb button.bhw-gl-lb-b svg { width: 24px; height: 24px; }
        .bhw-gl-lb .bhw-gl-lb-prev, .bhw-gl-lb .bhw-gl-lb-next { position: absolute; top: 50%; margin-top: -22px !important; }
        .bhw-gl-lb .bhw-gl-lb-prev { left: 12px; }
        .bhw-gl-lb .bhw-gl-lb-next { right: 12px; }
        .bhw-gl-lb .bhw-gl-lb-bot { flex: none; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 16px; min-height: 64px; padding: 12px 16px 18px; text-align: center; }
        .bhw-gl-lb .bhw-gl-lb-cap { margin: 0; font-size: 15px; line-height: 1.4; color: #fff; max-width: 760px; overflow-wrap: anywhere; }
        .bhw-gl-lb a.bhw-gl-lb-link { display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 999px; background: #fff !important;
            color: #111 !important; font-size: 14px; font-weight: 700; text-decoration: none !important; line-height: 1.2; }
        .bhw-gl-lb a.bhw-gl-lb-link svg { width: 16px; height: 16px; }
        .bhw-gl-lb [hidden] { display: none !important; }
        .bhw-gl-lb.bhw-single .bhw-gl-lb-prev, .bhw-gl-lb.bhw-single .bhw-gl-lb-next { display: none; }
        @media (max-width: 640px) {
            .bhw-gl-lb .bhw-gl-lb-stage { padding: 0; }
            .bhw-gl-lb .bhw-gl-lb-img { border-radius: 0 !important; }
            .bhw-gl-lb .bhw-gl-lb-prev, .bhw-gl-lb .bhw-gl-lb-next { top: auto; bottom: 10px; margin-top: 0 !important; z-index: 2; background: rgba(0,0,0,.45) !important; }
        }
        @media (prefers-reduced-motion: reduce) { .bhw-gl, .bhw-gl *, .bhw-gl-lb, .bhw-gl-lb * { transition: none !important; } }

        /* защита от тем сайта, которые красят текст и кнопки через !important */
        .bhw-gl :where(.bhw-gl-h, .bhw-gl-sub, .bhw-gl-empty) { color: var(--bhw-text, #1f2937) !important; }
        .bhw-gl:not(.bhw-gl-overlay) .bhw-gl-cap { color: var(--bhw-text, #1f2937) !important; }
        .bhw-gl.bhw-gl-overlay .bhw-gl-cap { color: #fff !important; }
        .bhw-gl .bhw-gl-tab { color: var(--bhw-text, #1f2937) !important; background: transparent !important; border: 1px solid var(--bhw-line, rgba(0,0,0,.12)) !important; }
        .bhw-gl .bhw-gl-tab.bhw-on { color: var(--bhw-accent-text, #fff) !important; background: var(--bhw-accent, #111827) !important; border-color: var(--bhw-accent, #111827) !important; }
        .bhw-gl button.bhw-gl-it { background: none !important; border: 0 !important; box-shadow: none !important; }
        .bhw-gl :where(h3, p, span, b, button, strong, a), .bhw-gl-lb :where(p, span, button, a) { font-family: inherit !important; letter-spacing: normal; text-transform: none; }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.gallery = window.BusinessHoursWidgets.gallery || {};

    // Живое превью для конфигуратора: BHWGallery.render(container, config) -> { update, show, destroy, el }
    var api = window.BHWGallery = window.BHWGallery || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.checkAccess = bhwCheckAccess;
    api.ratios = RATIOS;
    api.limits = { photos: MAX_PHOTOS, albums: MAX_ALBUMS };
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, show: function () {}, index: function () { return 0; }, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._bhwGlDestroy) container._bhwGlDestroy();
        var cls = container.__bhwGlClass || (container.__bhwGlClass = 'bhw-gl-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var state = widget ? widget.state() : null;
                if (widget) widget.destroy();
                widget = mountWidget(normalizeConfig(cfg || {}), cls, 'preview', { inline: container, state: state });
                ctrl.el = widget.root;
            },
            show: function (i) { if (widget) widget.show(i); },
            index: function () { return widget ? widget.state().album : 0; },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._bhwGlDestroy = null; }
        };
        ctrl.update(config);
        container._bhwGlDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'bhw-gl-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, { anchor: currentScript });
                        window.BusinessHoursWidgets.gallery[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-gallery-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-gallery-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#bhw-gl-local-config');
            if (!el) return Promise.reject(new Error('#bhw-gl-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            heading: '',
            subheading: '',
            albums: [],                    // [{ name, photos: [{ src, caption, link }] }]
            allTab: true,                  // вкладка «All» со всеми фото, если альбомов больше одного
            layout: { columns: 3, columnsMobile: 2, ratio: '1:1', gap: 10, captions: 'below' },  // captions: below | overlay | hidden
            lightbox: true,
            labels: { all: 'All', link: 'Learn more' },
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: { background: '', text: '#1f2937', accent: '#111827', accentText: '#ffffff' },
                sizes: { maxWidth: 1100, radius: 14 }
            }
        };
    }

    function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
    function normalizeConfig(raw) {
        raw = raw || {};
        var albums = Array.isArray(raw.albums) ? raw.albums : [];
        var cfg = mergeDeep(getDefaultConfig(), raw);
        var left = MAX_PHOTOS;
        cfg.albums = albums.slice(0, MAX_ALBUMS).map(function (a) {
            a = a || {};
            var photos = (Array.isArray(a.photos) ? a.photos : []).map(function (p) {
                p = p || {};
                return { src: safeImg(p.src), caption: str(p.caption, 140), link: safeLink(p.link) };
            }).filter(function (p) { return p.src; });
            photos = photos.slice(0, Math.max(0, left));
            left -= photos.length;
            return { name: str(a.name, 30) || 'Photos', photos: photos };
        });
        var L = cfg.layout;
        L.columns = Math.round(Math.min(6, Math.max(1, num(L.columns, 3))));
        L.columnsMobile = Math.round(Math.min(3, Math.max(1, num(L.columnsMobile, 2))));
        L.gap = Math.round(Math.min(32, Math.max(0, num(L.gap, 10))));
        if (!RATIOS[L.ratio]) L.ratio = '1:1';
        if (['below', 'overlay', 'hidden'].indexOf(L.captions) < 0) L.captions = 'below';
        cfg.allTab = cfg.allTab !== false;
        cfg.lightbox = cfg.lightbox !== false;
        cfg.heading = str(cfg.heading, 80);
        cfg.subheading = str(cfg.subheading, 160);
        cfg.style.sizes.maxWidth = Math.min(1600, Math.max(320, num(cfg.style.sizes.maxWidth, 1100)));
        cfg.style.sizes.radius = Math.min(32, Math.max(0, num(cfg.style.sizes.radius, 14)));
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function safeImg(url) {
        var u = String(url || '').trim();
        if (/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
        if (/^data:image\/(svg\+xml|png|jpe?g|webp)[;,]/i.test(u) && u.length < 200000) return u;
        return '';
    }
    function safeLink(url) {
        var u = String(url || '').trim();
        if (!u) return '';
        if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u;
        if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([\/?#][^\s"'<>]*)?$/i.test(u)) return 'https://' + u;
        return '';
    }
    function hexToRgb(hex) {
        var h = String(hex || '').replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-f]{6}$/i.test(h)) return null;
        var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function isDark(hex) {
        var c = hexToRgb(hex); if (!c) return false;
        return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5;
    }
    function rgba(hex, a) { var c = hexToRgb(hex); return c ? 'rgba(' + c.join(',') + ',' + a + ')' : 'rgba(0,0,0,' + a + ')'; }

    function applyCustomStyles(uniqueClass, cfg) {
        var id = 'bhw-gl-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = cfg.style || {}, c = s.colors || {}, z = s.sizes || {}, L = cfg.layout;
        var bg = cssValue(c.background, '');
        var text = cssValue(c.text, '#1f2937');
        var accent = cssValue(c.accent, '#111827');
        var solid = hexToRgb(bg) ? bg : (isDark(text) ? '#ffffff' : '#111111');
        el.textContent = '.' + uniqueClass + '{' +
            '--bhw-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--bhw-bg:' + (bg || 'transparent') + ';' +
            '--bhw-pad:' + (bg ? '24px' : '0px') + ';' +
            '--bhw-pad-m:' + (bg ? '14px' : '0px') + ';' +
            '--bhw-text:' + text + ';' +
            '--bhw-line:' + rgba(text, isDark(solid) ? .18 : .12) + ';' +
            '--bhw-accent:' + accent + ';' +
            '--bhw-accent-text:' + cssValue(c.accentText, isDark(accent) ? '#ffffff' : '#111111') + ';' +
            '--bhw-max:' + num(z.maxWidth, 1100) + 'px;' +
            '--bhw-r:' + num(z.radius, 14) + 'px;' +
            '--bhw-gap:' + L.gap + 'px;' +
            '--bhw-ratio:' + RATIOS[L.ratio] + ';' +
            '}';
        return id;
    }

    // все фото с номером альбома (для вкладки «All» и лайтбокса)
    function flatten(albums) {
        var out = [];
        albums.forEach(function (a, ai) { a.photos.forEach(function (p) { out.push({ p: p, album: ai }); }); });
        return out;
    }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var inline = opts.inline || null;
        var styleId = applyCustomStyles(uniqueClass, cfg);
        var albums = cfg.albums.filter(function (a) { return a.photos.length; });
        var all = flatten(albums);
        var L = cfg.labels || {};
        var lay = cfg.layout;
        var st = opts.state || {};
        var hasAll = albums.length > 1 && cfg.allTab;
        // вкладки: [-1 = All], 0..n-1 = альбомы
        var tabKeys = albums.length > 1 ? (hasAll ? [-1] : []).concat(albums.map(function (a, i) { return i; })) : [];
        var cur = albums.length > 1 ? (hasAll ? -1 : 0) : -1;
        if (typeof st.album === 'number' && st.album >= -1 && st.album < albums.length && (st.album >= 0 || hasAll || albums.length < 2)) cur = st.album;
        if (albums.length < 2) cur = -1;

        var root = document.createElement('div');
        root.id = 'tfw-gallery-' + id;
        root.className = 'bhw-gl ' + uniqueClass + (lay.captions === 'overlay' ? ' bhw-gl-overlay' : '');

        function tileHtml(x, k) {
            var p = x.p;
            var cap = lay.captions !== 'hidden' && p.caption ? '<span class="bhw-gl-cap">' + escapeHtml(p.caption) + '</span>' : '';
            var inner = '<span class="bhw-gl-ph"><img alt="' + escapeHtml(p.caption) + '" loading="lazy" decoding="async" src="' + escapeHtml(p.src) + '">' +
                (cfg.lightbox ? '<span class="bhw-gl-ic">' + ICON_ZOOM + '</span>' : (p.link ? '<span class="bhw-gl-ic">' + ICON_OUT + '</span>' : '')) + '</span>' + cap;
            if (cfg.lightbox) return '<button type="button" class="bhw-gl-it" data-k="' + k + '" aria-label="' + escapeHtml(p.caption || 'Open photo ' + (k + 1)) + '">' + inner + '</button>';
            if (p.link) return '<a class="bhw-gl-it" data-k="' + k + '" href="' + escapeHtml(p.link) + '" target="_blank" rel="noopener">' + inner + '</a>';
            return '<span class="bhw-gl-it" data-k="' + k + '">' + inner + '</span>';
        }

        root.innerHTML =
            ((cfg.heading || cfg.subheading) ? '<header class="bhw-gl-head">' +
                (cfg.heading ? '<h3 class="bhw-gl-h">' + escapeHtml(cfg.heading) + '</h3>' : '') +
                (cfg.subheading ? '<p class="bhw-gl-sub">' + escapeHtml(cfg.subheading) + '</p>' : '') + '</header>' : '') +
            (tabKeys.length ? '<div class="bhw-gl-tabs' + (cfg.heading ? ' bhw-center' : '') + '" role="tablist">' + tabKeys.map(function (key) {
                return '<button type="button" class="bhw-gl-tab" role="tab" data-a="' + key + '">' + escapeHtml(key < 0 ? (L.all || 'All') : albums[key].name) + '</button>';
            }).join('') + '</div>' : '') +
            (all.length ? '<div class="bhw-gl-grid">' + all.map(tileHtml).join('') + '</div>' :
                '<p class="bhw-gl-empty">Add photo links to see your gallery</p>');

        if (inline) inline.appendChild(root);
        else if (opts.anchor && opts.anchor.parentNode) opts.anchor.parentNode.insertBefore(root, opts.anchor.nextSibling);
        else document.body.appendChild(root);

        var cleanups = [];
        function on(t, e, h, o) { t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }

        var tiles = [].slice.call(root.querySelectorAll('.bhw-gl-it'));
        var tabs = [].slice.call(root.querySelectorAll('.bhw-gl-tab'));
        var grid = root.querySelector('.bhw-gl-grid');

        function visible() { return all.map(function (x, k) { return k; }).filter(function (k) { return cur < 0 || all[k].album === cur; }); }
        function show(a) {
            cur = a;
            tiles.forEach(function (t, k) { t.hidden = !(cur < 0 || all[k].album === cur); });
            tabs.forEach(function (t) {
                var on_ = Number(t.getAttribute('data-a')) === cur;
                t.classList.toggle('bhw-on', on_); t.setAttribute('aria-selected', on_ ? 'true' : 'false');
            });
        }
        tabs.forEach(function (t) { on(t, 'click', function () { show(Number(t.getAttribute('data-a'))); }); });
        if (tabs.length) on(root.querySelector('.bhw-gl-tabs'), 'keydown', function (e) {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            var i = tabKeys.indexOf(cur) + (e.key === 'ArrowRight' ? 1 : -1);
            if (i < 0 || i >= tabs.length) return;
            show(tabKeys[i]); tabs[i].focus(); e.preventDefault();
        });
        root.querySelectorAll('.bhw-gl-ph img').forEach(function (img) {
            img.addEventListener('error', function () { img.style.opacity = '0'; if (img.parentNode) img.parentNode.classList.add('bhw-broken'); });
        });

        // колонки по ширине блока
        function layout() {
            var w = (inline ? inline.clientWidth : root.clientWidth) || root.clientWidth;
            w = Math.min(w, cfg.style.sizes.maxWidth);
            var cols = w < 560 ? lay.columnsMobile : (w < 820 ? Math.min(lay.columns, Math.max(lay.columnsMobile, 3)) : lay.columns);
            root.style.setProperty('--bhw-cols', String(cols));
        }
        layout();
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(layout);
            ro.observe(inline || root);
            cleanups.push(function () { ro.disconnect(); });
        } else on(window, 'resize', layout);

        /* ---------- лайтбокс ---------- */
        var lb = null;
        function openLb(k) {
            if (lb) lb.close();
            var list = visible();
            var pos = Math.max(0, list.indexOf(k));
            var opener = document.activeElement;
            var el = document.createElement('div');
            el.className = 'bhw-gl-lb ' + uniqueClass + (list.length < 2 ? ' bhw-single' : '');
            el.setAttribute('role', 'dialog');
            el.setAttribute('aria-modal', 'true');
            el.setAttribute('aria-label', 'Photo viewer');
            el.innerHTML =
                '<div class="bhw-gl-lb-top"><span class="bhw-gl-lb-n" aria-live="polite"></span>' +
                    '<button type="button" class="bhw-gl-lb-b bhw-gl-lb-x" aria-label="Close">' + ICON_X + '</button></div>' +
                '<div class="bhw-gl-lb-stage"><img class="bhw-gl-lb-img" alt="">' +
                    '<button type="button" class="bhw-gl-lb-b bhw-gl-lb-prev" aria-label="Previous photo">' + ICON_L + '</button>' +
                    '<button type="button" class="bhw-gl-lb-b bhw-gl-lb-next" aria-label="Next photo">' + ICON_R + '</button></div>' +
                '<div class="bhw-gl-lb-bot"><p class="bhw-gl-lb-cap"></p><a class="bhw-gl-lb-link" target="_blank" rel="noopener" hidden></a></div>';
            document.body.appendChild(el);
            var img = el.querySelector('.bhw-gl-lb-img');
            var n = el.querySelector('.bhw-gl-lb-n');
            var cap = el.querySelector('.bhw-gl-lb-cap');
            var link = el.querySelector('.bhw-gl-lb-link');
            var xBtn = el.querySelector('.bhw-gl-lb-x');
            var prevOverflow = document.documentElement.style.overflow;
            document.documentElement.style.overflow = 'hidden';

            function render() {
                var p = all[list[pos]].p;
                img.classList.add('bhw-loading');
                img.onload = function () { img.classList.remove('bhw-loading'); };
                img.onerror = function () { img.classList.remove('bhw-loading'); };
                img.src = p.src;
                img.alt = p.caption || '';
                n.textContent = list.length > 1 ? (pos + 1) + ' / ' + list.length : '';
                cap.textContent = p.caption || '';
                cap.hidden = !p.caption;
                if (p.link) { link.href = p.link; link.innerHTML = escapeHtml(L.link || 'Learn more') + ICON_OUT; link.hidden = false; }
                else { link.hidden = true; link.removeAttribute('href'); }
                // подгрузить соседние
                [pos - 1, pos + 1].forEach(function (j) { if (list.length > 1) { var q = all[list[(j + list.length) % list.length]].p; var pre = new Image(); pre.src = q.src; } });
            }
            function go(d) { if (list.length < 2) return; pos = (pos + d + list.length) % list.length; render(); }
            function close() {
                document.removeEventListener('keydown', onKey, true);
                document.documentElement.style.overflow = prevOverflow;
                el.remove();
                lb = null;
                if (opener && opener.focus) try { opener.focus({ preventScroll: true }); } catch (e) {}
            }
            function onKey(e) {
                if (e.key === 'Escape') { close(); e.preventDefault(); }
                else if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
                else if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
                else if (e.key === 'Tab') {
                    var f = [].slice.call(el.querySelectorAll('button, a[href]')).filter(function (b) { return b.offsetParent !== null; });
                    if (!f.length) return;
                    var i = f.indexOf(document.activeElement);
                    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
                    else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
                }
            }
            document.addEventListener('keydown', onKey, true);
            xBtn.addEventListener('click', close);
            el.querySelector('.bhw-gl-lb-prev').addEventListener('click', function () { go(-1); });
            el.querySelector('.bhw-gl-lb-next').addEventListener('click', function () { go(1); });
            // клик по тёмному фону закрывает
            el.addEventListener('click', function (e) {
                if (e.target === el || e.target.classList.contains('bhw-gl-lb-stage') || e.target.classList.contains('bhw-gl-lb-bot') || e.target.classList.contains('bhw-gl-lb-top')) close();
            });
            // свайп
            var sx = null, sy = 0;
            el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
            el.addEventListener('pointerup', function (e) {
                if (sx === null) return;
                var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
                if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
                else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
            });
            el.addEventListener('pointercancel', function () { sx = null; });

            render();
            requestAnimationFrame(function () { el.classList.add('bhw-open'); });
            xBtn.focus({ preventScroll: true });
            lb = { close: close, el: el };
        }
        if (cfg.lightbox) tiles.forEach(function (t, k) { on(t, 'click', function () { openLb(k); }); });
        cleanups.push(function () { if (lb) lb.close(); });

        show(cur);

        return {
            root: root, config: cfg, id: id,
            state: function () { return { album: cur }; },
            show: function (a) { if (albums.length > 1) show(Math.min(Math.max(hasAll ? -1 : 0, a), albums.length - 1)); },
            open: function (k) { if (cfg.lightbox && all[k]) openLb(k); },
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                root.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };
    }
})();
