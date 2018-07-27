SELECT
	jsonb_build_object('bindto', '#worst-commutes') ||
	jsonb_build_object('data',
		jsonb_build_object('columns',
            jsonb_build_array(
                jsonb_build_array('Mean Commute Time') || to_jsonb(array_to_json(array_agg("HC01_EST_VC55"))),
                jsonb_build_array('National Average') || to_jsonb(array_fill((SELECT AVG("HC01_EST_VC55") FROM "ACS_16_5YR_S0801_with_ann.csv"), ARRAY[25]))
            )
        ) ||
		'{"types": { "Mean Commute Time": "bar", "National Average": "line" }}'::jsonb
	) ||
	jsonb_build_object('axis',
		jsonb_build_object('x',
			jsonb_build_object('type', 'category') ||
			jsonb_build_object('categories', array_agg("GEO.display-label"))
		)
	) ||
	'{"bar": { "width": { "ratio": 0.5 }}}'::jsonb
FROM
(SELECT
	"GEO.display-label", "HC01_EST_VC55"
FROM "ACS_16_5YR_S0801_with_ann.csv"
ORDER BY "HC01_EST_VC55" DESC
LIMIT 25) as subquery