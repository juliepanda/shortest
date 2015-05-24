import overpy
import json


api = overpy.Overpass()

result = api.query("""
    [out:json][timeout:25];
            (
                node["height"]["building"](40.769,-74.0,40.77,-73.99);
                way["height"]["building"](40.769,-74.0,40.77,-73.99);
                relation["height"]["building"](40.769,-74.0,40.77,-73.99);
            );
        out;
        """)


for node in result.nodes:
     print json.dumps(node)
































