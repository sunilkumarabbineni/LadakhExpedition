import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { line, curveCatmullRom } from 'd3-shape';
import {
  AlertTriangle, Mountain, ArrowRight, Download,
  Moon, Sun, Map, BedDouble, CalendarDays, Clock
} from 'lucide-react';

// ============================================================================
// ACCURATE GEOGRAPHICAL COORDINATE SYSTEM 
// ============================================================================

const locations = {
  // WESTERN REGION
  srinagar: { lat: 34.0900, lon: 74.7900, name: "Srinagar", type: "stay", icon: "castle", elev: "1,580m", hotel: "New Jersey Houseboat", desc: "Gateway to Ladakh. Regional Capital.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Kashmir" },
  sonamarg: { lat: 34.3015, lon: 75.2925, name: "Sonamarg", type: "poi", icon: "dot", elev: "2,730m", desc: "Alpine valley settlement. Traffic release point.", amenities: ['food', 'network'], region: "Kashmir" },
  zojila: { lat: 34.2789, lon: 75.4719, name: "Zoji La", type: "pass", icon: "alert", elev: "3,528m", desc: "Major Himalayan Pass. Extreme high-altitude bottleneck.", amenities: [], region: "Pass", warning: "Late May Risk: Snowmelt mud-slides. Cross before 11:00." },
  drass: { lat: 34.4280, lon: 75.7510, name: "Drass", type: "poi", icon: "dot", elev: "3,230m", desc: "Cold Desert Plateau. Kargil War Memorial.", amenities: ['food', 'network', 'fuel'], region: "Ladakh" },
  kargil: { lat: 34.5594, lon: 76.1256, name: "Kargil", type: "stay", icon: "castle", elev: "2,680m", hotel: "Karoli Guest House", desc: "Suru Valley Urban Center. Crucial acclimatization halt.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Ladakh" },

  // CENTRAL REGION
  mulbekh: { lat: 34.5830, lon: 76.4500, name: "Mulbekh", type: "poi", icon: "dot", elev: "3,300m", desc: "Maitreya Buddha statue carved in rock.", amenities: ['food'], region: "Ladakh" },
  namikala: { lat: 34.3667, lon: 76.5667, name: "Namika La", type: "pass", icon: "dot", elev: "3,700m", desc: "Minor Mountain Pass. Pillar in the Sky.", amenities: [], region: "Pass" },
  fotula: { lat: 34.2892, lon: 76.7014, name: "Fotu La", type: "pass", icon: "dot", elev: "4,108m", desc: "Highest point on NH-1 highway.", amenities: [], region: "Pass" },
  lamayuru: { lat: 34.2810, lon: 76.7740, name: "Lamayuru", type: "poi", icon: "dot", elev: "3,370m", desc: "Moonland topography. Ancient monastic settlement.", amenities: ['food', 'network'], region: "Ladakh" },
  patharsahib: { lat: 34.6750, lon: 77.0000, name: "Pathar Sahib", type: "poi", icon: "dot", elev: "3,600m", desc: "Sacred Gurudwara. Spiritual site.", amenities: ['food'], region: "Ladakh" },
  magnetichill: { lat: 34.1720, lon: 77.3450, name: "Magnetic Hill", type: "poi", icon: "dot", elev: "3,352m", desc: "Optical Illusion Site.", amenities: [], region: "Ladakh" },
  sangam: { lat: 34.1650, lon: 77.3320, name: "Sangam", type: "poi", icon: "dot", elev: "3,071m", desc: "Indus/Zanskar Confluence.", amenities: ['food'], region: "Ladakh" },
  leh: { lat: 34.1483, lon: 77.5795, name: "Leh", type: "stay", icon: "castle", elev: "3,500m", hotel: "Hotel Walnut Ladakh", desc: "Primary Regional Hub. 48hr acclimatization baseline.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Ladakh", isCriticalHub: true },

  // NORTHERN REGION
  southpullu: { lat: 34.4333, lon: 77.5667, name: "South Pullu", type: "warning", icon: "dot", elev: "4,600m", desc: "Military checkpoint. Border security zone.", amenities: [], region: "Ladakh" },
  khardungla: { lat: 34.2783, lon: 77.6042, name: "Khardung La", type: "star", icon: "star", elev: "5,359m", desc: "Major Mountain Pass. Extreme hypoxia zone.", amenities: ['food'], region: "Pass", warning: "Black ice risk. Safest operational window 09:00-11:00." },
  diskit: { lat: 34.5500, lon: 77.5667, name: "Diskit", type: "poi", icon: "dot", elev: "3,150m", desc: "Valley Settlement. Hand-operated fuel pump available.", amenities: ['fuel', 'food', 'network'], region: "Nubra" },
  nubra: { lat: 34.5833, lon: 77.4667, name: "Nubra Valley", type: "stay", icon: "star", elev: "3,160m", hotel: "Nubra Residency", desc: "High-Altitude Sand Dunes. Essential rest point.", amenities: ['food', 'network'], region: "Nubra" },

  // EASTERN REGION
  agham: { lat: 34.3289, lon: 77.8454, name: "Agham", type: "warning", icon: "alert", elev: "3,100m", desc: "River Corridor Transit. High altitude dirt road.", amenities: [], region: "Ladakh" },
  shyok: { lat: 34.1781, lon: 78.1399, name: "Shyok Village", type: "warning", icon: "alert", elev: "3,750m", desc: "River Settlement. Flash flood hazard.", amenities: ['food'], region: "Ladakh", warning: "13:00 Glacial Rule: Cross early before meltwater swells streams." },
  durbuk: { lat: 34.1206, lon: 78.1034, name: "Durbuk", type: "poi", icon: "dot", elev: "3,840m", desc: "Highway Intersection.", amenities: ['food'], region: "Ladakh" },
  tangste: { lat: 34.0301, lon: 78.1677, name: "Tangtse", type: "poi", icon: "dot", elev: "3,942m", desc: "Historical Trade Halt. Last reliable fuel before Pangong.", amenities: ['fuel', 'food', 'network'], region: "Ladakh" },
  spangmik: { lat: 33.9072, lon: 78.4573, name: "Spangmik", type: "poi", icon: "dot", elev: "4,250m", desc: "Lakefront Settlement.", amenities: ['food'], region: "Pangong" },
  pangong: { lat: 33.8500, lon: 78.5250, name: "Pangong Tso", type: "stay", icon: "alert", elev: "4,225m", hotel: "Skylake Cottage", desc: "Endorheic Soda Lake. Extreme temperature drops.", amenities: ['food'], region: "Pangong", isLakeSite: true },

  // SOUTHERN LAC TRAVERSE
  merak: { lat: 33.7974, lon: 78.5912, name: "Merak", type: "warning", icon: "dot", elev: "4,251m", desc: "Lakefront Settlement. Sandy tracks.", amenities: ['food'], region: "Pangong" },
  chushul: { lat: 33.6000, lon: 78.6667, name: "Chushul", type: "warning", icon: "alert", elev: "4,251m", desc: "Border Settlement. Military checkpoint.", amenities: ['food', 'network'], region: "Ladakh" },
  rezangla: { lat: 33.4188, lon: 78.8494, name: "Rezang La", type: "poi", icon: "dot", elev: "5,500m", desc: "Mountain Pass & 1962 War Memorial.", amenities: [], region: "Ladakh" },
  tsagala: { lat: 33.2500, lon: 78.8500, name: "Tsaga La", type: "pass", icon: "dot", elev: "4,620m", desc: "Border Pass.", amenities: [], region: "Ladakh" },
  lomabridge: { lat: 33.2000, lon: 78.8000, name: "Loma Bridge", type: "warning", icon: "alert", elev: "4,146m", desc: "Indus River Crossing Checkpoint.", amenities: [], region: "Ladakh", isCritical: true },
  hanle: { lat: 32.7794, lon: 78.9642, name: "Hanle (IAO)", type: "stay", icon: "castle", elev: "4,500m", hotel: "Crane Resort", desc: "Astronomical Observatory. Dark sky sanctuary.", amenities: ['food', 'network'], region: "Hanle", isCriticalHub: true, warning: "Fuel Deficit Zone. Carry reserves." },

  // UMLING LA APEX
  phoTila: { lat: 32.7833, lon: 79.1167, name: "Photi La", type: "poi", icon: "dot", elev: "5,524m", desc: "Major Mountain Pass leading to Umling La.", amenities: [], region: "Ladakh" },
  ukdungle: { lat: 32.8833, lon: 79.4167, name: "Ukdungle", type: "warning", icon: "alert", elev: "4,700m", desc: "Deep plains military post.", amenities: [], region: "Ladakh" },
  chisumlebridge: { lat: 32.8167, lon: 79.5000, name: "Chisumle Bridge", type: "warning", icon: "dot", elev: "5,100m", desc: "Final bridge before Umling La ascent.", amenities: [], region: "Ladakh" },
  umlingla: { lat: 32.6930, lon: 79.2700, name: "Umling La", type: "star", icon: "star", elev: "5,799m", desc: "WORLD'S HIGHEST MOTORABLE PASS!", amenities: [], region: "Umling", isEpicPass: true, warning: "Sub-critical O2 (50%). ~66% engine power loss. Max 15 mins." },

  // TSO MORIRI & RUPSHU TRACT
  mahebridge: { lat: 33.2576, lon: 78.5426, name: "Mahe", type: "warning", icon: "alert", elev: "4,197m", desc: "Transit Checkpoint.", amenities: [], region: "Ladakh" },
  puga: { lat: 33.2247, lon: 78.3130, name: "Puga Valley", type: "poi", icon: "dot", elev: "4,400m", desc: "Geothermal Hot Springs.", amenities: ['food'], region: "Ladakh" },
  sumdo: { lat: 33.0667, lon: 78.5000, name: "Sumdo", type: "warning", icon: "dot", elev: "4,400m", desc: "Fork for Tso Moriri route.", amenities: ['food'], region: "Ladakh" },
  tsomoriri: { lat: 32.9167, lon: 78.3000, name: "Tso Moriri", type: "stay", icon: "alert", elev: "4,522m", hotel: "Tsomoriri Camps & Resorts", desc: "High-Altitude Endorheic Lake. Wildlife sanctuary.", amenities: ['food'], region: "Tso Moriri", isLakeSite: true },

  // THE GREAT DESCENT (NH-3)
  tsokar: { lat: 33.3000, lon: 78.0000, name: "Tso Kar", type: "poi", icon: "dot", elev: "4,652m", desc: "High-Altitude Evaporite Basin.", amenities: ['food'], region: "Ladakh", isLakeSite: true },
  debring: { lat: 33.3500, lon: 77.8167, name: "Debring", type: "warning", icon: "dot", elev: "4,700m", desc: "NH-3 Highway Junction.", amenities: [], region: "Ladakh" },
  pang: { lat: 33.1333, lon: 77.7500, name: "Pang", type: "poi", icon: "dot", elev: "4,767m", desc: "Transit Camp on Moore Plains.", amenities: ['food'], region: "Ladakh" },
  lachulungla: { lat: 33.1000, lon: 77.6333, name: "Lachulung La", type: "pass", icon: "dot", elev: "5,065m", desc: "Major Mountain Pass.", amenities: [], region: "Pass" },
  nakeela: { lat: 33.0667, lon: 77.5833, name: "Nakee La", type: "pass", icon: "dot", elev: "4,739m", desc: "Major Mountain Pass.", amenities: [], region: "Pass" },
  gataloops: { lat: 33.0167, lon: 77.5500, name: "Gata Loops", type: "warning", icon: "alert", elev: "4,190m", desc: "Engineered Hairpin Descent (21 Loops).", amenities: [], region: "Ladakh", warning: "Severe thermal stress on braking systems." },
  sarchu: { lat: 32.8900, lon: 77.5300, name: "Sarchu", type: "poi", icon: "dot", elev: "4,420m", desc: "Inter-State Transit Node. Basic medical only.", amenities: ['food'], region: "Lahaul" },
  baralachala: { lat: 32.7500, lon: 77.4167, name: "Baralacha La", type: "pass", icon: "alert", elev: "4,850m", desc: "Major Mountain Pass. Bottleneck.", amenities: [], region: "Pass", warning: "Late May: Partially open, 4x4 & LMV only. Severe snowmelt." },
  surajtaal: { lat: 32.7627, lon: 77.3977, name: "Suraj Taal", type: "poi", icon: "dot", elev: "4,883m", desc: "High-Altitude Glacial Lake.", amenities: [], region: "Lahaul", isLakeSite: true },
  darcha: { lat: 32.6732, lon: 77.2143, name: "Darcha", type: "poi", icon: "dot", elev: "3,360m", desc: "Transit Settlement.", amenities: ['food'], region: "Lahaul" },
  jispa: { lat: 32.6333, lon: 77.1833, name: "Jispa", type: "stay", icon: "castle", elev: "3,310m", hotel: "Lahaul Camps", desc: "Transit Settlement. Green valley.", amenities: ['food', 'fuel'], region: "Lahaul" },

  // LAHAUL VALLEY TO DELHI
  keylong: { lat: 32.5667, lon: 77.0333, name: "Keylong", type: "poi", icon: "dot", elev: "3,080m", desc: "Lahaul Administrative Center.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Lahaul" },
  tandi: { lat: 32.5500, lon: 76.9667, name: "Tandi", type: "warning", icon: "alert", elev: "2,570m", desc: "Chandra-Bhaga Confluence. CRITICAL FUEL POINT!", amenities: ['fuel'], region: "Himachal", isCritical: true },
  sissu: { lat: 32.4833, lon: 77.1167, name: "Sissu", type: "poi", icon: "alert", elev: "3,120m", desc: "Transit Settlement.", amenities: ['food', 'network'], region: "Himachal" },
  ataltunnel: { lat: 32.4012, lon: 77.1483, name: "Atal Tunnel", type: "star", icon: "star", elev: "3,048m", desc: "Trans-Mountain Highway Tunnel. Bypasses Rohtang.", amenities: [], region: "Himachal" },
  manali: { lat: 32.2396, lon: 77.1887, name: "Manali", type: "stay", icon: "castle", elev: "2,050m", hotel: "White Hill Resort", desc: "Kullu Valley Urban Center.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Himachal", isCriticalHub: true },
  delhi: { lat: 28.6139, lon: 77.2090, name: "Delhi", type: "stay", icon: "dot", elev: "218m", desc: "National Capital. Terminus.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "India", hideOnMap: true }
};

// Per-location text placement to avoid overlaps: 'top' | 'bottom' | 'left' | 'right'
const textOffsets = {
  srinagar: 'bottom', sonamarg: 'right', zojila: 'bottom', drass: 'top',
  kargil: 'top', mulbekh: 'right', namikala: 'left', fotula: 'bottom',
  lamayuru: 'left', patharsahib: 'top', magnetichill: 'left', sangam: 'bottom',
  leh: 'bottom', southpullu: 'right', khardungla: 'bottom', diskit: 'left',
  nubra: 'top', agham: 'right', shyok: 'right', durbuk: 'bottom',
  tangste: 'right', spangmik: 'bottom', pangong: 'right',
  merak: 'left', chushul: 'bottom', rezangla: 'top', tsagala: 'right',
  lomabridge: 'right', hanle: 'bottom', phoTila: 'right', ukdungle: 'right',
  chisumlebridge: 'bottom', umlingla: 'bottom',
  mahebridge: 'right', puga: 'left', sumdo: 'right', tsomoriri: 'bottom',
  tsokar: 'top', debring: 'top', pang: 'right', lachulungla: 'top',
  nakeela: 'left', gataloops: 'left', sarchu: 'left',
  baralachala: 'right', surajtaal: 'left', darcha: 'right', jispa: 'bottom',
  keylong: 'top', tandi: 'left', sissu: 'right', ataltunnel: 'left', manali: 'bottom'
};

const getTextPos = (id, iconSize) => {
  const dir = textOffsets[id] || 'bottom';
  const gap = iconSize + 4;
  switch (dir) {
    case 'top': return { x: 0, y: -gap, anchor: 'middle' };
    case 'left': return { x: -gap, y: 3, anchor: 'end' };
    case 'right': return { x: gap, y: 3, anchor: 'start' };
    default: return { x: 0, y: gap + 8, anchor: 'middle' };
  }
};

const itineraryDays = [
  { day: 1, title: "Srinagar Arrival & Acclim.", route: ["srinagar"], color: "#3b82f6", stay: "New Jersey Houseboat", desc: "Arrival and fluid checks. Minimize cardiac load.", distance: 0, duration: "Rest Day", type: "solid" },
  { day: 2, title: "Srinagar to Kargil", route: ["srinagar", "sonamarg", "zojila", "drass", "kargil"], color: "#3b82f6", stay: "Karoli Guest House", desc: "Initial hypoxic transition. Cross Zoji La early.", distance: 204, duration: "7-9 hrs", type: "solid" },
  { day: 3, title: "Kargil to Leh", route: ["kargil", "mulbekh", "namikala", "fotula", "lamayuru", "patharsahib", "magnetichill", "sangam", "leh"], color: "#3b82f6", stay: "Hotel Walnut Ladakh", desc: "Sustained altitude transit over 3,500m.", distance: 216, duration: "6-7 hrs", type: "solid" },
  { day: 4, title: "Leh to Nubra Valley", route: ["leh", "khardungla", "southpullu", "diskit", "nubra"], color: "#3b82f6", stay: "Nubra Residency", desc: "Khardung La ascent. Expect 6hr engagement due to checkpoints.", distance: 130, duration: "5-6 hrs", type: "solid" },
  { day: 5, title: "Nubra to Pangong", route: ["nubra", "agham", "shyok", "durbuk", "tangste", "spangmik", "pangong"], color: "#3b82f6", stay: "Skylake Cottage", desc: "Shyok river route. Strict adherence to 13:00 Glacial Rule.", distance: 180, duration: "6-8 hrs", type: "dashed" },
  { day: 6, title: "Pangong to Hanle", route: ["pangong", "merak", "chushul", "rezangla", "tsagala", "lomabridge", "hanle"], color: "#3b82f6", stay: "Crane Resort", desc: "Sandy tracks, isolation. Fill emergency fuel cans.", distance: 200, duration: "7-8 hrs", type: "dashed" },
  { day: 7, title: "Umling La Excursion", route: ["hanle", "phoTila", "umlingla"], color: "#ec4899", stay: "Crane Resort", desc: "World's highest motorable pass. Sub-critical oxygen limit.", distance: 170, duration: "6-7 hrs", type: "dotted" },
  { day: 8, title: "Hanle to Tso Moriri", route: ["hanle", "mahebridge", "puga", "sumdo", "tsomoriri"], color: "#3b82f6", stay: "Tsomoriri Camps", desc: "Transfer via Puga geothermal zone.", distance: 161, duration: "5-6 hrs", type: "dashed" },
  { day: 9, title: "Tso Moriri to Jispa", route: ["tsomoriri", "sumdo", "tsokar", "debring", "pang", "lachulungla", "nakeela", "gataloops", "sarchu", "baralachala", "surajtaal", "darcha", "jispa"], color: "#3b82f6", stay: "Lahaul Camps", desc: "The Long Day. Grueling sequence of passes and loops.", distance: 235, duration: "11-14 hrs", type: "dashed" },
  { day: 10, title: "Jispa to Manali", route: ["jispa", "keylong", "tandi", "sissu", "ataltunnel", "manali"], color: "#3b82f6", stay: "White Hill Resort", desc: "Final push through Atal Tunnel. Refuel at Tandi.", distance: 140, duration: "5-6 hrs", type: "solid" },
  { day: 11, title: "Manali to Delhi", route: ["manali", "delhi"], color: "#94a3b8", type: "dashed", stay: "Volvo Bus (Overnight)", desc: "Overnight Volvo Bus journey.", distance: 500, duration: "13 hrs", hideOnMap: true }
];

export default function App() {
  const [activeDay, setActiveDay] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(locations.leh);
  const [isDark, setIsDark] = useState(true);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [mapData, setMapData] = useState({ world: null, states: null, roads: null, lakes: null, rivers: null });

  // Transform state for itinerary-driven zoom only
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  const wrapperRef = useRef(null);

  // Dynamic Theme Colors
  const themeColors = useMemo(() => isDark ? {
    ocean: "#09090b",        // Zinc 950 (Darker Void)
    india: "#18181b",        // Zinc 900
    foreign: "#000000",      // Pure Black
    targetStates: "#27272a", // Zinc 800 (Highlight)
    internalBorder: "#52525b", // Zinc 600 (Clear State Divider)
    water: "#1e3a8a",        // Deep Blue
    river: "#2563eb",        // Standard Blue
    externalBorder: "#3f3f46",
    road: "#3f3f46",
    textFill: "white",
    textShadow: "2px 2px 4px rgba(0,0,0,1)"
  } : {
    ocean: "#bae6fd",        // Lighter blue water
    india: "#FFFFFF",        // Pure White
    foreign: "#e5e5e5",      // Neutral Grey
    targetStates: "#FEFEEB", // Pale Yellow
    internalBorder: "#9ca3af", // Slate 400 (Clear State Divider)
    water: "#60a5fa",        // Bright Blue
    river: "#3b82f6",
    externalBorder: "#a1a1aa",
    road: "#cbd5e1",
    textFill: "black",
    textShadow: "1px 1px 2px white"
  }, [isDark]);

  // Load GIS Data
  useEffect(() => {
    Promise.all([
      fetch('/data/world_borders.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/india_states.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/roads.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/lakes.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/rivers.geojson').then(r => r.json()).catch(() => null)
    ]).then(([world, states, roads, lakes, rivers]) => {
      setMapData({ world, states, roads, lakes, rivers });
    });
  }, []);

  const projection = useMemo(() => geoMercator().center([76.5, 33.5]).scale(13000).translate([600, 400]), []);
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const routeLineGenerator = useMemo(() => line()
    .x(id => projection([locations[id].lon, locations[id].lat])[0])
    .y(id => projection([locations[id].lon, locations[id].lat])[1])
    .curve(curveCatmullRom.alpha(0.5)), [projection]);

  // Handle Maps Downloads (High-DPI PNG for print)
  const handleDownloadMap = () => {
    const svgElement = wrapperRef.current.querySelector('svg');
    if (!svgElement) return;

    // 4x scale factor = ~300 DPI at typical screen density — ideal for print
    const SCALE = 4;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const rect = svgElement.getBoundingClientRect();
      canvas.width = rect.width * SCALE;
      canvas.height = rect.height * SCALE;

      // Scale up the canvas context for crisp rendering
      ctx.scale(SCALE, SCALE);
      ctx.fillStyle = isDark ? "#09090b" : "#bae6fd";
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const a = document.createElement("a");
        a.download = `Ladakh_Tactical_Map_Day${activeDay !== null ? activeDay + 1 : 'Full'}_300dpi.png`;
        a.href = URL.createObjectURL(blob);
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  };

  const handleDownloadItinerary = () => {
    let text = "LADAKH EXPEDITION ITINERARY - 11 DAYS (2026 CALIBRATED)\n" + "=".repeat(60) + "\n\n";
    itineraryDays.forEach(day => {
      text += `DAY ${day.day}: ${day.title.toUpperCase()}\n` + `-`.repeat(40) + "\n";
      text += `Duration: ${day.duration} | Distance: ${day.distance}km\nAccommodation: ${day.stay}\n`;
      text += `Operational Directive: ${day.desc}\nRoute: ${day.route.map(id => locations[id].name).join(" → ")}\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = 'Ladakh_Tactical_Itinerary_2026.txt'; a.click();
  };

  // Center/Zoom Map intelligently
  const zoomToBoundingBox = useCallback((pointIds) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pointIds.forEach(id => {
      if (id === 'delhi' || !locations[id]) return;
      const [px, py] = projection([locations[id].lon, locations[id].lat]);
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    });

    if (minX === Infinity) return;
    if (minX === maxX) { minX -= 50; maxX += 50; }
    if (minY === maxY) { minY -= 50; maxY += 50; }

    const VIEWBOX_WIDTH = 1200; const VIEWBOX_HEIGHT = 800;
    const padding = 200;

    const scaleX = VIEWBOX_WIDTH / (maxX - minX + padding);
    const scaleY = VIEWBOX_HEIGHT / (maxY - minY + padding);
    let targetScale = Math.max(0.5, Math.min(Math.min(scaleX, scaleY), 4));

    // On mobile, shift the center UP so it's not hidden by the bottom sheet
    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
    const yOffset = isMobileView ? 120 : 0;

    if (isMobileView) {
      targetScale *= 0.85; // Zoom out a little bit on mobile
    }

    setTransform({
      x: VIEWBOX_WIDTH / 2 - ((minX + maxX) / 2) * targetScale,
      y: VIEWBOX_HEIGHT / 2 - ((minY + maxY) / 2) * targetScale - yOffset,
      scale: targetScale
    });
  }, [projection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeDay !== null) zoomToBoundingBox(itineraryDays[activeDay].route);
      else zoomToBoundingBox(Object.keys(locations).filter(l => l !== 'delhi'));
    }, 50);
    return () => clearTimeout(timer);
  }, [activeDay, zoomToBoundingBox]);

  // Manual zooming disabled. Map zoom is controlled solely by itineraryDays selection.

  return (
    <div className={`flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden font-sans ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-stone-100 text-stone-900'}`}>

      {/* ============================== */}
      {/* MAP CANVAS (D3 DRIVEN)         */}
      {/* ============================== */}
      <div
        ref={wrapperRef}
        className="absolute md:relative inset-0 md:inset-auto md:w-[65%] lg:w-[75%] h-full overflow-hidden transition-colors duration-500 z-10"
        style={{ backgroundColor: themeColors.ocean }}
      >
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
          <defs>
            <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
            <filter id="stateShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={isDark ? "#000000" : "#475569"} floodOpacity={isDark ? "0.6" : "0.2"} /></filter>
            <filter id="iconShadow"><feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.5" /></filter>
          </defs>

          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`} style={{ transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}>

            {/* 1. BACKGROUND: FOREIGN COUNTRIES & INDIA BASE */}
            {mapData.world && mapData.world.features.map((feature, i) => {
              const countryName = String(feature.properties.ADMIN || feature.properties.NAME || feature.properties.NAME_LONG || "").toLowerCase();
              const isIndia = countryName === 'india';
              return (
                <path
                  key={`world-${i}`} d={pathGenerator(feature)}
                  fill={isIndia ? themeColors.india : themeColors.foreign}
                  stroke={themeColors.externalBorder} strokeWidth="1"
                  strokeDasharray={!isIndia ? "4 4" : "none"}
                  className="transition-colors duration-700"
                />
              );
            })}

            {/* 2. TARGET STATES: FILL LAYER */}
            {/* We draw the fill first so the borders can be drawn crisply on top later */}
            {mapData.states && mapData.states.features.map((feature, i) => {
              const stateName = String(feature.properties.name || feature.properties.st_nm || feature.properties.NAME_1 || "").toLowerCase();
              const isTarget = stateName.includes('ladakh') || stateName.includes('jammu') || stateName.includes('kashmir') || stateName.includes('himachal');
              if (!isTarget) return null;
              return (
                <path
                  key={`state-fill-${i}`} d={pathGenerator(feature)}
                  fill={themeColors.targetStates}
                  filter="url(#stateShadow)"
                  className="transition-colors duration-700"
                />
              );
            })}

            {/* TERRITORY / COUNTRY NAME LABELS */}
            {[
              { name: "JAMMU &\nKASHMIR", lat: 33.6, lon: 75.2, color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
              { name: "LADAKH", lat: 34.0, lon: 77.8, color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
              { name: "HIMACHAL\nPRADESH", lat: 31.8, lon: 76.8, color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" },
              { name: "CHINA", lat: 33.0, lon: 79.8, color: isDark ? "rgba(239,68,68,0.35)" : "rgba(220,38,38,0.3)" },
              { name: "PAKISTAN", lat: 34.8, lon: 74.5, color: isDark ? "rgba(34,197,94,0.35)" : "rgba(22,163,74,0.3)" },
            ].map((t, i) => {
              const [tx, ty] = projection([t.lon, t.lat]);
              return (
                <text
                  key={`territory-${i}`}
                  x={tx} y={ty}
                  textAnchor="middle"
                  fontSize="18"
                  fontWeight="900"
                  letterSpacing="6"
                  fill={t.color}
                  className="pointer-events-none select-none"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  {t.name.split('\n').map((line, li) => (
                    <tspan key={li} x={tx} dy={li === 0 ? 0 : 22}>{line}</tspan>
                  ))}
                </text>
              );
            })}

            {/* 3. GIS RIVERS, LAKES, AND ROADS */}
            {mapData.rivers && mapData.rivers.features.map((f, i) => <path key={`r-${i}`} d={pathGenerator(f)} fill="none" stroke={themeColors.river} strokeWidth="0.8" opacity="0.6" />)}
            {mapData.lakes && mapData.lakes.features.map((f, i) => <path key={`l-${i}`} d={pathGenerator(f)} fill={themeColors.water} opacity="0.85" />)}
            {mapData.roads && mapData.roads.features.map((f, i) => <path key={`rd-${i}`} d={pathGenerator(f)} fill="none" stroke={themeColors.road} strokeWidth="0.5" opacity="0.4" />)}

            {/* 4. EXPEDITION ROUTES — narrower, color-coded by road type */}
            {itineraryDays.map((day, idx) => {
              if (day.hideOnMap) return null;
              const visibleRoute = day.route.filter(id => !locations[id].hideOnMap);
              const d = routeLineGenerator(visibleRoute);
              const routeColor = day.type === 'dotted' ? '#ec4899' : day.type === 'dashed' ? '#f59e0b' : '#3b82f6';
              const isActive = activeDay === idx;
              const isFaded = activeDay !== null && activeDay !== idx;

              return (
                <g key={idx} className="transition-opacity duration-500" style={{ opacity: isFaded ? 0.15 : 1 }}>
                  <path
                    d={d} fill="none" stroke={routeColor}
                    strokeWidth={isActive ? "4" : "3"}
                    strokeLinecap="round"
                    strokeDasharray={day.type === 'dashed' ? '12 8' : day.type === 'dotted' ? '4 8' : 'none'}
                    className="transition-all duration-500"
                  />
                </g>
              );
            })}

            {/* 5. TARGET STATES: INTERNAL BORDERS LAYER */}
            {/* Drawn ON TOP of routes so state borders remain perfectly visible */}
            {mapData.states && mapData.states.features.map((feature, i) => {
              const stateName = String(feature.properties.name || feature.properties.st_nm || feature.properties.NAME_1 || "").toLowerCase();
              const isTarget = stateName.includes('ladakh') || stateName.includes('jammu') || stateName.includes('kashmir') || stateName.includes('himachal');
              if (!isTarget) return null;
              return (
                <path
                  key={`state-border-${i}`} d={pathGenerator(feature)}
                  fill="none"
                  stroke={themeColors.internalBorder}
                  strokeWidth="2"
                  className="transition-colors duration-700"
                />
              );
            })}

            {/* 6. WAYPOINT MARKERS — above routes */}
            {Object.entries(locations).map(([id, loc]) => {
              if (loc.hideOnMap) return null;
              const [px, py] = projection([loc.lon, loc.lat]);
              const isActive = activeDay === null || itineraryDays[activeDay]?.route.includes(id);
              const dynamicStroke = isDark ? "#27272a" : "#ffffff";
              const iconR = loc.icon === 'dot' ? 3 : 6;
              const tp = getTextPos(id, iconR);

              return (
                <g
                  key={id} transform={`translate(${px}, ${py})`}
                  className="cursor-pointer"
                  style={{ opacity: isActive ? 1 : 0.2, transition: 'opacity 0.5s' }}
                  onClick={() => setSelectedLoc(loc)}
                >
                  {loc.icon === 'castle' && <circle r={iconR} fill="#52525b" stroke={dynamicStroke} strokeWidth="1" />}
                  {loc.icon === 'star' && <circle r={iconR} fill={loc.isEpicPass ? '#d946ef' : '#4338ca'} stroke={dynamicStroke} strokeWidth="1" />}
                  {loc.icon === 'alert' && <circle r={iconR} fill="#be123c" stroke={dynamicStroke} strokeWidth="1" />}
                  {loc.icon === 'dot' && <circle r={iconR} fill="#a1a1aa" stroke={dynamicStroke} strokeWidth="1" />}

                  {loc.amenities?.includes('fuel') && (
                    <circle cx={iconR + 3} cy={-iconR - 3} r="2.5" fill="#f59e0b" stroke={dynamicStroke} strokeWidth="0.5" />
                  )}

                  <text
                    x={tp.x} y={tp.y}
                    textAnchor={tp.anchor}
                    fontSize="8" fontWeight="600"
                    className="pointer-events-none select-none"
                    fill={isDark ? "white" : "#1e293b"}
                    stroke={isDark ? "#09090b" : "#ffffff"}
                    strokeWidth="2.5" paintOrder="stroke"
                  >
                    {loc.name}
                  </text>

                  {(loc.type === 'stay' || loc.type === 'pass' || loc.icon === 'star') && (
                    <text
                      x={tp.x} y={tp.y + 9}
                      textAnchor={tp.anchor}
                      fontSize="6" fontWeight="500"
                      className="pointer-events-none select-none"
                      fill={isDark ? "#94a3b8" : "#64748b"}
                      stroke={isDark ? "#09090b" : "#ffffff"}
                      strokeWidth="2" paintOrder="stroke"
                    >
                      {loc.elev}
                    </text>
                  )}
                </g>
              );
            })}

            {/* SVG LEGEND (embedded for PNG export) */}
            <g transform={`translate(${(600 - transform.x) / transform.scale}, ${(isMobile ? 600 - transform.y : 760 - transform.y) / transform.scale}) scale(${(isMobile ? 0.6 : 1) / transform.scale})`}>
              <rect x="-260" y="-16" width="520" height="32" rx="16" fill={isDark ? "rgba(24,24,27,0.92)" : "rgba(255,255,255,0.92)"} stroke={isDark ? "#3f3f46" : "#d4d4d8"} strokeWidth="1" />
              <circle cx="-232" cy="0" r="4" fill="#52525b" /><text x="-225" y="3" fontSize="7" fontWeight="700" fill={isDark ? "white" : "#1e293b"}>STAY</text>
              <circle cx="-185" cy="0" r="4" fill="#be123c" /><text x="-178" y="3" fontSize="7" fontWeight="700" fill={isDark ? "white" : "#1e293b"}>HAZARD</text>
              <circle cx="-125" cy="0" r="4" fill="#4338ca" /><text x="-118" y="3" fontSize="7" fontWeight="700" fill={isDark ? "white" : "#1e293b"}>PASS</text>
              <circle cx="-72" cy="0" r="4" fill="#f59e0b" /><text x="-65" y="3" fontSize="7" fontWeight="700" fill={isDark ? "white" : "#1e293b"}>FUEL</text>
              <line x1="-30" y1="-8" x2="-30" y2="8" stroke={isDark ? "#52525b" : "#a1a1aa"} strokeWidth="1" />
              <line x1="-15" y1="0" x2="5" y2="0" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" /><text x="10" y="3" fontSize="7" fontWeight="700" fill={isDark ? "#a1a1aa" : "#475569"}>PAVED</text>
              <line x1="55" y1="0" x2="75" y2="0" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 3" /><text x="80" y="3" fontSize="7" fontWeight="700" fill={isDark ? "#a1a1aa" : "#475569"}>OFF-ROAD</text>
              <line x1="140" y1="0" x2="160" y2="0" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 4" /><text x="165" y="3" fontSize="7" fontWeight="700" fill={isDark ? "#a1a1aa" : "#475569"}>EXTREME</text>
            </g>
          </g>
        </svg>
      </div>

      {/* Mobile Map Overlay (darkens map when sheet is expanded) */}
      <div
        className={`md:hidden absolute inset-0 bg-black/60 z-10 transition-opacity duration-500 pointer-events-none ${isMobileSheetExpanded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* ============================== */}
      {/* SIDEBAR / BOTTOM SHEET         */}
      {/* ============================== */}
      <div
        className={`
          absolute md:relative bottom-0 left-0 w-full md:w-[35%] lg:w-[25%] md:min-w-[340px]
          flex flex-col shadow-[0_-15px_40px_rgba(0,0,0,0.4)] md:shadow-2xl z-20
          transition-all duration-500 cubic-bezier(0.4,0,0.2,1)
          rounded-t-[32px] md:rounded-none border-t md:border-t-0 md:border-r
          ${isDark ? 'bg-zinc-900/95 backdrop-blur-2xl border-zinc-800' : 'bg-white/95 backdrop-blur-2xl border-stone-200'}
          ${isMobileSheetExpanded ? 'h-[85dvh]' : 'h-auto max-h-[60dvh]'} md:h-full md:max-h-none
        `}
      >
        {/* Drag handle for aesthetics on mobile */}
        <div
          className="md:hidden flex justify-center w-full pt-4 pb-2 shrink-0 cursor-pointer"
          onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}
        >
          <div className={`w-12 h-1.5 rounded-full transition-colors ${isDark ? 'bg-zinc-700 hover:bg-zinc-500' : 'bg-stone-300 hover:bg-stone-400'}`}></div>
        </div>

        {/* TOP: Header (Shrinks) */}
        <div className="px-5 md:px-6 pt-1 md:pt-6 pb-3 md:pb-5 border-b border-inherit shrink-0">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h1 className="text-lg md:text-xl font-black tracking-tighter italic">LADAKH TACTICAL</h1>
            <div className="flex gap-2">
              <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full border transition-colors ${isDark ? 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700' : 'border-stone-300 bg-white hover:bg-stone-100'}`}>
                {isDark ? <Sun size={14} className="text-zinc-300" /> : <Moon size={14} className="text-zinc-800" />}
              </button>
              <button onClick={handleDownloadMap} className={`p-2 rounded-full border transition-colors ${isDark ? 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700' : 'border-stone-300 bg-white hover:bg-stone-100'}`} title="Download Map">
                <Download size={14} className={isDark ? "text-zinc-300" : "text-zinc-800"} />
              </button>
              <button onClick={handleDownloadItinerary} className={`p-2 rounded-full border transition-colors ${isDark ? 'border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700' : 'border-stone-300 bg-white hover:bg-stone-100'}`} title="Download Itinerary">
                <Map size={14} className={isDark ? "text-zinc-300" : "text-zinc-800"} />
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 pb-2 text-[10px] uppercase tracking-widest font-bold border-b-2 border-blue-500 text-blue-500">
              Location Intel
            </div>
          </div>
        </div>

        {/* MIDDLE: Location Intel (Shrinks) */}
        <div className="px-5 md:px-6 py-4 shrink-0">
          <div className={`p-4 rounded-xl border md:min-h-[190px] transition-colors duration-500 ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-stone-50 border-stone-200'}`}>
            <h2 className="font-bold text-base md:text-lg leading-tight mb-1">{selectedLoc.name}</h2>
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold opacity-60 mb-2 tracking-widest uppercase">
              <Mountain size={10} /> {selectedLoc.elev} | {selectedLoc.region}
            </div>
            <p className={`text-[11px] md:text-xs leading-relaxed opacity-80 mb-3 ${isMobileSheetExpanded ? '' : 'line-clamp-2 md:line-clamp-none'}`}>
              {selectedLoc.desc}
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {selectedLoc.amenities?.includes('fuel') && <span className="bg-amber-500/20 text-amber-500 text-[8px] md:text-[9px] px-2 py-0.5 rounded font-bold uppercase border border-amber-500/30">Petrol</span>}
              {selectedLoc.amenities?.includes('food') && <span className="bg-orange-500/20 text-orange-400 text-[8px] md:text-[9px] px-2 py-0.5 rounded font-bold uppercase border border-orange-500/30">Food</span>}
              {selectedLoc.amenities?.includes('network') && <span className="bg-emerald-500/20 text-emerald-400 text-[8px] md:text-[9px] px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/30">Network</span>}
              {selectedLoc.amenities?.includes('mechanic') && <span className="bg-slate-500/20 text-slate-400 text-[8px] md:text-[9px] px-2 py-0.5 rounded font-bold uppercase border border-slate-500/30">Mechanic</span>}
            </div>

            {selectedLoc.isCritical && <div className="mb-2 flex items-center gap-2 text-[9px] md:text-[10px] font-bold text-red-500 bg-red-500/10 p-2 rounded border border-red-500/30"><AlertTriangle size={12} /> CRITICAL STOP</div>}
            {selectedLoc.hotel && <div className="mt-2 md:mt-3 flex items-center gap-2 text-[10px] md:text-[11px] font-bold text-blue-500 bg-blue-500/10 p-2 rounded border border-blue-500/20"><BedDouble size={12} /> {selectedLoc.hotel}</div>}
            {selectedLoc.warning && <div className="mt-2 flex items-start gap-2 text-[9px] md:text-[10px] font-bold text-amber-600 bg-amber-500/10 p-2 rounded border border-amber-500/30 leading-tight"><AlertTriangle size={12} className="shrink-0 mt-0.5" /> <span>{selectedLoc.warning}</span></div>}
          </div>
        </div>

        {/* BOTTOM: Itinerary List (Grows and Scrolls) */}
        <div className={`flex-1 px-5 md:px-6 pb-2 custom-scrollbar ${isMobileSheetExpanded ? 'overflow-y-auto' : 'overflow-hidden'} md:overflow-y-auto`}>
          <div
            className={`flex items-center justify-between mb-3 ${!isMobileSheetExpanded ? 'cursor-pointer md:cursor-default' : ''}`}
            onClick={() => { if (isMobile && !isMobileSheetExpanded) setIsMobileSheetExpanded(true); }}
          >
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 px-2 flex items-center gap-2">
              <CalendarDays size={12} /> 11-Day Expedition
            </p>
            {/* Show a small expand hint if collapsed on mobile */}
            {!isMobileSheetExpanded && isMobile && (
              <span className="text-[9px] uppercase tracking-widest opacity-60 flex items-center gap-1 font-bold animate-pulse text-blue-500">
                Tap to view <ArrowRight size={10} className="-rotate-90" />
              </span>
            )}
          </div>

          <div className={`space-y-2 transition-all duration-500 ${!isMobileSheetExpanded ? 'hidden md:block' : 'block'}`}>
            {itineraryDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const isSelectingNewDay = activeDay !== idx;
                  setActiveDay(isSelectingNewDay ? idx : null);
                  if (isSelectingNewDay) setSelectedLoc(locations[day.route[day.route.length - 1]]);
                  else setSelectedLoc(locations.leh);

                  // Auto-collapse sheet on selection if on mobile
                  if (isMobile && isSelectingNewDay) setIsMobileSheetExpanded(false);
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${activeDay === idx
                  ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                  : isDark ? 'bg-zinc-800/30 border-zinc-700 hover:bg-zinc-800/50' : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className={`text-[8px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1 ${activeDay === idx ? 'text-blue-100' : 'text-zinc-500'}`}>
                    <span>Day {day.day}</span>{day.distance > 0 && <span className="text-[7px]">• {day.distance}km</span>}
                  </div>
                  <div className="font-bold text-sm truncate">{day.title}</div>
                  <div className={`text-[9px] truncate mt-0.5 flex items-center gap-1 ${activeDay === idx ? 'text-blue-200' : 'text-zinc-500'}`}>
                    <Clock size={10} /> {day.duration}
                  </div>
                </div>
                <ArrowRight size={14} className={`transition-transform ${activeDay === idx ? 'rotate-90 opacity-100' : 'opacity-20 group-hover:opacity-100'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 md:p-4 border-t text-[8px] md:text-[9px] font-bold opacity-30 tracking-widest text-center uppercase shrink-0">
          Based on 2026 Operational Data
        </div>
      </div>

    </div>
  );
}
