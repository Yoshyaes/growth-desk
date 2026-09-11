"use strict";
/* Growth Desk client. Copy, skip, theme, live lint. No posting. */

(function () {
  function post(url, body) {
    return fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body || {})
    }).then(function (r) { return r.json(); });
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve) {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); resolve();
    });
  }

  var product = location.pathname.split("/").filter(Boolean)[0];

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-copy], [data-copy-editor], [data-skip], #theme");
    if (!t) return;

    if (t.id === "theme") {
      var next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem("gd-theme", next); } catch (err) {}
      return;
    }

    if (t.hasAttribute("data-copy")) {
      var card = t.closest("[data-move]");
      var draft = card.querySelector("[data-draft]").textContent;
      copyText(draft).then(function () {
        t.textContent = "Copied";
        t.classList.add("copied");
        card.classList.add("is-copied");
        post("/api/move/" + product + "/" + t.getAttribute("data-copy"), { state: "copied" });
      });
      return;
    }

    if (t.hasAttribute("data-copy-editor")) {
      var ta = document.getElementById("draft");
      copyText(ta.value).then(function () {
        t.textContent = "Copied";
        t.classList.add("copied");
        post("/api/move/" + product + "/" + t.getAttribute("data-copy-editor"), {
          state: "copied", draft: ta.value
        });
      });
      return;
    }

    if (t.hasAttribute("data-skip")) {
      var id = t.getAttribute("data-skip");
      post("/api/move/" + product + "/" + id, { state: "skipped" }).then(function () {
        var c = document.querySelector('[data-move="' + id + '"]');
        if (c) c.classList.add("is-skipped");
        t.textContent = "Skipped";
        t.disabled = true;
      });
      return;
    }
  });

  /* live lint in the editor */
  var editor = document.getElementById("draft");
  if (editor) {
    var timer = null;
    var chars = document.getElementById("chars");
    editor.addEventListener("input", function () {
      if (chars) chars.textContent = editor.value.length + " characters";
      clearTimeout(timer);
      timer = setTimeout(function () {
        post("/api/lint", { text: editor.value }).then(function (r) {
          var rows = document.getElementById("lint");
          if (!rows) return;
          rows.innerHTML = r.summary.map(function (s) {
            var ex = "";
            for (var i = 0; i < r.hits.length; i++) {
              if (r.hits[i].rule === s.rule) { ex = r.hits[i].context; break; }
            }
            return '<div class="lintrow ' + (s.count ? "hit" : "") + '">' +
              '<span class="dot"></span><span>' + s.label + "</span>" +
              '<span class="count">' + s.count + (s.total ? " of " + s.total : "") + "</span>" +
              '<span class="ctx">' + ex.replace(/</g, "&lt;") + "</span></div>";
          }).join("");
        });
      }, 220);
    });
  }
})();
