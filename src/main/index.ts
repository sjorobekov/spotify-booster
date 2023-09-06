import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import runStream, { getDriver, logout } from './runStream'
import fetchPlaylistData from './fetchPlaylistData'
import sendMail, {
  completedMailOptions,
  dailyRevenueMailOptions,
  monthlyRevenueMailOptions
} from './sendMail'
import { PlaylistData } from '../types'
import { WebDriver } from 'selenium-webdriver'
import schedule from 'node-schedule'

const runningDrivers: Map<string, WebDriver> = new Map()
async function handleSendCompletedMail(_e, streams, revenue): Promise<void> {
  await sendMail(completedMailOptions(streams, revenue))
}

async function sendDailyRevenueMail(_e, value): Promise<void> {
  const data = JSON.parse(value)
  await sendMail(dailyRevenueMailOptions(data))
}

async function sendMonthlyRevenueMail(_e, value): Promise<void> {
  const data = JSON.parse(value)
  await sendMail(monthlyRevenueMailOptions(data))
}

function handleRunStream(mainWindow: BrowserWindow) {
  return async (
    _e,
    playlistUrl: string,
    settings: string,
    accountString: string
  ): Promise<void> => {
    const account = JSON.parse(accountString)

    mainWindow.webContents.send(
      'status',
      JSON.stringify({ email: account.email, running: true, data: 'starting...' })
    )

    let driver
    try {
      driver = await getDriver(account.proxy)
    } catch (e) {
      console.error('handleRunStream', e)
      mainWindow.webContents.send(
        'status',
        JSON.stringify({ email: account.email, running: false, data: 'failed' })
      )

      return
    }

    runningDrivers.set(account.email, driver)

    try {
      await runStream(driver, playlistUrl, account, JSON.parse(settings), mainWindow)
    } catch (e) {
      console.error('handleRunStream inner', e)
      await driver.quit()
      runningDrivers.delete(account.email)
      mainWindow.webContents.send(
        'status',
        JSON.stringify({ email: account.email, running: false, data: 'error' })
      )
    }
  }
}

function handleStopStream(mainWindow: BrowserWindow) {
  return async (_e, email: string): Promise<void> => {
    if (runningDrivers.has(email)) {
      const driver = runningDrivers.get(email)
      if (driver) {
        try {
          mainWindow.webContents.send(
            'status',
            JSON.stringify({ email: email, running: true, data: 'logging out...' })
          )
          await logout(driver)
        } catch (e) {
          console.log('Error while logging out:', e)
        } finally {
          await driver.quit()
        }
      }
      runningDrivers.delete(email)
    }
  }
}

function handlePlaylistDataFetch(_e, playlistUrl: string): Promise<PlaylistData> {
  return fetchPlaylistData(playlistUrl)
}

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 588,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    minWidth: 860,
    minHeight: 588,
    maxWidth: 1920,
    maxHeight: 588
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // mainWindow.webContents.openDevTools()

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()

  ipcMain.handle('stream:run', handleRunStream(mainWindow))
  ipcMain.handle('stream:stop', handleStopStream(mainWindow))
  ipcMain.handle('stream:fetchPlaylistData', handlePlaylistDataFetch)
  ipcMain.handle('mail:send', handleSendCompletedMail)
  ipcMain.on('yesterday-revenue', sendDailyRevenueMail)
  ipcMain.on('last-month-revenue', sendMonthlyRevenueMail)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  schedule.scheduleJob('30 0 * * *', () => {
    mainWindow.webContents.send('daily-report')
  })

  schedule.scheduleJob('0 0 1 * *', () => {
    mainWindow.webContents.send('monthly-report')
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  const runningDriversArray = Array.from(runningDrivers.values())

  // Logging out
  await Promise.all(runningDriversArray.map((driver) => logout(driver))).catch((e) => {
    console.error('Error while logging out', e)
  })

  // Closing drivers
  await Promise.all(runningDriversArray.map((driver) => driver.quit())).catch((e) => {
    console.error('Error during quitting', e)
  })

  app.quit()
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
