// Vérifie la présence d'une date de début et/ou de fin pour filtrer ou non les données
function checkDatesMessages(startDate, endDate) {
    let filterdate = {}

    if (startDate !== 'null' && endDate !== 'null') {
        filterdate = { creation_date: { $gte: startDate, $lte: endDate } }
    } else if (startDate !== 'null' || endDate !== 'null') {
        if (startDate !== 'null') {
            filterdate = { creation_date: { $gte: startDate } }
        } else {
            filterdate = { creation_date: { $lte: endDate } }
        }
    } else {
        filterdate = null
    }

    return filterdate
}

module.exports = { checkDatesMessages };


