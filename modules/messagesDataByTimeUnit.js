const moment = require('moment');

// Formate les données selon le timeUnit choisi afin d'être lisible par le composant chart
function messagesDataByTimeUnit(data, timeUnit='Year') {
    const result = []

    for(let element of data){
        let format = moment(element.creation_date).format('YYYY')

        if(timeUnit === 'Quarter'){
            format = moment(element.creation_date).format('TQ YYYY')
        } else if(timeUnit === 'Month'){
            format = moment(element.creation_date).format('MMMM YYYY')
        }else if(timeUnit === 'Week'){
            format = moment(element.creation_date).format('WW YYYY')
        } else if(timeUnit === 'Day'){
            format = moment(element.creation_date).format('DD MM YYYY')
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
    
    let resultSort = result.sort((a, b) => a.time - b.time)
    console.log(resultSort)
    return resultSort
}
  
  module.exports = { messagesDataByTimeUnit };
