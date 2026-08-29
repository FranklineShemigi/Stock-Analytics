// ========================================
// NSE Market Analytics
// Historical Data Loader
// ========================================


const NSE_START_YEAR = 2007;

const NSE_END_YEAR = 2026;


// ========================================
// Load One Year's Data
// ========================================

async function loadYearData(year) {

    const file =
        `data/prices/NSE_${year}.json`;


    console.log(
        `Loading ${file}...`
    );


    const response =
        await fetch(file);


    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status} while loading ${file}`
        );

    }


    const data =
        await response.json();


    if (!Array.isArray(data)) {

        throw new Error(
            `${file} does not contain an array`
        );

    }


    return data;

}


// ========================================
// Normalize NSE Record
// ========================================

function normalizePriceRecord(record) {

    return {

        // ===== Identification =====

        ticker:
            record.code,

        name:
            record.name,

        date:
            record.date,


        // ===== Price =====

        close:
            record.day_price,

        previous:
            record.previous,

        high:
            record.day_high,

        low:
            record.day_low,


        // ===== Market Data =====

        volume:
            record.volume,


        // ===== Performance =====

        change:
            record.change,

        change_percent:
            record.change_percent,


        // ===== 52 Week Data =====

        week52_low:
            record.week52_low,

        week52_high:
            record.week52_high,


        // ===== Adjusted Price =====

        adjusted_price:
            record.adjusted_price

    };

}


// ========================================
// Load All Historical Prices
// ========================================

async function loadHistoricalPrices() {

    const allPrices = [];


    for (
        let year = NSE_START_YEAR;
        year <= NSE_END_YEAR;
        year++
    ) {

        const yearData =
            await loadYearData(year);


        const normalizedData =
            yearData.map(
                normalizePriceRecord
            );


        allPrices.push(
            ...normalizedData
        );


        console.log(
            `${year}: ${normalizedData.length} records loaded`
        );

    }


    // ====================================
    // Sort Chronologically
    // ====================================

    allPrices.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );


    console.log(
        `Total historical records: ${allPrices.length}`
    );


    return allPrices;

}