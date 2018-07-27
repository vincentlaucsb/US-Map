SELECT
	jsonb_build_object('bindto', '#best-commutes') ||
	jsonb_build_object('data',
		jsonb_build_object('columns',
            jsonb_build_array(
                jsonb_build_array('Mean Commute Time') || to_jsonb(array_to_json(array_agg("HC01_EST_VC55")))
            )
        ) ||
		'{"types": { "Mean Commute Time": "bar" }}'::jsonb
	) ||
	jsonb_build_object('axis',
		jsonb_build_object('x', jsonb_build_object(
            'type', 'category',
            'height', 70,
            'categories', array_agg("GEO.display-label")
        )) ||
        jsonb_build_object('y', jsonb_build_object(
            'label', 'Minutes'
        ))
    ) ||
    jsonb_build_object('grid',
        jsonb_build_object('y', jsonb_build_object('lines',
            jsonb_build_array(
                jsonb_build_object('value', (SELECT AVG("HC01_EST_VC55") FROM "ACS_16_5YR_S0801_with_ann.csv")) ||
                jsonb_build_object('text', 'National Average')
            )
        ))
    ) ||
	'{"bar": { "width": { "ratio": 0.5 }}}'::jsonb
FROM
(SELECT
	"GEO.display-label", "HC01_EST_VC55"
FROM "ACS_16_5YR_S0801_with_ann.csv"
ORDER BY "HC01_EST_VC55" ASC
LIMIT 20) as subquery