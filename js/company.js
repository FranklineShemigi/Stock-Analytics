// ========================================
// NSE Market Analytics
// Company Detail Page
// ========================================


let companies = [];

let prices = [];

let selectedCompany = null;

let currentPeriod = "1M";


// ========================================
// Get Ticker From URL
// ========================================

function getTickerFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("ticker");

}


// ========================================
// Load Company Data
// ========================================

async function loadCompanyData() {

    try {

        const ticker =
            getTickerFromURL();


        if (!ticker) {

            showCompanyError(
                "No company was selected."
            );

            return;

        }


        // ====================================
        // Load Companies
        // ====================================

        const companiesResponse =
            await fetch(
                "data/companies.json"
            );


        if (!companiesResponse.ok) {

            throw new Error(
                "Unable to load companies.json"
            );

        }


        companies =
            await companiesResponse.json();


        // ====================================
        // Load Real NSE Historical Data
        // ====================================

        showCompanyLoading(0, 1);

        prices =
            await loadHistoricalPrices(
                undefined,
                undefined,
                (loaded, total) =>
                    showCompanyLoading(
                        loaded,
                        total
                    )
            );


        // ====================================
        // Find Company
        // ====================================

        selectedCompany =
            companies.find(
                company =>
                    company.ticker.toLowerCase() ===
                    ticker.toLowerCase()
            );


        if (!selectedCompany) {

            showCompanyError(
                "Company not found."
            );

            return;

        }


        // ====================================
        // Display Company
        // ====================================

        displayCompany();


        updateCompanyAnalytics();


    } catch (error) {

        console.error(
            "Company loading error:",
            error
        );


        showCompanyError(
            "Unable to load company data."
        );

    }

}

// ========================================
// Show Loading State
// ========================================

function showCompanyLoading(loaded, total) {

    const currentPrice =
        document.getElementById(
            "currentPrice"
        );


    if (!currentPrice) {

        return;

    }


    const percent =
        total > 0
            ? Math.round(
                (loaded / total) * 100
            )
            : 0;


    currentPrice.textContent =
        total > 1
            ? `Loading ${percent}%`
            : "Loading...";

}


// =======================================
// Get Company Prices
// ========================================

function getCompanyPrices() {

    return prices.filter(
        price =>
            price.ticker ===
            selectedCompany.ticker
    );

}


// ========================================
// Get Period Start Date
// ========================================

function getPeriodStartDate(period) {

    const companyPrices =
        getCompanyPrices()
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    if (
        companyPrices.length === 0
    ) {

        return null;

    }


    const latestDate =
        new Date(
            companyPrices[
                companyPrices.length - 1
            ].date
        );


    const startDate =
        new Date(latestDate);


    switch (period) {

        case "1D":

            startDate.setDate(
                latestDate.getDate() - 1
            );

            break;


        case "1W":

            startDate.setDate(
                latestDate.getDate() - 7
            );

            break;


        case "1M":

            startDate.setMonth(
                latestDate.getMonth() - 1
            );

            break;


        case "3M":

            startDate.setMonth(
                latestDate.getMonth() - 3
            );

            break;


        case "6M":

            startDate.setMonth(
                latestDate.getMonth() - 6
            );

            break;


        case "1Y":

            startDate.setFullYear(
                latestDate.getFullYear() - 1
            );

            break;


        case "5Y":

            startDate.setFullYear(
                latestDate.getFullYear() - 5
            );

            break;


        default:

            return null;

    }


    return startDate;

}


// ========================================
// Get Prices For Selected Period
// ========================================

function getPricesForPeriod() {

    const allCompanyPrices =
        getCompanyPrices()
            .slice()
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    if (
        allCompanyPrices.length === 0
    ) {

        return [];

    }


    const startDate =
        getPeriodStartDate(
            currentPeriod
        );


    if (!startDate) {

        return allCompanyPrices;

    }


    return allCompanyPrices.filter(
        item =>
            new Date(item.date) >=
            startDate
    );

}


// ========================================
// Update Company Analytics
// ========================================

function updateCompanyAnalytics() {

    const allCompanyPrices =
        getCompanyPrices();


    if (
        allCompanyPrices.length === 0
    ) {

        showNoPriceData();

        return;

    }


    // ===== Sort Prices =====

    allCompanyPrices.sort(
        (a, b) =>
            new Date(a.date) -
            new Date(b.date)
    );


    // ===== Current Price =====

    const latest =
        allCompanyPrices[
            allCompanyPrices.length - 1
        ];


    const currentPrice =
        document.getElementById(
            "currentPrice"
        );


    if (currentPrice) {

        currentPrice.textContent =
            Number(
                latest.close
            ).toFixed(2);

    }


    // ===== Performance =====

    const rankings =
        rankCompanies(
            [selectedCompany],
            prices,
            currentPeriod
        );


    if (
        rankings.length > 0
    ) {

        const result =
            rankings[0];


        updatePerformance(
            result.performance
        );

    }


    // ===== Details =====

    displayCompanyDetails(
        latest,
        allCompanyPrices
    );


    // ===== Chart =====

    drawPriceChart();

}


// ========================================
// Draw Price Chart
// ========================================

function drawPriceChart() {

    const canvas =
        document.getElementById(
            "priceChart"
        );


    if (!canvas) {

        return;

    }


    // ===== Get Selected Period =====

    const companyPrices =
        getPricesForPeriod();


    if (
        companyPrices.length === 0
    ) {

        const ctx =
            canvas.getContext("2d");


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        return;

    }


    // ====================================
    // Canvas Size
    // ====================================

    const ctx =
        canvas.getContext("2d");


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    if (
        width === 0 ||
        height === 0
    ) {

        return;

    }


    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        width * ratio;


    canvas.height =
        height * ratio;


    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );


    // ====================================
    // Chart Dimensions
    // ====================================

    const padding = {

        top: 25,

        right: 25,

        bottom: 40,

        left: 60

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    // ====================================
    // Price Data
    // ====================================

    const values =
        companyPrices.map(
            item =>
                Number(item.close)
        );


    const minPrice =
        Math.min(...values);


    const maxPrice =
        Math.max(...values);


    const range =
        maxPrice -
        minPrice ||
        1;


    const chartMin =
        minPrice -
        range * 0.10;


    const chartMax =
        maxPrice +
        range * 0.10;


    const chartRange =
        chartMax -
        chartMin;


    // ====================================
    // Get Theme Colors
    // ====================================

    const styles =
        getComputedStyle(
            document.documentElement
        );


    const borderColor =
        styles
            .getPropertyValue(
                "--border"
            )
            .trim();


    const secondaryColor =
        styles
            .getPropertyValue(
                "--text-secondary"
            )
            .trim();


    const primaryColor =
        styles
            .getPropertyValue(
                "--primary"
            )
            .trim();


    // ====================================
    // Clear Chart
    // ====================================

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // ====================================
    // Grid Lines
    // ====================================

    ctx.strokeStyle =
        borderColor;


    ctx.lineWidth = 1;


    const gridLines = 4;


    for (
        let i = 0;
        i <= gridLines;
        i++
    ) {

        const y =
            padding.top +
            (
                i /
                gridLines
            ) *
            chartHeight;


        ctx.beginPath();


        ctx.moveTo(
            padding.left,
            y
        );


        ctx.lineTo(
            width -
            padding.right,
            y
        );


        ctx.stroke();


        // ===== Price Label =====

        const price =
            chartMax -
            (
                i /
                gridLines
            ) *
            chartRange;


        ctx.fillStyle =
            secondaryColor;


        ctx.font =
            "12px sans-serif";


        ctx.textAlign =
            "right";


        ctx.fillText(
            price.toFixed(2),
            padding.left - 8,
            y + 4
        );

    }


    // ====================================
    // Create Chart Points
    // ====================================

    const points =
        companyPrices.map(
            (item, index) => {

                const x =
                    padding.left +
                    (
                        index /
                        Math.max(
                            companyPrices.length - 1,
                            1
                        )
                    ) *
                    chartWidth;


                const y =
                    padding.top +
                    (
                        1 -
                        (
                            (
                                Number(
                                    item.close
                                ) -
                                chartMin
                            ) /
                            chartRange
                        )
                    ) *
                    chartHeight;


                return {

                    x: x,

                    y: y,

                    price:
                        Number(
                            item.close
                        ),

                    date:
                        item.date

                };

            }
        );


    // ====================================
    // Draw Price Line
    // ====================================

    ctx.beginPath();


    points.forEach(
        (point, index) => {

            if (
                index === 0
            ) {

                ctx.moveTo(
                    point.x,
                    point.y
                );

            } else {

                ctx.lineTo(
                    point.x,
                    point.y
                );

            }

        }
    );


    ctx.strokeStyle =
        primaryColor;


    ctx.lineWidth = 2.5;


    ctx.stroke();


    // ====================================
    // Draw Points
    // ====================================

    ctx.fillStyle =
        primaryColor;


    points.forEach(
        point => {

            ctx.beginPath();


            ctx.arc(
                point.x,
                point.y,
                4,
                0,
                Math.PI * 2
            );


            ctx.fill();

        }
    );


    // ====================================
    // Date Labels
    // ====================================

    ctx.fillStyle =
        secondaryColor;


    ctx.font =
        "11px sans-serif";


    ctx.textAlign =
        "center";


    points.forEach(
        point => {

            const date =
                new Date(
                    point.date
                );


            const label =
                date.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short"
                    }
                );


            ctx.fillText(
                label,
                point.x,
                height -
                padding.bottom +
                22
            );

        }
    );

}


// ========================================
// Update Performance
// ========================================

function updatePerformance(
    performance
) {

    const element =
        document.getElementById(
            "performance"
        );


    if (!element) {

        return;

    }


    element.textContent =
        formatPerformance(
            performance
        );


    element.classList.remove(
        "performance-positive",
        "performance-negative"
    );


    element.classList.add(
        performance >= 0
            ? "performance-positive"
            : "performance-negative"
    );

}


// ========================================
// Display Company Details
// ========================================

function displayCompanyDetails(
    latest,
    companyPrices
) {

    const table =
        document.getElementById(
            "companyDetails"
        );


    if (!table) {

        return;

    }


    table.innerHTML = "";


    // ===== Current Price =====

    addDetailRow(
        table,
        "Current Price",
        Number(
            latest.close
        ).toFixed(2)
    );


    // ===== Opening Price =====

    if (
        typeof latest.open ===
        "number"
    ) {

        addDetailRow(
            table,
            "Open",
            latest.open.toFixed(2)
        );

    }


    // ===== Daily High =====

    if (
        typeof latest.high ===
        "number"
    ) {

        addDetailRow(
            table,
            "Day High",
            latest.high.toFixed(2)
        );

    }


    // ===== Daily Low =====

    if (
        typeof latest.low ===
        "number"
    ) {

        addDetailRow(
            table,
            "Day Low",
            latest.low.toFixed(2)
        );

    }


    // ===== Previous Close =====

    if (
        companyPrices.length > 1
    ) {

        const previous =
            companyPrices[
                companyPrices.length - 2
            ];


        addDetailRow(
            table,
            "Previous Close",
            Number(
                previous.close
            ).toFixed(2)
        );

    }


    // ===== Volume =====

    if (
        typeof latest.volume ===
        "number"
    ) {

        addDetailRow(
            table,
            "Volume",
            latest.volume.toLocaleString()
        );

    }


    // ===== Sector =====

    addDetailRow(
        table,
        "Sector",
        selectedCompany.sector
    );

}


// ========================================
// Add Detail Row
// ========================================

function addDetailRow(
    table,
    label,
    value
) {

    const row =
        document.createElement(
            "tr"
        );


    row.innerHTML = `

        <td>
            ${label}
        </td>

        <td>
            ${value}
        </td>

    `;


    table.appendChild(
        row
    );

}


// ========================================
// Format Performance
// ========================================

function formatPerformance(
    value
) {

    const sign =
        value >= 0
            ? "+"
            : "";


    return `${sign}${value.toFixed(2)}%`;

}


// ========================================
// Period Display
// ========================================

function updatePeriodDisplay() {

    const element =
        document.getElementById(
            "currentPeriod"
        );


    if (element) {

        element.textContent =
            currentPeriod;

    }

}


// ========================================
// Period Buttons
// ========================================

const periodButtons =
    document.querySelectorAll(
        ".period-button"
    );


periodButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                periodButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentPeriod =
                    button.dataset.period;


                updatePeriodDisplay();

                updateCompanyAnalytics();

            }
        );

    }
);


// ========================================
// No Price Data
// ========================================

function showNoPriceData() {

    const currentPrice =
        document.getElementById(
            "currentPrice"
        );


    const performance =
        document.getElementById(
            "performance"
        );


    if (currentPrice) {

        currentPrice.textContent =
            "N/A";

    }


    if (performance) {

        performance.textContent =
            "N/A";

    }


    const table =
        document.getElementById(
            "companyDetails"
        );


    if (table) {

        table.innerHTML = `

            <tr>

                <td colspan="2">

                    No price data available
                    for this company.

                </td>

            </tr>

        `;

    }

}


// ========================================
// Error Handling
// ========================================

function showCompanyError(
    message
) {

    const ticker =
        document.getElementById(
            "companyTicker"
        );


    const name =
        document.getElementById(
            "companyName"
        );


    const sector =
        document.getElementById(
            "companySector"
        );


    if (ticker) {

        ticker.textContent =
            "---";

    }


    if (name) {

        name.textContent =
            "Company unavailable";

    }


    if (sector) {

        sector.textContent =
            message;

    }

}


// ========================================
// Start Application
// ========================================

loadCompanyData();