// create an Environment interface
export class Environment {
    production!: boolean;
    pocketbase!: {
        baseUrl: string;
        adminUrl: string;
    }
    captchaSiteKey!: string;
    version!: string;
    kumaStatusUrl!: string | null;
    umami!: { scriptUrl: string; websiteId: string } | null;
}