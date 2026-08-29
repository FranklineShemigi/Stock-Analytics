// ========================================
// NSE Market Analytics
// Main Application
// ========================================


let companies = [];

let prices = [];

let currentPeriod = "1M";

let customRange = null;

let searchTerm = "";


// ========================================
// Load Market Data
// ========================================

async function loadData() {

    try {

        showLoadingState(0, 1);

        const companiesResponse =
            await fetch("data/companies.json");


        if (!companiesResponse.ok) {

            throw new Error(
                "Unable to load companies.json"
            );

        }


        companies =
            await companiesResponse.json();

        prices =
            await loadHistoricalPrices(
                undefined,
                undefined,
                (loaded, total) =>
                    showLoadingState(
                        loaded,
                        total
                    )
            );


        // Build sector explorer

        populateSectorExplorer();


        // Build initial dashboard

        updateDashboard();


    } catch (error) {

        console.error(
            "Error loading market data:",
            error
        );


        const table =
            document.getElementById(
                "rankingTable"
            );


        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="7">

                        Unable to load market data.

                    </td>

                </tr>

            `;

        }

    }

}


// ========================================
// Loading State
// ========================================

function showLoadingState(loaded, total) {

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
// Get Unique Sectors
// ========================================

function getSectors() {

    return [
        ...new Set(
            companies.map(
                company =>
                    company.sector
            )
        )
    ].sort();

}


// ========================================
// Sector Explorer
// ========================================

function populateSectorExplorer() {

    const sectorGrid =
        document.getElementById(
            "sectorGrid"
        );


    if (!sectorGrid) {

        return;

    }


    sectorGrid.innerHTML = "";


    // ===== All Companies =====

    const allCard =
        createSectorCard(
            "all",
            "All Companies",
            companies.length
        );


    sectorGrid.appendChild(
        allCard
    );


    // ===== Individual Sectors =====

    const sectors =
        getSectors();


    sectors.forEach(
        sector => {

            const count =
                companies.filter(
                    company =>
                        company.sector ===
                        sector
                ).length;


            const card =
                createSectorCard(
                    sector,
                    sector,
                    count
                );


            sectorGrid.appendChild(
                card
            );

        }
    );

}


// ========================================
// Create Sector Card
// ========================================

function createSectorCard(
    sector,
    name,
    count
) {

    const card =
        document.createElement(
            "a"
        );


    card.href =
        `sector.html?sector=${
            encodeURIComponent(sector)
        }`;


    card.className =
        "sector-card";


    card.innerHTML = `

        <span class="sector-card-name">

            ${name}

        </span>


        <span class="sector-card-count">

            ${count}
            ${
                count === 1
                    ? "company"
                    : "companies"
            }

        </span>

    `;


    return card;

}


// ========================================
// Get Companies
// ========================================

function getFilteredCompanies() {

    if (!searchTerm) {

        return companies;

    }


    const term =
        searchTerm.toLowerCase();


    return companies.filter(
        company =>
            company.name
                .toLowerCase()
                .includes(term) ||
            company.ticker
                .toLowerCase()
                .includes(term)
    );

}


// ========================================
// Update Dashboard
// ========================================

function updateDashboard() {

    const rankings =
        rankCompanies(
            getFilteredCompanies(),
            prices,
            currentPeriod,
            customRange
        );


    updateOverview(
        rankings
    );


    displayRankings(
        rankings
    );

}


// ========================================
// Update Overview Cards
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


    const sectorCount =
        document.getElementById(
            "sectorCount"
        );


    if (companyCount) {

        companyCount.textContent =
            rankings.length;

    }


    if (sectorCount) {

        const sectors = [
            ...new Set(
                rankings.map(
                    company =>
                        company.sector
                )
            )
        ];


        sectorCount.textContent =
            sectors.length;

    }


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


    const highest =
        rankings[0];


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


    if (
        rankings.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td colspan="7">

                    No companies found.

                </td>

            </tr>

        `;


        return;

    }


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

                <td class="rank-number">

                    ${index + 1}

                </td>


                <td>

                    ${company.name}

                </td>


                <td class="ticker">

                    ${company.ticker}

                </td>


                <td>

                    ${company.sector}

                </td>


                <td>

                    ${
                        company.startPrice !== null
                            ? company.startPrice.toFixed(2)
                            : "N/A"
                    }

                </td>


                <td>

                    ${
                        company.currentPrice !== null
                            ? company.currentPrice.toFixed(2)
                            : "N/A"
                    }

                </td>


                <td class="${performanceClass}">

                    ${formatPerformance(
                        performance
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


                updateDashboard();

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


            updateDashboard();

        }
    });


// ========================================
// Search Input
// ========================================

const searchInput =
    document.getElementById(
        "companySearch"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            searchTerm =
                searchInput.value;


            updateDashboard();

        }
    );

}


// ========================================
// Start Application
// ========================================

loadData();