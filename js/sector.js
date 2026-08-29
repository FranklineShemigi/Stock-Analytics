// ========================================
// NSE Market Analytics
// Sector Page
// ========================================


let companies = [];

let prices = [];

let currentPeriod = "1M";

let selectedSector = "";

let searchTerm = "";

let sortMode = "performance-desc";


// ========================================
// Get Sector From URL
// ========================================

function getSectorFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get("sector");

}


// ========================================
// Load Sector Data
// ========================================

async function loadSectorData() {

    try {

        // Get selected sector

        selectedSector =
            getSectorFromURL();


        if (!selectedSector) {

            showSectorError(
                "No sector was selected."
            );

            return;

        }


        // Load companies

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

        // Load prices (merged from yearly files)

        prices =
            await loadHistoricalPrices(
                undefined,
                undefined,
                (loaded, total) =>
                    showSectorLoading(
                        loaded,
                        total
                    )
            );


        // Display sector information

        displaySectorHeader();


        // Display companies

        updateSectorPage();


    } catch (error) {

        console.error(
            "Sector loading error:",
            error
        );


        showSectorError(
            "Unable to load sector data."
        );

    }

}


// ========================================
// Display Sector Header
// ========================================

function displaySectorHeader() {

    const sectorName =
        document.getElementById(
            "sectorName"
        );


    const description =
        document.getElementById(
            "sectorDescription"
        );


    if (sectorName) {

        sectorName.textContent =
            selectedSector;

    }


    if (description) {

        description.textContent =
            `Companies listed under the ${selectedSector} sector.`;

    }


    document.title =
        `${selectedSector} | NSE Market Analytics`;

}


// ========================================
// Get Companies In Sector
// ========================================

function getSectorCompanies() {

    return companies.filter(
        company =>
            company.sector ===
            selectedSector
    );

}


// ========================================
// Update Sector Page
// ========================================

function updateSectorPage() {

    let sectorCompanies =
        getSectorCompanies();


    // ====================================
    // Search
    // ====================================

    if (searchTerm) {

        const search =
            searchTerm.toLowerCase();


        sectorCompanies =
            sectorCompanies.filter(
                company => {

                    const name =
                        company.name
                            .toLowerCase();


                    const ticker =
                        company.ticker
                            .toLowerCase();


                    return (
                        name.includes(search) ||
                        ticker.includes(search)
                    );

                }
            );

    }


    // ====================================
    // Calculate Performance
    // ====================================

    let rankings =
        rankCompanies(
            sectorCompanies,
            prices,
            currentPeriod
        );


    // ====================================
    // Sort Results
    // ====================================

    rankings =
        sortRankings(
            rankings,
            sortMode
        );


    // ====================================
    // Update Interface
    // ====================================

    updateOverview(
        rankings
    );


    displayRankings(
        rankings
    );


    updatePeriodDisplay();

}


// ========================================
// Sort Rankings
// ========================================

function sortRankings(
    rankings,
    sortMode
) {

    const sorted =
        [...rankings];


    switch (sortMode) {


        // ================================
        // Performance High → Low
        // ================================

        case "performance-desc":

            sorted.sort(
                (a, b) =>
                    b.performance -
                    a.performance
            );

            break;


        // ================================
        // Performance Low → High
        // ================================

        case "performance-asc":

            sorted.sort(
                (a, b) =>
                    a.performance -
                    b.performance
            );

            break;


        // ================================
        // Company A → Z
        // ================================

        case "name-asc":

            sorted.sort(
                (a, b) =>
                    a.name.localeCompare(
                        b.name
                    )
            );

            break;


        // ================================
        // Company Z → A
        // ================================

        case "name-desc":

            sorted.sort(
                (a, b) =>
                    b.name.localeCompare(
                        a.name
                    )
            );

            break;


        // ================================
        // Price High → Low
        // ================================

        case "price-desc":

            sorted.sort(
                (a, b) =>
                    b.currentPrice -
                    a.currentPrice
            );

            break;


        // ================================
        // Price Low → High
        // ================================

        case "price-asc":

            sorted.sort(
                (a, b) =>
                    a.currentPrice -
                    b.currentPrice
            );

            break;

    }


    return sorted;

}


// ========================================
// Update Overview
// ========================================

function updateOverview(
    rankings
) {

    const companyCount =
        document.getElementById(
            "companyCount"
        );


    const topGainer =
        document.getElementById(
            "topGainer"
        );


    const topLoser =
        document.getElementById(
            "topLoser"
        );


    // ====================================
    // Company Count
    // ====================================

    if (companyCount) {

        companyCount.textContent =
            rankings.length;

    }


    // ====================================
    // No Results
    // ====================================

    if (
        rankings.length === 0
    ) {

        if (topGainer) {

            topGainer.textContent =
                "--";

        }


        if (topLoser) {

            topLoser.textContent =
                "--";

        }


        return;

    }


    // ====================================
    // Highest Performer
    // ====================================

    const highest =
        rankings[0];


    // ====================================
    // Lowest Performer
    // ====================================

    const lowest =
        rankings[
            rankings.length - 1
        ];


    if (topGainer) {

        topGainer.textContent =
            `${highest.ticker} ${
                formatPerformance(
                    highest.performance
                )
            }`;

    }


    if (topLoser) {

        topLoser.textContent =
            `${lowest.ticker} ${
                formatPerformance(
                    lowest.performance
                )
            }`;

    }

}


// ========================================
// Display Rankings
// ========================================

function displayRankings(
    rankings
) {

    const table =
        document.getElementById(
            "rankingTable"
        );


    if (!table) {

        return;

    }


    table.innerHTML = "";


    // ====================================
    // No Results
    // ====================================

    if (
        rankings.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="6">

                    No companies found
                    in this sector.

                </td>

            </tr>

        `;


        return;

    }


    // ====================================
    // Build Rows
    // ====================================

    rankings.forEach(
        (company, index) => {

            const row =
                document.createElement(
                    "tr"
                );


            const performance =
                company.performance;


            const performanceClass =
                performance >= 0
                    ? "performance-positive"
                    : "performance-negative";

row.innerHTML = `

    <td>
        ${index + 1}
    </td>


    <td>

        <a
            href="company.html?ticker=${encodeURIComponent(company.ticker)}"
            class="company-link"
        >

            ${company.name}

        </a>

    </td>


    <td>

        <a
            href="company.html?ticker=${encodeURIComponent(company.ticker)}"
            class="company-link"
        >

            ${company.ticker}

        </a>

    </td>


    <td>

        ${
            company.currentPrice !== null
                ? company.currentPrice.toFixed(2)
                : "N/A"
        }

    </td>


    <td>

        ${
            company.startPrice !== null
                ? company.startPrice.toFixed(2)
                : "N/A"
        }

    </td>


    <td class="${performanceClass}">

        ${formatPerformance(
            company.performance
        )}

    </td>

`;
            
          

            table.appendChild(
                row
            );

        }
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

    const period =
        document.getElementById(
            "currentPeriod"
        );


    if (period) {

        period.textContent =
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


                updateSectorPage();

            }
        );

    }
);


// ========================================
// Company Search
// ========================================

const companySearch =
    document.getElementById(
        "companySearch"
    );


if (companySearch) {

    companySearch.addEventListener(
        "input",
        event => {

            searchTerm =
                event.target.value.trim();


            updateSectorPage();

        }
    );

}


// ========================================
// Sorting
// ========================================

const sortSelect =
    document.getElementById(
        "sortSelect"
    );


if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        event => {

            sortMode =
                event.target.value;


            updateSectorPage();

        }
    );

}


// ========================================
// Show Loading State
// ========================================

function showSectorLoading(loaded, total) {

    const table =
        document.getElementById(
            "rankingTable"
        );


    if (!table) {

        return;

    }


    const percent =
        total > 0
            ? Math.round(
                (loaded / total) * 100
            )
            : 0;


    table.innerHTML = `

        <tr>

            <td colspan="7">

                Loading market data${
                    total > 1
                        ? ` (${percent}%)`
                        : "..."
                }

            </td>

        </tr>

    `;

}


// ========================================
// Show Error
// ========================================

function showSectorError(
    message
) {

    const sectorName =
        document.getElementById(
            "sectorName"
        );


    const description =
        document.getElementById(
            "sectorDescription"
        );


    if (sectorName) {

        sectorName.textContent =
            "Sector unavailable";

    }


    if (description) {

        description.textContent =
            message;

    }

}


// ========================================
// Start Sector Page
// ========================================

loadSectorData();

