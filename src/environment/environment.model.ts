// create an Environment interface
export class Environment {
    production!: boolean;
    pocketbase!: {
        baseUrl: string;
    }
}