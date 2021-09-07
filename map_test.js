import {SvgPlus, Vector} from "./3.5.js"
import {Map} from "./Maps/Map.js"

async function getJSON(url){
  let res = await fetch(url);
  let data = await res.json();
  return data;
}
function datef(date){
  if (date == -1) return "";
  let d = new Date(date);
  d = (""+d).split(" ");
  return `${d[2]} ${d[1]} ${d[3]}`;
}

function riskByPostcode(cbyp, time, recovery = 30){
  let rct = recovery * 1000 * 60 * 60 * 24;
  let rbyp = {};
  for (let pc in cbyp) {
    let cases = cbyp[pc];
    let risk = 0;
    for (let c of cases) {
      if (c < time) {
        let r = 1 - (time - c)/(rct);
        r = r < 0 ? 0 : r;
        risk += r;
      }
    }
    rbyp[pc] = risk;
  }
  return rbyp;
}
function numCasesTo(cases, to) {
  let nct = {};
  for (let pc in cases) {
    let n = 0;
    for (let time of cases[pc]) {
      if (time <= to) {
        n++;
      }
    }
    nct[pc] = n;
  }
  return nct;
}
function caseByPostcode(cases, from = 0) {
  let cbyp = {};
  for (let c of cases) {
    let date = new Date(c.notification_date);
    if (date > from && c.postcode != null) {
      if (!(c.postcode in cbyp)) cbyp[c.postcode] = [];
      cbyp[c.postcode].push(date.getTime());
    }
  }
  return cbyp;
}

function addCasesLabel(label, cases) {
  if (!SvgPlus.is(label, SvgPlus)) label = new SvgPlus(label);
  let c = label.class.split(" ")[1].replace("-", " ");
  label.innerHTML = "";
  label.createChild("text", {
    y: 0,
    x: 0,
    "font-size": 1,
    "text-anchor": "middle"
  }).innerHTML = c;
  label.createChild("text", {
    y: 1.1,
    x: 0,
    "font-size": 1,
    "text-anchor": "middle"
  }).innerHTML = `${cases} cases`
}
function addCasesLabels(labels, cases) {
  for (let label of labels) {
    addCasesLabel(label, cases);
  }
}

let init = true;
function setRisk(cases, now, map) {
  if (init) {
    for (let boundry of map.boundries) {
      boundry.style.setProperty("--risk", 0);
      boundry.style.setProperty("--cases", 0);
    }
  }

  let risk = riskByPostcode(cases, now);
  let numc = numCasesTo(cases, now);
  for (let pc in risk) {
    map.set_pc_props(pc, {style: {
        "--risk": risk[pc],
        "--cases": numc[pc],
      }
    })
    addCasesLabels(map.label_by_pc(pc), numc[pc]);
  }
}

function getTotalCases(cases, pcs = null) {
  let tally = 0;
  for (let pc in cases) {
    if (pcs == null || pc in pcs) {
      tally += cases[pc].length;
    }
  }
  return tally;
}


let caseurl = "https://data.nsw.gov.au/data/api/3/action/datastore_search?resource_id=21304414-1ff1-4243-a5d2-f52778048b29&limit=50000";
let load = async () => {
  let dateNow = new SvgPlus("date-shown");
  dateNow.innerHTML = "Loading Cases...";

  let cases = await getJSON(caseurl);
  let map = new Map("map");
  let postcodes = map.postcodes;
  console.log(postcodes);

  cases = caseByPostcode(cases.result.records, new Date("1 Jun 2021").getTime());

  let today = new Date().getTime();
  let now = new Date("1 Jun 2021").getTime();
  let next = () => {
    dateNow.innerHTML = datef(now);
    setRisk(cases, now, map);
    now += 1000*60*60*24;
    if (now <= today) {
      console.log(now);
      window.requestAnimationFrame(next);
    } else {
      now -= 1000*60*60*24;
      dateNow.innerHTML = `${datef(now)}<i><b>${getTotalCases(cases, postcodes)}</b> Total cases on map</i>`
    }
  }
  window.requestAnimationFrame(next);
}


export {load}
