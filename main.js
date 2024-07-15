/** 
 * Purpose of logic within this file will setup gui components and display the mini calendar gui window.
 * @author Richard Salas
 */
//const alert = require('electron-alert');
const ProgressBar = require('electron-progressbar');
const electron = require('electron');
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;
const path = require("path");
const url = require("url");
const fs = require("fs");
const shell = electron.shell;
const { webContents } = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const menu = electron.Menu;
const LOGO_DIR = app.getPath('appData') + "/logos";

let progressBar, mainWindow, win, child, exportWin;//ref to windows
const ICON_PATH = './icon/apple-red.png';

/**
 * Creates the main window.
 */
function createWindow() {
    win = new BrowserWindow({ icon: ICON_PATH, width: 650, height: 580, resizable: false, webPreferences: { nodeIntegration: true, enableRemoteModule: true } });
    win.loadURL(url.format({
        pathname: path.join(__dirname, './html/index.html'),
        protocol: 'file',
        slashes: true
    }));
    const template = [];
    menu.setApplicationMenu(menu.buildFromTemplate(template));
    win.on('closed', () => {
        win = null;
        console.log("window was nulled for garbage collection");
    })//end method
    //turning this off...don't need it
    //win.webContents.openDevTools();
    initLogos();
}//end method

app.on('ready', createWindow);
ipcMain.on('show-progressbar', showProgressbar);
ipcMain.on('set-progressbar-completed', setProgressbarCompleted);

/**
 * Shows the progress bar.
 */
function showProgressbar() {
    if (progressBar) {
        return;
    }//end if

    //get the center of the window here.
    const [currentWindowX, currentWindowY] = win.getPosition();
    x = currentWindowX + ((650 - 500) / 2.0);//need to dynamically build window sizes
    y = currentWindowY + ((580 - 170) / 2.0);//need to dynamically build window sizes

    progressBar = new ProgressBar({
        text: 'Exporting to PDF for printing...',
        detail: 'Please wait...',
        indeterminate: false,
        browserWindow: {
            x,
            y,
            modal: true,
            resizable: false,
            closable: false,
            minimizable: false,
            maximizable: false,
            width: 500,
            height: 170,
            webPreferences: { nodeIntegration: true, enableRemoteModule: true }
        }
    });

    progressBar.on('completed', () => {
        console.log('completed...')
        progressBar.detail = 'Task completed. Exiting...';
        progressBar = null;
    }).on('progress', function (value) {
        progressBar.detail = `Parsing file into PDF...`;
    });
    //add concurrent process during the parsing of the pdf file.  (watch what is being done by user to alert him/her)
    win.hide();
}

/**
 * Sets progress bar to completed.
 */
function setProgressbarCompleted() {
    console.log('setProgressbarCompleted');
    if (progressBar) {
        progressBar.setCompleted();
    }//end if

    win.show();
}//end function

app.on('window-all-closed', () => {
    console.log('closing window')
    if (process.platform !== "darwin") {
        app.quit();
    }//end if
});

ipcMain.on('print', (event, calendarHTML) => {
    //create browser window and then send the html to it and then print it...
    exportWin = new BrowserWindow({ opacity: 0, icon: ICON_PATH, modal: true, resizable: false, webPreferences: { nodeIntegration: true, enableRemoteModule: true } });
    exportWin.loadURL(url.format({
        pathname: path.join(__dirname, './html/export.html'),
        protocol: 'file',
        slashes: true
    }));

    //exportWin.webContents.openDevTools();

    exportWin.once('ready-to-show', () => {
        //calendar needs to be 3 columns wide versus 2 columns.
        exportWin.webContents.send('construct-calendars', calendarHTML);
        exportWin.show();
    });

    exportWin.webContents.on('did-frame-finish-load', () => {
        setTimeout(exportToPDF, 3000);
    });

    exportWin.on('closed', () => {
        child = null;
    })//end method
});

/**
 * Exports the Calendar HTML into a PDF.
 */
function exportToPDF() {
    printerOptions = {
        marginsType: 0,
        printBackground: false,
        printSelectionOnly: false,
        landscape: false,
        pageSize: 'Letter',
        scaleFactor: 100
    };

    // //send message to main window
    exportWin.webContents.printToPDF(printerOptions).then(data => {
        console.log("rts000is - printing");
        const pdfPath = path.join(app.getPath("temp"), 'srh-calendars.pdf')
        fs.writeFile(pdfPath, data, (error) => {
            setProgressbarCompleted();
            if (error){
                dialog.showErrorBox("Error exporting to PDF", "Unable to write a pdf file. Try making sure the file is closed and then try again.");
                console.log(`Unable to write file due to error!  File path is: ${pdfPath} and error is ${error}`);
            } else{
                console.log(`Wrote PDF successfully to ${pdfPath}`);
                shell.openExternal(pdfPath);
            }//end if...else

        });
    }).catch(error => {
        console.log(`Failed to write PDF to ${pdfPath}: `, error)
    }).finally(() => {
        console.log('closing window...');
        exportWin.close();
    });
}//end method

ipcMain.on('add-progress', (event) => {
    try{
        let currentValue = progressBar.value;
        if (progressBar && !progressBar.isCompleted() && (currentValue + 10) < 100) {
            progressBar.value += 20;
        }//end if
        console.log('adding progress...');
    }catch(error){
        console.log("error occurred here because: " + error.message);
    }//end try...catch
});

ipcMain.on('open-logos', (event) => {
    //need to grab module to resize and pixelate the pics correctly.
    
    //positioning the window
    let x, y;
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
        const [currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + 10;
        y = currentWindowY + 10;
    }

    child = new BrowserWindow({ icon: ICON_PATH, x, y, width: 650, height: 580, modal: true, parent: win, resizable: false, webPreferences: { nodeIntegration: true, enableRemoteModule: true } });
    child.loadURL(url.format({
        pathname: path.join(__dirname, './html/logos.html'),
        protocol: 'file',
        slashes: true
    }));

    child.on('closed', () => {
        child = null;
    })//end method

});

//IPC - inter process communication
ipcMain.on('export-and-open', (event) => {
    console.log('calling export-and-open');

    printerOptions = {
        marginsType: 0,
        printBackground: false,
        printSelectionOnly: false,
        landscape: false,
        pageSize: 'Letter',
        scaleFactor: 100
    };

    // //send message to main window
    exportWin.webContents.printToPDF(printerOptions).then(data => {
        console.log("trying to print to pdf");
        const pdfPath = path.join(__dirname, 'srh-calendars.pdf')
        console.log(`deleting file ${pdfPath}`);
        // if(fs.existsSync(pdfPath)){
        //     console.log(gutil.colors.green('File exists. Deleting now ...'));
        //     fs.unlinkSync
        // }
        fs.writeFile(pdfPath, data, (error) => {

            if (error) {
                console.log("Error trying to create the PDF file.");
                throw error
            }//end if

            console.log(`Wrote PDF successfully to ${pdfPath}`);
        });
    }).catch(error => {
        console.log(`Failed to write PDF to ${pdfPath}: `, error)
    }).finally(() => {
        console.log('closing window...');
        //exportWin.close();
    });
});

//IPC - inter process communication
ipcMain.on('chosen-logo', (event, logoPath) => {
    //close child window and change path!!!
    child.close();
    //send message to main window
    win.webContents.send('logo', logoPath);
});

/**
 * Initializes the logos for the calendar.
 */
function initLogos(){
    fs.stat(LOGO_DIR, (err, stat)=>{
        if(err&&err.code=='ENOENT'){
            fs.mkdirSync(LOGO_DIR);
        }//end if
        if(fs.readdirSync(LOGO_DIR).length < 24){
            fs.readdir(__dirname + '/logos', (err, files)=>{
                if(err){
                    console.log(err);
                    return;
                }//end if
                files.forEach(file =>{
                    fs.copyFile(__dirname + '/logos/' + file, LOGO_DIR + '/' + path.basename(file), (err) => {
                        if (err) {
                            console.log('error', err);
                        } else {
                            console.log('successfully copied file');
                        }//end if
                    });
                });
            });
        }//end if
    });
}//end function

ipcMain.on('initialize-logopath', (event)=>{
    event.sender.send('set-logo-path', LOGO_DIR);
});

ipcMain.on('open-file-dialog', (event) => {
    dialog.showOpenDialog(child, { title: 'Find a logo', filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }] }).then((user) => {
        if (user.canceled) {
            console.log(user);
        } else {
            //copy the file down here
            fs.copyFile(user.filePaths[0], LOGO_DIR + '/' + path.basename(user.filePaths[0]), (err) => {
                if (err) {
                    console.log('error', err);
                } else {
                    console.log('successfully copied file');
                    event.sender.send('reload-calendar-logos');
                }//end if
            });
        }//end then
    }).catch(err => {
        console.log(err);
    });
});

//for mac
app.on('activate', () => {
    console.log('activate...')
    if (win === null) {
        createWindow();
    }//end if
});
