/* Custom API endpoint to get reservation totals (privacy-safe - no personal data) */
routerAdd("GET", "/reserveringen/totals", (c) => {
    const voorstellingId = c.request().query().get("voorstellingId");
    
    if (!voorstellingId) {
        throw new BadRequestError("voorstellingId query parameter is required");
    }
    
    // Query all reservations for this voorstelling
    // We'll only use the numeric fields we need (privacy-safe)
    const collection = $app.dao().findCollectionByNameOrId("reserveringen");
    const filter = `voorstelling = "${voorstellingId}"`;
    
    // Get all records matching the filter
    const reservations = $app.dao().findRecordsByFilter(
        collection.id,
        filter,
        "-created",
        500, // max records
        0    // offset
    );
    
    // Calculate totals - only access the numeric fields we need
    // This ensures no personal data (names, emails, etc.) is exposed
    let datum_tijd_1_total = 0;
    let datum_tijd_2_total = 0;
    
    for (const reservation of reservations) {
        // Only access the numeric fields - no personal data
        datum_tijd_1_total += reservation.getInt("datum_tijd_1_aantal") || 0;
        datum_tijd_2_total += reservation.getInt("datum_tijd_2_aantal") || 0;
    }
    
    // Return only aggregated totals - no personal data
    return c.json(200, {
        datum_tijd_1_total: datum_tijd_1_total,
        datum_tijd_2_total: datum_tijd_2_total,
    });
});

/* Server-side validation: Prevent creating reservations that exceed 100 people limit */
onRecordBeforeCreateRequest((e) => {
    const newRecord = e.record;
    const voorstellingId = newRecord.get("voorstelling");
    
    if (!voorstellingId) {
        return; // Let PocketBase handle missing required field
    }
    
    const datum_tijd_1_aantal = newRecord.getInt("datum_tijd_1_aantal") || 0;
    const datum_tijd_2_aantal = newRecord.getInt("datum_tijd_2_aantal") || 0;
    
    // Skip validation if both amounts are 0
    if (datum_tijd_1_aantal === 0 && datum_tijd_2_aantal === 0) {
        return;
    }
    
    // Query all existing reservations for this voorstelling
    const collection = $app.dao().findCollectionByNameOrId("reserveringen");
    const filter = `voorstelling = "${voorstellingId}"`;
    
    const existingReservations = $app.dao().findRecordsByFilter(
        collection.id,
        filter,
        "-created",
        500,
        0
    );
    
    // Calculate existing totals
    let existingTotalDate1 = 0;
    let existingTotalDate2 = 0;
    
    for (const reservation of existingReservations) {
        existingTotalDate1 += reservation.getInt("datum_tijd_1_aantal") || 0;
        existingTotalDate2 += reservation.getInt("datum_tijd_2_aantal") || 0;
    }
    
    // Validate limits
    const newTotalDate1 = existingTotalDate1 + datum_tijd_1_aantal;
    const newTotalDate2 = existingTotalDate2 + datum_tijd_2_aantal;
    
    if (newTotalDate1 > 100) {
        throw new BadRequestError(
            `Het maximum aantal reserveringen voor datum 1 is bereikt. ` +
            `Huidig totaal: ${existingTotalDate1}/100. ` +
            `U probeert ${datum_tijd_1_aantal} extra plaatsen te reserveren.`
        );
    }
    
    if (newTotalDate2 > 100) {
        throw new BadRequestError(
            `Het maximum aantal reserveringen voor datum 2 is bereikt. ` +
            `Huidig totaal: ${existingTotalDate2}/100. ` +
            `U probeert ${datum_tijd_2_aantal} extra plaatsen te reserveren.`
        );
    }
}, "reserveringen");

