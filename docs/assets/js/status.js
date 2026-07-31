/**
 * FreeNode · 状态仪表盘 — Chart.js 渲染
 * 替代手工 SVG 绘制，利用 Chart.js 提供：
 * - 折线图（节点总数 / 存活率）
 * - 横向条形图（失败原因 / 区域分布）
 * - 响应式 / tooltip / 动画
 */
(function () {
  "use strict";

  function getData() {
    var el = document.getElementById("status-data");
    if (!el) return null;
    try { return JSON.parse(el.textContent); }
    catch (e) { console.warn("[status] parse error", e); return null; }
  }

  var commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    }
  };

  var charts = {};

  function destroyAll() {
    Object.keys(charts).forEach(function (k) {
      if (charts[k]) { charts[k].destroy(); charts[k] = null; }
    });
  }

  function renderLineChart(canvasId, points, yLabel) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !points || points.length < 2) return;

    var ctx = canvas.getContext("2d");
    charts[canvasId] = new Chart(ctx, {
      type: "line",
      data: {
        labels: points.map(function (p) { return (p.label || "").slice(5); }),
        datasets: [{
          data: points.map(function (p) { return p.value; }),
          borderColor: "#00d9ff",
          backgroundColor: "rgba(0, 217, 255, 0.08)",
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: "#5ee7ff",
          borderWidth: 2,
        }]
      },
      options: Object.assign({}, commonOptions, {
        scales: {
          x: { ticks: { color: "#6e7681", font: { size: 9 } }, grid: { color: "rgba(110,130,180,0.08)" } },
          y: { ticks: { color: "#6e7681", font: { size: 9 } }, grid: { color: "rgba(110,130,180,0.08)" },
               title: { display: !!yLabel, text: yLabel || "", color: "#8b949e" } }
        },
        interaction: { mode: "index", intersect: false },
      })
    });
  }

  function renderBarChart(canvasId, items) {
    var canvas = document.getElementById(canvasId);
    if (!canvas || !items || items.length === 0) return;

    var ctx = canvas.getContext("2d");
    charts[canvasId] = new Chart(ctx, {
      type: "bar",
      data: {
        labels: items.map(function (it) { return it.label; }),
        datasets: [{
          data: items.map(function (it) { return it.value; }),
          backgroundColor: "rgba(0, 217, 255, 0.18)",
          borderColor: "rgba(0, 217, 255, 0.6)",
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: Object.assign({}, commonOptions, {
        indexAxis: "y",
        scales: {
          x: { ticks: { color: "#6e7681", font: { size: 9 } }, grid: { color: "rgba(110,130,180,0.08)" } },
          y: { ticks: { color: "#8b949e", font: { size: 9 }, autoSkip: false, maxTicksLimit: 12 },
               grid: { display: false } }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                var pct = total > 0 ? (ctx.raw / total * 100).toFixed(1) : "0.0";
                return ctx.raw + " (" + pct + "%)";
              }
            }
          }
        }
      })
    });
  }

  function objToItems(obj) {
    if (!obj) return [];
    return Object.keys(obj).map(function (k) {
      return { label: k, value: Number(obj[k]) || 0 };
    }).sort(function (a, b) { return b.value - a.value; });
  }

  function init() {
    var data = getData();
    if (!data) return;

    var hist = (data.trend && data.trend.history) || [];

    if (hist.length < 2) {
      var empty = document.getElementById("trend-empty");
      if (empty) empty.hidden = false;
    } else {
      renderLineChart("trend-nodes-canvas",
        hist.map(function (h) { return { label: h.date, value: Number(h.total_nodes) || 0 }; }),
        "Total");
      renderLineChart("trend-survival-canvas",
        hist.map(function (h) { return { label: h.date, value: Number(h.survival_rate) || 0 }; }),
        "%");
    }

    renderBarChart("failure-reasons-canvas", objToItems(data.failure_reasons));
    renderBarChart("regions-canvas", objToItems(data.regions_distribution).slice(0, 10));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
