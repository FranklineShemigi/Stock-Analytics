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
//
// Loads years [startYear, endYear] in parallel.
// A single bad/missing year file will NOT stop
// the others from loading - it is skipped with
// a console warning instead.
//
// onProgress(loadedYears, totalYears) is called
// after each year settles, so callers can show a
// loading indicator.
// ========================================

async function loadHistoricalPrices(
    startYear = NSE_START_YEAR,
    endYear = NSE_END_YEAR,
    onProgress = null
) {

    const years = [];

    for (
        let year = startYear;
        year <= endYear;
        year++
    ) {
        years.push(year);
    }


    let loadedCount = 0;

    const settled =
        await Promise.allSettled(
            years.map(year =>
                loadYearData(year).then(
                    yearData => {

                        loadedCount++;

                        if (onProgress) {
                            onProgress(
                                loadedCount,
                                years.length
                            );
                        }

                        return {
                            year,
                            yearData
                        };
                    },
                    error => {

                        loadedCount++;

                        if (onProgress) {
                            onProgress(
                                loadedCount,
                                years.length
                            );
                        }

                        throw error;
                    }
                )
            )
        );


    const allPrices = [];

    const failedYears = [];


    settled.forEach(result => {

        if (result.status === "fulfilled") {

            const { year, yearData } =
                result.value;

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

        } else {

            failedYears.push(
                result.reason
            );

            console.warn(
                "Skipping a year of price data:",
                result.reason
            );

        }

    });


    if (failedYears.length === years.length) {

        throw new Error(
            "Unable to load any price data."
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
        `Total historical records: ${allPrices.length} (${failedYears.length} year(s) failed to load)`
    );


    return allPrices;

}