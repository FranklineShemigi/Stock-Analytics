// ========================================
// NSE Market Analytics
// CSV Export
//
// Turns the currently displayed rankings into
// a downloadable CSV file. Shared by index.html
// and sector.html.
// ========================================

function escapeCsvValue(value) {

    const stringValue =
        value === null ||
        value === undefined
            ? ""
            : String(value);


    if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
    ) {

        return (
            '"' +
            stringValue.replace(
                /"/g,
                '""'
            ) +
            '"'
        );

    }


    return stringValue;

}


// ===== Export Rankings To CSV =====
//
// rankings: array of objects from
// calculateCompanyPerformance()/rankCompanies()
// filename: e.g. "nse-rankings-1M.csv"

function exportRankingsToCsv(
    rankings,
    filename
) {

    if (
        !rankings ||
        rankings.length === 0
    ) {

        alert(
            "There's nothing to export yet."
        );

        return;

    }


    const headers = [
        "Rank",
        "Name",
        "Ticker",
        "Sector",
        "Start Price",
        "Current Price",
        "Performance (%)"
    ];


    const rows =
        rankings.map(
            (company, index) => [
                index + 1,
                company.name,
                company.ticker,
                company.sector,
                company.startPrice !== null
                    ? company.startPrice.toFixed(2)
                    : "",
                company.currentPrice !== null
                    ? company.currentPrice.toFixed(2)
                    : "",
                company.performance.toFixed(2)
            ]
        );


    const csvLines = [
        headers
            .map(escapeCsvValue)
            .join(","),

        ...rows.map(
            row =>
                row
                    .map(escapeCsvValue)
                    .join(",")
        )
    ];


    const csvContent =
        csvLines.join("\n");


    const blob = new Blob(
        [csvContent],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download = filename;


    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(url);

}
