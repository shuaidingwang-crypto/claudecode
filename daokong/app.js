import { askJSON, getApiKey, setApiKey, testKey } from "./ai.js";

(function () {
  var KEY = "daokong-v1";
  var DAY = 86400000, CAP = 60;
  var TAGS = [
    { k: "body", n: "身体" }, { k: "people", n: "人" }, { k: "hand", n: "手艺" },
    { k: "home", n: "家" }, { k: "mind", n: "心" }
  ];
  function dayKey(t) { var d = new Date(t); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function startOfToday() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function color(tag) { return css("--t-" + (tag || "none")); }
  function tint(hex, a) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex;
    var v = parseInt(m[1], 16); return "rgba(" + (v >> 16) + "," + ((v >> 8) & 255) + "," + (v & 255) + "," + a + ")";
  }

  function seed() {
    var n = Date.now(), t0 = startOfToday();
    // [days ago, hour, text, tag]; gaps between days are deliberate
    var raw = [
      [0, 9, "早上晒了二十分钟太阳", "body"], [1, 20, "给妈妈回了消息", "people"], [1, 15, "读完《被讨厌的勇气》第三章", "mind"],
      [1, 12, "做了番茄炒蛋", "home"], [3, 16, "整理了书桌", "home"], [3, 10, "河边走了四十分钟", "body"],
      [4, 21, "写了半页日记", "mind"], [6, 14, "陶艺体验课，捏了一个歪碗", "hand"], [6, 19, "和 L 吃了饭", "people"],
      [7, 11, "换了床单", "home"], [9, 9, "做了十分钟拉伸", "body"], [9, 16, "画了一张窗外的速写", "hand"],
      [10, 13, "去菜市场买了菜", "home"], [12, 22, "睡前冥想十分钟", "mind"], [13, 10, "游泳", "body"],
      [13, 18, "给老朋友打了电话", "people"], [14, 15, "修好了阳台的灯", "home"], [16, 11, "做了第一次面包，失败了", "hand"],
      [17, 17, "散步", "body"], [18, 20, "看完一部电影", "mind"], [19, 9, "早起看日出", "body"],
      [21, 14, "清理了衣柜", "home"], [22, 19, "和邻居聊了一会儿", "people"], [23, 10, "第二次面包，成了", "hand"],
      [25, 16, "爬山", "body"], [26, 21, "把想法写成了一页纸", "mind"], [27, 12, "炖了一锅汤", "home"],
      [29, 15, "去图书馆待了一下午", "mind"], [30, 10, "骑车", "body"], [31, 19, "参加了读书会", "people"],
      [33, 14, "缝好了外套扣子", "hand"], [34, 11, "浇花", "home"], [36, 9, "散步", "body"],
      [37, 20, "给姐姐寄了明信片", "people"], [38, 16, "学会了一首吉他和弦", "hand"], [40, 10, "瑜伽", "body"],
      [41, 22, "写了一封不寄出的信", "mind"], [43, 13, "收拾了冰箱", "home"], [44, 15, "在公园坐了一小时", "mind"],
      [46, 10, "游泳", "body"], [47, 18, "帮朋友搬家", "people"], [48, 14, "做了一个木头书签", "hand"],
      [50, 11, "整理了旧照片的一个文件夹", "home"], [51, 9, "散步", "body"], [52, 20, "认真做了一顿晚饭", "home"],
      [54, 16, "画了一张水彩", "hand"], [55, 10, "跑了三公里", "body"], [57, 21, "读完一本小说", "mind"],
      [58, 13, "约了体检", "body"], [60, 18, "和 L 视频", "people"], [61, 15, "拼完一个拼图", "hand"],
      [62, 10, "大扫除", "home"], [64, 9, "散步", "body"], [65, 19, "去看了展", "mind"],
      [66, 12, "做了饺子", "home"], [68, 17, "和家人吃饭", "people"], [69, 10, "游泳", "body"],
      [70, 14, "缝了一个布袋", "hand"], [72, 21, "睡前不看手机", "mind"], [73, 11, "爬山", "body"],
      [74, 15, "收拾了书架", "home"], [76, 20, "给老同事写了感谢", "people"], [77, 9, "散步", "body"],
      [78, 16, "学了一道新菜", "home"], [80, 14, "第一次去陶艺店看了看", "hand"], [81, 10, "早起", "body"],
      [82, 22, "写了日记", "mind"], [84, 13, "晒了被子", "home"], [85, 18, "和朋友散步聊天", "people"],
      [86, 10, "跑步", "body"], [88, 15, "画了速写", "hand"]
    ];
    return {
      dumps: [
        { id: 1, text: "那个对话的回放又来了。写下来，先不想。", t: n - 40 * 60000 },
        { id: 2, text: "想再去陶艺店，这次报个四节的课", t: n - 3 * 3600000 },
        { id: 3, text: "冰箱里的菠菜要吃掉", t: n - 5 * 3600000 },
        { id: 4, text: "要不要把旧照片整理一下", t: n - DAY - 7200000 },
        { id: 5, text: "研究一下指数基金再平衡（其实不急）", t: n - 4 * DAY },
        { id: 6, text: "学日语？", t: n - 6 * DAY }
      ],
      one: { text: "去河边走一圈", day: dayKey(n), t: n },
      done: raw.map(function (r, i) { return { id: 1000 + i, text: r[2], tag: r[3], t: Math.min(n - 60000, t0 - r[0] * DAY + r[1] * 3600000) }; }),
      next: 2000
    };
  }

  function blank() { return { dumps: [], one: null, done: [], next: 1 }; }
  function valid(x) { return x && Array.isArray(x.dumps) && Array.isArray(x.done) && typeof x.next === "number"; }
  var s;
  try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
  if (!valid(s)) s = blank();
  var persistAsked = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    // Ask the browser not to evict our data once there is something worth keeping.
    if (!persistAsked && (s.done.length || s.dumps.length) && navigator.storage && navigator.storage.persist) {
      persistAsked = true; navigator.storage.persist().catch(function () {});
    }
  }

  var $ = function (id) { return document.getElementById(id); };
  var editingId = null, showDays = 5, dropAnim = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  function icon(id) {
    var svg = document.createElementNS(SVGNS, "svg"); svg.setAttribute("class", "i");
    var use = document.createElementNS(SVGNS, "use"); use.setAttribute("href", "#" + id);
    svg.appendChild(use); return svg;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function tagIcon(tag) {
    var t = el("span", "tic"); var c = color(tag);
    t.style.background = tint(c, .22); t.style.color = c;
    t.appendChild(icon("t-" + (tag || "none"))); return t;
  }
  function relDay(t) {
    var diff = Math.round((startOfToday() - new Date(t).setHours(0, 0, 0, 0)) / DAY);
    if (diff <= 0) return "今天";
    if (diff === 1) return "昨天";
    var d = new Date(t), w = "日一二三四五六"[d.getDay()];
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 · 周" + w;
  }

  function addDone(text) {
    var before = s.done.length;
    var item = { id: s.next++, text: text, tag: null, auto: true, pending: true, t: Date.now() };
    s.done.push(item);
    if (!reduce) dropAnim = { start: performance.now() };
    if (Math.floor(s.done.length / 50) > Math.floor(before / 50)) s.milestone = s.done.length;
    classify(item.id, text);
    if (s.done.length % CAP === 0) {
      var n = s.done.length / CAP - 1;
      setTimeout(function () { celebrate(n); }, reduce ? 0 : 900); // let the last pebble land first
    }
    return item;
  }

  /* ---------- auto tagging ---------- */
  // Asks Claude (see ai.js); falls back to keywords when no AI route is set up or the call fails.
  var KEYWORDS = {
    body: /走|跑|游泳|骑|爬山|瑜伽|拉伸|运动|健身|睡|早起|太阳|体检|医|药|散步/,
    people: /妈|爸|姐|哥|弟|妹|朋友|家人|邻居|同事|电话|视频|聊|吃饭|见面|读书会|寄|回了消息/,
    hand: /画|速写|水彩|陶|捏|缝|织|木|面包|吉他|琴|拼图|手工|做了一个/,
    home: /整理|收拾|打扫|扫除|洗|床单|衣柜|冰箱|浇花|做饭|炒|汤|饺子|菜|晒被|修/,
    mind: /读|书|写|日记|冥想|电影|展|图书馆|想法|学/
  };
  function guess(text) {
    for (var k in KEYWORDS) if (KEYWORDS[k].test(text)) return k;
    return null;
  }
  var TAG_SCHEMA = {
    type: "object", additionalProperties: false, required: ["tag"],
    properties: { tag: { type: "string", enum: ["body", "people", "hand", "home", "mind", "none"] } }
  };
  function classify(id, text) {
    askJSON(
      "把一件已经做完的小事归到一个类别。只回 JSON：{\"tag\":\"<类别>\"}。\n" +
      "类别：body（身体：运动、散步、睡眠、晒太阳、看病）、people（人：联系、见面、陪伴、帮忙）、" +
      "hand（手艺：画画、手工、乐器、烘焙、学一门手上的技能）、home（家：家务、整理、做饭、采购、修东西）、" +
      "mind（心：阅读、写作、冥想、看展看电影、独处）。都不合适就用 none。\n事情：" + text,
      TAG_SCHEMA, "low"
    ).then(function (r) {
      if (!r) return guess(text);
      return TAGS.some(function (x) { return x.k === r.tag; }) ? r.tag : null;
    }, function () { return guess(text); }).then(function (tag) {
      var item = s.done.find(function (d) { return d.id === id; });
      if (!item || !item.pending) return; // removed, or changed by hand meanwhile
      item.tag = tag; item.pending = false;
      save(); render();
    });
  }
  function retag(id, tag) {
    var item = s.done.find(function (d) { return d.id === id; });
    if (!item) return;
    item.tag = tag; item.auto = false; item.pending = false;
    editingId = null; save(); render();
  }

  /* ---------- jar ---------- */
  function rand(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function currentJar() {
    var sorted = s.done.slice().sort(function (a, b) { return a.t - b.t; });
    var full = Math.floor(sorted.length / CAP);
    return { full: full, cur: sorted.slice(full * CAP) };
  }
  function chunks() {
    var sorted = s.done.slice().sort(function (a, b) { return a.t - b.t; }), out = [];
    for (var i = 0; i < sorted.length; i += CAP) out.push(sorted.slice(i, i + CAP));
    return out;
  }
  function drawJar() {
    var info = currentJar();
    var finished = paintJar($("jar-canvas"), info.cur, info.full * CAP, true);
    if (finished === false) requestAnimationFrame(drawJar); else dropAnim = null;
  }
  // Paints one jar of pebbles on a canvas; returns false while the drop animation is still running.
  function paintJar(c, cur, full, animate, sealed, lidP) {
    var dpr = window.devicePixelRatio || 1;
    var W = c.clientWidth, H = c.clientHeight;
    if (!W) return true;
    c.width = W * dpr; c.height = H * dpr;
    var g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    full = full / CAP;

    var jw = Math.min(W - 8, 210), jx = (W - jw) / 2, jy = 16, jh = H - 20, r = Math.min(26, jw * 0.15);
    var neck = jw * 0.6, nx = (W - neck) / 2;
    function jarPath() {
      g.beginPath();
      g.moveTo(nx, jy - 6); g.lineTo(nx, jy);
      g.bezierCurveTo(nx, jy + 8, jx, jy + 4, jx, jy + 22);
      g.lineTo(jx, jy + jh - r); g.quadraticCurveTo(jx, jy + jh, jx + r, jy + jh);
      g.lineTo(jx + jw - r, jy + jh); g.quadraticCurveTo(jx + jw, jy + jh, jx + jw, jy + jh - r);
      g.lineTo(jx + jw, jy + 22); g.bezierCurveTo(jx + jw, jy + 4, nx + neck, jy + 8, nx + neck, jy);
      g.lineTo(nx + neck, jy - 6);
    }
    jarPath(); g.closePath(); g.fillStyle = css("--glass"); g.fill();

    var pr = 8.5 * Math.min(1, jw / 200), cols = Math.floor((jw - 10) / (pr * 2)), rowH = pr * 1.72;
    var now = performance.now(), animDone = true, hi = css("--hi");
    g.save(); jarPath(); g.closePath(); g.clip();
    cur.forEach(function (d, i) {
      var row = Math.floor(i / cols), col = i % cols, off = row % 2 ? pr : 0;
      var x = jx + 5 + pr + col * pr * 2 + off - (row % 2 && col === cols - 1 ? pr * 2 : 0);
      x += (rand(i + full * CAP) - 0.5) * 2.2;
      var y = jy + jh - pr - 3 - row * rowH + (rand(i * 3 + 7) - 0.5) * 1.6;
      if (animate && dropAnim && i === cur.length - 1) {
        var p = Math.min(1, (now - dropAnim.start) / 560);
        if (p < 1) animDone = false;
        var ease = 1 - Math.pow(1 - p, 3);
        y = (jy - 12) + (y - (jy - 12)) * ease;
      }
      var rx = pr * (0.9 + rand(i * 5) * 0.12), ry = pr * (0.78 + rand(i * 7) * 0.1), rot = rand(i * 11) * Math.PI;
      g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = color(d.tag); g.fill();
      g.beginPath(); g.ellipse(x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.22, -0.4, 0, Math.PI * 2); g.fillStyle = hi; g.fill();
    });
    g.restore();
    jarPath(); g.strokeStyle = css("--faint"); g.lineWidth = 1.25; g.stroke();
    g.beginPath(); g.moveTo(nx - 4, jy - 6); g.lineTo(nx + neck + 4, jy - 6);
    g.lineCap = "round"; g.lineWidth = 3; g.stroke();
    if (sealed) { // a lid on top; lidP (0..1) lowers it into place
      var e = lidP == null ? 1 : 1 - Math.pow(1 - lidP, 3), ly = jy - 14 - (1 - e) * 28;
      g.globalAlpha = e;
      g.beginPath();
      if (g.roundRect) g.roundRect(nx - 5, ly, neck + 10, 10, 4); else g.rect(nx - 5, ly, neck + 10, 10);
      g.fillStyle = tint(css("--accent"), .5); g.fill();
      g.globalAlpha = 1;
    }

    return animDone;
  }

  /* ---------- jar-full moment ---------- */
  function dayStart(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function celebrate(i) {
    var jar = chunks()[i];
    if (!jar || jar.length < CAP) return;
    var first = jar[0].t, last = jar[jar.length - 1].t;
    var days = Math.round((dayStart(last) - dayStart(first)) / DAY) + 1;
    $("cere-title").textContent = "第 " + (i + 1) + " 罐装满了";
    $("cere-sub").textContent = cnDate(first) + " – " + cnDate(last) + "，" + days + " 天里攒下的 " + jar.length + " 件事";
    var st = $("cere-stats"); st.textContent = "";
    var w = el("div", "stats"); w.appendChild(statsRow(jar, true)); st.appendChild(w);
    $("cere").hidden = false; $("cere-scrim").hidden = false;
    var start = performance.now();
    (function frame() {
      var p = reduce ? 1 : Math.max(0, Math.min(1, (performance.now() - start - 300) / 700));
      paintJar($("cere-jar"), jar, i * CAP, false, true, p);
      if (p < 1 && !$("cere").hidden) requestAnimationFrame(frame);
    })();
    renderPick(i, jar);
    $("cere-done").focus();
  }
  function closeCere() { $("cere").hidden = true; $("cere-scrim").hidden = true; render(); }
  function showPick(box, jar, note) {
    var item = jar.find(function (d) { return d.id === note.id; }) || jar[0];
    box.className = "pick"; box.textContent = "";
    var top = el("div", "pick-top"); top.appendChild(tagIcon(item.tag));
    top.appendChild(el("span", "pick-what", item.text)); box.appendChild(top);
    box.appendChild(el("p", "pick-when", cnDate(item.t)));
    if (note.why) box.appendChild(el("p", "pick-why", note.why));
  }
  function renderPick(i, jar) {
    var box = $("cere-pick"), note = s.jarNotes && s.jarNotes[i];
    if (note) { showPick(box, jar, note); return; }
    box.className = "pick loading"; box.textContent = "正在翻这一罐…";
    pickInteresting(jar).then(function (n) {
      s.jarNotes = s.jarNotes || {}; s.jarNotes[i] = n; save();
      showPick(box, jar, n);
    });
  }
  // Claude picks the most interesting item; without it, prefer "first time / finally worked" moments.
  function fallbackPick(jar) {
    var hit = jar.filter(function (d) { return /第一次|第二次|成了|学会|终于/.test(d.text); });
    if (hit.length) return { id: hit[hit.length - 1].id, why: "以前没做过，或者试了不止一次的事。" };
    var counts = {};
    jar.forEach(function (d) { counts[d.tag] = (counts[d.tag] || 0) + 1; });
    var rare = jar.slice().sort(function (a, b) { return (counts[a.tag] - counts[b.tag]) || (b.text.length - a.text.length); })[0];
    return { id: rare.id, why: "这一罐里不太常出现的一类事。" };
  }
  var PICK_SCHEMA = {
    type: "object", additionalProperties: false, required: ["index", "why"],
    properties: { index: { type: "integer" }, why: { type: "string" } }
  };
  function pickInteresting(jar) {
    var lines = jar.map(function (d, k) { return k + ". " + md(d.t) + " " + d.text; }).join("\n");
    return askJSON(
      "下面是一个人在一段时间里做过的 " + jar.length + " 件小事，按时间排列，每行“编号. 日期 事情”。\n" +
      "挑出最有意思的一件：比如第一次尝试、失败后又试一次、意外或温暖的时刻。不要挑最有成就感的，也不要评价其他事。\n" +
      "只回 JSON：{\"index\": 编号, \"why\": \"一句话说为什么，温和具体，不超过 30 个字，不用感叹号，用“你”称呼\"}\n\n" + lines,
      PICK_SCHEMA, "medium"
    ).then(function (r) {
      var k = r && Number(r.index);
      if (!(k >= 0 && k < jar.length)) return fallbackPick(jar);
      return { id: jar[k].id, why: String(r.why || "").slice(0, 60) };
    }, function () { return fallbackPick(jar); });
  }

  /* ---------- sealed jars ---------- */
  // A bottom sheet: a shelf of sealed jars; tap one to see what's inside.
  var sheetJar = null;
  function md(t) { var d = new Date(t); return (d.getMonth() + 1) + "/" + d.getDate(); }
  function cnDate(t) { var d = new Date(t); return (d.getMonth() + 1) + "月" + d.getDate() + "日"; }
  function openSheet() {
    sheetJar = null;
    $("sheet").hidden = false; $("sheet-scrim").hidden = false;
    renderSheet(); $("sheet-close").focus();
  }
  function closeSheet() {
    $("sheet").hidden = true; $("sheet-scrim").hidden = true;
    $("jar-full").focus();
  }
  // One row of the five categories; with counts=true each shows how many of `items` it holds.
  function statsRow(items, counts) {
    var sh = el("div", "shelf");
    TAGS.forEach(function (t) {
      var sp = el("span"); sp.appendChild(tagIcon(t.k));
      if (counts) sp.appendChild(el("b", null, items.filter(function (d) { return d.tag === t.k; }).length));
      sp.appendChild(document.createTextNode(t.n)); sh.appendChild(sp);
    });
    return sh;
  }
  function renderSheet() {
    var body = $("sheet-body"), full = currentJar().full, all = chunks(), paint = [];
    body.textContent = ""; body.scrollTop = 0;
    $("sheet-back").hidden = sheetJar == null;
    if (sheetJar == null) {
      $("sheet-title").textContent = "罐子架";
      var stats = el("div", "stats");
      var tot = el("p", "stats-total"); tot.appendChild(document.createTextNode(s.done.length));
      tot.appendChild(el("small", null, "件，到现在一共攒下的")); stats.appendChild(tot);
      stats.appendChild(statsRow(s.done, true));
      body.appendChild(stats);
      body.appendChild(el("p", "lead", full ? "每罐 60 件，满了就盖上盖子放到这里。" : "还没有装满的罐子。满 60 件会盖上盖子放到这里。"));
      var grid = el("div", "shelf-grid");
      for (var i = 0; i < full; i++) (function (i) {
        var jar = all[i];
        var b = el("button", "slot");
        b.setAttribute("aria-label", "第 " + (i + 1) + " 罐，" + cnDate(jar[0].t) + "到" + cnDate(jar[jar.length - 1].t) + "，点开看里面");
        var cv = el("canvas"); b.appendChild(cv); paint.push([cv, jar, i, 1]);
        b.appendChild(el("b", null, "第 " + (i + 1) + " 罐"));
        b.appendChild(el("span", null, md(jar[0].t) + " – " + md(jar[jar.length - 1].t)));
        b.addEventListener("click", function () { sheetJar = i; renderSheet(); });
        if (i % 3 === 0) grid.appendChild(el("div", "shelf-row")); // one plank per row of three
        grid.lastChild.appendChild(b);
      })(i);
      body.appendChild(grid);
    } else {
      var jar = all[sheetJar];
      $("sheet-title").textContent = "第 " + (sheetJar + 1) + " 罐";
      var wrap = el("div", "jar-detail");
      var cv = el("canvas"); wrap.appendChild(cv); paint.push([cv, jar, sheetJar, 1]);
      wrap.appendChild(el("p", "meta", cnDate(jar[0].t) + " – " + cnDate(jar[jar.length - 1].t) + " · " + jar.length + " 件"));
      var js = el("div", "stats"); js.appendChild(statsRow(jar, true)); wrap.appendChild(js);
      var note = s.jarNotes && s.jarNotes[sheetJar];
      if (note) {
        wrap.appendChild(el("h3", "cere-h", "这一罐里最有意思的一件"));
        var pk = el("div"); showPick(pk, jar, note); wrap.appendChild(pk);
      }
      body.appendChild(wrap);
      var months = [], byKey = {};
      jar.slice().reverse().forEach(function (d) {
        var dt = new Date(d.t), k = dt.getFullYear() + "-" + dt.getMonth();
        if (!byKey[k]) { byKey[k] = { label: (dt.getFullYear() !== new Date().getFullYear() ? dt.getFullYear() + " 年 " : "") + (dt.getMonth() + 1) + " 月", items: [] }; months.push(byKey[k]); }
        byKey[k].items.push(d);
      });
      months.forEach(function (m) {
        var sec = el("div", "month"); sec.appendChild(el("h3", null, m.label));
        var ul = el("ul");
        m.items.forEach(function (d) {
          var li = el("li"); li.appendChild(tagIcon(d.tag)); li.appendChild(el("span", null, d.text));
          li.appendChild(el("span", "d", new Date(d.t).getDate() + " 日")); ul.appendChild(li);
        });
        sec.appendChild(ul); body.appendChild(sec);
      });
    }
    paint.forEach(function (x) { paintJar(x[0], x[1], x[2] * CAP, false, x[3]); });
  }

  function renderJar() {
    // Main view shows no counts: the pebble colors carry the picture, numbers live in the jar shelf sheet.
    var full = currentJar().full;
    var jt = $("jar-total"); jt.textContent = "";
    jt.appendChild(document.createTextNode("第 " + (full + 1) + " 罐"));
    jt.appendChild(el("small", null, "正在攒"));
    var jf = $("jar-full"); jf.textContent = ""; jf.hidden = false;
    for (var i = 0; i < Math.min(full, 6); i++) jf.appendChild(icon("i-jar"));
    jf.appendChild(document.createTextNode(full ? "装满过 " + full + " 罐" : "罐子架"));
    jf.appendChild(icon("i-right"));

    var sh = $("shelf"); sh.replaceWith(statsRow(s.done, false)); sh = document.querySelector(".jar .shelf"); sh.id = "shelf";
    var m = $("milestone"); m.textContent = "";
    m.hidden = !s.milestone;
    if (s.milestone) { m.appendChild(icon("i-sparkle")); m.appendChild(document.createTextNode("第 " + s.milestone + " 件了。")); }
    drawJar();
    if (!$("sheet").hidden) renderSheet();
  }

  /* ---------- dump / one ---------- */
  var toastTimer = null, toastAction = null;
  // action: {label, fn} for the toast's one button (e.g. 撤销 / 去看看), or null; ic: icon symbol id
  function toast(msg, action, ic) {
    var t = $("toast");
    $("toast-text").textContent = msg;
    $("toast-icon").setAttribute("href", "#" + (ic || "i-sun"));
    toastAction = action || null;
    $("toast-go").hidden = !toastAction;
    if (toastAction) $("toast-go").textContent = toastAction.label;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, action && action.label === "撤销" ? 5000 : 3600);
  }
  function seeTab(v) {
    return { label: "去看看", fn: function () { if (v === "done" && !reduce) dropAnim = { start: performance.now() }; goTab(v); } };
  }
  // Actions on a thought. Each returns nothing; each shows a toast with 撤销 so a mistaken swipe costs nothing.
  function thoughtDone(d, li) {
    var item = addDone(d.text); drop(d, li);
    toast("放进罐子了", { label: "撤销", fn: function () {
      s.done = s.done.filter(function (x) { return x.id !== item.id; });
      s.dumps.push(d); save(); render();
    } }, "i-jar");
  }
  function thoughtToday(d, li) { setOne(d.text); drop(d, li); }
  function thoughtDrop(d, li) {
    drop(d, li);
    toast("放下了，不留记录", { label: "撤销", fn: function () { s.dumps.push(d); save(); render(); } }, "i-trash");
  }

  // Swipe a thought: right = 做了, left = 放下. Vertical scrolling is left to the browser.
  function swipeable(li, body, onRight, onLeft) {
    var x0 = null, y0 = 0, dx = 0, axis = null, pid = null, armed = false;
    function threshold() { return Math.max(72, li.clientWidth * 0.28); }
    function reset() {
      body.style.transition = "transform .2s ease"; body.style.transform = "";
      setTimeout(function () { body.style.transition = ""; li.removeAttribute("data-dir"); li.classList.remove("armed"); }, 200);
    }
    body.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest("button")) return;
      x0 = e.clientX; y0 = e.clientY; dx = 0; axis = null; pid = e.pointerId; armed = false;
    });
    body.addEventListener("pointermove", function (e) {
      if (x0 == null || e.pointerId !== pid) return;
      var mx = e.clientX - x0, my = e.clientY - y0;
      if (axis == null) {
        if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.2) { axis = "x"; try { body.setPointerCapture(pid); } catch (err) {} }
        else if (Math.abs(my) > 10) { axis = "y"; }
      }
      if (axis !== "x") return;
      dx = mx;
      body.style.transform = "translateX(" + dx + "px)";
      li.setAttribute("data-dir", dx > 0 ? "right" : "left");
      var now = Math.abs(dx) > threshold();
      if (now !== armed) { armed = now; li.classList.toggle("armed", armed); if (armed && navigator.vibrate) navigator.vibrate(8); }
    });
    function end() {
      if (x0 == null) return;
      x0 = null;
      if (axis !== "x") return;
      if (armed) {
        body.style.transition = "transform .18s ease-out";
        body.style.transform = "translateX(" + (dx > 0 ? 1 : -1) * li.clientWidth + "px)";
        (dx > 0 ? onRight : onLeft)();
      } else reset();
    }
    body.addEventListener("pointerup", end);
    body.addEventListener("pointercancel", function () { x0 = null; if (axis === "x") reset(); });
  }
  // Pick today's one thing. If one was already picked today, it goes back to the dump list instead of vanishing.
  function setOne(text) {
    var today = dayKey(Date.now());
    var prev = s.one && s.one.day === today && !s.one.done ? s.one.text : null;
    if (prev) s.dumps.push({ id: s.next++, text: prev, t: Date.now() });
    s.one = { text: text, day: today, t: Date.now() };
    save();
    toast(prev ? "今天就它了。「" + prev + "」放回念头里了" : "今天就它了", seeTab("one"), "i-sun");
  }
  function when(t) {
    var mins = Math.round((Date.now() - t) / 60000);
    if (mins < 60) return "刚才";
    if (dayKey(t) === dayKey(Date.now())) return "今天";
    return relDay(t);
  }
  function noteItem(d) {
    var li = el("li", "note");
    var hl = el("span", "swipe-hint l"); hl.appendChild(icon("i-check")); hl.appendChild(document.createTextNode("做了"));
    var hr = el("span", "swipe-hint r"); hr.appendChild(document.createTextNode("放下")); hr.appendChild(icon("i-trash"));
    li.appendChild(hl); li.appendChild(hr);
    var body = el("div", "note-body");
    body.appendChild(el("p", null, d.text));
    var meta = el("div", "meta");
    var acts = el("div", "acts");
    [["i-check", "做了", "做了，放进罐子", "", thoughtDone],
     ["i-sun", "今天做", "今天就做这件", "", thoughtToday],
     ["i-trash", "放下", "放下，彻底不要了", " drop", thoughtDrop]].forEach(function (a) {
      var b = el("button", "chip-act" + a[3]); b.setAttribute("aria-label", a[2]); b.title = a[2];
      b.appendChild(icon(a[0])); b.appendChild(document.createTextNode(a[1]));
      b.addEventListener("click", function () { a[4](d, li); }); acts.appendChild(b);
    });
    meta.appendChild(acts); meta.appendChild(el("span", "when", when(d.t))); body.appendChild(meta);
    li.appendChild(body);
    swipeable(li, body, function () { thoughtDone(d, li); }, function () { thoughtDrop(d, li); });
    return li;
  }
  function drop(d, li) {
    li.classList.add("gone");
    s.dumps = s.dumps.filter(function (x) { return x.id !== d.id; });
    save(); setTimeout(render, reduce ? 0 : 350);
  }

  function render() {
    var now = Date.now(), cutoff = now - 3 * DAY;
    // Yesterday's pick that wasn't done goes back to the thoughts; a done one just clears.
    if (s.one && s.one.day !== dayKey(now)) {
      if (!s.one.done) s.dumps.push({ id: s.next++, text: s.one.text, t: s.one.t || now });
      s.one = null;
    }
    var fresh = s.dumps.filter(function (d) { return d.t >= cutoff; }).sort(function (a, b) { return b.t - a.t; });
    var old = s.dumps.filter(function (d) { return d.t < cutoff; }).sort(function (a, b) { return b.t - a.t; });
    var L = $("dump-list"); L.textContent = "";
    if (!fresh.length) { var e = el("li", "empty"); e.appendChild(icon("i-leaf")); e.appendChild(document.createTextNode("这里现在是空的。")); L.appendChild(e); }
    fresh.forEach(function (d) { L.appendChild(noteItem(d)); });
    var O = $("older-list"); O.textContent = "";
    old.forEach(function (d) { O.appendChild(noteItem(d)); });
    $("older-wrap").hidden = !old.length;

    $("one-badge").hidden = !s.one || !!s.one.done;
    var box = $("one-box"); box.textContent = "";
    if (s.one && s.one.done) {
      var cd = el("div", "one done");
      var labd = el("div", "label"); labd.appendChild(icon("i-check")); labd.appendChild(document.createTextNode("今天这件做完了"));
      cd.appendChild(labd);
      cd.appendChild(el("div", "what", s.one.text));
      var ad = el("div", "acts");
      var again = el("button", "btn quiet"); again.appendChild(icon("i-plus")); again.appendChild(document.createTextNode("再选一件"));
      again.addEventListener("click", function () { s.one = null; save(); render(); });
      var see = el("button", "btn quiet"); see.appendChild(icon("i-jar")); see.appendChild(document.createTextNode("看看罐子"));
      see.addEventListener("click", function () { if (!reduce) dropAnim = { start: performance.now() }; goTab("done"); });
      ad.appendChild(see); ad.appendChild(again); cd.appendChild(ad); box.appendChild(cd);
      box.appendChild(el("p", "hint sub-hint", "已经放进罐子里了。今天到这里就很好。"));
    } else if (s.one) {
      var c = el("div", "one");
      var lab = el("div", "label"); lab.appendChild(icon("i-sun")); lab.appendChild(document.createTextNode("今天想做的一件事"));
      c.appendChild(lab);
      c.appendChild(el("div", "what", s.one.text));
      var a = el("div", "acts");
      var ok = el("button", "btn"); ok.appendChild(icon("i-check")); ok.appendChild(document.createTextNode("做了，放进罐子"));
      ok.addEventListener("click", function () {
        addDone(s.one.text); s.one.done = true; save(); render();
        toast("放进罐子了", seeTab("done"), "i-jar");
      });
      var no = el("button", "btn quiet"); no.appendChild(icon("i-undo")); no.appendChild(document.createTextNode("今天不做了"));
      no.addEventListener("click", function () {
        s.dumps.push({ id: s.next++, text: s.one.text, t: Date.now() }); s.one = null; save(); render();
        toast("放回念头里了，改天再挑", seeTab("dump"), "i-undo");
      });
      // 放下: gone for good, same as 放下 on a thought; no record anywhere
      var away = el("button", "btn quiet"); away.appendChild(icon("i-trash")); away.appendChild(document.createTextNode("放下"));
      away.addEventListener("click", function () {
        var was = s.one; s.one = null; save(); render();
        toast("放下了，不留记录", { label: "撤销", fn: function () { s.one = was; save(); render(); } }, "i-trash");
      });
      a.appendChild(ok); a.appendChild(no); a.appendChild(away); c.appendChild(a); box.appendChild(c);
      var legend = el("dl", "legend");
      [["i-undo", "今天不做了", "放回「倒出来」，改天再挑。"], ["i-trash", "放下", "彻底不要了，不留记录。"], ["i-sun", "都不点", "明天它会自己回到「倒出来」。"]].forEach(function (r) {
        var dt = el("dt"); dt.appendChild(icon(r[0])); dt.appendChild(document.createTextNode(r[1]));
        legend.appendChild(dt); legend.appendChild(el("dd", null, r[2]));
      });
      box.appendChild(legend);
    } else {
      var em = el("p", "empty"); em.appendChild(icon("i-leaf")); em.appendChild(document.createTextNode("今天没有选。这也完全可以。"));
      box.appendChild(em);
      var f = el("div", "composer");
      var i = el("input"); i.type = "text"; i.id = "one-in"; i.placeholder = "想选一件的话，写在这里";
      var gbtn = el("button", "send"); gbtn.setAttribute("aria-label", "就它"); gbtn.appendChild(icon("i-check"));
      gbtn.addEventListener("click", function () { var v = i.value.trim(); if (!v) return; setOne(v); render(); });
      i.addEventListener("keydown", function (e) { if (e.key === "Enter") gbtn.click(); });
      f.appendChild(i); f.appendChild(gbtn); box.appendChild(f);
      box.appendChild(el("p", "hint sub-hint", "也可以从「倒出来」里点太阳图标挑一件。"));
    }

    var D = $("done-list"); D.textContent = "";
    var groups = [], map = {};
    s.done.slice().sort(function (a, b) { return b.t - a.t; }).forEach(function (d) {
      var k = dayKey(d.t);
      if (!map[k]) { map[k] = { t: d.t, items: [] }; groups.push(map[k]); }
      map[k].items.push(d);
    });
    if (!groups.length) D.appendChild(el("p", "empty", "罐子还是空的。做了什么小事都可以放进来。"));
    groups.slice(0, showDays).forEach(function (g) {
      var sec = el("div", "day"); sec.appendChild(el("h3", null, relDay(g.t)));
      var ul = el("ul");
      g.items.forEach(function (d) {
        var li = el("li");
        var tb = el("button", "tic"); var c = color(d.tag);
        tb.style.background = tint(c, .22); tb.style.color = c;
        tb.appendChild(icon("t-" + (d.tag || "none")));
        if (d.pending) tb.classList.add("pending");
        var name = (TAGS.find(function (x) { return x.k === d.tag; }) || { n: "未分类" }).n;
        tb.setAttribute("aria-label", (d.pending ? "正在分类" : "分类：" + name) + "，点一下修改");
        tb.title = d.pending ? "正在分类…" : name + (d.auto ? "（自动）" : "");
        tb.setAttribute("aria-expanded", editingId === d.id ? "true" : "false");
        tb.addEventListener("click", function () { editingId = editingId === d.id ? null : d.id; render(); });
        li.appendChild(tb); li.appendChild(el("span", null, d.text)); ul.appendChild(li);
        if (editingId === d.id) {
          var row = el("li", "retag");
          TAGS.concat([{ k: null, n: "不分类" }]).forEach(function (t) {
            var b = el("button"); b.setAttribute("aria-pressed", d.tag === t.k ? "true" : "false");
            var ic = icon("t-" + (t.k || "none")); ic.style.color = color(t.k);
            b.appendChild(ic); b.appendChild(document.createTextNode(t.n));
            b.addEventListener("click", function () { retag(d.id, t.k); });
            row.appendChild(b);
          });
          ul.appendChild(row);
        }
      });
      sec.appendChild(ul); D.appendChild(sec);
    });
    $("more").hidden = groups.length <= showDays;

    renderJar();
    save();
  }

  /* ---------- controls ---------- */
  $("dump-go").addEventListener("click", function () {
    var v = $("dump-in").value.trim(); if (!v) return;
    s.dumps.push({ id: s.next++, text: v, t: Date.now() }); $("dump-in").value = ""; render();
  });
  $("dump-in").addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) $("dump-go").click(); });
  $("done-go").addEventListener("click", function () {
    var v = $("done-in").value.trim(); if (!v) return;
    addDone(v); $("done-in").value = ""; render();
  });
  $("done-in").addEventListener("keydown", function (e) { if (e.key === "Enter") $("done-go").click(); });
  $("more").addEventListener("click", function () { showDays += 7; render(); });
  $("jar-full").addEventListener("click", openSheet);
  $("sheet-close").addEventListener("click", closeSheet);
  $("sheet-scrim").addEventListener("click", closeSheet);
  $("sheet-back").addEventListener("click", function () { sheetJar = null; renderSheet(); $("sheet-close").focus(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("cere").hidden) closeCere(); else if (!$("set").hidden) closeSettings(); else if (!$("sheet").hidden) closeSheet();
  });
  $("cere-done").addEventListener("click", closeCere);
  $("cere-shelf").addEventListener("click", function () { closeCere(); openSheet(); });
  $("flip-go").addEventListener("click", function () {
    var p = $("flip-text"); p.textContent = "";
    if (!s.done.length) { p.appendChild(el("em", null, "还没有")); p.appendChild(document.createTextNode("做过的事会在这里被翻出来")); return; }
    var d = s.done[Math.floor(Math.random() * s.done.length)];
    p.appendChild(el("em", null, relDay(d.t)));
    p.appendChild(document.createTextNode(d.text));
  });

  /* ---------- settings ---------- */
  var clearArmed = false;
  function openSettings() {
    clearArmed = false; renderSettings();
    $("set").hidden = false; $("set-scrim").hidden = false; $("set-close").focus();
  }
  function closeSettings() { $("set").hidden = true; $("set-scrim").hidden = true; $("open-set").focus(); }
  function renderSettings() {
    var hasKey = !!getApiKey();
    $("key-in").value = "";
    $("key-in").placeholder = hasKey ? "已保存（粘贴新的可以替换）" : "sk-ant-…";
    $("key-status").textContent = hasKey ? "已保存 key。自动分类和挑「最有意思的一件」会用 Claude。" : "没有 key 时，用关键词来猜分类。";
    $("key-del").hidden = !hasKey; $("key-test").hidden = !hasKey;
    $("preview-cere").hidden = !currentJar().full;
    $("load-sample").hidden = !!(s.done.length || s.dumps.length);
    $("clear-label").textContent = clearArmed ? "再点一次，确认清空" : "清空所有数据";
    $("clear-all").classList.toggle("danger", clearArmed);
  }
  $("open-set").addEventListener("click", openSettings);
  $("set-close").addEventListener("click", closeSettings);
  $("set-scrim").addEventListener("click", closeSettings);
  $("key-save").addEventListener("click", function () {
    var v = $("key-in").value.trim(); if (!v) return;
    setApiKey(v); renderSettings();
    $("key-status").textContent = "已保存，正在测试…";
    testKey().then(function (r) { $("key-status").textContent = r === "ok" ? "已保存，测试通过。" : r; });
  });
  $("key-test").addEventListener("click", function () {
    $("key-status").textContent = "正在测试…";
    testKey().then(function (r) { $("key-status").textContent = r === "ok" ? "测试通过。" : r; });
  });
  $("key-del").addEventListener("click", function () { setApiKey(""); renderSettings(); });
  $("export").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify({ app: "daokong", version: 1, exportedAt: new Date().toISOString(), data: s }, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "daokong-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    toast("备份已导出", null, "i-check");
  });
  $("import").addEventListener("click", function () { $("import-file").click(); });
  $("import-file").addEventListener("change", function () {
    var f = this.files && this.files[0]; this.value = "";
    if (!f) return;
    f.text().then(function (txt) {
      var j = JSON.parse(txt), data = j && j.data ? j.data : j;
      if (!valid(data)) throw new Error("bad");
      s = data; save(); closeSettings(); render();
      toast("备份已导入：" + s.done.length + " 件做过的事", null, "i-check");
    }).catch(function () { toast("这个文件读不出来，确认是倒空导出的备份", null, "i-x"); });
  });
  $("load-sample").addEventListener("click", function () { s = seed(); save(); closeSettings(); render(); toast("已载入示例数据，可以在设置里清空", null, "i-check"); });
  $("preview-cere").addEventListener("click", function () { closeSettings(); celebrate(0); });
  $("clear-all").addEventListener("click", function () {
    if (!clearArmed) { clearArmed = true; renderSettings(); return; }
    s = blank(); save(); clearArmed = false; closeSettings(); render();
    toast("已清空", null, "i-trash");
  });

  function goTab(v) {
    document.querySelectorAll(".bar button").forEach(function (x) { x.setAttribute("aria-selected", x.dataset.v === v ? "true" : "false"); });
    ["dump", "one", "done"].forEach(function (k) { $("v-" + k).hidden = k !== v; });
    if (v === "done") drawJar();
  }
  document.querySelectorAll(".bar button").forEach(function (b) {
    b.addEventListener("click", function () { goTab(b.dataset.v); });
  });
  $("toast-go").addEventListener("click", function () {
    $("toast").classList.remove("show");
    var a = toastAction; toastAction = null;
    if (a) a.fn();
  });
  window.addEventListener("resize", drawJar);
  function retheme() { render(); }
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", retheme);
  }
  new MutationObserver(function (list) {
    if (list.some(function (m) { return m.attributeName === "data-theme"; })) retheme();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  var h = new Date().getHours();
  $("greet").textContent = h < 5 ? "这么晚还在转？" : h < 11 ? "早上好" : h < 18 ? "下午好" : "晚上好";
  // Start on 倒出来 for a new user; once there is something in the jar, open on 做过的.
  goTab(s.done.length ? "done" : "dump");
  render();

  // Offline support; not available (and not needed) when the page is hosted inside another app.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
