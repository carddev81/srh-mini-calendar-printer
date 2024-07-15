//need to build available logos to user
const fs = require("fs");
const path = require("path");
const electron = require('electron');
const app = electron.app;
const ipcRenderer = electron.ipcRenderer;
const logoBox = document.getElementById('logoBox');
const columns = 5;
var logoPath;
document.getElementById('browseForLogoBtn').addEventListener('click', ()=>{
    console.log('calling open file dialog');
    ipcRenderer.send('open-file-dialog');
});

ipcRenderer.on('reload-calendar-logos', (event)=>{
    refreshLogos(logoPath);
});

ipcRenderer.send('initialize-logopath');
ipcRenderer.on('set-logo-path',(event, logoHome)=>{
    logoPath = logoHome;
    refreshLogos();
});

/**
 * Refreshes the logos on the page
 */
function refreshLogos(){
    logoBox.innerHTML = "";
    fs.readdir(logoPath, (err, files)=>{
        let logBoxHTML = "";
        let count = files.length;
        let rows = Math.ceil(count / columns);
        let index = 0;
        for(let i = 0; i < rows; i++){//build the html here.
            logBoxHTML += '<div class="row p-2">';
            for(let j = 0; j < columns; j++){
                if(count == index){
                    //empty column
                    logBoxHTML += '<div class="col"></div>';
                }else{
                    //image here
                    //alert(files[index]);
                    logBoxHTML += '<div class="col"><img class="p-1 mb-2 bg-white rounded" src="' + logoPath + "/" +files[index] + '" width="60px" height="60px"/></div>';
                    index++;
                }//end
            }//end for
            logBoxHTML += '</div>';
        }//end for
    
        logoBox.innerHTML = logBoxHTML;
    
        elements = document.getElementsByClassName('rounded');
        for(let i = 0; i < elements.length; i++){//add event listeners to this here.
            elements[i].addEventListener('click', (event)=>{
                ipcRenderer.send('chosen-logo', event.srcElement.src);
                console.log('you clicked', event.srcElement.src);
            });//end elements
            elements[i].addEventListener('mouseover', (event)=>{
                console.table(event.srcElement.classList);
                event.srcElement.classList.add('shadow');
            });
            elements[i].addEventListener('mouseout', (event)=>{
                console.table(event.srcElement.class);
                event.srcElement.classList.remove('shadow');
            });
        }//end for
    });
}//end function


