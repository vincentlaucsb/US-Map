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
        'HC01_EST_VC46',D1."HC01_EST_VC46",
        'HC02_EST_VC46',D1."HC02_EST_VC46",
        'HC03_EST_VC46',D1."HC03_EST_VC46",
        'HC01_EST_VC47',D1."HC01_EST_VC47",
        'HC02_EST_VC47',D1."HC02_EST_VC47",
        'HC03_EST_VC47',D1."HC03_EST_VC47",
        'HC01_EST_VC48',D1."HC01_EST_VC48",
        'HC02_EST_VC48',D1."HC02_EST_VC48",
        'HC03_EST_VC48',D1."HC03_EST_VC48",
        'HC01_EST_VC49',D1."HC01_EST_VC49",
        'HC02_EST_VC49',D1."HC02_EST_VC49",
        'HC03_EST_VC49',D1."HC03_EST_VC49",
        'HC01_EST_VC50',D1."HC01_EST_VC50",
        'HC02_EST_VC50',D1."HC02_EST_VC50",
        'HC03_EST_VC50',D1."HC03_EST_VC50",
        'HC01_EST_VC51',D1."HC01_EST_VC51",
        'HC02_EST_VC51',D1."HC02_EST_VC51",
        'HC03_EST_VC51',D1."HC03_EST_VC51",
        'HC01_EST_VC52',D1."HC01_EST_VC52",
        'HC02_EST_VC52',D1."HC02_EST_VC52",
        'HC03_EST_VC52',D1."HC03_EST_VC52",
        'HC01_EST_VC53',D1."HC01_EST_VC53",
        'HC02_EST_VC53',D1."HC02_EST_VC53",
        'HC03_EST_VC53',D1."HC03_EST_VC53",
        'HC01_EST_VC54',D1."HC01_EST_VC54",
        'HC02_EST_VC54',D1."HC02_EST_VC54",
        'HC03_EST_VC54',D1."HC03_EST_VC54",
        'HC01_EST_VC55',D1."HC01_EST_VC55",
        'HC02_EST_VC55',D1."HC02_EST_VC55",
        'HC03_EST_VC55',D1."HC03_EST_VC55",
        'STATE_NAME',S."STATE_NAME"
    )) AS features
FROM
    _features F,
    "ACS_16_5YR_S0801_with_ann.csv" D1,
    "state.txt" S
WHERE
    D1."GEO.id" = (F.features->'properties'->>'GEO_ID') AND
    S."STATE" = (F.features->'properties'->>'STATE')::bigint
) as subquery