SELECT jsonb_build_object(
    0.125, percentile_cont(0.125) WITHIN GROUP(ORDER BY "{col}"),
    0.25, percentile_cont(0.25) WITHIN GROUP(ORDER BY "{col}"),
    0.375, percentile_cont(0.375) WITHIN GROUP(ORDER BY "{col}"),
    0.5, percentile_cont(0.5) WITHIN GROUP(ORDER BY "{col}"),
    0.625, percentile_cont(0.625) WITHIN GROUP(ORDER BY "{col}"),
    0.75, percentile_cont(0.75) WITHIN GROUP(ORDER BY "{col}"),
    0.875, percentile_cont(0.875) WITHIN GROUP(ORDER BY "{col}")
) FROM "ACS_16_5YR_S0801_with_ann.csv"