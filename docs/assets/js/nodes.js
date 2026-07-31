// 节点浏览器:筛选 / 搜索 / 分页
(function () {
  'use strict';

  var PAGE_SIZE = 50;
  var rows = Array.prototype.slice.call(document.querySelectorAll('.node-row'));
  var filtered = rows.slice();

  var protoBtns = document.querySelectorAll('.nodes-toolbar [data-proto]');
  var regionSel = document.getElementById('nodes-region');
  var searchInput = document.getElementById('nodes-search');
  var countEl = document.getElementById('nodes-count');
  var emptyEl = document.getElementById('nodes-empty');
  var pagination = document.getElementById('nodes-pagination');
  var prevBtn = document.getElementById('nodes-prev');
  var nextBtn = document.getElementById('nodes-next');
  var pageInfo = document.getElementById('nodes-page-info');

  var state = { proto: 'all', region: 'all', query: '', page: 1 };

  function applyFilter() {
    var q = state.query.trim().toLowerCase();
    filtered = rows.filter(function (r) {
      if (state.proto !== 'all' && r.dataset.protocol !== state.proto) return false;
      if (state.region !== 'all' && r.dataset.region !== state.region) return false;
      if (q) {
        var name = r.dataset.name || '';
        var server = r.dataset.server || '';
        if (name.indexOf(q) === -1 && server.indexOf(q) === -1) return false;
      }
      return true;
    });
    state.page = 1;
    render();
  }

  function totalPages() {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }

  function render() {
    var total = filtered.length;
    var pages = totalPages();
    if (state.page > pages) state.page = pages;

    var start = (state.page - 1) * PAGE_SIZE;
    var end = start + PAGE_SIZE;

    // 先隐藏所有行
    rows.forEach(function (r) { r.style.display = 'none'; });
    // 显示当前页
    filtered.slice(start, end).forEach(function (r) { r.style.display = ''; });

    countEl.textContent = total;
    emptyEl.hidden = total !== 0;

    var showPager = pages > 1;
    pagination.hidden = !showPager;
    if (showPager) {
      pageInfo.textContent = state.page + ' / ' + pages;
      prevBtn.disabled = state.page <= 1;
      nextBtn.disabled = state.page >= pages;
    }
  }

  // 协议筛选
  protoBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      protoBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.proto = btn.dataset.proto;
      applyFilter();
    });
  });

  // 地区筛选
  regionSel.addEventListener('change', function () {
    state.region = regionSel.value;
    applyFilter();
  });

  // 搜索
  searchInput.addEventListener('input', function () {
    state.query = searchInput.value;
    applyFilter();
  });

  // 分页
  prevBtn.addEventListener('click', function () {
    if (state.page > 1) { state.page--; render(); }
  });
  nextBtn.addEventListener('click', function () {
    if (state.page < totalPages()) { state.page++; render(); }
  });

  // 初始化
  applyFilter();
})();
