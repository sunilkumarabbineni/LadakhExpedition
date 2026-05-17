"""
Snap expedition routes to actual road geometry from GIS data.

Builds a road network graph from the roads GeoJSON, then for each route
segment between two waypoints, finds the shortest path along roads.
Outputs snapped route coordinates as a JSON file for the frontend.
"""
import json
import math
import networkx as nx
from collections import defaultdict

# =====================================================================
# 1. LOAD ROAD DATA
# =====================================================================
print("1. Loading road and river GeoJSON...")
with open('../public/data/roads.geojson') as f:
    roads_data = json.load(f)
with open('../public/data/rivers.geojson') as f:
    rivers_data = json.load(f)

# =====================================================================
# 2. BUILD ROAD AND RIVER NETWORK GRAPHS
# =====================================================================
print("2. Building network graphs...")

# Round coordinates to snap nearby nodes together
# ~100m precision at these latitudes
PRECISION = 3  # decimal places

def round_coord(lon, lat):
    return (round(lon, PRECISION), round(lat, PRECISION))

G = nx.Graph()

for feat in roads_data['features']:
    geom = feat['geometry']
    road_type = feat['properties'].get('RTT_DESCRI', 'Unknown')

    lines = []
    if geom['type'] == 'LineString':
        lines = [geom['coordinates']]
    elif geom['type'] == 'MultiLineString':
        lines = geom['coordinates']

    for coords in lines:
        for i in range(len(coords) - 1):
            n1 = round_coord(coords[i][0], coords[i][1])
            n2 = round_coord(coords[i + 1][0], coords[i + 1][1])

            # Weight = geographic distance in degrees (approx)
            dist = math.sqrt((n1[0] - n2[0])**2 + (n1[1] - n2[1])**2)

            # Add nodes with their coordinates
            G.add_node(n1, lon=n1[0], lat=n1[1])
            G.add_node(n2, lon=n2[0], lat=n2[1])
            G.add_edge(n1, n2, weight=dist, road_type=road_type)

G_rivers = nx.Graph()
for feat in rivers_data['features']:
    geom = feat['geometry']
    if not geom: continue
    
    lines = []
    if geom['type'] == 'LineString':
        lines = [geom['coordinates']]
    elif geom['type'] == 'MultiLineString':
        lines = geom['coordinates']

    for coords in lines:
        for i in range(len(coords) - 1):
            n1 = round_coord(coords[i][0], coords[i][1])
            n2 = round_coord(coords[i + 1][0], coords[i + 1][1])
            dist = math.sqrt((n1[0] - n2[0])**2 + (n1[1] - n2[1])**2)
            G_rivers.add_node(n1, lon=n1[0], lat=n1[1])
            G_rivers.add_node(n2, lon=n2[0], lat=n2[1])
            G_rivers.add_edge(n1, n2, weight=dist)

print(f"   Road Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
print(f"   River Graph: {G_rivers.number_of_nodes()} nodes, {G_rivers.number_of_edges()} edges")

# =====================================================================
# 3. WAYPOINT DEFINITIONS
# =====================================================================
locations = {
    'srinagar': (74.79, 34.09), 'sonamarg': (75.2925, 34.3015),
    'zojila': (75.4719, 34.2789), 'drass': (75.751, 34.428),
    'kargil': (76.1256, 34.5594), 'mulbekh': (76.45, 34.583),
    'namikala': (76.5667, 34.3667), 'fotula': (76.7014, 34.2892),
    'lamayuru': (76.774, 34.281), 'magnetichill': (77.345, 34.172),
    'sangam': (77.332, 34.165), 'leh': (77.5795, 34.1483),
    'khardungla': (77.6042, 34.2783), 'diskit': (77.5667, 34.55),
    'nubra': (77.4667, 34.5833),
    'agham': (77.8454, 34.3289), 'shyok': (78.1399, 34.1781),
    'durbuk': (78.1034, 34.1206), 'tangste': (78.1677, 34.0301),
    'spangmik': (78.4573, 33.9072), 'pangong': (78.525, 33.85),
    'merak': (78.5912, 33.7974), 'chushul': (78.6667, 33.6),
    'rezangla': (78.8494, 33.4188), 'tsagala': (78.85, 33.25),
    'lomabridge': (78.8, 33.2), 'hanle': (78.9642, 32.7794),
    'phoTila': (79.1167, 32.7833), 'ukdungle': (79.4167, 32.8833),
    'chisumlebridge': (79.5, 32.8167), 'umlingla': (79.27, 32.693),
    'mahebridge': (78.5426, 33.2576), 'puga': (78.313, 33.2247),
    'tsomoriri': (78.3, 32.9167), 'kyagartso': (78.307, 33.109),
    'tsokar': (78.0, 33.3), 'debring': (77.8167, 33.35),
    'pang': (77.75, 33.1333), 'lachulungla': (77.6333, 33.1),
    'nakeela': (77.5833, 33.0667), 'gataloops': (77.55, 33.0167),
    'sarchu': (77.53, 32.89), 'baralachala': (77.4167, 32.75),
    'surajtaal': (77.3977, 32.7627), 'darcha': (77.2143, 32.6732),
    'jispa': (77.1833, 32.6333), 'keylong': (77.0333, 32.5667),
    'tandi': (76.9667, 32.55), 'sissu': (77.1167, 32.4833),
    'ataltunnel': (77.1483, 32.4012), 'manali': (77.1887, 32.2396),
}

# Routes by day
routes = {
    'day2': ['srinagar', 'sonamarg', 'zojila', 'drass', 'kargil'],
    'day3': ['kargil', 'namikala', 'fotula', 'sangam', 'magnetichill', 'leh'],
    'day4': ['leh', 'khardungla', 'diskit', 'nubra'],
    'day5': ['nubra', 'agham', 'tangste', 'spangmik', 'pangong'],
    'day6': ['pangong', 'merak', 'chushul', 'rezangla', 'tsagala', 'lomabridge', 'hanle'],
    'day7': ['hanle', 'phoTila', 'umlingla'],
    'day8': ['hanle', 'lomabridge', 'mahebridge', 'puga', 'kyagartso', 'tsomoriri'],
    'day9': ['tsomoriri', 'kyagartso', 'puga', 'tsokar', 'debring', 'nakeela', 'gataloops', 'sarchu', 'baralachala', 'surajtaal', 'darcha', 'jispa'],
    'day10': ['jispa', 'keylong', 'tandi', 'sissu', 'ataltunnel', 'manali'],
}

# Segments to force river graph matching
river_overrides = {
    'drass->kargil',
    'lomabridge->hanle',
    'hanle->lomabridge',
    'mahebridge->puga',
    'puga->mahebridge',
    'puga->kyagartso',
    'kyagartso->puga'
}

# Remaining segments fall back to graph
custom_overrides = set()

# Explicitly force styling for specific segments regardless of graph used
styling_overrides = {
    'hanle->phoTila': 'extreme',
    'phoTila->umlingla': 'extreme',
    'khardungla->diskit': 'offroad',
    'diskit->nubra': 'offroad',
    'nubra->agham': 'offroad',
    'tangste->spangmik': 'offroad',
    'spangmik->pangong': 'offroad',
    'pangong->merak': 'extreme',
    'merak->chushul': 'extreme',
    'chushul->rezangla': 'extreme',
    'rezangla->tsagala': 'extreme',
    'tsagala->lomabridge': 'extreme'
}

# =====================================================================
# 4. FIND NEAREST ROAD NODE FOR EACH WAYPOINT
# =====================================================================
print("3. Snapping waypoints to nearest road nodes...")

def find_nearest_node(lon, lat, graph, max_dist=0.15):
    """Find the nearest graph node to a given coordinate."""
    best_node = None
    best_dist = float('inf')
    target = (lon, lat)

    for node in graph.nodes():
        d = math.sqrt((node[0] - lon)**2 + (node[1] - lat)**2)
        if d < best_dist:
            best_dist = d
            best_node = node

    if best_dist > max_dist:
        return None, best_dist
    return best_node, best_dist

waypoint_road_nodes = {}
waypoint_river_nodes = {}

for loc_id, (lon, lat) in locations.items():
    # Find nearest road node
    r_node, r_dist = find_nearest_node(lon, lat, G, max_dist=0.2)
    if r_node:
        waypoint_road_nodes[loc_id] = r_node
        
    # Find nearest river node
    riv_node, riv_dist = find_nearest_node(lon, lat, G_rivers, max_dist=0.2)
    if riv_node:
        waypoint_river_nodes[loc_id] = riv_node

# =====================================================================
# 5. FIND SHORTEST PATHS ALONG ROADS
# =====================================================================
print("\n4. Computing shortest road paths for each segment...")

snapped_routes = {}
segment_info = {}

for day_name, route in routes.items():
    print(f"\n  {day_name.upper()}:")
    day_segments = {}

    for i in range(len(route) - 1):
        from_id = route[i]
        to_id = route[i + 1]
        seg_key = f"{from_id}->{to_id}"

        from_loc = locations[from_id]
        to_loc = locations[to_id]
        
        is_river = seg_key in river_overrides
        graph_to_use = G_rivers if is_river else G
        from_node = waypoint_river_nodes.get(from_id) if is_river else waypoint_road_nodes.get(from_id)
        to_node = waypoint_river_nodes.get(to_id) if is_river else waypoint_road_nodes.get(to_id)
        target_type = 'offroad' if is_river else 'paved'

        if seg_key in custom_overrides:
            coords = [list(from_loc), list(to_loc)]
            day_segments[seg_key] = {
                'coords': coords,
                'type': 'paved',
                'nodes': 0
            }
            print(f"    {seg_key:40s}: PAVED (Custom Override)")
        elif from_node and to_node and from_node in graph_to_use and to_node in graph_to_use:
            try:
                # Find shortest path along network
                path_nodes = nx.shortest_path(graph_to_use, from_node, to_node, weight='weight')

                # Convert graph nodes back to [lon, lat] coordinate pairs
                coords = []
                coords.append(list(from_loc))
                for node in path_nodes:
                    coords.append([node[0], node[1]])
                coords.append(list(to_loc))

                day_segments[seg_key] = {
                    'coords': coords,
                    'type': target_type,
                    'nodes': len(path_nodes)
                }
                print(f"    {seg_key:40s}: {target_type.upper()} ({len(path_nodes)} {'river' if is_river else 'road'} nodes)")

            except nx.NetworkXNoPath:
                # No path found - mark as extreme with direct line
                coords = [list(from_loc), list(to_loc)]
                day_segments[seg_key] = {
                    'coords': coords,
                    'type': 'extreme',
                    'nodes': 0
                }
                print(f"    {seg_key:40s}: EXTREME (no path)")
        else:
            # One or both endpoints not near network
            coords = [list(from_loc), list(to_loc)]
            missing = []
            if not from_node: missing.append(from_id)
            if not to_node: missing.append(to_id)
            day_segments[seg_key] = {
                'coords': coords,
                'type': 'extreme',
                'nodes': 0
            }
            print(f"    {seg_key:40s}: EXTREME (no {'river' if is_river else 'road'} near {', '.join(missing)})")

        
        # Apply specific user-requested overrides
        if seg_key in styling_overrides:
            day_segments[seg_key]['type'] = styling_overrides[seg_key]

    snapped_routes[day_name] = day_segments

# =====================================================================
# 6. SIMPLIFY PATHS (reduce point count while keeping shape)
# =====================================================================
print("\n5. Simplifying paths (Douglas-Peucker)...")

def douglas_peucker(points, epsilon=0.005):
    """Simplify a polyline using Douglas-Peucker algorithm."""
    if len(points) <= 2:
        return points

    # Find the point with the maximum distance from the line(start, end)
    start = points[0]
    end = points[-1]

    max_dist = 0
    max_idx = 0

    for i in range(1, len(points) - 1):
        # Perpendicular distance from point to line
        dx = end[0] - start[0]
        dy = end[1] - start[1]
        line_len_sq = dx * dx + dy * dy

        if line_len_sq == 0:
            dist = math.sqrt((points[i][0] - start[0])**2 + (points[i][1] - start[1])**2)
        else:
            t = max(0, min(1, ((points[i][0] - start[0]) * dx + (points[i][1] - start[1]) * dy) / line_len_sq))
            proj_x = start[0] + t * dx
            proj_y = start[1] + t * dy
            dist = math.sqrt((points[i][0] - proj_x)**2 + (points[i][1] - proj_y)**2)

        if dist > max_dist:
            max_dist = dist
            max_idx = i

    if max_dist > epsilon:
        left = douglas_peucker(points[:max_idx + 1], epsilon)
        right = douglas_peucker(points[max_idx:], epsilon)
        return left[:-1] + right
    else:
        return [start, end]

total_before = 0
total_after = 0

for day_name, segments in snapped_routes.items():
    for seg_key, seg_data in segments.items():
        coords = seg_data['coords']
        total_before += len(coords)
        if len(coords) > 3 and seg_data['type'] == 'paved':
            simplified = douglas_peucker(coords, epsilon=0.003)
            seg_data['coords'] = simplified
            total_after += len(simplified)
        else:
            total_after += len(coords)

print(f"   Points: {total_before} -> {total_after} ({100 - total_after/max(total_before,1)*100:.0f}% reduction)")

# =====================================================================
# 7. BUILD OUTPUT FORMAT
# =====================================================================
print("\n6. Exporting snapped routes...")

# Output: { "segmentKey": [[lon, lat], ...], ... }
output = {}
for day_name, segments in snapped_routes.items():
    for seg_key, seg_data in segments.items():
        output[seg_key] = {
            'coords': seg_data['coords'],
            'type': seg_data['type']
        }

output_path = '../public/data/snapped_routes.json'
with open(output_path, 'w') as f:
    json.dump(output, f, separators=(',', ':'))

file_size = len(json.dumps(output, separators=(',', ':')))
print(f"   Written to {output_path} ({file_size / 1024:.1f} KB)")
print(f"   Total segments: {len(output)}")
print(f"   Paved: {sum(1 for v in output.values() if v['type'] == 'paved')}")
print(f"   Off-road: {sum(1 for v in output.values() if v['type'] == 'offroad')}")

print("\nDONE! Snapped routes are ready for the frontend.")
