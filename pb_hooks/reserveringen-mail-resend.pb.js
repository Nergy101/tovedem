/* Custom API endpoint to resend a reservation confirmation email */
routerAdd("POST", "/reserveringen/resend-mail", (e) => {
    try {
        // Require authentication - only logged-in members/admins may resend
        const requestInfo = e.requestInfo();
        const auth = requestInfo.auth;
        if (!auth) {
            throw new UnauthorizedError("Authentication required");
        }

        const data = requestInfo.body;
        const reserveringId = data.reserveringId;

        if (!reserveringId) {
            throw new BadRequestError("reserveringId is required");
        }

        const mailing = require(`${__hooks}/mailing.js`);

        // Fetch reservering
        const reservering = $app.findRecordById("reserveringen", reserveringId);
        if (!reservering) {
            throw new BadRequestError("Reservering not found: " + reserveringId);
        }

        const voorstellingId = reservering.get("voorstelling");
        if (!voorstellingId) {
            throw new BadRequestError("Reservering has no voorstelling");
        }

        const voorstelling = $app.findRecordById("voorstellingen", voorstellingId);
        if (!voorstelling) {
            throw new BadRequestError("Voorstelling not found: " + voorstellingId);
        }

        const mailInfo = mailing.getMail("reservatie_confirmatie");
        const filledMailTemplate = mailing.getReservatieMailHtml(
            mailInfo,
            reservering,
            voorstelling
        );

        const message = new MailerMessage({
            from: {
                address: $app.settings().meta.senderAddress,
                name: $app.settings().meta.senderName,
            },
            to: [{ address: reservering.get("email") }],
            subject: mailInfo.get("onderwerp"),
            html: filledMailTemplate,
        });

        $app.newMailClient().send(message);

        return e.json(200, { success: true });
    } catch (error) {
        if (
            error instanceof UnauthorizedError ||
            error instanceof BadRequestError ||
            error instanceof ForbiddenError
        ) {
            throw error;
        }
        $app.logger().error("Error in /reserveringen/resend-mail:", error);
        throw new BadRequestError("Failed to resend mail: " + error.message);
    }
});
