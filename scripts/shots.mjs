// Captures fresh screenshots of the live projects into public/shots/.
// Usage: npm run shots
import { chromium } from 'playwright'

const targets = [
  ['examace', 'https://exam-ai-tau-bay.vercel.app'],
  ['solar', 'https://3d-solar-galaxy.netlify.app'],
  ['client', 'https://jateenyadav.github.io/client-portfolio/'],
  ['card', 'https://jateenyadav.github.io/digital-card/'],
]

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

for (const [name, url] of targets) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 })
    await page.waitForTimeout(3500) // let intro animations / WebGL settle
    await page.screenshot({ path: `public/shots/${name}.jpg`, type: 'jpeg', quality: 82 })
    console.log('ok  ', name)
  } catch (err) {
    console.log('FAIL', name, String(err).split('\n')[0])
  }
}

await browser.close()
