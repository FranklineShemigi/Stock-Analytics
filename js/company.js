// ========================================
// NSE Market Analytics
// Company Detail Page
// ========================================


let companies = [];

let prices = [];

let selectedCompany = null;

let currentPeriod = "1M";

let customRange = null;

let compareTickers = [];

const COMPARE_COLORS = [
    "#DC2626",
    "#7C3AED",
    "#D97706"
];


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
// Get Prices For Any Ticker, In Range
// ========================================

function getPricesForTickerInRange(
    ticker,
    startDate,
    endDate
) {

    const tickerPrices =
        prices
            .filter(
                price =>
                    price.ticker === ticker
            )
            .sort(
                (a, b) =>
                    new Date(a.date) -
                    new Date(b.date)
            );


    return tickerPrices.filter(
        item => {

            const itemDate =
                new Date(item.date);

            if (
                startDate &&
                itemDate < startDate
            ) {

                return false;

            }


            if (
                endDate &&
                itemDate > endDate
            ) {

                return false;

            }


            return true;

        }
    );

}


// ========================================
// Get Period Bounds (start/end dates)
// ========================================
//
// Delegates to getPeriodBounds() in
// performance.js so YTD / ALL / CUSTOM stay
// in sync with the dashboard and sector page.

function getPeriodRange(period) {

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

        return {
            startDate: null,
            endDate: null
        };

    }


    const latestDate =
        new Date(
            companyPrices[
                companyPrices.length - 1
            ].date
        );


    return getPeriodBounds(
        latestDate,
        period,
        customRange
    );

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


    const { startDate, endDate } =
        getPeriodRange(
            currentPeriod
        );


    return allCompanyPrices.filter(
        item => {

            const itemDate =
                new Date(item.date);

            if (
                startDate &&
                itemDate < startDate
            ) {

                return false;

            }


            if (
                endDate &&
                itemDate > endDate
            ) {

                return false;

            }


            return true;

        }
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
            currentPeriod,
            customRange
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

    drawVolumeChart();

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

    const mainPrices =
        getPricesForPeriod();


    if (
        mainPrices.length === 0
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
    // Build Series (main + compares)
    //
    // Compare mode normalizes every series
    // to % change from its first value in
    // range, since absolute prices across
    // companies aren't comparable on one
    // axis. With no compares, the main
    // series is shown at absolute price.
    // ====================================

    const { startDate, endDate } =
        getPeriodRange(currentPeriod);


    const isCompareMode =
        compareTickers.length > 0;


    function toSeries(
        rawPrices,
        label,
        color
    ) {

        if (!isCompareMode) {

            return {

                label,

                color,

                points:
                    rawPrices.map(
                        item => ({

                            date: item.date,

                            value:
                                Number(
                                    item.close
                                )

                        })
                    )

            };

        }


        const firstClose =
            Number(
                rawPrices[0].close
            );


        return {

            label,

            color,

            points:
                rawPrices.map(
                    item => ({

                        date: item.date,

                        value:
                            firstClose === 0
                                ? 0
                                : (
                                    (
                                        Number(
                                            item.close
                                        ) -
                                        firstClose
                                    ) /
                                    firstClose
                                ) * 100

                    })
                )

        };

    }


    const styles =
        getComputedStyle(
            document.documentElement
        );


    const primaryColor =
        styles
            .getPropertyValue(
                "--primary"
            )
            .trim();


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


    const series = [
        toSeries(
            mainPrices,
            selectedCompany.ticker,
            primaryColor
        )
    ];


    compareTickers.forEach(
        (ticker, i) => {

            const comparePrices =
                getPricesForTickerInRange(
                    ticker,
                    startDate,
                    endDate
                );


            if (comparePrices.length === 0) {

                return;

            }


            series.push(
                toSeries(
                    comparePrices,
                    ticker,
                    COMPARE_COLORS[
                        i % COMPARE_COLORS.length
                    ]
                )
            );

        }
    );


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

        left: isCompareMode ? 50 : 60

    };


    const legendHeight =
        isCompareMode ? 26 : 0;


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom -
        legendHeight;


    // ====================================
    // Value Range (across all series)
    // ====================================

    const allValues =
        series.flatMap(
            s =>
                s.points.map(
                    p => p.value
                )
        );


    const minValue =
        Math.min(...allValues);


    const maxValue =
        Math.max(...allValues);


    const valueSpan =
        maxValue -
        minValue ||
        1;


    const chartMin =
        minValue -
        valueSpan * 0.10;


    const chartMax =
        maxValue +
        valueSpan * 0.10;


    const chartRange =
        chartMax -
        chartMin;


    // ====================================
    // Time Range (x-axis by date, so
    // series with slightly different
    // trading days still line up)
    // ====================================

    const allDates =
        series.flatMap(
            s =>
                s.points.map(
                    p => new Date(p.date).getTime()
                )
        );


    const minTime =
        Math.min(...allDates);


    const maxTime =
        Math.max(...allDates);


    const timeSpan =
        maxTime - minTime || 1;


    function xForDate(dateStr) {

        const t =
            new Date(dateStr).getTime();


        return (
            padding.left +
            (
                (t - minTime) /
                timeSpan
            ) *
            chartWidth
        );

    }


    function yForValue(value) {

        return (
            padding.top +
            legendHeight +
            (
                1 -
                (
                    (value - chartMin) /
                    chartRange
                )
            ) *
            chartHeight
        );

    }


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
    // Legend (compare mode only)
    // ====================================

    if (isCompareMode) {

        let legendX = padding.left;

        const legendY =
            padding.top + 8;


        ctx.font =
            "12px sans-serif";


        ctx.textAlign = "left";


        series.forEach(s => {

            ctx.fillStyle = s.color;

            ctx.fillRect(
                legendX,
                legendY - 8,
                10,
                10
            );


            ctx.fillStyle =
                secondaryColor;

            const label = ` ${s.label}`;

            ctx.fillText(
                label,
                legendX + 12,
                legendY + 1
            );


            legendX +=
                12 +
                ctx.measureText(label)
                    .width +
                16;

        });

    }


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
            legendHeight +
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


        // ===== Value Label =====

        const value =
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
            isCompareMode
                ? `${value.toFixed(1)}%`
                : value.toFixed(2),
            padding.left - 8,
            y + 4
        );

    }


    // ====================================
    // Draw Each Series
    // ====================================

    series.forEach(s => {

        const points =
            s.points.map(p => ({

                x: xForDate(p.date),

                y: yForValue(p.value),

                date: p.date

            }));


        ctx.beginPath();


        points.forEach(
            (point, index) => {

                if (index === 0) {

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


        ctx.strokeStyle = s.color;

        ctx.lineWidth = 2.5;

        ctx.stroke();


        // ===== Points =====
        //
        // Only draw individual markers when
        // there aren't too many - with a
        // multi-year range there can be
        // thousands of points, and drawing a
        // circle for each would be slow and
        // unreadable.

        if (points.length <= 60) {

            ctx.fillStyle = s.color;


            points.forEach(point => {

                ctx.beginPath();

                ctx.arc(
                    point.x,
                    point.y,
                    4,
                    0,
                    Math.PI * 2
                );

                ctx.fill();

            });

        }


        s._points = points;

    });


    // ====================================
    // Date Labels (thinned to avoid
    // overlap on long ranges)
    // ====================================

    const mainPoints =
        series[0]._points;


    const maxLabels = 6;


    const labelStep =
        Math.max(
            1,
            Math.ceil(
                mainPoints.length /
                maxLabels
            )
        );


    ctx.fillStyle =
        secondaryColor;


    ctx.font =
        "11px sans-serif";


    ctx.textAlign =
        "center";


    mainPoints.forEach(
        (point, index) => {

            const isLast =
                index ===
                mainPoints.length - 1;


            if (
                index % labelStep !== 0 &&
                !isLast
            ) {

                return;

            }


            const date =
                new Date(
                    point.date
                );


            const label =
                date.toLocaleDateString(
                    "en-GB",
                    {
                        day: "2-digit",
                        month: "short",
                        year:
                            timeSpan >
                            1000 * 60 * 60 * 24 * 400
                                ? "2-digit"
                                : undefined
                    }
                );


            ctx.fillText(
                label,
                point.x,
                height - padding.bottom + 22
            );

        }
    );

}


// ========================================
// Draw Volume Chart
// ========================================

function drawVolumeChart() {

    const canvas =
        document.getElementById(
            "volumeChart"
        );


    if (!canvas) {

        return;

    }


    const companyPrices =
        getPricesForPeriod();


    const ctx =
        canvas.getContext("2d");


    if (
        companyPrices.length === 0
    ) {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        return;

    }


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


    const padding = {

        top: 10,

        right: 25,

        bottom: 20,

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


    const volumes =
        companyPrices.map(
            item =>
                Number(item.volume) || 0
        );


    const maxVolume =
        Math.max(
            ...volumes,
            1
        );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const styles =
        getComputedStyle(
            document.documentElement
        );


    const secondaryColor =
        styles
            .getPropertyValue(
                "--text-secondary"
            )
            .trim();


    const primaryLight =
        styles
            .getPropertyValue(
                "--primary-light"
            )
            .trim() || "#14B8A6";


    // ===== Volume Label (max) =====

    ctx.fillStyle =
        secondaryColor;

    ctx.font =
        "11px sans-serif";

    ctx.textAlign =
        "right";

    ctx.fillText(
        formatVolume(maxVolume),
        padding.left - 8,
        padding.top + 10
    );

    ctx.fillText(
        "0",
        padding.left - 8,
        padding.top + chartHeight
    );


    // ===== Bars =====
    //
    // Cap the number of bars actually drawn
    // on very long ranges so bars stay
    // visible rather than sub-pixel.

    const maxBars = 250;

    const step =
        Math.max(
            1,
            Math.ceil(
                companyPrices.length / maxBars
            )
        );

    const sampledIndices = [];

    for (
        let i = 0;
        i < companyPrices.length;
        i += step
    ) {

        sampledIndices.push(i);

    }


    const barSlotWidth =
        chartWidth /
        sampledIndices.length;

    const barWidth =
        Math.max(
            1,
            barSlotWidth * 0.7
        );


    ctx.fillStyle =
        primaryLight;


    sampledIndices.forEach(
        (dataIndex, slotIndex) => {

            const volume =
                Number(
                    companyPrices[dataIndex]
                        .volume
                ) || 0;


            const barHeight =
                (volume / maxVolume) *
                chartHeight;


            const x =
                padding.left +
                slotIndex * barSlotWidth +
                (barSlotWidth - barWidth) / 2;


            const y =
                padding.top +
                chartHeight -
                barHeight;


            ctx.fillRect(
                x,
                y,
                barWidth,
                barHeight
            );

        }
    );

}


// ========================================
// Format Volume (compact: 1.2M, 340K)
// ========================================

function formatVolume(volume) {

    if (volume >= 1000000) {

        return (
            (volume / 1000000).toFixed(1) +
            "M"
        );

    }


    if (volume >= 1000) {

        return (
            (volume / 1000).toFixed(1) +
            "K"
        );

    }


    return String(
        Math.round(volume)
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
            currentPeriod === "CUSTOM" &&
            customRange
                ? `${customRange.fromYear}-${customRange.toYear}`
                : currentPeriod;

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

                customRange = null;

                yearRangePicker.clearActive();


                updatePeriodDisplay();

                updateCompanyAnalytics();

            }
        );

    }
);


// ========================================
// Custom Year Range
// ========================================

const yearRangePicker =
    initYearRangePicker({
        onApply: range => {

            currentPeriod = "CUSTOM";

            customRange = range;


            periodButtons.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            updatePeriodDisplay();

            updateCompanyAnalytics();

        }
    });


// ========================================
// Compare Companies
// ========================================

const MAX_COMPARE = 3;

const compareSearchInput =
    document.getElementById(
        "compareSearch"
    );

const compareSuggestionsBox =
    document.getElementById(
        "compareSuggestions"
    );

const compareChipsBox =
    document.getElementById(
        "compareChips"
    );


function renderCompareChips() {

    if (!compareChipsBox) {

        return;

    }


    compareChipsBox.innerHTML = "";


    compareTickers.forEach(
        (ticker, index) => {

            const company =
                companies.find(
                    c => c.ticker === ticker
                );


            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "compare-chip";

            chip.style.borderColor =
                COMPARE_COLORS[
                    index %
                    COMPARE_COLORS.length
                ];


            const label =
                document.createElement(
                    "span"
                );

            label.textContent =
                company
                    ? `${company.name} (${ticker})`
                    : ticker;

            chip.appendChild(label);


            const removeButton =
                document.createElement(
                    "button"
                );

            removeButton.type = "button";

            removeButton.textContent = "\u00d7";

            removeButton.setAttribute(
                "aria-label",
                `Remove ${ticker} from comparison`
            );

            removeButton.addEventListener(
                "click",
                () => {

                    compareTickers =
                        compareTickers.filter(
                            t => t !== ticker
                        );

                    renderCompareChips();

                    drawPriceChart();

                }
            );

            chip.appendChild(
                removeButton
            );


            compareChipsBox.appendChild(
                chip
            );

        }
    );

}


function hideCompareSuggestions() {

    if (compareSuggestionsBox) {

        compareSuggestionsBox.hidden = true;

        compareSuggestionsBox.innerHTML = "";

    }

}


if (
    compareSearchInput &&
    compareSuggestionsBox
) {

    compareSearchInput.addEventListener(
        "input",
        () => {

            const term =
                compareSearchInput.value
                    .trim()
                    .toLowerCase();


            if (!term) {

                hideCompareSuggestions();

                return;

            }


            if (
                compareTickers.length >=
                MAX_COMPARE
            ) {

                compareSuggestionsBox.hidden = false;

                compareSuggestionsBox.innerHTML =
                    `<div class="compare-suggestion-empty">Remove a company to add another (max ${MAX_COMPARE}).</div>`;

                return;

            }


            const matches =
                companies
                    .filter(
                        c =>
                            c.ticker !==
                                selectedCompany.ticker &&
                            !compareTickers.includes(
                                c.ticker
                            ) &&
                            (
                                c.name
                                    .toLowerCase()
                                    .includes(term) ||
                                c.ticker
                                    .toLowerCase()
                                    .includes(term)
                            )
                    )
                    .slice(0, 6);


            if (matches.length === 0) {

                compareSuggestionsBox.hidden = false;

                compareSuggestionsBox.innerHTML =
                    `<div class="compare-suggestion-empty">No matches.</div>`;

                return;

            }


            compareSuggestionsBox.hidden = false;

            compareSuggestionsBox.innerHTML = "";


            matches.forEach(company => {

                const item =
                    document.createElement(
                        "button"
                    );

                item.type = "button";

                item.className =
                    "compare-suggestion-item";

                item.textContent =
                    `${company.name} (${company.ticker})`;


                item.addEventListener(
                    "click",
                    () => {

                        if (
                            compareTickers.length <
                            MAX_COMPARE
                        ) {

                            compareTickers.push(
                                company.ticker
                            );

                        }


                        compareSearchInput.value = "";

                        hideCompareSuggestions();

                        renderCompareChips();

                        drawPriceChart();

                    }
                );


                compareSuggestionsBox.appendChild(
                    item
                );

            });

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                !compareSearchInput.contains(
                    event.target
                ) &&
                !compareSuggestionsBox.contains(
                    event.target
                )
            ) {

                hideCompareSuggestions();

            }

        }
    );

}


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
// Display Company Header
// ========================================
//
// Populates the ticker/name/sector header and
// the watchlist star. This was previously called
// but never defined, so the page threw a
// ReferenceError right after finding the company.

function displayCompany() {

    const tickerEl =
        document.getElementById(
            "companyTicker"
        );

    const nameEl =
        document.getElementById(
            "companyName"
        );

    const sectorEl =
        document.getElementById(
            "companySector"
        );

    const starSlot =
        document.getElementById(
            "companyWatchStar"
        );


    if (tickerEl) {

        tickerEl.textContent =
            selectedCompany.ticker;

    }


    if (nameEl) {

        nameEl.textContent =
            selectedCompany.name;

    }


    if (sectorEl) {

        sectorEl.textContent =
            selectedCompany.sector;

    }


    if (
        starSlot &&
        typeof createWatchStarButton ===
            "function"
    ) {

        starSlot.innerHTML = "";

        starSlot.appendChild(
            createWatchStarButton(
                selectedCompany.ticker
            )
        );

    }


    document.title =
        `${selectedCompany.name} (${selectedCompany.ticker}) - NSE Market Analytics`;

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