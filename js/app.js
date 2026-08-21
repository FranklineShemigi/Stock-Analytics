// ========================================
// NSE Market Analytics
// Main Application
// ========================================


let companies = [];

let prices = [];

let currentPeriod = "1M";

let currentSector = "all";


// ===== Load Market Data =====

async function loadData() {

    try {

        const companiesResponse =
            await fetch("data/companies.json");

        const pricesResponse =
            await fetch("data/prices.json");


        if (!companiesResponse.ok) {
            throw new Error("Unable to load companies.json");
        }

        if (!pricesResponse.ok) {
            throw new Error("Unable to load prices.json");
        }


        companies =
            await companiesResponse.json();

        prices =
            await pricesResponse.json();


        populateSectorFilter();

        updateDashboard();


    } catch (error) {

        console.error(
            "Error loading market data:",
            error
        );


        document.getElementById(
            "rankingTable"
        ).innerHTML = `

            <tr>

                <td colspan="7">

                    Unable to load market data.

                </td>

            </tr>

        `;

    }

}


// ===== Get Unique Sectors =====

function getSectors() {

    return [
        ...new Set(
            companies.map(
                company => company.sector
            )
        )
    ].sort();

}


// ===== Populate Sector Filter =====

function populateSectorFilter() {

    const sectorFilter =
        document.getElementById(
            "sectorFilter"
        );


    const sectors =
        getSectors();


    sectors.forEach(sector => {

        const option =
            document.createElement("option");


        option.value = sector;

        option.textContent = sector;


        sectorFilter.appendChild(option);

    });

}


// ===== Get Filtered Companies =====

function getFilteredCompanies() {

    if (currentSector === "all") {

        return companies;

    }


    return companies.filter(
        company =>
            company.sector === currentSector
    );

}


// ===== Update Dashboard =====

function updateDashboard() {

    const filteredCompanies =
        getFilteredCompanies();


    const rankings =
        rankCompanies(
            filteredCompanies,
            prices,
            currentPeriod
        );


    updateOverview(rankings);

    displayRankings(rankings);

}


// ===== Update Overview Cards =====

function updateOverview(rankings) {

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


    // Company count

    companyCount.textContent =
        rankings.length;


    // Sector count

    const sectors = [
        ...new Set(
            rankings.map(
                company => company.sector
            )
        )
    ];


    sectorCount.textContent =
        sectors.length;


    // No companies

    if (rankings.length === 0) {

        topGainer.textContent = "--";

        topLoser.textContent = "--";

        return;

    }


    // Top gainer

    const highest =
        rankings[0];


    // Top loser

    const lowest =
        rankings[rankings.length - 1];


    topGainer.textContent =
        `${highest.ticker} ${formatPerformance(
            highest.performance
        )}`;


    topLoser.textContent =
        `${lowest.ticker} ${formatPerformance(
            lowest.performance
        )}`;

}


// ===== Format Performance =====

function formatPerformance(value) {

    const sign =
        value >= 0
            ? "+"
            : "";


    return `${sign}${value.toFixed(2)}%`;

}


// ===== Display Rankings =====

function displayRankings(rankings) {

    const table =
        document.getElementById(
            "rankingTable"
        );


    table.innerHTML = "";


    if (rankings.length === 0) {

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
                document.createElement("tr");


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


            table.appendChild(row);

        }
    );

}


// ===== Period Buttons =====

const periodButtons =
    document.querySelectorAll(
        ".period-button"
    );


periodButtons.forEach(button => {

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


            updateDashboard();

        }
    );

});


// ===== Sector Filter =====

const sectorFilter =
    document.getElementById(
        "sectorFilter"
    );


sectorFilter.addEventListener(
    "change",
    event => {

        currentSector =
            event.target.value;


        updateDashboard();

    }
);


// ===== Start Application =====

loadData();