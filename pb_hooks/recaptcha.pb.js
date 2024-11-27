routerAdd("GET", "/hello", (context) => {
    return context.html(200, "<div>Hello World</div>");
});

routerAdd("POST", "/recaptcha", (context) => {
    const recaptchaSecret = process.env.RECAPTCHA_SECRET;
    const requestInfo = context.requestInfo();
    $app.logger().warn(JSON.stringify(requestInfo));
    const data = requestInfo.body;
    const token = data.token;

    const response = $http.send({
        url:
            "https://www.google.com/recaptcha/api/siteverify?secret=" +
            recaptchaSecret +
            "&response=" +
            token,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        timeout: 120, // in seconds
    });

    const allowedActions = [
        "login",
        "contact",
        "sinterklaas",
        "vriend_worden",
        "lid_worden",
    ];

    if (response.json.success === false) {
        // return context.json(400, { "error": "Recaptcha was not a success" })
        throw new BadRequestError("Recaptcha was not a success"); // 400 ApiError
    }

    if (response.json.score < 0.5) {
        // return context.json(400, { "error": "Recaptcha score too low" })
        throw new ForbiddenError("Recaptcha score too low"); // 403 ApiError
    }

    if (!allowedActions.includes(response.json.action)) {
        // return context.json(400, { "error": "Recaptcha for unknown action" })
        throw new ForbiddenError(
            "Recaptcha for unknown action",
            response.json.action,
        ); // 403 ApiError
    }

    // response.json
    return context.json(200, { result: response.json });
});
