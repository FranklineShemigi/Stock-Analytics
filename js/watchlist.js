// ========================================
// NSE Market Analytics
// Watchlist (Favorites)
//
// Persists a list of starred tickers in
// localStorage so it survives between visits.
// Shared by index.html, sector.html and
// company.html.
// ========================================

const WATCHLIST_STORAGE_KEY = "nse_watchlist";


// ===== Read Watchlist =====

function getWatchlist() {

    try {

        const raw =
            localStorage.getItem(
                WATCHLIST_STORAGE_KEY
            );

        return raw
            ? JSON.parse(raw)
            : [];

    } catch (error) {

        console.warn(
            "Unable to read watchlist:",
            error
        );

        return [];

    }

}


// ===== Check If Watched =====

function isWatched(ticker) {

    return getWatchlist().includes(
        ticker
    );

}


// ===== Toggle Watch State =====
//
// Returns the updated watchlist array.

function toggleWatch(ticker) {

    const list = getWatchlist();

    const index =
        list.indexOf(ticker);


    if (index === -1) {

        list.push(ticker);

    } else {

        list.splice(index, 1);

    }


    try {

        localStorage.setItem(
            WATCHLIST_STORAGE_KEY,
            JSON.stringify(list)
        );

    } catch (error) {

        console.warn(
            "Unable to save watchlist:",
            error
        );

    }


    return list;

}


// ===== Star Button HTML =====
//
// Returns a button element (not yet attached)
// that toggles the watch state for a ticker
// and calls onToggle(newIsWatched) after.

function createWatchStarButton(
    ticker,
    onToggle
) {

    const button =
        document.createElement(
            "button"
        );

    button.type = "button";

    button.className =
        "watch-star" +
        (isWatched(ticker)
            ? " watched"
            : "");

    button.setAttribute(
        "aria-label",
        isWatched(ticker)
            ? `Remove ${ticker} from watchlist`
            : `Add ${ticker} to watchlist`
    );

    button.textContent =
        isWatched(ticker)
            ? "\u2605"
            : "\u2606";


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            toggleWatch(ticker);


            const nowWatched =
                isWatched(ticker);

            button.classList.toggle(
                "watched",
                nowWatched
            );

            button.textContent =
                nowWatched
                    ? "\u2605"
                    : "\u2606";

            button.setAttribute(
                "aria-label",
                nowWatched
                    ? `Remove ${ticker} from watchlist`
                    : `Add ${ticker} to watchlist`
            );


            if (onToggle) {

                onToggle(nowWatched);

            }

        }
    );


    return button;

}
