const { Notification, screen, shell } = require('electron')
const { exec } = require('child_process')
const { WINDOWS_APPS, LINUX_APPS } = require('./constants')

let isRemoteDesktopRunning = false

function Notify (_Title, _Body) {
  new Notification({
    title: _Title,
    body: _Body,
    timeoutType: 'never',
    urgency: 'critical'
  }).show()
}

function checkMultipleDisplays () {
  displays = screen.getAllDisplays().length
  if (displays === 1) {
    return false
  }
  return true
}

function multipleDisplaysAction () {
  shell.beep()
  Notify('Critical Alert', 'Cannot initiate with multiple displays attached!')
}

function checkApplications () {
  const isWindows = process.platform === 'win32'
  const isMacOS = process.platform === 'darwin'
  const isLinux = process.platform === 'linux'

  let command

  if (isWindows) {
    WINDOWS_APPS.find((app) => {
      command = 'tasklist /FI "IMAGENAME eq ' + app + '*"'
      exec(command, (error, stdout) => {
        if (error) {
          console.error(error.message)
          return
        }
        // If stdout contains any output, a remote desktop application is running
        isRemoteDesktopRunning = stdout.trim().length > 62
        if (isRemoteDesktopRunning) {
          Notify('REMOTE ACCESS ALERT', 'Close all remote access apps!')
          console.log(app + ' is running.')
          isRemoteDesktopRunning = true
          return isRemoteDesktopRunning
          // Perform actions if a remote desktop application is detected
        } else {
          console.log('No remote desktop application is running.')
          isRemoteDesktopRunning = false
          // Perform actions if no remote desktop application is detected
        }
      })
    })
  } else if (isMacOS) {
    command = 'pgrep ' + a + '; echo $?'
  } else if (isLinux) {
    LINUX_APPS.find((app) => {
      command = 'pgrep ' + app + '; echo $?'
      exec(command, (error, stdout) => {
        if (error) {
          console.error(error.message)
          return
        }

        let isRemoteDesktopRunning = false
        // If stdout contains any output, a remote desktop application is running
        isRemoteDesktopRunning = stdout.trim().length > 1

        if (isRemoteDesktopRunning) {
          Notify('REMOTE ACCESS ALERT', 'Close all remote access apps!')
          console.log('A remote desktop application is running on Linux.')
          isRemoteDesktopRunning = true
          return isRemoteDesktopRunning
          // Perform actions if a remote desktop application is detected
        } else {
          console.log('No remote desktop application is running on Linux.')
          isRemoteDesktopRunning = false
          // Perform actions if no remote desktop application is detected
        }
      })
    })
  }
  return isRemoteDesktopRunning
}

module.exports = {
  Notify,
  checkApplications,
  checkMultipleDisplays,
  multipleDisplaysAction
}
