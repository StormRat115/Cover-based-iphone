var hud = null,
  lastHtml = "";
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function healthColor(pct, dead) {
  return dead
    ? "#666"
    : pct > 55
      ? "#61b86b"
      : pct > 25
        ? "#d6b74d"
        : "#d85b50";
}
function ensureHud() {
  if (hud) return hud;
  var old = document.getElementById("allyHealth");
  if (old) old.style.display = "none";
  var status = document.getElementById("status");
  if (status) status.style.display = "none";
  var hint = document.getElementById("hint");
  if (hint) hint.style.display = "none";
  hud = document.createElement("div");
  hud.id = "squadHealthHud";
  hud.style.cssText =
    "width:190px;max-height:35vh;overflow:auto;padding:8px 9px;color:#e8eee9;font:800 10px system-ui;letter-spacing:.55px;pointer-events:auto";
  document.getElementById("squadCommands").appendChild(hud);
  return hud;
}
function bar(name, label, stats, pct, color, big, dead) {
  var height = big ? 8 : 4,
    margin = big ? "0 0 8px" : "3px 0 6px",
    font = big ? 12 : 9;
  return (
    '<div style="margin:' +
    margin +
    ";opacity:" +
    (dead ? ".42" : "1") +
    '"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:' +
    (big ? 3 : 2) +
    "px;font-size:" +
    font +
    'px"><span style="font-weight:950">' +
    name +
    "</span><span>" +
    label +
    '</span></div><div style="font-size:' +
    (big ? 9 : 8) +
    'px;color:#9fb0b6;margin-bottom:3px">' +
    stats +
    '</div><div style="height:' +
    height +
    "px;background:#303733;border-radius:999px;overflow:hidden;border:" +
    (big ? "1px solid #ffffff24" : "0") +
    '"><div style="height:100%;width:' +
    pct +
    "%;background:" +
    color +
    '"></div></div></div>'
  );
}
export function updateSquadHud() {
  var h = ensureHud(),
    p = window.__battlePlayer,
    allies = window.__battleAllies || [];
  var html =
    '<div style="font-size:8px;color:#8fb7c8;letter-spacing:1.4px;margin-bottom:5px">SQUAD STATUS</div>';
  if (p) {
    var pp = Math.round((clamp(p.hp, 0, p.maxHp) / p.maxHp) * 100),
      pl = p.dead ? "KIA" : p.downed ? "DOWNED" : pp + "%",
      ps =
        "HP " +
        Math.ceil(p.hp) +
        " / " +
        p.maxHp +
        " · DEF " +
        (p.defense || 0);
    html += bar(
      "PLAYER · " + p.weapon.short,
      pl,
      ps,
      pp,
      healthColor(pp, p.dead),
      true,
      p.dead,
    );
  }
  html += allies
    .map(function (a) {
      var pct = Math.round((clamp(a.hp, 0, a.maxHp) / a.maxHp) * 100),
        label = a.dead ? "KIA" : a.downed ? "DOWNED" : pct + "%",
        stats =
          "HP " +
          Math.ceil(a.hp) +
          " / " +
          a.maxHp +
          " · DEF " +
          (a.defense || 0);
      return bar(
        a.name + " · " + a.weapon.short,
        label,
        stats,
        pct,
        healthColor(pct, a.dead),
        false,
        a.dead,
      );
    })
    .join("");
  if (html !== lastHtml) {
    h.innerHTML = html;
    lastHtml = html;
  }
  var old = document.getElementById("allyHealth");
  if (old) old.style.display = "none";
}
