import json

with open('gz_2010_us_050_00_500k.json', 'r') as infile:
    out = json.loads(infile.read())
    with open('gz_2010_us_050_00_500k_pg.json', 'w') as outfile:
        outfile.write(json.dumps(out))