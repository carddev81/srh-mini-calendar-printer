const { ipcMain } = require('electron');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;
const NUMBER_OF_CALENDARS = 4;

ipcRenderer.on('construct-calendars', (event, calendarHTML)=>{
    let allCalendars = "";

    for(let i = 0; i < NUMBER_OF_CALENDARS; i++){
        allCalendars += '<div id="calendarContainer" class="container-fluid bg-light border border-dark rounded-lg test mb-3">'+calendarHTML+'</div>'
    }//end for

    document.getElementById('exportBody').innerHTML = allCalendars;
});




