import { Environment } from "./environment.model";

// create dev instance of Environment
export const environment: Environment = {
    production: false,
    pocketbase: {
        baseUrl: 'https://pocketbase.nergy.space',
    },
    captchaSiteKey: '6LcM_24qAAAAAAg_LFBuE8rfzLqq6jmliSB08Mxe'
};