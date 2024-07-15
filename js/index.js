const { ipcMain } = require('electron');
const electron = require('electron');
const ipcRenderer = electron.ipcRenderer;

/**
 * Constructor function used to create an instance of the SRH calendar encapsulated with all of the calendar functionality.
 */
function SRHCalandar(){
    //need to restructure ... trying to use unicode characters here too!
    this.currentYear = new Date().getFullYear();
    this.days = ['S', 'M','T','W','T','F','S'];
    this.months = ['January', 'February','March','April','May','June','July','August','September','October','November','December'];
    this.monthsHTML = "";
    this.day = new Date();
    this.monthElements = [
        document.getElementById('month-col1'), 
        document.getElementById('month-col2'), 
        document.getElementById('month-col3'), 
        document.getElementById('month-col4'),
        document.getElementById('month-col5'),
        document.getElementById('month-col6'),
        document.getElementById('month-col7'),
        document.getElementById('month-col8'),
        document.getElementById('month-col9'),
        document.getElementById('month-col10'),
        document.getElementById('month-col11'),
        document.getElementById('month-col12'),
    ];
    this.logoElements = [
        document.getElementById('logo1'), 
        document.getElementById('logo2'), 
        document.getElementById('logo3'), 
        document.getElementById('logo4'),
        document.getElementById('logo5'),
        document.getElementById('logo6'),
        document.getElementById('logo7'),
        document.getElementById('logo8')
    ];
    this.init = function() {
        this.day.setMonth(0);
        this.day.setDate(1);
        //build logo elements
        this.logoElements.forEach((logo) => this.buildLogos(logo));
        let daysHTML = '<div class="row row-cols-7 days-of-week ">';
        this.days.forEach(test =>{
            daysHTML+='<div class="col p-0">'+test+'</div>';
        });
        daysHTML += '</div>';

        document.getElementById('col1').innerHTML = daysHTML;
        document.getElementById('col2').innerHTML = daysHTML;
        document.getElementById('col3').innerHTML = daysHTML;
        document.getElementById('col4').innerHTML = daysHTML;

        this.updateCurrentYear(this.currentYear);

        this.addEventListeners();

        this.monthElements.forEach((col) => this.buildMonth(col));
    }//end function

    this.addEventListeners = function(){

        //next and previous buttons
        document.getElementById('nextBtn').addEventListener('click', ()=>{
            console.log('next button clicked');
            this.updateCalendar(1);//add one
        });
        //previous button
        document.getElementById('prevBtn').addEventListener('click', ()=>{
            console.log('previous button clicked');
            this.updateCalendar(-1);//minus 1
        });

        //change logo btn ... needs to open logos window first??
        document.getElementById('changeLogo').addEventListener('click', ()=>{
            ipcRenderer.send('open-logos');
        });

        document.getElementById('printBtn').addEventListener('click',(event)=>{
            ipcRenderer.send('print', document.getElementById('srh-calendar').innerHTML);//html content...
            ipcRenderer.send('show-progressbar');

            let progressInterval = setInterval(function(){
                //progress bar should update here...
                ipcRenderer.send('add-progress');
            },50);
            setTimeout(()=>{
                clearInterval(progressInterval);
            }, 3000);
        });

        ipcRenderer.on('logo', (event, logoPath)=>{
            console.log('setting new logo');
            this.logoElements.forEach((logo) => this.buildLogos(logo, logoPath));
        });

    }//end function

    this.print = function(path){
        console.log(path);
    }//end function

    this.updateCurrentYear = function(year){
        document.getElementById('selectedYear').innerHTML = year;
        document.getElementById('year').innerHTML = year;
    }//end function

    this.updateCalendar = function(num){
        this.currentYear = document.getElementById('selectedYear').innerHTML;
        console.log('updating calendar');
        this.currentYear = Number(this.currentYear) + num;
        this.updateCurrentYear(this.currentYear);
        this.day  = new Date(this.currentYear,0,1);
        console.log('updating months', this.currentYear);
        this.monthElements.forEach((col)=>this.buildMonth(col));
    }//end function

    this.buildMonth = function(col){
        //looping through 12 columns for 12 months
        this.monthsHTML = "";
        var month = this.months[this.day.getMonth()];
        for (;;) {
            if(month!=this.months[this.day.getMonth()]){//are we in the same month?
                break;
            }//end if
    
            if(this.day.getDate()==1){
                this.monthsHTML += '<div class="row row-cols-7"><div class="span7 month">' + this.months[this.day.getMonth()].toUpperCase() + '</div></div>';
            }//end method
    
            this.monthsHTML += '<div class="row row-cols-7 days-of-month">';
    
            for(let i = 0; i < this.days.length; i++){
                //check the month here
                if(month!=this.months[this.day.getMonth()]){
                    if((this.days.length - i) > 0){
                        for(let j = 0;j<(this.days.length - i);j++){
                            this.monthsHTML += '<div class="col m-0 p-0"></div>'
                        }//end for
                    }//end if
                    
                    break;
                }//end if
    
                if(i==this.day.getDay()){
                    //console.log(this.day.getDay());
                    this.monthsHTML += '<div class="col m-0 p-0">' + this.day.getDate() + '</div>'
                    this.day.setDate(this.day.getDate() + 1);//increment the day
                }else{
                    this.monthsHTML += '<div class="col m-0 p-0"></div>'
                }//end if
            }//end for
    
            this.monthsHTML += '</div>';
            col.innerHTML = this.monthsHTML;
        }//end for
    }//end function

    this.buildLogos = function(logo, imagePath){
        if(imagePath==undefined){
            logo.innerHTML = '<img src="../logos/DunkinDonuts.png" width="28px" height="28px"/>';
        }else{
            logo.innerHTML = '<img src="' + imagePath + '" width="28px" height="28px"/>';
        }//end if...else
    }//end function

}//end constructor function

new SRHCalandar().init();//start