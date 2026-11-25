/* OKC Explorer — Diagnose demo. Data: /okc-diagnose.json. Follow docs/OKC_DIAGNOSE.md to add a problem. */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function logX(ms) {
    if (ms == null || !(ms > 0)) return null;
    var lo = Math.log10(0.001);
    var hi = Math.log10(5);
    var x = (Math.log10(Math.max(ms, 0.001)) - lo) / (hi - lo);
    return Math.min(100, Math.max(0, x * 100));
  }

  function ratio(measured, floor) {
    if (measured == null || floor == null || !(floor > 0) || !(measured > 0)) return null;
    return measured / floor;
  }

  function verdictLabel(v) {
    if (v === "floor") return "FLOOR";
    if (v === "gap") return "GAP";
    return "UNKNOWN";
  }

  var state = {
    data: null,
    problem: "bf16",
    step: "1",
    slice: "stream",
    loadWide: true,
    stages: 3,
    latency: 8,
  };

  function problem() {
    return state.data.problems[state.problem];
  }

  function sliceOf() {
    var p = problem();
    return (p.slices || []).find(function (s) { return s.id === state.slice; }) || p.slices[0];
  }

  function renderPills() {
    var el = document.getElementById("dx-problems");
    if (!el) return;
    var keys = ["bf16", "attn", "moe", "declayer", "prelayer"];
    el.innerHTML = keys.map(function (k) {
      var p = state.data.problems[k];
      var on = k === state.problem;
      return (
        '<button type="button" class="dx-pill' + (on ? " on" : "") + '" data-dx-problem="' + esc(k) + '" aria-pressed="' + (on ? "true" : "false") + '">' +
          esc(p.name) +
        "</button>"
      );
    }).join("");
  }

  function renderSeparate() {
    var p = problem();
    var solving = document.getElementById("dx-solving");
    var notSolving = document.getElementById("dx-not");
    var nums = document.getElementById("dx-nums");
    if (solving) solving.textContent = p.solving;
    if (notSolving) notSolving.textContent = p.notSolving;
    if (!nums) return;
    if (p.measuredMs != null) {
      nums.innerHTML =
        '<span class="from">' + esc(p.measuredMs.toFixed(3)) + '</span>' +
        '<span class="arr">→</span>' +
        '<span class="to">' + esc(p.leaderMs.toFixed(2)) + '</span>' +
        '<span class="unit">ms · v4 → leader</span>';
    } else {
      nums.innerHTML = '<span class="from" style="font-size:22px">Unknown ms</span><span class="unit">pending nsys — floors stay Unknown</span>';
    }
  }

  function renderTrips() {
    var p = problem();
    var t = p.trips || { label: "", before: [], after: [] };
    var label = document.getElementById("dx-trip-label");
    if (label) label.textContent = t.label;
    function track(arr) {
      return (arr || []).map(function (name, i) {
        var cls = "blk";
        if (/load|read|KV|weight|unpack|page|prefetch|store|write/i.test(name)) cls += " load";
        else if (/compute|math|GEMM|attn|overlap/i.test(name)) cls += " comp";
        else if (/wait|dep|norm|residual/i.test(name)) cls += " dep";
        else if (/graph|fused|replay/i.test(name)) cls += " good";
        return '<span class="' + cls + '">' + (i + 1) + " · " + esc(name) + "</span>";
      }).join('<span class="blk-arr">→</span>');
    }
    var before = document.getElementById("dx-sched-before");
    var after = document.getElementById("dx-sched-after");
    if (before) before.innerHTML = track(t.before, "before");
    if (after) after.innerHTML = track(t.after, "after");
  }

  function renderLsu() {
    var row = document.getElementById("dx-lsu");
    var cap = document.getElementById("dx-lsu-cap");
    if (!row) return;
    if (state.loadWide) {
      row.innerHTML = '<i class="lsu wide"></i><i class="lsu wide"></i><i class="lsu wide"></i><i class="lsu wide"></i>';
      if (cap) cap.textContent = "LDG.128 = 16 B per issue · 1 trip fills what 4× LDG.32 would queue.";
    } else {
      row.innerHTML = Array(16).fill('<i class="lsu narrow"></i>').join("");
      if (cap) cap.textContent = "Narrow loads (LD.E → 2×16 B, or LDG.32) fill the LSU queue — lg_throttle.";
    }
    var btn = document.getElementById("dx-load-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", state.loadWide ? "true" : "false");
      btn.textContent = state.loadWide ? "Width · 128-bit" : "Width · narrow";
    }
  }

  function renderWaterline() {
    var p = problem();
    var el = document.getElementById("dx-waterline");
    if (!el) return;
    el.innerHTML = p.slices.map(function (s) {
      var on = s.id === state.slice;
      var fx = logX(s.floorMs);
      var dx = logX(s.designMs);
      var mx = logX(s.measuredMs);
      var r = ratio(s.measuredMs, s.floorMs);
      var bar = "";
      if (mx != null) {
        bar += '<span class="wl-fill meas" style="width:' + mx.toFixed(1) + '%"></span>';
      }
      if (dx != null) {
        bar += '<span class="wl-tick design" style="left:' + dx.toFixed(1) + '%" title="design"></span>';
      }
      if (fx != null) {
        bar += '<span class="wl-tick floor" style="left:' + fx.toFixed(1) + '%" title="physics floor"></span>';
      }
      var chip = r != null && r >= 2 ? (r.toFixed(r >= 10 ? 0 : 1) + "× above floor") : "";
      return (
        '<button type="button" class="wl-row' + (on ? " on" : "") + '" data-dx-slice="' + esc(s.id) + '" data-verdict="' + esc(s.verdict) + '">' +
          '<span class="wl-name"><span class="n">' + esc(s.name) + '</span><span class="s">' + esc(s.bucket) + " · " + esc(s.floorLabel) + " → " + esc(s.measuredLabel) + "</span></span>" +
          '<span class="wl-track">' + bar + "</span>" +
          '<span class="wl-tag ' + esc(s.verdict) + '">' + verdictLabel(s.verdict) + (chip ? " · " + chip : "") + "</span>" +
        "</button>"
      );
    }).join("");
  }

  function renderSlice() {
    var s = sliceOf();
    var box = document.getElementById("dx-slice");
    if (!box || !s) return;
    var stop = s.verdict === "floor";
    box.className = "card dx-slice " + (stop ? "is-floor" : s.verdict === "gap" ? "is-gap" : "is-unk");
    box.innerHTML =
      '<div class="sol-kicker">' + (stop ? "AT THE BOTTOM · NO METHOD" : s.verdict === "gap" ? "GAP · METHOD" : "UNKNOWN · MEASURE FIRST") + "</div>" +
      '<div class="card-title" style="margin:6px 0 8px">' + esc(s.name) + (s.method ? " · " + esc(s.method) : "") + "</div>" +
      '<p class="why" style="margin:0 0 8px">' + esc(s.why) + "</p>" +
      '<p class="d-sub" style="margin:0">' + esc(s.methodNote) + "</p>";
  }

  function renderMethods() {
    var p = problem();
    var el = document.getElementById("dx-methods");
    if (!el) return;
    var gap = p.slices.filter(function (s) { return s.verdict === "gap"; });
    var floor = p.slices.filter(function (s) { return s.verdict === "floor"; });
    var unk = p.slices.filter(function (s) { return s.verdict === "unknown"; });
    function row(s, tag) {
      return (
        '<div class="prow">' +
          '<span class="pk">' + esc(tag) + "</span>" +
          '<span class="pv"><b>' + esc(s.name) + "</b> — " + esc(s.method ? s.method + ": " : "") + esc(s.methodNote) + "</span>" +
        "</div>"
      );
    }
    el.innerHTML =
      (floor.length ? '<div class="do-h">STOP · ALREADY AT THE FLOOR</div>' + floor.map(function (s) { return row(s, "FLOOR"); }).join("") : "") +
      (gap.length ? '<div class="do-h" style="margin-top:12px">THEN OPTIMIZE · GAP ONLY</div>' + gap.map(function (s) { return row(s, s.method || "GAP"); }).join("") : "") +
      (unk.length ? '<div class="do-h" style="margin-top:12px">CANNOT DECLARE A FLOOR</div>' + unk.map(function (s) { return row(s, "NCU"); }).join("") : "");
  }

  function renderOccupancy() {
    var out = document.getElementById("dx-occ-out");
    var cap = document.getElementById("dx-occ-cap");
    var sEl = document.getElementById("dx-occ-s");
    var lEl = document.getElementById("dx-occ-l");
    var sLab = document.getElementById("dx-occ-s-lab");
    var lLab = document.getElementById("dx-occ-l-lab");
    var B = state.loadWide ? 16 : 4;
    var bound = (state.stages * B) / state.latency;
    if (sEl) sEl.value = String(state.stages);
    if (lEl) lEl.value = String(state.latency);
    if (sLab) sLab.textContent = String(state.stages);
    if (lLab) lLab.textContent = String(state.latency);
    if (out) out.textContent = "≤ " + bound.toFixed(2) + " B / latency-unit";
    if (cap) {
      cap.textContent = state.loadWide
        ? "B = 16 B (LDG.128). More stages raise the bound. Occupancy from the API, not totals."
        : "B = 4 B (narrow). Same S and L, lower bound — queue fills, rate drops.";
    }
  }

  function renderReduction() {
    var el = document.getElementById("dx-reduce");
    if (!el || !state.data.playbook) return;
    el.innerHTML = state.data.playbook.reduction.map(function (r) {
      return (
        '<div class="red-card">' +
          '<div class="sk">' + esc(r.latency) + "</div>" +
          '<div class="sn">' + esc(r.name) + "</div>" +
          '<div class="sd">' + esc(r.note) + "</div>" +
        "</div>"
      );
    }).join("");
  }

  function setStep(step) {
    state.step = String(step);
    document.querySelectorAll("[data-dx-step]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-dx-step") === state.step ? "true" : "false");
    });
    document.querySelectorAll("[data-dx-panel]").forEach(function (p) {
      var on = p.getAttribute("data-dx-panel") === state.step;
      p.classList.toggle("is-focus", on);
      p.classList.toggle("dim", !on);
    });
    var focus = document.querySelector('[data-dx-panel="' + state.step + '"]');
    if (focus && state.step !== "1") focus.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function renderAll() {
    renderPills();
    renderSeparate();
    renderTrips();
    renderLsu();
    renderWaterline();
    renderSlice();
    renderMethods();
    renderOccupancy();
    renderReduction();
  }

  function onClick(ev) {
    var t = ev.target;
    if (!(t instanceof Element)) return;
    var prob = t.closest("[data-dx-problem]");
    if (prob) {
      state.problem = prob.getAttribute("data-dx-problem");
      var p = problem();
      state.slice = (p.slices.find(function (s) { return s.verdict === "gap"; }) || p.slices[0]).id;
      renderAll();
      return;
    }
    var step = t.closest("[data-dx-step]");
    if (step) {
      setStep(step.getAttribute("data-dx-step"));
      return;
    }
    var sl = t.closest("[data-dx-slice]");
    if (sl) {
      state.slice = sl.getAttribute("data-dx-slice");
      renderWaterline();
      renderSlice();
      setStep("3");
      return;
    }
    if (t.id === "dx-load-toggle" || t.closest("#dx-load-toggle")) {
      state.loadWide = !state.loadWide;
      renderLsu();
      renderOccupancy();
    }
  }

  function onInput(ev) {
    var t = ev.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (t.id === "dx-occ-s") state.stages = Number(t.value);
    if (t.id === "dx-occ-l") state.latency = Number(t.value);
    renderOccupancy();
  }

  function mount(data) {
    state.data = data;
    var root = document.getElementById("okc-diagnose-root");
    if (!root) return;
    root.addEventListener("click", onClick);
    root.addEventListener("input", onInput);
    renderAll();
    setStep(state.step);
    root.setAttribute("data-ready", "yes");
  }

  global.OKCDiagnose = {
    mount: mount,
    state: function () { return state; },
  };

  function boot() {
    fetch("/okc-diagnose.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("okc-diagnose.json " + r.status);
        return r.json();
      })
      .then(mount)
      .catch(function (err) {
        var root = document.getElementById("okc-diagnose-root");
        if (root) {
          root.setAttribute("data-ready", "error");
          var box = document.getElementById("dx-solving");
          if (box) box.textContent = "Diagnose data failed to load. " + err.message;
        }
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
