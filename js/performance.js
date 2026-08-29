// ========================================
// NSE Market Analytics
// Performance Calculation Engine
// ========================================


// ===== Calculate Percentage Performance =====

function calculatePerformance(startPrice, endPrice) {

    if (startPrice === 0) {
        return 0;
    }

    return ((endPrice - startPrice) / startPrice) * 100;
}


// ===== Get Prices For A Company =====

function getCompanyPrices(prices, ticker) {

    return prices
        .filter(price => price.ticker === ticker)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

}


// ===== Get Period Start Date =====

function getPeriodStartDate(latestDate, period) {

    const date = new Date(latestDate);

    switch (period) {

        case "1D":
            date.setDate(date.getDate() - 1);
            break;

        case "1W":
            date.setDate(date.getDate() - 7);
            break;

        case "1M":
            date.setMonth(date.getMonth() - 1);
            break;

        case "3M":
            date.setMonth(date.getMonth() - 3);
            break;

        case "6M":
            date.setMonth(date.getMonth() - 6);
            break;

        case "1Y":
            date.setFullYear(date.getFullYear() - 1);
            break;

        case "5Y":
            date.setFullYear(date.getFullYear() - 5);
            break;

        case "YTD":
            date.setMonth(0);
            date.setDate(1);
            break;

        case "ALL":
            return null;

        default:
            return null;
    }

    return date;
}


// ===== Get Period Start/End Bounds =====
//
// Wraps getPeriodStartDate to also support a
// "CUSTOM" period bounded by calendar years, e.g.
// { fromYear: 2015, toYear: 2020 }.
//
// Returns { startDate, endDate }. Either may be
// null, meaning "no bound" (use earliest/latest
// available price).

function getPeriodBounds(latestDate, period, customRange) {

    if (period === "CUSTOM" && customRange) {

        const startDate =
            new Date(
                customRange.fromYear,
                0,
                1
            );

        const endDate =
            new Date(
                customRange.toYear,
                11,
                31,
                23,
                59,
                59
            );

        return {
            startDate,
            endDate:
                endDate > latestDate
                    ? latestDate
                    : endDate
        };

    }

    return {
        startDate:
            getPeriodStartDate(
                latestDate,
                period
            ),
        endDate: latestDate
    };

}


// ===== Find Closest Available Price =====

function findClosestPrice(prices, targetDate) {

    let closestPrice = null;

    let smallestDifference = Infinity;

    prices.forEach(price => {

        const priceDate = new Date(price.date);

        const difference =
            Math.abs(priceDate - targetDate);

        if (difference < smallestDifference) {

            smallestDifference = difference;

            closestPrice = price;

        }

    });

    return closestPrice;
}


// ===== Calculate Company Performance =====

function calculateCompanyPerformance(
    company,
    prices,
    period = "1M",
    customRange = null
) {

    const companyPrices =
        getCompanyPrices(
            prices,
            company.ticker
        );

    if (companyPrices.length < 2) {

        return {

            ...company,

            performance: 0,

            startPrice: null,

            currentPrice: null

        };

    }


    // Overall latest available price (used to
    // anchor relative periods like "1M")

    const overallLatest =
        companyPrices[
            companyPrices.length - 1
        ];


    // Determine period bounds

    const { startDate, endDate } =
        getPeriodBounds(
            new Date(overallLatest.date),
            period,
            customRange
        );


    // Restrict candidates to prices at or
    // before the end bound

    const pricesInRange =
        endDate
            ? companyPrices.filter(
                price =>
                    new Date(price.date) <=
                    endDate
            )
            : companyPrices;


    if (pricesInRange.length === 0) {

        return {

            ...company,

            performance: 0,

            startPrice: null,

            currentPrice: null

        };

    }


    const latestPrice =
        pricesInRange[
            pricesInRange.length - 1
        ];


    // Find closest historical price to the
    // start bound (within the same range)

    const startingPrice =
        startDate
            ? findClosestPrice(
                pricesInRange,
                startDate
            )
            : pricesInRange[0];


    if (!startingPrice) {

        return {

            ...company,

            performance: 0,

            startPrice: null,

            currentPrice:
                latestPrice.close

        };

    }


    // Calculate return

    const performance =
        calculatePerformance(
            startingPrice.close,
            latestPrice.close
        );


    return {

        ...company,

        startPrice:
            startingPrice.close,

        currentPrice:
            latestPrice.close,

        performance:
            performance

    };

}


// ===== Rank Companies =====

function rankCompanies(
    companies,
    prices,
    period = "1M",
    customRange = null
) {

    const results =
        companies.map(company => {

            return calculateCompanyPerformance(
                company,
                prices,
                period,
                customRange
            );

        });


    return results.sort(
        (a, b) =>
            b.performance -
            a.performance
    );

}