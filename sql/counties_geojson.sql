SELECT
    jsonb_build_object('type', 'FeatureCollection') ||
    jsonb_build_object('features', array_agg(features))
FROM (
WITH _features AS (
    SELECT jsonb_array_elements(data->'features') AS features
    FROM counties
)
SELECT
    F.features || jsonb_build_object('properties', F.features->'properties' || jsonb_build_object(
        'HC01_EST_VC55',D1."HC01_EST_VC55",
        'HD01_VD01',D2."HD01_VD01",
        'HD01_VD02',D2."HD01_VD02",
        'HD01_VD03',D2."HD01_VD03",
        'HD01_VD04',D2."HD01_VD04",
        'HD01_VD05',D2."HD01_VD05",
        'HD01_VD06',D2."HD01_VD06",
        'HD01_VD07',D2."HD01_VD07",
        'HD01_VD08',D2."HD01_VD08",
        'HD01_VD09',D2."HD01_VD09",
        'HD01_VD10',D2."HD01_VD10",
        'HD01_VD11',D2."HD01_VD11",
        'HD01_VD12',D2."HD01_VD12",
        'HD01_VD13',D2."HD01_VD13"
    )) AS features
FROM
    _features F,
    "ACS_16_5YR_S0801_with_ann.csv" D1,
    "ACS_16_5YR_B08303.csv" D2
WHERE
    D1."GEO.id" = (F.features->'properties'->>'GEO_ID') AND
    D2."GEO.id" = (F.features->'properties'->>'GEO_ID') AND
    D1."GEO.id" = D2."GEO.id")
as subquery