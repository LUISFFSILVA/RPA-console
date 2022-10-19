const {Builder, Browser, By, Key, until} = require('selenium-webdriver')
const http = require('axios').default
const tunnel = require('tunnel')

const apiLink = "https://au51y7pd62.execute-api.sa-east-1.amazonaws.com"

httpOptions = {
    httpsAgent: tunnel.httpsOverHttp({
        proxy: {
            host: 'proxybrsa.scania.com',
            port: 8080
        }
    }),
    proxy: false
}

Main().catch((error) => console.log(error))

let driver

async function Main() {
    console.log('Started')
    while (true) {
        let nextItem = (await http.get(`${apiLink}/nextItem`, httpOptions).catch((err) => {console.log(`Error getting next item: ${err.status}`)}))?.data
        if (nextItem.length > 0) {
            rpa = nextItem[0]
            console.log(`New Request Received: ${rpa.rpaName}`)
            await changeStatus(rpa, 1)
            await runRPA(rpa.rpaName).then(async () => {
                let executionTime = (new Date().getTime() - rpa.startedTime.getTime())/1000
                await changeStatus(rpa, 2, executionTime)
                console.log(`Completed. Execution Time: ${executionTime} seconds`)
            }).catch(async () => {
                console.log("Failed to Execute.")
                await changeStatus(rpa, -1)
                driver.close()
                driver.quit()
            })
        } else {
            await new Promise(r => setTimeout(r, 10000))
        }
    }
}

async function changeStatus(rpa, status, executionTime = 0) {
    rpa.status = status
    rpa.executionTime = executionTime
    if (rpa.status == 1) {
        rpa.startedTime = new Date()
    }
    await http.post(`${apiLink}/updateRequest`, rpa, httpOptions)
}

async function runRPA(rpaName) {
    driver = await new Builder().forBrowser(Browser.EDGE).build()
    await driver.navigate().to("https://cr.rpa-sandbox.devtest.aws.scania.com/")
    await driver.sleep(3000)
    let currentUrl = await driver.getCurrentUrl()
    if (currentUrl == "https://cr.rpa-sandbox.devtest.aws.scania.com/#/login?next=/index") {
        let userNameInput = await driver.findElement(By.name("username"))
        userNameInput.sendKeys("dev_wagner", Key.TAB, "Generico123@", Key.ENTER)
    }
    await driver.wait(until.elementLocated(By.name("automations")))
    let automationsButton = await driver.findElement(By.name("automations"))
    await automationsButton.click()
    await driver.wait(until.elementLocated(By.className("name")))
    let allRPAs = await driver.findElements(By.className("name"))
    let rpa
    for (let i = 0; i < allRPAs.length; i++) {
        let name = await allRPAs[i].getText()
        if (name == rpaName) {
            rpa = allRPAs[i]
            break
        }
    }
    await rpa.click()
    await driver.wait(until.elementLocated(By.name("run")))
    await driver.sleep(5000)
    let runButton = await driver.findElement(By.name("run"))
    await runButton.click()
 
    await driver.wait(until.elementLocated(By.className("icon fa fa-check-circle icon--animate-none taskbotsuccess-icon")))
    await driver.close()
    await driver.quit()
}

