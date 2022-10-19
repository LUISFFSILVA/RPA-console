// const {Builder, Browser, By, Key, until} = require('selenium-webdriver')
const http = require('axios').default
const tunnel = require('tunnel')

/**************************************** */
require("chromedriver")
require("msedgedriver")
require('dotenv').config()


let swd = require("selenium-webdriver")
let browser = new swd.Builder()
let tab = browser.forBrowser("MicrosoftEdge").build()
let rpa = ''

/***************************************************** */
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
let rpaRecebido

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

let tabToOpen = tab.get("https://cr.rpa-sandbox.devtest.aws.scania.com/")
tabToOpen.then(function(){
let findTimeOutP = tab.manage().setTimeouts({
    implicit: 10000,
})
return findTimeOutP
})
.then (function(){
let promiseUserName = tab.findElement(swd.By.name("username"))
return promiseUserName
})
.then (function(userNameBox){
let promiseFillUserName = userNameBox.sendKeys("dev_wagner") //(process.env.EMAIL)
return promiseFillUserName
})
.then(function(){
console.log("Username entered successfully")
let promisePasswordBox = tab.findElement(swd.By.name("password"))
return promisePasswordBox
})
.then(function(passwordBox){
let promiseFillPassword = passwordBox.sendKeys("Generico123@")//(process.env.PASS)
return promiseFillPassword 
})
.then(function(){
console.log("Password entered successfully")
let promiseSignBtn = tab.findElement(swd.By.name("submitLogin")
)
return promiseSignBtn
})
.then (function(signInBtn){
let promiseClickSignIn = signInBtn.click()
return promiseClickSignIn
})
.then(function(){
console.log("Successfully signed in Automation Anywhere!")
})

.then (function(){
let promiseIconAutomation = tab.findElement(swd.By.name("automations"))
return promiseIconAutomation
})
.then (function(linkAutomations){
console.log("Open Bots")
let promiseClickAutomations = linkAutomations.click()
return promiseClickAutomations
})

.then (function(){
let promiseBotName = tab.findElement(swd.By.className("name"))
return promiseBotName
})
.then (function(){
 let allRPAs = tab.findElements(swd.By.className("name"))
return allRPAs
})
.then (async function(RPAs){
console.log("RPAs = " + RPAs.length)
   let nameBot =  await RPAs[16].getText()
if (nameBot == "Teste Luis") {
console.log("nameBot:" + nameBot)
let promiseClickAutomations = RPAs[16].click()
return promiseClickAutomations
}else {
console.log("Nao é o bot, name :" + nameBot)}

})



// .then (function(){
// let promiseButtonRun = tab.findElement(swd.By.name("run"))
// return promiseButtonRun
// })
// .then (function(run){
// let promiseClickRun = run.click()
// return promiseClickRun
// })

// .then (function(){
// let promiseFinish = tab.elementLocated(swd.By.className("icon fa fa-check-circle icon--animate-none taskbotsuccess-icon"))
// return promiseFinish
// })
.catch(function(err){
console.log("Error",err,"occurred!")
})



