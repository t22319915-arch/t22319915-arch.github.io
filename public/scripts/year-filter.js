/**
 * 影音專區「年份篩選器」前端邏輯（純靜態頁，無框架依賴）
 *
 * 搭配 src/pages/media/index.astro 使用：
 *   - #year-filter   年份 <select>
 *   - #archive-list  直播卡片 <ul>（每筆 <li data-year="2024">）
 *   - #archive-empty 無資料提示
 *   - #year-count    筆數顯示
 *
 * 篩選狀態同步到網址 ?year=，支援分享連結。
 */
(function () {
  var select = document.getElementById('year-filter');
  var list = document.getElementById('archive-list');
  var empty = document.getElementById('archive-empty');
  var count = document.getElementById('year-count');
  if (!select || !list) return;

  var items = Array.prototype.slice.call(list.querySelectorAll('li[data-year]'));

  function apply(year, push) {
    var shown = 0;
    items.forEach(function (li) {
      var show = year === 'all' || li.getAttribute('data-year') === year;
      li.style.display = show ? '' : 'none';
      if (show) shown++;
    });
    if (empty) empty.classList.toggle('hidden', shown > 0);
    if (count) count.textContent = '共 ' + shown + ' 支';
    if (push) {
      var url = new URL(window.location.href);
      if (year === 'all') url.searchParams.delete('year');
      else url.searchParams.set('year', year);
      window.history.replaceState(null, '', url.toString());
    }
  }

  var initial = new URL(window.location.href).searchParams.get('year') || 'all';
  if (select.querySelector('option[value="' + initial + '"]')) {
    select.value = initial;
  } else {
    initial = 'all';
  }
  apply(initial, false);
  select.addEventListener('change', function () {
    apply(select.value, true);
  });
})();
