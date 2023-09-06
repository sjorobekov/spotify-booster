const chromedriverPath = require('chromedriver').path.replace('app.asar', 'app.asar.unpacked')
const { Builder, By } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const Chance = require('chance')
const options = new chrome.Options()

// Instantiate Chance so it can be used
const chance = new Chance()
const signInBtnXpath = By.css('[data-testid="login-button"]')
const usernameXpath = By.id('login-username')
const passwordXpath = By.id('login-password')
const LogInFormSubmitBtnXpath = By.id('login-button')
const playBtnXpath = By.css('[data-testid="play-button"]')
// const actionBarRowSelector = By.css('[data-testid="action-bar-row"]')
const nextBtnXpath = By.css('[data-testid="control-button-skip-forward"]')
const likeBtnXpath = By.css('[data-testid="add-button"]')
const repeatBtnXpath = By.css('[data-testid="control-button-repeat"]')
const menuBtnXpath = By.css('[data-testid="user-widget-link"]')
const logoutBtnXpath = By.css('[data-testid="user-widget-dropdown-logout"]')
const cookieBtnXpath = By.css('#onetrust-close-btn-container button')
const artistNameXpath = By.css('[data-testid="context-item-info-subtitles"]')
const songNameXpath = By.css('[data-testid="context-item-info-title"')
const playbackDurationXpath = By.css('[data-testid="playback-duration"')
const PAUSE_CHANCE = 10
const LIKE_CHANCE = 15

export async function getDriver(proxy) {
  const service = new chrome.ServiceBuilder(chromedriverPath)
  return new Builder()
    .forBrowser('chrome', '116')
    .setChromeService(service)
    .setChromeOptions(
      options.addArguments(
        '--mute-audio',
        `--proxy-server="socks5=${proxy}"`,
        '--headless=new',
        '--lang=en-US'
      )
    )
    .build()
}

export default async function (driver, playlistUrl, { email, password }, settings, mainWindow) {
  const totalSongs = settings.numberOfSongs
  // Replace 'PATH_TO_YOUR_DRIVER' with the actual path to your browser driver executable.
  // Make sure to specify the correct browserName based on the browser you are using (e.g., 'chrome', 'firefox', 'edge', etc.).
  try {
    // Navigate to a URL
    await driver.get(playlistUrl)
    await driver.manage().window().maximize()
    await driver.sleep(5000)

    await closeCookieConsent(driver)

    emitStatus('Logging In...')

    await login(email, password, driver)

    emitStatus('Logged In')

    await driver.sleep(5000)

    let listenedSongs = 0
    console.log('start playing for %s', email)

    await startStream(driver)

    await driver.sleep(5000)
    // await driver.wait(until.elementLocated(actionBarRowSelector), 10000)
    const nextBtn = await driver.findElement(nextBtnXpath)

    await enableRepeat(driver)

    const playingData = await fetchPlayingArtistAndSongName(driver)
    emitStatus(`Playing: ${playingData.artist} - ${playingData.song}`)

    do {
      await driver.sleep(2000)
      const playingData = await fetchPlayingArtistAndSongName(driver)
      emitStatus(`Playing: ${playingData.artist} - ${playingData.song}`)

      const duration = await fetchSongDuration(driver)
      console.log('Duration of the song is %s', duration)

      const listeningDuration = chance.integer({ min: 30, max: duration - 5 }) * 1000

      console.log('Song will be listened for %s', listeningDuration / 1000)

      console.log('Song %s of %s', listenedSongs, totalSongs)

      await driver.sleep(listeningDuration / 2)
      await randomLikeDislike(driver)
      await randomPause(driver)
      await driver.sleep(listeningDuration / 2)
      console.log('next song')
      listenedSongs += 1

      await nextBtn.click()
    } while (totalSongs * settings.numberOfStreams > listenedSongs)
  } catch (error) {
    console.error('An error occurred:', error)
  } finally {
    // Quit the browser
    emitStatus('Quitting')

    try {
      await logout(driver)
    } catch (e) {
      console.error('Unable to Log Out:', e)
    }

    await driver.quit()

    emitStatus('Completed', false)
  }

  function emitStatus(data, running = true) {
    mainWindow.webContents.send('status', JSON.stringify({ email, data, running }))
  }
}

async function fetchPlayingArtistAndSongName(driver) {
  const [artistNameComponent, songNameComponent] = await Promise.all([
    driver.findElement(artistNameXpath),
    driver.findElement(songNameXpath)
  ])

  const [artist, song] = await Promise.all([
    artistNameComponent.getText(),
    songNameComponent.getText()
  ])

  return {
    artist,
    song
  }
}

async function login(email, password, driver) {
  const signInBtn = await driver.findElement(signInBtnXpath)
  await signInBtn.click()
  await driver.sleep(2000)

  const [usernameInput, passwordInput, LogInFormSubmitBtn] = await Promise.all([
    driver.findElement(usernameXpath),
    driver.findElement(passwordXpath),
    driver.findElement(LogInFormSubmitBtnXpath)
  ])

  await usernameInput.sendKeys(email)
  await driver.sleep(1500)
  await passwordInput.sendKeys(password)
  await driver.sleep(2000)
  await LogInFormSubmitBtn.click()
}

async function enableRepeat(driver) {
  const repeatBtn = await driver.findElement(repeatBtnXpath)

  while ((await repeatBtn.getAttribute('aria-checked')) !== 'true') {
    await repeatBtn.click()
  }
}

async function closeCookieConsent(driver) {
  const cookieBtn = await driver.findElement(cookieBtnXpath)
  await cookieBtn.click()
}

export async function logout(driver) {
  const menuBtn = await driver.findElement(menuBtnXpath)
  await menuBtn.click()
  await driver.sleep(1500)
  const logoutBtn = await driver.findElement(logoutBtnXpath)
  await logoutBtn.click()
  await driver.sleep(1500)
}

async function startStream(driver) {
  const playBtn = await driver.findElement(playBtnXpath)
  await driver.executeScript('arguments[0].click();', playBtn)
}

async function randomPause(driver) {
  if (chance.bool({ likelihood: PAUSE_CHANCE })) {
    const playBtn = await driver.findElement(playBtnXpath)
    await driver.executeScript('arguments[0].click();', playBtn)
    const pauseInMilliseconds = chance.integer({ min: 30, max: 90 }) * 1000
    console.log('pausing for %s seconds', pauseInMilliseconds / 1000)
    await driver.sleep(pauseInMilliseconds)
    await driver.executeScript('arguments[0].click();', playBtn)
    console.log('resuming')
  }
}

async function randomLikeDislike(driver) {
  if (chance.bool({ likelihood: LIKE_CHANCE })) {
    const likeBtn = await driver.findElement(likeBtnXpath)
    await driver.executeScript('arguments[0].click();', likeBtn)
    console.log('Clicked Like button')
  }
}

async function fetchSongDuration(driver) {
  const durationElement = await driver.findElement(playbackDurationXpath)
  const durationText = await durationElement.getText()
  const a = durationText.split(':')

  if (a.length === 3) {
    return parseInt(a[0], 10) * 60 * 60 + parseInt(a[1], 10) * 60 + parseInt(a[2], 10)
  }

  return parseInt(a[0], 10) * 60 + parseInt(a[1], 10)
}
