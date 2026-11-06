const W = {
  sum: "What changed",
  fc: "Forecast",
  adh: "Adherence pie",
  med: "Medication pie",
  zn: "Action plan zones pie",
  trg: "Trigger pie",
  ano: "Flags",
  dq: "Data notes"
};

const PRE = {
  pulm: ["sum", "fc", "zn", "med", "trg", "ano", "dq"],
  pcp: ["sum", "adh", "zn", "trg", "ano"],
  coord: ["sum", "adh", "ano", "dq"]
};

const on = {};
const $ = (id) => document.getElementById(id);
const appointments = [
  { date: "2026-11-19", time: "3:30 PM", title: "Pulmonology follow-up" },
  { date: "2026-11-26", time: "4:00 PM", title: "Care team check-in" }
];

function donut(el, d, center) {
  const root = d3.select(`#${el}`).html("");
  const svg = root
    .append("svg")
    .attr("viewBox", "-50 -50 100 100")
    .attr("role", "img")
    .attr("aria-label", `${center} summary`);

  const arc = d3.arc().innerRadius(30).outerRadius(48).padAngle(0.025).cornerRadius(2);
  const big = d3.arc().innerRadius(30).outerRadius(50).padAngle(0.025).cornerRadius(2);

  const t = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", "15px")
    .style("font-weight", 700)
    .style("fill", "var(--ink)")
    .text(center);

  svg
    .selectAll("path")
    .data(d3.pie().sort(null).value((x) => x[1])(d))
    .join("path")
    .attr("fill", (x) => x.data[2])
    .attr("d", arc)
    .style("cursor", "pointer")
    .on("mouseenter", function (event, x) {
      d3.select(this).transition().duration(120).attr("d", big);
      t.text(`${x.data[1]}%`);
    })
    .on("mouseleave", function () {
      d3.select(this).transition().duration(120).attr("d", arc);
      t.text(center);
    })
    .transition()
    .duration(700)
    .attrTween("d", function (x) {
      const i = d3.interpolate({ startAngle: x.startAngle, endAngle: x.startAngle, padAngle: x.padAngle }, x);
      return (s) => arc(i(s));
    });

  const ul = root.append("ul");
  d.forEach((x) => {
    ul.append("li").html(`<span class="sw" style="background:${x[2]}"></span>${x[0]} <b>${x[1]}%</b>`);
  });
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

let calendarMonth = new Date();
let selectedDate = new Date();

function renderAgenda() {
  const date = new Date(selectedDate);
  const dateLabel = new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const dayAppointments = appointments.filter((appointment) => appointment.date === dateKey(date));
  const list = $("appointment-list");

  $("agenda-heading").textContent = dateLabel;
  list.replaceChildren();

  if (dayAppointments.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-agenda";
    emptyItem.textContent = "No appointments scheduled.";
    list.appendChild(emptyItem);
    return;
  }

  dayAppointments.forEach((appointment) => {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const title = document.createElement("span");

    time.textContent = appointment.time;
    title.textContent = appointment.title;
    item.append(time, title);
    list.appendChild(item);
  });
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(year, month, 1 - firstDay.getDay());
  const dayCount = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((firstDay.getDay() + dayCount) / 7);
  const todayKey = dateKey(new Date());
  const days = $("calendar-days");

  $("calendar-month").textContent = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric"
  }).format(calendarMonth);
  days.replaceChildren();

  for (let week = 0; week < weekCount; week += 1) {
    const row = document.createElement("tr");

    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + week * 7 + weekday);

      const cell = document.createElement("td");
      const button = document.createElement("button");
      const number = document.createElement("span");
      const key = dateKey(date);
      const dayAppointments = appointments.filter((appointment) => appointment.date === key);
      const dateLabel = new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(date);

      button.type = "button";
      button.className = "calendar-day";
      button.setAttribute("aria-label", dayAppointments.length
        ? `${dateLabel}, ${dayAppointments.length} appointment${dayAppointments.length === 1 ? "" : "s"}`
        : dateLabel);
      button.setAttribute("aria-pressed", String(key === dateKey(selectedDate)));

      if (date.getMonth() !== month) {
        button.classList.add("other-month");
      }
      if (key === todayKey) {
        button.classList.add("today");
      }

      number.className = "day-number";
      number.textContent = date.getDate();
      button.appendChild(number);

      if (dayAppointments.length > 0) {
        const marker = document.createElement("span");
        marker.className = "event-marker";
        marker.textContent = `${dayAppointments.length} appointment${dayAppointments.length === 1 ? "" : "s"}`;
        button.appendChild(marker);
      }

      button.addEventListener("click", () => {
        selectedDate = new Date(date);
        calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        renderCalendar();
        renderAgenda();
      });

      cell.appendChild(button);
      row.appendChild(cell);
    }

    days.appendChild(row);
  }

  renderAgenda();
}

const tabs = Array.from(document.querySelectorAll('[role="tab"]'));

function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
    $(item.getAttribute("aria-controls")).hidden = !selected;
  });
  tab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;

    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    activateTab(tabs[nextIndex]);
  });
});

$("previous-month").addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  selectedDate = new Date(calendarMonth);
  renderCalendar();
});

$("next-month").addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  selectedDate = new Date(calendarMonth);
  renderCalendar();
});

function getMedicationHistory() {
  const history = [];
  const today = new Date();
  const lastRecordedDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  for (let day = 179; day >= 0; day -= 1) {
    const date = new Date(lastRecordedDay);
    date.setDate(lastRecordedDay.getDate() - day);

    for (let dose = 0; dose < 2; dose += 1) {
      const offset = Math.round(
        8 + 24 * Math.sin((day + dose * 0.4) * 0.63) + 13 * Math.cos(day * 0.19 + dose)
      );
      history.push({ date, offset, status: offset > 30 ? "late" : "onTime" });
    }
  }

  return history;
}

function renderAdherenceBars(history, period) {
  const svg = d3.select("#adherence-bars").html("");
  const width = 640;
  const height = 270;
  const margin = { top: 12, right: 16, bottom: 42, left: 44 };
  const records = period === "week" ? history.slice(-56) : history;
  const periods = new Map();

  if (period === "week") {
    for (let week = 0; week < 4; week += 1) {
      const start = new Date(records[week * 14].date);
      const end = new Date(records[Math.min((week + 1) * 14 - 1, records.length - 1)].date);
      const label = `${d3.timeFormat("%b %d")(start)}–${d3.timeFormat("%d")(end)}`;
      periods.set(String(week), { label, onTime: 0, late: 0 });
    }

    records.forEach((record, index) => {
      const key = String(Math.floor(index / 14));
      periods.get(key)[record.status] += 1;
    });
  } else {
    const today = new Date();
    const firstMonth = new Date(today.getFullYear(), today.getMonth() - 5, 1);

    for (let month = 0; month < 6; month += 1) {
      const date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + month, 1);
      periods.set(dateKey(date).slice(0, 7), {
        label: d3.timeFormat("%b %y")(date),
        onTime: 0,
        late: 0
      });
    }

    records.forEach((record) => {
      const key = dateKey(record.date).slice(0, 7);
      const counts = periods.get(key);
      if (counts) {
        counts[record.status] += 1;
      }
    });
  }

  const data = Array.from(periods.values());
  const keys = Array.from(periods.keys());
  const maxCount = d3.max(data, (item) => item.onTime + item.late) || 1;
  const x = d3.scaleBand(keys, [margin.left, width - margin.right]).padding(0.28);
  const y = d3.scaleLinear([0, Math.ceil(maxCount / 10) * 10], [height - margin.bottom, margin.top]);
  const series = d3.stack().keys(["late", "onTime"])(data);

  svg.attr("viewBox", `0 0 ${width} ${height}`);
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat((key) => periods.get(key).label).tickSizeOuter(0));
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d")).tickSizeOuter(0));

  svg
    .selectAll(".bar-series")
    .data(series)
    .join("g")
    .attr("class", "bar-series")
    .attr("fill", (item) => (item.key === "late" ? "var(--b)" : "var(--d)"))
    .selectAll("rect")
    .data((item) => item)
    .join("rect")
    .attr("x", (item, index) => x(keys[index]))
    .attr("y", (item) => y(item[1]))
    .attr("height", (item) => Math.max(0, y(item[0]) - y(item[1])))
    .attr("width", x.bandwidth())
    .append("title")
    .text((item, index, nodes) => {
      const layer = d3.select(nodes[index].parentNode.parentNode).datum().key;
      return `${periods.get(keys[index]).label}: ${item.data[layer]} ${layer === "onTime" ? "on-time" : "late"} doses`;
    });
}

function renderOffsetTrend(history, period) {
  const svg = d3.select("#offset-trend").html("");
  const width = 640;
  const height = 250;
  const margin = { top: 14, right: 16, bottom: 42, left: 48 };
  const records = period === "week" ? history.slice(-56) : history;
  const byDay = d3.rollups(
    records,
    (doses) => d3.mean(doses, (dose) => dose.offset),
    (dose) => dateKey(dose.date)
  )
    .map(([key, offset]) => ({ date: new Date(`${key}T12:00:00`), offset }))
    .sort((a, b) => a.date - b.date);
  const extent = d3.extent(byDay, (item) => item.offset);
  const yMin = Math.min(-30, Math.floor(extent[0] / 10) * 10);
  const yMax = Math.max(50, Math.ceil(extent[1] / 10) * 10);
  const x = d3.scaleTime([byDay[0].date, byDay[byDay.length - 1].date], [margin.left, width - margin.right]);
  const y = d3.scaleLinear([yMin, yMax], [height - margin.bottom, margin.top]);

  svg.attr("viewBox", `0 0 ${width} ${height}`);
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(period === "week" ? 5 : 6).tickFormat(d3.timeFormat("%b %d")).tickSizeOuter(0));
  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat((value) => `${value} min`).tickSizeOuter(0));
  svg
    .append("line")
    .attr("class", "offset-zero")
    .attr("x1", margin.left)
    .attr("x2", width - margin.right)
    .attr("y1", y(0))
    .attr("y2", y(0));
  svg
    .append("path")
    .datum(byDay)
    .attr("class", "offset-line")
    .attr("d", d3.line().curve(d3.curveMonotoneX).x((item) => x(item.date)).y((item) => y(item.offset)));
  svg
    .selectAll(".offset-point")
    .data(byDay)
    .join("circle")
    .attr("class", "offset-point")
    .attr("cx", (item) => x(item.date))
    .attr("cy", (item) => y(item.offset))
    .attr("r", period === "week" ? 3 : 1.8)
    .append("title")
    .text((item) => `${d3.timeFormat("%b %d")(item.date)}: ${Math.round(item.offset)} minutes`);
}

function renderAdherenceCharts() {
  const period = $("adherence-period").value;
  const history = getMedicationHistory();

  renderAdherenceBars(history, period);
  renderOffsetTrend(history, period);
}

function series() {
  const a = [];
  const isFEV1 = $("met").value === "fev1";

  for (let i = 0; i < 30; i += 1) {
    const v = 86 - Math.max(0, i - 20) * 1.5 + Math.sin(i * 1.7) * 3;
    a.push(isFEV1 ? v * 0.97 - 2 : v);
  }

  return a;
}

function fit(y) {
  const n = y.length;
  const mx = (n - 1) / 2;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let nu = 0;
  let de = 0;

  y.forEach((v, i) => {
    nu += (i - mx) * (v - my);
    de += (i - mx) * (i - mx);
  });

  const m = nu / de;

  return { m, b: my - m * mx };
}

function draw() {
  const w = +$("win").value;
  const h = +$("hor").value;
  const y = series().slice(-w);
  const n = y.length;
  const f = fit(y.slice(-7));
  const k = Math.min(7, n);

  const act = y.map((v, i) => ({ d: i - (n - 1), v }));
  const fc = d3.range(0, h + 1).map((j) => {
    const v = f.m * (k - 1 + j) + f.b;
    const e = 3 + 0.7 * j;
    return { d: j, v, lo: v - e, hi: v + e };
  });

  const W = 420;
  const H = 190;
  const m = { l: 30, r: 10, t: 12, b: 24 };

  const x = d3.scaleLinear([-(n - 1), h], [m.l, W - m.r]);
  const yy = d3.scaleLinear([50, 95], [H - m.b, m.t]);

  const svg = d3.select("#chart").html("");

  svg
    .append("g")
    .attr("transform", `translate(0,${H - m.b})`)
    .call(
      d3.axisBottom(x).ticks(6).tickFormat((d) => (d === 0 ? "today" : `${d > 0 ? "+" : ""}${d}d`))
    );

  svg
    .append("g")
    .attr("transform", `translate(${m.l},0)`)
    .call(d3.axisLeft(yy).ticks(4));

  svg
    .append("line")
    .attr("x1", m.l)
    .attr("x2", W - m.r)
    .attr("y1", yy(70))
    .attr("y2", yy(70))
    .attr("stroke", "var(--c)")
    .attr("stroke-dasharray", "3 3");

  svg
    .append("text")
    .attr("x", m.l + 4)
    .attr("y", yy(70) - 4)
    .text("action zone below 70%");

  svg
    .append("path")
    .datum(fc)
    .attr("fill", "var(--c)")
    .attr("opacity", 0.16)
    .attr(
      "d",
      d3
        .area()
        .x((d) => x(d.d))
        .y0((d) => yy(d.lo))
        .y1((d) => yy(d.hi))
    );

  svg
    .append("path")
    .datum(fc)
    .attr("fill", "none")
    .attr("stroke", "var(--c)")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "5 4")
    .attr(
      "d",
      d3
        .line()
        .x((d) => x(d.d))
        .y((d) => yy(d.v))
    );

  const line = svg
    .append("path")
    .datum(act)
    .attr("fill", "none")
    .attr("stroke", "var(--a)")
    .attr("stroke-width", 2.5)
    .attr(
      "d",
      d3
        .line()
        .curve(d3.curveMonotoneX)
        .x((d) => x(d.d))
        .y((d) => yy(d.v))
    );

  const L = line.node().getTotalLength();
  line.attr("stroke-dasharray", `${L} ${L}`).attr("stroke-dashoffset", L).transition().duration(800).attr("stroke-dashoffset", 0);

  const dot = svg.append("circle").attr("r", 4).attr("fill", "var(--ink)").style("display", "none");
  const rd = svg.append("text").attr("x", W - m.r).attr("y", 8).attr("text-anchor", "end").style("fill", "var(--ink)");
  const all = act.concat(fc.slice(1));

  svg
    .append("rect")
    .attr("x", m.l)
    .attr("y", m.t)
    .attr("width", W - m.l - m.r)
    .attr("height", H - m.t - m.b)
    .attr("fill", "transparent")
    .on("mousemove", function (event) {
      const d0 = x.invert(d3.pointer(event)[0]);
      const p = d3.least(all, (d) => Math.abs(d.d - d0));

      dot.style("display", null).attr("cx", x(p.d)).attr("cy", yy(p.v)).attr("fill", p.d > 0 ? "var(--c)" : "var(--a)");
      rd.text(`${p.d > 0 ? `Forecast +${p.d}d: ` : p.d === 0 ? "Today: " : `${p.d}d: `}${Math.round(p.v)}%`);
    })
    .on("mouseleave", function () {
      dot.style("display", "none");
      rd.text("");
    });

  const lv = Math.round(fc[h].v);
  const r = lv < 70 ? ["High", "var(--c)"] : lv < 80 ? ["Moderate", "var(--b)"] : ["Low", "var(--d)"];

  $("rn").textContent = `${lv}%`;
  $("rp").textContent = `${r[0]} risk`;
  $("rp").style.background = r[1];
  $("rt").textContent = `Projected ${$("met").value === "fev1" ? "FEV1" : "peak flow"} in ${h} days, from the last 7 days of readings.`;
}

function show() {
  document.querySelectorAll("[data-w]").forEach((c) => {
    c.classList.toggle("hide", !on[c.dataset.w]);
  });
}

function preset() {
  const p = PRE[$("spec").value];

  Object.keys(W).forEach((k) => {
    on[k] = p.indexOf(k) > -1;
    $("c_" + k).checked = on[k];
  });

  show();
}

Object.keys(W).forEach((k) => {
  const l = document.createElement("label");
  l.innerHTML = `<input type="checkbox" id="c_${k}"> ${W[k]}`;
  $("tog").appendChild(l);
  l.firstChild.onchange = (e) => {
    on[k] = e.target.checked;
    show();
  };
});

$("spec").onchange = preset;
$("met").onchange = draw;
$("win").onchange = draw;
$("hor").onchange = draw;
$("adherence-period").onchange = renderAdherenceCharts;

renderCalendar();
renderAdherenceCharts();

donut("p1", [["On time", 62, "var(--d)"], ["Late", 14, "var(--b)"], ["Missed", 24, "var(--c)"]], "62%");
donut("p2", [["Controller", 68, "var(--a)"], ["Rescue", 32, "var(--c)"]], "32%");
donut("p3", [["Exercise", 34, "var(--a)"], ["Cold or illness", 28, "var(--e)"], ["Pollen", 22, "var(--b)"], ["Smoke", 10, "var(--c)"], ["Unknown", 6, "var(--mut)"]], "5");
donut("p4", [["Green", 71, "var(--d)"], ["Yellow", 22, "var(--b)"], ["Red", 7, "var(--c)"]], "28 days");

preset();
draw();