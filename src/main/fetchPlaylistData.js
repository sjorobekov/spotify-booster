import { until, Builder, By } from 'selenium-webdriver'
import chromedriver from 'chromedriver'
import sendMail, { errorMailOptions } from './sendMail'

const chrome = require('selenium-webdriver/chrome')
// const firefox = require('selenium-webdriver/firefox')
const options = new chrome.Options()
const chromedriverPath = chromedriver.path.replace('app.asar', 'app.asar.unpacked')

const titleSelector = By.css('[data-testid="entityTitle"] h1')
const playlistImageSelector = By.css('[data-testid="playlist-image"] img')
const cookieBtnXpath = By.css('#onetrust-close-btn-container button')
const tracksSelector = By.css('[data-testid="tracklist-row"] > div:nth-child(5) > div')
export default async function (playlistUrl) {
  console.log('fetch playlist data')
  const service = new chrome.ServiceBuilder(chromedriverPath)
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeService(service)
    .setChromeOptions(options.addArguments('--headless=new --mute-audio --lang=en-US'))
    // .setFirefoxOptions(firefoxOptions.headless())
    .build()

  console.log('loading', playlistUrl)

  try {
    // Navigate to a URL
    await driver.get(playlistUrl)
    // await driver.sleep(5000);

    await driver.wait(until.elementLocated(titleSelector), 5000)

    try {
      const cookieBtn = await driver.findElement(cookieBtnXpath)
      await cookieBtn.click()
    } catch (e) {
      console.log('Cookie consent not found')
    }

    const title = await driver.findElement(titleSelector)
    const img = await driver.findElement(playlistImageSelector)
    const numberOfSongs = await driver.findElement(By.xpath("//span[contains(text(),'songs')]"))
    const tracks = await driver.findElements(tracksSelector)
    const durations = await Promise.all(tracks.map((track) => track.getText()))
    const duration = sumDurations(durations)

    return {
      name: await title.getText(),
      image: await img.getAttribute('src'),
      numberOfSongs: parseInt(await numberOfSongs.getText()),
      duration
    }
  } catch (error) {
    console.error('An error occurred:', error)
    await sendMail(errorMailOptions(error))
  } finally {
    await driver.quit()
  }
}

function sumDurations(durations) {
  let hours = 0
  let minutes = 0
  let seconds = 0
  durations.map((time) => {
    const [m, s] = time.split(':')
    minutes += parseInt(m)
    seconds += parseInt(s)
  })
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60)
    seconds = seconds % 60
  }
  if (minutes >= 60) {
    hours = Math.floor(minutes / 60)
    minutes = minutes % 60
  }
  return `${hours}:${minutes}:${seconds}`
}
