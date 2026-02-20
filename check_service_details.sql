-- Check what details exist in services
SELECT 
    service_id,
    type,
    title,
    subtitle,
    details->'from' as "from",
    details->'to' as "to",
    details->'hospital' as hospital,
    details->'cinema' as cinema,
    details->'departure' as departure
FROM services 
LIMIT 10;
