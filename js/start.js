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

donut("p1", [["On time", 62, "var(--d)"], ["Late", 14, "var(--b)"], ["Missed", 24, "var(--c)"]], "62%");
donut("p2", [["Controller", 68, "var(--a)"], ["Rescue", 32, "var(--c)"]], "32%");
donut("p3", [["Exercise", 34, "var(--a)"], ["Cold or illness", 28, "var(--e)"], ["Pollen", 22, "var(--b)"], ["Smoke", 10, "var(--c)"], ["Unknown", 6, "var(--mut)"]], "5");
donut("p4", [["Green", 71, "var(--d)"], ["Yellow", 22, "var(--b)"], ["Red", 7, "var(--c)"]], "28 days");

preset();
draw();