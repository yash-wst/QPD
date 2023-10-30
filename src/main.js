const { app, BrowserWindow, clipboard, screen, ipcMain, shell, globalShortcut, dialog } = require('electron')
const path = require('path')
const { registerGlobalShortcuts, unregisterGlobalShortcuts } = require('./keys')
const { checkApplications, checkMultipleDisplays, multipleDisplaysAction } = require('./utility')

let mainWindow

// ########################  MainWindow creation ######################## //
function createWindow () {
  mainWindow = new BrowserWindow({
    // This attribute would ensure that window is always
    // opened in fullscreen. However, this doesn't have
    // control over the state of the window after initialization.
    // fullscreen: true,
    width: screen.width, // Adjust the width as needed
    height: screen.height, // Adjust the height as needed
    title: 'QPD', // Set an empty string to hide the title bar
    // Hide the window frame (title bar and menu bar)
    // frame: true,
    // Hide the menu bar
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load your desired URL
  mainWindow.loadFile(
    'src/index.html'
  )

  // mainWindow.setFullScreen(true);
  // For linux and macos
  // mainWindow.setVisibleOnAllWorkspaces(true);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // if (input.alt || input.meta){
    //   console.log("Special keys used ",input.key);
    //   event.preventDefault();
    // }
    if (input.control && input.key.toLowerCase === 'p') {
      console.log('Print invoked')
      handleprint()
    }
  })

  mainWindow.on('resize', () => {
    mainWindow.show()
    mainWindow.moveTop()
    // mainWindow.setFullScreen(true);
  })

  mainWindow.on('minimize', () => {
    mainWindow.restore()
    mainWindow.moveTop()
  })

  mainWindow.on('show', () => {
    mainWindow.focus()
  })
  // Open DevTools (optional)
  // mainWindow.webContents.openDevTools();
  mainWindow.webContents.session.cookies()
}
// #################################################################################### //

// ########################  Main process ######################## //
app.whenReady().then(() => {
  const checkInterval = setInterval(() => {
    if (checkApplications()) {
      shell.beep()
      mainWindow.destroy()
      app.quit()
    }
    if (checkMultipleDisplays()) {
      multipleDisplaysAction()
    }
  }, 5000) // 5000 ms (5 seconds)

  // Check if multiple displays are attached
  const displaycheck = !checkMultipleDisplays()
  const appcheck = !checkApplications()
  if (displaycheck && appcheck) {
    createWindow()
    registerGlobalShortcuts()
    clipboard.clear()

    ipcMain.on('urlSubmitted', (event, url) => {
      console.log('URL: ', url)
      // Open the URL in the same Electron BrowserWindow
      mainWindow.loadURL(
        url,
        { userAgent: 'UniApps-1.0' })
    })
    globalShortcut.register('CommandOrControl+P', () => {
    // Handler for dev tools
      handleprint()
    })
    // app.on('browser-window-blur', (event, window) => {
    //   event.preventDefault();
    //   window.show();
    //   window.moveTop();
    // });

    // Quit when all windows are closed
    app.on('window-all-closed', () => {
    // On macOS, it's common for apps to stay open until explicitly quit
      if (process.platform !== 'darwin') {
        unregisterGlobalShortcuts()
        clipboard.clear()
        clearInterval(checkInterval)
        createWindow()

        // app.quit() kills the application. Current behavior
        // forbids the application to be quit manually, and the
        // system must be restarted to close the application.

        // app.quit();
      }
    })

    // Activate the app (on macOS)
    app.on('activate', () => {
      // On macOS, re-create a window if none are open when the dock icon is clicked
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  } else {
    multipleDisplaysAction()
  }
})
// #################################################################################### //

// ########################  Function to open a dialog box ######################## //
function openDialog (Type, Title, Msg, Btn) {
  dialog.showMessageBox(mainWindow, {
    type: Type,
    title: Title,
    message: Msg,
    buttons: Btn
  })
}
// #################################################################################### //

// ########################  Handle print function ######################## //
function handleprint () {
  mainWindow.webContents.getPrintersAsync().then((data) => {
    // data will be an array of printer objects
    const printOptions = {
      silent: true, // Set to true to suppress the print dialog
      deviceName: 'Microsoft Print to PDF', // The name of the device (your printer)
      color: false, // Whether to print in color
      marginsType: 0 // 0 for default margins, 1 for no margins
    }
    for (printer in data) {
      if (data[printer].description) {
        console.log(
          openDialog(
            'info',
            'Print QP',
            'QP will be printed using ' + printOptions.deviceName,
            ['Proceed']
          )
        )
        mainWindow.webContents.print(printOptions, (success, errorType) => {
          if (!success) {
            console.error(`Failed to print: ${errorType}`)
          }
        })
      }
    }
  })
}
// #################################################################################### //
