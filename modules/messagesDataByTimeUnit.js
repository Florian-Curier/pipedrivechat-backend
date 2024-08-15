const moment = require('moment');

// Formate les données selon le timeUnit choisi afin d'être lisible par le composant chart
function messagesDataByTimeUnit(data, timeUnit='year') {
    let result = []
    let formatSelect = 'YYYY'
    for(let element of data){
        let format = moment(element.creation_date).format(formatSelect)

        if(timeUnit === 'quarter'){
            formatSelect = 'Q YYYY'
            format = moment(element.creation_date).format(formatSelect)
        } else if(timeUnit === 'month'){
            formatSelect = 'MMMM YYYY'
            format = moment(element.creation_date).format(formatSelect)
        }else if(timeUnit === 'week'){
            formatSelect = 'WW YYYY'
            format = moment(element.creation_date).format(formatSelect)
        } else if(timeUnit === 'day'){
            formatSelect = 'DD MM YYYY'
            format = moment(element.creation_date).format(formatSelect)
        }

        if(result.some(data => data.time === format)){
            result.map(data => {
                if(data.time === format){
                    data.value++
                }
                return data
            })
        }else{
            result.push({time: format, value: 1})
        }
    }
    
    result.sort((a, b) => moment(a.time, formatSelect).diff(moment(b.time, formatSelect)))
    result = result.slice(0,30)
    return result
}
  
  module.exports = { messagesDataByTimeUnit };
