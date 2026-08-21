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

        default:
            return null;
    }

    return date;
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
    period = "1M"
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


    // Latest available price

    const latestPrice =
        companyPrices[
            companyPrices.length - 1
        ];


    // Determine period start

    const targetDate =
        getPeriodStartDate(
            latestPrice.date,
            period
        );


    // Find closest historical price

    const startingPrice =
        findClosestPrice(
            companyPrices,
            targetDate
        );


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
    period = "1M"
) {

    const results =
        companies.map(company => {

            return calculateCompanyPerformance(
                company,
                prices,
                period
            );

        });


    return results.sort(
        (a, b) =>
            b.performance -
            a.performance
    );

}