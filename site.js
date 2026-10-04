(function () {
  /* Выбор «что случилось с колесом»: без JS все панели видны, с JS открыта одна. */
  var list = document.getElementById('svc');
  var buttons = [].slice.call(list.querySelectorAll('.svc__b'));
  var panels = buttons.map(function (b) { return document.getElementById(b.getAttribute('aria-controls')); });
  var wide = window.matchMedia('(min-width: 981px)');
  function open(i, scroll) {
    buttons.forEach(function (b, k) {
      var on = k === i;
      b.setAttribute('aria-expanded', on ? 'true' : 'false');
      panels[k].hidden = !on;
    });
    if (scroll && !wide.matches) buttons[i].scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  buttons.forEach(function (b, i) {
    b.addEventListener('click', function () { open(i, true); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = (i + d + buttons.length) % buttons.length;
      buttons[n].focus();
      open(n, false);
    });
  });
  open(0, false);

  /* Запись: дни (пн-сб) и часы 9-18, пересчитываются от текущего времени. */
  var svc = document.getElementById('f-svc');
  var daysEl = document.getElementById('days'), timesEl = document.getElementById('times');
  var state = { day: null, time: null };
  var fmt = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  var now = new Date();
  var days = [];
  for (var k = 0; k < 14 && days.length < 6; k++) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
    if (d.getDay() === 0) continue;                       // воскресенье выходной
    if (k === 0 && now.getHours() >= 18) continue;        // сегодня уже поздно
    days.push(d);
  }
  function chip(label, pressed, onClick, disabled) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = label;
    b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    if (disabled) b.disabled = true;
    b.addEventListener('click', onClick);
    return b;
  }
  function renderTimes() {
    timesEl.innerHTML = '';
    for (var h = 9; h <= 18; h++) {
      (function (h) {
        var label = h + ':00';
        var past = state.day && state.day.toDateString() === now.toDateString() && h <= now.getHours();
        timesEl.appendChild(chip(label, state.time === label, function () { state.time = label; renderTimes(); }, past));
      })(h);
    }
  }
  function renderDays() {
    daysEl.innerHTML = '';
    days.forEach(function (d, i) {
      var label = (d.toDateString() === now.toDateString() ? 'сегодня, ' : '') + fmt.format(d);
      daysEl.appendChild(chip(label, state.day === d, function () { state.day = d; state.time = null; renderDays(); renderTimes(); }));
    });
  }
  if (days.length) { state.day = days[0]; renderDays(); renderTimes(); }

  [].forEach.call(document.querySelectorAll('[data-pick]'), function (a) {
    a.addEventListener('click', function () {
      var v = a.getAttribute('data-pick');
      for (var i = 0; i < svc.options.length; i++) if (svc.options[i].text === v) svc.selectedIndex = i;
    });
  });
  /* при выборе симптома выбранная услуга подставляется и в форму */
  buttons.forEach(function (b, i) {
    b.addEventListener('click', function () {
      var pick = panels[i].querySelector('[data-pick]');
      if (!pick) return;
      var v = pick.getAttribute('data-pick');
      for (var k = 0; k < svc.options.length; k++) if (svc.options[k].text === v) svc.selectedIndex = k;
    });
  });

  var form = document.getElementById('form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tel = form.elements.tel.value.trim();
    if (tel.replace(/\D/g, '').length < 10) {
      form.elements.tel.focus();
      form.elements.tel.setCustomValidity('Введите телефон');
      form.elements.tel.reportValidity();
      form.elements.tel.setCustomValidity('');
      return;
    }
    var when = state.day ? fmt.format(state.day) + (state.time ? ' в ' + state.time : '') : 'в удобное время';
    var t = 'Здравствуйте! Хочу записаться в Полянка Сервис: ' + svc.value + ', ' + when + '. Мой телефон ' + tel + '. Подскажите, пожалуйста, свободно ли это время?';
    window.open('https://wa.me/79654436267?text=' + encodeURIComponent(t), '_blank', 'noopener');
  });
})();
