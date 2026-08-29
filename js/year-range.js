// ========================================
// NSE Market Analytics
// Custom Year Range Picker
//
// Shared by index.html, sector.html and
// company.html. Populates the From/To year
// selects, and calls onApply({fromYear, toYear})
// when the user applies a custom range.
//
// Returns an object with:
//   - clearActive(): deactivate the toggle
//     button (call this when a normal preset
//     period button is clicked instead)
// ========================================

function initYearRangePicker({
    minYear = NSE_START_YEAR,
    maxYear = NSE_END_YEAR,
    onApply
}) {

    const toggle =
        document.getElementById(
            "customRangeToggle"
        );

    const panel =
        document.getElementById(
            "customRangePanel"
        );

    const fromSelect =
        document.getElementById(
            "fromYearSelect"
        );

    const toSelect =
        document.getElementById(
            "toYearSelect"
        );

    const applyButton =
        document.getElementById(
            "applyRangeButton"
        );


    if (
        !toggle ||
        !panel ||
        !fromSelect ||
        !toSelect ||
        !applyButton
    ) {

        return {
            clearActive: () => {}
        };

    }


    // ===== Populate Year Selects =====

    for (
        let year = minYear;
        year <= maxYear;
        year++
    ) {

        const fromOption =
            document.createElement(
                "option"
            );

        fromOption.value = year;

        fromOption.textContent = year;

        fromSelect.appendChild(
            fromOption
        );


        const toOption =
            document.createElement(
                "option"
            );

        toOption.value = year;

        toOption.textContent = year;

        toSelect.appendChild(
            toOption
        );

    }


    fromSelect.value = minYear;

    toSelect.value = maxYear;


    // ===== Toggle Panel =====

    toggle.addEventListener(
        "click",
        () => {

            panel.hidden =
                !panel.hidden;

        }
    );


    // ===== Apply Button =====

    applyButton.addEventListener(
        "click",
        () => {

            const fromYear =
                Number(fromSelect.value);

            const toYear =
                Number(toSelect.value);


            if (fromYear > toYear) {

                alert(
                    "'From' year must not be after 'To' year."
                );

                return;

            }


            toggle.classList.add(
                "active"
            );


            if (onApply) {

                onApply({
                    fromYear,
                    toYear
                });

            }

        }
    );


    return {

        clearActive: () => {

            toggle.classList.remove(
                "active"
            );

            panel.hidden = true;

        }

    };

}
