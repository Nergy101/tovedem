
routerAdd("GET", "/hello/:name", (c) => {
    let name = c.pathParam("name")

    return c.json(200, { "test-message": "Hello " + name })
})


routerAdd("POST", "/recaptcha", async (c) => {
    console.log('Checking recaptcha')
    const recaptchaSecret = process.env.RECAPTCHA_SECRET
    const data = $apis.requestInfo(c).data
    const token = data.token

    const response = $http.send({
        url: "https://www.google.com/recaptcha/api/siteverify?secret=" + recaptchaSecret + "&response=" + token,
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        timeout: 120, // in seconds
    })

    const allowedActions = ['login', 'contact', 'sinterklaas']

    if (response.json.success === false) {
        return c.json(400, { "error": "Recaptcha failed 1" })
    }

    if (response.json.score < 0.5) {
        return c.json(400, { "error": "Recaptcha failed 2" })
    }

    if (!allowedActions.includes(response.json.action)) {
        return c.json(400, { "error": "Recaptcha failed 3" })
    }

    // response.json
    return c.json(200, { "result": response.json })
}, $apis.activityLogger($app))

