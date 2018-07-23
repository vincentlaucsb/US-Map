SELECT jsonb_build_object(
    0.2, percentile_cont(0.2) WITHIN GROUP(ORDER BY "{col}"),
    0.4, percentile_cont(0.4) WITHIN GROUP(ORDER BY "{col}"),
    0.6, percentile_cont(0.6) WITHIN GROUP(ORDER BY "{col}"),
    0.8, percentile_cont(0.8) WITHIN GROUP(ORDER BY "{col}")
) FROM "ACS_16_5YR_S0801_with_ann.csv"