import geopandas as gpd
import os

def process_gis_data():
    print("1. Setting up paths...")
    output_dir = '../public/data/'
    os.makedirs(output_dir, exist_ok=True)

    print("2. Loading raw GIS Shapefiles...")
    try:
        world = gpd.read_file('ne_10m_admin_0_countries.shp')
        roads = gpd.read_file('IND_roads.shp')
        lakes = gpd.read_file('IND_water_areas_dcw.shp')
        rivers = gpd.read_file('IND_water_lines_dcw.shp')
    except Exception as e:
        print(f"Error loading shapefiles: {e}")
        return

    # 3. Bounding box strictly for the expedition
    # Slightly wider than J&K to capture Pakistan/China for the grey background
    min_lon, min_lat = 72.0, 30.0
    max_lon, max_lat = 82.0, 37.0

    print("3. Clipping data to expedition bounds...")
    world_clipped = world.cx[min_lon:max_lon, min_lat:max_lat]
    roads_clipped = roads.cx[min_lon:max_lon, min_lat:max_lat]
    lakes_clipped = lakes.cx[min_lon:max_lon, min_lat:max_lat]
    rivers_clipped = rivers.cx[min_lon:max_lon, min_lat:max_lat]

    print("4. Exporting lightweight GeoJSONs to React public folder...")
    world_clipped.to_file(os.path.join(output_dir, 'world_borders.geojson'), driver="GeoJSON")
    roads_clipped.to_file(os.path.join(output_dir, 'roads.geojson'), driver="GeoJSON")
    lakes_clipped.to_file(os.path.join(output_dir, 'lakes.geojson'), driver="GeoJSON")
    rivers_clipped.to_file(os.path.join(output_dir, 'rivers.geojson'), driver="GeoJSON")
    
    print("SUCCESS! Local GIS data is ready for the frontend.")

if __name__ == "__main__":
    process_gis_data()