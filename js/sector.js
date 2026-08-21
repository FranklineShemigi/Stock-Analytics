// ========================================
// NSE Market Analytics
// Sector Page
// ========================================


let companies = [];

let prices = [];

let currentPeriod = "1M";

let selectedSector = "";


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


        // Load prices

        const pricesResponse =
            await fetch(
                "data/prices.json"
            );


        if (!companiesResponse.ok) {

            throw new Error(
                "Unable to load companies.json"
            );

        }


        if (!pricesResponse.ok) {

            throw new Error(
                "Unable to load prices.json"
            );

        }


        companies =
            await companiesResponse.json();


        prices =
            await pricesResponse.json();


        // Display sector name

        displaySectorHeader();


        // Display sector companies

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

    const sectorCompanies =
        getSectorCompanies();


    const rankings =
        rankCompanies(
            sectorCompanies,
            prices,
            currentPeriod
        );


    updateOverview(
        rankings
    );


    displayRankings(
        rankings
    );


    updatePeriodDisplay();

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


    if (companyCount) {

        companyCount.textContent =
            rankings.length;

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

                <td colspan="6">

                    No companies found
                    in this sector.

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

                <td>

                    ${index + 1}

                </td>


                <td>

                    ${company.name}

                </td>


                <td>

                    ${company.ticker}

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