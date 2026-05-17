import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { line, curveCatmullRom } from 'd3-shape';
import { CalendarDays, MapPin, Navigation, Info, X, ChevronUp, MountainSnow, ShieldAlert, Bed, EyeOff, Mountain, AlertTriangle, BedDouble, Sun, Moon, Download, Map, ArrowRight, Clock, Fuel, Utensils, Wifi, Wrench } from 'lucide-react';

const referenceLabels = [
  { name: "Indus River", lat: 33.7, lon: 77.8, rot: -45, type: "water" },
  { name: "Shyok River", lat: 34.6, lon: 77.7, rot: -20, type: "water" },
  { name: "Zanskar Range", lat: 33.6, lon: 76.5, rot: -30, type: "terrain" },
  { name: "Karakoram Range", lat: 34.8, lon: 77.0, rot: -15, type: "terrain" },
  { name: "Nubra Valley", lat: 34.65, lon: 77.5, rot: -15, type: "terrain" },
  { name: "Pangong Tso", lat: 33.8, lon: 78.6, rot: 15, type: "water" },
  { name: "Tso Moriri", lat: 32.9, lon: 78.3, rot: -10, type: "water" },
  { name: "Great Himalaya", lat: 33.2, lon: 76.8, rot: -20, type: "terrain" },
  { name: "Rupshu Valley", lat: 33.1, lon: 78.0, rot: 0, type: "terrain" }
];

const locations = {
  // ARRIVAL & ACCLIMATIZATION
  srinagar: { lat: 34.0837, lon: 74.7973, name: "Srinagar Base", type: "stay", icon: "castle", elev: "1,585m", hotel: "New Jersey Houseboat", desc: "Arrival point. Mandatory fluid loading.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Kashmir" },
  sonamarg: { lat: 34.3000, lon: 75.3000, name: "Sonamarg", type: "poi", icon: "dot", elev: "2,800m", desc: "Final checkpoint before Zoji La.", amenities: ['food'], region: "Kashmir" },

  // NH-1 CORRIDOR (The Great Ascent)
  zojila: { lat: 34.2778, lon: 75.4722, name: "Zoji La", type: "pass", icon: "alert", elev: "3,528m", warning: "Avalanche prone. Unpredictable closures.", amenities: [], region: "Himalayas" },
  drass: { lat: 34.4286, lon: 75.7600, name: "Drass", type: "poi", icon: "dot", elev: "3,300m", desc: "Second coldest inhabited place.", amenities: ['fuel', 'food', 'network'], region: "Ladakh" },
  kargil: { lat: 34.5539, lon: 76.1349, name: "Kargil", type: "stay", icon: "castle", elev: "2,676m", hotel: "Karoli Guest House", desc: "Midway halt. Secure fuel reserves.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Ladakh" },
  mulbekh: { lat: 34.3833, lon: 76.3833, name: "Mulbekh", type: "poi", icon: "dot", elev: "3,304m", desc: "Ancient Maitreya Buddha relief.", amenities: ['food'], region: "Ladakh" },
  namikala: { lat: 34.3500, lon: 76.5500, name: "Namika La", type: "pass", icon: "star", elev: "3,700m", desc: "Pillar of the sky pass.", amenities: [], region: "Zanskar Range" },
  fotula: { lat: 34.2833, lon: 76.7167, name: "Fotu La", type: "pass", icon: "star", elev: "4,108m", desc: "Highest point on Leh-Srinagar highway.", amenities: [], region: "Zanskar Range" },
  lamayuru: { lat: 34.2833, lon: 76.7833, name: "Lamayuru", type: "poi", icon: "castle", elev: "3,510m", desc: "Moonland landscape. Ancient monastery.", amenities: ['food'], region: "Ladakh" },
  patharsahib: { lat: 34.1950, lon: 77.3480, name: "Pathar Sahib", type: "poi", icon: "dot", elev: "3,600m", desc: "Gurudwara maintained by Indian Army.", amenities: ['food'], region: "Ladakh" },
  magnetichill: { lat: 34.1955, lon: 77.3485, name: "Magnetic Hill", type: "poi", icon: "alert", elev: "3,600m", warning: "Optical illusion. Stay alert on road.", amenities: [], region: "Ladakh" },
  sangam: { lat: 34.1667, lon: 77.3333, name: "Sangam", type: "poi", icon: "dot", elev: "3,100m", desc: "Confluence of Indus and Zanskar rivers.", amenities: ['food'], region: "Ladakh" },
  leh: { lat: 34.1526, lon: 77.5771, name: "Leh HQ", type: "stay", icon: "castle", elev: "3,500m", isCritical: true, hotel: "Hotel Walnut Ladakh", desc: "Operational base. Secure inner line permits.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Ladakh" },

  // NUBRA VALLEY SECTOR
  southpullu: { lat: 34.2167, lon: 77.6000, name: "South Pullu", type: "warning", icon: "alert", elev: "4,600m", warning: "First altitude stress check.", amenities: [], region: "Ladakh" },
  khardungla: { lat: 34.2783, lon: 77.6047, name: "Khardung La", type: "pass", icon: "star", isEpicPass: true, elev: "5,359m", warning: "Extreme Altitude. Do not halt > 15 mins.", amenities: [], region: "Karakoram" },
  diskit: { lat: 34.5458, lon: 77.5614, name: "Diskit", type: "poi", icon: "castle", elev: "3,144m", desc: "Nubra Valley entrance.", amenities: ['fuel', 'food', 'network'], region: "Nubra" },
  nubra: { lat: 34.5833, lon: 77.4667, name: "Nubra (Hunder)", type: "stay", icon: "castle", elev: "3,150m", hotel: "Nubra Residency", desc: "Desert oasis. Bactrian camels.", amenities: ['food', 'network'], region: "Nubra" },

  // PANGONG TRACT
  agham: { lat: 34.3167, lon: 77.8167, name: "Agham", type: "warning", icon: "alert", elev: "3,300m", warning: "River crossings ahead.", amenities: [], region: "Shyok Valley" },
  shyok: { lat: 34.1833, lon: 78.1333, name: "Shyok", type: "poi", icon: "dot", elev: "3,700m", desc: "The River of Death.", amenities: [], region: "Shyok Valley" },
  durbuk: { lat: 34.1167, lon: 78.1000, name: "Durbuk", type: "poi", icon: "dot", elev: "3,800m", desc: "Junction point.", amenities: ['food'], region: "Ladakh" },
  tangste: { lat: 34.0333, lon: 78.1667, name: "Tangste", type: "poi", icon: "dot", elev: "3,950m", desc: "Permit check.", amenities: ['food', 'network'], region: "Ladakh" },
  spangmik: { lat: 33.9000, lon: 78.4500, name: "Spangmik", type: "stay", icon: "dot", elev: "4,250m", hotel: "Skylake Cottage", desc: "Pangong lakeshore.", amenities: ['food'], region: "Pangong" },
  pangong: { lat: 33.8667, lon: 78.5000, name: "Pangong Tso", type: "poi", icon: "alert", elev: "4,225m", warning: "High winds, extreme cold at night.", amenities: [], region: "Pangong", isLakeSite: true },

  // CHANGTHANG & HANLE (The Frontier)
  merak: { lat: 33.8000, lon: 78.5833, name: "Merak", type: "poi", icon: "dot", elev: "4,300m", desc: "Restricted zone edge.", amenities: [], region: "Changthang" },
  chushul: { lat: 33.5833, lon: 78.6667, name: "Chushul", type: "warning", icon: "alert", elev: "4,360m", warning: "Military zone. Strict photography ban.", amenities: [], region: "Changthang" },
  rezangla: { lat: 33.4333, lon: 78.8000, name: "Rezang La", type: "poi", icon: "castle", elev: "4,876m", desc: "War Memorial.", amenities: [], region: "Changthang" },
  tsagala: { lat: 33.2667, lon: 78.8833, name: "Tsaga La", type: "pass", icon: "star", elev: "4,660m", desc: "High pass towards Loma.", amenities: [], region: "Changthang" },
  lomabridge: { lat: 33.1667, lon: 78.8167, name: "Loma Bridge", type: "warning", icon: "alert", elev: "4,150m", desc: "Vital bridge crossing.", amenities: [], region: "Changthang" },
  hanle: { lat: 32.7833, lon: 79.0000, name: "Hanle", type: "stay", icon: "castle", elev: "4,500m", hotel: "Crane Resort", desc: "Dark sky reserve. Zero network.", amenities: ['food'], region: "Changthang" },
  phoTila: { lat: 32.7833, lon: 79.1167, name: "Photi La", type: "pass", icon: "star", elev: "5,524m", desc: "Acclimatization pass before Umling La.", amenities: [], region: "Changthang" },
  ukdungle: { lat: 32.8833, lon: 79.4167, name: "Ukdungle", type: "poi", icon: "dot", elev: "4,600m", desc: "Army post.", amenities: [], region: "Changthang" },
  chisumlebridge: { lat: 32.8167, lon: 79.5000, name: "Chisumle", type: "poi", icon: "dot", elev: "4,700m", desc: "Base of Umling La ascent.", amenities: [], region: "Changthang" },
  umlingla: { lat: 32.6930, lon: 79.2700, name: "Umling La", type: "pass", icon: "star", isEpicPass: true, elev: "5,798m", warning: "HIGHEST MOTORABLE PASS. Oxygen critical.", amenities: [], region: "Changthang" },

  // TSO MORIRI & RUPSHU TRACT
  mahebridge: { lat: 33.2576, lon: 78.5426, name: "Mahe", type: "warning", icon: "alert", elev: "4,197m", desc: "Transit Checkpoint.", amenities: [], region: "Ladakh" },
  kyagartso: { lat: 33.109, lon: 78.307, name: "Kyagar Tso", type: "poi", icon: "dot", elev: "4,705m", desc: "Small salt lake.", amenities: [], region: "Ladakh", hideOnMap: true },
  puga: { lat: 33.2247, lon: 78.3130, name: "Puga Valley", type: "poi", icon: "dot", elev: "4,400m", desc: "Geothermal Hot Springs.", amenities: ['food'], region: "Ladakh" },
  tsomoriri: { lat: 32.9167, lon: 78.3000, name: "Tso Moriri", type: "stay", icon: "alert", elev: "4,522m", hotel: "Tsomoriri Camps & Resorts", desc: "High-Altitude Endorheic Lake. Wildlife sanctuary.", amenities: ['food'], region: "Tso Moriri", isLakeSite: true },

  // THE GREAT DESCENT (NH-3)
  tsokar: { lat: 33.3000, lon: 78.0000, name: "Tso Kar", type: "poi", icon: "dot", elev: "4,530m", desc: "The White Lake (Salt).", amenities: [], region: "Rupshu" },
  debring: { lat: 33.3500, lon: 77.8167, name: "Debring", type: "poi", icon: "dot", elev: "4,835m", desc: "Join Manali-Leh Highway.", amenities: ['food'], region: "Ladakh" },
  pang: { lat: 33.1333, lon: 77.7500, name: "Pang", type: "warning", icon: "alert", elev: "4,600m", desc: "Tent settlement.", amenities: ['food'], region: "Ladakh" },
  lachulungla: { lat: 33.1000, lon: 77.6333, name: "Lachulung La", type: "pass", icon: "star", elev: "5,059m", desc: "High altitude barren pass.", amenities: [], region: "Zanskar Range" },
  nakeela: { lat: 33.0667, lon: 77.5833, name: "Nakee La", type: "pass", icon: "star", elev: "4,739m", desc: "Third pass from Leh.", amenities: [], region: "Zanskar Range" },
  gataloops: { lat: 33.0167, lon: 77.5500, name: "Gata Loops", type: "warning", icon: "alert", elev: "4,190m", warning: "21 hairpin bends. Severe drops.", amenities: [], region: "Zanskar Range" },
  sarchu: { lat: 32.8950, lon: 77.5510, name: "Sarchu", type: "warning", icon: "alert", elev: "4,290m", desc: "State border halt. High AMS risk.", amenities: ['food'], region: "Border" },
  baralachala: { lat: 32.7580, lon: 77.4170, name: "Baralacha La", type: "pass", icon: "star", elev: "4,890m", warning: "Heavy snow accumulation zone.", amenities: [], region: "Zanskar Range" },
  surajtaal: { lat: 32.7590, lon: 77.3950, name: "Suraj Taal", type: "poi", icon: "dot", elev: "4,883m", desc: "Lake of the Sun God.", amenities: [], region: "Lahaul", isLakeSite: true },
  darcha: { lat: 32.6790, lon: 77.2090, name: "Darcha", type: "poi", icon: "dot", elev: "3,360m", desc: "Checkpoint.", amenities: ['food'], region: "Lahaul" },
  jispa: { lat: 32.6310, lon: 77.1750, name: "Jispa", type: "stay", icon: "castle", elev: "3,200m", hotel: "Lahaul Camps", desc: "Restful river-side recovery.", amenities: ['food', 'network'], region: "Lahaul" },

  // FINAL PUSH
  keylong: { lat: 32.5710, lon: 77.0340, name: "Keylong", type: "poi", icon: "castle", elev: "3,080m", desc: "Administrative center.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Lahaul" },
  tandi: { lat: 32.5510, lon: 76.9680, name: "Tandi", type: "warning", icon: "alert", elev: "2,573m", warning: "Last petrol pump before Leh (if ascending).", amenities: ['fuel'], region: "Lahaul" },
  sissu: { lat: 32.4830, lon: 77.1040, name: "Sissu", type: "poi", icon: "dot", elev: "3,120m", desc: "Waterfall viewing area.", amenities: ['food'], region: "Lahaul" },
  ataltunnel: { lat: 32.4330, lon: 77.1950, name: "Atal Tunnel", type: "pass", icon: "star", elev: "3,100m", desc: "9km engineering marvel bypassing Rohtang.", amenities: [], region: "Pir Panjal" },
  manali: { lat: 32.2396, lon: 77.1887, name: "Manali", type: "stay", icon: "castle", elev: "2,050m", hotel: "White Hill Resort", desc: "Expedition termination point.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "Himachal" },
  delhi: { lat: 28.6139, lon: 77.2090, name: "Delhi", type: "stay", icon: "dot", elev: "218m", desc: "National Capital. Terminus.", amenities: ['fuel', 'food', 'network', 'mechanic'], region: "India", hideOnMap: true }
};

// Segment styles based on GIS classification
const segmentColors = { paved: '#3b82f6', offroad: '#f59e0b', extreme: '#ec4899' };
const segmentDashArray = { paved: 'none', offroad: '5 5', extreme: '2 4' };

const itineraryDays = [
  { day: 1, title: "Srinagar Arrival & Acclim.", route: ["srinagar"], color: "#3b82f6", stay: "New Jersey Houseboat", desc: "Arrival and fluid checks. Minimize cardiac load.", distance: 0, duration: "Rest Day", type: "solid" },
  { day: 2, title: "Srinagar to Kargil", route: ["srinagar", "sonamarg", "zojila", "drass", "kargil"], color: "#3b82f6", stay: "Karoli Guest House", desc: "Initial hypoxic transition. Cross Zoji La early.", distance: 204, duration: "7-9 hrs", type: "solid" },
  { day: 3, title: "Kargil to Leh", route: ["kargil", "namikala", "fotula", "sangam", "magnetichill", "leh"], color: "#3b82f6", stay: "Hotel Walnut Ladakh", desc: "Sustained altitude transit over 3,500m.", distance: 216, duration: "6-7 hrs", type: "solid" },
  { day: 4, title: "Leh to Nubra Valley", route: ["leh", "khardungla", "diskit", "nubra"], color: "#3b82f6", stay: "Nubra Residency", desc: "Khardung La ascent. Expect 6hr engagement due to checkpoints.", distance: 130, duration: "5-6 hrs", type: "solid" },
  { day: 5, title: "Nubra to Pangong", route: ["nubra", "agham", "tangste", "spangmik", "pangong"], color: "#3b82f6", stay: "Skylake Cottage", desc: "Shyok river route. Strict adherence to 13:00 Glacial Rule.", distance: 180, duration: "6-8 hrs", type: "solid" },
  { day: 6, title: "Pangong to Hanle", route: ["pangong", "merak", "chushul", "rezangla", "tsagala", "lomabridge", "hanle"], color: "#3b82f6", stay: "Crane Resort", desc: "Sandy tracks, isolation. Fill emergency fuel cans.", distance: 200, duration: "7-8 hrs", type: "solid" },
  { day: 7, title: "Umling La Excursion", route: ["hanle", "phoTila", "umlingla"], color: "#ec4899", stay: "Crane Resort", desc: "World's highest motorable pass. Sub-critical oxygen limit.", distance: 170, duration: "6-7 hrs", type: "extreme" },
  { day: 8, title: "Hanle to Tso Moriri", route: ["hanle", "lomabridge", "mahebridge", "puga", "kyagartso", "tsomoriri"], color: "#3b82f6", stay: "Tsomoriri Camps", desc: "Transfer via Puga geothermal zone.", distance: 161, duration: "5-6 hrs", type: "solid" },
  { day: 9, title: "Tso Moriri to Jispa", route: ["tsomoriri", "kyagartso", "puga", "tsokar", "debring", "nakeela", "gataloops", "sarchu", "baralachala", "surajtaal", "darcha", "jispa"], color: "#3b82f6", stay: "Lahaul Camps", desc: "The Long Day. Grueling sequence of passes and loops.", distance: 235, duration: "11-14 hrs", type: "solid" },
  { day: 10, title: "Jispa to Manali", route: ["jispa", "keylong", "tandi", "sissu", "ataltunnel", "manali"], color: "#3b82f6", stay: "White Hill Resort", desc: "Final push through Atal Tunnel. Refuel at Tandi.", distance: 140, duration: "5-6 hrs", type: "solid" },
  { day: 11, title: "Manali to Delhi", route: ["manali", "delhi"], color: "#94a3b8", type: "dashed", stay: "Volvo Bus (Overnight)", desc: "Overnight Volvo Bus journey.", distance: 500, duration: "13 hrs", hideOnMap: true }
];

export default function App() {
  const [activeDay, setActiveDay] = useState(null);
  const [selectedLoc, setSelectedLoc] = useState(locations.leh);
  const [isDark, setIsDark] = useState(true);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [mapData, setMapData] = useState({ world: null, states: null, roads: null, lakes: null, rivers: null });
  const [snappedRoutes, setSnappedRoutes] = useState(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1, defaultScale: 1, defaultX: 0, defaultY: 0 });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPinchDist = useRef(null);
  const initialPinchScale = useRef(null);

  const wrapperRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const themeColors = useMemo(() => isDark ? {
    ocean: "#0f172a",
    india: "#1e293b",
    foreign: "#020617",
    targetStates: "#334155",
    internalBorder: "#64748b",
    water: "#38bdf8",
    river: "#0ea5e9",
    externalBorder: "#475569",
    road: "#94a3b8",
    roadOpacity: 0.55,
  } : {
    ocean: "#e0f2fe",
    india: "#f8fafc",
    foreign: "#f1f5f9",
    targetStates: "#ffffff",
    internalBorder: "#94a3b8",
    water: "#0ea5e9",
    river: "#38bdf8",
    externalBorder: "#cbd5e1",
    road: "#64748b",
    roadOpacity: 0.6,
  }, [isDark]);

  useEffect(() => {
    Promise.all([
      fetch('/data/world_borders.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/india_states.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/roads.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/lakes.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/rivers.geojson').then(r => r.json()).catch(() => null),
      fetch('/data/snapped_routes.json').then(r => r.json()).catch(() => null)
    ]).then(([world, states, roads, lakes, rivers, routes]) => {
      setMapData({ world, states, roads, lakes, rivers });
      setSnappedRoutes(routes);
    });
  }, []);

  const projection = useMemo(() => geoMercator().center([76.5, 33.5]).scale(13000).translate([600, 400]), []);
  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const coordLineGenerator = useMemo(() => line().x(c => projection([c[0], c[1]])[0]).y(c => projection([c[0], c[1]])[1]), [projection]);
  const routeLineGenerator = useMemo(() => line().x(id => projection([locations[id].lon, locations[id].lat])[0]).y(id => projection([locations[id].lon, locations[id].lat])[1]).curve(curveCatmullRom.alpha(0.5)), [projection]);

  const zoomToBoundingBox = useCallback((pointIds) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    pointIds.forEach(id => {
      if (id === 'delhi' || !locations[id]) return;
      const [px, py] = projection([locations[id].lon, locations[id].lat]);
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    });

    if (minX === Infinity) return;
    const padding = 150;
    const targetScale = Math.min(1200 / (maxX - minX + padding * 2), 800 / (maxY - minY + padding * 2));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    setTransform({
      x: 600 - centerX * targetScale,
      y: 400 - centerY * targetScale,
      scale: targetScale,
      defaultScale: targetScale,
      defaultX: 600 - centerX * targetScale,
      defaultY: 400 - centerY * targetScale
    });
  }, [projection]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeDay !== null) zoomToBoundingBox(itineraryDays[activeDay].route);
      else zoomToBoundingBox(Object.keys(locations).filter(l => l !== 'delhi'));
    }, 50);
    return () => clearTimeout(timer);
  }, [activeDay, zoomToBoundingBox]);

  const handleZoom = (factor) => {
    setTransform(prev => {
      let newScale = Math.max(prev.defaultScale, Math.min(8, prev.scale * factor));
      let newX = 600 - (600 - prev.x) * (newScale / prev.scale);
      let newY = 400 - (400 - prev.y) * (newScale / prev.scale);

      if (newScale === prev.defaultScale) {
        newX = prev.defaultX;
        newY = prev.defaultY;
      } else if (newScale > prev.defaultScale) {
        // Loosen the pan bounds significantly to account for 'slice' aspect ratio
        const maxPanX = 1200 * (newScale / prev.defaultScale);
        const maxPanY = 800 * (newScale / prev.defaultScale);
        newX = Math.max(prev.defaultX - maxPanX, Math.min(prev.defaultX + maxPanX, newX));
        newY = Math.max(prev.defaultY - maxPanY, Math.min(prev.defaultY + maxPanY, newY));
      }
      return { ...prev, x: newX, y: newY, scale: newScale };
    });
  };

  const handlePointerDown = (e) => {
    if (e.touches && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      initialPinchScale.current = transform.scale;
      isDragging.current = false;
      return;
    }
    isDragging.current = true;
    dragStart.current = { x: e.clientX || (e.touches?.[0].clientX) || 0, y: e.clientY || (e.touches?.[0].clientY) || 0 };
  };

  const handlePointerMove = (e) => {
    if (e.touches && e.touches.length === 2 && initialPinchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleDelta = dist / initialPinchDist.current;
      
      let newScale = Math.max(transform.defaultScale, Math.min(8, initialPinchScale.current * scaleDelta));
      let newX = 600 - (600 - transform.x) * (newScale / transform.scale);
      let newY = 400 - (400 - transform.y) * (newScale / transform.scale);

      if (newScale === transform.defaultScale) {
        newX = transform.defaultX;
        newY = transform.defaultY;
      }
      setTransform(prev => ({ ...prev, x: newX, y: newY, scale: newScale }));
      return;
    }

    if (!isDragging.current) return;
    const clientX = e.clientX || (e.touches?.[0].clientX) || 0;
    const clientY = e.clientY || (e.touches?.[0].clientY) || 0;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    dragStart.current = { x: clientX, y: clientY };
    
    setTransform(prev => {
      if (prev.scale <= prev.defaultScale) return prev;
      let newX = prev.x + dx;
      let newY = prev.y + dy;
      
      // Loosen the pan bounds significantly to account for 'slice' aspect ratio
      const maxPanX = 1200 * (prev.scale / prev.defaultScale);
      const maxPanY = 800 * (prev.scale / prev.defaultScale);
      
      newX = Math.max(prev.defaultX - maxPanX, Math.min(prev.defaultX + maxPanX, newX));
      newY = Math.max(prev.defaultY - maxPanY, Math.min(prev.defaultY + maxPanY, newY));
      return { ...prev, x: newX, y: newY };
    });
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    initialPinchDist.current = null;
  };

  const handleDownloadMap = async () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    // Create a clone of the SVG
    const clonedSvg = svg.cloneNode(true);

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // Fixed high resolution 3600x2400 (aspect ratio 1.5) for high quality print
    canvas.width = 3600;
    canvas.height = 2400;
    
    // Add background color
    ctx.fillStyle = themeColors.ocean;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ladakh_Tactical_Map_${isDark ? 'Dark' : 'Light'}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getTextPos = (id, iconSize) => {
    const offsets = {
      srinagar: 'bottom', sonamarg: 'right', zojila: 'bottom', drass: 'top',
      kargil: 'top', mulbekh: 'right', namikala: 'left', fotula: 'bottom',
      lamayuru: 'left', patharsahib: 'top', magnetichill: 'left', sangam: 'bottom',
      leh: 'bottom', southpullu: 'right', khardungla: 'bottom', diskit: 'left',
      nubra: 'top', agham: 'right', shyok: 'right', durbuk: 'bottom',
      tangste: 'right', spangmik: 'bottom', pangong: 'right',
      merak: 'left', chushul: 'bottom', rezangla: 'top', tsagala: 'right',
      lomabridge: 'right', hanle: 'bottom', phoTila: 'right', ukdungle: 'right',
      chisumlebridge: 'bottom', umlingla: 'bottom', mahebridge: 'right', puga: 'left',
      tsomoriri: 'bottom', tsokar: 'top', debring: 'top', pang: 'right', lachulungla: 'top',
      nakeela: 'left', gataloops: 'left', sarchu: 'left', baralachala: 'right', surajtaal: 'left',
      darcha: 'right', jispa: 'bottom', keylong: 'top', tandi: 'left', sissu: 'right',
      ataltunnel: 'left', manali: 'bottom'
    };
    const dir = offsets[id] || 'bottom';
    const gap = iconSize + 4;
    switch (dir) {
      case 'top': return { x: 0, y: -gap, anchor: 'middle' };
      case 'left': return { x: -gap, y: 3, anchor: 'end' };
      case 'right': return { x: gap, y: 3, anchor: 'start' };
      default: return { x: 0, y: gap + 8, anchor: 'middle' };
    }
  };

  const staticMapLayers = useMemo(() => {
    return (
      <>
        {mapData.world && mapData.world.features.map((feature, i) => {
          const isIndia = String(feature.properties.ADMIN).toLowerCase() === 'india';
          return <path key={`world-${i}`} d={pathGenerator(feature)} fill={isIndia ? themeColors.india : themeColors.foreign} stroke={themeColors.externalBorder} strokeDasharray={!isIndia ? "4 4" : "none"} />;
        })}

        {mapData.states && mapData.states.features.map((feature, i) => {
          const stateName = String(feature.properties.name || feature.properties.st_nm).toLowerCase();
          if (!stateName.includes('ladakh') && !stateName.includes('jammu') && !stateName.includes('kashmir') && !stateName.includes('himachal')) return null;
          return <path key={`state-fill-${i}`} d={pathGenerator(feature)} fill={themeColors.targetStates} filter="url(#stateShadow)" />;
        })}

        {referenceLabels.map((ref, idx) => {
          const [px, py] = projection([ref.lon, ref.lat]);
          return (
            <text
              key={`ref-${idx}`} x={px} y={py}
              transform={`rotate(${ref.rot}, ${px}, ${py})`}
              textAnchor="middle"
              className={`text-[10px] md:text-[14px] font-bold tracking-widest uppercase opacity-30 pointer-events-none`}
              fill={ref.type === 'water' ? '#38bdf8' : (isDark ? '#94a3b8' : '#64748b')}
              style={{ fontStyle: ref.type === 'water' ? 'italic' : 'normal' }}
            >
              {ref.name}
            </text>
          );
        })}

        {mapData.rivers && mapData.rivers.features.map((f, i) => <path key={`r-${i}`} d={pathGenerator(f)} fill="none" stroke={themeColors.river} strokeWidth="0.8" opacity="0.6" />)}
        {mapData.lakes && mapData.lakes.features.map((f, i) => <path key={`l-${i}`} d={pathGenerator(f)} fill={themeColors.water} opacity="0.85" />)}
        {mapData.roads && mapData.roads.features.map((f, i) => <path key={`rd-${i}`} d={pathGenerator(f)} fill="none" stroke={themeColors.road} strokeWidth="0.5" opacity={themeColors.roadOpacity} />)}
      </>
    );
  }, [mapData, themeColors, pathGenerator, projection, isDark]);

  const activeRoutesLayer = useMemo(() => {
    return itineraryDays.map((day, idx) => {
      if (day.hideOnMap) return null;
      const isActive = activeDay === idx;
      const isFaded = activeDay !== null && activeDay !== idx;
      return (
        <g key={idx} style={{ opacity: isFaded ? 0.15 : 1 }} className="transition-opacity duration-500">
          {day.route.map((startId, i) => {
            if (i === day.route.length - 1) return null;
            const endId = day.route[i+1];
            const segKey = `${startId}->${endId}`;
            const snapped = snappedRoutes?.[segKey];
            const type = snapped?.type || 'extreme';
            
            const color = type === 'paved' ? '#3b82f6' : type === 'offroad' ? '#f59e0b' : '#ec4899';
            const dashArray = type === 'paved' ? 'none' : type === 'offroad' ? '5 5' : '2 4';
            
            const d = snapped ? coordLineGenerator(snapped.coords) : routeLineGenerator([startId, endId]);
            return (
              <path
                key={`${idx}-${i}`} d={d} fill="none" stroke={color} strokeWidth={isActive ? "4" : "3"}
                strokeLinecap="round" strokeDasharray={dashArray}
                filter={isActive ? "url(#routeGlow)" : "none"}
              />
            );
          })}
        </g>
      );
    });
  }, [itineraryDays, activeDay, snappedRoutes, coordLineGenerator, routeLineGenerator]);

  const mapPointsLayer = useMemo(() => {
    return (
      <>
        {mapData.states && mapData.states.features.map((feature, i) => {
          const stateName = String(feature.properties.name || feature.properties.st_nm).toLowerCase();
          if (!stateName.includes('ladakh') && !stateName.includes('jammu') && !stateName.includes('kashmir') && !stateName.includes('himachal')) return null;
          return <path key={`state-border-${i}`} d={pathGenerator(feature)} fill="none" stroke={themeColors.internalBorder} strokeWidth="2" />;
        })}

        {Object.entries(locations).map(([id, loc]) => {
          if (loc.hideOnMap) return null;
          const [px, py] = projection([loc.lon, loc.lat]);
          const isActive = activeDay === null || itineraryDays[activeDay]?.route.includes(id);
          const dynamicStroke = isDark ? "#27272a" : "#ffffff";
          const iconR = loc.icon === 'dot' ? 3 : 6;
          const tp = getTextPos(id, iconR);

          return (
            <g key={id} transform={`translate(${px}, ${py})`} className="cursor-pointer" style={{ opacity: isActive ? 1 : 0.2 }} onClick={() => setSelectedLoc(loc)}>
              {loc.icon === 'castle' && <circle r={iconR} fill="#52525b" stroke={dynamicStroke} strokeWidth="1" />}
              {loc.icon === 'star' && <circle r={iconR} fill={loc.isEpicPass ? '#d946ef' : '#4338ca'} stroke={dynamicStroke} strokeWidth="1" />}
              {loc.icon === 'alert' && <circle r={iconR} fill="#be123c" stroke={dynamicStroke} strokeWidth="1" />}
              {loc.icon === 'dot' && <circle r={iconR} fill="#a1a1aa" stroke={dynamicStroke} strokeWidth="1" />}
              
              <text x={tp.x} y={tp.y} textAnchor={tp.anchor} fontSize="8" fontWeight="600" className="pointer-events-none select-none" fill={isDark ? "white" : "#1e293b"} stroke={isDark ? "#09090b" : "#ffffff"} strokeWidth="2.5" paintOrder="stroke">{loc.name}</text>
            </g>
          );
        })}
      </>
    );
  }, [mapData, themeColors, pathGenerator, projection, activeDay, isDark]);

  return (
    <div className={`flex flex-col-reverse md:flex-row h-[100dvh] w-full overflow-hidden ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-sky-50 text-slate-900'}`}>
      <div ref={wrapperRef} className="absolute md:relative inset-0 md:inset-auto md:w-[65%] lg:w-[75%] h-full overflow-hidden z-10 touch-none" style={{ backgroundColor: themeColors.ocean }}>
        <div className="absolute top-6 left-6 z-20 flex flex-col gap-2">
          <button onClick={() => handleZoom(1.5)} className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow-lg border ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>+</button>
          <button onClick={() => handleZoom(0.666)} className={`w-10 h-10 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg border ${isDark ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>−</button>
        </div>
        
        {/* Horizontal Map Legend */}
        <div className={`absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4 md:gap-6 px-5 py-3 rounded-full shadow-lg border text-[10px] md:text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-300 backdrop-blur-md' : 'bg-white/90 border-stone-200 text-slate-600 backdrop-blur-md'}`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 rounded bg-[#3b82f6]"></div> Paved
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 rounded bg-[#f59e0b] opacity-80" style={{ borderBottom: '2px dashed #f59e0b' }}></div> Off-road
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 rounded bg-[#ec4899] opacity-80" style={{ borderBottom: '2px dotted #ec4899' }}></div> Extreme
          </div>
        </div>

        <svg 
          ref={svgRef} viewBox="0 0 1200 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
          onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
          className="cursor-grab active:cursor-grabbing"
        >
          <defs>
            <filter id="routeGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
            <filter id="stateShadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={isDark ? "#000000" : "#475569"} floodOpacity={isDark ? "0.6" : "0.2"} /></filter>
          </defs>
          <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`} style={{ willChange: 'transform', transition: isDragging.current ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            
            {staticMapLayers}
            {activeRoutesLayer}
            {mapPointsLayer}

          </g>
        </svg>
      </div>

      <div className={`md:hidden absolute inset-0 bg-black/60 z-10 transition-opacity duration-500 pointer-events-none ${isMobileSheetExpanded ? 'opacity-100' : 'opacity-0'}`} />

      <div className={`absolute md:relative bottom-0 left-0 w-full md:w-[35%] lg:w-[25%] md:min-w-[340px] flex flex-col shadow-[0_-15px_40px_rgba(0,0,0,0.4)] md:shadow-2xl z-20 transition-all duration-500 rounded-t-[32px] md:rounded-none border-t md:border-t-0 md:border-r ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-stone-200'} ${isMobileSheetExpanded ? 'h-[85dvh]' : 'h-auto max-h-[60dvh]'} md:h-full md:max-h-none`}>
        <div className="md:hidden flex justify-center w-full pt-4 pb-2 shrink-0 cursor-pointer" onClick={() => setIsMobileSheetExpanded(!isMobileSheetExpanded)}>
          <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-zinc-700' : 'bg-stone-300'}`}></div>
        </div>

        <div className="px-5 md:px-6 pt-1 md:pt-6 pb-3 md:pb-5 border-b border-inherit shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-lg md:text-xl font-black tracking-tighter italic">LADAKH TACTICAL</h1>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadMap} className={`p-2 rounded-full border ${isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-stone-300 bg-white text-slate-600'}`}>
                <Download size={14} />
              </button>
              <button onClick={() => setIsDark(!isDark)} className={`p-2 rounded-full border ${isDark ? 'border-zinc-700 bg-zinc-800' : 'border-stone-300 bg-white'}`}>
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest font-bold border-b-2 border-blue-500 text-blue-500 inline-block pb-2">Location Intel</div>
        </div>

        <div className="px-5 md:px-6 py-4 shrink-0">
          <div className={`p-4 rounded-xl border md:min-h-[190px] ${isDark ? 'bg-zinc-950/50 border-zinc-800' : 'bg-stone-50 border-stone-200'}`}>
            <h2 className="font-bold text-base md:text-lg leading-tight mb-1">{selectedLoc.name}</h2>
            <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold opacity-60 mb-2 tracking-widest uppercase"><Mountain size={10} /> {selectedLoc.elev} | {selectedLoc.region}</div>
            
            {/* Amenities Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedLoc.amenities?.map((amenity, idx) => (
                <span key={idx} className={`px-2 py-1 rounded text-[8px] md:text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-stone-200 text-slate-600'}`}>
                  {amenity === 'fuel' && <Fuel size={10} className="text-orange-500" />}
                  {amenity === 'food' && <Utensils size={10} className="text-green-500" />}
                  {amenity === 'network' && <Wifi size={10} className="text-blue-500" />}
                  {amenity === 'mechanic' && <Wrench size={10} className="text-slate-500" />}
                  {amenity}
                </span>
              ))}
            </div>
            
            <p className={`text-[11px] md:text-xs opacity-80 mb-3 ${!isMobileSheetExpanded && isMobile ? 'line-clamp-2' : ''}`}>{selectedLoc.desc}</p>
          </div>
        </div>

        <div className={`flex-1 flex flex-col px-5 md:px-6 pb-4 overflow-hidden min-h-0`}>
          <div className={`flex items-center justify-between mb-3 shrink-0 ${!isMobileSheetExpanded ? 'cursor-pointer md:cursor-default' : ''}`} onClick={() => isMobile && setIsMobileSheetExpanded(true)}>
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 flex items-center gap-2"><CalendarDays size={12} /> 11-Day Journey</p>
            {!isMobileSheetExpanded && isMobile && <span className="text-[9px] uppercase font-bold text-blue-500">Tap to view</span>}
          </div>

          <div className={`flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5 pb-4 ${!isMobileSheetExpanded ? 'hidden md:block' : 'block'}`}>
            {itineraryDays.map((day, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveDay(activeDay !== idx ? idx : null);
                  setSelectedLoc(activeDay !== idx ? locations[day.route[day.route.length - 1]] : locations.leh);
                  if (isMobile && activeDay !== idx) setIsMobileSheetExpanded(false);
                }}
                className={`w-full text-left p-3 rounded-lg border flex items-center justify-between group ${activeDay === idx ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : isDark ? 'bg-zinc-800/30 border-zinc-700' : 'bg-white border-stone-200'}`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className={`text-[8px] font-black uppercase tracking-widest mb-0.5 flex items-center gap-1 ${activeDay === idx ? 'text-blue-100' : 'text-zinc-500'}`}>
                    <span>Day {day.day}</span>
                  </div>
                  <div className="font-bold text-sm truncate">{day.title}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
