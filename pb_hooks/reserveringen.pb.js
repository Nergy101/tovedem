/* Custom API endpoint to get reservation totals (privacy-safe - no personal data) */
routerAdd("GET", "/reserveringen/totals", (e) => {
    try {
        // Read query parameters - query is an object/dict, not a method
        // Per PocketBase docs: e.requestInfo().query["search"] or e.request.url.query().get("search")
        const voorstellingId = e.requestInfo().query["voorstellingId"];
        
        if (!voorstellingId) {
            throw new BadRequestError("voorstellingId query parameter is required");
        }
        
        // Fetch records using Record operations API
        // Per PocketBase docs: https://pocketbase.io/docs/js-records/
        // Use findRecordsByFilter with parameter binding to prevent injection
        const reservations = $app.findRecordsByFilter(
            "reserveringen",
            "voorstelling = {:voorstellingId}",
            "-created",
            500, // limit
            0,   // offset
            { voorstellingId: voorstellingId } // filter params
        );
        
        // Calculate totals - only access numeric fields (privacy-safe)
        // No personal data exposed - we only sum the amount fields
        let datum_tijd_1_total = 0;
        let datum_tijd_2_total = 0;
        
        for (const reservation of reservations) {
            datum_tijd_1_total += reservation.getInt("datum_tijd_1_aantal") || 0;
            datum_tijd_2_total += reservation.getInt("datum_tijd_2_aantal") || 0;
        }
        
        // Return only aggregated totals - no personal data
        return e.json(200, {
            datum_tijd_1_total: datum_tijd_1_total,
            datum_tijd_2_total: datum_tijd_2_total,
        });
    } catch (error) {
        $app.logger().error("Error in /reserveringen/totals:", error);
        throw new BadRequestError("Failed to calculate reservation totals: " + error.message);
    }
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
    
    // Fetch existing reservations using Record operations API
    // Per PocketBase docs: https://pocketbase.io/docs/js-records/
    const existingReservations = $app.findRecordsByFilter(
        "reserveringen",
        "voorstelling = {:voorstellingId}",
        "-created",
        500, // limit
        0,   // offset
        { voorstellingId: voorstellingId } // filter params
    );
    
    // Calculate existing totals - only access numeric fields
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

