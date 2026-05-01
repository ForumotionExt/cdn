/**
 * Forumotion Moderation Tools
 * Version : 3.0.0 — Vanilla JS (zero jQuery)
 * License : GNU GPL v3.0
 */

if (typeof zModConfig === 'undefined') var zModConfig = {
    icon:        "https://i58.servimg.com/u/f58/11/80/17/98/chat-110.png",
    fontAwesome: true
};

if (typeof zModRoles === 'undefined') var zModRoles = [
    { id: 0, name: "👑 Administratori", user_levels: [2]    },
    { id: 1, name: "🛡️ Moderatori",     user_levels: [1, 2] },
    { id: 2, name: "✅ Staff general",  user_levels: [1, 2] }
];

if (typeof zModTabels === 'undefined') var zModTabels = [
    {
        type:       "zalert",
        body_start: '[table class="zmod_box zalert"][tr][td style="padding-right:10px;" width="60px"][icon="fa fa-exclamation-circle"][/icon][div]',
        body_end:   "[/div][/td][/tr][/table]\n\n"
    },
    {
        type:       "zsuccess",
        body_start: '[table class="zmod_box zsuccess"][tr][td style="padding-right:10px;" width="60px"][icon="fa fa-check"][/icon][div]',
        body_end:   "[/div][/td][/tr][/table]\n\n"
    },
    {
        type:       "zdefault",
        body_start: '[table class="zmod_box zdefault"][tr][td style="padding-right:10px;" width="60px"][icon="fa fa-rocket"][/icon][div]',
        body_end:   "[/div][/td][/tr][/table]\n\n"
    },
    {
        type:       "zwarning",
        body_start: '[table class="zmod_box zwarning"][tr][td style="padding-right:10px;" width="60px"][icon="fa fa-exclamation-triangle"][/icon][div]',
        body_end:   "[/div][/td][/tr][/table]\n\n"
    },
    {
        type:       "zinfo",
        body_start: '[table class="zmod_box zinfo"][tr][td style="padding-right:10px;" width="60px"][icon="fa fa-info"][/icon][div]',
        body_end:   "[/div][/td][/tr][/table]\n\n"
    }
];

/* =========================================================
   MESAJE PRE-DEFINITE
   role_id – ID-ul din zModRoles
   type    – tipul de template din zModTabels
   ========================================================= */

if (typeof zModMessages === 'undefined') var zModMessages = [
    /* Administratori */
    {
        name:    "Avertisment (Admin)",
        message: "[b]⚠ Avertisment oficial[/b]\nMesajul tau a fost modificat/sters de echipa de administrare deoarece incalca regulamentul forumului.",
        role_id: 0,
        type:    "zalert"
    },
    {
        name:    "Anunt important (Admin)",
        message: "[b]📢 Anunt important[/b]\nEchipa de administrare doreste sa iti aduca la cunostinta o modificare importanta in regulamentul forumului.",
        role_id: 0,
        type:    "zinfo"
    },
    /* Moderatori */
    {
        name:    "Reamintire reguli",
        message: "[b]📋 Reamintire reguli[/b]\nTe rugam sa respecti regulamentul forumului. Postarile care nu se conformeaza vor fi editate sau sterse.",
        role_id: 1,
        type:    "zwarning"
    },
    {
        name:    "Topic inchis",
        message: "[b]🔒 Topic inchis[/b]\nAcest topic a fost inchis de echipa de moderare. Daca ai intrebari, contacteaza un moderator prin mesaj privat.",
        role_id: 1,
        type:    "zdefault"
    },
    {
        name:    "Raspuns aprobat",
        message: "[b]✅ Raspuns aprobat[/b]\nPostarea ta respecta regulamentul. Multumim pentru contributie!",
        role_id: 1,
        type:    "zsuccess"
    },
    /* Staff general */
    {
        name:    "Bun venit!",
        message: "[b]👋 Bun venit pe forum![/b]\nSuntem bucurosi sa te avem in comunitatea noastra. Iti recomandam sa citesti regulamentul.",
        role_id: 2,
        type:    "zsuccess"
    },
    {
        name:    "Info generala",
        message: "[b]ℹ Informatie[/b]\nPentru orice nelamurire, nu ezita sa contactezi echipa de staff printr-un mesaj privat.",
        role_id: 2,
        type:    "zinfo"
    }
];

(function () {
    "use strict";
  
    function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
    function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

    function injectLink(href) {
        var el = document.createElement("link");
        el.rel  = "stylesheet";
        el.href = href;
        document.head.appendChild(el);
    }

    function injectStyle(css, id) {
        if (id && document.getElementById(id)) return;
        var el = document.createElement("style");
        if (id) el.id = id;
        el.textContent = css;
        document.head.appendChild(el);
    }

    function getSCEditor() {
        var ta = document.getElementById("text_editor_textarea");
        if (!ta) return null;

        // SCEditor v2+ API nativ
        if (window.sceditor && window.sceditor.instance) {
            return window.sceditor.instance(ta) || null;
        }

        // SCEditor v1 — stocat prin jQuery.data
        if (window.$ && window.$.data) {
            return window.$.data(ta, "sceditor") || null;
        }

        return null;
    }

    function getTemplate(type, part) {
        for (var i = 0; i < zModTabels.length; i++) {
            if (zModTabels[i].type === type) {
                return part === "start" ? zModTabels[i].body_start : zModTabels[i].body_end;
            }
        }
        return "";
    }

    function insertToEditor(message, type) {
        var editor = getSCEditor();
        if (!editor) return;
        editor.insertText(getTemplate(type, "start") + message, getTemplate(type, "end"));
    }
  
    function setVisible(el, show) {
        el.style.display = show ? "block" : "none";
    }
  
    function isVisible(el) {
        return el.style.display !== "none" && el.style.display !== "";
    }
  
    function toggleEl(el)     { setVisible(el, !isVisible(el)); }
    function hideEl(el)       { setVisible(el, false); }
  
    function renderExistingBoxes() {
        qsa(".zmod_box td").forEach(function (td) {
            td.innerHTML = td.innerHTML
                .replace(/\[icon="?(.*?)"?\](.*?)\[\/icon\]/g,
                         '<div><i class="$1 icon-message">$2</i></div>')
                .replace(/\[div\](.*?)\[\/div\]/g, "<div>$1</div>");
        });
    }
  
    function buildPanel(visibleRoles) {
        var html = '<ul class="mod_groups" id="mod_box_i">';

        visibleRoles.forEach(function (role) {
            var msgs = zModMessages.filter(function (m) { return m.role_id === role.id; });
            if (!msgs.length) return;

            var listId = "zmod_list_" + role.id;

            html += '<li class="mod_editor_section">' +
                      '<a class="zmod_role_toggle" data-target="' + listId + '">' +
                        role.name +
                        ' <span class="zmod_count">' + msgs.length + '</span>' +
                        ' <span class="zmod_arrow">▸</span>' +
                      '</a>' +
                    '</li>' +
                    '<ul class="zmod_role_messages" id="' + listId + '" style="display:none;">';

            msgs.forEach(function (msg) {
                html += '<li class="mod_editor_message">' +
                          '<a class="zmod_msg_link"' +
                             ' data-message="' + encodeURIComponent(msg.message) + '"' +
                             ' data-type="' + msg.type + '">' +
                            msg.name +
                          '</a>' +
                        '</li>';
            });

            html += '</ul>';
        });

        html += '<li class="copyright_e">&#169; Forumotion Mod Tools v3.0</li></ul>';
        return html;
    }
  
    function injectButton(panelHtml) {
        var groups  = qsa(".sceditor-group");
        var lastGrp = groups[groups.length - 1];
        if (!lastGrp) return null;

        var wrapper = document.createElement("div");
        wrapper.className = "sceditor-group";
        wrapper.innerHTML =
            '<a class="sceditor-button sceditor-button-staff" title="Mesaje de moderare">' +
              '<div unselectable="on">Mesaje de moderare</div>' +
            '</a>' +
            '<div class="mod_box" style="display:none;">' + panelHtml + '</div>';

        lastGrp.parentNode.insertBefore(wrapper, lastGrp);
        return wrapper;
    }
  
    function bindEvents() {
        document.addEventListener("click", function (e) {
            var panel = qs(".mod_box");

            // Buton principal → toggle panou
            if (e.target.closest(".sceditor-button-staff")) {
                e.stopPropagation();
                if (panel) toggleEl(panel);
                return;
            }

            // Titlu rol → toggle sub-lista
            var toggle = e.target.closest(".zmod_role_toggle");
            if (toggle) {
                e.stopPropagation();
                var sublist = document.getElementById(toggle.getAttribute("data-target"));
                var arrow   = toggle.querySelector(".zmod_arrow");
                if (sublist) {
                    toggleEl(sublist);
                    if (arrow) arrow.textContent = isVisible(sublist) ? "▾" : "▸";
                }
                return;
            }
          
            var msgLink = e.target.closest(".zmod_msg_link");
            if (msgLink) {
                e.stopPropagation();
                insertToEditor(
                    decodeURIComponent(msgLink.getAttribute("data-message")),
                    msgLink.getAttribute("data-type")
                );
                if (panel) hideEl(panel);
                return;
            }

            if (e.target.closest("textarea") ||
                (e.target.closest(".sceditor-button") && !e.target.closest(".sceditor-button-staff"))) {
                if (panel) hideEl(panel);
                return;
            }
          
            if (panel && !e.target.closest(".mod_box")) {
                hideEl(panel);
            }
        });

        document.addEventListener("click", function (e) {
            if (e.target.closest(".sceditor-button-source")) {
                var staffBtn = qs(".sceditor-button-staff");
                if (staffBtn) staffBtn.classList.remove("disabled");
            }
        });
    }
  
    function buildCSS() {
        return [
            /* Tabele BBCode */
            ".zmod_box{width:100%;border-collapse:collapse;margin:6px 0;border-radius:6px;overflow:hidden}",
            ".zmod_box td{padding:10px 14px;vertical-align:middle}",
            ".zmod_box .icon-message{font-size:22px;display:block;text-align:center}",
            ".zalert  {background:#fff3cd;border-left:4px solid #f0ad4e;color:#856404}",
            ".zsuccess{background:#d4edda;border-left:4px solid #28a745;color:#155724}",
            ".zdefault{background:#e8eaf6;border-left:4px solid #5c6bc0;color:#283593}",
            ".zwarning{background:#f8d7da;border-left:4px solid #dc3545;color:#721c24}",
            ".zinfo   {background:#d1ecf1;border-left:4px solid #17a2b8;color:#0c5460}",
            /* Panou */
            ".mod_box{position:absolute;z-index:9999;background:#fff;border:1px solid #ccc;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.15);min-width:220px;max-width:280px;max-height:380px;overflow-y:auto;font-family:Arial,sans-serif;font-size:13px}",
            /* Lista */
            ".mod_groups{list-style:none;margin:0;padding:4px 0}",
            ".mod_groups li{margin:0}",
            /* Titlu rol */
            ".mod_editor_section>a{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;font-weight:600;font-size:12px;color:#333;background:#f5f5f5;border-top:1px solid #e0e0e0;cursor:pointer;user-select:none}",
            ".mod_editor_section:first-child>a{border-top:none}",
            ".mod_editor_section>a:hover{background:#ebebeb}",
            /* Badge + arrow */
            ".zmod_count{background:#ddd;color:#555;font-size:10px;padding:1px 5px;border-radius:10px;font-weight:400;margin-left:6px}",
            ".zmod_arrow{font-size:10px;color:#999;margin-left:auto;padding-left:8px}",
            /* Mesaje */
            ".zmod_role_messages{list-style:none;margin:0;padding:2px 0}",
            ".mod_editor_message>a{display:block;padding:7px 12px 7px 20px;color:#444;font-size:13px;cursor:pointer;transition:background .15s}",
            ".mod_editor_message>a:hover{background:#eef4ff;color:#1a56db}",
            /* Footer */
            ".copyright_e{padding:6px 12px;font-size:10px;color:#aaa;border-top:1px solid #eee;text-align:center;margin-top:2px}",
            /* Iconita toolbar */
            ".sceditor-button-staff div{background:url('" + zModConfig.icon + "') center/contain no-repeat !important}"
        ].join("\n");
    }

    function init() {
        if (zModConfig.fontAwesome) {
            injectLink("https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css");
        }
        injectStyle(buildCSS(), "zmod-styles");

        renderExistingBoxes();

        var userLevel = (typeof _userdata !== "undefined") ? _userdata.user_level : 0;
        if (userLevel < 1) return;

        var visibleRoles = zModRoles.filter(function (r) {
            return r.user_levels.indexOf(userLevel) !== -1;
        });
        if (!visibleRoles.length) return;

        injectButton(buildPanel(visibleRoles));
        bindEvents();
    }

    /* Asteapta DOMContentLoaded + window load (pentru SCEditor) */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            window.addEventListener("load", init);
        });
    } else {
        window.addEventListener("load", init);
    }
}());
